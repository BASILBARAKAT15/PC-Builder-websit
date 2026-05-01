// ==========================
// admin.js — PHP Backend
// ==========================

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

async function checkAdminAccess() {
    try {
        const me = await API.auth.me();
        if (!me.loggedIn || me.user.role !== 'admin') {
            alert('Access denied! Admins only.');
            window.location.href = '../HTMLPage/login.html';
            return;
        }
        localStorage.setItem('loggedInUser', me.user.username);
        localStorage.setItem('userRole', 'admin');
    } catch {
        alert('Access denied!');
        window.location.href = '../HTMLPage/login.html';
    }
}

async function adminLogout() {
    if (!confirm('Logout from admin panel?')) return;
    try { await API.auth.logout(); } catch {}
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userRole');
    window.location.href = '../HTMLPage/login.html';
}

function toggleSidebar() {
    const s = document.getElementById('adminSidebar');
    if (s) s.classList.toggle('open');
}

// ── DASHBOARD ────────────────────────────────────────────────
async function loadDashboard() {
    try {
        const [{ orders }, { users }, { coupons }] = await Promise.all([
            API.orders.allOrders(),
            API.users.all(),
            API.coupons.all(),
        ]);

        const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
        const deliveredCount = orders.filter(o => o.status === 'delivered').length;

        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-value">${orders.length}</div><div class="stat-label">Total Orders</div></div>
                <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-value">$${totalRevenue.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div class="stat-label">Total Revenue</div></div>
                <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${users.length}</div><div class="stat-label">Registered Users</div></div>
                <div class="stat-card"><div class="stat-icon">🎟️</div><div class="stat-value">${coupons.filter(c => c.is_active).length}</div><div class="stat-label">Active Coupons</div></div>
                <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-value">${deliveredCount}</div><div class="stat-label">Delivered Orders</div></div>
            `;
        }

        const recentOrders = document.getElementById('recentOrders');
        if (recentOrders) {
            const last5 = orders.slice(0, 5);
            recentOrders.innerHTML = last5.length === 0
                ? '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">No orders yet</td></tr>'
                : last5.map(o => `
                    <tr>
                        <td>#${String(o.id).padStart(6, '0')}</td>
                        <td>${escapeHtml(o.username || 'Guest')}</td>
                        <td>$${parseFloat(o.total_price).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                        <td><span class="badge badge-${escapeHtml(o.status)}">${escapeHtml(o.status)}</span></td>
                        <td>${new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>`).join('');
        }

        const recentUsers = document.getElementById('recentUsers');
        if (recentUsers) {
            recentUsers.innerHTML = users.slice(0, 5).map(u => `
                <tr>
                    <td>${escapeHtml(u.username)}</td>
                    <td>${escapeHtml(u.email)}</td>
                    <td><span class="badge badge-${escapeHtml(u.role)}">${escapeHtml(u.role)}</span></td>
                </tr>`).join('');
        }
    } catch (err) {
        console.error('Dashboard load error:', err);
    }
}

// ── ORDERS ───────────────────────────────────────────────────
async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    const count = document.getElementById('orderCount');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading...</td></tr>';
    try {
        const { orders } = await API.orders.allOrders();
        if (count) count.textContent = `${orders.length} orders`;
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);">No orders yet</td></tr>';
            return;
        }
        tbody.innerHTML = orders.map(o => `
            <tr>
                <td>#${String(o.id).padStart(6, '0')}</td>
                <td>${escapeHtml(o.username || 'Guest')}</td>
                <td style="font-size:12px;">
                    <strong>${escapeHtml(o.shipping_name || '')}</strong><br>
                    <span style="color:var(--text-secondary);">${escapeHtml(o.shipping_address || '')}</span>
                </td>
                <td>${(o.items || []).length} items</td>
                <td>$${parseFloat(o.total_price).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                <td>${new Date(o.created_at).toLocaleDateString()}</td>
                <td><span class="badge badge-${escapeHtml(o.status)}">${escapeHtml(o.status)}</span></td>
                <td>
                    <select onchange="updateOrderStatus(${o.id}, this.value)"
                        style="padding:6px;border-radius:6px;border:1px solid var(--border-input);font-size:12px;background:var(--bg-input);color:var(--text-primary);">
                        <option value="pending"    ${o.status==='pending'?'selected':''}>Pending</option>
                        <option value="processing" ${o.status==='processing'?'selected':''}>Processing</option>
                        <option value="shipped"    ${o.status==='shipped'?'selected':''}>Shipped</option>
                        <option value="delivered"  ${o.status==='delivered'?'selected':''}>Delivered</option>
                        <option value="cancelled"  ${o.status==='cancelled'?'selected':''}>Cancelled</option>
                    </select>
                </td>
            </tr>`).join('');
    } catch {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:red;">Failed to load orders</td></tr>';
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        await API.orders.updateStatus(orderId, status);
        showNotification(`Order #${orderId} updated to ${status}`, 'success');
        loadOrders();
    } catch (err) {
        showNotification(err.message || 'Update failed', 'error');
    }
}

// ── USERS ────────────────────────────────────────────────────
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    const count = document.getElementById('userCount');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    try {
        const { users } = await API.users.all();
        if (count) count.textContent = `${users.length} users`;
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${escapeHtml(u.username)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td><span class="badge badge-${escapeHtml(u.role)}">${escapeHtml(u.role)}</span> (${u.order_count} orders)</td>
                <td>
                    ${u.role === 'admin'
                        ? '<span style="color:var(--text-secondary);font-size:12px;">Protected</span>'
                        : `<button class="btn-sm btn-sm-danger" data-uid="${u.id}" data-uname="${escapeHtml(u.username)}" onclick="deleteUser(this.dataset.uid, this.dataset.uname)">Delete</button>`}
                </td>
            </tr>`).join('');
    } catch {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">Failed to load users</td></tr>';
    }
}

async function deleteUser(id, username) {
    if (!confirm(`Delete user "${username}"?`)) return;
    try {
        await API.users.delete(Number(id));
        showNotification('User deleted', 'info');
        loadUsers();
    } catch (err) {
        showNotification(err.message || 'Delete failed', 'error');
    }
}

// ── PRODUCTS ─────────────────────────────────────────────────

// Spec templates per category — the admin form renders one input per field.
const SPEC_TEMPLATES = {
    'CPU':          ['Brand','Generation','Cores','Threads','Base Clock','Boost Clock','Cache','TDP','Socket','Lithography','Integrated GPU'],
    'GPU':          ['Brand','VRAM','Memory Type','Base Clock','Boost Clock','Bus Width','TDP','Ports','PCIe','Length'],
    'RAM':          ['Capacity','Type','Speed','Latency','Voltage','Modules','RGB','Heatspreader'],
    'Motherboard':  ['Socket','Chipset','Form Factor','RAM Slots','Max RAM','PCIe','M.2 Slots','SATA Ports','USB','Wi-Fi'],
    'Storage':      ['Type','Capacity','Interface','Read Speed','Write Speed','Form Factor','Endurance'],
    'Power Supply': ['Wattage','Efficiency','Modular','Fan Size','Connectors','Warranty'],
    'Cooling':      ['Type','Fan Size','Radiator Size','Noise Level','Supported Sockets','RGB','TDP Support'],
    'Peripherals':  ['Type','Connection','Switches','DPI','Backlight','Weight'],
    'Pre-Built':    ['Processor','Graphics Card','Memory','Storage','Power Supply','Cooling','Case'],
    'Trending':     ['Highlight','Category','Notes'],
};

function onCategoryChange() {
    const cat = document.getElementById('prodCategory').value;
    const section = document.getElementById('specsSection');
    const fields  = document.getElementById('specsFields');
    if (!section || !fields) return;

    if (!cat || !SPEC_TEMPLATES[cat]) {
        section.style.display = 'none';
        fields.innerHTML = '';
        return;
    }

    fields.innerHTML = SPEC_TEMPLATES[cat].map(label => `
        <input type="text" class="spec-input" data-label="${escapeHtml(label)}"
               placeholder="${escapeHtml(label)}" style="padding:8px 10px;border:1px solid var(--border-input);border-radius:6px;background:var(--bg-input);color:var(--text-primary);font-size:13px;">
    `).join('');
    section.style.display = 'block';
}

function collectSpecs() {
    const specs = {};
    document.querySelectorAll('.spec-input').forEach(inp => {
        const k = inp.dataset.label;
        const v = inp.value.trim();
        if (k && v) specs[k] = v;
    });
    return specs;
}

async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    const count = document.getElementById('productCount');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
    try {
        const { products } = await API.products.list();
        if (count) count.textContent = `${products.length} products`;
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">No products in database yet</td></tr>';
            return;
        }
        tbody.innerHTML = products.map(p => {
            const specsCount = p.specs ? Object.keys(p.specs).length : 0;
            const specsSummary = specsCount > 0
                ? `<span title="${escapeHtml(JSON.stringify(p.specs))}" style="color:var(--primary);cursor:help;">${specsCount} specs</span>`
                : '<span style="color:var(--text-secondary);">—</span>';
            return `
            <tr>
                <td>${escapeHtml(p.name)}</td>
                <td>$${parseFloat(p.price).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                <td>${escapeHtml(p.category)}</td>
                <td>${specsSummary}</td>
                <td>
                    <button class="btn-sm btn-sm-danger" data-pid="${p.id}" data-pname="${escapeHtml(p.name)}" onclick="deleteProduct(this.dataset.pid, this.dataset.pname)">Delete</button>
                </td>
            </tr>`;
        }).join('');
    } catch {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">Failed to load products</td></tr>';
    }
}

async function addProduct() {
    const name     = document.getElementById('prodName').value.trim();
    const price    = parseFloat(document.getElementById('prodPrice').value);
    const category = document.getElementById('prodCategory').value;
    const stock    = parseInt(document.getElementById('prodStock')?.value || 0);
    const image    = document.getElementById('prodImage')?.value.trim() || '';
    if (!name || !price || !category) { showNotification('Please fill Name, Price and Category', 'error'); return; }

    const specs = collectSpecs();    // {} if none filled

    try {
        await API.products.add({ name, price, category, stock, image, specs });
        // Clear form
        document.getElementById('prodName').value  = '';
        document.getElementById('prodPrice').value = '';
        document.getElementById('prodCategory').value = '';
        if (document.getElementById('prodStock')) document.getElementById('prodStock').value = 50;
        if (document.getElementById('prodImage')) document.getElementById('prodImage').value = '';
        onCategoryChange();    // hide spec fields
        showNotification(`${name} added successfully`, 'success');
        loadProducts();
    } catch (err) { showNotification(err.message || 'Add failed', 'error'); }
}

async function deleteProduct(id, name) {
    if (!confirm(`Delete product "${name}"?`)) return;
    try {
        await API.products.delete(Number(id));
        showNotification('Product deleted', 'info');
        loadProducts();
    } catch (err) { showNotification(err.message || 'Delete failed', 'error'); }
}

// ── COUPONS ──────────────────────────────────────────────────
async function loadCoupons() {
    const tbody = document.getElementById('couponsTableBody');
    const count = document.getElementById('couponCount');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading...</td></tr>';
    try {
        const { coupons } = await API.coupons.all();
        if (count) count.textContent = `${coupons.length} coupons`;
        tbody.innerHTML = coupons.map(c => `
            <tr>
                <td><strong>${escapeHtml(c.code)}</strong></td>
                <td>${c.discount}% off — <span style="color:${c.is_active?'green':'red'}">${c.is_active?'Active':'Inactive'}</span></td>
                <td>
                    <button class="btn-sm" onclick="toggleCoupon(${c.id})"
                        style="background:${c.is_active?'#f59e0b':'#10b981'};color:#fff;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">
                        ${c.is_active?'Deactivate':'Activate'}
                    </button>
                    <button class="btn-sm btn-sm-danger" data-cid="${c.id}" data-ccode="${escapeHtml(c.code)}" onclick="deleteCoupon(this.dataset.cid, this.dataset.ccode)" style="margin-left:4px;">Delete</button>
                </td>
            </tr>`).join('');
    } catch {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:red;">Failed to load coupons</td></tr>';
    }
}

async function addCoupon() {
    const code     = document.getElementById('couponCode').value.trim().toUpperCase();
    const discount = parseInt(document.getElementById('couponDiscount').value);
    const label    = document.getElementById('couponLabel')?.value.trim() || `${discount}% Off`;
    if (!code || !discount || discount < 1 || discount > 100) {
        showNotification('Enter a valid code and discount (1-100%)', 'error'); return;
    }
    try {
        await API.coupons.add(code, discount, label);
        document.getElementById('couponCode').value     = '';
        document.getElementById('couponDiscount').value = '';
        if (document.getElementById('couponLabel')) document.getElementById('couponLabel').value = '';
        showNotification(`Coupon ${code} added (${discount}% off)`, 'success');
        loadCoupons();
    } catch (err) { showNotification(err.message || 'Add failed', 'error'); }
}

async function deleteCoupon(id, code) {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try {
        await API.coupons.delete(Number(id));
        showNotification('Coupon deleted', 'info');
        loadCoupons();
    } catch (err) { showNotification(err.message || 'Delete failed', 'error'); }
}

async function toggleCoupon(id) {
    try {
        const r = await API.coupons.toggle(id);
        showNotification(`Coupon ${r.is_active ? 'activated' : 'deactivated'}`, 'success');
        loadCoupons();
    } catch (err) { showNotification(err.message || 'Toggle failed', 'error'); }
}

window.checkAdminAccess  = checkAdminAccess;
window.adminLogout       = adminLogout;
window.toggleSidebar     = toggleSidebar;
window.loadDashboard     = loadDashboard;
window.loadOrders        = loadOrders;
window.updateOrderStatus = updateOrderStatus;
window.loadUsers         = loadUsers;
window.deleteUser        = deleteUser;
window.loadProducts      = loadProducts;
window.addProduct        = addProduct;
window.deleteProduct     = deleteProduct;
window.onCategoryChange  = onCategoryChange;
window.loadCoupons       = loadCoupons;
window.addCoupon         = addCoupon;
window.deleteCoupon      = deleteCoupon;
window.toggleCoupon      = toggleCoupon;

console.log('🔒 Admin Panel JS loaded (PHP Backend)');
