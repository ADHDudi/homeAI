# HomeAI -- Israel Investment Finder

**Powered by [JustAIit](https://justaiit.com)**

A real-time investment analysis platform for Israeli cities. HomeAI scores 200+ cities based on government open data, combining demographic trends, development activity, pricing signals, infrastructure quality, municipal finances, and environmental factors into a single composite investment score.

---

## Features

- **Investment Scoring Engine** -- 6 weighted sub-scores computed from 10 government datasets, producing a 0-100 composite score for every city
- **Interactive City Map** -- Leaflet-based map with marker clustering, color-coded by investment score; covers 200+ cities including ~92 previously missing via district/subdistrict coordinate fallback; Leaflet bundle preloads on city-list hover to reduce map init delay; neighborhood markers appear immediately on city select while data loads in the background
- **City Detail View** -- Deep-dive into any city with neighborhood-level data, score breakdowns, and demographic charts
- **Side-by-Side City Comparison** -- Compare two or more cities across all scoring dimensions
- **Market Summary Charts** -- Recharts-powered visualizations of national trends, district distributions, and score histograms
- **Responsive Design** -- Optimized layouts for mobile, tablet, and desktop; dashboard uses a compact 3-column stats row (always horizontal on mobile) with city rankings rendered as a scrollable list on mobile and a bar chart on desktop
- **Real-Time Data** -- All metrics derived from 10 government datasets fetched via the CKAN API, with in-memory and disk caching

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Maps | Leaflet / react-leaflet |
| Charts | Recharts |
| Data Fetching | Axios, TanStack React Query |
| Validation | Zod |
| Data Source | CKAN API (data.gov.il) |

---

## Investment Scoring Algorithm

Every city receives a composite investment score (0-100) calculated as the weighted sum of six sub-scores. Each sub-score uses percentile ranking across all cities, with per-capita normalization where appropriate.

| Sub-Score | Weight | What It Measures | Data Sources |
|-----------|--------|------------------|--------------|
| Development Momentum | 25% | Urban renewal projects, construction activity, housing pipeline | Urban Renewal, Construction Sites, Housing Inventory |
| Demand Signal | 20% | Subscriber-to-winner ratio in subsidized housing, young adult share, demographic growth proxy | Mechir LaMishtaken, Population Demographics |
| Price Attractiveness | 20% | Affordability relative to other cities (lower price = higher score) | Mechir LaMishtaken (avg price per m2) |
| Infrastructure | 15% | Public transit coverage, banking access, green building density (all per capita) | Bus Stops, Bank Branches, Green Buildings |
| Municipal Health | 10% | Budget surplus ratio, debt ratio, per-capita municipal income | Municipal Finances, Population Demographics |
| Environment | 10% | Contaminated site density (fewer = better) | Contaminated Land |

---

## Data Sources

All data is sourced from Israel's national open data portal ([data.gov.il](https://data.gov.il)) via the CKAN API. No API keys are required.

| Dataset | Source Ministry / Agency | Resource ID |
|---------|--------------------------|-------------|
| Population Demographics | Central Bureau of Statistics (CBS) | `64edd0ee-3d5d-43ce-8562-c336c24dbc1f` |
| Urban Renewal Projects | Ministry of Housing | `f65a0daf-f737-49c5-9424-d378d52104f5` |
| Construction Sites | Ministry of Housing | `b072e36c-a53b-49e1-be08-4a608fcf4638` |
| Housing Inventory (Pipeline) | Ministry of Housing | `99aad98f-2b54-4eea-834d-650b56389bf3` |
| Mechir LaMishtaken (Subsidized Housing) | Ministry of Housing | `7c8255d0-49ef-49db-8904-4cf917586031` |
| Public Housing | Ministry of Housing | `ece87d7d-d79f-4278-8559-921218bc2b6a` |
| Municipal Finances | Ministry of Interior | `e5ff9ad0-6db2-4660-a94e-4499fce9475d` |
| Bank Branches | Bank of Israel | `2202bada-4baf-45f5-aa61-8c5bad9646d3` |
| Green Buildings | Ministry of Environmental Protection | `7f467a30-58cd-44b5-86f0-d570cc7d25ad` |
| Bus Stops | Ministry of Transport | `e873e6a2-66c1-494f-a677-f5e77348edb0` |
| Contaminated Land | Ministry of Environmental Protection | `54aa9ff1-2d89-4899-bb57-bf2a749ff4b3` |

---

## Getting Started

```bash
git clone https://github.com/your-org/home-investment-app.git
cd home-investment-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

No API keys are needed -- all data is publicly available via data.gov.il.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
src/
  app/                  Pages and API routes (Next.js App Router)
    api/                Server-side API endpoints
    city-view/          City detail page
    compare/            Side-by-side comparison page
    explore/            Explore / browse cities
    methodology/        Scoring methodology explainer
    projects/           Project-level views
  components/           UI components
    brand/              Logo, branding elements
    city/               City card, city list
    city-view/          City detail view components
    compare/            Comparison view components
    dashboard/          Dashboard widgets and summary cards
    layout/             Header, footer, navigation
    map/                Leaflet map and marker components
    shared/             Reusable shared components
    ui/                 shadcn/ui primitives (Button, Card, etc.)
  config/               Dataset configuration and CKAN resource IDs
  data/                 Static data and seed files
  hooks/                Custom React hooks
  lib/                  Core logic
    ckan/               CKAN API client
    data/               Data aggregation and caching
    scoring/            Investment scoring engine (calculator, percentiles)
    utils/              Utility functions
  types/                TypeScript interfaces (CityProfile, ScoreBreakdown, etc.)
docs/                   Documentation
```

---

## Architecture

```
data.gov.il (CKAN API)
        |
        v
  Next.js API Routes
  (fetch 11 datasets in parallel)
        |
        v
  Aggregator + Cache Layer
  (per-server-lifetime in-memory cache, warmed on startup + disk cache)
        |
        v
  Scoring Engine
  (percentile ranking, weighted composite)
        |
        v
  React UI
  (Dashboard, Map, City View, Compare)
```

1. **Data Ingestion** -- The aggregator (`src/lib/data/`) fetches all datasets from data.gov.il via the CKAN `datastore_search` API in parallel. Hebrew field names are mapped to English using the field maps in `src/config/datasets.ts`.

2. **Caching** -- Results are held in a per-server-lifetime in-memory cache (TTL = Infinity) with a persistent disk fallback (`.data-cache/raw-datasets.json`). The cache is warmed automatically on module load (`warmCacheFromAPI()`) so data is hot before the first user request; it refreshes only on server restart or deploy. Stale disk data is also loaded into memory after an SSR timeout so subsequent requests return instantly. Each dataset fails gracefully and independently.

3. **Scoring** -- The scoring engine (`src/lib/scoring/calculator.ts`) computes percentile ranks across all cities for each metric, normalizes per capita where relevant, and produces six sub-scores that are combined into a weighted composite.

4. **Presentation** -- The React frontend consumes scored city profiles via TanStack React Query and renders them across the dashboard, interactive map, city detail pages, and comparison views.

---

## License

MIT
