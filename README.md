# 🤖 Financial Markets Agent — Tool Calling / Function Calling

An AI-powered agent that provides real-time cryptocurrency market data using **Google Gemini Function Calling**. The agent autonomously decides which tools to invoke based on natural language user queries.

## 🏗️ Architecture

```
User Question
     │
     ▼
┌─────────────┐
│  Express    │  ← REST API + Web UI
│  Server     │
└──────┬──────┘
       │
       ▼
┌─────────────┐         ┌──────────────────┐
│  Gemini AI  │ ──────► │  Tool Schemas    │
│  (GPT)      │         │  (4 Functions)   │
└──────┬──────┘         └──────────────────┘
       │ Function Call
       ▼
┌─────────────┐    ┌─────────────┐
│ OKX Service │    │Bybit Service│
│  (REST API) │    │  (REST API) │
└─────────────┘    └─────────────┘
```

## 🔧 Tools (Functions)

| Tool | Description |
|------|-------------|
| `get_crypto_price` | Fetches current price of a cryptocurrency from OKX |
| `compare_exchanges` | Compares prices between OKX and Bybit exchanges |
| `get_top_cryptos` | Returns top cryptocurrencies by trading volume |
| `get_price_change` | Gets 24h price change percentage with high/low |

## 🔄 Agent Loop

```
1. User asks a question (e.g., "What's the price of Bitcoin?")
2. Gemini analyzes the question and decides which tool(s) to call
3. Agent executes the tool(s) against live exchange APIs
4. Results are fed back to Gemini
5. Gemini generates a natural language response
6. Loop repeats if more tools are needed
```

## 📁 Project Structure

```
crypto-agent/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── config.ts             # App configuration (API keys, rate limits)
│   ├── agent/
│   │   ├── agent.ts          # Core Agent Loop — heart of the system
│   │   ├── tool-schemas.ts   # Function declarations for Gemini
│   │   └── tools-registry.ts # Tool execution registry (4 tools)
│   ├── services/
│   │   ├── okx.service.ts    # OKX exchange API integration
│   │   └── bybit.service.ts  # Bybit exchange API integration
│   ├── middleware/
│   │   └── safety.ts         # Rate limiting & error handling
│   └── routes/
│       └── chat.routes.ts    # Chat API endpoints
├── public/
│   ├── index.html            # Web chat interface
│   └── styles.css            # UI styles
├── package.json
└── tsconfig.json
```

## 🛡️ Security Features

- **Rate Limiting**: 20 requests/minute per IP
- **Symbol Whitelisting**: Only 29 approved cryptocurrency symbols
- **Max Tool Calls**: Limited to 5 tool calls per request (prevents infinite loops)
- **Input Validation**: All user inputs are sanitized before processing

## ⚡ Tech Stack

- **AI Model**: Google Gemini 2.5 Flash (Function Calling)
- **Backend**: Node.js + Express + TypeScript
- **Data Sources**: OKX REST API, Bybit REST API
- **Security**: express-rate-limit, symbol whitelisting

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/beko2499/crypto-agent.git
cd crypto-agent

# 2. Install dependencies
npm install

# 3. Create .env file
echo "GOOGLE_API_KEY=your_gemini_api_key" > .env
echo "PORT=3001" >> .env

# 4. Run the agent
npm run dev
```

Then open **http://localhost:3001** in your browser.

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send a question to the agent |
| `GET` | `/api/health` | Health check |

### Example Request

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the price of Bitcoin?"}'
```

## 📄 License

MIT
