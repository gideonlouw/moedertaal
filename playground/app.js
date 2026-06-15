import { formatSource, runWithPacks } from "/runtime.js";

const examples = {
  af: `stel persoon = {"naam": "Amélie", "aktief": waar}
stel tale = ["Afrikaans", "English", "中文"]

funksie groet(naam)
  gee "Hallo " + naam + "!"
einde

as persoon["aktief"]
  sê groet(persoon["naam"])
einde

vir taal in tale
  sê taal
einde`,
  en: `set person = {"name": "Amina", "active": true}
set scores = [8, 10, 7]

function double(number)
  return number * 2
end

if person["active"]
  say "Hello " + person["name"] + "!"
end

for score in scores
  say double(score)
end`,
  zh: `设置 学生 = {"名字": "小明", "通过": 真}
设置 数字 = [1, 2, 3]

函数 双倍(数字)
  返回 数字 * 2
结束

如果 学生["通过"]
  说 "你好，" + 学生["名字"] + "！"
结束

对于 数 在 数字
  说 双倍(数)
结束`,
};

const packs = new Map(
  await Promise.all(
    ["af", "en", "zh"].map(async (code) => [
      code,
      await fetch(`/languages/${code}.json`).then((response) => response.json()),
    ]),
  ),
);

const language = document.querySelector("#language");
const code = document.querySelector("#code");
const output = document.querySelector("#output");
const status = document.querySelector("#status");

function showExample() {
  code.value = examples[language.value];
  output.textContent = "Press “Run program” to begin.";
  output.classList.remove("error");
  status.textContent = "Ready";
}

document.querySelector("#run").addEventListener("click", () => {
  try {
    const result = runWithPacks(code.value, {
      language: language.value,
      packs,
      maxSteps: 50000,
    });
    output.textContent = result.output.join("\n") || "(No output)";
    output.classList.remove("error");
    status.textContent = "Finished";
  } catch (error) {
    output.textContent = error.message;
    output.classList.add("error");
    status.textContent = "Needs attention";
  }
});

document.querySelector("#format").addEventListener("click", () => {
  code.value = formatSource(code.value, packs.get(language.value));
  status.textContent = "Formatted";
});

language.addEventListener("change", showExample);
code.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    code.setRangeText("  ", code.selectionStart, code.selectionEnd, "end");
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    document.querySelector("#run").click();
  }
});

showExample();
