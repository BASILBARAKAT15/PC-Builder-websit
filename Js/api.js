// ==========================
// api.js — Frontend API Client
// ==========================

(function () {
    const BASE = (() => {
        const parts = window.location.pathname.split('/');
        const idx = parts.findIndex(p => p === 'HTMLPage' || p === 'admin');
        if (idx > 0) return parts.slice(0, idx).join('/') + '/api';
        return '/api';
    })();

    async function request(path, { method = 'GET', body = null, query = null } = {}) {
        const opts = {
            method,
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
        };
        if (body !== null) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        }
        let url = BASE + path;
        if (query) {
            const q = new URLSearchParams(query).toString();
            if (q) url += '?' + q;
        }

        let res, data;
        try { res = await fetch(url, opts); }
        catch { throw new Error('Network error. Is the server running?'); }
        try { data = await res.json(); } catch { data = {}; }

        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
        return data;
    }

    window.API = {
        _base: BASE,

        auth: {
            signup: (username, email, password) =>
                request('/auth/signup.php', { method: 'POST', body: { username, email, password } }),
            login: (email, password) =>
                request('/auth/login.php',  { method: 'POST', body: { email, password } }),
            logout: () =>
                request('/auth/logout.php', { method: 'POST', body: {} }),
            me: () =>
                request('/auth/me.php'),
        },

        users: {
            updateProfile:  (username, email) =>
                request('/users/update_profile.php',  { method: 'POST', body: { username, email } }),
            changePassword: (oldPassword, newPassword) =>
                request('/users/change_password.php', { method: 'POST', body: { old_password: oldPassword, new_password: newPassword } }),
            // admin
            all:    () => request('/users/list.php'),
            delete: (id) => request('/users/delete.php', { method: 'POST', body: { id } }),
        },

        products: {
            list:   () => request('/products/list.php'),
            // admin
            add:    ({ name, price, category, stock, image, specs }) =>
                request('/products/add.php', { method: 'POST', body: { name, price, category, stock, image, specs } }),
            delete: (id) => request('/products/delete.php', { method: 'POST', body: { id } }),
        },

        coupons: {
            validate: (code) =>
                request('/coupons/validate.php', { method: 'POST', body: { code } }),
            // admin
            all:      () => request('/coupons/list.php'),
            add:      (code, discount, label) =>
                request('/coupons/add.php', { method: 'POST', body: { code, discount, label } }),
            toggle:   (id) => request('/coupons/toggle.php', { method: 'POST', body: { id } }),
            delete:   (id) => request('/coupons/delete.php', { method: 'POST', body: { id } }),
        },

        orders: {
            place: (items, shippingName, shippingAddress, paymentMethod, couponCode) =>
                request('/orders/place.php', { method: 'POST', body: {
                    items, shipping_name: shippingName, shipping_address: shippingAddress,
                    payment_method: paymentMethod, coupon_code: couponCode,
                }}),
            myOrders: () => request('/orders/my_orders.php'),
            get:      (id) => request('/orders/get.php', { query: { id } }),
            // admin
            allOrders:    () => request('/orders/all.php'),
            updateStatus: (id, status) =>
                request('/orders/update_status.php', { method: 'POST', body: { id, status } }),
        },

        wishlist: {
            list:   () => request('/wishlist/list.php'),
            add:    (item) => request('/wishlist/add.php', { method: 'POST', body: {
                name: item.name, price: item.price, image: item.image, category: item.category,
            }}),
            remove: (name) => request('/wishlist/remove.php', { method: 'POST', body: { name } }),
            clear:  () => request('/wishlist/clear.php', { method: 'POST', body: {} }),
        },
    };
})();
