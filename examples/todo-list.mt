let tasks = ["Learn arrays", "Build a program"]
push(tasks, "Share Moedertaal")

print("Todo list:")
for task in tasks
  print("-", task)
end

writeText("todo-list.txt", "Learn arrays\nBuild a program\nShare Moedertaal")
print("Saved todo-list.txt inside the sandbox.")
print(readText("todo-list.txt"))
