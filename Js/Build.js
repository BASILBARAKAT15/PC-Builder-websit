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
    if (btn && section) {
        btn.addEventListener('click', () => {
            section.classList.remove('hidden');
            section.scrollIntoView({ behavior: 'smooth' });
            btn.textContent = 'Customize More';
            setTimeout(() => animateCards('.comp-card'), 300);
        });
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

    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = `${selected} / ${components.length} components selected — ${pct}%`;
}
