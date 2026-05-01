const BASE_PRICE = 2000;
const priceDisplay = document.querySelector('.price');

window.addEventListener('DOMContentLoaded', () => {
    loadSavedComponents();
    updateTotalPrice();
    setupCustomizeBtn();
    updateProgressBar();
});

function loadSavedComponents() {
    const specs = {
        processorName: 'selectedProcessor',
        gpuName: 'selectedGPU',
        motherboardName: 'selectedMotherboard',
        ramName: 'selectedRAM',
        storageName: 'selectedStorage',
        psuName: 'selectedPSU',
        coolingName: 'selectedCooling'
    };

    Object.entries(specs).forEach(([elementId, storageKey]) => {
        const el = document.getElementById(elementId);
        const val = localStorage.getItem(storageKey);
        if (el) el.textContent = val || 'None Selected';
    });
}

function updateTotalPrice() {
    const keys = ['Processor', 'GPU', 'RAM', 'Storage', 'Motherboard', 'PSU', 'Cooling', 'Peripherals'];
    let total = BASE_PRICE;
    keys.forEach(k => { total += parseInt(localStorage.getItem(`selected${k}Price`)) || 0; });

    if (priceDisplay) {
        animatePrice(parseInt(priceDisplay.textContent.replace(/[^0-9]/g, '')) || 0, total);
    }
}

function animatePrice(from, to) {
    const duration = 500;
    const steps = 30;
    const step = (to - from) / steps;
    let current = 0;
    const interval = setInterval(() => {
        current++;
        const val = Math.round(from + step * current);
        priceDisplay.textContent = `$${val.toLocaleString()}`;
        if (current >= steps) {
            clearInterval(interval);
            priceDisplay.textContent = `$${to.toLocaleString()}`;
        }
    }, duration / steps);
}

function setupCustomizeBtn() {
    const btn = document.getElementById('customizeBtn');
    const section = document.getElementById('components');
    if (!btn || !section) return;

    const openComponents = () => {
        section.classList.remove('hidden');
        section.scrollIntoView({ behavior: 'smooth' });
        btn.textContent = 'Customize More';
        setTimeout(() => animateCards('.comp-card'), 300);
    };

    btn.addEventListener('click', openComponents);

    // If the user came back from a category page (e.g. after picking a CPU),
    // processor.js/etc send them to build.html#components — auto-open the
    // components grid so they don't have to click Customize again.
    if (window.location.hash === '#components') {
        openComponents();
    }
}

function resetBuild() {
    if (confirm('Reset your build?')) {
        ['Processor','GPU','RAM','Storage','Motherboard','PSU','Cooling','Peripherals'].forEach(k => {
            localStorage.removeItem(`selected${k}`);
            localStorage.removeItem(`selected${k}Price`);
        });
        location.reload();
    }
}

function exportBuild() {
    const keys = ['Processor','GPU','RAM','Storage','Motherboard','PSU','Cooling','Peripherals'];
    const build = {};
    keys.forEach(k => {
        build[k] = localStorage.getItem(`selected${k}`) || 'None';
        build[k + 'Price'] = localStorage.getItem(`selected${k}Price`) || '0';
    });
    build.totalPrice = priceDisplay.textContent;

    const blob = new Blob([JSON.stringify(build, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'my-pc-build.json';
    link.click();
    showNotification('Build exported!', 'success');
}

const style = document.createElement('style');
style.textContent = '.hidden { display: none !important; }';
document.head.appendChild(style);

window.resetBuild = resetBuild;
window.exportBuild = exportBuild;

function updateProgressBar() {
    const components = [
        { key: 'Processor', icon: '🔧', label: 'Processor' },
        { key: 'GPU', icon: '🎮', label: 'Graphics Card' },
        { key: 'Motherboard', icon: '🔲', label: 'Motherboard' },
        { key: 'RAM', icon: '💾', label: 'Memory' },
        { key: 'Storage', icon: '💿', label: 'Storage' },
        { key: 'PSU', icon: '⚡', label: 'Power Supply' },
        { key: 'Cooling', icon: '❄️', label: 'Cooling' },
        { key: 'Peripherals', icon: '🖱️', label: 'Peripherals' },
    ];

    let selected = 0;
    const stepsContainer = document.getElementById('progressSteps');
    if (!stepsContainer) return;

    stepsContainer.innerHTML = '';

    components.forEach(comp => {
        const val = localStorage.getItem(`selected${comp.key}`);
        const done = !!val;
        if (done) selected++;

        const step = document.createElement('div');
        step.className = `progress-step ${done ? 'done' : ''}`;
        step.innerHTML = `<span class="step-icon">${done ? '✅' : comp.icon}</span> ${comp.label}`;
        stepsContainer.appendChild(step);
    });

    const pct = Math.round((selected / components.length) * 100);
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    const cartBtn = document.getElementById('addBuildToCartBtn');

    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = `${selected} / ${components.length} components selected — ${pct}%`;
    if (cartBtn) cartBtn.style.display = selected > 0 ? 'inline-block' : 'none';

    function addBuildToCart() {
        const keys = ['Processor','GPU','RAM','Storage','Motherboard','PSU','Cooling','Peripherals'];
        const items = [];

        keys.forEach(k => {
            const name  = localStorage.getItem(`selected${k}`);
            const price = parseInt(localStorage.getItem(`selected${k}Price`)) || 0;
            if (name && name !== 'None Selected') {
                items.push({ name, price, category: k, image: '' });
            }
        });

        if (items.length === 0) {
            showNotification('No components selected yet!', 'warning');
            return;
        }

        let added = 0;
        items.forEach(item => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const exists = cart.findIndex(c => c.name === item.name);
            if (exists === -1) {
                cart.push(item);
                localStorage.setItem('cart', JSON.stringify(cart));
                added++;
            }
        });

        if (typeof updateCartBadge === 'function') updateCartBadge();

        showNotification(
            added > 0
                ? `✅ ${added} component${added > 1 ? 's' : ''} added to cart!`
                : 'All components already in cart',
            added > 0 ? 'success' : 'info'
        );

        if (added > 0) {
            setTimeout(() => { window.location.href = 'cart.html'; }, 1000);
        }
    }



    window.addBuildToCart = addBuildToCart;

    function addBuildToCart() {
        const keys = ['Processor','GPU','RAM','Storage','Motherboard','PSU','Cooling','Peripherals'];
        const items = [];

        keys.forEach(k => {
            const name  = localStorage.getItem(`selected${k}`);
            const price = parseInt(localStorage.getItem(`selected${k}Price`)) || 0;
            if (name && name !== 'None Selected') {
                items.push({ name, price, category: k, image: '' });
            }
        });

        if (items.length === 0) {
            showNotification('No components selected yet!', 'warning');
            return;
        }

        let added = 0;
        items.forEach(item => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const exists = cart.findIndex(c => c.name === item.name);
            if (exists === -1) {
                cart.push(item);
                localStorage.setItem('cart', JSON.stringify(cart));
                added++;
            }
        });

        if (typeof updateCartBadge === 'function') updateCartBadge();

        showNotification(
            added > 0
                ? `✅ ${added} component${added > 1 ? 's' : ''} added to cart!`
                : 'All components already in cart',
            added > 0 ? 'success' : 'info'
        );

        if (added > 0) {
            setTimeout(() => { window.location.href = 'cart.html'; }, 1000);
        }
    }

    window.addBuildToCart = addBuildToCart;
}


