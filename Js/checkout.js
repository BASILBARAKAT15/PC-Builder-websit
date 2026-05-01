// ==========================
// checkout.js — PHP Backend
// ==========================

window.addEventListener('DOMContentLoaded', () => {
    const cart          = JSON.parse(localStorage.getItem('cart')) || [];
    const appliedCoupon = JSON.parse(localStorage.getItem('appliedCoupon') || 'null');

    const summaryItems   = document.getElementById('summaryItems');
    const summaryTotal   = document.getElementById('summaryTotal');
    const paymentMessage = document.getElementById('paymentMessage');
    const payBtn         = document.querySelector('.pay-btn');

    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        setTimeout(() => { window.location.href = 'cart.html'; }, 1000);
        return;
    }

    function loadSummary() {
        summaryItems.innerHTML = '';
        let total = 0;
        cart.forEach(item => {
            const qty = item.quantity || 1;
            const itemTotal = item.price * qty;
            total += itemTotal;
            const div = document.createElement('div');
            div.className = 'summary-item';
            div.innerHTML = `<span></span><span></span>`;
            div.children[0].textContent = `${item.name} × ${qty}`;
            div.children[1].textContent = `$${itemTotal.toLocaleString()}`;
            summaryItems.appendChild(div);
        });

        if (appliedCoupon) {
            const discount = Math.round(total * appliedCoupon.discount / 100);
            total -= discount;
            const d = document.createElement('div');
            d.className = 'summary-item discount';
            d.innerHTML = `<span></span><span></span>`;
            d.children[0].textContent = `Discount (${appliedCoupon.label})`;
            d.children[1].textContent = `- $${discount.toLocaleString()}`;
            summaryItems.appendChild(d);
        }
        summaryTotal.textContent = 'Total: $' + total.toLocaleString();
    }

    const validCard = n => /^\d{16}$/.test(n);

    async function completePayment() {
        const name   = document.getElementById('cardName').value.trim();
        const number = document.getElementById('cardNumber').value.trim();
        const expiry = document.getElementById('expiry').value.trim();
        const cvv    = document.getElementById('cvv').value.trim();

        const addr = document.getElementById('address')?.value?.trim() || '';
        if (!name || !number || !expiry || !cvv || !addr) {
            paymentMessage.className = 'error';
            paymentMessage.textContent = '❌ Please fill all fields (including shipping address).';
            return;
        }
        if (!validCard(number)) {
            paymentMessage.className = 'error';
            paymentMessage.textContent = '❌ Card number must be 16 digits.';
            return;
        }

        try {
            const me = await API.auth.me();
            if (!me.loggedIn) throw new Error();
        } catch {
            showNotification('You must login first.', 'error');
            localStorage.setItem('returnToCheckout', 'true');
            setTimeout(() => { window.location.href = 'login.html'; }, 1000);
            return;
        }

        payBtn.disabled = true;
        payBtn.textContent = 'Processing...';

        try {
            // addr already captured above
            const result = await API.orders.place(
                cart, name, addr, 'card', appliedCoupon?.code || ''
            );

            localStorage.removeItem('cart');
            localStorage.removeItem('appliedCoupon');
            if (typeof updateCartBadge === 'function') updateCartBadge();

            paymentMessage.className = 'success';
            paymentMessage.textContent = '✅ Payment Successful! Redirecting...';
            setTimeout(() => {
                window.location.href = `order-tracking.html?id=${result.order_id}`;
            }, 1500);
        } catch (err) {
            payBtn.disabled = false;
            payBtn.textContent = 'Pay Now';
            paymentMessage.className = 'error';
            paymentMessage.textContent = '❌ ' + (err.message || 'Payment failed.');
        }
    }

    payBtn.addEventListener('click', completePayment);
    loadSummary();
});
