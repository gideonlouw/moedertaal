record BankAccount {
  owner
  balance
}

let account = BankAccount("Gideon", 1250)
print("Account owner:", account.owner)
print("Balance:", account.balance)
print("Record type:", type(account))
