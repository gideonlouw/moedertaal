print("Guess a number from 1 to 10.")
let secret = math.floor(random() * 10) + 1
let guess = toNumber(input("Your guess: "))

if guess == secret
  print("Correct!")
else
  print("Not this time. The number was", secret)
end
