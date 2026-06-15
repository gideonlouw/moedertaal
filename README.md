# Moedertaal

Moedertaal is 'n klein, beginnersvriendelike programmeertaal met gelokaliseerde
sleutelwoorde en funksies. Dit ondersteun tans Afrikaans, English, Chinese,
Russian, Spanish, isiZulu, isiXhosa en Sesotho. Bronlêers gebruik die `.mt`
uitbreiding en UTF-8-kodering.

## Other Languages

**English:** The examples below are shown in Afrikaans, isiZulu, and Chinese.
If you do not understand these languages, run
`moed languages` to see the available languages. Look in the `languages`
folder for the keywords and function names in your language. English names
remain available for compatibility. New translations are welcome; use
`languages/en.json` as the reference when adding your own language.

## Installeer en Begin / Faka bese Uqalisa

Node.js 20 of nuwer word vereis.

```powershell
npm install
npm link
moed run examples/calculator.mt
```

Die opdragreël gebruik:

```text
moed run file.mt
moed check file.mt
moed repl
moed languages
```

- `run` voer 'n program uit.
- `check` toets die sintaksis sonder om die program uit te voer.
- `repl` open 'n interaktiewe Moedertaal-prompt. Tik `:exit` om te sluit.
- `languages` wys al die beskikbare tale.

## Veranderlikes en Versamelings / Okuguqukayo Neziqoqo

### Afrikaans

```text
stel nommers = [1, 2, 3]
stel gebruiker = { naam: "Gideon", ouderdom: 40 }

druk(nommers[0])
druk(gebruiker["naam"])
druk(lengte(nommers))

voegBy(nommers, 4)
vir nommer in nommers
  druk(nommer)
einde
```

### isiZulu

```text
beka izinombolo = [1, 2, 3]
beka umsebenzisi = { igama: "Gideon", iminyaka: 40 }

bonisa(izinombolo[0])
bonisa(umsebenzisi["igama"])
bonisa(ubude(izinombolo))

engeza(izinombolo, 4)
ngayinye inombolo ku izinombolo
  bonisa(inombolo)
qeda
```

### Chinese / 中文

```text
设置 数字 = [1, 2, 3]
设置 用户 = { 名字: "Gideon", 年龄: 40 }

打印(数字[0])
打印(用户["名字"])
打印(长度(数字))

添加(数字, 4)
对于 数 在 数字
  打印(数)
结束
```

Lyste gebruik indekse wat by nul begin. Wanneer 'n kaart herhaal word, word
sy sleutels besoek.

## Besluite / Izinqumo

### Afrikaans

```text
stel ouderdom = 17

as ouderdom >= 18
  druk("Volwassene")
anders
  druk("Nog nie")
einde
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

### Chinese / 中文

```text
设置 年龄 = 17

如果 年龄 >= 18
  打印("成年人")
否则
  打印("还没有")
结束
```

## Funksies / Imisebenzi

### Afrikaans

```text
funksie verdubbel(getal)
  gee getal * 2
einde

druk(verdubbel(5))
```

### isiZulu

```text
umsebenzi phinda_kabili(inombolo)
  buyisa inombolo * 2
qeda

bonisa(phinda_kabili(5))
```

### Chinese / 中文

```text
函数 双倍(数字)
  返回 数字 * 2
结束

打印(双倍(5))
```

## Rekords / Amarekhodi

`record` en `let` is tans gedeelde sintaksis wat in elke taal werk.

### Afrikaans

```text
record Persoon {
  naam
  ouderdom
}

let persoon = Persoon("Gideon", 40)
druk(persoon.naam)
druk(persoon.ouderdom)
```

### isiZulu

```text
record Umuntu {
  igama
  iminyaka
}

let umuntu = Umuntu("Gideon", 40)
bonisa(umuntu.igama)
bonisa(umuntu.iminyaka)
```

### Chinese / 中文

```text
record 人 {
  名字
  年龄
}

