# 💌 The Date Crew (TDC) — Matchmaker Dashboard API

A production-ready Node.js + TypeScript + Express backend for a premium Indian matrimonial matchmaking platform.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm v9+

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env

# Edit .env and add your AI key (OpenAI or Google Gemini)

# 3. Start development server (hot-reload)
npm run dev
```

The server starts at `http://localhost:3000`.

### Health Check
```
GET http://localhost:3000/health
```

---

## 🔑 Authentication

All protected routes require a Bearer JWT token.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "priya@thedatecrew.in",
  "password": "password"
}
```

**Demo Credentials:**
| Email | Password | Name |
|---|---|---|
| `priya@thedatecrew.in` | `password` | Priya Sharma |
| `rahul@thedatecrew.in` | `password` | Rahul Mehra |

**Response:**
```json
{
  "success": true,
  "message": "Welcome back, Priya Sharma!",
  "data": {
    "token": "<JWT>",
    "matcher": { "id": "matcher-001", "email": "...", "name": "Priya Sharma" },
    "expiresIn": "7d"
  }
}
```

Use the token as: `Authorization: Bearer <JWT>`

---

## 📋 API Reference

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login + get JWT |
| GET | `/api/auth/me` | ✅ | Get current matchmaker info |

### Client Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/clients` | ✅ | List all assigned clients |
| GET | `/api/clients/:id` | ✅ | Full client profile |
| GET | `/api/clients/:id/matches` | ✅ | AI-enriched match results |
| GET | `/api/clients/:id/notes` | ✅ | All notes for client |
| POST | `/api/clients/:id/notes` | ✅ | Add internal note |

**`GET /api/clients/:id/matches`** — The core endpoint:
1. Runs gender-specific heuristic matching algorithm
2. Pipes top 5 results through LLM (OpenAI / Gemini)
3. Returns sorted matches with AI score, rationale, and personalized intro email

Query params: `?topN=5` (default 5, max recommended 10)

**`POST /api/clients/:id/notes`** body:
```json
{
  "text": "Client expressed strong preference for Mumbai-based matches.",
  "type": "feedback"
}
```
Note types: `general` | `feedback` | `meeting` | `follow-up`

### Match Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/matches/send` | ✅ | Log + simulate sending a match |
| GET | `/api/matches/sent/:clientId` | ✅ | View sent match history |

**`POST /api/matches/send`** body:
```json
{
  "clientId": "client-001",
  "candidateId": "prof-f-011"
}
```

---

## 🧠 Matching Algorithm Logic

### Male Client → Seeks Female Candidates
| Rule | Type | Logic |
|------|------|-------|
| Age | Hard filter | Candidate must be **younger** than client |
| Height | Hard filter | Candidate must be **shorter** than client |
| Income | Hard filter | Candidate income ≤ client income |
| Kids | Hard filter | **Strict match** on wantKids preference |
| Religion | Bonus (+10) | Same religion |
| Relocation | Bonus (+5) | Both agree on relocation |
| Diet | Bonus (+5) | Same dietary preference |

### Female Client → Seeks Male Candidates
| Rule | Type | Logic |
|------|------|-------|
| Industry | Hard filter | Industry compatibility matrix (e.g. Tech ↔ Finance) |
| Relocation | Hard filter | **Strict match** — both must agree |
| Pets | Hard filter | **Strict match** on openToPets |
| Education tier | Hard filter | Max 2-tier gap (diploma ↔ tier1 = disqualify) |
| Kids | Hard filter | **Strict match** |
| Age | Hard filter | Male must be ≥ female's age |
| Religion | Bonus (+10) | Same religion |
| Diet | Bonus (+5) | Same diet |

---

## 🤖 AI Integration

Set `AI_PROVIDER=openai` or `AI_PROVIDER=google` in `.env`.

### OpenAI
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

### Google Gemini
```env
AI_PROVIDER=google
GOOGLE_GENAI_API_KEY=...
GOOGLE_MODEL=gemini-1.5-flash
```

**AI returns per match:**
- `score`: 0–100 compatibility score
- `label`: "Exceptional Match" / "High Potential" / "Good Fit" / etc.
- `rationale`: 2-sentence explanation referencing actual profile data
- `keyHighlights`: 3 bullet-point highlights
- `introEmail`: Personalized email with subject, body, and sign-off

If AI is unavailable (no key set), the service gracefully falls back to a template-based response.

---

## 🏗️ Project Structure

```
src/
├── config/          # Env config + AI client init (lazy-loaded)
├── controllers/     # Request handlers (auth, client, match)
├── data/            # In-memory mock DB (100+ profiles, 8 clients, 2 matchmakers)
├── interfaces/      # All TypeScript types (IClient, IMatchProfile, IAIMatchScore, etc.)
├── middleware/       # errorHandler, logger, authGuard
├── routes/          # Route definitions
└── services/
    ├── matchService.ts  # Gender-specific heuristic algorithm
    └── aiService.ts     # LLM scoring + intro email generation
```

---

## 🚢 Deployment

### Render
1. Connect GitHub repo
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add all `.env` variables in Render dashboard

### Railway
1. Connect GitHub repo
2. Railway auto-detects Node.js
3. Set environment variables in Railway Variables tab
4. Deploys automatically on push

### Environment Variables Required in Production
```
PORT=3000
NODE_ENV=production
JWT_SECRET=<strong-random-secret-min-64-chars>
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

---

## 🧪 Example cURL Flows

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priya@thedatecrew.in","password":"password"}' \
  | jq -r '.data.token')

# 2. List clients
curl http://localhost:3000/api/clients \
  -H "Authorization: Bearer $TOKEN"

# 3. Get AI-enriched matches for client-001
curl "http://localhost:3000/api/clients/client-001/matches?topN=5" \
  -H "Authorization: Bearer $TOKEN"

# 4. Add a note
curl -X POST http://localhost:3000/api/clients/client-001/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Client prefers matches from Mumbai or Bangalore.","type":"feedback"}'

# 5. Send a match
curl -X POST http://localhost:3000/api/matches/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clientId":"client-001","candidateId":"prof-f-011"}'
```

---

## 📜 License
MIT — The Date Crew © 2025
