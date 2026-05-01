// ==========================
// products-sync.js
// Reconciles hard-coded product cards on category pages with the DB.
// On load:
//   1. Collects existing cards on the page (by data-name).
//   2. Fetches products from the API.
//   3. Hides cards whose product was deleted from the DB.
//   4. Adds cards for products in the DB that aren't already on the page.
//   5. Re-runs the page's per-card initializers.
// ==========================

(function () {
    // page-id -> { dbCategory: string, cardClass: string, gridSelector: string,
    //              uiCategory: string, addFn: 'addComponentToCart'|'addToCart',
    //              addCategoryArg?: string }
    const PAGE_MAP = {
        'processor.html': {
            dbCategory: 'CPU', cardClass: 'comp-card', gridSelector: '.grid',
            uiCategory: 'Processor', addFn: 'addComponentToCart', addCategoryArg: 'Processor',
        },
        'GraphicsCard.html': {
            dbCategory: 'GPU', cardClass: 'comp-card', gridSelector: '.grid',
            uiCategory: 'Graphics Card', addFn: 'addComponentToCart', addCategoryArg: 'GPU',
        },
        'Memory.html': {
            dbCategory: 'RAM', cardClass: 'memory-card', gridSelector: '.grid',
            uiCategory: 'Memory', addFn: 'addComponentToCart', addCategoryArg: 'RAM',
        },
        'Motherboard.html': {
            dbCategory: 'Motherboard', cardClass: 'mb-card', gridSelector: '.grid',
            uiCategory: 'Motherboard', addFn: 'addComponentToCart', addCategoryArg: 'Motherboard',
        },
        'Storage.html': {
            dbCategory: 'Storage', cardClass: 'storage-card', gridSelector: '.grid',
            uiCategory: 'Storage', addFn: 'addComponentToCart', addCategoryArg: 'Storage',
        },
        'PowerSupply.html': {
            dbCategory: 'Power Supply', cardClass: 'psu-card', gridSelector: '.grid',
            uiCategory: 'Power Supply', addFn: 'addComponentToCart', addCategoryArg: 'PSU',
        },
        'CoolingSystem.html': {
            dbCategory: 'Cooling', cardClass: 'cooling-card', gridSelector: '.grid',
            uiCategory: 'Cooling', addFn: 'addComponentToCart', addCategoryArg: 'Cooling',
        },
        'GamingPeripherals.html': {
            dbCategory: 'Peripherals', cardClass: 'peripheral-card', gridSelector: '.grid',
            uiCategory: 'Peripherals', addFn: 'addToCart',
        },
        'prebuilt.html': {
            dbCategory: 'Pre-Built', cardClass: 'comp-card', gridSelector: '.grid',
            uiCategory: 'Pre-Built', addFn: 'addToCart',
        },
        'trending.html': {
            dbCategory: 'Trending', cardClass: 'trend-card', gridSelector: '.grid',
            uiCategory: 'Trending', addFn: 'addToCart',
        },
    };

    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        }[c]));
    }

    function pageKey() {
        const file = window.location.pathname.split('/').pop();
        return file in PAGE_MAP ? file : null;
    }

    function buildDynamicCard(product, cfg) {
        const div = document.createElement('div');
        div.className = cfg.cardClass + ' dynamic-product';
        div.dataset.name  = product.name;
        div.dataset.price = product.price;
        div.dataset.image = product.image || '';

        // Embed specs so quickview / compare read them the same way as
        // hard-coded HTML cards (via data-specs with &quot; escaping).
        if (product.specs && typeof product.specs === 'object') {
            try {
                div.setAttribute('data-specs', JSON.stringify(product.specs).replace(/"/g, '&quot;'));
            } catch (_) {}
        }

        // Build the bullet list: prefer specs, otherwise category + stock.
        let liHTML = '';
        if (product.specs && typeof product.specs === 'object') {
            const entries = Object.entries(product.specs).slice(0, 4);
            liHTML = entries.map(([k, v]) =>
                `<li>${escapeHtml(k)}: ${escapeHtml(v)}</li>`
            ).join('');
        }
        if (!liHTML) {
            liHTML = `
                <li>Category: ${escapeHtml(product.category)}</li>
                <li>In stock: ${product.stock}</li>
                <li>Added by admin</li>
            `;
        }

        div.innerHTML = `
            <img src="${escapeHtml(product.image || '')}" alt="${escapeHtml(product.name)}"
                 onerror="this.src='../Image/PCImage.png'">
            <h3>${escapeHtml(product.name)}</h3>
            <ul>${liHTML}</ul>
            <p class="price">$${parseFloat(product.price).toLocaleString()}</p>
            <button class="select-btn buy-btn">${cfg.addFn === 'addComponentToCart' ? 'Select' : 'Add to Cart'}</button>
        `;

        // Wire up the button using the same convention as the page's own JS.
        const btn = div.querySelector('button');
        btn.addEventListener('click', () => {
            const item = {
                name:     product.name,
                price:    parseFloat(product.price),
                image:    product.image || '',
                category: cfg.uiCategory,
            };
            if (cfg.addFn === 'addComponentToCart' && typeof addComponentToCart === 'function') {
                if (addComponentToCart(item, cfg.addCategoryArg)) {
                    setTimeout(() => { window.location.href = 'build.html#components'; }, 1200);
                }
            } else if (typeof addToCart === 'function') {
                addToCart(item);
            }
        });

        return div;
    }

    async function syncWithDb() {
        const key = pageKey();
        if (!key) return;
        const cfg = PAGE_MAP[key];
        if (!window.API || !API.products || !API.products.list) return;

        let products;
        try {
            const res = await API.products.list();
            products = (res.products || []).filter(
                p => String(p.category).toLowerCase() === cfg.dbCategory.toLowerCase()
            );
        } catch (e) {
            console.warn('products-sync: failed to fetch', e);
            return;
        }

        const dbNames = new Set(products.map(p => String(p.name).trim().toLowerCase()));

        // 1. Hide HTML cards whose product no longer exists in DB.
        const existingCards = document.querySelectorAll('.' + cfg.cardClass);
        const existingNames = new Set();
        existingCards.forEach(card => {
            const name = (card.dataset.name || '').trim().toLowerCase();
            if (!name) return;
            existingNames.add(name);
            if (!dbNames.has(name)) {
                card.style.display = 'none';
                card.setAttribute('data-removed-by-admin', 'true');
            }
        });

        // 2. Append cards for DB products that aren't on the page yet.
        const grid = document.querySelector(cfg.gridSelector);
        if (!grid) return;
        let added = 0;
        for (const p of products) {
            const key = String(p.name).trim().toLowerCase();
            if (existingNames.has(key)) continue;
            grid.appendChild(buildDynamicCard(p, cfg));
            added++;
        }

        // 3. Re-trigger initializers if the page provided them via utils.js.
        // All these init functions are idempotent (they skip cards that
        // already have the button/listener), so it's safe to call them on
        // the whole selector including the original hard-coded cards.
        if (added > 0) {
            const sel = '.' + cfg.cardClass;
            try { typeof animateCards       === 'function' && animateCards(sel);       } catch {}
            try { typeof addStarRatings     === 'function' && addStarRatings(sel);     } catch {}
            try { typeof enableImageZoom    === 'function' && enableImageZoom(sel);    } catch {}
            try { typeof enableQuickView    === 'function' && enableQuickView(sel);    } catch {}
            try { typeof addWishlistButtons === 'function' && addWishlistButtons(sel); } catch {}
            try { typeof addCompareButtons  === 'function' && addCompareButtons(sel);  } catch {}
            try { typeof addHoverEffects    === 'function' && addHoverEffects(sel);    } catch {}
        }
    }

    // Run after the page's own DOMContentLoaded handlers (which set up the
    // hard-coded cards), then reconcile.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(syncWithDb, 50));
    } else {
        setTimeout(syncWithDb, 50);
    }
})();
