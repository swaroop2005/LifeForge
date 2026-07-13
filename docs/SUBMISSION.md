# LifeForge — ImpactForge 2026 Submission

> Draft for the Devpost form. Deadline: **Jul 23 2026, 11:45pm PDT**.
> Judging: Build Quality 30% · Real-World Impact 25% · Creativity 20% · UX 15% · Clarity 10%

## Project name

**LifeForge** — Forging the lifeline between donors and patients.

## Elevator pitch (tagline field)

An AI-powered platform that connects blood disorder patients, donors and hospitals across India — every unit traced from vein to vein, every question answered by an assistant grounded in real data from 4,000+ blood banks.

## The story

### Inspiration

In India, a thalassemia patient needs a blood transfusion every 21 days — for life. Sickle cell patients, hemophilia patients and aplastic anemia patients live on similar clocks. Yet finding compatible blood is still a scramble of phone calls, WhatsApp groups and luck. India runs one of the world's largest public blood bank networks (eRaktKosh), but the data sits in a portal most patients have never heard of.

We asked: what if that data, plus modern AI, could sit behind one simple platform that treats a blood transfusion not as a transaction but as a journey between two people?

### What it does

LifeForge is a full-stack platform with four role-based portals:

- **Patients** track transfusion schedules, request blood, search live national stock (47,216 real stock records from 4,000+ eRaktKosh blood banks), and — after a donation reaches them — chat directly with the donor who saved them.
- **Donors** record donations, earn points and badges (First Drop → Lifesaver → Hero), compete on a public Hall of Heroes leaderboard, and see the faces their blood actually helped.
- **Hospitals** manage requests, find nearby banks by distance, and run "blood journey" tracing that links a specific donation to a specific patient.
- **Admins** watch a live shortage heatmap across 36 states and run an AI reasoning engine that combines live stock, pending requests, and research-backed disease epidemiology to forecast shortages before they happen.

Woven through everything is an **AI health companion**: a RAG-grounded chatbot (NIH Office of Dietary Supplements + curated disease guidance, 64 knowledge chunks) with five live-data tools — donor eligibility, blood compatibility, shortage alerts, donor impact, and national blood bank search. It is disease-aware: a thalassemia patient asking about diet will never be told to eat iron-rich food, because iron overload rules are injected into the system prompt for their condition.

### How we built it

- **Frontend:** React 19 + Vite + Tailwind v4 — four portals, public leaderboard and community pages, in-app patient–donor chat.
- **Backend:** FastAPI + PostgreSQL (SQLAlchemy, psycopg v3), JWT auth with role-based access.
- **AI:** Gemini 2.5 Flash for chat and shortage reasoning via function calling; `gemini-embedding-001` for RAG retrieval with a disease-aware cosine rerank.
- **Data:** our own eRaktKosh scraper collected 47,216 live stock rows across 4,000+ hospitals in 36 states, geocoded to state/district centroids for the heatmap.
- **Demand engine:** peer-reviewed epidemiology (published patient counts per disease per state) converted into monthly blood demand, fused with live stock in the AI shortage analysis.

### Challenges we ran into

- Getting *trustworthy* medical answers from an LLM: we solved this with a layered approach — RAG over verified sources, per-disease hard rules in the system prompt, and live tools so availability answers come from real data, not hallucination.
- eRaktKosh data is messy: duplicate hospital codes, inconsistent state names, missing coordinates. Deduplication plus a state/district centroid fallback got 4,000+ banks onto one map.
- Making traceability feel human: the "blood journey" model (donation → journey → chat) required careful consent flow — donors must accept before any chat opens.

### Accomplishments we're proud of

- A real national dataset, not a toy: search any state and get genuine hospital stock.
- The donor-patient chat moment — donors see a real name say "thank you". That is the retention loop blood banks are missing.
- Disease-aware AI safety rules that survive any conversation path.

### What we learned

Grounding beats scale: a small, verified 64-chunk knowledge base with live tools outperforms a bigger ungrounded model for this domain. And gamification only works when it is attached to *visible* impact.

### What's next

- SMS/WhatsApp notifications for journey events and transfusion reminders
- Bridge-donor scheduling (recurring donor ↔ patient pairing, the Blood Warriors model)
- Direct eRaktKosh API integration when public access opens

## Impact statement

Every 21 days, over 100,000 thalassemia patients in India need a transfusion; sickle cell disease adds hundreds of thousands more. LifeForge shortens the path between a unit of blood and the person who needs it: patients search real national stock instead of cold-calling, hospitals trace units to outcomes, donors return because they can see who they helped, and administrators act on shortages *before* they hit. The platform is disease-agnostic and free — any NGO, hospital network or patient community can deploy it with a single Docker command and a free Gemini API key.

## Built with

`react` `vite` `tailwindcss` `fastapi` `python` `postgresql` `sqlalchemy` `gemini` `rag` `leaflet` `docker`

## Team

Swaroop Chandra Ponnada (solo)

## Checklist before submitting

- [ ] Confirm with organizers that an evolved pre-existing project is eligible (rules are silent; commits during the window document the new work: rebrand, Gemini AI layer, admin requests, donor chat, landing redesign)
- [ ] Create fresh GitHub repo `LifeForge`, push, verify clone + `docker-compose up` works from scratch
- [ ] Record demo video (all 6 scenes) with working Gemini key
- [ ] Screenshots: landing, chatbot answering, heatmap, donor chat, leaderboard
- [ ] Fill Devpost form with sections above
