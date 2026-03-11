/* ============================================================
   AI Build Recommender
   Suggests a full PC build based on budget + usage
============================================================ */

function showBuildRecommender() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'recommend-modal';

    overlay.innerHTML = `
        <div class="orders-modal-content" style="max-width:550px;">
            <h2 style="margin-bottom:4px;">💡 AI Build Recommender</h2>
            <p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px;">Tell us your budget and usage — AI will suggest the perfect build.</p>

            <div id="recommend-form">
                <label style="font-size:13px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:6px;">Budget (USD)</label>
                <div class="recommend-budget-btns">
                    <button class="budget-btn" onclick="setBudget(800)">$800</button>
                    <button class="budget-btn" onclick="setBudget(1200)">$1,200</button>
                    <button class="budget-btn" onclick="setBudget(1800)">$1,800</button>
                    <button class="budget-btn" onclick="setBudget(2500)">$2,500</button>
                </div>
                <input type="number" id="recommend-budget" class="search-input" placeholder="Or type custom budget..." style="margin:10px 0;">

                <label style="font-size:13px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:6px;">Primary Usage</label>
                <div class="recommend-usage-btns">
                    <button class="usage-btn" onclick="setUsage('Gaming (1080p)')">🎮 Gaming 1080p</button>
                    <button class="usage-btn" onclick="setUsage('Gaming (1440p/4K)')">🎮 Gaming 4K</button>
                    <button class="usage-btn" onclick="setUsage('Video Editing & Content Creation')">🎬 Content Creation</button>
                    <button class="usage-btn" onclick="setUsage('Programming & Development')">💻 Programming</button>
                    <button class="usage-btn" onclick="setUsage('General Office & Productivity')">📊 Office</button>
                    <button class="usage-btn" onclick="setUsage('Streaming & Gaming')">📺 Streaming</button>
                </div>

                <button class="compat-check-btn" onclick="getRecommendation()" style="margin-top:20px;">
                    🤖 Get AI Recommendation
                </button>
            </div>

            <div id="recommend-loading" style="display:none;text-align:center;padding:30px;">
                <div class="ai-loading-icon">💡</div>
                <h3>Building your perfect PC...</h3>
                <p style="color:var(--text-secondary);font-size:13px;">AI is finding the best components for your budget.</p>
                <div class="ai-loading-bar" style="margin-top:16px;"><div class="ai-loading-bar-inner"></div></div>
            </div>

            <div id="recommend-result" style="display:none;"></div>

            <button onclick="document.getElementById('recommend-modal').remove()" class="btn-close-modal" style="margin-top:16px;">Close</button>
        </div>
    `;

    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
}

function setBudget(val) {
    document.getElementById('recommend-budget').value = val;
    document.querySelectorAll('.budget-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

function setUsage(val) {
    document.getElementById('recommend-usage-val').value = val;
    document.querySelectorAll('.usage-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

async function getRecommendation() {
    const budget = parseInt(document.getElementById('recommend-budget').value);
    const usageBtn = document.querySelector('.usage-btn.active');
    const usage = usageBtn ? usageBtn.textContent.replace(/^[^\s]+\s/, '') : '';

    if (!budget || budget < 500) {
        showNotification('Please enter a budget of at least $500', 'warning');
        return;
    }
    if (!usage) {
        showNotification('Please select a usage type', 'warning');
        return;
    }

    document.getElementById('recommend-form').style.display = 'none';
    document.getElementById('recommend-loading').style.display = 'block';
    document.getElementById('recommend-result').style.display = 'none';

    try {
        const res = await fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ budget, usage }),
        });

        if (!res.ok) throw new Error('Server error');

        const data = await res.json();
        document.getElementById('recommend-loading').style.display = 'none';
        renderRecommendation(data, budget, usage);
    } catch (err) {
        document.getElementById('recommend-loading').style.display = 'none';
        document.getElementById('recommend-form').style.display = 'block';
        showNotification('AI recommendation failed. Try again.', 'error');
    }
}

