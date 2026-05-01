// ==========================
// profile.js — PHP Backend
// ==========================

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const me = await API.auth.me();
        if (!me.loggedIn) {
            showNotification('Please login first', 'error');
            setTimeout(() => { window.location.href = 'login.html'; }, 1000);
            return;
        }
        localStorage.setItem('loggedInUser', me.user.username);
        localStorage.setItem('userRole', me.user.role);
        loadProfile(me.user);
    } catch {
        showNotification('Please login first', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    }
});

async function loadProfile(user) {
    document.getElementById('profileName').textContent = user.username;
    document.getElementById('profileRole').textContent =
        user.role === 'admin' ? 'Administrator' : 'Member';

    document.getElementById('editUsername').value = user.username;
    document.getElementById('editEmail').value    = user.email;

    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const wEl = document.getElementById('statWishlist');
    if (wEl) wEl.textContent = wishlist.length;

    try {
        const { orders } = await API.orders.myOrders();
        const totalSpent = orders.reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
        const sO = document.getElementById('statOrders');
        const sS = document.getElementById('statSpent');
        if (sO) sO.textContent = orders.length;
        if (sS) sS.textContent = '$' + totalSpent.toLocaleString();
        renderOrders(orders);
    } catch {
        const sO = document.getElementById('statOrders');
        const sS = document.getElementById('statSpent');
        if (sO) sO.textContent = '0';
        if (sS) sS.textContent = '$0';
        renderOrders([]);
    }
}

function renderOrders(orders) {
    const container = document.getElementById('profileOrders');
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">No orders yet</p>';
        return;
    }

    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <div class="order-card-info">
                <h3>Order #${String(o.id).padStart(6, '0')}</h3>
                <p>${(o.items || []).length} items — ${new Date(o.created_at).toLocaleDateString()}</p>
            </div>
            <div style="text-align:right;">
                <strong style="color:var(--primary);">$${parseFloat(o.total_price).toLocaleString()}</strong><br>
                <span class="badge badge-${String(o.status || '').toLowerCase()}" style="margin-top:4px;display:inline-block;">${o.status}</span>
                <button class="btn-sm btn-sm-primary" onclick="trackOrder(${o.id})" style="margin-left:6px;">Track</button>
            </div>
        </div>
    `).join('');
}

async function saveProfile() {
    const newName  = document.getElementById('editUsername').value.trim();
    const newEmail = document.getElementById('editEmail').value.trim();
    const newPass  = document.getElementById('editPassword')?.value.trim() || '';

    if (!newName || !newEmail) { showNotification('Name and email are required', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { showNotification('Invalid email', 'error'); return; }

    try {
        const result = await API.users.updateProfile(newName, newEmail);
        localStorage.setItem('loggedInUser', result.username);

        if (newPass) {
            if (newPass.length < 6) {
                showNotification('New password must be at least 6 characters', 'error');
                return;
            }
            const oldPass = document.getElementById('currentPassword')?.value.trim() || '';
            if (!oldPass) {
                showNotification('Enter your current password to change it', 'error');
                return;
            }
            await API.users.changePassword(oldPass, newPass);
            document.getElementById('editPassword').value = '';
            document.getElementById('currentPassword').value = '';
        }

        showNotification('Profile updated!', 'success');
        const me = await API.auth.me();
        if (me.loggedIn) loadProfile(me.user);
    } catch (err) {
        showNotification(err.message || 'Update failed', 'error');
    }
}

function trackOrder(orderId) {
    window.location.href = `order-tracking.html?id=${orderId}`;
}

window.saveProfile = saveProfile;
window.trackOrder  = trackOrder;
