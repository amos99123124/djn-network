# Deploying NPI Physician Lookup

## Option 1: Vercel (Recommended)

### First Time Setup
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. From your project directory:
cd djn-networker
vercel

# 3. Follow the prompts (link to your account, accept defaults)
# 4. Add your Exa API key:
vercel env add EXA_API_KEY
# Paste your key when prompted, select all environments

# 5. Redeploy to pick up the env var:
vercel --prod
```

### Iteration Loop (Push-to-Deploy)
```bash
# Option A: Git-based (auto-deploys on push)
git init && git add . && git commit -m "init"
# Connect to GitHub repo via Vercel dashboard → auto-deploys on every push

# Option B: CLI deploy
vercel          # preview deploy
vercel --prod   # production deploy
```

### Local Development
```bash
npm run dev     # runs on http://localhost:3000
```

---

## Option 2: Replit

### Setup
1. Go to [replit.com](https://replit.com) → **Create Repl** → **Import from GitHub**
2. Push this code to a GitHub repo first, then import it
3. Or: **Create Repl** → **Node.js** → copy/paste the files

### Environment Variables
1. In Replit, go to **Secrets** (lock icon in sidebar)
2. Add: `EXA_API_KEY` = your Exa.ai API key

### Run Configuration
Replit should auto-detect Next.js. If not, set:
- **Run command**: `npm run dev`
- **Port**: 3000

---

## Getting Your Exa API Key
1. Go to [dashboard.exa.ai](https://dashboard.exa.ai)
2. Navigate to **API Keys**
3. Copy your key
4. Each lookup costs ~$0.006 (half a cent)
