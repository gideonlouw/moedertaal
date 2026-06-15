# Moedertaal

Moedertaal is a small, beginner-friendly programming language with localized
keywords and standard functions. Source files use the `.mt` extension and
UTF-8 encoding.

Supported languages:

- Afrikaans
- 中文
- Русский
- Español
- isiZulu
- isiXhosa
- Sesotho
- English

## Understanding the Examples

The documentation is written in English so that it is accessible to a broad
audience. The code examples intentionally use every supported language except
English.

Run `moed languages` to list the installed languages. The `languages` folder
contains the keywords and standard-function names for each language. English
aliases remain available for compatibility, but are not used in these examples.

## Install and Run

Node.js 20 or newer is required.

```powershell
npm install
npm link
moed languages
moed run program.mt
moed check program.mt
moed repl
```

- `run` executes a program.
- `check` checks syntax without executing the program.
- `repl` opens an interactive prompt. Enter `:exit` to close it.
- `languages` lists the available languages.

## First Program in Every Language

Each example creates an array, adds a value, defines a function, and prints the
results.

### Afrikaans

```text
stel nommers = [1, 2, 3]
voegBy(nommers, 4)

funksie verdubbel(getal)
  gee getal * 2
einde

druk("Lengte:", lengte(nommers))
vir nommer in nommers
  druk(verdubbel(nommer))
einde
```

### 中文

```text
设置 数字 = [1, 2, 3]
添加(数字, 4)

函数 双倍(数字值)
  返回 数字值 * 2
结束

打印("长度：", 长度(数字))
对于 数 在 数字
  打印(双倍(数))
结束
```

### Русский

```text
задать числа = [1, 2, 3]
добавить(числа, 4)

функция удвоить(число)
  вернуть число * 2
конец

вывести("Длина:", длина(числа))
для число в числа
  вывести(удвоить(число))
конец
```

### Español

```text
asigna números = [1, 2, 3]
agregar(números, 4)

función duplicar(número)
  devuelve número * 2
fin

imprimir("Longitud:", longitud(números))
para número en números
  imprimir(duplicar(número))
fin
```

### isiZulu

```text
beka izinombolo = [1, 2, 3]
engeza(izinombolo, 4)

umsebenzi phinda_kabili(inombolo)
  buyisa inombolo * 2
qeda

bonisa("Ubude:", ubude(izinombolo))
ngayinye inombolo ku izinombolo
  bonisa(phinda_kabili(inombolo))
qeda
```

### isiXhosa

```text
misela amanani = [1, 2, 3]
yongeza(amanani, 4)

umsebenzi phinda_kabini(inani)
  buyisa inani * 2
gqiba

bonisa("Ubude:", ubude(amanani))
nganye inani kwi amanani
  bonisa(phinda_kabini(inani))
gqiba
```

### Sesotho

```text
beha dinomoro = [1, 2, 3]
eketsa(dinomoro, 4)

tshebetso habedi(nomoro)
  kgutlisa nomoro * 2
qetella

bontsha("Bolelele:", bolelele(dinomoro))
bakeng nomoro ho dinomoro
  bontsha(habedi(nomoro))
qetella
```

Array indexes begin at zero. Iterating over a map visits its keys.

## Decisions in Every Language

### Afrikaans

```text
stel ouderdom = 17
as ouderdom >= 18
  druk("Volwassene")
anders
  druk("Nog nie")
einde
```

### 中文

```text
设置 年龄 = 17
如果 年龄 >= 18
  打印("成年人")
否则
  打印("还没有")
结束
```

### Русский

```text
задать возраст = 17
если возраст >= 18
  вывести("Совершеннолетний")
иначе
  вывести("Ещё нет")
конец
```

### Español

```text
asigna edad = 17
si edad >= 18
  imprimir("Adulto")
sino
  imprimir("Todavía no")
fin
```

### isiZulu

```text
beka iminyaka = 17
uma iminyaka >= 18
  bonisa("Umuntu omdala")
kungenjalo
  bonisa("Hhayi okwamanje")
qeda
```

### isiXhosa

```text
misela iminyaka = 17
ukuba iminyaka >= 18
  bonisa("Umntu omdala")
kungenjalo
  bonisa("Hayi okwangoku")
gqiba
```

