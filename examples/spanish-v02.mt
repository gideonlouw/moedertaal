asigna persona = {"nombre": "Lucía", "activa": verdadero}
asigna números = [1, 2, 3]

función doble(número)
  devuelve número * 2
fin

si persona["activa"]
  di "¡Hola, " + persona["nombre"] + "!"
fin

para número en números
  di doble(número)
fin
