# LifeForge

> **Forging the lifeline between donors and patients.**

AI-powered blood donation and blood disorder support platform connecting patients, donors, hospitals, and administrators. Built for ImpactForge 2026.

---

## What it does

- **Patients** — track transfusion schedules, request blood, find nearby blood banks (live from eRaktKosh, 4,443 hospitals)
- **Donors** — record donations, track impact, see when you're eligible to donate again, compete on the Hall of Heroes leaderboard
- **Hospitals** — manage blood requests, trace donations to patients
- **Admins** — AI shortage prediction (reasoning over live stock + epidemiology-driven demand engine with research-backed patient counts for 4 blood disorders across Indian states)
- **AI chatbot** — Gemini-powered, disease-aware (thalassemia / sickle cell / hemophilia / aplastic anemia), RAG knowledge base with NIH citations, 5 live-data tools including national blood bank search

---

## Quick start (Docker — recommended)

**Requirements:** Docker + Docker Compose installed.

```bash
git clone https://github.com/swaroop2005/LifeForge.git
cd LifeForge
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=any_random_secret_string_here
```

> `DATABASE_URL` is not needed — Docker spins up a fresh PostgreSQL automatically.
> Get a free Gemini API key at https://aistudio.google.com/apikey.

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

---

## Manual setup (without Docker)

**Requirements:** Python 3.12+, Node 18+, PostgreSQL running locally.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=any_random_secret_string_here
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost/vitatrace
```

Create the database (PostgreSQL must be running):

```bash
psql -U postgres -c "CREATE DATABASE vitatrace;"
```

Start the backend (auto-creates tables + seeds demo data on first run):

```bash
python -m uvicorn app.main:app --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

---

## Demo accounts (auto-seeded on first run)

| Portal | Email | Password |
|--------|-------|----------|
| Patient — Thalassemia (Arjun) | arjun@vitatrace.com | Patient@123 |
| Patient — Sickle Cell (Priya) | priya@vitatrace.com | Patient@123 |
| Donor — Hero badge (Ravi) | ravi@vitatrace.com | Donor@123 |
| Hospital — AIIMS | aiims@vitatrace.com | Hospital@123 |
| Admin | admin@vitatrace.com | Admin@123 |

Admin login is at `/admin-login` (separate portal).

---

## Public pages (no login required)

| URL | What it shows |
|-----|---------------|
| `/leaderboard` | Hall of Heroes — ranked donor leaderboard |
| `/community` | Community posts from patients and donors |

---

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite, Tailwind v4 |
| Backend | FastAPI, Python 3.12+ |
| Database | PostgreSQL (SQLAlchemy + psycopg v3) |
| AI — Chat | Gemini 2.5 Flash + 5 live-data tools (function calling) |
| AI — Reasoning | Gemini 2.5 Flash (shortage analysis) |
| AI — RAG | `gemini-embedding-001` + cosine rerank (64 chunks, NIH ODS) |
| Demand engine | Epidemiology-driven (research-backed patient counts) |
| Blood bank data | eRaktKosh national scraper (47,216 rows, 4,443 hospitals) |

---

## AI features

| Feature | Model | Where |
|---------|-------|-------|
| Chat | `gemini-2.5-flash` | Chatbot (public, no login needed) |
| Reasoning | `gemini-2.5-flash` | Admin shortage prediction |
| Embeddings | `gemini-embedding-001` | RAG knowledge base (64 chunks) |
| Rerank | cosine top-k | Top-5 chunk selection with disease-aware boost |
| Live-data tools | 5 tools (function calling) | Blood bank search, eligibility, compatibility, shortage alerts, donor impact |

---

## Blood disorder coverage

Disease-aware AI with custom system prompt rules per condition:

| Disease | Transfusion interval | AI rules |
|---------|---------------------|----------|
| Thalassemia | Every 21 days | Iron overload diet restrictions, chelation |
| Sickle Cell Disease | Every 45 days (+ crisis) | Pain crisis, hydration, triggers |
| Hemophilia A & B | Every 10 days | Bleeding precautions, factor replacement |
| Aplastic Anemia | Every 7–10 days | Infection prevention, both PRBCs + platelets |

---

## Project structure

```
LifeForge/
├── backend/
│   ├── app/
│   │   ├── routers/          # auth, patient, donor, hospital, admin, blood_banks, chatbot, predictions
│   │   ├── services/         # ai.py, ai_prediction.py, disease_demand.py, gamification.py
│   │   ├── models.py         # SQLAlchemy models
│   │   └── main.py
│   ├── data/
│   │   ├── eraktkosh_stock.csv       # 47,216 rows — live blood bank stock
│   │   ├── embeddings_cache.npz      # 64-chunk RAG embeddings
│   │   └── knowledge_base.json       # NIH ODS + LifeForge disease chunks
├── frontend/
│   └── src/
│       ├── pages/            # Patient, Donor, Hospital, Admin, Auth, Community, Landing
│       └── components/       # Layout, Navbar, ChatbotWidget, BloodTypeTag, StatusBadge
├── scrape_eraktkosh.py       # eRaktKosh scraper (run once or --schedule for 6h refresh)
└── docker-compose.yml
```

---

## Refreshing blood bank data

The eRaktKosh CSV is already included (scraped June 2026). To refresh:

```bash
python scrape_eraktkosh.py          # one-time scrape
python scrape_eraktkosh.py --schedule  # every 6 hours via APScheduler
```

---

Built with dedication by the LifeForge team. **Forging the lifeline between donors and patients.**
