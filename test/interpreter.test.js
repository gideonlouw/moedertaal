import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  check,
  createSandboxFiles,
  formatSource,
  loadLanguagePacks,
  MoedertaalError,
  run,
  runFile,
} from "../src/interpreter.js";

function moduleProject(files) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "moedertaal-modules-"));
  for (const [fileName, source] of Object.entries(files)) {
    const filePath = path.join(directory, fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, source, "utf8");
  }
  return directory;
}

test("runs the original programs in Afrikaans, English, and Chinese", () => {
  assert.deepEqual(run('stel naam = "Wêreld"\nsê "Hallo " + naam + "!"').output, [
    "Hallo Wêreld!",
  ]);
  assert.deepEqual(run('set name = "World"\nsay "Hello " + name + "!"').output, [
    "Hello World!",
  ]);
  assert.deepEqual(run('设置 名字 = "世界"\n说 "你好，" + 名字 + "！"').output, [
    "你好，世界！",
  ]);
});

test("loads and runs every supported language", () => {
  const programs = {
    af: 'sê "Hallo"',
    en: 'say "Hello"',
    es: 'di "Hola"',
    ru: 'скажи "Привет"',
    st: 'bua "Dumela"',
    xh: 'bhala "Molo"',
    zh: '说 "你好"',
    zu: 'bhala "Sawubona"',
  };
  const packs = loadLanguagePacks();

  assert.deepEqual([...packs.keys()].sort(), Object.keys(programs));
  for (const [language, source] of Object.entries(programs)) {
    assert.equal(run(source, { language }).output.length, 1);
  }
});

test("supports localized booleans, arithmetic, and logic", () => {
  const result = run(`
    stel antwoord = (10 + 2) * 3 == 36 en nie onwaar
    sê antwoord
    sê 17 % 5
  `);

  assert.deepEqual(result.output, ["waar", "2"]);
});

test("runs if and else decisions", () => {
  const result = run(`
    set age = 17
    if age >= 18
      say "Adult"
    else
      say "Not yet"
    end
  `);

  assert.deepEqual(result.output, ["Not yet"]);
});

test("supports repeat and for loops", () => {
  const result = run(`
    herhaal 3
      sê teller
    einde
    vir kleur in ["rooi", "groen"]
      sê kleur
    einde
  `);

  assert.deepEqual(result.output, ["1", "2", "3", "rooi", "groen"]);
});

test("defines and calls functions", () => {
  const result = run(`
    function add(a, b)
      return a + b
    end
    say add(4, 5)
  `);

  assert.deepEqual(result.output, ["9"]);
});

test("imports functions from a bare module name", (context) => {
  const directory = moduleProject({
    "main.mt": 'import "math"\nsay double(6)',
    "math.mt": "function double(number)\nreturn number * 2\nend",
  });
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  assert.deepEqual(runFile(path.join(directory, "main.mt")).output, ["12"]);
});

test("imports functions from relative files and nested modules", (context) => {
  const directory = moduleProject({
    "main.mt": 'import "./tools/calculator.mt"\nsay quadruple(3)',
    "tools/calculator.mt": 'import "../math.mt"\nfunction quadruple(number)\nreturn double(double(number))\nend',
    "math.mt": "function double(number)\nreturn number * 2\nend",
  });
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  assert.deepEqual(runFile(path.join(directory, "main.mt")).output, ["12"]);
});

test("does not implicitly re-export imported functions", (context) => {
  const directory = moduleProject({
    "main.mt": 'import "calculator"\nsay double(3)',
    "calculator.mt": 'import "math"\nfunction quadruple(number)\nreturn double(double(number))\nend',
    "math.mt": "function double(number)\nreturn number * 2\nend",
  });
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  assert.throws(
    () => runFile(path.join(directory, "main.mt")),
    /variable named 'double'/u,
  );
});

test("imports functions but keeps module variables private", (context) => {
  const directory = moduleProject({
    "main.mt": 'import "helper"\nsay reveal()',
    "private.mt": 'import "helper"\nsay secret',
    "helper.mt": 'set secret = "hidden"\nfunction reveal()\nreturn secret\nend',
  });
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  assert.deepEqual(runFile(path.join(directory, "main.mt")).output, ["hidden"]);
  assert.throws(
    () => runFile(path.join(directory, "private.mt")),
    /variable named 'secret'/u,
  );
});

test("loads each module only once", (context) => {
  const directory = moduleProject({
    "main.mt": 'import "helper"\nimport "./helper.mt"\nsay answer()',
    "helper.mt": 'say "loaded"\nfunction answer()\nreturn 42\nend',
  });
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  assert.deepEqual(runFile(path.join(directory, "main.mt")).output, [
    "loaded",
    "42",
  ]);
});

