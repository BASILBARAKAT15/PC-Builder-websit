// ==========================
// Cart.js — PHP Backend (coupon via API)
// ==========================

const cartItemsContainer = document.getElementById('cart-items');
const totalPriceDisplay  = document.getElementById('total-price');

let appliedCoupon = null;

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

window.addEventListener('DOMContentLoaded', () => {
    loadCart();
    const saved = JSON.parse(localStorage.getItem('appliedCoupon') || 'null');
    if (saved) { appliedCoupon = saved; updateDiscountDisplay(); }
});

function loadCart() {
    const cart = getCart();
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <div style="font-size:60px;margin-bottom:16px;">🛒</div>
                <p style="font-size:18px;margin-bottom:8px;font-weight:600;">Your cart is empty</p>
                <p style="color:var(--gray-400);margin-bottom:20px;">Add some components to get started!</p>
                <a href="build.html" class="btn btn-primary">Start Building</a>
            </div>`;
        totalPriceDisplay.textContent = 'Total: $0';
        updateDiscountDisplay();
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        const qty = item.quantity || 1;
        const itemTotal = item.price * qty;
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-left">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" onerror="this.src='../Image/PCImage.png'">
                <div>
                    <p class="item-name">${escapeHtml(item.name)}</p>
                    <p class="item-price">
                        $${item.price.toLocaleString()}
                        ${qty > 1 ? ' × ' + qty + ' = $' + itemTotal.toLocaleString() : ''}
                    </p>
                    ${item.category ? `<p class="item-category">${escapeHtml(item.category)}</p>` : ''}
                </div>
            </div>
            <div class="cart-right">
                <div class="qty-controls">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
                    <span class="qty-value">${qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
            </div>`;
        cartItemsContainer.appendChild(div);
    });

    updateTotal(total);
}

async function applyCoupon() {
    const input  = document.getElementById('couponInput');
    const status = document.getElementById('couponStatus');
    const code   = input.value.trim().toUpperCase();

    if (!code) {
        status.textContent = '⚠️ Enter a coupon code';
        status.style.color = 'var(--warning, orange)';
        return;
    }
    status.textContent = 'Checking...';
    status.style.color = 'var(--text-secondary)';

    try {
        const c = await API.coupons.validate(code);
        appliedCoupon = { code: c.code, discount: c.discount, label: c.label };
        localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
        status.textContent = `✅ ${c.label} applied!`;
        status.style.color = 'var(--success, green)';
        showNotification(`Coupon applied: ${c.label}`, 'success');
        updateDiscountDisplay();
    } catch {
        appliedCoupon = null;
        localStorage.removeItem('appliedCoupon');
        status.textContent = '❌ Invalid or expired coupon';
        status.style.color = 'var(--danger, red)';
        showNotification('Invalid coupon code', 'error');
        updateDiscountDisplay();
    }
}

function getCart()  { return JSON.parse(localStorage.getItem('cart')) || []; }
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    if (typeof updateCartBadge === 'function') updateCartBadge();
}
function removeItem(index) {
    const cart = getCart();
    const removed = cart.splice(index, 1)[0];
    saveCart(cart);
    showNotification(`${removed.name} removed from cart`, 'info');
    loadCart();
}
function changeQty(index, delta) {
    const cart = getCart();
    if (!cart[index]) return;
    cart[index].quantity = Math.max(1, (cart[index].quantity || 1) + delta);
    saveCart(cart);
    loadCart();
}
function updateTotal(subtotal) {
    let total = subtotal;
    if (appliedCoupon) total -= Math.round(subtotal * appliedCoupon.discount / 100);
    totalPriceDisplay.textContent = `Total: $${total.toLocaleString()}`;
}
function updateDiscountDisplay() {
    const cart = getCart();
    const subtotal = cart.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
    updateTotal(subtotal);
}

// Proceed to checkout: require login first, then go to checkout page.
async function checkout() {
    const cart = getCart();
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    // Check login via PHP session (authoritative), not just localStorage.
    let loggedIn = false;
    try {
        const me = await API.auth.me();
        loggedIn = !!(me && me.loggedIn);
    } catch (_) { loggedIn = false; }

    if (!loggedIn) {
        showNotification('Please log in to continue to checkout', 'warning');
        localStorage.setItem('returnToCheckout', 'true');
        setTimeout(() => { window.location.href = 'login.html'; }, 900);
        return;
    }

    window.location.href = 'checkout.html';
}

function clearCart() {
    const cart = getCart();
    if (cart.length === 0) {
        showNotification('Your cart is already empty', 'info');
        return;
    }
    if (!confirm('Are you sure you want to clear your cart?')) return;
    localStorage.removeItem('cart');
    localStorage.removeItem('appliedCoupon');
    appliedCoupon = null;
    if (typeof updateCartBadge === 'function') updateCartBadge();
    showNotification('Cart cleared', 'info');
    loadCart();
}

window.applyCoupon = applyCoupon;
window.removeItem  = removeItem;
window.changeQty   = changeQty;
window.checkout    = checkout;
window.clearCart   = clearCart;
