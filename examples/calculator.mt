print("Moedertaal calculator")
let first = toNumber(input("First number: "))
let second = toNumber(input("Second number: "))

print("Sum:", first + second)
print("Difference:", first - second)
print("Product:", first * second)

if second == 0
  print("Division is not available because the second number is zero.")
else
  print("Quotient:", first / second)
end
