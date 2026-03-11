require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

/* ============================================================
   Validate API key on startup
============================================================ */
if (!GEMINI_KEY || GEMINI_KEY === 'YOUR_GEMINI_KEY_HERE') {
    console.error('\n❌ GEMINI_API_KEY is not set!');
    console.error('   1. Go to https://aistudio.google.com/apikey');
    console.error('   2. Click "Create API Key" (free, no credit card)');
    console.error('   3. Copy .env.example to .env and paste the key');
    console.error('   4. Restart: npm start\n');
    process.exit(1);
}

/* ============================================================
   Middleware
============================================================ */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Rate limit: 15 requests per minute per IP
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { error: 'Too many requests. Please wait a minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/* ============================================================
   Serve frontend (static files)
============================================================ */
app.use('/CSSPage',  express.static(path.join(__dirname, '..', 'CSSPage')));
app.use('/HTMLPage', express.static(path.join(__dirname, '..', 'HTMLPage')));
app.use('/Image',    express.static(path.join(__dirname, '..', 'Image')));
app.use('/Js',       express.static(path.join(__dirname, '..', 'Js')));
app.use('/admin',    express.static(path.join(__dirname, '..', 'admin')));

app.get('/', (_req, res) => {
    res.redirect('/HTMLPage/index.html');
});

/* ============================================================
   Test endpoint — visit http://localhost:3000/api/test
   to verify your Gemini API key works
============================================================ */
app.get('/api/test', async (_req, res) => {
    console.log('\n🔑 Testing Gemini API key...');
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Say OK' }] }],
                    generationConfig: { maxOutputTokens: 10 },
                }),
            });

            if (response.ok) {
                console.log(`✅ ${model} works!`);
                return res.json({ status: 'ok', model, message: 'API key is working!' });
            } else {
                console.log(`❌ ${model}: HTTP ${response.status}`);
            }
        } catch (err) {
            console.log(`❌ ${model}: ${err.message}`);
        }
    }

    res.status(500).json({
        status: 'error',
        message: 'API key is NOT working. Get a new one from https://aistudio.google.com/apikey'
    });
});

/* ============================================================
   Shared Gemini API Helper
============================================================ */
async function callGemini(prompt) {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];

    for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
        console.log(`🤖 Trying ${model}...`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (text) {
                    console.log(`✅ Success with ${model}`);
                    return text;
                }
            } else {
                const err = await response.text();
                console.error(`❌ ${model} (${response.status}):`, err.substring(0, 150));
            }
        } catch (e) {
            console.error(`❌ ${model} error:`, e.message);
        }
    }
    return null;
}

/** Parse JSON from AI response (strips markdown fences) */
function parseAIJson(text) {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
}

