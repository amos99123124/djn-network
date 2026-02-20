# DJN Networker — Project Documentation

> **Purpose**: NPI Physician Lookup + LinkedIn Enrichment app.  
> **Stack**: Next.js 14 (App Router) · Vanilla CSS · Vercel  
> **Repo**: https://github.com/amos99123124/djn-network  
> **Live URL**: https://djn-networker.vercel.app (may be paused)  
> **Created**: February 2026

---

## What This App Does

1. User enters a **10-digit NPI number**
2. Backend calls the **NPPES Registry API** (free, no key) → gets doctor's name, credentials, specialty, practice address
3. Backend calls **Exa.ai Search API** (paid, ~$0.006/lookup) with `"{name} {specialty} physician"` → gets LinkedIn profile photo, headline, work history, education/residency
4. Frontend renders a **profile card** merging both data sources

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (app/page.js)                         │
│  - Single React component ('use client')        │
│  - NPI input → POST /api/lookup                 │
│  - Renders profile card from response           │
└────────────────────┬────────────────────────────┘
                     │ POST { npi: "1234567890" }
                     ▼
┌─────────────────────────────────────────────────┐
│  API Route (app/api/lookup/route.js)            │
│                                                 │
│  Step 1: fetchNPPES(npi)                        │
│    → GET npiregistry.cms.hhs.gov/api/?number=X  │
│    → Extracts: name, credential, specialty,     │
│      practice address, status                   │
│                                                 │
│  Step 2: fetchExa(firstName, lastName, specialty)│
│    → POST api.exa.ai/search                     │
│    → category: "people", numResults: 1          │
│    → Extracts: LinkedIn URL, photo, headline,   │
│      work history, education history            │
│                                                 │
│  Step 3: Return merged { npi, linkedin } JSON   │
└─────────────────────────────────────────────────┘
```

---

## File Map

```
djn-networker/
├── app/
│   ├── api/
│   │   └── lookup/
│   │       └── route.js      ← API: NPPES + Exa.ai (159 lines)
│   ├── globals.css           ← Dark theme, timeline, responsive (400+ lines)
│   ├── layout.js             ← Root layout, Inter font, SEO meta
│   └── page.js               ← Frontend: input + profile card (240 lines)
├── .env.local                ← EXA_API_KEY (gitignored)
├── .gitignore
├── DEPLOY.md                 ← Deployment instructions
├── next.config.js            ← LinkedIn image domain allowlist
├── package.json              ← Next.js 14, React 18
└── PROJECT.md                ← This file
```

---

## External APIs

### NPPES NPI Registry (Free, No Key)

- **Endpoint**: `https://npiregistry.cms.hhs.gov/api/?version=2.1&number={npi}`
- **Method**: GET
- **Rate limits**: None documented, but be respectful
- **Key fields used**:
  - `results[0].basic` → `first_name`, `last_name`, `credential`, `name_prefix`, `status`
  - `results[0].taxonomies[]` → `desc` (specialty), `primary` flag
  - `results[0].addresses[]` → `address_purpose: "LOCATION"` preferred

**Sample response shape**:
```json
{
  "result_count": 1,
  "results": [{
    "number": "1932102951",
    "basic": {
      "first_name": "JAIME",
      "last_name": "JIMENEZ AGOSTO",
      "credential": "M.D.",
      "status": "A"
    },
    "taxonomies": [{
      "desc": "Ophthalmology",
      "primary": true
    }],
    "addresses": [{
      "address_purpose": "LOCATION",
      "city": "HATTIESBURG",
      "state": "MS"
    }]
  }]
}
```

### Exa.ai Search (Paid, Key Required)

- **Endpoint**: `POST https://api.exa.ai/search`
- **Auth**: `x-api-key` header
- **Cost**: ~$0.005 (search) + ~$0.001 (highlights) = **~$0.006 per lookup**
- **Key config**:
  ```json
  {
    "query": "Alex Mohseni emergency medicine physician",
    "category": "people",
    "numResults": 1,
    "type": "auto",
    "contents": { "highlights": { "maxCharacters": 4000 } }
  }
  ```
