const cartItemsContainer = document.getElementById('cart-items');
const totalPriceDisplay = document.getElementById('total-price');

let appliedCoupon = null;

/* ===============================
   PAGE LOAD
================================= */
window.addEventListener('DOMContentLoaded', () => {
    loadCart();
    checkReturnToCheckout();

    // Load saved coupon
    const savedCoupon = JSON.parse(localStorage.getItem('appliedCoupon'));
    if (savedCoupon) {
        appliedCoupon = savedCoupon;
        updateDiscountDisplay();
    }
});

/* ===============================
   CART LOAD
================================= */
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
        div.style.opacity = '0';
        div.style.transform = 'translateY(20px)';

        div.innerHTML = `
            <div class="cart-left">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='../Image/PCImage.png'">
                <div>
                    <p class="item-name">${item.name}</p>
                    <p class="item-price">
                        $${item.price.toLocaleString()}
                        ${qty > 1 ? ' × ' + qty + ' = $' + itemTotal.toLocaleString() : ''}
                    </p>
                    ${item.category ? `<p class="item-category">${item.category}</p>` : ''}
                </div>
            </div>

            <div class="cart-right">
                <div class="qty-controls">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
                    <span class="qty-value">${qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
            </div>
        `;

        cartItemsContainer.appendChild(div);

        setTimeout(() => {
            div.style.transition = 'all 0.4s ease';
            div.style.opacity = '1';
            div.style.transform = 'translateY(0)';
        }, index * 60);
    });

    totalPriceDisplay.textContent = `Total: $${total.toLocaleString()}`;
    updateDiscountDisplay();
}

/* ===============================
   REMOVE ITEM
================================= */
function removeItem(index) {
    let cart = getCart();
    const removed = cart.splice(index, 1)[0];
    saveCart(cart);
    localStorage.removeItem('appliedCoupon');
    appliedCoupon = null;
    showNotification(`${removed.name} removed from cart`, 'info');
    loadCart();
}

/* ===============================
   CHANGE QUANTITY
================================= */
function changeQty(index, delta) {
    let cart = getCart();
    if (!cart[index]) return;

    cart[index].quantity = (cart[index].quantity || 1) + delta;

    if (cart[index].quantity < 1) cart[index].quantity = 1;

    if (cart[index].quantity > 10) {
        showNotification('Max 10 per item', 'warning');
        cart[index].quantity = 10;
    }

    saveCart(cart);
    loadCart();
}

/* ===============================
   CLEAR CART
================================= */
function clearCart() {
    if (getCart().length === 0) {
        showNotification('Cart is already empty', 'info');
        return;
    }

    if (confirm('Clear your entire cart?')) {
        localStorage.removeItem('cart');
        localStorage.removeItem('appliedCoupon');
        appliedCoupon = null;

        updateCartBadge();
        showNotification('Cart cleared', 'success');
        loadCart();
    }
}

/* ===============================
   CHECKOUT
================================= */
function checkout() {
    const cart = getCart();
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    const user = localStorage.getItem('loggedInUser');
    if (!user) {
        if (confirm('You must log in to checkout. Go to login?')) {
            localStorage.setItem('returnToCheckout', 'true');
            window.location.href = 'login.html';
        }
        return;
    }

    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

/* ===============================
   RETURN AFTER LOGIN
================================= */
function checkReturnToCheckout() {
    if (
        localStorage.getItem('returnToCheckout') === 'true' &&
        localStorage.getItem('loggedInUser')
    ) {
        localStorage.removeItem('returnToCheckout');
        setTimeout(() => checkout(), 500);
    }
}

/* ===============================
   COUPON SYSTEM
================================= */

const DEFAULT_COUPONS = {
    SAVE10: { discount: 10, label: '10% off' },
    SAVE20: { discount: 20, label: '20% off' },
    WELCOME: { discount: 15, label: '15% off (Welcome!)' },
    PCBUILDER: { discount: 25, label: '25% off' },
};

function getCouponsMap() {
    const adminCoupons = JSON.parse(localStorage.getItem('adminCoupons'));
    if (adminCoupons) {
        const map = {};
        adminCoupons.forEach(c => {
            map[c.code] = { discount: c.discount, label: `${c.discount}% off` };
        });
        return map;
    }
    return DEFAULT_COUPONS;
}

function applyCoupon() {
    const input = document.getElementById('couponInput');
    const status = document.getElementById('couponStatus');
    const code = input.value.trim().toUpperCase();

    if (!code) {
        status.textContent = '❌ Enter a code';
        status.style.color = 'var(--danger)';
        return;
    }

    const coupons = getCouponsMap();
    const coupon = coupons[code];

    if (coupon) {
        appliedCoupon = coupon;

        // SAVE COUPON
        localStorage.setItem('appliedCoupon', JSON.stringify(coupon));

        status.textContent = `✅ ${coupon.label} applied!`;
        status.style.color = 'var(--accent)';
        input.disabled = true;

        showNotification(`Coupon applied: ${coupon.label}`, 'success');
        updateDiscountDisplay();
    } else {
        status.textContent = '❌ Invalid coupon';
        status.style.color = 'var(--danger)';
        showNotification('Invalid coupon code', 'error');
    }
}

function updateDiscountDisplay() {
    const cart = getCart();
    const total = cart.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0
    );

    const discountInfo = document.getElementById('discount-info');
    const finalPrice = document.getElementById('final-price');

    if (appliedCoupon && total > 0) {
        const discount = Math.round(total * appliedCoupon.discount / 100);
        const final = total - discount;

        discountInfo.textContent = `🎉 Discount (${appliedCoupon.label}): -$${discount.toLocaleString()}`;
        discountInfo.style.display = 'block';

        finalPrice.textContent = `Final Total: $${final.toLocaleString()}`;
        finalPrice.style.display = 'block';
    } else {
        discountInfo.style.display = 'none';
        finalPrice.style.display = 'none';
    }
}

/* ===============================
   GLOBAL EXPORTS
================================= */
window.removeItem = removeItem;
window.changeQty = changeQty;
window.clearCart = clearCart;
window.checkout = checkout;
window.applyCoupon = applyCoupon;