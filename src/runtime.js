const identifierStart = /[\p{L}_]/u;
const identifierPart = /[\p{L}\p{N}_]/u;

const fallbackErrors = {
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
  invalidImport: "Use: import \"module\"",
  invalidRecord: "Use: record Name {, one field per line, then }.",
  duplicateField: "Record '{name}' contains the field '{field}' more than once.",
  importUnavailable: "Imports need a module loader.",
  moduleNotFound: "Could not import '{specifier}'.",
  circularImport: "Circular import detected: {chain}.",
  returnOutsideFunction: "Return can only be used inside a function.",
  unknownVariable: "Unknown variable '{name}'.",
  invalidCharacter: "Unexpected character '{character}'.",
  expected: "Expected {expected}.",
  notCallable: "Only functions and records can be called with parentheses.",
  wrongArguments: "'{name}' expects {expected} values, but received {actual}.",
  divideByZero: "A number cannot be divided by zero.",
  invalidOperand: "Operator '{operator}' cannot be used with these values.",
  invalidIndex: "Only text, an array, a map, or a record can use an index.",
  unknownMember: "This value has no member named '{name}'.",
  invalidNumber: "'{value}' cannot be converted to a number.",
  inputUnavailable: "Input is not available in this environment.",
  fileAccessUnavailable: "File access is not available in this environment.",
  unsafePath: "File path '{path}' is outside the sandbox.",
  fileReadFailed: "Could not read '{path}'.",
  fileWriteFailed: "Could not write '{path}'.",
  loopLimit: "The program stopped because it ran for too many steps.",
};

function interpolate(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

function localize(pack, key, values = {}) {
  return interpolate(pack?.errors?.[key] ?? fallbackErrors[key] ?? key, values);
}

function location(filename = "<source>", line = 1, column = 1) {
  return { filename, line, column };
}

export class MoedertaalError extends Error {
  constructor(message, sourceLocation = {}) {
    const normalized = typeof sourceLocation === "number"
      ? location("<source>", sourceLocation, 1)
      : {
          filename: sourceLocation.filename ?? "<source>",
          line: sourceLocation.line ?? 1,
          column: sourceLocation.column ?? 1,
        };
    super(`${normalized.filename}:${normalized.line}:${normalized.column}: ${message}`);
    this.name = "MoedertaalError";
    this.filename = normalized.filename;
    this.lineNumber = normalized.line;
    this.columnNumber = normalized.column;
    this.detail = message;
  }
}

function fail(pack, key, sourceLocation, values = {}) {
  throw new MoedertaalError(localize(pack, key, values), sourceLocation);
}

function aliases(pack, group, name) {
  return pack[group]?.[name] ?? [];
}

function canonical(pack, group, word) {
  for (const [name, words] of Object.entries(pack[group] ?? {})) {
    if (words.includes(word)) return name;
  }
  return null;
}

function stripComment(line) {
  let quote = null;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (escaped) escaped = false;
    else if (character === "\\") escaped = true;
    else if (quote && character === quote) quote = null;
    else if (!quote && (character === '"' || character === "'")) quote = character;
    else if (!quote && character === "#") return line.slice(0, index);
  }
  return line;
}

function prepareLines(source, filename = "<source>") {
  return source.split(/\r?\n/u).map((raw, index) => {
    const content = stripComment(raw);
    const text = content.trim();
    return {
      filename,
      number: index + 1,
      column: text ? content.indexOf(text) + 1 : 1,
      raw,
      text,
    };
  });
}

function firstWord(text) {
  return text.match(/^(\S+)/u)?.[1] ?? "";
}

