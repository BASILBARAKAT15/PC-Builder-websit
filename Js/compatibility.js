/* ============================================================
   AI-Powered Compatibility Checker (Frontend)
   Sends request to our backend → backend calls Gemini API
   No API keys exposed in the browser
============================================================ */

const AI_COMPAT = {
    endpoint: '/api/compatibility',

    /** Gather selected components from localStorage */
    getSelectedComponents() {
        const keys = {
            Processor: 'selectedProcessor',
            'Graphics Card': 'selectedGPU',
            Motherboard: 'selectedMotherboard',
            Memory: 'selectedRAM',
            Storage: 'selectedStorage',
            'Power Supply': 'selectedPSU',
            Cooling: 'selectedCooling',
        };

        const selected = {};
        for (const [label, key] of Object.entries(keys)) {
            const val = localStorage.getItem(key);
            if (val && val !== 'None Selected') {
                selected[label] = val;
            }
        }
        return selected;
    },

    /** Call our backend which proxies to Gemini */
    async analyze(components) {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ components }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Server error ${response.status}`);
        }

        return response.json();
    },
};

/* ============================================================
   UI — Render the compatibility modal
============================================================ */

function renderCompatModal(result) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'compatibility-modal';

    const statusMap = {
        compatible: { cls: 'compat-status-pass', text: '✅ All Components are Compatible!' },
        warnings:   { cls: 'compat-status-warn', text: '⚠️ Compatible with Warnings' },
        issues:     { cls: 'compat-status-fail', text: '❌ Issues Found — Some components are NOT compatible' },
    };
    const s = statusMap[result.overall] || statusMap.issues;

    const errors   = result.checks.filter(c => c.status === 'error');
    const warnings = result.checks.filter(c => c.status === 'warning');
    const ok       = result.checks.filter(c => c.status === 'ok');

    let reportHTML = '';

    if (errors.length > 0) {
        reportHTML += '<div class="compat-section compat-errors"><h3>❌ Compatibility Issues</h3>';
        errors.forEach(e => {
            reportHTML += `
                <div class="compat-item compat-error">
                    <div class="compat-item-header">❌ ${escapeHtml(e.title)}</div>
                    <p>${escapeHtml(e.detail)}</p>
                    ${e.fix ? `<p class="compat-fix">💡 Fix: ${escapeHtml(e.fix)}</p>` : ''}
                </div>`;
        });
        reportHTML += '</div>';
    }

    if (warnings.length > 0) {
        reportHTML += '<div class="compat-section compat-warnings"><h3>⚠️ Warnings</h3>';
        warnings.forEach(w => {
            reportHTML += `
                <div class="compat-item compat-warning">
                    <div class="compat-item-header">⚠️ ${escapeHtml(w.title)}</div>
                    <p>${escapeHtml(w.detail)}</p>
                    ${w.fix ? `<p class="compat-fix">💡 Tip: ${escapeHtml(w.fix)}</p>` : ''}
                </div>`;
        });
        reportHTML += '</div>';
    }

    if (ok.length > 0) {
        reportHTML += '<div class="compat-section compat-ok"><h3>✅ Compatible</h3>';
        ok.forEach(o => {
            reportHTML += `
                <div class="compat-item compat-pass">
                    <div class="compat-item-header">✅ ${escapeHtml(o.title)}</div>
                    <p>${escapeHtml(o.detail)}</p>
                </div>`;
        });
        reportHTML += '</div>';
    }

    const scoreColor = result.score >= 80 ? '#10b981' : result.score >= 50 ? '#f59e0b' : '#ef4444';

    overlay.innerHTML = `
        <div class="orders-modal-content" style="max-width:720px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <h2 style="margin:0;">🤖 AI Compatibility Report</h2>
                <span class="ai-badge">Powered by Gemini</span>
            </div>

            <div class="compat-status ${s.cls}">${s.text}</div>

            <div class="ai-score-container">
                <div class="ai-score-label">Compatibility Score</div>
                <div class="ai-score-bar-bg">
                    <div class="ai-score-bar-fill" style="width:${result.score}%;background:${scoreColor};"></div>
                </div>
                <div class="ai-score-value" style="color:${scoreColor};">${result.score}/100</div>
            </div>

            ${reportHTML}

            ${result.recommendation ? `
            <div class="ai-recommendation">
                <strong>🤖 AI Recommendation:</strong>
                <p>${escapeHtml(result.recommendation)}</p>
            </div>` : ''}

            <button onclick="document.getElementById('compatibility-modal').remove()" class="btn-close-modal">Close</button>
        </div>
    `;

    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* ============================================================
   Loading modal
============================================================ */

function showLoadingModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'compatibility-modal';

    overlay.innerHTML = `
        <div class="orders-modal-content" style="max-width:500px;text-align:center;">
            <div class="ai-loading-icon">🤖</div>
            <h2>Analyzing Your Build...</h2>
            <p style="color:var(--text-secondary);margin:12px 0 24px;">
                AI is checking socket compatibility, power requirements,
                RAM types, cooler support, and more.
            </p>
            <div class="ai-loading-bar">
                <div class="ai-loading-bar-inner"></div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

function removeLoadingModal() {
    const el = document.getElementById('compatibility-modal');
    if (el) el.remove();
}

/* ============================================================
   Main function — called from build.html button
============================================================ */

async function showCompatibilityReport() {
    const components = AI_COMPAT.getSelectedComponents();

    if (Object.keys(components).length < 2) {
        showNotification('Select at least 2 components to check compatibility', 'info');
        return;
    }

    showLoadingModal();

    try {
        const result = await AI_COMPAT.analyze(components);
        removeLoadingModal();
        renderCompatModal(result);
    } catch (err) {
        console.error('AI Compatibility error:', err);
        removeLoadingModal();
        showNotification('AI analysis failed: ' + err.message, 'error');
    }
}

/* ============================================================
   Inject AI-specific CSS
============================================================ */
(function injectAIStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .ai-badge {
            background: linear-gradient(135deg, #4285f4, #34a853);
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 20px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .ai-score-container {
            display: flex;
            align-items: center;
            gap: 14px;
            margin: 18px 0 24px;
            padding: 16px 20px;
            background: var(--gray-50, #f9fafb);
            border-radius: 12px;
            border: 1px solid var(--border-input, #e5e7eb);
        }
        [data-theme="dark"] .ai-score-container {
            background: #1a2540;
            border-color: #334155;
        }
        .ai-score-label {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-secondary);
            white-space: nowrap;
        }
        .ai-score-bar-bg {
            flex: 1;
            height: 10px;
            background: var(--gray-200, #e5e7eb);
            border-radius: 5px;
            overflow: hidden;
        }
        [data-theme="dark"] .ai-score-bar-bg { background: #2a3a5c; }
        .ai-score-bar-fill {
            height: 100%;
            border-radius: 5px;
            transition: width 1s ease;
        }
        .ai-score-value {
            font-size: 20px;
            font-weight: 800;
            min-width: 60px;
            text-align: right;
        }
        .ai-recommendation {
            margin-top: 20px;
            padding: 16px 20px;
            background: linear-gradient(135deg, rgba(66,133,244,0.08), rgba(52,168,83,0.08));
            border-radius: 12px;
            border: 1px solid rgba(66,133,244,0.2);
            margin-bottom: 16px;
        }
        [data-theme="dark"] .ai-recommendation {
            background: linear-gradient(135deg, rgba(66,133,244,0.15), rgba(52,168,83,0.1));
            border-color: rgba(66,133,244,0.3);
        }
        .ai-recommendation strong {
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
            color: var(--text-primary);
        }
        .ai-recommendation p {
            font-size: 13px;
            line-height: 1.6;
            color: var(--text-secondary);
            margin: 0;
        }
        .ai-loading-icon {
            font-size: 56px;
            margin-bottom: 16px;
            animation: aiBounce 1.2s ease infinite;
        }
        @keyframes aiBounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-12px) scale(1.1); }
        }
        .ai-loading-bar {
            width: 100%;
            height: 6px;
            background: var(--gray-200, #e5e7eb);
            border-radius: 3px;
            overflow: hidden;
        }
        [data-theme="dark"] .ai-loading-bar { background: #2a3a5c; }
        .ai-loading-bar-inner {
            width: 40%;
            height: 100%;
            background: linear-gradient(90deg, #4285f4, #34a853, #4285f4);
            background-size: 200% 100%;
            border-radius: 3px;
            animation: aiSlide 1.5s ease infinite;
        }
        @keyframes aiSlide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
        }
    `;
    document.head.appendChild(style);
})();

/* ============================================================
   Global export
============================================================ */
window.showCompatibilityReport = showCompatibilityReport;

console.log('🤖 AI Compatibility System loaded (Gemini)');