test("reports missing modules with the importing line", (context) => {
  const directory = moduleProject({
    "main.mt": 'import "missing"\nsay "unreachable"',
  });
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  assert.throws(
    () => runFile(path.join(directory, "main.mt")),
    /main\.mt:1:1: Could not import 'missing'/u,
  );
});

test("prevents circular imports", (context) => {
  const directory = moduleProject({
    "main.mt": 'import "first"\nsay first()',
    "first.mt": 'import "second"\nfunction first()\nreturn second()\nend',
    "second.mt": 'import "first"\nfunction second()\nreturn 2\nend',
  });
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  assert.throws(
    () => runFile(path.join(directory, "main.mt")),
    (error) =>
      error instanceof MoedertaalError &&
      /Circular import detected:/u.test(error.message) &&
      /first\.mt.*second\.mt.*first\.mt/u.test(error.message),
  );
});

test("requires a loader when source text uses imports directly", () => {
  assert.throws(
    () => run('import "math"\nsay double(2)', { language: "en" }),
    /Imports need a module loader/u,
  );
});

test("creates and indexes lists and maps", () => {
  const result = run(`
    设置 颜色 = ["红", "绿", "蓝"]
    设置 人 = {"名字": "小明", "年龄": 12}
    说 颜色[1]
    说 人["名字"]
  `);

  assert.deepEqual(result.output, ["绿", "小明"]);
});

test("supports arrays, maps, length, push, and iteration", () => {
  const result = run(`
    let nums = [1, 2, 3]
    let user = { name: "Gideon", age: 40 }
    push(nums, 4)
    print(length(nums))
    print(nums[2])
    print(user["name"])
    print(user.name)
    for number in nums
      print(number)
    end
  `, { language: "en" });

  assert.deepEqual(result.output, [
    "4",
    "3",
    "Gideon",
    "Gideon",
    "1",
    "2",
    "3",
    "4",
  ]);
});

test("provides the safe standard library", () => {
  const input = [];
  const result = run(`
    print(toText(12))
    print(toNumber("4.5"))
    print(type([1]))
    print(len({ a: 1, b: 2 }))
    print(math.floor(3.9))
    print(math.round(3.6))
    print(random())
    print(input("Name: "))
  `, {
    language: "en",
    random: () => 0.25,
    input: (prompt) => {
      input.push(prompt);
      return "Gideon";
    },
  });

  assert.deepEqual(input, ["Name: "]);
  assert.deepEqual(result.output, [
    "12",
    "4.5",
    "array",
    "2",
    "3",
    "4",
    "0.25",
    "Gideon",
  ]);
});

test("supports localized standard-library functions in every language", () => {
  const packs = loadLanguagePacks();
  const required = [
    "print",
    "input",
    "len",
    "push",
    "type",
    "toText",
    "toNumber",
    "random",
    "math",
    "floor",
    "round",
    "readText",
    "writeText",
  ];

  for (const [language, pack] of packs) {
    for (const name of required) {
      assert.ok(pack.builtins[name]?.length, `${language} is missing built-in '${name}'`);
    }

    const name = (key) => pack.builtins[key][0];
    const stored = new Map();
    const result = run(`
      let items = [1]
      ${name("push")}(items, 2)
      ${name("print")}(${name("len")}(items))
      ${name("print")}(${name("type")}(items))
      ${name("print")}(${name("toText")}(7))
      ${name("print")}(${name("toNumber")}("8"))
      ${name("print")}(${name("random")}())
      ${name("print")}(${name("math")}.${name("floor")}(2.9))
      ${name("print")}(${name("math")}.${name("round")}(2.6))
      ${name("print")}(${name("input")}())
      ${name("writeText")}("note.txt", "hello")
      ${name("print")}(${name("readText")}("note.txt"))
    `, {
      language,
      filename: `${language}-builtins.mt`,
      random: () => 0.5,
      input: () => "answer",
      files: {
        readText: (fileName) => stored.get(fileName),
        writeText: (fileName, text) => stored.set(fileName, text),
      },
    });

    assert.deepEqual(result.output, [
      "2",
      "array",
      "7",
      "8",
      "0.5",
      "2",
      "3",
      "answer",
      "hello",
    ], language);
  }
});

test("creates records and reads fields", () => {
  const result = run(`
    record Person {
      name
      age
    }
    let p = Person("Gideon", 40)
    print(p.name)
    print(p.age)
    print(type(p))
  `, { language: "en" });

  assert.deepEqual(result.output, ["Gideon", "40", "Person"]);
});

test("reports syntax errors with filename, line, and column", () => {
  assert.throws(
    () => check('let nums = [1, 2', {
      language: "en",
      filename: "broken.mt",
    }),
    (error) =>
      error instanceof MoedertaalError &&
      error.filename === "broken.mt" &&
      error.lineNumber === 1 &&
      error.columnNumber > 1 &&
      /expected '\]'/iu.test(error.message),
  );
});