function renderRecommendation(data, budget, usage) {
    const result = document.getElementById('recommend-result');
    result.style.display = 'block';

    const b = data.build;
    const components = [
        { icon: '🔧', label: 'Processor', ...b.processor },
        { icon: '🎮', label: 'Graphics Card', ...b.gpu },
        { icon: '🔲', label: 'Motherboard', ...b.motherboard },
        { icon: '💾', label: 'Memory', ...b.ram },
        { icon: '💿', label: 'Storage', ...b.storage },
        { icon: '⚡', label: 'Power Supply', ...b.psu },
        { icon: '❄️', label: 'Cooling', ...b.cooling },
    ];

    const escHtml = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

    let html = `
        <div class="ai-recommend-header">
            <div>
                <span class="ai-badge" style="margin-bottom:6px;display:inline-block;">AI Recommended</span>
                <h3 style="margin:0;">Build for ${escHtml(usage)}</h3>
            </div>
            <div class="ai-recommend-total">$${data.total.toLocaleString()}<span style="font-size:12px;color:var(--text-secondary);display:block;">of $${budget.toLocaleString()} budget</span></div>
        </div>
        <div class="ai-recommend-parts">
    `;

    components.forEach(c => {
        html += `
            <div class="ai-recommend-part">
                <span class="ai-part-icon">${c.icon}</span>
                <div class="ai-part-info">
                    <strong>${escHtml(c.name)}</strong>
                    <span>${c.label}</span>
                </div>
                <span class="ai-part-price">$${c.price}</span>
            </div>`;
    });

    html += '</div>';

    if (data.reasoning) {
        html += `<div class="ai-recommendation"><strong>💡 Why this build:</strong><p>${escHtml(data.reasoning)}</p></div>`;
    }
    if (data.performance) {
        html += `<div class="ai-recommendation" style="border-color:rgba(52,168,83,0.3);"><strong>🚀 Expected Performance:</strong><p>${escHtml(data.performance)}</p></div>`;
    }

    html += `<button class="compat-check-btn" onclick="applyRecommendation()" style="margin-top:14px;">✅ Apply This Build</button>`;

    result.innerHTML = html;

    // Store for applying
    window._lastRecommendation = data.build;
}

function applyRecommendation() {
    const b = window._lastRecommendation;
    if (!b) return;

    const map = {
        processor:    { key: 'Processor', cart: 'Processor' },
        gpu:          { key: 'GPU',       cart: 'Graphics Card' },
        motherboard:  { key: 'Motherboard', cart: 'Motherboard' },
        ram:          { key: 'RAM',       cart: 'Memory' },
        storage:      { key: 'Storage',   cart: 'Storage' },
        psu:          { key: 'PSU',       cart: 'Power Supply' },
        cooling:      { key: 'Cooling',   cart: 'Cooling' },
    };

    for (const [field, info] of Object.entries(map)) {
        if (b[field] && b[field].name) {
            localStorage.setItem(`selected${info.key}`, b[field].name);
            localStorage.setItem(`selected${info.key}Price`, b[field].price);
        }
    }

    document.getElementById('recommend-modal')?.remove();
    showNotification('AI build applied! Reloading...', 'success');
    setTimeout(() => location.reload(), 1000);
}

/* ============================================================
   Inject CSS
============================================================ */
(function injectRecommenderCSS() {
    const style = document.createElement('style');
    style.textContent = `
        .recommend-budget-btns, .recommend-usage-btns {
            display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;
        }
        .budget-btn, .usage-btn {
            padding: 8px 16px; border-radius: 10px; border: 1px solid var(--border-input, #e5e7eb);
            background: var(--bg-input, #f9fafb); color: var(--text-primary); font-size: 13px;
            font-weight: 600; cursor: pointer; transition: 0.2s; font-family: var(--font);
        }
        .budget-btn:hover, .usage-btn:hover { border-color: var(--primary); color: var(--primary); }
        .budget-btn.active, .usage-btn.active {
            background: var(--primary); color: #fff; border-color: var(--primary);
        }
        [data-theme="dark"] .budget-btn, [data-theme="dark"] .usage-btn {
            background: #1a2540; border-color: #334155;
        }
        [data-theme="dark"] .budget-btn.active, [data-theme="dark"] .usage-btn.active {
            background: var(--primary); border-color: var(--primary);
        }

        .ai-recommend-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 16px 0; border-bottom: 1px solid var(--border-input, #e5e7eb); margin-bottom: 16px;
        }
        .ai-recommend-total {
            font-size: 28px; font-weight: 800; color: var(--primary);
        }
        .ai-recommend-parts { display: flex; flex-direction: column; gap: 8px; }
        .ai-recommend-part {
            display: flex; align-items: center; gap: 12px; padding: 10px 14px;
            background: var(--gray-50, #f9fafb); border-radius: 10px;
            border: 1px solid var(--border-input, #e5e7eb);
        }
        [data-theme="dark"] .ai-recommend-part { background: #1a2540; border-color: #334155; }
        .ai-part-icon { font-size: 20px; }
        .ai-part-info { flex: 1; }
        .ai-part-info strong { display: block; font-size: 13px; color: var(--text-primary); }
        .ai-part-info span { font-size: 11px; color: var(--text-secondary); }
        .ai-part-price { font-weight: 700; color: var(--primary); font-size: 14px; }
    `;
    document.head.appendChild(style);

    // Hidden input for usage value
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = 'recommend-usage-val';
    document.body.appendChild(hidden);
})();

window.showBuildRecommender = showBuildRecommender;
window.setBudget = setBudget;
window.setUsage = setUsage;
window.getRecommendation = getRecommendation;
window.applyRecommendation = applyRecommendation;

console.log('💡 AI Build Recommender loaded');
