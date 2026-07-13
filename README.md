# VitaTrace

> **Every Drop Traced. Every Life Counted.**

AI-powered blood donation and blood disorder support platform connecting patients, donors, hospitals, and administrators. Built for STEMINATE HACKS 2026 — GreenPT bounty track.

---

## What it does

- **Patients** — track transfusion schedules, request blood, find nearby blood banks (live from eRaktKosh, 4,443 hospitals)
- **Donors** — record donations, track impact, see when you're eligible to donate again, compete on the Hall of Heroes leaderboard
- **Hospitals** — manage blood requests, trace donations to patients
- **Admins** — shortage prediction powered by GreenR reasoning model + epidemiology-driven demand engine (research-backed patient counts for 4 blood disorders across Indian states)
- **AI chatbot** — GreenPT-powered, disease-aware (thalassemia / sickle cell / hemophilia / aplastic anemia), RAG knowledge base with NIH citations, 5 MCP tools including live blood bank search

---

## Quick start (Docker — recommended)

**Requirements:** Docker + Docker Compose installed.

```bash
git clone https://github.com/swaroop2005/VitaTrace.git
cd VitaTrace
```

Create `backend/.env`:

```env
GREENPT_API_KEY=your_greenpt_api_key_here
JWT_SECRET=any_random_secret_string_here
```

> `DATABASE_URL` is not needed — Docker spins up a fresh PostgreSQL automatically.
> Get your GreenPT API key from the STEMINATE HACKS 2026 portal.

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
GREENPT_API_KEY=your_greenpt_api_key_here
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
| AI — Chat | GreenPT `green-l-raw` + 5 MCP tools |
| AI — Reasoning | GreenPT `green-r-raw` (shortage prediction) |
| AI — RAG | `green-embedding` + `green-rerank` (64 chunks, NIH ODS) |
| ML | scikit-learn (shortage risk + demand prediction) |
| Blood bank data | eRaktKosh national scraper (47,216 rows, 4,443 hospitals) |

---

## GreenPT features used (6 total)

| Feature | Model | Where |
|---------|-------|-------|
| Chat | `green-l-raw` | Chatbot (public, no login needed) |
| Reasoning | `green-r-raw` | Admin shortage prediction |
| Embeddings | `green-embedding` | RAG knowledge base |
| Reranker | `green-rerank` | Top-5 chunk selection |
| MCP tools | 5 tools | Live blood bank search, eligibility, compatibility, impact |
| Router | manual | green-l vs green-r selection |

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
VitaTrace/
├── backend/
│   ├── app/
│   │   ├── routers/          # auth, patient, donor, hospital, admin, blood_banks, chatbot, predictions
│   │   ├── services/         # greenpt.py, greenpt_prediction.py, disease_demand.py, gamification.py
│   │   ├── models.py         # SQLAlchemy models
│   │   └── main.py
│   ├── data/
│   │   ├── eraktkosh_stock.csv       # 47,216 rows — live blood bank stock
│   │   ├── embeddings_cache.npz      # 64-chunk RAG embeddings
│   │   └── knowledge_base.json       # NIH ODS + VitaTrace disease chunks
│   └── ml/
│       └── model.pkl         # shortage risk + demand prediction model
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

Built with dedication by the VitaTrace team. **Every drop traced. Every life counted.**
