const quizData = [
  {
    question: "What is the purpose of the Banker's Algorithm?",
    options: [
      "Avoid deadlock by ensuring safe state",
      "Handle page faults",
      "Schedule CPU jobs",
      "Control user authentication"
    ],
    answer: 0
  },
  {
    question: "Which one is NOT a deadlock prevention method?",
    options: [
      "Mutual Exclusion",
      "Circular Wait",
      "Preemption",
      "All resource allocation at once"
    ],
    answer: 1
  },
  {
    question: "What does a Mutex ensure?",
    options: [
      "Page replacement",
      "Disk access speed",
      "Mutual exclusion in critical sections",
      "High CPU utilization"
    ],
    answer: 2
  },
  {
    question: "Peterson’s algorithm is used for:",
    options: [
      "Memory allocation",
      "Process synchronization",
      "Deadlock avoidance",
      "File locking"
    ],
    answer: 1
  },
  {
    question: "Producer-Consumer problem uses which concept?",
    options: [
      "Paging",
      "File System",
      "Synchronization",
      "Interrupt handling"
    ],
    answer: 2
  },
  {
    question: "Weighted Graphs in OS are used for:",
    options: [
      "Deadlock detection",
      "Process control",
      "Resource allocation models",
      "Signal handling"
    ],
    answer: 2
  },
  {
    question: "Which condition must hold for a deadlock to occur?",
    options: [
      "Spooling",
      "Hold and wait",
      "Multi-threading",
      "Segmentation"
    ],
    answer: 1
  },
  {
    question: "Which synchronization tool is used in Producer-Consumer problem?",
    options: [
      "Mutex and Semaphores",
      "Fork",
      "Thread Join",
      "Signal"
    ],
    answer: 0
  },
  {
    question: "Which of the following is a necessary condition for deadlock?",
    options: [
      "Spooling",
      "Starvation",
      "No Preemption",
      "Preemption"
    ],
    answer: 2
  },
  {
    question: "Which graph is used in deadlock detection for multiple instances of resources?",
    options: [
      "Resource Allocation Graph",
      "Wait-for Graph",
      "Directed Acyclic Graph",
      "Scheduling Tree"
    ],
    answer: 0
  }
];

let currentQuestion = 0;
let score = 0;
let attempted = 0;
// Use an array to track user selections for review later, -1 means not answered
let userAnswers = new Array(quizData.length).fill(-1); 

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const scoreEl = document.getElementById("score");
const totalEl = document.getElementById("total");
const outputEl = document.getElementById("output");
const quizBox = document.getElementById("quiz-box");
const attemptedEl = document.getElementById("attempted");
const skippedEl = document.getElementById("skipped");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const skipBtn = document.getElementById("skip");
const submitBtn = document.getElementById("submit");

function loadQuestion(index) {
  const q = quizData[index];
  questionEl.textContent = `Q${index + 1}. ${q.question}`;
  optionsEl.innerHTML = "";
  q.options.forEach((opt, i) => {
    const li = document.createElement("li");
    li.textContent = opt;
    // Highlight the selected answer if the user comes back to this question
    if (userAnswers[index] === i) {
        li.classList.add("selected");
    }
    li.onclick = () => checkAnswer(i);
    optionsEl.appendChild(li);
  });
  updateNavigationButtons();
}

/**
 * Handles the logic when a user selects an answer.
 */
function checkAnswer(selected) {
  // Only process if the question hasn't been answered before
  if (userAnswers[currentQuestion] === -1) {
    attempted++;
  }
  userAnswers[currentQuestion] = selected; // Store user's choice
  moveToNextQuestion();
}

/**
 * Unified logic to move to the next question or show the result.
 * This is now used by Next, Skip, and after answering a question.
 */
function moveToNextQuestion() {
  currentQuestion++;
  if (currentQuestion < quizData.length) {
    loadQuestion(currentQuestion);
  } else {
    showResult();
  }
}

/**
 * Updates the visibility of navigation buttons based on the current question.
 */
function updateNavigationButtons() {
  prevBtn.disabled = currentQuestion === 0;
  
  if (currentQuestion === quizData.length - 1) {
    nextBtn.style.display = "none";
    skipBtn.style.display = "none";
    submitBtn.style.display = "inline-block";
  } else {
    nextBtn.style.display = "inline-block";
    skipBtn.style.display = "inline-block";
    submitBtn.style.display = "none";
  }
}

/**
 * Calculates the score and displays the final result screen.
 */
function showResult() {
  quizBox.style.display = "none";
  outputEl.style.display = "block";

  // Recalculate score from scratch based on final answers
  score = 0;
  for (let i = 0; i < quizData.length; i++) {
      if (userAnswers[i] === quizData[i].answer) {
          score++;
      }
  }
  
  const skippedCount = userAnswers.filter(answer => answer === -1).length;

  scoreEl.textContent = score;
  totalEl.textContent = quizData.length;
  attemptedEl.textContent = quizData.length - skippedCount;
  skippedEl.textContent = skippedCount;
}

function restartQuiz() {
  currentQuestion = 0;
  score = 0;
  attempted = 0;
  userAnswers.fill(-1);
  quizBox.style.display = "block";
  outputEl.style.display = "none";
  loadQuestion(currentQuestion);
}

// --- Event Listeners ---
prevBtn.onclick = () => {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion(currentQuestion);
    }
};

// Next and Skip now share the same logic
nextBtn.onclick = moveToNextQuestion;
skipBtn.onclick = moveToNextQuestion;

// Submit button also uses this logic to finalize the quiz
submitBtn.onclick = moveToNextQuestion;

// Initial load
loadQuestion(currentQuestion);