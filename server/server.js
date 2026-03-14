require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_KEY) {
    console.error('❌ GEMINI_API_KEY missing in .env');
    process.exit(1);
}

/* ================================
   Middleware
=============================== */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10kb' }));

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 12,
    message: { error: 'Too many requests. Wait a minute.' }
});

/* ================================
   Static files
=============================== */
app.use('/CSSPage', express.static(path.join(__dirname, '..', 'CSSPage')));
app.use('/HTMLPage', express.static(path.join(__dirname, '..', 'HTMLPage')));
app.use('/Image', express.static(path.join(__dirname, '..', 'Image')));
app.use('/Js', express.static(path.join(__dirname, '..', 'Js')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

app.get('/', (_req, res) => res.redirect('/HTMLPage/index.html'));

/* ================================
   Gemini API helper (lite-first)
=============================== */
async function callGemini(prompt) {
    const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
    for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
        console.log(`🤖 Trying ${model}...`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 1200,
                        responseMimeType: "application/json"
                    }
                })
            });

            if (!response.ok) {
                if (response.status === 429) {
                    console.error(`❌ ${model} RATE LIMITED (429) — using next model`);
                } else {
                    console.error(`❌ ${model} HTTP ${response.status}`);
                }
                continue;
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
                console.log(`✅ Success with ${model}`);
                return text.trim();
            }
        } catch (err) {
            console.error(`❌ ${model} error:`, err.message);
        }
    }
    return null;
}

/* ================================
   Robust JSON parser
=============================== */
function parseAIJson(text) {
    if (!text) return { error: 'Empty AI response' };

    try {
        let clean = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const start = clean.indexOf('{');
        const end = clean.lastIndexOf('}');
        if (start !== -1) {
            clean = clean.substring(start, end !== -1 ? end + 1 : clean.length);
        }

        clean = clean
            .replace(/[“”‘’]/g, '"')
            .replace(/[\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ');

        return JSON.parse(clean);
    } catch (e) {
        console.warn('⚠️ AI JSON parse failed:', e.message);
        console.warn('🔍 Raw response was:', text);
        return { error: 'AI formatting error', raw: text };
    }
}

/* ================================
   Safe Gemini with backoff
=============================== */
async function safeGemini(prompt, retries = 1) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) {
            const delay = 2000 * Math.pow(1.5, attempt - 1);
            console.log(`⏳ Rate limit cooldown — waiting ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
        }

        const text = await callGemini(prompt);
        const parsed = parseAIJson(text);

        if (!parsed.error) return parsed;
        console.log(`Retry ${attempt + 1}: JSON issue`);
    }

    return { error: 'AI failed after retries' };
}

/* ================================
   Strict JSON instruction
=============================== */
const JSON_INSTRUCTION = `\n\nCRITICAL RULES:\n- Output ONLY valid JSON, nothing else.\n- NEVER use double quotes inside string values. Use single quotes or rephrase.\n- All strings must be properly escaped.`;

/* ================================
   COMPATIBILITY ENDPOINT
=============================== */
app.post('/api/compatibility', aiLimiter, async (req, res) => {
    try {
        const { components } = req.body;
        if (!components) return res.status(400).json({ error: 'Missing components' });

        const entries = Object.entries(components).filter(([_, v]) => v && v !== 'None Selected');
        if (entries.length < 2) return res.status(400).json({ error: 'Need at least 2 components' });

        const list = entries.map(([k, v]) => `- ${k}: ${v}`).join('\n');

        const prompt = `Check compatibility of these PC parts:\n${list}\n\nReply ONLY with valid JSON:\n{\n  "overall":"compatible|issues|warnings",\n  "score":0-100,\n  "checks":[{"pair":"A + B","status":"ok|warning|error","detail":"short reason"}],\n  "recommendation":"short advice"\n}${JSON_INSTRUCTION}`;

        const data = await safeGemini(prompt);
        res.json(data);
    } catch (err) {
        console.error('Compatibility error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* ================================
   CHAT ENDPOINT
=============================== */
app.post('/api/chat', aiLimiter, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Missing message' });

        const prompt = `You are a helpful PC building assistant.\nUser: ${message}\n\nReply ONLY with this exact JSON:\n{"reply":"short helpful answer"}${JSON_INSTRUCTION}`;

        const data = await safeGemini(prompt);
        res.json(data);
    } catch (err) {
        console.error('Chat error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* ================================
   RECOMMEND ENDPOINT ← UPDATED WITH PRICE
=============================== */
app.post('/api/recommend', aiLimiter, async (req, res) => {
    try {
        const { budget, usage } = req.body;
        if (!budget || !usage) return res.status(400).json({ error: 'Missing budget or usage' });

        const prompt = `Recommend a complete PC build under $${budget} for ${usage}.
All components must be compatible. Total must be under budget.

Reply ONLY with valid JSON:
{
  "build":{
    "cpu":"AMD Ryzen 7 7800X3D ($449)",
    "gpu":"NVIDIA GeForce RTX 4090 ($1599)",
    "ram":"32GB DDR5-6000 CL30 ($129)",
    "storage":"2TB PCIe 4.0 NVMe SSD ($149)",
    "motherboard":"ASUS ROG Strix B650-E Gaming WiFi ($279)",
    "psu":"Corsair RM850x 850W 80+ Gold ($129)",
    "cooling":"NZXT Kraken Elite 360mm RGB ($199)"
  },
  "total":0,
  "reason":"short reasoning sentence",
  "performance":"short performance description"
}${JSON_INSTRUCTION}`;

        let data = await safeGemini(prompt);

        // Defaults only for recommend
        if (!data.build) data.build = {};
        ['cpu','gpu','ram','storage','motherboard','psu','cooling'].forEach(k => {
            if (!data.build[k]) data.build[k] = "Unknown";
        });
        if (typeof data.total !== 'number') data.total = 0;
        if (!data.reason) data.reason = "AI returned incomplete build";
        if (!data.performance) data.performance = "Unknown";

        // DEBUG: شوف الرد الكامل من الـ AI
        console.log('✅ AI Recommend Response:', JSON.stringify(data, null, 2));

        res.json(data);
    } catch (err) {
        console.error('Recommend error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* ================================
   Start server
=============================== */
app.listen(PORT, () => {
    console.log('');
    console.log('=================================');
    console.log('🖥 PC Builder Server Running');
    console.log(`🌐 http://localhost:${PORT}`);
    console.log('🤖 AI: Google Gemini (lite-first + price included)');
    console.log('=================================');
    console.log('');
});