const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const ADMIN_EMAIL = 'admin@pcbuilder.com';
const ADMIN_PASSWORD = 'admin123';

window.addEventListener('DOMContentLoaded', () => {
    initAdminAccount();
    checkAlreadyLoggedIn();
    loginForm.addEventListener('submit', handleLogin);
    addPasswordToggle();
});

function initAdminAccount() {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    if (!users.some(u => u.email === ADMIN_EMAIL)) {
        users.push({
            username: 'Admin',
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin'
        });
        localStorage.setItem('users', JSON.stringify(users));
    }
    const admin = users.find(u => u.email === ADMIN_EMAIL);
    if (admin && !admin.role) {
        admin.role = 'admin';
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function checkAlreadyLoggedIn() {
    const user = localStorage.getItem('loggedInUser');
    const role = localStorage.getItem('userRole');
    if (user) {
        if (confirm(`You're already logged in as ${user}. Continue?`)) {
            window.location.href = role === 'admin' ? '../admin/dashboard.html' : 'index.html';
        } else {
            localStorage.removeItem('loggedInUser');
            localStorage.removeItem('userRole');
        }
    }
}

function handleLogin(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showNotification('Please enter a valid email', 'error');
        return;
    }
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    const btn = loginForm.querySelector('.login-btn') || loginForm.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Logging in...'; }

    setTimeout(() => {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('loggedInUser', user.username);
            localStorage.setItem('userRole', user.role || 'user');

            if (user.role === 'admin') {
                showNotification(`Welcome back, Admin!`, 'success');
                setTimeout(() => {
                    window.location.href = '../admin/dashboard.html';
                }, 1200);
            } else {
                showNotification(`Welcome back, ${user.username}!`, 'success');
                setTimeout(() => {
                    const returnTo = localStorage.getItem('returnToCheckout');
                    window.location.href = returnTo === 'true' ? 'cart.html' : 'index.html';
                }, 1200);
            }
        } else {
            if (btn) { btn.disabled = false; btn.textContent = 'Log In'; }
            showNotification('Invalid email or password!', 'error');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }, 800);
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