### Sesotho

```text
beha dilemo = 17
haeba dilemo >= 18
  bontsha("Motho e moholo")
ho_seng_jwalo
  bontsha("Ha e so be jwalo")
qetella
```

## Records

`record` and `let` are currently shared syntax that works in every language.
Record names, fields, variables, and output functions can still be fully
localized.

### Afrikaans

```text
record Persoon {
  naam
  ouderdom
}
let persoon = Persoon("Gideon", 40)
druk(persoon.naam)
```

### 中文

```text
record 人 {
  名字
  年龄
}
let 用户 = 人("Gideon", 40)
打印(用户.名字)
```

### Русский

```text
record Человек {
  имя
  возраст
}
let человек = Человек("Gideon", 40)
вывести(человек.имя)
```

### Español

```text
record Persona {
  nombre
  edad
}
let persona = Persona("Gideon", 40)
imprimir(persona.nombre)
```

### isiZulu

```text
record Umuntu {
  igama
  iminyaka
}
let umuntu = Umuntu("Gideon", 40)
bonisa(umuntu.igama)
```

### isiXhosa

```text
record Umntu {
  igama
  iminyaka
}
let umntu = Umntu("Gideon", 40)
bonisa(umntu.igama)
```

### Sesotho

```text
record Motho {
  lebitso
  dilemo
}
let motho = Motho("Gideon", 40)
bontsha(motho.lebitso)
```

Records are simple data values without classes or inheritance.

## Standard Functions

| Meaning | Afrikaans | 中文 | Русский | Español | isiZulu | isiXhosa | Sesotho |
| --- | --- | --- | --- | --- | --- | --- | --- |
| print | `druk()` | `打印()` | `вывести()` | `imprimir()` | `bonisa()` | `bonisa()` | `bontsha()` |
| input | `invoer()` | `输入()` | `ввод()` | `entrada()` | `faka()` | `faka()` | `kenya()` |
| length | `lengte()` | `长度()` | `длина()` | `longitud()` | `ubude()` | `ubude()` | `bolelele()` |
| append | `voegBy()` | `添加()` | `добавить()` | `agregar()` | `engeza()` | `yongeza()` | `eketsa()` |
| type | `tipe()` | `类型()` | `тип()` | `tipo()` | `uhlobo()` | `uhlobo()` | `mofuta()` |
| to text | `naTeks()` | `转文本()` | `вТекст()` | `aTexto()` | `kumbhalo()` | `kumbhalo()` | `hoMongolo()` |
| to number | `naGetal()` | `转数字()` | `вЧисло()` | `aNúmero()` | `kunombolo()` | `kwinani()` | `hoNomoro()` |
| random | `lukraak()` | `随机()` | `случайное()` | `aleatorio()` | `okungahleliwe()` | `ngokungakhethiyo()` | `kaTshohanyetso()` |
| read text | `leesTeks()` | `读取文本()` | `читатьТекст()` | `leerTexto()` | `fundaUmbhalo()` | `fundaUmbhalo()` | `balaMongolo()` |
| write text | `skryfTeks()` | `写入文本()` | `писатьТекст()` | `escribirTexto()` | `bhalaUmbhalo()` | `bhalaUmbhalo()` | `ngolaMongolo()` |

### Mathematical Functions

```text
# Afrikaans
druk(wiskunde.vloer(3.9))
druk(wiskunde.rond(3.6))

# 中文
打印(数学.向下取整(3.9))
打印(数学.四舍五入(3.6))

# Русский
вывести(математика.пол(3.9))
вывести(математика.округлить(3.6))

# Español
imprimir(matemáticas.piso(3.9))
imprimir(matemáticas.redondear(3.6))

# isiZulu
bonisa(izibalo.phansi(3.9))
bonisa(izibalo.sondeza(3.6))

# isiXhosa
bonisa(izibalo.ezantsi(3.9))
bonisa(izibalo.sondeza(3.6))

# Sesotho
bontsha(dipalo.fatshe(3.9))
bontsha(dipalo.potoloha(3.6))
```

The localized random functions return a number from zero up to, but not
including, one.

