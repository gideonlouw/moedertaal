const identifierStart = /[\p{L}_]/u;
const identifierPart = /[\p{L}\p{N}_]/u;

const fallbackErrors = {
  line: "Line {line}: {message}",
  unknownLanguage: "Unknown language '{language}'.",
  detectLanguage: "Could not detect the source language.",
  unknownKeyword: "Unknown keyword '{keyword}'.",
  missingValue: "'{keyword}' needs a value.",
  invalidSet: "Use: {keyword} name = value",
  unexpectedElse: "'{keyword}' does not belong here.",
  unexpectedEnd: "'{keyword}' does not belong here.",
  missingEnd: "The '{keyword}' block needs an end.",
  invalidFunction: "Use: {keyword} name(parameter1, parameter2)",
  invalidFor: "Use: {keyword} item {inKeyword} list",
  returnOutsideFunction: "Return can only be used inside a function.",
  unknownVariable: "Unknown variable '{name}'.",
  invalidCharacter: "Unexpected character '{character}'.",
  expected: "Expected {expected}.",
  notCallable: "This value is not a function.",
  wrongArguments: "Function '{name}' expected {expected} arguments but got {actual}.",
  divideByZero: "Cannot divide by zero.",
  invalidOperand: "Operator '{operator}' cannot be used with these values.",
  invalidIndex: "This value cannot be indexed.",
  loopLimit: "The loop safety limit was reached.",
};

function interpolate(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

function localize(pack, key, values = {}) {
  return interpolate(pack?.errors?.[key] ?? fallbackErrors[key] ?? key, values);
}

export class MoedertaalError extends Error {
  constructor(message, lineNumber = null, pack = null) {
    const localized =
      lineNumber === null
        ? message
        : localize(pack, "line", { line: lineNumber, message });
    super(localized);
    this.name = "MoedertaalError";
    this.lineNumber = lineNumber;
  }
}

function fail(pack, key, lineNumber = null, values = {}) {
  throw new MoedertaalError(localize(pack, key, values), lineNumber, pack);
}

function aliases(pack, group, name) {
  return pack[group]?.[name] ?? [];
}

function canonical(pack, group, word) {
  for (const [name, words] of Object.entries(pack[group] ?? {})) {
    if (words.includes(word)) {
      return name;
    }
  }
  return null;
}

function stripComment(line) {
  let quote = null;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (escaped) {
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (quote && character === quote) {
      quote = null;
    } else if (!quote && (character === '"' || character === "'")) {
      quote = character;
    } else if (!quote && character === "#") {
      return line.slice(0, index);
    }
  }
  return line;
}

function prepareLines(source) {
  return source.split(/\r?\n/u).map((raw, index) => ({
    number: index + 1,
    text: stripComment(raw).trim(),
  }));
}

function firstWord(text) {
  return text.match(/^(\S+)/u)?.[1] ?? "";
}

export function detectLanguage(source, packs) {
  for (const line of prepareLines(source)) {
    if (!line.text) continue;
    const word = firstWord(line.text);
    for (const [code, pack] of packs) {
      if (canonical(pack, "keywords", word)) return code;
    }
  }
  throw new MoedertaalError(fallbackErrors.detectLanguage);
}

function tokenize(source, lineNumber, pack) {
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const character = source[index];
    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }

    if (character === '"' || character === "'") {
      const quote = character;
      let value = "";
      index += 1;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === "\\") {
          index += 1;
          const escapes = { n: "\n", r: "\r", t: "\t", "\\": "\\", '"': '"', "'": "'" };
          value += escapes[source[index]] ?? source[index];
        } else {
          value += source[index];
        }
        index += 1;
      }
      if (source[index] !== quote) {
        fail(pack, "expected", lineNumber, { expected: quote });
      }
      index += 1;
      tokens.push({ type: "literal", value });
      continue;
    }

    if (/\d/u.test(character)) {
      const match = source.slice(index).match(/^\d+(?:\.\d+)?/u)[0];
      tokens.push({ type: "literal", value: Number(match) });
      index += match.length;
      continue;
    }

    if (identifierStart.test(character)) {
      let word = character;
      index += 1;
      while (index < source.length && identifierPart.test(source[index])) {
        word += source[index];
        index += 1;
      }
      const valueName = canonical(pack, "values", word);
      const operatorName = canonical(pack, "operators", word);
      if (valueName === "true") tokens.push({ type: "literal", value: true });
      else if (valueName === "false") tokens.push({ type: "literal", value: false });
      else if (valueName === "nothing") tokens.push({ type: "literal", value: null });
      else if (operatorName) tokens.push({ type: "operator", value: operatorName });
      else tokens.push({ type: "identifier", value: word });
      continue;
    }

    const pair = source.slice(index, index + 2);
    if (["==", "!=", "<=", ">="].includes(pair)) {
      tokens.push({ type: "operator", value: pair });
      index += 2;
      continue;
    }
    if ("+-*/%<>".includes(character)) {
      tokens.push({ type: "operator", value: character });
      index += 1;
      continue;
    }
    if ("()[]{},:".includes(character)) {
      tokens.push({ type: character, value: character });
      index += 1;
      continue;
    }
    fail(pack, "invalidCharacter", lineNumber, { character });
  }

  tokens.push({ type: "eof", value: null });
  return tokens;
}