export function detectLanguage(source, packs) {
  let hasUniversalSyntax = false;
  for (const line of prepareLines(source)) {
    if (!line.text) continue;
    const word = firstWord(line.text);
    const callable = line.text.match(/^([\p{L}_][\p{L}\p{N}_]*)\s*(?:\.|\()/u)?.[1];
    if (
      ["import", "let", "record"].includes(word) ||
      /^(?:print|input|len|length|push|type|toText|toNumber|random|readText|writeText|math\.)\s*\(/u.test(line.text)
    ) {
      hasUniversalSyntax = true;
    }
    for (const [code, pack] of packs) {
      if (
        canonical(pack, "keywords", word) ||
        (callable && canonical(pack, "builtins", callable))
      ) {
        return code;
      }
    }
  }
  if (hasUniversalSyntax && packs.has("en")) return "en";
  throw new MoedertaalError(fallbackErrors.detectLanguage);
}

function tokenize(source, line, pack, filename, baseColumn) {
  const tokens = [];
  let index = 0;
  const add = (type, value, start) => {
    tokens.push({ type, value, location: location(filename, line, baseColumn + start) });
  };

  while (index < source.length) {
    const character = source[index];
    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }

    if (character === '"' || character === "'") {
      const start = index;
      const quote = character;
      let value = "";
      index += 1;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === "\\") {
          index += 1;
          if (index >= source.length) break;
          const escapes = { n: "\n", r: "\r", t: "\t", "\\": "\\", '"': '"', "'": "'" };
          value += escapes[source[index]] ?? source[index];
        } else {
          value += source[index];
        }
        index += 1;
      }
      if (source[index] !== quote) {
        fail(pack, "expected", location(filename, line, baseColumn + index), { expected: quote });
      }
      index += 1;
      add("literal", value, start);
      continue;
    }

    if (/\d/u.test(character)) {
      const start = index;
      const match = source.slice(index).match(/^\d+(?:\.\d+)?/u)[0];
      add("literal", Number(match), start);
      index += match.length;
      continue;
    }

    if (identifierStart.test(character)) {
      const start = index;
      let word = character;
      index += 1;
      while (index < source.length && identifierPart.test(source[index])) {
        word += source[index];
        index += 1;
      }
      const valueName = canonical(pack, "values", word);
      const operatorName = canonical(pack, "operators", word);
      if (valueName === "true") add("literal", true, start);
      else if (valueName === "false") add("literal", false, start);
      else if (valueName === "nothing") add("literal", null, start);
      else if (operatorName) add("operator", operatorName, start);
      else add("identifier", word, start);
      continue;
    }

    const pair = source.slice(index, index + 2);
    if (["==", "!=", "<=", ">="].includes(pair)) {
      add("operator", pair, index);
      index += 2;
      continue;
    }
    if ("+-*/%<>".includes(character)) {
      add("operator", character, index);
      index += 1;
      continue;
    }
    if ("()[]{},:.".includes(character)) {
      add(character, character, index);
      index += 1;
      continue;
    }
    fail(pack, "invalidCharacter", location(filename, line, baseColumn + index), { character });
  }

  tokens.push({
    type: "eof",
    value: null,
    location: location(filename, line, baseColumn + source.length),
  });
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
  constructor(source, sourceLocation, pack) {
    this.tokens = tokenize(
      source,
      sourceLocation.line,
      pack,
      sourceLocation.filename,
      sourceLocation.column,
    );
    this.position = 0;
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
    if (!token) fail(this.pack, "expected", this.current().location, { expected: label });
    return token;
  }

  parse() {
    const result = this.binary(0);
    if (this.current().type !== "eof") {
      fail(this.pack, "expected", this.current().location, {
        expected: "the end of the expression",
      });
    }
    return result;
  }

  binary(minimum) {
    let left = this.unary();
    while (this.current().type === "operator") {
      const token = this.current();
      const level = precedence[token.value];
      if (level === undefined || level < minimum) break;
      this.position += 1;
      left = {
        type: "binary",
        operator: token.value,
        left,
        right: this.binary(level + 1),
        location: token.location,
      };
    }
    return left;
  }

  unary() {
    const token = this.current();
    if (token.type === "operator" && ["-", "+", "not"].includes(token.value)) {
      this.position += 1;
      return {
        type: "unary",
        operator: token.value,
        value: this.unary(),
        location: token.location,
      };
    }
    return this.postfix(this.primary());
  }

  postfix(expression) {
    let result = expression;
    while (true) {
      const call = this.take("(");
      if (call) {
        const args = [];
        if (!this.take(")")) {
          do args.push(this.binary(0));
          while (this.take(","));
          this.expect(")", "')'");
        }
        result = { type: "call", callee: result, args, location: call.location };
        continue;
      }

      const bracket = this.take("[");
      if (bracket) {
        const index = this.binary(0);
        this.expect("]", "']'");
        result = { type: "index", target: result, index, location: bracket.location };
        continue;
      }

      const dot = this.take(".");
      if (dot) {
        const member = this.expect("identifier", "a member name");
        result = {
          type: "member",
          target: result,
          name: member.value,
          location: dot.location,
        };
        continue;
      }
      return result;
    }
  }

  primary() {
    const literal = this.take("literal");
    if (literal) return { type: "literal", value: literal.value, location: literal.location };

    const identifier = this.take("identifier");
    if (identifier) {
      return { type: "variable", name: identifier.value, location: identifier.location };
    }

    if (this.take("(")) {
      const value = this.binary(0);
      this.expect(")", "')'");
      return value;
    }

    const list = this.take("[");
    if (list) {
      const items = [];
      if (!this.take("]")) {
        do items.push(this.binary(0));
        while (this.take(","));
        this.expect("]", "']'");
      }
      return { type: "list", items, location: list.location };
    }

    const map = this.take("{");
    if (map) {
      const entries = [];
      if (!this.take("}")) {
        do {
          const key = this.current();
          if (!["literal", "identifier"].includes(key.type)) {
            fail(this.pack, "expected", key.location, { expected: "a map key" });
          }
          this.position += 1;
          this.expect(":", "':'");
          entries.push([String(key.value), this.binary(0)]);
        } while (this.take(","));
        this.expect("}", "'}'");
      }
      return { type: "map", entries, location: map.location };
    }

    fail(this.pack, "expected", this.current().location, { expected: "a value" });
  }
}

