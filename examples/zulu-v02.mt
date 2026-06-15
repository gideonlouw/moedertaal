beka umuntu = {"igama": "Thandi", "uyasebenza": iqiniso}
beka izinombolo = [1, 2, 3]

umsebenzi phinda_kabili(inombolo)
  buyisa inombolo * 2
qeda

uma umuntu["uyasebenza"]
  bhala "Sawubona, " + umuntu["igama"] + "!"
qeda

ngayinye inombolo ku izinombolo
  bhala phinda_kabili(inombolo)
qeda