const precedence = {
  or: 1,
  and: 2,
  "==": 3,
  "!=": 3,
  "<": 4,
  "<=": 4,
  ">": 4,
  ">=": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  "%": 6,
};

class ExpressionParser {
  constructor(source, lineNumber, pack) {
    this.tokens = tokenize(source, lineNumber, pack);
    this.position = 0;
    this.lineNumber = lineNumber;
    this.pack = pack;
  }

  current() {
    return this.tokens[this.position];
  }

  take(type, value = null) {
    const token = this.current();
    if (token.type !== type || (value !== null && token.value !== value)) return null;
    this.position += 1;
    return token;
  }

  expect(type, label = type) {
    const token = this.take(type);
    if (!token) fail(this.pack, "expected", this.lineNumber, { expected: label });
    return token;
  }

  parse() {
    const expression = this.binary(0);
    if (this.current().type !== "eof") {
      fail(this.pack, "expected", this.lineNumber, { expected: "the end of the expression" });
    }
    return expression;
  }

  binary(minimum) {
    let left = this.unary();
    while (this.current().type === "operator") {
      const operator = this.current().value;
      const level = precedence[operator];
      if (level === undefined || level < minimum) break;
      this.position += 1;
      const right = this.binary(level + 1);
      left = { type: "binary", operator, left, right };
    }
    return left;
  }

  unary() {
    if (
      this.current().type === "operator" &&
      ["-", "+", "not"].includes(this.current().value)
    ) {
      const operator = this.current().value;
      this.position += 1;
      return { type: "unary", operator, value: this.unary() };
    }
    return this.postfix(this.primary());
  }

  postfix(expression) {
    let result = expression;
    while (true) {
      if (this.take("(")) {
        const args = [];
        if (!this.take(")")) {
          do args.push(this.binary(0));
          while (this.take(","));
          this.expect(")", "')'");
        }
        result = { type: "call", callee: result, args };
      } else if (this.take("[")) {
        const index = this.binary(0);
        this.expect("]", "']'");
        result = { type: "index", target: result, index };
      } else {
        return result;
      }
    }
  }

  primary() {
    const literal = this.take("literal");
    if (literal) return { type: "literal", value: literal.value };

    const identifier = this.take("identifier");
    if (identifier) return { type: "variable", name: identifier.value };

    if (this.take("(")) {
      const value = this.binary(0);
      this.expect(")", "')'");
      return value;
    }

    if (this.take("[")) {
      const items = [];
      if (!this.take("]")) {
        do items.push(this.binary(0));
        while (this.take(","));
        this.expect("]", "']'");
      }
      return { type: "list", items };
    }

    if (this.take("{")) {
      const entries = [];
      if (!this.take("}")) {
        do {
          const keyToken = this.current();
          if (!["literal", "identifier"].includes(keyToken.type)) {
            fail(this.pack, "expected", this.lineNumber, { expected: "a map key" });
          }
          this.position += 1;
          this.expect(":", "':'");
          entries.push([String(keyToken.value), this.binary(0)]);
        } while (this.take(","));
        this.expect("}", "'}'");
      }
      return { type: "map", entries };
    }

    fail(this.pack, "expected", this.lineNumber, { expected: "a value" });
  }
}

