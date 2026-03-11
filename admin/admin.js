
function checkAdminAccess() {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
        alert('Access denied! Admin only.');
        window.location.href = '../HTMLPage/login.html';
    }
}

function adminLogout() {
    if (confirm('Logout from admin panel?')) {
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('userRole');
        window.location.href = '../HTMLPage/login.html';
    }
}

function toggleSidebar() {
    document.getElementById('adminSidebar').classList.toggle('open');
}

function loadDashboard() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    const coupons = JSON.parse(localStorage.getItem('adminCoupons')) || getDefaultCoupons();

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-value">${orders.length}</div>
                <div class="stat-label">Total Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-value">$${totalRevenue.toLocaleString()}</div>
                <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-value">${users.length}</div>
                <div class="stat-label">Registered Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🛍️</div>
                <div class="stat-value">${products.length}</div>
                <div class="stat-label">Products</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🎟️</div>
                <div class="stat-value">${coupons.length}</div>
                <div class="stat-label">Active Coupons</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-value">${orders.filter(o => o.status === 'Delivered').length}</div>
                <div class="stat-label">Delivered Orders</div>
            </div>
        `;
    }

    const recentOrders = document.getElementById('recentOrders');
    if (recentOrders) {
        const last5 = orders.slice(-5).reverse();
        if (last5.length === 0) {
            recentOrders.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">No orders yet</td></tr>';
        } else {
            recentOrders.innerHTML = last5.map(o => `
                <tr>
                    <td>#${String(o.id).slice(-6)}</td>
                    <td>${o.username}</td>
                    <td>$${o.total.toLocaleString()}</td>
                    <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
                    <td>${new Date(o.date).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }
    }

    const recentUsers = document.getElementById('recentUsers');
    if (recentUsers) {
        const last5u = users.slice(-5).reverse();
        recentUsers.innerHTML = last5u.map(u => `
            <tr>
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-${u.role || 'user'}">${u.role || 'user'}</span></td>
            </tr>
        `).join('');
    }
}

function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const tbody = document.getElementById('ordersTableBody');
    const count = document.getElementById('orderCount');

    if (count) count.textContent = `${orders.length} orders`;

    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary);">No orders yet</td></tr>';
        return;
    }

    tbody.innerHTML = orders.slice().reverse().map((o, i) => `
        <tr>
            <td>#${String(o.id).slice(-6)}</td>
            <td>${o.username}</td>
            <td>${o.items ? o.items.length : 0} items</td>
            <td>$${o.total.toLocaleString()}</td>
            <td>${new Date(o.date).toLocaleDateString()}</td>
            <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
            <td>
                <select onchange="updateOrderStatus(${orders.length - 1 - i}, this.value)" style="padding:6px;border-radius:6px;border:1px solid var(--border-input);font-size:12px;background:var(--bg-input);color:var(--text-primary);">
                    <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Paid" ${o.status === 'Paid' ? 'selected' : ''}>Paid</option>
                    <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
                <button class="btn-sm btn-sm-danger" onclick="deleteOrder(${orders.length - 1 - i})" style="margin-left:6px;">Delete</button>
            </td>
        </tr>
    `).join('');
}

function updateOrderStatus(index, status) {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    if (orders[index]) {
        orders[index].status = status;
        localStorage.setItem('orders', JSON.stringify(orders));
        showNotification(`Order status updated to ${status}`, 'success');
        loadOrders();
    }
}

function deleteOrder(index) {
    if (!confirm('Delete this order?')) return;
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.splice(index, 1);
    localStorage.setItem('orders', JSON.stringify(orders));
    showNotification('Order deleted', 'info');
    loadOrders();
}

function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const tbody = document.getElementById('usersTableBody');
    const count = document.getElementById('userCount');

    if (count) count.textContent = `${users.length} users`;

    if (!tbody) return;

    tbody.innerHTML = users.map((u, i) => `
        <tr>
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td><span class="badge badge-${u.role || 'user'}">${u.role || 'user'}</span></td>
            <td>
                ${u.role === 'admin' ? '<span style="color:var(--text-secondary);font-size:12px;">Protected</span>' :
                `<button class="btn-sm btn-sm-danger" onclick="deleteUser(${i})">Delete</button>`}
            </td>
        </tr>
    `).join('');
}

