# Lumina Studio — AI SMS Schedule Agent

A production-ready Next.js (App Router) photo studio scheduling agent powered by `@llm-multi-provider/core`, supporting seamless switching and automatic failover between **Google Gemini** and **OpenRouter**.

---

## Key Capabilities

- **Conversational SMS Appointment Coordinator ("Maya")**:
  - Answers pricing, package, duration, deposit, and studio FAQ inquiries.
  - Checks real-time studio slot availability across operating hours (`Tue–Fri 9:00 AM–6:00 PM`, `Sat 10:00 AM–5:00 PM`) with automatic `15-minute` lighting reset buffers.
  - Books new appointments and issues unique reference codes (`LUM-xxxx`).
  - Looks up, reschedules, and cancels existing bookings.
- **Seamless Multi-LLM Provider Routing**:
  - `gemini-with-fallback`: **Google Gemini Primary ⇄ OpenRouter Automatic Failover**
  - `openrouter-with-fallback`: **OpenRouter Primary ⇄ Google Gemini Automatic Failover**
  - `gemini-only`: **Google Gemini Strict**
  - `openrouter-only`: **OpenRouter Strict**
  - Includes a built-in deterministic fallback coordinator so demos work even before API keys are configured.
- **Live Studio Dashboard & Slot Explorer**:
  - Split-screen Client SMS Simulator (with expandable tool call inspector & telemetry) and Studio Schedule Dashboard.
- **Twilio / SMS Webhook Endpoint**:
  - `POST /api/webhook/sms` accepts `application/x-www-form-urlencoded` (`From`, `Body`) and returns TwiML XML, or `application/json`.

---

## Quickstart

### 1. Configure API Keys

Create a `.env.local` file in the root directory (or copy `.env.example`):

```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
DEFAULT_LLM_PROVIDER=gemini
```

*(You can also paste or override keys live during a demo via the **API Keys** button in the top navigation bar.)*

### 2. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Deploy to Vercel (Free Tier)

1. Push this repository to GitHub/GitLab/Bitbucket (keep `llm-multi-provider/` in the root).
2. Import the project into **Vercel**.
3. Add `GEMINI_API_KEY` and `OPENROUTER_API_KEY` under **Project Settings → Environment Variables**.
4. Click **Deploy**.
