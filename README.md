# Moedertaal

Moedertaal is an open-source programming language whose keywords can be written
in the programmer's own human language. Version 0.2 includes Afrikaans, English,
and Chinese.

```text
stel naam = "Wêreld"
sê "Hallo " + naam + "!"
```

```text
set name = "World"
say "Hello " + name + "!"
```

```text
设置 名字 = "世界"
说 "你好，" + 名字 + "！"
```

Moedertaal source files use the `.mt` extension and UTF-8 encoding.

## Run a Program

Node.js 20 or newer is required. No third-party packages are needed.

```powershell
node src/cli.js examples/afrikaans-v02.mt
node src/cli.js examples/english-v02.mt
node src/cli.js examples/chinese-v02.mt
```

Install the `moedertaal` command locally:

```powershell
npm install
npm link
moedertaal examples/afrikaans.mt
```

## Language Guide

### Values and arithmetic

Afrikaans booleans are `waar`, `onwaar`, and `niks`. English uses `true`,
`false`, and `nothing`; Chinese uses `真`, `假`, and `空`.

```text
stel totaal = (10 + 2) * 3
stel gereed = totaal == 36 en nie onwaar
sê gereed
```

Operators: `+`, `-`, `*`, `/`, `%`, `==`, `!=`, `<`, `<=`, `>`, and `>=`.
Logical operators are localized: `en/of/nie`, `and/or/not`, and `且/或/非`.

### Decisions

```text
as ouderdom >= 18
  sê "Volwassene"
anders
  sê "Nog nie"
einde
```

English uses `if/else/end`; Chinese uses `如果/否则/结束`.

### Loops

Repeat a fixed number of times:

```text
herhaal 3
  sê teller
einde
```

Loop through a list:

```text
vir kleur in ["rooi", "groen", "blou"]
  sê kleur
einde
```

English uses `repeat`, `counter`, and `for item in list`. Chinese uses `重复`,
`次数`, and `对于 项目 在 列表`.

### Functions

```text
funksie verdubbel(getal)
  gee getal * 2
einde

sê verdubbel(5)
```

English uses `function/return/end`; Chinese uses `函数/返回/结束`.

### Lists and maps

```text
stel kleure = ["rooi", "groen", "blou"]
stel persoon = {"naam": "Amina", "aktief": waar}

sê kleure[0]
sê persoon["naam"]
```

List indexes begin at zero. Looping over a map returns its keys.

## Format a File

```powershell
node src/cli.js program.mt --format
```

This applies consistent two-space indentation to blocks.

## Browser Playground

Start the local playground:

```powershell
node playground/server.js
```

Then open [http://127.0.0.1:8080](http://127.0.0.1:8080). It runs entirely on
your computer and includes language selection, examples, execution, friendly
errors, and formatting. Press `Ctrl+Enter` to run a program.

## Visual Studio Code

The extension source is in `editor/moedertaal-vscode`. It provides:

- `.mt` file recognition
- Syntax highlighting for all three languages
- Comment, bracket, and quote handling
- **Format Document** support

Build and install it:

```powershell
cd editor/moedertaal-vscode
npm install
npm run package
code --install-extension moedertaal-language-0.2.0.vsix
```

## Add a Language

Language packs are JSON files in `languages`. A pack defines localized commands,
values, logical operators, and error messages. Use `languages/en.json` as the
complete reference and add a matching example and test.

Translations should be reviewed by a fluent speaker. The words should feel
natural in code rather than being blindly translated.

## Tests

```powershell
node --test
```

## Current Scope

Moedertaal 0.2 is intentionally a learning language. It has functions and local
function variables, but not imports, classes, file access, networking, or
package management yet. The runtime stops programs that execute too many steps.

## License

Moedertaal is available under the [MIT License](LICENSE).