## Safe File Access

Programs may only read and write inside their `sandbox` folder. Absolute paths
and parent-folder paths such as `../secret.txt` are blocked.

### Afrikaans

```text
skryfTeks("notas.txt", "Hallo vanuit Moedertaal")
stel inhoud = leesTeks("notas.txt")
druk(inhoud)
```

### 中文

```text
写入文本("笔记.txt", "你好，Moedertaal")
设置 内容 = 读取文本("笔记.txt")
打印(内容)
```

### Русский

```text
писатьТекст("заметки.txt", "Привет из Moedertaal")
задать содержимое = читатьТекст("заметки.txt")
вывести(содержимое)
```

### Español

```text
escribirTexto("notas.txt", "Hola desde Moedertaal")
asigna contenido = leerTexto("notas.txt")
imprimir(contenido)
```

### isiZulu

```text
bhalaUmbhalo("amanothi.txt", "Sawubona kusuka ku-Moedertaal")
beka okuqukethwe = fundaUmbhalo("amanothi.txt")
bonisa(okuqukethwe)
```

### isiXhosa

```text
bhalaUmbhalo("amanqaku.txt", "Molo kwi-Moedertaal")
misela umxholo = fundaUmbhalo("amanqaku.txt")
bonisa(umxholo)
```

### Sesotho

```text
ngolaMongolo("dinoutu.txt", "Dumela ho tswa Moedertaal")
beha dikahare = balaMongolo("dinoutu.txt")
bontsha(dikahare)
```

Use a custom sandbox:

```powershell
moed run program.mt --sandbox C:\MySafeFolder
```

## Modules

`import` is shared syntax. It loads functions and records from another `.mt`
file. These are equivalent main programs in every non-English language:

### Afrikaans

```text
import "wiskunde"
druk(verdubbel(6))
```

### 中文

```text
import "数学工具"
打印(双倍(6))
```

### Русский

```text
import "математика"
вывести(удвоить(6))
```

### Español

```text
import "matemáticas"
imprimir(duplicar(6))
```

### isiZulu

```text
import "izibalo"
bonisa(phinda_kabili(6))
```

### isiXhosa

```text
import "izibalo"
bonisa(phinda_kabini(6))
```

### Sesotho

```text
import "dipalo"
bontsha(habedi(6))
```

Modules load once, module variables stay private, and circular imports are
blocked.

## Errors

Errors show the filename, line, column, and a localized message:

```text
# Afrikaans
C:\projek\gebreek.mt:3:18: Ek het ']' verwag.

# 中文
C:\项目\错误.mt:3:18: 这里需要']'。

# Русский
C:\проект\ошибка.mt:3:18: Ожидалось: ']'.

# Español
C:\proyecto\error.mt:3:18: Esperaba ']'.

# isiZulu
C:\uhlelo\iphutha.mt:3:18: Bengilindele ']'.

# isiXhosa
C:\inkqubo\impazamo.mt:3:18: Bendilindele ']'.

# Sesotho
C:\projeke\phoso.mt:3:18: Ke ne ke lebeletse ']'.
```

## Example Programs

```powershell
moed run examples/afrikaans-v02.mt
moed run examples/chinese-v02.mt
moed run examples/russian-v02.mt
moed run examples/spanish-v02.mt
moed run examples/zulu-v02.mt
moed run examples/xhosa-v02.mt
moed run examples/sesotho-v02.mt
moed run examples/read-file-afrikaans.mt
```

## Browser Playground

```powershell
node playground/server.js
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). Keyboard input, modules,
and file access require the command-line runner.

## Visual Studio Code

The extension in `editor/moedertaal-vscode` provides `.mt` file recognition,
syntax highlighting, and document formatting.

## Security

Moedertaal intentionally does not expose:

- networking
- shell commands or process execution
- unrestricted file access
- dynamic package installation
- JavaScript execution
- classes or inheritance

## Tests

```powershell
node --test
```

## Adding a Language

Language packs are JSON files in `languages`. Use `languages/en.json` as a
technical reference, add an example and test, and ask a fluent speaker to
review the translation.

## License

Moedertaal is available under the [MIT License](LICENSE).
