# Moedertaal 0.2 in Afrikaans
stel ouderdom = 20
stel tale = ["Afrikaans", "English", "中文"]
stel persoon = {"naam": "Amélie", "aktief": waar}

funksie groet(naam)
  gee "Hallo " + naam + "!"
einde

as ouderdom >= 18 en persoon["aktief"]
  sê groet(persoon["naam"])
anders
  sê "Welkom!"
einde

vir taal in tale
  sê taal
einde

herhaal 3
  sê "Rondte " + teller
einde
