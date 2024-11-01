<template>
  <div class="quiz-app">
    <div class="quiz-container">
      <div v-if="!quizStarted" class="welcome-screen">
        <img src="@/assets/logo.png" alt="Turkish Club Logo" class="logo" />
        <h2 class="app-title1">Турецкий клуб НИУ ВШЭ</h2>
        <h2 class="app-title2"><b>Викторина ко Дню народного единства 2024</b> - Unity Day 2024 Quiz</h2>
        <p><b>1. У вас будет только 10 секунд на каждый вопрос.</b> - You will have only 10 seconds per each question.</p> 
        <p><b>2. Вы не можете выбрать ни один вариант, как только время истечет.</b> - You can't select any option once time goes off.</p> 
        <p><b>3. Вы получите очки в зависимости от ваших правильных ответов и общего времени.</b> - You'll get points on the basis of your correct answers and your total time.</p>

        <button 
          @click="startQuiz" 
          class="start-button" 
          :disabled="!canStartQuiz" 
          :class="{ 'disabled-button': !canStartQuiz }"
        >
          <i class="icon-play"></i> 
          <span v-if="!canStartQuiz"><b>Викторину начнет модератор.</b> - The quiz will be started by the moderator.</span>
<span v-else><b>Начать викторину</b> - Start Quiz</span>

        </button>



        <div class="leaderboard">
          <h2 class="leaderboard-title">
            <i class="icon-trophy"></i> Лучшие бомбардиры - Top Scores
          </h2>
          <ul class="leaderboard-list">
            <li v-for="(entry, index) in leaderboard" :key="entry.id" class="leaderboard-item">
              <span class="leaderboard-rank">{{ index + 1 }}</span>
              <span class="leaderboard-name">{{ entry.name }}</span>
              <span class="leaderboard-score">{{ entry.score }} баллов</span>&nbsp;&nbsp;
              <span class="leaderboard-time">
                {{ entry.time_spent }}s <i class="icon-clock"></i>
              </span>
            </li>
          </ul>
        </div>



      </div>

      <div v-else-if="currentQuestionIndex < questions.length" class="question-screen">
        <div class="question-header">
          <div class="question-progress">
            <i class="icon-list"></i> {{ currentQuestionIndex + 1 }} / {{ questions.length }}
          </div>
          <div class="timer">
            <i class="icon-clock"></i> {{ timeLeft }} с
          </div>
        </div>
        <h2 class="question-text">{{ currentQuestion.question }}</h2>
        <ul class="answer-list">
          <li v-for="(answer, index) in currentQuestion.answers" :key="index">
            <button 
              @click="checkAnswer(answer.isCorrect)" 
              class="answer-button"
              :class="{ 'selected': selectedAnswer === index }"
            >
              {{ answer.text }}
            </button>
          </li>
        </ul>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${(timeLeft / 10) * 100}%` }"></div>
        </div>
      </div>

      <div v-else class="result-screen">
        <h2 class="result-title">Тест завершен! - Quiz Completed!</h2>
        <div class="result-score">
          <i class="icon-star"></i> {{ score }} / {{ questions.length }}
        </div>
        <p class="result-time">
  <i class="icon-clock"></i> <b>Время: {{ totalTime }} секунд</b> - Time: {{ totalTime }} seconds
</p>


<p class="result-time">
  <b>Чтобы получить свой приз, пожалуйста, не вводите случайное имя!</b> - To claim your prize, please don't type a random name!
</p>

        <input 
          v-model="name" 
          type="text" 
          placeholder="Введите ваше имя - Enter your name" 
          class="name-input"
        >
        <div v-if="isSubmitting" class="submitting-view">
          <i class="icon-spinner animate-spin"></i> Submitting your score...
        </div>
        <button 
          @click="saveScore" 
          class="save-button" 
          :class="{ 'disabled-button': scoreSubmitted }" 
          :disabled="!name || scoreSubmitted"
        >
          <i class="icon-save"></i>  <b>Сохранить результат</b> &nbsp;- Save Score
        </button>

        <button @click="replayQuiz" class="replay-button">
          <i class="icon-refresh"></i> <b>Таблица лидеров</b> &nbsp;- Leaderboard
        </button>
      </div>





    </div>




    <div v-if="!quizStarted">
    <a href="https://github.com/ilteris1/Nuxt-Quiz-App" target="_blank" rel="noopener noreferrer" class="github-button">
          <GithubIcon class="github-icon" />
          Get the codes of this project on GitHub
        </a>
      </div>
  </div>


  
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { supabase } from '@/data/supabaseClient';
import { GithubIcon } from 'lucide-vue-next';

const questions = ref([
  {
    question: "Какой город является столицей Турции? - What is the capital city of Türkiye?",
    answers: [
      { text: "Стамбул - Istanbul", isCorrect: false },
      { text: "Измир - Izmir", isCorrect: false },
      { text: "Анкара - Ankara", isCorrect: true },
      { text: "Анталия - Antalya", isCorrect: false },
    ],
  },
  {
    question: "Сколько стран имеет границы с Турцией? - How many countries does Türkiye have land borders with?",
    answers: [
      { text: "4", isCorrect: false },
      { text: "6", isCorrect: false },
      { text: "8", isCorrect: true },
      { text: "10", isCorrect: false },
    ],
  },
]);



const currentQuestionIndex = ref(0);
const score = ref(0);
const timeLeft = ref(10);
const totalTime = ref(0);
const quizStarted = ref(false);
const name = ref('');
const startTime = ref(null);
const scoreSubmitted = ref(false);
const selectedAnswer = ref(null);
const leaderboard = ref([]);

const quizOpen = ref(false); // Initialize the variable


let timer = null;

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);

const fetchQuizOpenState = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('quizopen')
    .single();

  if (error) {
    console.error('Error fetching quiz state:', error);
    return;
  }

  quizOpen.value = data.quizopen; // Update quizOpen state from Supabase
};


const POLLING_INTERVAL = 5000; // 5 seconds

onMounted(() => {
  fetchLeaderboard();
  fetchQuizOpenState();
  setInterval(fetchQuizOpenState, POLLING_INTERVAL); // Check the quiz state every 5 seconds
  setInterval(fetchLeaderboard, POLLING_INTERVAL); // Check the leaderboard every 5 seconds
});

// Check if the quiz can be started based on the quizOpen state
const canStartQuiz = computed(() => quizOpen.value);

const startQuiz = () => {
  if (!canStartQuiz.value) {
    alert("The quiz is currently closed."); // Optional: Inform the user
    return; // Prevent starting the quiz if not open
  }
  // Existing logic...
  quizStarted.value = true;
  currentQuestionIndex.value = 0;
  score.value = 0;
  timeLeft.value = 10;
  startTime.value = Date.now();
  totalTime.value = 0;
  scoreSubmitted.value = false;
  startTimer();
};


const startTimer = () => {
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      nextQuestion();
    }
  }, 1000);
};

const checkAnswer = (isCorrect) => {
  if (isCorrect) {
    score.value++;
  }
  selectedAnswer.value = null; // Reset selected answer
  nextQuestion(); // Proceed to the next question
};

const nextQuestion = () => {
  currentQuestionIndex.value++;
  timeLeft.value = 10;

  if (currentQuestionIndex.value >= questions.value.length) {
    clearInterval(timer);
    totalTime.value = Math.floor((Date.now() - startTime.value) / 1000);
  }
};

const isSubmitting = ref(false); // Add this line

const saveScore = async () => {
  isSubmitting.value = true; // Show loading state
  const { data, error } = await supabase
    .from('leaderboard')
    .insert([{ score: score.value, time_spent: totalTime.value, name: name.value }]);

  isSubmitting.value = false; // Hide loading state

  if (error) console.error(error);
  else {
    console.log('Score saved:', data);
    scoreSubmitted.value = true; // Disable the button after submitting
    fetchLeaderboard(); // Fetch the leaderboard again
  }
};


const replayQuiz = () => {
  quizStarted.value = false;
  currentQuestionIndex.value = 0;
  score.value = 0;
  timeLeft.value = 10;
  totalTime.value = 0;
  startTime.value = null;
  scoreSubmitted.value = false;
  selectedAnswer.value = null;
};

const fetchLeaderboard = async () => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*');

  if (data) {
    leaderboard.value = data
      .sort((a, b) => {
        // First, sort by score (descending)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // If scores are the same, sort by time_spent (ascending)
        return a.time_spent - b.time_spent;
      });
  } else {
    console.error(error);
  }
};

onBeforeUnmount(() => {
  clearInterval(timer);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');



.logo {
  display: block;
  margin: 0 auto; /* Center the logo */
  max-width: 50%; /* Ensure it doesn't overflow */
  height: auto; /* Maintain aspect ratio */
  margin-bottom: 1rem; /* Space below the logo */
}

.quiz-app {
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(135deg, #40e0d0, #2a5298);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #333;
  padding: 1.5rem;
}

.quiz-container {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.app-title1 {
  font-size: 1.5em;
  color: #40e0d0;
  text-align: center;
  font-weight: 700;
  margin-bottom: -0.5em;
}

.app-title2 {
  font-size: 1em;
  color: #40e0d0;
  text-align: center;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.app-subtitle {
  font-size: 1rem;
  color: #666;
  text-align: center;
  margin-bottom: 2rem;
}



.github-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #171815;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  font-size: 0.8rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 89%;
  margin-top: 2em;
  text-decoration: none;
}

.github-button:hover {
  background-color: #2c3238;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.github-icon {
  margin-right: 0.5rem;
}





.start-button, .answer-button, .save-button, .replay-button {
  background-color: #40e0d0;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.start-button:hover, .answer-button:hover, .save-button:hover, .replay-button:hover {
  background-color: #2a5298;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(30, 60, 114, 0.2);
}

.leaderboard {
  margin-top: 2rem;
  background-color: #f8f9fa;
  border-radius: 15px;
  padding: 1rem;
}

.leaderboard-title {
  font-size: 1.2rem;
  color: #40e0d0;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.leaderboard-list {
  list-style-type: none;
  padding: 0;
}

.leaderboard-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.leaderboard-rank {
  font-weight: bold;
  color: #40e0d0;
  width: 30px;
  height: 30px;
  background-color: #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.leaderboard-name {
  flex-grow: 1;
  margin-left: 1rem;
}

.leaderboard-score, .leaderboard-time {
  font-size: 0.9rem;
  color: #6c757d;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.question-text {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #40e0d0;
  font-weight: 600;
}

.answer-list {
  list-style-type: none;
  padding: 0;
}

.answer-button {
  text-align: left;
  background-color: #f8f9fa;
  color: #333;
  margin-bottom: 0.75rem;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.answer-button:hover {
  background-color: #e9ecef;
}

.answer-button.selected {
  background-color: #40e0d0;
  color: white;
}

.progress-bar {
  height: 6px;
  background-color: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  background-color: #40e0d0;
  transition: width 1s linear;
}

.result-title {
  font-size: 1.5rem;
  color: #40e0d0;
  text-align: center;
  margin-bottom: 1rem;
  font-weight: 700;
}

.result-score {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
  color: #40e0d0;
  font-weight: 700;
}

.result-time {
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #6c757d;
}

.name-input {
  width: 93%;
  padding: 0.8rem;
  font-size: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 50px;
  margin-bottom: 1rem;
  transition: border-color 0.3s ease;
}

.name-input:focus {
  outline: none;
  border-color: #40e0d0;
}

.submitting-view {
  font-size: 1rem;
  color: #6c757d;
  text-align: center;
  margin-top: 1rem;
}

.disabled-button {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .quiz-container {
    padding: 1rem;
  }

  .app-title {
    font-size: 1.75rem;
  }

  .question-text {
    font-size: 1.1rem;
  }

  .result-score {
    font-size: 2.5rem;
  }
}

/* Icon styles */
[class^="icon-"], [class*=" icon-"] {
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  margin-right: 0.5rem;
}

.icon-play:before { content: '\f04b'; }

.icon-trophy:before { content: '\f091'; }
.icon-clock:before { content: '\f017'; }
.icon-list:before { content: '\f03a'; }
.icon-star:before { content: '\f005'; }
.icon-save:before { content: '\f0c7'; }
.icon-refresh:before { content: '\f021'; }
.icon-spinner:before { content: '\f110'; }

.icon-play,
.icon-trophy,
.icon-clock,
.icon-list,
.icon-star,
.icon-spinner,
.icon-save,
.icon-refresh {
  font-style: normal; /* Ensure icons are not italicized */
}


.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