function expression(source, sourceLocation, pack) {
  return new ExpressionParser(source, sourceLocation, pack).parse();
}

function expressionLocation(line, offset) {
  return location(line.filename, line.number, line.column + offset);
}

function commandFor(pack, word) {
  if (word === "import" || word === "record" || word === "let") return word;
  return canonical(pack, "keywords", word);
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
    if (stopCommands.includes(line.text)) {
      return { statements, index, stop: line.text };
    }

    const keyword = firstWord(line.text);
    const command = commandFor(pack, keyword);
    if (stopCommands.includes(command)) return { statements, index, stop: command };
    const rest = line.text.slice(keyword.length).trim();
    const statementLocation = location(line.filename, line.number, line.column);
    const restOffset = line.text.indexOf(rest);
    const restLocation = expressionLocation(line, Math.max(restOffset, keyword.length));

    if (command === "import") {
      const match = rest.match(/^(["'])(.+)\1$/u);
      if (!match) fail(pack, "invalidImport", restLocation);
      statements.push({ type: "import", specifier: match[2], location: statementLocation });
    } else if (command === "record") {
      const match = rest.match(/^([\p{L}_][\p{L}\p{N}_]*)\s*\{$/u);
      if (!match) fail(pack, "invalidRecord", restLocation);
      const fields = [];
      index += 1;
      while (index < lines.length && lines[index].text !== "}") {
        const fieldLine = lines[index];
        if (fieldLine.text) {
          if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(fieldLine.text)) {
            fail(pack, "invalidRecord", location(
              fieldLine.filename,
              fieldLine.number,
              fieldLine.column,
            ));
          }
          if (fields.includes(fieldLine.text)) {
            fail(pack, "duplicateField", location(
              fieldLine.filename,
              fieldLine.number,
              fieldLine.column,
            ), { name: match[1], field: fieldLine.text });
          }
          fields.push(fieldLine.text);
        }
        index += 1;
      }
      if (index >= lines.length) fail(pack, "invalidRecord", statementLocation);
      statements.push({
        type: "record",
        name: match[1],
        fields,
        location: statementLocation,
      });
    } else if (command === "print") {
      if (!rest) fail(pack, "missingValue", statementLocation, { keyword });
      statements.push({
        type: "print",
        value: expression(rest, restLocation, pack),
        location: statementLocation,
      });
    } else if (command === "set" || command === "let") {
      const match = rest.match(/^([\p{L}_][\p{L}\p{N}_]*)\s*=\s*(.+)$/u);
      if (!match) fail(pack, "invalidSet", restLocation, { keyword });
      const valueOffset = line.text.indexOf(match[2]);
      statements.push({
        type: "set",
        name: match[1],
        value: expression(match[2], expressionLocation(line, valueOffset), pack),
        location: statementLocation,
      });
    } else if (command === "if") {
      if (!rest) fail(pack, "missingValue", statementLocation, { keyword });
      const consequent = parseStatements(lines, index + 1, pack, ["else", "end"]);
      let alternate = [];
      let endIndex = consequent.index;
      if (consequent.stop === "else") {
        const parsedElse = parseStatements(lines, consequent.index + 1, pack, ["end"]);
        alternate = parsedElse.statements;
        endIndex = parsedElse.index;
      }
      if (
        lines[endIndex] === undefined ||
        canonical(pack, "keywords", firstWord(lines[endIndex].text)) !== "end"
      ) {
        fail(pack, "missingEnd", statementLocation, { keyword });
      }
      statements.push({
        type: "if",
        condition: expression(rest, restLocation, pack),
        consequent: consequent.statements,
        alternate,
        location: statementLocation,
      });
      index = endIndex;
    } else if (command === "repeat") {
      if (!rest) fail(pack, "missingValue", statementLocation, { keyword });
      const body = parseStatements(lines, index + 1, pack, ["end"]);
      if (body.stop !== "end") fail(pack, "missingEnd", statementLocation, { keyword });
      statements.push({
        type: "repeat",
        count: expression(rest, restLocation, pack),
        body: body.statements,
        location: statementLocation,
      });
      index = body.index;
    } else if (command === "for") {
      const inWords = aliases(pack, "keywords", "in").map(escapeRegExp).join("|");
      const match = rest.match(new RegExp(
        `^([\\p{L}_][\\p{L}\\p{N}_]*)\\s+(?:${inWords})\\s+(.+)$`,
        "u",
      ));
      if (!match) {
        fail(pack, "invalidFor", restLocation, {
          keyword,
          inKeyword: aliases(pack, "keywords", "in")[0],
        });
      }
      const body = parseStatements(lines, index + 1, pack, ["end"]);
      if (body.stop !== "end") fail(pack, "missingEnd", statementLocation, { keyword });
      statements.push({
        type: "for",
        name: match[1],
        iterable: expression(
          match[2],
          expressionLocation(line, line.text.indexOf(match[2])),
          pack,
        ),
        body: body.statements,
        location: statementLocation,
      });
      index = body.index;
    } else if (command === "function") {
      const match = rest.match(/^([\p{L}_][\p{L}\p{N}_]*)\s*\(([^)]*)\)\s*$/u);
      if (!match) fail(pack, "invalidFunction", restLocation, { keyword });
      const params = match[2].trim()
        ? match[2].split(",").map((item) => item.trim())
        : [];
      if (params.some((name) => !/^[\p{L}_][\p{L}\p{N}_]*$/u.test(name))) {
        fail(pack, "invalidFunction", restLocation, { keyword });
      }
      const body = parseStatements(lines, index + 1, pack, ["end"]);
      if (body.stop !== "end") fail(pack, "missingEnd", statementLocation, { keyword });
      statements.push({
        type: "function",
        name: match[1],
        params,
        body: body.statements,
        location: statementLocation,
      });
      index = body.index;
    } else if (command === "return") {
      if (!rest) fail(pack, "missingValue", statementLocation, { keyword });
      statements.push({
        type: "return",
        value: expression(rest, restLocation, pack),
        location: statementLocation,
      });
    } else if (command === "else") {
      fail(pack, "unexpectedElse", statementLocation, { keyword });
    } else if (command === "end" || line.text === "}") {
      fail(pack, "unexpectedEnd", statementLocation, { keyword });
    } else if (command === "in") {
      fail(pack, "unknownKeyword", statementLocation, { keyword });
    } else {
      if (!/^[\p{L}_][\p{L}\p{N}_]*(?:\.|\s*\()/u.test(line.text)) {
        fail(pack, "unknownKeyword", statementLocation, { keyword });
      }
      statements.push({
        type: "expression",
        value: expression(line.text, statementLocation, pack),
        location: statementLocation,
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

function display(value, pack) {
  if (value === true) return aliases(pack, "values", "true")[0] ?? "true";
  if (value === false) return aliases(pack, "values", "false")[0] ?? "false";
  if (value === null || value === undefined) {
    return aliases(pack, "values", "nothing")[0] ?? "nothing";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => display(item, pack)).join(", ")}]`;
  }
  if (value?.kind === "record-instance") {
    return `${value.recordName} {${Object.entries(value.fields)
      .map(([key, item]) => `${key}: ${display(item, pack)}`)
      .join(", ")}}`;
  }
  if (value && typeof value === "object" && !value.kind) {
    return `{${Object.entries(value)
      .map(([key, item]) => `${key}: ${display(item, pack)}`)
      .join(", ")}}`;
  }
  return String(value);
}

function valueType(value) {
  if (value === null || value === undefined) return "nothing";
  if (Array.isArray(value)) return "array";
  if (value?.kind === "record-instance") return value.recordName;
  if (value?.kind === "function" || value?.kind === "native") return "function";
  if (value?.kind === "record") return "record";
  if (typeof value === "object") return "map";
  if (typeof value === "string") return "text";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return typeof value;
}

function native(name, minimum, maximum, invoke) {
  return { kind: "native", name, minimum, maximum, invoke };
}

function emit(context, text) {
  context.output.push(text);
  context.onOutput?.(text);
}

function createBuiltins(context) {
  const exact = (name, count, invoke) => native(name, count, count, invoke);
  const builtins = new Map();
  const register = (canonicalName, value, fallbackAliases = []) => {
    const names = new Set([
      canonicalName,
      ...fallbackAliases,
      ...aliases(context.pack, "builtins", canonicalName),
    ]);
    for (const name of names) builtins.set(name, value);
  };
  const print = native("print", 0, Infinity, (args) => {
    emit(context, args.map((value) => display(value, context.pack)).join(" "));
    return null;
  });
  register("print", print);
  const input = native("input", 0, 1, (args, callLocation) => {
    if (!context.input) fail(context.pack, "inputUnavailable", callLocation);
    return context.input(args.length ? display(args[0], context.pack) : "");
  });
  register("input", input);
  const length = exact("len", 1, ([value], callLocation) => {
    if (Array.isArray(value) || typeof value === "string") return value.length;
    if (value?.kind === "record-instance") return Object.keys(value.fields).length;
    if (value && typeof value === "object" && !value.kind) return Object.keys(value).length;
    fail(context.pack, "invalidOperand", callLocation, { operator: "len" });
  });
  register("len", length, ["length"]);
  const push = exact("push", 2, ([array, value], callLocation) => {
    if (!Array.isArray(array)) {
      fail(context.pack, "invalidOperand", callLocation, { operator: "push" });
    }
    array.push(value);
    return array.length;
  });
  register("push", push);
  register("type", exact("type", 1, ([value]) => valueType(value)));
  register("toText", exact("toText", 1, ([value]) => display(value, context.pack)));
  register("toNumber", exact("toNumber", 1, ([value], callLocation) => {
    if (typeof value === "number") return value;
    const converted = typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : Number.NaN;
    if (!Number.isFinite(converted)) {
      fail(context.pack, "invalidNumber", callLocation, { value: display(value, context.pack) });
    }
    return converted;
  }));
  register("random", exact("random", 0, () => context.random()));
  const floor = exact("math.floor", 1, ([value], callLocation) => {
      if (!isNumber(value)) fail(context.pack, "invalidOperand", callLocation, { operator: "floor" });
      return Math.floor(value);
    });
  const round = exact("math.round", 1, ([value], callLocation) => {
      if (!isNumber(value)) fail(context.pack, "invalidOperand", callLocation, { operator: "round" });
      return Math.round(value);
    });
  const math = {};
  for (const name of new Set(["floor", ...aliases(context.pack, "builtins", "floor")])) {
    math[name] = floor;
  }
  for (const name of new Set(["round", ...aliases(context.pack, "builtins", "round")])) {
    math[name] = round;
  }
  register("math", math);
  register("readText", exact("readText", 1, ([filePath], callLocation) => {
    if (!context.files) fail(context.pack, "fileAccessUnavailable", callLocation);
    try {
      return context.files.readText(String(filePath));
    } catch (error) {
      fail(context.pack, error.code === "UNSAFE_PATH" ? "unsafePath" : "fileReadFailed", callLocation, {
        path: filePath,
      });
    }
  }));
  register("writeText", exact("writeText", 2, ([filePath, text], callLocation) => {
    if (!context.files) fail(context.pack, "fileAccessUnavailable", callLocation);
    try {
      context.files.writeText(String(filePath), display(text, context.pack));
      return null;
    } catch (error) {
      fail(context.pack, error.code === "UNSAFE_PATH" ? "unsafePath" : "fileWriteFailed", callLocation, {
        path: filePath,
      });
    }
  }));
  return builtins;
}

function getMember(target, name, pack, sourceLocation) {
  if (target?.kind === "record-instance") {
    if (Object.hasOwn(target.fields, name)) return target.fields[name];
    fail(pack, "unknownMember", sourceLocation, { name });
  }
  if (target && typeof target === "object" && !Array.isArray(target)) {
    if (Object.hasOwn(target, name)) return target[name];
    fail(pack, "unknownMember", sourceLocation, { name });
  }
  fail(pack, "unknownMember", sourceLocation, { name });
}

function evaluate(node, environment, context) {
  const { pack } = context;
  if (node.type === "literal") return node.value;
  if (node.type === "variable") {
    if (!environment.has(node.name)) {
      fail(pack, "unknownVariable", node.location, { name: node.name });
    }
    return environment.get(node.name);
  }
  if (node.type === "list") {
    return node.items.map((item) => evaluate(item, environment, context));
  }
  if (node.type === "map") {
    return Object.fromEntries(
      node.entries.map(([key, value]) => [key, evaluate(value, environment, context)]),
    );
  }
  if (node.type === "member") {
    return getMember(evaluate(node.target, environment, context), node.name, pack, node.location);
  }
  if (node.type === "unary") {
    const value = evaluate(node.value, environment, context);
    if (node.operator === "not") return !value;
    if (!isNumber(value)) {
      fail(pack, "invalidOperand", node.location, { operator: node.operator });
    }
    return node.operator === "-" ? -value : value;
  }
  if (node.type === "binary") {
    const left = evaluate(node.left, environment, context);
    if (node.operator === "and") return left && evaluate(node.right, environment, context);
    if (node.operator === "or") return left || evaluate(node.right, environment, context);
    const right = evaluate(node.right, environment, context);
    if (node.operator === "==") return Object.is(left, right);
    if (node.operator === "!=") return !Object.is(left, right);
    if (["<", "<=", ">", ">="].includes(node.operator)) {
      if (
        (!isNumber(left) || !isNumber(right)) &&
        (typeof left !== "string" || typeof right !== "string")
      ) {
        fail(pack, "invalidOperand", node.location, { operator: node.operator });
      }
      return {
        "<": left < right,
        "<=": left <= right,
        ">": left > right,
        ">=": left >= right,
      }[node.operator];
    }
    if (node.operator === "+" && (typeof left === "string" || typeof right === "string")) {
      return display(left, pack) + display(right, pack);
    }
    if (!isNumber(left) || !isNumber(right)) {
      fail(pack, "invalidOperand", node.location, { operator: node.operator });
    }
    if (["/", "%"].includes(node.operator) && right === 0) {
      fail(pack, "divideByZero", node.location);
    }
    return {
      "+": left + right,
      "-": left - right,
      "*": left * right,
      "/": left / right,
      "%": left % right,
    }[node.operator];
  }
  if (node.type === "index") {
    const target = evaluate(node.target, environment, context);
    const index = evaluate(node.index, environment, context);
    if (target?.kind === "record-instance") return target.fields[index];
    if (
      Array.isArray(target) ||
      typeof target === "string" ||
      (target && typeof target === "object" && !target.kind)
    ) {
      return target[index];
    }
    fail(pack, "invalidIndex", node.location);
  }
  if (node.type === "call") {
    const callable = evaluate(node.callee, environment, context);
    const args = node.args.map((arg) => evaluate(arg, environment, context));
    if (callable?.kind === "native") {
      if (args.length < callable.minimum || args.length > callable.maximum) {
        const expected = callable.minimum === callable.maximum
          ? callable.minimum
          : `${callable.minimum}-${callable.maximum}`;
        fail(pack, "wrongArguments", node.location, {
          name: callable.name,
          expected,
          actual: args.length,
        });
      }
      return callable.invoke(args, node.location);
    }
    if (callable?.kind === "record") {
      if (args.length !== callable.fields.length) {
        fail(pack, "wrongArguments", node.location, {
          name: callable.name,
          expected: callable.fields.length,
          actual: args.length,
        });
      }
      return {
        kind: "record-instance",
        recordName: callable.name,
        fields: Object.fromEntries(
          callable.fields.map((field, index) => [field, args[index]]),
        ),
      };
    }
    if (!callable || callable.kind !== "function") fail(pack, "notCallable", node.location);
    if (args.length !== callable.params.length) {
      fail(pack, "wrongArguments", node.location, {
        name: callable.name,
        expected: callable.params.length,
        actual: args.length,
      });
    }
    const local = new Environment(callable.closure);
    callable.params.forEach((name, index) => local.set(name, args[index]));
    const result = execute(callable.body, local, {
      ...context,
      pack: callable.pack,
      currentModule: callable.moduleId,
      functionDepth: context.functionDepth + 1,
    });
    return result.returned ? result.value : null;
  }
  return null;
}

function iterableValues(value) {
  if (Array.isArray(value) || typeof value === "string") return [...value];
  if (value?.kind === "record-instance") return Object.keys(value.fields);
  if (value && typeof value === "object" && !value.kind) return Object.keys(value);
  return [];
}

function moduleExports(environment, moduleId) {
  return new Map(
    [...environment.values].filter(([, value]) =>
      ["function", "record"].includes(value?.kind) && value.moduleId === moduleId),
  );
}

function loadModule(statement, context) {
  if (!context.moduleLoader) {
    fail(context.pack, "importUnavailable", statement.location);
  }
  let loaded;
  try {
    loaded = context.moduleLoader(statement.specifier, context.currentModule);
  } catch {
    fail(context.pack, "moduleNotFound", statement.location, {
      specifier: statement.specifier,
    });
  }
  if (!loaded || typeof loaded.source !== "string") {
    fail(context.pack, "moduleNotFound", statement.location, {
      specifier: statement.specifier,
    });
  }

  const moduleId = loaded.id ?? statement.specifier;
  const cached = context.modules.cache.get(moduleId);
  if (cached) return cached;
  const cycleStart = context.modules.loading.indexOf(moduleId);
  if (cycleStart !== -1) {
    const chain = [...context.modules.loading.slice(cycleStart), moduleId].join(" -> ");
    fail(context.pack, "circularImport", statement.location, { chain });
  }

  context.modules.loading.push(moduleId);
  try {
    const language = loaded.language ?? detectLanguage(loaded.source, context.packs);
    const pack = context.packs.get(language);
    if (!pack) {
      throw new MoedertaalError(
        interpolate(fallbackErrors.unknownLanguage, { language }),
        location(moduleId, 1, 1),
      );
    }
    const parsed = parseStatements(prepareLines(loaded.source, moduleId), 0, pack);
    const moduleEnvironment = createGlobalEnvironment({ ...context, pack });
    execute(parsed.statements, moduleEnvironment, {
      ...context,
      pack,
      currentModule: moduleId,
      functionDepth: 0,
    });
    const exports = moduleExports(moduleEnvironment, moduleId);
    context.modules.cache.set(moduleId, exports);
    return exports;
  } finally {
    context.modules.loading.pop();
  }
}

function execute(statements, environment, context) {
  for (const statement of statements) {
    context.steps += 1;
    if (context.steps > context.maxSteps) {
      fail(context.pack, "loopLimit", statement.location);
    }

    if (statement.type === "import") {
      for (const [name, value] of loadModule(statement, context)) {
        environment.set(name, value);
      }
    } else if (statement.type === "print") {
      emit(context, display(evaluate(statement.value, environment, context), context.pack));
    } else if (statement.type === "set") {
      environment.set(statement.name, evaluate(statement.value, environment, context));
    } else if (statement.type === "expression") {
      evaluate(statement.value, environment, context);
    } else if (statement.type === "if") {
      const branch = evaluate(statement.condition, environment, context)
        ? statement.consequent
        : statement.alternate;
      const result = execute(branch, new Environment(environment), context);
      if (result.returned) return result;
    } else if (statement.type === "repeat") {
      const count = evaluate(statement.count, environment, context);
      if (!Number.isInteger(count) || count < 0) {
        fail(context.pack, "invalidOperand", statement.location, {
          operator: aliases(context.pack, "keywords", "repeat")[0],
        });
      }
      for (let index = 0; index < count; index += 1) {
        const local = new Environment(environment);
        local.set(aliases(context.pack, "values", "counter")[0] ?? "counter", index + 1);
        const result = execute(statement.body, local, context);
        if (result.returned) return result;
      }
    } else if (statement.type === "for") {
      const values = iterableValues(evaluate(statement.iterable, environment, context));
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
        pack: context.pack,
        moduleId: context.currentModule,
      });
    } else if (statement.type === "record") {
      environment.set(statement.name, {
        kind: "record",
        name: statement.name,
        fields: statement.fields,
        moduleId: context.currentModule,
      });
    } else if (statement.type === "return") {
      if (context.functionDepth === 0) {
        fail(context.pack, "returnOutsideFunction", statement.location);
      }
      return {
        returned: true,
        value: evaluate(statement.value, environment, context),
      };
    }
  }
  return { returned: false, value: null };
}

function createGlobalEnvironment(context) {
  const environment = new Environment();
  for (const [name, value] of createBuiltins(context)) environment.set(name, value);
  return environment;
}

function parseProgram(source, pack, filename) {
  return parseStatements(prepareLines(source, filename), 0, pack).statements;
}

export function checkWithPacks(source, options = {}) {
  const packs = options.packs;
  const filename = options.filename ?? options.moduleId ?? "<source>";
  const language = options.language ?? detectLanguage(source, packs);
  const pack = packs.get(language);
  if (!pack) {
    throw new MoedertaalError(
      interpolate(fallbackErrors.unknownLanguage, { language }),
      location(filename, 1, 1),
    );
  }
  parseProgram(source, pack, filename);
  return { language };
}

export function runWithPacks(source, options = {}) {
  const packs = options.packs;
  const filename = options.filename ?? options.moduleId ?? "<source>";
  const language = options.language ?? detectLanguage(source, packs);
  const pack = packs.get(language);
  if (!pack) {
    throw new MoedertaalError(
      interpolate(fallbackErrors.unknownLanguage, { language }),
      location(filename, 1, 1),
    );
  }

  const statements = parseProgram(source, pack, filename);
  const output = [];
  const context = {
    pack,
    packs,
    output,
    steps: 0,
    maxSteps: options.maxSteps ?? 100000,
    functionDepth: 0,
    moduleLoader: options.moduleLoader,
    currentModule: options.moduleId ?? filename,
    input: options.input,
    files: options.files,
    random: options.random ?? Math.random,
    onOutput: options.onOutput,
    modules: options.modules ?? {
      cache: new Map(),
      loading: [options.moduleId ?? filename],
    },
  };
  const environment = createGlobalEnvironment(context);
  try {
    execute(statements, environment, context);
  } finally {
    if (context.modules.loading.at(-1) === context.currentModule) {
      context.modules.loading.pop();
    }
  }
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
      const word = firstWord(text);
      const command = commandFor(pack, word);
      const closesRecord = text === "}";
      if (command === "end" || command === "else" || closesRecord) {
        depth = Math.max(0, depth - 1);
      }
      const formatted = `${"  ".repeat(depth)}${text}`;
      if (open.has(command) || command === "else" || command === "record") depth += 1;
      return formatted;
    })
    .join("\n")
    .replace(/\s+$/u, "") + "\n";
}