/* ============================================================
   AI Compatibility Endpoint
   POST /api/compatibility
============================================================ */
app.post('/api/compatibility', aiLimiter, async (req, res) => {
    try {
        const { components } = req.body;

        if (!components || typeof components !== 'object') {
            return res.status(400).json({ error: 'Missing components object' });
        }

        const entries = Object.entries(components).filter(
            ([, v]) => v && v !== 'None Selected'
        );

        if (entries.length < 2) {
            return res.status(400).json({ error: 'Need at least 2 components' });
        }

        const list = entries.map(([cat, name]) => `- ${cat}: ${name}`).join('\n');

        const prompt = `You are a PC hardware expert. Check compatibility of these components:

${list}

Check: CPU socket vs motherboard, RAM type vs motherboard, GPU power vs PSU wattage, cooler socket vs CPU, storage interface vs motherboard.

Reply with ONLY a JSON object, keep descriptions SHORT (under 15 words each):
{"overall":"compatible|issues|warnings","score":0-100,"checks":[{"pair":"A + B","status":"ok|error|warning","title":"short title","detail":"short explanation","fix":"short fix or empty"}],"recommendation":"one sentence"}`;

        const text = await callGemini(prompt);
        if (!text) return res.status(502).json({ error: 'AI service unavailable' });

        res.json(parseAIJson(text));
    } catch (err) {
        console.error('Compatibility error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* ============================================================
   AI Chat Assistant Endpoint
   POST /api/chat
   Body: { message: "user question", history: [...] }
============================================================ */
app.post('/api/chat', aiLimiter, async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Missing message' });
        }

        // Build conversation context
        let context = '';
        if (Array.isArray(history) && history.length > 0) {
            const last5 = history.slice(-5);
            context = last5.map(m => `${m.role}: ${m.text}`).join('\n') + '\n';
        }

        // Get current build state
        const build = req.body.currentBuild || {};
        let buildInfo = '';
        const buildEntries = Object.entries(build).filter(([,v]) => v && v !== 'None Selected');
        if (buildEntries.length > 0) {
            buildInfo = `\nUser's current build:\n${buildEntries.map(([k,v]) => `- ${k}: ${v}`).join('\n')}\n`;
        }

        const prompt = `You are a friendly PC building assistant for a PC Builder e-commerce store. Help users choose the right components.

Available products in our store:
- Processors: AMD Ryzen 5 7600X ($249), AMD Ryzen 9 7950X ($699), Intel i7-14700K ($419), Intel i9-14900K ($589)
- GPUs: RTX 4060 ($299), RTX 4070 ($549), RTX 4080 ($1199), RTX 4090 ($1599), RX 7600 ($269), RX 7700 XT ($449), RX 7800 XT ($599), RX 7900 XTX ($999)
- Motherboards: ASUS ROG Strix Z790-E ($400), MSI MPG B550 Gaming Edge ($180), Gigabyte Z690 AORUS Elite ($290), ASRock B660 Steel Legend ($130), EVGA Z590 FTW ($250), ASUS TUF B550-Plus ($150), Gigabyte B660M DS3H ($100), ASUS ROG Strix B550-F ($190)
- RAM: Corsair Vengeance RGB Pro 16GB ($90), G.Skill Trident Z RGB 32GB ($160), Kingston HyperX Fury 16GB ($70), Crucial Ballistix 32GB ($130), ADATA XPG 16GB ($65), Patriot Viper 16GB ($60), Team T-Force 16GB ($55), Team Night Hawk 32GB ($145)
- Storage: Samsung 980 Pro 1TB NVMe ($130), WD Black SN850 1TB NVMe ($120), Kingston KC3000 1TB NVMe ($110), Crucial P5 Plus 2TB NVMe ($180), Samsung 870 EVO 1TB SATA ($90), Crucial MX500 1TB SATA ($70), Seagate Barracuda 2TB HDD ($55), WD Blue 4TB HDD ($80)
- PSUs: Corsair RM850x 850W ($130), EVGA SuperNOVA 750W ($110), Seasonic Focus GX-650W ($90), Cooler Master V750 ($100), NZXT C850 850W ($130), Be Quiet! 750W ($120), Corsair CX650M ($70), Thermaltake 850W ($140)
- Cooling: Noctua NH-D15 ($100), Corsair iCUE H100i ($130), be quiet! Dark Rock Pro 4 ($90), NZXT Kraken X63 ($150), Cooler Master Hyper 212 ($45), Corsair H150i Elite ($170), Deepcool Gammaxx 400 ($30), Arctic Liquid Freezer II 280 ($110)
${buildInfo}
${context}User: ${message}

Reply in a helpful, concise way (max 3 sentences). If they ask what to buy, recommend FROM OUR STORE ONLY. Reply with ONLY a JSON:
{"reply":"your helpful response"}`;

        const text = await callGemini(prompt);
        if (!text) return res.status(502).json({ error: 'AI service unavailable' });

        res.json(parseAIJson(text));
    } catch (err) {
        console.error('Chat error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* ============================================================
   AI Build Recommender Endpoint
   POST /api/recommend
   Body: { budget: 1500, usage: "gaming" }
============================================================ */
app.post('/api/recommend', aiLimiter, async (req, res) => {
    try {
        const { budget, usage } = req.body;

        if (!budget || !usage) {
            return res.status(400).json({ error: 'Missing budget or usage' });
        }

        const prompt = `You are a PC build expert. Recommend a COMPLETE PC build from ONLY these products:

Processors: AMD Ryzen 5 7600X ($249), AMD Ryzen 9 7950X ($699), Intel i7-14700K ($419), Intel i9-14900K ($589)
GPUs: RTX 4060 ($299), RTX 4070 ($549), RTX 4080 ($1199), RTX 4090 ($1599), RX 7600 ($269), RX 7700 XT ($449), RX 7800 XT ($599), RX 7900 XTX ($999)
Motherboards: ASUS ROG Strix Z790-E ($400), MSI MPG B550 Gaming Edge ($180), Gigabyte Z690 AORUS Elite ($290), ASRock B660 Steel Legend ($130), EVGA Z590 FTW ($250), ASUS TUF B550-Plus ($150), Gigabyte B660M DS3H ($100), ASUS ROG Strix B550-F ($190)
RAM: Corsair Vengeance RGB Pro 16GB DDR4 ($90), G.Skill Trident Z RGB 32GB DDR4 ($160), Kingston HyperX Fury 16GB DDR4 ($70), Crucial Ballistix 32GB DDR4 ($130), ADATA XPG 16GB DDR4 ($65), Patriot Viper 16GB DDR4 ($60), Team T-Force 16GB DDR4 ($55), Team Night Hawk 32GB DDR4 ($145)
Storage: Samsung 980 Pro 1TB NVMe ($130), WD Black SN850 1TB NVMe ($120), Kingston KC3000 1TB NVMe ($110), Crucial P5 Plus 2TB NVMe ($180), Samsung 870 EVO 1TB SATA ($90), Crucial MX500 1TB SATA ($70), Seagate Barracuda 2TB HDD ($55), WD Blue 4TB HDD ($80)
PSUs: Corsair RM850x 850W ($130), EVGA SuperNOVA 750W ($110), Seasonic Focus GX-650W ($90), Cooler Master V750 ($100), NZXT C850 850W ($130), Be Quiet! 750W ($120), Corsair CX650M 650W ($70), Thermaltake 850W ($140)
Cooling: Noctua NH-D15 ($100), Corsair iCUE H100i ($130), be quiet! Dark Rock Pro 4 ($90), NZXT Kraken X63 ($150), Cooler Master Hyper 212 ($45), Corsair H150i Elite ($170), Deepcool Gammaxx 400 ($30), Arctic Liquid Freezer II 280 ($110)

Budget: $${budget}
Usage: ${usage}

IMPORTANT: All components MUST be compatible (correct socket, RAM type, enough PSU power). Total must be UNDER budget.

Reply with ONLY a JSON (keep reasoning short):
{"build":{"processor":{"name":"...","price":0},"gpu":{"name":"...","price":0},"motherboard":{"name":"...","price":0},"ram":{"name":"...","price":0},"storage":{"name":"...","price":0},"psu":{"name":"...","price":0},"cooling":{"name":"...","price":0}},"total":0,"reasoning":"one short sentence why this build is good","performance":"short description of expected performance"}`;

        const text = await callGemini(prompt);
        if (!text) return res.status(502).json({ error: 'AI service unavailable' });

        res.json(parseAIJson(text));
    } catch (err) {
        console.error('Recommend error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* ============================================================
   Start server
============================================================ */
app.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(45));
    console.log('  🖥️  PC Builder Server');
    console.log(`  🌐  http://localhost:${PORT}`);
    console.log('  🤖  AI: Google Gemini (Free Tier)');
    console.log('='.repeat(45));
    console.log('');
});
