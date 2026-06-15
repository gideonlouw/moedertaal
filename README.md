# Moedertaal

Moedertaal is a small beginner-friendly programming language with localized
keywords. It supports Afrikaans, English, Chinese, Russian, Spanish, isiZulu,
isiXhosa, and Sesotho. Source files use the `.mt` extension and UTF-8 encoding.

## Install and Run

Node.js 20 or newer is required.

```powershell
npm install
npm link
moed run examples/calculator.mt
```

The command-line runner provides:

```text
moed run file.mt
moed check file.mt
moed repl
moed languages
```

`run` executes a program and exits with code 1 on failure. `check` parses a
program without executing it. `repl` opens a small interactive prompt; enter
`:exit` to leave.

## Variables and Collections

The universal `let` form works in every language:

```text
let nums = [1, 2, 3]
let user = { name: "Gideon", age: 40 }

print(nums[0])
print(user["name"])
print(length(nums))

push(nums, 4)
for number in nums
  print(number)
end
```

Arrays use zero-based indexes. Iterating over a map visits its keys.
`length()` is an alias for `len()`.

Localized assignment and output commands remain supported:

```text
stel naam = "Wêreld"
sê "Hallo " + naam
```

## Records

Records provide named fields without inheritance or class complexity:

```text
record Person {
  name
  age
}

let person = Person("Gideon", 40)
print(person.name)
print(person.age)
```

Records are simple data values. They do not have methods, inheritance, or
hidden constructors.

## Standard Library

The small built-in library includes:

```text
print(value)
input("Prompt: ")
len(value)
length(value)
push(array, value)
type(value)
toText(value)
toNumber(value)
random()
math.floor(number)
math.round(number)
readText(path)
writeText(path, text)
```

`random()` returns a number from 0 up to, but not including, 1.

### Localized Function Names

Every standard-library function has localized aliases. English names remain
available for compatibility, but a program may be written using its own
language throughout.

| Meaning | Afrikaans | Spanish | isiZulu | isiXhosa | Sesotho |
| --- | --- | --- | --- | --- | --- |
| print | `druk()` | `imprimir()` | `bonisa()` | `bonisa()` | `bontsha()` |
| input | `invoer()` | `entrada()` | `faka()` | `faka()` | `kenya()` |
| length | `lengte()` | `longitud()` | `ubude()` | `ubude()` | `bolelele()` |
| push | `voegBy()` | `agregar()` | `engeza()` | `yongeza()` | `eketsa()` |
| type | `tipe()` | `tipo()` | `uhlobo()` | `uhlobo()` | `mofuta()` |
| to text | `naTeks()` | `aTexto()` | `kumbhalo()` | `kumbhalo()` | `hoMongolo()` |
| to number | `naGetal()` | `aNúmero()` | `kunombolo()` | `kwinani()` | `hoNomoro()` |
| random | `lukraak()` | `aleatorio()` | `okungahleliwe()` | `ngokungakhethiyo()` | `kaTshohanyetso()` |
| read text | `leesTeks()` | `leerTexto()` | `fundaUmbhalo()` | `fundaUmbhalo()` | `balaMongolo()` |
| write text | `skryfTeks()` | `escribirTexto()` | `bhalaUmbhalo()` | `bhalaUmbhalo()` | `ngolaMongolo()` |

Russian and Chinese aliases are also defined in their language packs.
Localized math namespaces work in the same way, for example:

```text
druk(wiskunde.vloer(3.9))
druk(wiskunde.rond(3.6))
```

An Afrikaans file-reading program can be written without English function
names:

```text
stel inhoud = leesTeks("sample.txt")
druk("Die lêer bevat:")
druk(inhoud)
```

## Safe File Access

Programs may only read and write inside their sandbox folder. By default, this
is a folder named `sandbox` beside the running `.mt` file.

```text
writeText("notes.txt", "Hello from Moedertaal")
print(readText("notes.txt"))
```

Absolute paths and parent traversal such as `../secret.txt` are rejected. A
custom sandbox can be selected:

```powershell
moed run program.mt --sandbox C:\MySafeFolder
```

The file-reading example uses this layout:

```text
examples/
  read-file.mt
  sandbox/
    sample.txt
```

Run it with:

```powershell
moed run examples/read-file.mt
moed run examples/read-file-afrikaans.mt
```

It calls `readText("sample.txt")` and prints the file contents.

## Modules

Import top-level functions or records from another `.mt` file:

```text
import "math"
import "./tools/helpers.mt"

print(double(6))
```

`import "math"` looks for `math.mt` beside the importing file. Relative paths
are resolved from the file containing the import. Module variables stay
private, modules load once, and circular imports are rejected.

## Errors

Syntax and runtime errors include the filename, line, column, and a helpful
message:

```text
C:\project\broken.mt:3:18: I expected ']'.
```

## Examples

```powershell
moed run examples/calculator.mt
moed run examples/guess-number.mt
moed run examples/todo-list.mt
moed run examples/bank-account.mt
moed run examples/text-adventure.mt
moed run examples/read-file.mt
```

The calculator, guessing game, and text adventure request keyboard input. The
todo program demonstrates arrays, iteration, `push()`, and sandboxed file
writing. The bank account demonstrates records.

## Browser Playground

```powershell
node playground/server.js
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). The browser playground
supports language syntax, collections, records, and safe non-host built-ins.
Keyboard input, modules, and filesystem access require the command-line runner.

## Visual Studio Code

The extension source is in `editor/moedertaal-vscode`. It provides `.mt` file
recognition, syntax highlighting, and document formatting.

## Security Scope

Moedertaal intentionally does not expose:

- networking
- shell commands or process execution
- unrestricted filesystem access
- dynamic package installation
- JavaScript evaluation
- classes or inheritance

## Tests

```powershell
node --test
```

## Adding a Spoken Language

Language packs are JSON files in `languages`. Use `languages/en.json` as the
reference and add an example and test. Translations should be reviewed by a
fluent speaker and should feel natural when read aloud.

## License

Moedertaal is available under the [MIT License](LICENSE).
