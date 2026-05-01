/* ============================================================
   AI Chat Assistant — Floating chat widget
   Helps users choose PC components via conversation
============================================================ */

const AI_CHAT = {
    history: [],
    isOpen: false,

    /** Get current build from localStorage */
    getCurrentBuild() {
        const keys = {
            Processor: 'selectedProcessor',
            'Graphics Card': 'selectedGPU',
            Motherboard: 'selectedMotherboard',
            Memory: 'selectedRAM',
            Storage: 'selectedStorage',
            'Power Supply': 'selectedPSU',
            Cooling: 'selectedCooling',
        };
        const build = {};
        for (const [label, key] of Object.entries(keys)) {
            const val = localStorage.getItem(key);
            if (val && val !== 'None Selected') build[label] = val;
        }
        return build;
    },

    /** Send message to backend */
    async send(message) {
        this.history.push({ role: 'User', text: message });
        this.renderMessage('user', message);
        this.showTyping();

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    history: this.history.slice(-6),
                    currentBuild: this.getCurrentBuild(),
                }),
            });

            this.hideTyping();

            if (!res.ok) throw new Error('Server error');

            const data = await res.json();
            const reply = data.reply || 'Sorry, I could not process that.';
            this.history.push({ role: 'Assistant', text: reply });
            this.renderMessage('ai', reply);
        } catch (err) {
            this.hideTyping();
            this.renderMessage('ai', 'Connection error. Please try again.');
        }
    },

    renderMessage(type, text) {
        const container = document.getElementById('ai-chat-messages');
        if (!container) return;

        const msg = document.createElement('div');
        msg.className = `chat-msg chat-msg-${type}`;

        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.textContent = text;

        msg.appendChild(bubble);
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    },

    showTyping() {
        const container = document.getElementById('ai-chat-messages');
        if (!container) return;
        const typing = document.createElement('div');
        typing.id = 'chat-typing';
        typing.className = 'chat-msg chat-msg-ai';
        typing.innerHTML = '<div class="chat-bubble chat-typing-dots"><span></span><span></span><span></span></div>';
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
    },

    hideTyping() {
        const el = document.getElementById('chat-typing');
        if (el) el.remove();
    },

    toggle() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('ai-chat-panel');
        if (panel) panel.classList.toggle('open', this.isOpen);
    },
};

