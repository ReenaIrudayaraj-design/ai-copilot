# CopilotAI — AI-Powered Frontend Code Analyzer

## Project Structure
```
ai-copilot/
├── backend/
│   ├── server.js          # Express server with streaming endpoint
│   ├── analyzeService.js  # Groq LLM + prompt engineering + retry logic
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx            # Main UI with streaming output
    │   ├── main.jsx           # Entry point
    │   └── hooks/
    │       └── useAnalyze.js  # Streaming + abort hook
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Setup

### Backend
```bash
cd backend
npm install
echo "GROQ_API_KEY=your_key_here" > .env
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Features
- 4 analysis modes: Full Review, Bug Detection, Optimize, Explain
- Real-time streaming response
- Retry logic with exponential backoff (rate limit handling)
- Token optimization (3000 char limit with prompt engineering)
- Copy to clipboard
- Abort/stop streaming
- Markdown output with syntax highlighted code blocks