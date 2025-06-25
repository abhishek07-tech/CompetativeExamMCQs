let allQuestions = [];
let filteredQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = [];
let timer;
let timeLeft = 30;

fetch("all_questions.json")
  .then(res => res.json())
  .then(data => {
    allQuestions = data;
    initDarkMode();
    filterByCategory();
  });

function initDarkMode() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.body.classList.add("dark");
    document.getElementById("themeToggle").checked = true;
  }
}

function toggleDarkMode(el) {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", el.checked ? "dark" : "light");
}

function filterByCategory() {
  const selected = document.getElementById("categoryFilter").value;
  filteredQuestions = selected === "All"
    ? shuffleArray([...allQuestions])
    : shuffleArray([...allQuestions.filter(q => q.category === selected)]);
  currentIndex = 0;
  score = 0;
  answered = [];
  loadQuestion(currentIndex);
  updateScoreDisplay();
}

function loadQuestion(index) {
  if (index < 0 || index >= filteredQuestions.length) return;
  clearInterval(timer);
  timeLeft = 30;

  const form = document.getElementById("quizForm");
  form.innerHTML = "";

  const q = filteredQuestions[index];
  const answeredBefore = answered.find(a => a.index === index);

  const questionBlock = document.createElement("div");
  questionBlock.classList.add("question");

  const qTitle = document.createElement("p");
  qTitle.textContent = `${index + 1}. ${q.question}`;
  questionBlock.appendChild(qTitle);

  const optionsDiv = document.createElement("div");
  optionsDiv.classList.add("options");

  q.options.forEach((opt, i) => {
    const letter = String.fromCharCode(97 + i) + ") ";
    const isSelected = answeredBefore && answeredBefore.selected === opt;
    const label = document.createElement("label");
    label.innerHTML = `
<input type="radio" name="q${index}" value="${opt}" ${isSelected ? "checked" : ""} ${answeredBefore ? "disabled" : ""} onchange="checkAnswer(${index}, this)">
      
      ${letter}${opt}
    `;
    optionsDiv.appendChild(label);
    optionsDiv.appendChild(document.createElement("br"));
  });

  const feedback = document.createElement("div");
  feedback.id = `feedback${index}`;
  feedback.className = "feedback";
  if (answeredBefore) {
    feedback.textContent = answeredBefore.isCorrect ? "✅ Correct!" : `❌ Wrong! Correct Answer: ${answeredBefore.correct}`;
    feedback.style.color = answeredBefore.isCorrect ? "green" : "red";
  }

  const timerDiv = document.createElement("div");
  timerDiv.id = "timer";
  timerDiv.textContent = `⏳ Time left: ${timeLeft}s`;

  timer = setInterval(() => {
    timeLeft--;
    timerDiv.textContent = `⏳ Time left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      currentIndex++;
      loadQuestion(currentIndex);
    }
  }, 1000);

  const navDiv = document.createElement("div");
  navDiv.className = "nav-buttons";

  const backBtn = document.createElement("button");
  backBtn.textContent = "← Back";
  backBtn.onclick = () => {
    currentIndex--;
    loadQuestion(currentIndex);
  };
  backBtn.disabled = currentIndex === 0;

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next →";
  nextBtn.onclick = () => {
    currentIndex++;
    loadQuestion(currentIndex);
  };
  nextBtn.disabled = currentIndex >= filteredQuestions.length - 1;

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit Quiz";
  submitBtn.onclick = showScore;

  navDiv.appendChild(backBtn);
  navDiv.appendChild(submitBtn);
  navDiv.appendChild(nextBtn);

  questionBlock.appendChild(optionsDiv);
  questionBlock.appendChild(feedback);
  form.appendChild(timerDiv);
  form.appendChild(questionBlock);
  form.appendChild(navDiv);
}

function checkAnswer(index, input) {
  const selected = input.value;
  const correct = filteredQuestions[index].answer;
  const feedback = document.getElementById(`feedback${index}`);

  let existing = answered.find(a => a.index === index);
  const wasCorrect = existing ? existing.isCorrect : false;

  const isCorrectNow = selected === correct;
  if (!existing) {
    answered.push({
      index,
      question: filteredQuestions[index].question,
      selected,
      correct,
      isCorrect: isCorrectNow
    });
    if (isCorrectNow) score++;
  } else {
    if (existing.selected !== selected) {
      if (wasCorrect && !isCorrectNow) score--;
      if (!wasCorrect && isCorrectNow) score++;
      existing.selected = selected;
      existing.isCorrect = isCorrectNow;
    }
  }

  feedback.textContent = isCorrectNow ? "✅ Correct!" : `❌ Wrong! Correct Answer: ${correct}`;
  feedback.style.color = isCorrectNow ? "green" : "red";

  updateScoreDisplay();
  clearInterval(timer);
}

function updateScoreDisplay() {
  const resultDiv = document.getElementById("result");
  resultDiv.textContent = `Your score: ${score} / ${filteredQuestions.length}`;
}

function showScore() {
  clearInterval(timer);
  const form = document.getElementById("quizForm");
  form.innerHTML = "";
  document.getElementById("result").textContent = `🎉 Final Score: ${score} / ${filteredQuestions.length}`;

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download My Answers";
  downloadBtn.onclick = () => {
    const blob = new Blob([JSON.stringify(answered, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "my_answers.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  form.appendChild(downloadBtn);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