/* ============================================================
   Inject Chat Widget HTML + CSS
============================================================ */
(function initChatWidget() {
    // CSS
    const style = document.createElement('style');
    style.textContent = `
        .ai-chat-fab {
            position: fixed;
            bottom: 90px;
            right: 30px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4285f4, #34a853);
            color: #fff;
            border: none;
            font-size: 26px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(66,133,244,0.4);
            z-index: 997;
            transition: 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .ai-chat-fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(66,133,244,0.5); }

        #ai-chat-panel {
            position: fixed;
            bottom: 160px;
            right: 30px;
            width: 370px;
            height: 480px;
            background: var(--bg-card, #fff);
            border-radius: 16px;
            box-shadow: 0 16px 48px rgba(0,0,0,0.2);
            border: 1px solid var(--border-input, #e5e7eb);
            z-index: 998;
            display: none;
            flex-direction: column;
            overflow: hidden;
        }
        #ai-chat-panel.open { display: flex; animation: chatSlideUp 0.3s ease; }

        @keyframes chatSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .chat-header {
            padding: 16px 20px;
            background: linear-gradient(135deg, #4285f4, #34a853);
            color: #fff;
            font-weight: 700;
            font-size: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .chat-close { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; opacity: 0.8; }
        .chat-close:hover { opacity: 1; }

        #ai-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .chat-msg { display: flex; }
        .chat-msg-user { justify-content: flex-end; }
        .chat-msg-ai { justify-content: flex-start; }

        .chat-bubble {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 13px;
            line-height: 1.5;
            word-wrap: break-word;
        }
        .chat-msg-user .chat-bubble {
            background: var(--primary, #2563eb);
            color: #fff;
            border-bottom-right-radius: 4px;
        }
        .chat-msg-ai .chat-bubble {
            background: var(--gray-100, #f3f4f6);
            color: var(--text-primary, #111);
            border-bottom-left-radius: 4px;
        }
        [data-theme="dark"] .chat-msg-ai .chat-bubble {
            background: #1a2540;
            color: #e2e8f0;
        }

        .chat-typing-dots { display: flex; gap: 4px; padding: 12px 16px; }
        .chat-typing-dots span {
            width: 8px; height: 8px; border-radius: 50%;
            background: var(--gray-400, #9ca3af);
            animation: typingDot 1.2s ease infinite;
        }
        .chat-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .chat-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingDot {
            0%, 100% { opacity: 0.3; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-4px); }
        }

        .chat-input-area {
            display: flex;
            gap: 8px;
            padding: 12px 16px;
            border-top: 1px solid var(--border-input, #e5e7eb);
            background: var(--bg-card, #fff);
        }
        [data-theme="dark"] .chat-input-area { background: #1e293b; border-color: #334155; }

        .chat-input-area input {
            flex: 1;
            padding: 10px 14px;
            border: 1px solid var(--border-input, #e5e7eb);
            border-radius: 10px;
            font-size: 13px;
            font-family: var(--font);
            background: var(--bg-input, #f9fafb);
            color: var(--text-primary, #111);
            outline: none;
        }
        .chat-input-area input:focus { border-color: var(--primary, #2563eb); }

        .chat-send-btn {
            padding: 10px 16px;
            background: var(--primary, #2563eb);
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: 0.2s;
        }
        .chat-send-btn:hover { background: var(--primary-hover, #1d4ed8); }

        .chat-suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 0 16px 12px;
        }
        .chat-suggestion {
            padding: 6px 12px;
            background: var(--gray-100, #f3f4f6);
            border: 1px solid var(--border-input, #e5e7eb);
            border-radius: 20px;
            font-size: 11px;
            cursor: pointer;
            transition: 0.2s;
            color: var(--text-secondary);
        }
        .chat-suggestion:hover { background: var(--primary-light, #dbeafe); color: var(--primary); border-color: var(--primary); }
        [data-theme="dark"] .chat-suggestion { background: #1a2540; border-color: #334155; }

        @media (max-width: 480px) {
            #ai-chat-panel { width: calc(100vw - 24px); right: 12px; bottom: 80px; height: 70vh; }
            .ai-chat-fab { bottom: 16px; right: 16px; }
        }
    `;
    document.head.appendChild(style);

    // HTML
    const fab = document.createElement('button');
    fab.className = 'ai-chat-fab';
    fab.innerHTML = '🤖';
    fab.title = 'AI Assistant';
    fab.onclick = () => AI_CHAT.toggle();

    const panel = document.createElement('div');
    panel.id = 'ai-chat-panel';
    panel.innerHTML = `
        <div class="chat-header">
            <span>🤖 AI PC Assistant</span>
            <button class="chat-close" onclick="AI_CHAT.toggle()">✕</button>
        </div>
        <div id="ai-chat-messages">
            <div class="chat-msg chat-msg-ai">
                <div class="chat-bubble">Hi! I'm your PC building assistant. Ask me anything about components, compatibility, or what to buy for your budget!</div>
            </div>
        </div>
        <div class="chat-suggestions">
            <button class="chat-suggestion" onclick="AI_CHAT.send('Best GPU for 1080p gaming?')">Best GPU for 1080p?</button>
            <button class="chat-suggestion" onclick="AI_CHAT.send('What CPU goes well with RTX 4070?')">CPU for RTX 4070?</button>
            <button class="chat-suggestion" onclick="AI_CHAT.send('Is 650W PSU enough for my build?')">Is 650W enough?</button>
        </div>
        <div class="chat-input-area">
            <input type="text" id="ai-chat-input" placeholder="Ask anything..." autocomplete="off">
            <button class="chat-send-btn" onclick="sendChatMessage()">Send</button>
        </div>
    `;

    document.body.appendChild(panel);
    document.body.appendChild(fab);

    // Enter key sends message
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && document.activeElement?.id === 'ai-chat-input') {
            sendChatMessage();
        }
    });
})();

function sendChatMessage() {
    const input = document.getElementById('ai-chat-input');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    AI_CHAT.send(msg);
}

window.AI_CHAT = AI_CHAT;
window.sendChatMessage = sendChatMessage;

console.log('🤖 AI Chat Assistant loaded');
