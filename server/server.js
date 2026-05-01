require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')

const app = express()

const PORT = process.env.PORT || 3000
const GROQ_KEY = process.env.GROQ_API_KEY   // ← خطأ 1: كان QROQ وكان groq_API_KEY

if (!GROQ_KEY) {
    console.error("❌ GROQ_API_KEY missing")
    process.exit(1)
}

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
app.use(express.json({ limit: "10kb" }))

const aiLimiter = rateLimit({
    windowMs: 60000,
    max: 12,
    message: { error: "Too many requests. Wait a minute." }
})

app.use('/CSSPage', express.static(path.join(__dirname, '..', 'CSSPage')))
app.use('/HTMLPage', express.static(path.join(__dirname, '..', 'HTMLPage')))
app.use('/Image', express.static(path.join(__dirname, '..', 'Image')))
app.use('/Js', express.static(path.join(__dirname, '..', 'Js')))
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')))

app.get('/', (_req, res) => {
    res.redirect('/HTMLPage/index.html')
})

async function callGroq(prompt) {   // ← خطأ 2: كان callGROQ لكن safeGemini كان يستدعي callGemini
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_KEY}`
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 1200
        })
    })

    if (!response.ok) {
        console.log("❌ Groq HTTP", response.status)
        return null
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ""
    console.log("RAW GROQ:", text)
    return text || null
}

function parseAIJson(text) {
    if (!text) return { error: "Empty AI response" }
    try {
        let clean = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim()
        const start = clean.indexOf("{")
        const end = clean.lastIndexOf("}")
        if (start !== -1) clean = clean.substring(start, end + 1)
        clean = clean
            .replace(/[""]/g, '"')
            .replace(/['']/g, "'")
            .replace(/[\n\r\t]/g, " ")
            .replace(/\s+/g, " ")
        return JSON.parse(clean)
    } catch (err) {
        console.log("⚠ JSON parse failed")
        return { error: "AI JSON format error", raw: text }
    }
}

async function safeGroq(prompt, retries = 3) {   // ← خطأ 3: كان safeGemini يستدعي callGemini
    for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) {
            const delay = 2000 * Math.pow(1.5, attempt)
            console.log(`⏳ waiting ${delay}ms`)
            await new Promise(r => setTimeout(r, delay))
        }
        const text = await callGroq(prompt)
        const parsed = parseAIJson(text)
        if (!parsed.error) return parsed
    }
    return { error: "AI failed after retries" }
}

app.post('/api/compatibility', aiLimiter, async (req, res) => {
    try {
        const { components } = req.body
        if (!components) return res.status(400).json({ error: "Missing components" })
        const entries = Object.entries(components).filter(([k, v]) => v && v !== "None Selected")
        if (entries.length < 2) return res.status(400).json({ error: "Need at least 2 components" })
        const list = entries.map(([k, v]) => `- ${k}: ${v}`).join("\n")
        const prompt = `Check compatibility of these PC parts:\n\n${list}\n\nReply ONLY JSON:\n\n{"overall":"compatible|issues|warnings","score":0-100,"checks":[{"pair":"A + B","status":"ok|warning|error","detail":"reason"}],"recommendation":"short advice"}`
        const data = await safeGroq(prompt)
        res.json(data)
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server error" })
    }
})

app.post('/api/chat', aiLimiter, async (req, res) => {
    try {
        const { message } = req.body
        if (!message) return res.status(400).json({ error: "Missing message" })
        const prompt = `You are a helpful PC building expert.\n\nUser: ${message}\n\nReply JSON:\n\n{"reply":"short helpful answer"}`
        const data = await safeGroq(prompt)
        res.json(data)
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server error" })
    }
})

app.post('/api/recommend', aiLimiter, async (req, res) => {
    try {
        const { budget, usage } = req.body
        if (!budget || !usage) return res.status(400).json({ error: "Missing budget or usage" })
        const prompt = `Recommend a complete PC build under $${budget} for ${usage}.\n\nReturn ONLY JSON:\n\n{"build":{"cpu":{"name":"string","price":number},"gpu":{"name":"string","price":number},"ram":{"name":"string","price":number},"storage":{"name":"string","price":number},"motherboard":{"name":"string","price":number},"psu":{"name":"string","price":number},"cooling":{"name":"string","price":number}},"reason":"short reasoning","performance":"performance estimate"}`
        let data = await safeGroq(prompt)
        if (!data.build) data.build = {}
        const keys = ["cpu","gpu","ram","storage","motherboard","psu","cooling"]
        keys.forEach(k => { if (!data.build[k]) data.build[k] = { name: "Unknown", price: 0 } })
        data.total = keys.reduce((s, k) => s + (data.build[k].price || 0), 0)
        res.json(data)
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server error" })
    }
})

app.listen(PORT, () => {
    console.log("")
    console.log("================================")
    console.log("🖥 PC Builder AI Server Running")
    console.log(`🌐 http://localhost:${PORT}`)
    console.log("================================")
})