function deleteUser(index) {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    if (users[index].role === 'admin') {
        showNotification('Cannot delete admin account', 'error');
        return;
    }
    if (!confirm(`Delete user "${users[index].username}"?`)) return;
    users.splice(index, 1);
    localStorage.setItem('users', JSON.stringify(users));
    showNotification('User deleted', 'info');
    loadUsers();
}

function loadProducts() {
    const products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    const tbody = document.getElementById('productsTableBody');
    const count = document.getElementById('productCount');

    if (count) count.textContent = `${products.length} products`;

    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);">No custom products added yet. Products on the store pages are built into the HTML.</td></tr>';
        return;
    }

    tbody.innerHTML = products.map((p, i) => `
        <tr>
            <td>${p.name}</td>
            <td>$${p.price.toLocaleString()}</td>
            <td>${p.category}</td>
            <td>
                <button class="btn-sm btn-sm-danger" onclick="deleteProduct(${i})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function addProduct() {
    const name = document.getElementById('prodName').value.trim();
    const price = parseInt(document.getElementById('prodPrice').value);
    const category = document.getElementById('prodCategory').value;

    if (!name || !price || !category) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    let products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    products.push({ name, price, category, addedAt: new Date().toISOString() });
    localStorage.setItem('adminProducts', JSON.stringify(products));

    document.getElementById('prodName').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodCategory').value = '';

    showNotification(`${name} added successfully`, 'success');
    loadProducts();
}

function deleteProduct(index) {
    if (!confirm('Delete this product?')) return;
    let products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    products.splice(index, 1);
    localStorage.setItem('adminProducts', JSON.stringify(products));
    showNotification('Product deleted', 'info');
    loadProducts();
}

function getDefaultCoupons() {
    return [
        { code: 'SAVE10', discount: 10 },
        { code: 'SAVE20', discount: 20 },
        { code: 'WELCOME', discount: 15 },
        { code: 'PCBUILDER', discount: 25 },
    ];
}

function loadCoupons() {
    let coupons = JSON.parse(localStorage.getItem('adminCoupons'));
    if (!coupons) {
        coupons = getDefaultCoupons();
        localStorage.setItem('adminCoupons', JSON.stringify(coupons));
    }

    const tbody = document.getElementById('couponsTableBody');
    const count = document.getElementById('couponCount');

    if (count) count.textContent = `${coupons.length} coupons`;

    if (!tbody) return;

    tbody.innerHTML = coupons.map((c, i) => `
        <tr>
            <td><strong>${c.code}</strong></td>
            <td>${c.discount}% off</td>
            <td>
                <button class="btn-sm btn-sm-danger" onclick="deleteCoupon(${i})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function addCoupon() {
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const discount = parseInt(document.getElementById('couponDiscount').value);

    if (!code || !discount || discount < 1 || discount > 100) {
        showNotification('Please enter a valid code and discount (1-100%)', 'error');
        return;
    }

    let coupons = JSON.parse(localStorage.getItem('adminCoupons')) || getDefaultCoupons();

    if (coupons.some(c => c.code === code)) {
        showNotification('This coupon code already exists', 'error');
        return;
    }

    coupons.push({ code, discount });
    localStorage.setItem('adminCoupons', JSON.stringify(coupons));

    document.getElementById('couponCode').value = '';
    document.getElementById('couponDiscount').value = '';

    showNotification(`Coupon ${code} added (${discount}% off)`, 'success');
    loadCoupons();
}

function deleteCoupon(index) {
    if (!confirm('Delete this coupon?')) return;
    let coupons = JSON.parse(localStorage.getItem('adminCoupons')) || [];
    coupons.splice(index, 1);
    localStorage.setItem('adminCoupons', JSON.stringify(coupons));
    showNotification('Coupon deleted', 'info');
    loadCoupons();
}

window.checkAdminAccess = checkAdminAccess;
window.adminLogout = adminLogout;
window.toggleSidebar = toggleSidebar;
window.loadDashboard = loadDashboard;
window.loadOrders = loadOrders;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrder = deleteOrder;
window.loadUsers = loadUsers;
window.deleteUser = deleteUser;
window.loadProducts = loadProducts;
window.addProduct = addProduct;
window.deleteProduct = deleteProduct;
window.loadCoupons = loadCoupons;
window.addCoupon = addCoupon;
window.deleteCoupon = deleteCoupon;

console.log('🔒 Admin Panel JS loaded');
