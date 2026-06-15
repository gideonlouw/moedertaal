misela umntu = {"igama": "Lwazi", "uyasebenza": yinyani}
misela amanani = [1, 2, 3]

umsebenzi phinda_kabini(inani)
  buyisa inani * 2
gqiba

ukuba umntu["uyasebenza"]
  bhala "Molo, " + umntu["igama"] + "!"
gqiba

nganye inani kwi amanani
  bhala phinda_kabini(inani)
gqiba
