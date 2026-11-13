# DemoTrade — Quantitative Trading & Algorithmic Analysis Platform

DemoTrade is a full-stack algorithmic trading, technical analysis, and paper-trading platform powered by **Scikit-Learn Machine Learning models** and **Google Gemini 3.1 Flash Vision**.

---

## 🌟 Key Features

- **Interactive High-Performance Charts:** Built with TradingView's Lightweight Charts supporting multi-timeframe analysis (1m to 1M), drawing tools, and real-time live price streaming.
- **AI Prediction Mode (ML Trend & Risk Levels):**
  - **Random Forest Classifier:** Analyzes historical SMA20 momentum distance, 14-period RSI velocity, and volatility factors to predict Bullish/Bearish direction with confidence scoring.
  - **Dynamic ATR Invalidation (SL/TP):** Mathematically calculated Stop-Loss ($1.5 \times \text{ATR}$) to filter market noise and Take-Profit ($3.2 \times \text{ATR}$) ensuring a constant **1 : 2.1 Risk-to-Reward ratio** (+0.24R statistical edge).
  - **Interactive Prediction Breakdown Modal:** Explains the exact mathematical rationale behind every prediction directly inside the chart.
- **Quantitative AI Mentor (Gemini 3.1 Flash Vision):**
  - Multimodal chart screenshot analysis.
  - Hidden dynamic context injection (active asset, ML prediction, ATR boundaries).
  - Answers technical analysis, market mechanics (Support & Resistance, SMC, Options, Breakouts), and stock queries.
- **Paper Trading & Order Execution:** Real-time portfolio tracking, order logging, SL/TP execution, and risk management calculators.
- **Multi-Market Support:** US Equities (NASDAQ, NYSE), Indian Equities (NSE, BSE / Nifty, Sensex), Crypto, Forex, and Commodities.

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS, Lucide Icons
- **Charting:** Lightweight Charts (TradingView)
- **State & Database Client:** Supabase client, HTML5 Canvas

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Machine Learning:** Scikit-Learn (`RandomForestClassifier`, `StandardScaler`), NumPy, Pandas
- **Market Data:** Yahoo Finance (`yfinance`)
- **AI & Vision:** Google Gemini 3.1 Flash API (`google-generativeai`)
- **Server:** Uvicorn

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/muru9031/trading---platform.git
cd trading---platform
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

---

## 📄 License
Educational & personal portfolio project.