test("reports runtime errors with filename, line, and column", () => {
  assert.throws(
    () => run('let total = 10 / 0', {
      language: "en",
      filename: "divide.mt",
    }),
    (error) =>
      error instanceof MoedertaalError &&
      error.filename === "divide.mt" &&
      error.lineNumber === 1 &&
      error.columnNumber === 16 &&
      /divided by zero/u.test(error.message),
  );
});

test("reads and writes text only inside the sandbox", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "moedertaal-sandbox-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const files = createSandboxFiles(directory);

  const result = run(`
    writeText("notes/todo.txt", "Learn Moedertaal")
    print(readText("notes/todo.txt"))
  `, { language: "en", filename: "files.mt", files });

  assert.deepEqual(result.output, ["Learn Moedertaal"]);
  assert.equal(
    fs.readFileSync(path.join(directory, "notes", "todo.txt"), "utf8"),
    "Learn Moedertaal",
  );
});

test("blocks absolute paths and parent folder traversal", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "moedertaal-sandbox-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const files = createSandboxFiles(directory);

  for (const requestedPath of ["../secret.txt", path.resolve(directory, "secret.txt")]) {
    assert.throws(
      () => run(`print(readText("${requestedPath.replaceAll("\\", "\\\\")}"))`, {
        language: "en",
        filename: "unsafe.mt",
        files,
      }),
      /outside the sandbox/u,
    );
  }
});

test("supports moed run and moed check with useful exit codes", (context) => {
  const directory = moduleProject({
    "program.mt": 'print("CLI works")',
    "broken.mt": "let value = [1, 2",
  });
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const cli = path.resolve("src/cli.js");

  const runResult = spawnSync(process.execPath, [cli, "run", path.join(directory, "program.mt")], {
    encoding: "utf8",
  });
  assert.equal(runResult.status, 0);
  assert.match(runResult.stdout, /CLI works/u);

  const checkResult = spawnSync(process.execPath, [cli, "check", path.join(directory, "program.mt")], {
    encoding: "utf8",
  });
  assert.equal(checkResult.status, 0);
  assert.match(checkResult.stdout, /^OK /u);

  const brokenResult = spawnSync(process.execPath, [cli, "check", path.join(directory, "broken.mt")], {
    encoding: "utf8",
  });
  assert.equal(brokenResult.status, 1);
  assert.match(brokenResult.stderr, /broken\.mt:1:/u);
});

test("runs every documented example successfully", (context) => {
  const cli = path.resolve("src/cli.js");
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "moedertaal-examples-"));
  context.after(() => fs.rmSync(sandbox, { recursive: true, force: true }));
  fs.copyFileSync(
    path.resolve("examples/sandbox/sample.txt"),
    path.join(sandbox, "sample.txt"),
  );
  const examples = [
    ["calculator.mt", "8\n2\n"],
    ["guess-number.mt", "5\n"],
    ["todo-list.mt", ""],
    ["bank-account.mt", ""],
    ["text-adventure.mt", "left\n"],
    ["read-file.mt", ""],
    ["read-file-afrikaans.mt", ""],
  ];

  for (const [fileName, input] of examples) {
    const result = spawnSync(
      process.execPath,
      [cli, "run", path.resolve("examples", fileName), "--sandbox", sandbox],
      { encoding: "utf8", input },
    );
    assert.equal(result.status, 0, `${fileName}: ${result.stderr}`);
  }
});

test("ignores comments without removing hashes inside text", () => {
  assert.deepEqual(run('say "Colour #123" # ignored').output, ["Colour #123"]);
});

test("reports friendly localized errors with source locations", () => {
  assert.throws(
    () => run('sê "Hallo " + vermis'),
    (error) =>
      error instanceof MoedertaalError &&
      error.lineNumber === 1 &&
      error.columnNumber === 15 &&
      /Ek kan nie 'n veranderlike met die naam 'vermis' vind nie/u.test(error.message),
  );
});

test("reports unknown keywords in the selected language", () => {
  assert.throws(
    () => run('praat "Hallo"', { language: "af" }),
    /Ek ken nie die sleutelwoord 'praat' nie/u,
  );
});

test("formats nested blocks", () => {
  const pack = loadLanguagePacks().get("en");
  const source = "if true\nsay \"yes\"\nelse\nsay \"no\"\nend";

  assert.equal(
    formatSource(source, pack),
    'if true\n  say "yes"\nelse\n  say "no"\nend\n',
  );
});

test("stops runaway programs with a safety limit", () => {
  assert.throws(
    () => run("repeat 100\nsay counter\nend", { maxSteps: 10 }),
    /too many steps/u,
  );
});