let 用户 = 人("Gideon", 40)
打印(用户.名字)
打印(用户.年龄)
```

Rekords is eenvoudige datawaardes. Hulle het nie oorerwing, metodes of
versteekte konstruktors nie.

## Standaardfunksies / Imisebenzi Ejwayelekile

| Betekenis / Meaning | Afrikaans | isiZulu | Chinese / 中文 |
| --- | --- | --- | --- |
| druk / print | `druk()` | `bonisa()` | `打印()` |
| invoer / input | `invoer()` | `faka()` | `输入()` |
| lengte / length | `lengte()` | `ubude()` | `长度()` |
| voeg by / push | `voegBy()` | `engeza()` | `添加()` |
| tipe / type | `tipe()` | `uhlobo()` | `类型()` |
| na teks / to text | `naTeks()` | `kumbhalo()` | `转文本()` |
| na getal / to number | `naGetal()` | `kunombolo()` | `转数字()` |
| lukraak / random | `lukraak()` | `okungahleliwe()` | `随机()` |
| lees teks / read text | `leesTeks()` | `fundaUmbhalo()` | `读取文本()` |
| skryf teks / write text | `skryfTeks()` | `bhalaUmbhalo()` | `写入文本()` |

### Afrikaans

```text
stel naam = invoer("Wat is jou naam? ")
druk("Hallo " + naam)
druk(naGetal("12") + 3)
druk(tipe([1, 2, 3]))
druk(wiskunde.vloer(3.9))
druk(wiskunde.rond(3.6))
druk(lukraak())
```

### isiZulu

```text
beka igama = faka("Ngubani igama lakho? ")
bonisa("Sawubona " + igama)
bonisa(kunombolo("12") + 3)
bonisa(uhlobo([1, 2, 3]))
bonisa(izibalo.phansi(3.9))
bonisa(izibalo.sondeza(3.6))
bonisa(okungahleliwe())
```

### Chinese / 中文

```text
设置 名字 = 输入("你叫什么名字？")
打印("你好，" + 名字)
打印(转数字("12") + 3)
打印(类型([1, 2, 3]))
打印(数学.向下取整(3.9))
打印(数学.四舍五入(3.6))
打印(随机())
```

Die lukraakfunksie gee 'n getal vanaf nul tot net onder een.

## Veilige Lêertoegang / Ukufinyelela Amafayela Ngokuphepha

Programme mag slegs binne hul `sandbox`-gids lees en skryf. Die gids is
standaard langs die `.mt`-program.

### Afrikaans

```text
skryfTeks("notas.txt", "Hallo vanuit Moedertaal")
stel inhoud = leesTeks("notas.txt")
druk("Die lêer bevat:")
druk(inhoud)
```

### isiZulu

```text
bhalaUmbhalo("amanothi.txt", "Sawubona kusuka ku-Moedertaal")
beka okuqukethwe = fundaUmbhalo("amanothi.txt")
bonisa("Ifayela liqukethe:")
bonisa(okuqukethwe)
```

### Chinese / 中文

```text
写入文本("笔记.txt", "你好，Moedertaal")
设置 内容 = 读取文本("笔记.txt")
打印("文件内容：")
打印(内容)
```

Absolute paaie en ouergidspaaie soos `../secret.txt` word geblokkeer.

```powershell
moed run program.mt --sandbox C:\MySafeFolder
```

Die lêerleesvoorbeeld gebruik:

```text
examples/
  read-file-afrikaans.mt
  sandbox/
    sample.txt
```

```powershell
moed run examples/read-file-afrikaans.mt
```

## Modules / Amamojuli

`import` is tans gedeelde sintaksis. Dit laai funksies en rekords uit 'n ander
`.mt`-lêer.

### Afrikaans

`wiskunde.mt`:

```text
funksie verdubbel(getal)
  gee getal * 2
einde
```

Hoofprogram:

```text
import "wiskunde"
druk(verdubbel(6))
```

### isiZulu

`izibalo.mt`:

```text
umsebenzi phinda_kabili(inombolo)
  buyisa inombolo * 2
qeda
```

Uhlelo olukhulu:

```text
import "izibalo"
bonisa(phinda_kabili(6))
```

### Chinese / 中文

`数学工具.mt`:

```text
函数 双倍(数字)
  返回 数字 * 2
结束
```

主程序:

```text
import "数学工具"
打印(双倍(6))
```

`import "wiskunde"` soek `wiskunde.mt` langs die program. Relatiewe paaie soos
`import "./tools/helpers.mt"` word ook ondersteun. Modules laai net een keer,
moduleveranderlikes bly privaat en sirkelinvoere word geblokkeer.

## Foute / Amaphutha

Sintaksis- en looptydfoute wys die lêernaam, reël, kolom en 'n nuttige boodskap.

### Afrikaans

```text
C:\projek\gebreek.mt:3:18: Ek het ']' verwag.
```

### isiZulu

```text
C:\uhlelo\iphutha.mt:3:18: Bengilindele ']'.
```

### Chinese / 中文

```text
C:\项目\错误.mt:3:18: 这里需要']'。
```

## Voorbeeldprogramme / Izinhlelo Zezibonelo

```powershell
moed run examples/calculator.mt
moed run examples/guess-number.mt
moed run examples/todo-list.mt
moed run examples/bank-account.mt
moed run examples/text-adventure.mt
moed run examples/read-file-afrikaans.mt
```

Die sakrekenaar, raaispeletjie en teksavontuur vra sleutelbordinvoer. Die
taaklys wys lyste, herhaling, byvoeging en veilige lêerskryf. Die bankrekening
wys rekords.

## Blaaier-speelgrond / Indawo Yokuzama Esipheqululini

```powershell
node playground/server.js
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). Die speelgrond ondersteun
gelokaliseerde sintaksis, versamelings, rekords en veilige funksies wat nie
gasheertoegang benodig nie. Sleutelbordinvoer, modules en lêertoegang gebruik
die opdragreël.

## Visual Studio Code

Die uitbreiding is in `editor/moedertaal-vscode`. Dit bied `.mt`-lêerherkenning,
sintaksisverligting en dokumentformatering.

## Veiligheid / Ukuphepha

Moedertaal gee doelbewus nie toegang tot die volgende nie:

- netwerke
- dopopdragte of prosesuitvoering
- onbeperkte lêertoegang
- dinamiese pakketinstallasie
- JavaScript-uitvoering
- klasse of oorerwing

## Toetse / Ukuhlola

```powershell
node --test
```

## Voeg 'n Taal By / Engeza Ulimi

Taalpakke is JSON-lêers in `languages`. Gebruik `languages/en.json` as
verwysing en voeg 'n voorbeeld en toets by. Vertalings moet deur 'n vlot
spreker nagegaan word en natuurlik klink wanneer dit hardop gelees word.

## Lisensie / Ilayisense

Moedertaal is beskikbaar onder die [MIT License](LICENSE).