- **Key fields used**:
  - `results[0].url` → LinkedIn URL
  - `results[0].image` → Profile photo
  - `results[0].title` → Headline
  - `results[0].entities[0].properties` → `workHistory[]`, `educationHistory[]`, `location`

---

## Environment Variables

| Variable | Required | Where to set |
|----------|----------|--------------|
| `EXA_API_KEY` | Yes (for LinkedIn enrichment) | `.env.local` locally, Vercel Environment Variables in production |

The app **gracefully degrades** without the Exa key — it still shows all NPI data, just without LinkedIn enrichment.

---

## Design Decisions & Gotchas

### Names from NPPES are ALL CAPS
NPPES returns names like `"JAIME"`. The `capitalize()` helper converts to `"Jaime"`. This is applied to first name, last name, and city.

### Specialty deduplication
A doctor can hold the same taxonomy in multiple states (e.g., "Ophthalmology" licensed in MS and TX). We deduplicate with `[...new Set(taxonomies.map(t => t.desc))]`.

### ZIP code formatting
NPPES returns ZIP as `"394023107"` (9 digits, no dash). The `formatZip()` helper converts to `"39402-3107"`.

### Exa search query strategy
The query `"{firstName} {lastName} {specialty} physician"` works well for finding the right LinkedIn profile. The `category: "people"` parameter is critical — it tells Exa to return structured person entities with work/education history.

### LinkedIn images
We allow `media.licdn.com` in `next.config.js` for the `<img>` tag (not using Next.js `<Image>` component to keep it simple — the profile photos are small).

### Error handling
- Invalid NPI format → 400 (client-side validation: exactly 10 digits)
- NPI not found in NPPES → 404
- Exa failure → silently returns `null` (non-fatal, NPI data still shows)
- Network error → generic error card

---

## Deployment

### Vercel (Current)
- **Project**: `amos99123124s-projects/djn-networker`
- **URL**: `djn-networker.vercel.app`
- Connected to GitHub repo `amos99123124/djn-network`
- Push to `main` → auto-deploys
- Environment variables set in Vercel dashboard: **Settings → Environment Variables**

### Local Development
```bash
npm install
npm run dev    # → http://localhost:3000
```

### CLI Deploy
```bash
npx vercel --prod
```

---

## Iteration Playbook (for Future LLM Sessions)

### Quick changes
1. Edit files locally
2. `npm run dev` to test
3. `git add . && git commit -m "description" && git push` → auto-deploys

### Adding new data sources
The API route (`app/api/lookup/route.js`) is structured as a pipeline:
1. `fetchNPPES()` → core physician data
2. `fetchExa()` → LinkedIn enrichment
3. Merge and return

To add a new enrichment source, add a `fetchNewSource()` function and merge its output into the response. The frontend conditionally renders sections based on what data is present (e.g., `{li?.workHistory?.length > 0 && (...)}`), so new sections follow the same pattern.

### CSS
All styles are in `app/globals.css` using CSS variables. The design system:
- `--bg: #0a0a0f` (deep black background)
- `--surface: #13131a` (card background)
- `--accent: #6366f1` (indigo/purple for buttons and accents)
- `--text: #e8e8ed` / `--text-muted: #8888a0`

### Testing NPI numbers
- `1932102951` — Dr. Jaime Jimenez Agosto, Ophthalmology, MS (verified working)
- Use https://npiregistry.cms.hhs.gov/ to find other valid NPIs

---

## Known Limitations

1. **Exa match accuracy**: The neural search usually finds the right person, but could return a wrong match for very common names. No verification logic exists.
2. **No caching**: Every lookup hits both APIs fresh. For a production app, consider caching NPPES responses (they rarely change).
3. **No batch lookup**: Single NPI at a time. A future version could support CSV upload.
4. **No database**: Stateless — no history of lookups is stored.
5. **Organization NPIs**: Only handles NPI-1 (individual providers). NPI-2 (organizations) will return data but the profile card is designed for individuals.
