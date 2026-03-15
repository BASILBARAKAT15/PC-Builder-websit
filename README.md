# 🚀 PC Builder — AI Compatibility Checker

A web application that helps users build a PC and check compatibility between components using **AI**.

The system allows users to select computer parts and then uses **Gemini AI** to analyze whether the parts are compatible and provide helpful recommendations.

---

# 🧠 Features

- 🖥️ PC Parts Builder
- 🤖 AI Compatibility Analysis
- ⚡ Fast API responses
- 🔒 Secure API key stored on the server
- 📊 Detailed compatibility report

---

# 📦 Project Structure

```
webProject/
│
├── server/                # Backend (Node.js + Express)
│   ├── server.js          # Handles API requests
│   ├── .env               # Gemini API Key (private)
│   └── package.json
│
├── HTMLPage/              # Website pages
│
├── CSSPage/               # Stylesheets
│
├── Js/                    # JavaScript files
│   └── compatibility.js   # Sends request to backend
│
├── Image/                 # Images used in the project
│
└── admin/                 # Admin dashboard
```

---

# ⚙️ Setup Guide

## 1️⃣ Get a Gemini API Key

1. Go to  
https://aistudio.google.com/apikey

2. Sign in with your Google account

3. Click **Create API Key**

4. Copy the key

✅ Free  
✅ No credit card required  
⚡ Up to 15 requests per minute

---

# 2️⃣ Configure the Server

Open a terminal and navigate to the server folder:

```bash
cd server
```

Copy the environment file:

```bash
cp .env.example .env
```

Open `.env` and add your API key:

```
GEMINI_API_KEY=your_api_key_here
```

---

# 3️⃣ Install Dependencies

```bash
npm install
```

---

# 4️⃣ Start the Server

```bash
npm start
```

Open your browser and go to:

```
http://localhost:3000
```

---

# 🤖 AI Compatibility Check

1. Go to the **Builder** page
2. Select at least two components (example: CPU + Motherboard)
3. Click **AI Compatibility Check**
4. The AI will analyze and generate a report

The report may include:

- CPU socket compatibility
- RAM support
- Power supply requirements
- Performance suggestions
- Possible issues

---

# 🔄 System Flow

```
User Browser
      │
      ▼
POST /api/compatibility
      │
      ▼
Node.js Server
      │
      ▼
Gemini AI API
      │
      ▼
Compatibility Analysis
      │
      ▼
JSON Response
      │
      ▼
Displayed in the browser
```

---

# 🔐 Security

The **Gemini API Key** is stored only on the server using `.env`.

This prevents the key from being exposed to the client-side browser.

Never upload your `.env` file to GitHub.

---

# 📌 Notes

If the AI request fails:

- Check your API key
- Make sure `.env` exists
- Restart the server

---

# 💡 Project Idea

This project demonstrates how AI can help users build PCs without compatibility issues by analyzing hardware components automatically.

---

# 👨‍💻 Author

**Basil Barakat**
