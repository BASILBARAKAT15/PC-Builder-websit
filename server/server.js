require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')

const app = express()

const PORT = process.env.PORT || 3000
const GEMINI_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_KEY) {
    console.error("❌ GEMINI_API_KEY missing")
    process.exit(1)
}

/* ======================
   Middleware
====================== */

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
app.use(express.json({ limit: "10kb" }))

const aiLimiter = rateLimit({
    windowMs: 60000,
    max: 12,
    message: { error: "Too many requests. Wait a minute." }
})

/* ======================
   Static files
====================== */

app.use('/CSSPage', express.static(path.join(__dirname, '..', 'CSSPage')))
app.use('/HTMLPage', express.static(path.join(__dirname, '..', 'HTMLPage')))
app.use('/Image', express.static(path.join(__dirname, '..', 'Image')))
app.use('/Js', express.static(path.join(__dirname, '..', 'Js')))
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')))

app.get('/', (_req, res) => {
    res.redirect('/HTMLPage/index.html')
})

/* ======================
   Gemini Call
====================== */

async function callGemini(prompt) {

    const models = [
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash"
    ]

    for (const model of models) {

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`

        console.log(`🤖 Trying ${model}`)

        try {

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 1200
                    }
                })
            })

            if (!response.ok) {
                console.log(`❌ ${model} HTTP ${response.status}`)
                continue
            }

            const data = await response.json()

            const text =
                data.candidates?.[0]?.content?.parts?.[0]?.text || ""

            console.log("RAW GEMINI:", text)

            if (text) {
                console.log(`✅ Success with ${model}`)
                return text
            }

        } catch (err) {
            console.log(`❌ ${model} error`, err.message)
        }
    }

    return null
}

/* ======================
   JSON Parser
====================== */

function parseAIJson(text) {

    if (!text) return { error: "Empty AI response" }

    try {

        let clean = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim()

        const start = clean.indexOf("{")
        const end = clean.lastIndexOf("}")

        if (start !== -1) {
            clean = clean.substring(start, end + 1)
        }

        clean = clean
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'")
            .replace(/[\n\r\t]/g, " ")
            .replace(/\s+/g, " ")

        return JSON.parse(clean)

    } catch (err) {

        console.log("⚠ JSON parse failed")

        return {
            error: "AI JSON format error",
            raw: text
        }
    }
}

/* ======================
   Gemini Safe Wrapper
====================== */

async function safeGemini(prompt, retries = 3) {

    for (let attempt = 0; attempt <= retries; attempt++) {

        if (attempt > 0) {

            const delay = 2000 * Math.pow(1.5, attempt)

            console.log(`⏳ waiting ${delay}ms`)

            await new Promise(r => setTimeout(r, delay))
        }

        const text = await callGemini(prompt)

        const parsed = parseAIJson(text)

        if (!parsed.error) return parsed
    }

    return { error: "AI failed after retries" }
}

/* ======================
   Compatibility API
====================== */

app.post('/api/compatibility', aiLimiter, async (req, res) => {

    try {

        const { components } = req.body

        if (!components)
            return res.status(400).json({ error: "Missing components" })

        const entries =
            Object.entries(components)
                .filter(([k, v]) => v && v !== "None Selected")

        if (entries.length < 2)
            return res.status(400).json({ error: "Need at least 2 components" })

        const list =
            entries.map(([k, v]) => `- ${k}: ${v}`).join("\n")

        const prompt = `Check compatibility of these PC parts:

${list}

Reply ONLY JSON:

{
"overall":"compatible|issues|warnings",
"score":0-100,
"checks":[
{"pair":"A + B","status":"ok|warning|error","detail":"reason"}
],
"recommendation":"short advice"
}`

        const data = await safeGemini(prompt)

        res.json(data)

    } catch (err) {

        console.log(err)

        res.status(500).json({ error: "Server error" })
    }
})

/* ======================
   Chat API
====================== */

app.post('/api/chat', aiLimiter, async (req, res) => {

    try {

        const { message } = req.body

        if (!message)
            return res.status(400).json({ error: "Missing message" })

        const prompt = `
You are a helpful PC building expert.

User: ${message}

Reply JSON:

{
"reply":"short helpful answer"
}
`

        const data = await safeGemini(prompt)

        res.json(data)

    } catch (err) {

        console.log(err)

        res.status(500).json({ error: "Server error" })
    }
})

/* ======================
   AI Build Recommender
====================== */

app.post('/api/recommend', aiLimiter, async (req, res) => {

    try {

        const { budget, usage } = req.body

        if (!budget || !usage)
            return res.status(400).json({ error: "Missing budget or usage" })

        const prompt = `
Recommend a complete PC build under $${budget} for ${usage}.

Return ONLY JSON:

{
"build":{
"cpu":{"name":"string","price":number},
"gpu":{"name":"string","price":number},
"ram":{"name":"string","price":number},
"storage":{"name":"string","price":number},
"motherboard":{"name":"string","price":number},
"psu":{"name":"string","price":number},
"cooling":{"name":"string","price":number}
},
"reason":"short reasoning",
"performance":"performance estimate"
}
`

        let data = await safeGemini(prompt)

        if (!data.build) data.build = {}

        const keys = [
            "cpu",
            "gpu",
            "ram",
            "storage",
            "motherboard",
            "psu",
            "cooling"
        ]

        keys.forEach(k => {

            if (!data.build[k]) {
                data.build[k] = { name: "Unknown", price: 0 }
            }
        })

        data.total =
            data.build.cpu.price +
            data.build.gpu.price +
            data.build.ram.price +
            data.build.storage.price +
            data.build.motherboard.price +
            data.build.psu.price +
            data.build.cooling.price

        res.json(data)

    } catch (err) {

        console.log(err)

        res.status(500).json({ error: "Server error" })
    }
})

/* ======================
   Start Server
====================== */

app.listen(PORT, () => {

    console.log("")
    console.log("================================")
    console.log("🖥 PC Builder AI Server Running")
    console.log(`🌐 http://localhost:${PORT}`)
    console.log("================================")
})