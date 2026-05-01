// ==========================
// signup.js — PHP Backend
// ==========================

const signupForm = document.getElementById('signup-form');

window.addEventListener('DOMContentLoaded', () => {
    signupForm.addEventListener('submit', handleSignup);
    addPasswordToggle();
});

async function handleSignup(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username.length < 3) {
        showNotification('Username must be at least 3 characters', 'error'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showNotification('Please enter a valid email', 'error'); return;
    }
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error'); return;
    }

    const btn = signupForm.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Creating account...'; }

    try {
        await API.auth.signup(username, email, password);
        showNotification('Account created successfully!', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    } catch (err) {
        if (btn) { btn.disabled = false; btn.textContent = 'Sign Up'; }
        showNotification(err.message || 'Signup failed', 'error');
    }
}

function addPasswordToggle() {
    const pwd = document.getElementById('password');
    if (!pwd) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '👁️';
    btn.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:18px;cursor:pointer;opacity:0.6;';
    btn.addEventListener('click', () => {
        pwd.type = pwd.type === 'password' ? 'text' : 'password';
        btn.textContent = pwd.type === 'password' ? '👁️' : '🙈';
    });
    pwd.parentElement.style.position = 'relative';
    pwd.parentElement.appendChild(btn);
}