function expression(source, lineNumber, pack) {
  return new ExpressionParser(source, lineNumber, pack).parse();
}

function parseStatements(lines, start, pack, stopCommands = []) {
  const statements = [];
  let index = start;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.text) {
      index += 1;
      continue;
    }
    const keyword = firstWord(line.text);
    const command = canonical(pack, "keywords", keyword);
    if (stopCommands.includes(command)) return { statements, index, stop: command };

    const rest = line.text.slice(keyword.length).trim();
    if (command === "print") {
      if (!rest) fail(pack, "missingValue", line.number, { keyword });
      statements.push({ type: "print", value: expression(rest, line.number, pack), line: line.number });
    } else if (command === "set") {
      const match = rest.match(/^([\p{L}_][\p{L}\p{N}_]*)\s*=\s*(.+)$/u);
      if (!match) fail(pack, "invalidSet", line.number, { keyword });
      statements.push({
        type: "set",
        name: match[1],
        value: expression(match[2], line.number, pack),
        line: line.number,
      });
    } else if (command === "if") {
      if (!rest) fail(pack, "missingValue", line.number, { keyword });
      const consequent = parseStatements(lines, index + 1, pack, ["else", "end"]);
      let alternate = [];
      let endIndex = consequent.index;
      if (consequent.stop === "else") {
        const parsedElse = parseStatements(lines, consequent.index + 1, pack, ["end"]);
        alternate = parsedElse.statements;
        endIndex = parsedElse.index;
      }
      if (lines[endIndex] === undefined || canonical(pack, "keywords", firstWord(lines[endIndex].text)) !== "end") {
        fail(pack, "missingEnd", line.number, { keyword });
      }
      statements.push({
        type: "if",
        condition: expression(rest, line.number, pack),
        consequent: consequent.statements,
        alternate,
        line: line.number,
      });
      index = endIndex;
    } else if (command === "repeat") {
      if (!rest) fail(pack, "missingValue", line.number, { keyword });
      const body = parseStatements(lines, index + 1, pack, ["end"]);
      if (body.stop !== "end") fail(pack, "missingEnd", line.number, { keyword });
      statements.push({
        type: "repeat",
        count: expression(rest, line.number, pack),
        body: body.statements,
        line: line.number,
      });
      index = body.index;
    } else if (command === "for") {
      const inWords = aliases(pack, "keywords", "in").map(escapeRegExp).join("|");
      const match = rest.match(new RegExp(`^([\\p{L}_][\\p{L}\\p{N}_]*)\\s+(?:${inWords})\\s+(.+)$`, "u"));
      if (!match) {
        fail(pack, "invalidFor", line.number, {
          keyword,
          inKeyword: aliases(pack, "keywords", "in")[0],
        });
      }
      const body = parseStatements(lines, index + 1, pack, ["end"]);
      if (body.stop !== "end") fail(pack, "missingEnd", line.number, { keyword });
      statements.push({
        type: "for",
        name: match[1],
        iterable: expression(match[2], line.number, pack),
        body: body.statements,
        line: line.number,
      });
      index = body.index;
    } else if (command === "function") {
      const match = rest.match(/^([\p{L}_][\p{L}\p{N}_]*)\s*\(([^)]*)\)\s*$/u);
      if (!match) fail(pack, "invalidFunction", line.number, { keyword });
      const params = match[2].trim()
        ? match[2].split(",").map((item) => item.trim())
        : [];
      if (params.some((name) => !/^[\p{L}_][\p{L}\p{N}_]*$/u.test(name))) {
        fail(pack, "invalidFunction", line.number, { keyword });
      }
      const body = parseStatements(lines, index + 1, pack, ["end"]);
      if (body.stop !== "end") fail(pack, "missingEnd", line.number, { keyword });
      statements.push({ type: "function", name: match[1], params, body: body.statements, line: line.number });
      index = body.index;
    } else if (command === "return") {
      if (!rest) fail(pack, "missingValue", line.number, { keyword });
      statements.push({ type: "return", value: expression(rest, line.number, pack), line: line.number });
    } else if (command === "else") {
      fail(pack, "unexpectedElse", line.number, { keyword });
    } else if (command === "end") {
      fail(pack, "unexpectedEnd", line.number, { keyword });
    } else if (command === "in") {
      fail(pack, "unknownKeyword", line.number, { keyword });
    } else {
      if (!/^[\p{L}_][\p{L}\p{N}_]*\s*\(/u.test(line.text)) {
        fail(pack, "unknownKeyword", line.number, { keyword });
      }
      statements.push({
        type: "expression",
        value: expression(line.text, line.number, pack),
        line: line.number,
      });
    }
    index += 1;
  }
  return { statements, index, stop: null };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

