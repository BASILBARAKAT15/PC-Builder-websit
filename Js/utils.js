
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.pc-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'pc-notification';

    const colors = {
        info: '#3b82f6',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b'
    };

    const icons = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };

    notification.innerHTML = `${icons[type] || icons.info} ${message}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: #fff;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        font-family: 'Inter', 'Segoe UI', sans-serif;
        font-size: 14px;
        animation: notifSlideIn 0.3s ease;
        max-width: 350px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'notifSlideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(item) {
    let cart = getCart();
    const exists = cart.findIndex(c => c.name === item.name);

    if (exists !== -1) {
        showNotification(`${item.name} is already in your cart!`, 'info');
        return false;
    }

    cart.push(item);
    saveCart(cart);
    showNotification(`${item.name} added to cart!`, 'success');
    return true;
}

function addComponentToCart(item, categoryKey) {
    let cart = getCart();
    const exists = cart.findIndex(c => c.name === item.name);

    if (exists !== -1) {
        showNotification(`${item.name} is already in your cart!`, 'info');
        return false;
    }

    cart = cart.filter(c => c.category !== item.category);
    cart.push(item);
    saveCart(cart);

    if (categoryKey) {
        localStorage.setItem(`selected${categoryKey}`, item.name);
        localStorage.setItem(`selected${categoryKey}Price`, item.price);
    }

    showNotification(`${item.name} added to your build!`, 'success');
    return true;
}

function updateCartBadge() {
    const cart = getCart();
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? 'inline-flex' : 'none';
    });
}

function generateNavbar(activePage) {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const cart = getCart();
    const isDark = localStorage.getItem('theme') === 'dark';

    const links = [
        { name: 'Home', href: 'index.html', id: 'home' },
        { name: 'Builder', href: 'build.html', id: 'build' },
        { name: 'Pre-Built', href: 'prebuilt.html', id: 'prebuilt' },
        { name: 'Trending', href: 'trending.html', id: 'trending' },
        { name: 'About', href: 'about.html', id: 'about' },
        { name: 'Contact', href: 'contact.html', id: 'contact' },
    ];

    const navHTML = `
        <div class="nav-logo">
            <a href="index.html">🖥️ PC BUILDER</a>
        </div>

        <button class="hamburger" id="hamburger" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
        </button>

        <nav class="nav-links" id="navLinks">
            ${links.map(l => `<a href="${l.href}" class="${activePage === l.id ? 'active' : ''}">${l.name}</a>`).join('')}
        </nav>

        <div class="nav-actions">
            <button class="theme-toggle" onclick="toggleTheme()" title="Toggle Dark Mode">
                ${isDark ? '☀️' : '🌙'}
            </button>
            <a href="cart.html" class="nav-cart-btn">
                🛒 Cart
                <span class="cart-badge" style="display: ${cart.length > 0 ? 'inline-flex' : 'none'}">${cart.length}</span>
            </a>
            ${loggedInUser
                ? `<button class="nav-user-btn" onclick="showUserMenu()">👋 ${loggedInUser}</button>`
                : `<a href="login.html" class="nav-login-btn">Log In</a>`
            }
        </div>
    `;

    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.innerHTML = navHTML;
        setupHamburger();
    }
}

function setupHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }
}

function showUserMenu() {
    const loggedInUser = localStorage.getItem('loggedInUser');

    const existingMenu = document.querySelector('.user-menu-overlay');
    if (existingMenu) { existingMenu.remove(); return; }

    const overlay = document.createElement('div');
    overlay.className = 'user-menu-overlay';
    const role = localStorage.getItem('userRole') || 'user';

    overlay.innerHTML = `
        <div class="user-menu">
            <div class="user-menu-header">
                <strong>👤 ${loggedInUser}</strong>
            </div>
            <button onclick="window.location.href='profile.html'" class="user-menu-item">👤 My Profile</button>
            <button onclick="viewOrders()" class="user-menu-item">📦 My Orders</button>
            ${role === 'admin' ? '<button onclick="window.location.href=\'../admin/dashboard.html\'" class="user-menu-item">🔒 Admin Panel</button>' : ''}
            <button onclick="logout()" class="user-menu-item logout">🚪 Logout</button>
        </div>
    `;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
}

function viewOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];

    if (orders.length === 0) {
        showNotification('You have no orders yet', 'info');
        return;
    }

    let ordersHTML = `<div class="orders-modal-content">
        <h2>📦 My Orders</h2>`;

    orders.forEach(order => {
        const date = new Date(order.date).toLocaleDateString();
        ordersHTML += `
            <div class="order-item">
                <div class="order-header">
                    <strong>Order #${order.id}</strong>
                    <span class="order-status">${order.status}</span>
                </div>
                <p class="order-date">${date}</p>
                <p class="order-total">$${order.total.toLocaleString()}</p>
                <p class="order-count">${order.items.length} items</p>
            </div>`;
    });

    ordersHTML += `<button onclick="closeOrdersModal()" class="btn-close-modal">Close</button></div>`;

    const modal = document.createElement('div');
    modal.id = 'orders-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = ordersHTML;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeOrdersModal();
    });

    document.body.appendChild(modal);
}

function closeOrdersModal() {
    const modal = document.getElementById('orders-modal');
    if (modal) modal.remove();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInUser');
        showNotification('Logged out successfully', 'success');
        setTimeout(() => window.location.reload(), 1000);
    }
}

function animateCards(selector) {
    const cards = document.querySelectorAll(selector);
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 80);
    });
}

function addHoverEffects(selector) {
    document.querySelectorAll(selector).forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

function highlightSelected(selector, savedKey, btnSelector) {
    const saved = localStorage.getItem(savedKey);
    if (!saved) return;

    document.querySelectorAll(selector).forEach(card => {
        if (card.dataset.name === saved) {
            card.classList.add('selected-card');
            const btn = card.querySelector(btnSelector);
            if (btn) {
                btn.textContent = '✓ Selected';
                btn.classList.add('btn-selected');
            }
        }
    });
}

function initScrollAnimations() {
    const targets = document.querySelectorAll('.comp-card, .mb-card, .storage-card, .psu-card, .trend-card, .peripheral-card, .memory-card, .cooling-card, .section-box, .card');
    targets.forEach(el => el.classList.add('scroll-animate'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));
}

function createBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '↑';
    btn.title = 'Back to top';
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function loadSavedTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

loadSavedTheme();

window.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    createBackToTop();
    initScrollAnimations();
});

window.showNotification = showNotification;
window.getCart = getCart;
window.saveCart = saveCart;
window.addToCart = addToCart;
window.addComponentToCart = addComponentToCart;
window.updateCartBadge = updateCartBadge;
window.generateNavbar = generateNavbar;
window.showUserMenu = showUserMenu;
window.viewOrders = viewOrders;
window.closeOrdersModal = closeOrdersModal;
window.logout = logout;
window.toggleTheme = toggleTheme;
window.animateCards = animateCards;
window.addHoverEffects = addHoverEffects;
window.highlightSelected = highlightSelected;

console.log('🔧 PC Builder Utils loaded');

function filterProducts(query) {
    const q = query.toLowerCase();
    const cards = document.querySelectorAll('.grid > *');
    let visibleCount = 0;

    cards.forEach(card => {
        const name = (card.dataset.name || card.textContent).toLowerCase();
        if (name.includes(q)) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    let noResults = document.querySelector('.no-results');
    if (visibleCount === 0) {
        if (!noResults) {
            noResults = document.createElement('p');
            noResults.className = 'no-results';
            noResults.style.cssText = 'text-align:center;color:var(--gray-400);padding:40px;font-size:16px;grid-column:1/-1;';
            noResults.textContent = 'No products found matching your search.';
            document.querySelector('.grid').appendChild(noResults);
        }
    } else if (noResults) {
        noResults.remove();
    }
}

function sortProducts(criteria) {
    const grid = document.querySelector('.grid');
    if (!grid) return;

    const cards = Array.from(grid.children).filter(c => !c.classList.contains('no-results'));

    cards.sort((a, b) => {
        if (criteria === 'price-low') {
            return (parseInt(a.dataset.price) || 0) - (parseInt(b.dataset.price) || 0);
        }
        if (criteria === 'price-high') {
            return (parseInt(b.dataset.price) || 0) - (parseInt(a.dataset.price) || 0);
        }
        if (criteria === 'name') {
            return (a.dataset.name || '').localeCompare(b.dataset.name || '');
        }
        return 0;
    });

    cards.forEach(card => grid.appendChild(card));
}

window.filterProducts = filterProducts;
window.sortProducts = sortProducts;

function getWishlist() {
    return JSON.parse(localStorage.getItem('wishlist')) || [];
}

function toggleWishlist(item) {
    let wishlist = getWishlist();
    const index = wishlist.findIndex(w => w.name === item.name);

    if (index !== -1) {
        wishlist.splice(index, 1);
        showNotification(`${item.name} removed from wishlist`, 'info');
    } else {
        wishlist.push(item);
        showNotification(`${item.name} added to wishlist ❤️`, 'success');
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistButtons();
    return index === -1;
}

function isInWishlist(name) {
    return getWishlist().some(w => w.name === name);
}

function updateWishlistButtons() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const name = btn.dataset.name;
        if (isInWishlist(name)) {
            btn.textContent = '❤️';
            btn.title = 'Remove from wishlist';
        } else {
            btn.textContent = '🤍';
            btn.title = 'Add to wishlist';
        }
    });
}

function addWishlistButtons(cardSelector) {
    document.querySelectorAll(cardSelector).forEach(card => {
        const name = card.dataset.name;
        if (!name) return;

        const btn = document.createElement('button');
        btn.className = 'wishlist-btn';
        btn.dataset.name = name;
        btn.textContent = isInWishlist(name) ? '❤️' : '🤍';
        btn.title = 'Add to wishlist';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist({
                name: name,
                price: parseInt(card.dataset.price) || 0,
                image: card.querySelector('img')?.src || '',
            });
        });

        card.style.position = 'relative';
        card.appendChild(btn);
    });
}

window.getWishlist = getWishlist;
window.toggleWishlist = toggleWishlist;
window.isInWishlist = isInWishlist;
window.addWishlistButtons = addWishlistButtons;
window.updateWishlistButtons = updateWishlistButtons;

let compareList = [];

function toggleCompare(item) {
    const index = compareList.findIndex(c => c.name === item.name);

    if (index !== -1) {
        compareList.splice(index, 1);
        showNotification(`${item.name} removed from comparison`, 'info');
    } else {
        if (compareList.length >= 3) {
            showNotification('You can compare up to 3 products only', 'warning');
            return;
        }
        compareList.push(item);
        showNotification(`${item.name} added to comparison`, 'success');
    }

    updateCompareBar();
    updateCompareButtons();
}

function updateCompareBar() {
    let bar = document.getElementById('compare-bar');

    if (compareList.length === 0) {
        if (bar) bar.remove();
        return;
    }

    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'compare-bar';
        bar.className = 'compare-bar';
        document.body.appendChild(bar);
    }

    bar.innerHTML = `
        <span>${compareList.length} product(s) selected</span>
        <button class="btn btn-primary" onclick="showComparison()" ${compareList.length < 2 ? 'disabled' : ''}>
            Compare Now
        </button>
        <button class="btn btn-secondary" onclick="clearCompare()">Clear</button>
    `;
}

function updateCompareButtons() {
    document.querySelectorAll('.compare-btn').forEach(btn => {
        const name = btn.dataset.name;
        const inList = compareList.some(c => c.name === name);
        btn.textContent = inList ? '✓ Comparing' : '⚖️ Compare';
        btn.classList.toggle('btn-selected', inList);
    });
}

function showComparison() {
    if (compareList.length < 2) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'compare-modal';

    let tableRows = '<tr><th>Product</th>';
    compareList.forEach(item => {
        tableRows += `<td style="text-align:center;">
            <img src="${item.image}" style="width:80px;height:80px;object-fit:contain;margin-bottom:8px;"><br>
            <strong>${item.name}</strong>
        </td>`;
    });
    tableRows += '</tr>';

    tableRows += '<tr><th>Price</th>';
    compareList.forEach(item => {
        tableRows += `<td style="font-weight:700;color:var(--primary);">$${item.price.toLocaleString()}</td>`;
    });
    tableRows += '</tr>';

    const allSpecs = {};
    compareList.forEach(item => {
        if (item.specs) {
            Object.keys(item.specs).forEach(key => {
                if (!allSpecs[key]) allSpecs[key] = [];
            });
        }
    });

    Object.keys(allSpecs).forEach(key => {
        tableRows += `<tr><th>${key}</th>`;
        compareList.forEach(item => {
            const val = item.specs ? (item.specs[key] || '-') : '-';
            tableRows += `<td>${val}</td>`;
        });
        tableRows += '</tr>';
    });

    overlay.innerHTML = `
        <div class="orders-modal-content" style="max-width:850px;">
            <h2>⚖️ Full Product Comparison</h2>
            <div style="overflow-x:auto;">
                <table class="compare-table">
                    ${tableRows}
                </table>
            </div>
            <button onclick="document.getElementById('compare-modal').remove()" class="btn-close-modal">Close</button>
        </div>
    `;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
}

function clearCompare() {
    compareList = [];
    updateCompareBar();
    updateCompareButtons();
}

function addCompareButtons(cardSelector) {
    document.querySelectorAll(cardSelector).forEach(card => {
        const name = card.dataset.name;
        if (!name) return;

        const btn = document.createElement('button');
        btn.className = 'compare-btn';
        btn.dataset.name = name;
        btn.textContent = '⚖️ Compare';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            let specs = null;
            const specsRaw = card.getAttribute('data-specs');
            if (specsRaw) {
                try { specs = JSON.parse(specsRaw.replace(/&quot;/g, '"')); } catch(e) {}
            }
            toggleCompare({
                name: name,
                price: parseInt(card.dataset.price) || 0,
                image: card.querySelector('img')?.src || '',
                category: card.querySelector('.item-category')?.textContent || '',
                specs: specs,
            });
        });

        const selectBtn = card.querySelector('.select-btn, .buy-btn');
        if (selectBtn) {
            selectBtn.parentElement.insertBefore(btn, selectBtn);
        } else {
            card.appendChild(btn);
        }
    });
}

window.toggleCompare = toggleCompare;
window.showComparison = showComparison;
window.clearCompare = clearCompare;
window.addCompareButtons = addCompareButtons;

function addStarRatings(cardSelector) {
    document.querySelectorAll(cardSelector).forEach(card => {
        if (card.querySelector('.stars')) return;

        const name = card.dataset.name || 'Product';
        // Seeded rating based on product name for consistency
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash) + name.charCodeAt(i);
            hash |= 0;
        }
        const rating = (3.5 + (Math.abs(hash) % 16) / 10).toFixed(1);
        const reviews = 10 + (Math.abs(hash >> 8) % 200);
        const fullStars = Math.floor(rating);
        const halfStar = rating - fullStars >= 0.5;

        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) starsHTML += '★';
        if (halfStar) starsHTML += '★';
        for (let i = 0; i < 5 - fullStars - (halfStar ? 1 : 0); i++) starsHTML += '☆';

        const ratingDiv = document.createElement('div');
        ratingDiv.style.cssText = 'text-align:center;margin:4px 0;';
        ratingDiv.innerHTML = `
            <span class="stars">${starsHTML}</span>
            <span class="review-count">${rating} (${reviews} reviews)</span>
        `;

        const price = card.querySelector('.price');
        if (price) {
            price.parentElement.insertBefore(ratingDiv, price);
        } else {
            card.appendChild(ratingDiv);
        }
    });
}

window.addStarRatings = addStarRatings;

function enableImageZoom(cardSelector) {
    document.querySelectorAll(cardSelector).forEach(card => {
        const img = card.querySelector('img');
        if (!img) return;

        img.addEventListener('mouseenter', () => {
            img.style.transition = 'transform 0.3s ease';
            img.style.transform = 'scale(1.3)';
            img.style.zIndex = '10';
            img.style.position = 'relative';
        });

        img.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1)';
            img.style.zIndex = '';
            img.style.position = '';
        });
    });
}

function enableQuickView(cardSelector) {
    document.querySelectorAll(cardSelector).forEach(card => {
        const img = card.querySelector('img');
        if (!img) return;

        const viewBtn = document.createElement('button');
        viewBtn.className = 'quick-view-btn';
        viewBtn.innerHTML = '👁️ Quick View';
        viewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openQuickView(card);
        });

        card.style.position = 'relative';
        card.appendChild(viewBtn);
    });
}

function openQuickView(card) {
    const name = card.dataset.name || card.querySelector('h3')?.textContent || 'Product';
    const price = card.dataset.price || '0';
    const img = card.querySelector('img')?.src || '';
    const category = card.querySelector('.item-category')?.textContent || '';

    let specsHTML = '';
    const specsRaw = card.getAttribute('data-specs');
    if (specsRaw) {
        try {
            const specsObj = JSON.parse(specsRaw.replace(/&quot;/g, '"'));
            specsHTML = '<div class="quickview-specs"><h3>Full Specifications</h3><table class="specs-table">';
            for (const [key, val] of Object.entries(specsObj)) {
                specsHTML += `<tr><td class="spec-label">${key}</td><td class="spec-value">${val}</td></tr>`;
            }
            specsHTML += '</table></div>';
        } catch(e) {
            const basicSpecs = card.querySelector('ul')?.innerHTML || '';
            if (basicSpecs) specsHTML = '<div class="quickview-specs"><h3>Specifications</h3><ul>' + basicSpecs + '</ul></div>';
        }
    } else {
        const basicSpecs = card.querySelector('ul')?.innerHTML || '';
        if (basicSpecs) specsHTML = '<div class="quickview-specs"><h3>Specifications</h3><ul>' + basicSpecs + '</ul></div>';
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'quickview-modal';

    overlay.innerHTML = `
        <div class="quickview-content">
            <button class="quickview-close" onclick="document.getElementById('quickview-modal').remove()">✕</button>
            <div class="quickview-body">
                <div class="quickview-image">
                    <img src="${img}" alt="${name}">
                </div>
                <div class="quickview-info">
                    <h2>${name}</h2>
                    ${category ? '<span class="badge badge-user">' + category + '</span>' : ''}
                    <p class="quickview-price">$${parseInt(price).toLocaleString()}</p>
                    ${specsHTML}
                    <div class="quickview-actions">
                        <button class="btn btn-primary" onclick="quickAddToCart('${name.replace(/'/g, "\\'")}', ${price}, '${img.replace(/'/g, "\\'")}')">🛒 Add to Cart</button>
                        <button class="btn btn-secondary" onclick="document.getElementById('quickview-modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
}

function quickAddToCart(name, price, image) {
    const item = { name, price: parseInt(price), image, category: 'Quick Add' };
    addToCart(item);
    document.getElementById('quickview-modal')?.remove();
}

window.enableImageZoom = enableImageZoom;
window.enableQuickView = enableQuickView;
window.openQuickView = openQuickView;
window.quickAddToCart = quickAddToCart;
