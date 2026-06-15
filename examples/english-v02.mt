# Moedertaal 0.2 in English
set scores = [8, 10, 7]
set student = {"name": "Amina", "passed": true}

function double(number)
  return number * 2
end

if student["passed"]
  say student["name"] + " passed!"
else
  say student["name"] + " can try again."
end

for score in scores
  say double(score)
end
