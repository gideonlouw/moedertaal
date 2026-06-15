import test from "node:test";
import assert from "node:assert/strict";
import {
  formatSource,
  loadLanguagePacks,
  MoedertaalError,
  run,
} from "../src/interpreter.js";

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

test("creates and indexes lists and maps", () => {
  const result = run(`
    设置 颜色 = ["红", "绿", "蓝"]
    设置 人 = {"名字": "小明", "年龄": 12}
    说 颜色[1]
    说 人["名字"]
  `);

  assert.deepEqual(result.output, ["绿", "小明"]);
});

test("ignores comments without removing hashes inside text", () => {
  assert.deepEqual(run('say "Colour #123" # ignored').output, ["Colour #123"]);
});

test("reports friendly localized errors with line numbers", () => {
  assert.throws(
    () => run('sê "Hallo " + vermis'),
    (error) =>
      error instanceof MoedertaalError &&
      error.message ===
        "Reël 1: Ek kan nie 'n veranderlike met die naam 'vermis' vind nie.",
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
