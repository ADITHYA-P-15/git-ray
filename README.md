# ⚡ Git-Ray — GitHub Portfolio Analyzer

> **Instant AI-powered FAANG-level recruiter audit for any GitHub profile.**

Git-Ray deep-scans a GitHub username and delivers a brutally honest portfolio review — analyzing code quality, commit patterns, tech diversity, README quality, and engineering best practices. Powered by **Groq** (llama-3.3-70b-versatile) for near-instant AI inference.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Groq](https://img.shields.io/badge/Groq-LLM-orange)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Client (page.tsx)                  │
│     Hero → Input Username → Click Analyze            │
└────────────────────┬─────────────────────────────────┘
                     │ POST /api/analyze { username }
                     ▼
┌──────────────────────────────────────────────────────┐
│               API Route (route.ts)                   │
│     Validates input → Orchestrates pipeline          │
└──────┬──────────────────────────────────┬────────────┘
       │                                  │
       ▼                                  ▼
┌──────────────────┐           ┌─────────────────────┐
│  Data Layer      │           │  Intelligence Layer  │
│  (github.ts)     │           │  (groq.ts)           │
│                  │           │                      │
│  Octokit →       │           │  Groq SDK →          │
│  GitHub REST API │──────────▶│  llama-3.3-70b       │
│                  │  GitHub   │  (JSON mode)         │
│  Fetches:        │  data     │                      │
│  • User profile  │           │  Returns:            │
│  • Top 6 repos   │           │  • Score (0-100)     │
│  • Commit stats  │           │  • 4 sub-scores      │
│  • Language dist. │           │  • Red/green flags   │
│  • Code quality  │           │  • Verdicts          │
│  • File trees    │           │  • Improvement plan  │
│  • README content│           │                      │
└──────────────────┘           └─────────────────────┘
       │                                  │
       ▼                                  ▼
┌──────────────────────────────────────────────────────┐
│                  JSON Response → Dashboard UI        │
│                                                      │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐ │
│  │ Score    │  │ Red/Green │  │ Code Quality      │ │
│  │ Gauge    │  │ Flags     │  │ Matrix            │ │
│  ├──────────┤  ├───────────┤  ├───────────────────┤ │
│  │ Sub-     │  │ Tech &    │  │ Commit Activity   │ │
│  │ Scores   │  │ Commit    │  │ Grid (30d)        │ │
│  ├──────────┤  │ Verdicts  │  ├───────────────────┤ │
│  │ Language │  ├───────────┤  │ Repo Health       │ │
│  │ Chart    │  │ Quick     │  │ Cards             │ │
│  └──────────┘  │ Fixes     │  └───────────────────┘ │
│                └───────────┘                         │
└──────────────────────────────────────────────────────┘
```

---

## 📊 What It Analyzes

| Metric | Data Source | What It Checks |
|--------|-----------|----------------|
| **Employability Score** | Aggregate | Overall 0-100 score combining all signals |
| **README Quality** (0-10) | Top repo README | Structure, badges, install instructions, screenshots |
| **Code Quality** (0-10) | File trees | CI/CD, tests, linting, .gitignore, Docker, project structure |
| **Consistency** (0-10) | Commit history | Commit frequency, recency, account age vs activity |
| **Tech Diversity** (0-10) | All repos | Language variety, tech stack breadth, project types |
| **Red/Green Flags** | All data | Specific data-backed concerns and positive signals |
| **Tech Stack Verdict** | Languages + repos | AI assessment of technology choices |
| **Commit Verdict** | Commit activity | AI assessment of commit consistency |
| **Code Quality Matrix** | File trees | Per-repo CI/CD, tests, lint, Docker, docs table |
| **Language Distribution** | 15 repos | Visual breakdown of all languages used |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + custom dark neon theme
- **AI Engine:** Groq Cloud SDK → `llama-3.3-70b-versatile` (JSON mode)
- **GitHub Data:** Octokit (GitHub REST API)
- **Icons:** Lucide React

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/analyze/
│   │   └── route.ts        # POST endpoint — orchestrates fetch + AI
│   ├── globals.css          # Dark neon theme, glow effects, animations
│   ├── layout.tsx           # Root layout, fonts, metadata
│   └── page.tsx             # Full client UI — hero, dashboard, all panels
└── lib/
    ├── github.ts            # Data layer — Octokit, fetches 7 data categories
    └── groq.ts              # Intelligence layer — Groq SDK, JSON mode
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Groq API Key](https://console.groq.com/keys) (free)
- [GitHub Personal Access Token](https://github.com/settings/tokens) (classic, `public_repo` scope)

### Setup

```bash
# Clone
git clone https://github.com/ADITHYA-P-15/git-ray.git
cd git-ray

# Install dependencies
npm install

# Add your API keys
cp .env.local.example .env.local
# Edit .env.local with your keys:
#   GROQ_API_KEY=gsk_...
#   GITHUB_TOKEN=ghp_...

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter any GitHub username.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | Groq Cloud API key for LLM inference |
| `GITHUB_TOKEN` | ✅ | GitHub PAT for high-rate API access (5000 req/hr) |

---

## 📜 License

MIT
