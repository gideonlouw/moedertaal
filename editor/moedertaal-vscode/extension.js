const vscode = require("vscode");

const openers = new Set([
  "as", "herhaal", "vir", "funksie",
  "if", "repeat", "for", "function",
  "如果", "重复", "对于", "函数",
  "если", "повторить", "для", "функция",
  "si", "repite", "para", "función",
  "uma", "phinda", "ngayinye", "umsebenzi",
  "ukuba", "nganye",
  "haeba", "pheta", "bakeng", "tshebetso",
]);
const branches = new Set([
  "anders", "else", "否则", "иначе", "sino", "kungenjalo", "ho_seng_jwalo",
]);
const endings = new Set([
  "einde", "end", "结束", "конец", "fin", "qeda", "gqiba", "qetella",
]);

function format(text) {
  let depth = 0;
  return text
    .split(/\r?\n/u)
    .map((raw) => {
      const line = raw.trim();
      if (!line) return "";
      const word = line.match(/^(\S+)/u)?.[1];
      if (branches.has(word) || endings.has(word)) depth = Math.max(0, depth - 1);
      const result = `${"  ".repeat(depth)}${line}`;
      if (openers.has(word) || branches.has(word)) depth += 1;
      return result;
    })
    .join("\n")
    .replace(/\s+$/u, "") + "\n";
}

function activate(context) {
  const provider = vscode.languages.registerDocumentFormattingEditProvider(
    "moedertaal",
    {
      provideDocumentFormattingEdits(document) {
        const lastLine = document.lineAt(document.lineCount - 1);
        const range = new vscode.Range(0, 0, document.lineCount - 1, lastLine.text.length);
        return [vscode.TextEdit.replace(range, format(document.getText()))];
      },
    },
  );
  context.subscriptions.push(provider);
}

module.exports = { activate };
