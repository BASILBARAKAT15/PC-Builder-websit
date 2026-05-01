// ==========================
// login.js — PHP Backend
// ==========================

const loginForm     = document.getElementById('login-form');
const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');

window.addEventListener('DOMContentLoaded', () => {
    checkAlreadyLoggedIn();
    loginForm.addEventListener('submit', handleLogin);
    addPasswordToggle();
});

async function checkAlreadyLoggedIn() {
    try {
        const data = await API.auth.me();
        if (data.loggedIn) {
            const role = data.user.role;
            localStorage.setItem('loggedInUser', data.user.username);
            localStorage.setItem('userRole', role);
            if (confirm(`You're already logged in as ${data.user.username}. Continue?`)) {
                window.location.href = role === 'admin'
                    ? '../admin/dashboard.html'
                    : 'index.html';
            } else {
                try { await API.auth.logout(); } catch {}
                localStorage.removeItem('loggedInUser');
                localStorage.removeItem('userRole');
            }
        }
    } catch {}
}

async function handleLogin(e) {
    e.preventDefault();

    const email    = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showNotification('Please enter a valid email', 'error');
        return;
    }
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    const btn = loginForm.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Logging in...'; }

    try {
        const result = await API.auth.login(email, password);

        localStorage.setItem('loggedInUser', result.username);
        localStorage.setItem('userRole', result.role);

        if (result.role === 'admin') {
            showNotification('Welcome back, Admin!', 'success');
            setTimeout(() => window.location.href = '../admin/dashboard.html', 1000);
        } else {
            showNotification(`Welcome back, ${result.username}!`, 'success');
            setTimeout(() => {
                const returnTo = localStorage.getItem('returnToCheckout');
                if (returnTo === 'true') {
                    localStorage.removeItem('returnToCheckout');
                    window.location.href = 'checkout.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);
        }
    } catch (err) {
        if (btn) { btn.disabled = false; btn.textContent = 'Log In'; }
        showNotification(err.message || 'Invalid email or password', 'error');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function addPasswordToggle() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '👁️';
    btn.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:18px;cursor:pointer;opacity:0.6;';
    btn.addEventListener('click', () => {
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
        btn.textContent = passwordInput.type === 'password' ? '👁️' : '🙈';
    });
    passwordInput.parentElement.style.position = 'relative';
    passwordInput.parentElement.appendChild(btn);
}
