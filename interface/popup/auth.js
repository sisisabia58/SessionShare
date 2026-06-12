import { getSupabase, initSupabase } from '../lib/supabaseClient.js';
import { SessionShareConfig } from '../lib/sessionShareConfig.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Supabase (will load bundled supabase-js)
  const { createClient } = await import('../lib/vendor/supabase.min.js');
  initSupabase(createClient);

  const supabase = getSupabase();
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const errorDiv = document.getElementById('auth-error');
  const loginBtn = document.getElementById('btn-login');
  const signupBtn = document.getElementById('btn-signup');
  const formDiv = document.getElementById('auth-form');
  const loadingDiv = document.getElementById('auth-loading');

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  function showLoading(show) {
    formDiv.style.display = show ? 'none' : 'block';
    loadingDiv.style.display = show ? 'block' : 'none';
  }

  // Check if already logged in
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      window.location.href = 'cookie-list.html';
      return;
    }
  } catch (err) {
    console.error('Session retrieval failed:', err);
  }

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }

    showLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showLoading(false);
      showError(error.message);
      return;
    }

    window.location.href = 'cookie-list.html';
  });

  signupBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    showLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      showLoading(false);
      showError(error.message);
      return;
    }

    showLoading(false);
    showError(''); // clear
    formDiv.innerHTML = '<p class="auth-success">Check your email to confirm your account, then sign in.</p>';
  });
});