class Environment {
  constructor(parent = null) {
    this.parent = parent;
    this.values = new Map();
  }
  has(name) {
    return this.values.has(name) || Boolean(this.parent?.has(name));
  }
  get(name) {
    if (this.values.has(name)) return this.values.get(name);
    return this.parent?.get(name);
  }
  set(name, value) {
    this.values.set(name, value);
  }
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function evaluate(node, environment, context, line) {
  const { pack } = context;
  if (node.type === "literal") return node.value;
  if (node.type === "variable") {
    if (!environment.has(node.name)) fail(pack, "unknownVariable", line, { name: node.name });
    return environment.get(node.name);
  }
  if (node.type === "list") return node.items.map((item) => evaluate(item, environment, context, line));
  if (node.type === "map") {
    return Object.fromEntries(node.entries.map(([key, value]) => [key, evaluate(value, environment, context, line)]));
  }
  if (node.type === "unary") {
    const value = evaluate(node.value, environment, context, line);
    if (node.operator === "not") return !value;
    if (!isNumber(value)) fail(pack, "invalidOperand", line, { operator: node.operator });
    return node.operator === "-" ? -value : value;
  }
  if (node.type === "binary") {
    const left = evaluate(node.left, environment, context, line);
    if (node.operator === "and") return left && evaluate(node.right, environment, context, line);
    if (node.operator === "or") return left || evaluate(node.right, environment, context, line);
    const right = evaluate(node.right, environment, context, line);
    if (node.operator === "==") return Object.is(left, right);
    if (node.operator === "!=") return !Object.is(left, right);
    if (["<", "<=", ">", ">="].includes(node.operator)) {
      if ((!isNumber(left) || !isNumber(right)) && (typeof left !== "string" || typeof right !== "string")) {
        fail(pack, "invalidOperand", line, { operator: node.operator });
      }
      return { "<": left < right, "<=": left <= right, ">": left > right, ">=": left >= right }[node.operator];
    }
    if (node.operator === "+" && (typeof left === "string" || typeof right === "string")) {
      return display(left, pack) + display(right, pack);
    }
    if (!isNumber(left) || !isNumber(right)) fail(pack, "invalidOperand", line, { operator: node.operator });
    if (["/", "%"].includes(node.operator) && right === 0) fail(pack, "divideByZero", line);
    return { "+": left + right, "-": left - right, "*": left * right, "/": left / right, "%": left % right }[node.operator];
  }
  if (node.type === "index") {
    const target = evaluate(node.target, environment, context, line);
    const index = evaluate(node.index, environment, context, line);
    if (Array.isArray(target) || typeof target === "string" || (target && typeof target === "object")) {
      return target[index];
    }
    fail(pack, "invalidIndex", line);
  }
  if (node.type === "call") {
    const callable = evaluate(node.callee, environment, context, line);
    if (!callable || callable.kind !== "function") fail(pack, "notCallable", line);
    const args = node.args.map((arg) => evaluate(arg, environment, context, line));
    if (args.length !== callable.params.length) {
      fail(pack, "wrongArguments", line, {
        name: callable.name,
        expected: callable.params.length,
        actual: args.length,
      });
    }
    const local = new Environment(callable.closure);
    callable.params.forEach((name, index) => local.set(name, args[index]));
    const result = execute(callable.body, local, { ...context, functionDepth: context.functionDepth + 1 });
    return result.returned ? result.value : null;
  }
  return null;
}

function iterableValues(value) {
  if (Array.isArray(value) || typeof value === "string") return [...value];
  if (value && typeof value === "object") return Object.keys(value);
  return [];
}

function execute(statements, environment, context) {
  for (const statement of statements) {
    context.steps += 1;
    if (context.steps > context.maxSteps) fail(context.pack, "loopLimit", statement.line);

    if (statement.type === "print") {
      context.output.push(display(evaluate(statement.value, environment, context, statement.line), context.pack));
    } else if (statement.type === "set") {
      environment.set(statement.name, evaluate(statement.value, environment, context, statement.line));
    } else if (statement.type === "expression") {
      evaluate(statement.value, environment, context, statement.line);
    } else if (statement.type === "if") {
      const branch = evaluate(statement.condition, environment, context, statement.line)
        ? statement.consequent
        : statement.alternate;
      const result = execute(branch, new Environment(environment), context);
      if (result.returned) return result;
    } else if (statement.type === "repeat") {
      const count = evaluate(statement.count, environment, context, statement.line);
      if (!Number.isInteger(count) || count < 0) {
        fail(context.pack, "invalidOperand", statement.line, { operator: aliases(context.pack, "keywords", "repeat")[0] });
      }
      for (let index = 0; index < count; index += 1) {
        const local = new Environment(environment);
        local.set(aliases(context.pack, "values", "counter")[0] ?? "counter", index + 1);
        const result = execute(statement.body, local, context);
        if (result.returned) return result;
      }
    } else if (statement.type === "for") {
      const values = iterableValues(evaluate(statement.iterable, environment, context, statement.line));
      for (const value of values) {
        const local = new Environment(environment);
        local.set(statement.name, value);
        const result = execute(statement.body, local, context);
        if (result.returned) return result;
      }
    } else if (statement.type === "function") {
      environment.set(statement.name, {
        kind: "function",
        name: statement.name,
        params: statement.params,
        body: statement.body,
        closure: environment,
      });
    } else if (statement.type === "return") {
      if (context.functionDepth === 0) fail(context.pack, "returnOutsideFunction", statement.line);
      return { returned: true, value: evaluate(statement.value, environment, context, statement.line) };
    }
  }
  return { returned: false, value: null };
}

function display(value, pack) {
  if (value === true) return aliases(pack, "values", "true")[0] ?? "true";
  if (value === false) return aliases(pack, "values", "false")[0] ?? "false";
  if (value === null || value === undefined) return aliases(pack, "values", "nothing")[0] ?? "nothing";
  if (Array.isArray(value)) return `[${value.map((item) => display(item, pack)).join(", ")}]`;
  if (typeof value === "object") {
    return `{${Object.entries(value).map(([key, item]) => `${key}: ${display(item, pack)}`).join(", ")}}`;
  }
  return String(value);
}

export function runWithPacks(source, options = {}) {
  const packs = options.packs;
  const language = options.language ?? detectLanguage(source, packs);
  const pack = packs.get(language);
  if (!pack) {
    throw new MoedertaalError(
      interpolate(fallbackErrors.unknownLanguage, { language }),
    );
  }

  const parsed = parseStatements(prepareLines(source), 0, pack);
  const output = [];
  const environment = new Environment();
  const context = {
    pack,
    output,
    steps: 0,
    maxSteps: options.maxSteps ?? 100000,
    functionDepth: 0,
  };
  execute(parsed.statements, environment, context);
  return { language, output, variables: environment.values };
}

export function formatSource(source, pack) {
  const open = new Set(["if", "repeat", "for", "function"]);
  const lines = source.split(/\r?\n/u);
  let depth = 0;
  return lines
    .map((raw) => {
      const text = raw.trim();
      if (!text) return "";
      if (text.startsWith("#")) return `${"  ".repeat(depth)}${text}`;
      const command = canonical(pack, "keywords", firstWord(text));
      if (command === "end" || command === "else") depth = Math.max(0, depth - 1);
      const formatted = `${"  ".repeat(depth)}${text}`;
      if (open.has(command) || command === "else") depth += 1;
      return formatted;
    })
    .join("\n")
    .replace(/\s+$/u, "") + "\n";
}
