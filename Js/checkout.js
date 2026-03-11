window.addEventListener('DOMContentLoaded', () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const appliedCoupon = JSON.parse(localStorage.getItem('appliedCoupon'));

    const summaryItems = document.getElementById('summaryItems');
    const summaryTotal = document.getElementById('summaryTotal');
    const paymentMessage = document.getElementById('paymentMessage');
    const payBtn = document.querySelector('.pay-btn');

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
            const nameSpan = document.createElement('span');
            nameSpan.textContent = `${item.name} × ${qty}`;
            const priceSpan = document.createElement('span');
            priceSpan.textContent = `$${itemTotal.toLocaleString()}`;
            div.appendChild(nameSpan);
            div.appendChild(priceSpan);
            summaryItems.appendChild(div);
        });

        if (appliedCoupon) {
            const discount = Math.round(total * appliedCoupon.discount / 100);
            total -= discount;

            const discountDiv = document.createElement('div');
            discountDiv.className = 'summary-item discount';
            const labelSpan = document.createElement('span');
            labelSpan.textContent = `Discount (${appliedCoupon.label})`;
            const discountSpan = document.createElement('span');
            discountSpan.textContent = `- $${discount.toLocaleString()}`;
            discountDiv.appendChild(labelSpan);
            discountDiv.appendChild(discountSpan);
            summaryItems.appendChild(discountDiv);
        }

        summaryTotal.textContent = "Total: $" + total.toLocaleString();
    }

    function validCard(number) {
        return /^\d{16}$/.test(number);
    }

    function completePayment() {
        const name = document.getElementById('cardName').value.trim();
        const number = document.getElementById('cardNumber').value.trim();
        const expiry = document.getElementById('expiry').value.trim();
        const cvv = document.getElementById('cvv').value.trim();

        if (!name || !number || !expiry || !cvv) {
            paymentMessage.className = "error";
            paymentMessage.textContent = "❌ Please fill all fields.";
            return;
        }

        if (!validCard(number)) {
            paymentMessage.className = "error";
            paymentMessage.textContent = "❌ Invalid card number.";
            return;
        }

        const user = localStorage.getItem('loggedInUser');
        if (!user) {
            showNotification('You must login first.', 'error');
            setTimeout(() => { window.location.href = 'login.html'; }, 1000);
            return;
        }

        let total = cart.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);
        if (appliedCoupon) {
            total -= Math.round(total * appliedCoupon.discount / 100);
        }

        const orders = JSON.parse(localStorage.getItem('orders')) || [];

        const newOrder = {
            id: Date.now(),
            username: user,
            items: cart,
            total: total,
            date: new Date().toISOString(),
            status: "Processing"
        };

        orders.push(newOrder);

        localStorage.setItem('orders', JSON.stringify(orders));
        localStorage.removeItem('cart');
        localStorage.removeItem('appliedCoupon');
        updateCartBadge();

        paymentMessage.className = "success";
        paymentMessage.textContent = "✅ Payment Successful! Redirecting...";

        setTimeout(() => {
            window.location.href = `order-tracking.html?id=${newOrder.id}`;
        }, 1500);
    }

    payBtn.addEventListener('click', completePayment);

    loadSummary();
});