import { LOGIN_URL } from './config.js';

const form = document.getElementById('loginForm');
const err = document.getElementById('error');

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  err.textContent = '';
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try{
    const res = await fetch(LOGIN_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username, password})
    });
    if (!res.ok) {
      err.textContent = 'Credenciales inválidas';
      return;
    }
    const data = await res.json();
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    // redirect
    window.location.href = 'dashboard.html';
  }catch(err){
    err.textContent = 'Error de conexión';
  }
});
