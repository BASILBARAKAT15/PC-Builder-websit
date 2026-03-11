window.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('loggedInUser');
    if (!user) {
        showNotification('Please login first', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1000);
        return;
    }
    loadProfile();
});

function loadProfile() {
    const username = localStorage.getItem('loggedInUser');
    const role = localStorage.getItem('userRole') || 'user';
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const currentUser = users.find(u => u.username === username);
    const orders = (JSON.parse(localStorage.getItem('orders')) || []).filter(o => o.username === username);
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);

    document.getElementById('profileName').textContent = username;
    document.getElementById('profileRole').textContent = role === 'admin' ? 'Administrator' : 'Member';
    document.getElementById('statOrders').textContent = orders.length;
    document.getElementById('statWishlist').textContent = wishlist.length;
    document.getElementById('statSpent').textContent = '$' + totalSpent.toLocaleString();

    if (currentUser) {
        document.getElementById('editUsername').value = currentUser.username;
        document.getElementById('editEmail').value = currentUser.email;
    }

    const container = document.getElementById('profileOrders');
    if (orders.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">No orders yet</p>';
    } else {
        container.innerHTML = orders.slice().reverse().map(o => `
            <div class="order-card">
                <div class="order-card-info">
                    <h3>Order #${String(o.id).slice(-6)}</h3>
                    <p>${o.items.length} items — ${new Date(o.date).toLocaleDateString()}</p>
                </div>
                <div style="text-align:right;">
                    <strong style="color:var(--primary);">$${o.total.toLocaleString()}</strong><br>
                    <span class="badge badge-${o.status.toLowerCase()}" style="margin-top:4px;display:inline-block;">${o.status}</span>
                    <button class="btn-sm btn-sm-primary" onclick="trackOrder('${o.id}')" style="margin-left:6px;">Track</button>
                </div>
            </div>
        `).join('');
    }
}

function saveProfile() {
    const username = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const index = users.findIndex(u => u.username === username);

    if (index === -1) { showNotification('User not found', 'error'); return; }

    const newName = document.getElementById('editUsername').value.trim();
    const newEmail = document.getElementById('editEmail').value.trim();
    const newPass = document.getElementById('editPassword').value.trim();

    if (!newName || !newEmail) { showNotification('Name and email are required', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { showNotification('Invalid email', 'error'); return; }

    if (newName !== username && users.some(u => u.username === newName)) {
        showNotification('Username already taken', 'error'); return;
    }
    if (newEmail !== users[index].email && users.some(u => u.email === newEmail)) {
        showNotification('Email already registered', 'error'); return;
    }

    users[index].username = newName;
    users[index].email = newEmail;
    if (newPass && newPass.length >= 6) users[index].password = newPass;

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('loggedInUser', newName);

    showNotification('Profile updated!', 'success');
    setTimeout(() => loadProfile(), 500);
}

function trackOrder(orderId) {
    window.location.href = `order-tracking.html?id=${orderId}`;
}

window.saveProfile = saveProfile;
window.trackOrder = trackOrder;
