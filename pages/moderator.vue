<template>
    <div class="moderator-container">
      <h2>Moderatör</h2>
      <input type="password" v-model="password" placeholder="Enter Password" />
      <button @click="authenticate" class="auth-button">Enter</button>
  
      <div v-if="authenticated">
        <h2>Kontrol</h2>
        <button @click="toggleQuiz" class="toggle-button">
          {{ quizOpen ? 'Close Quiz' : 'Start Quiz' }}
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { supabase } from '@/data/supabaseClient'; // Adjust the import path if needed
  
  const password = ref('');
  const authenticated = ref(false);
  const quizOpen = ref(false); // Track if the quiz is open
  
  const authenticate = async () => {
    // Fetch the first row of the settings table from Supabase
    const { data: settings, error } = await supabase
      .from('settings')
      .select('moderatorpassword, quizopen')
      .limit(1)
      .single(); // Use .single() to ensure we only get one row
  
    if (error) {
      alert('Error fetching settings: ' + error.message);
      return;
    }
  
    // Ensure we have data
    if (!settings) {
      alert('No settings found');
      return;
    }
  
    // Check if the password matches
    if (password.value === settings.moderatorpassword) {
      authenticated.value = true;
      quizOpen.value = settings.quizopen; // Set quizOpen based on fetched data
    } else {
      alert('Incorrect password');
    }
  };
  
  const toggleQuiz = async () => {
    quizOpen.value = !quizOpen.value;
  
    const { error } = await supabase
      .from('settings')
      .update({ quizopen: quizOpen.value })
      .eq('id', 1); // Assuming there's only one row, adjust as necessary
  
    if (error) {
      console.error('Error updating quiz state:', error);
    }
  };
  </script>
  
  <style scoped>
  .moderator-container {
    text-align: center;
  }
  .auth-button,
  .toggle-button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #40e0d0;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  </style>
  