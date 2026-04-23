# HomeAI Project Backlog

## 🔴 High Priority
- [ ] #013 · [SEC] Distribute rate limiter across instances — in-memory Map in middleware.ts resets per instance; in multi-instance deployments attackers can bypass the 60 req/min limit; migrate to Redis or Upstash

## 🟡 Medium Priority
- [ ] #004 · Add CKAN fetch AbortController — Promise.race timeout doesn't cancel underlying HTTP request, abandoned fetches consume sockets until server closes connection
- [ ] #006 · Seed disk cache on deploy — mechir page takes 16s on cold start because Dira API paginate all 2433 projects; a seeding script at deploy time would fix this
- [ ] #012 · [SEC] Add Zod validation on disk cache read — aggregator and geocode caches parse JSON without schema validation; diskCache.ts now has a structural type guard (isValidPayload) but does not validate inner record shapes; add Zod for deep validation
- [ ] #021 · Decompose large component files — MechirTableClient.tsx (~715 lines) and CityViewClient.tsx (~623 lines) are oversized; extract sub-components for filters, table rows, and chart panels to improve testability and readability
- [ ] #022 · Expand test coverage — unit tests exist only for dira/client; scoring engine (calculator.ts, percentile.ts), aggregator.ts, normalizers.ts, and key React components have zero coverage; aim for ≥80% on business logic

## 🟢 Low Priority / Ideas
- [ ] #007 · Mobile nav 6-tab overflow — nav was designed for 5 tabs; "Mechir LaMishtaken" label may truncate on 320px screens
- [ ] #008 · ArcGIS dedup collision risk — ActiveProjectId ?? OBJECTID fallback could collide with Dira ProjectNumber causing wrong suppression of upcoming projects
- [ ] #009 · Add open lottery push notification — schedule a periodic check for new open lotteries and surface a banner when status changes
- [ ] #010 · City page Mechir integration — show relevant upcoming lottery projects on the city detail page
- [ ] #014 · [SEC] Whitelist CKAN filter fields — filters object is JSON-stringified and forwarded to CKAN API without field-name allowlist; tighten Zod schema to reject unexpected keys
- [ ] #015 · Prune extraneous npm packages — several @emnapi/* packages listed as extraneous in npm ls; run npm prune to reduce attack surface
- [ ] #023 · Disk cache has no max-size guard — geocode-cache.json and raw-datasets.json can grow unbounded on long-running instances (100k+ records); add a size check or periodic compaction to avoid disk pressure on constrained environments (apphosting.yaml: 512 MB RAM)

## ✅ Done
- [x] #000 · Add Mechir LaMishtaken tab — full lottery tab with Dira API + ArcGIS data sources, caching, filters, charts, and detail panels
- [x] #001 · Fix timer leak in CKAN client — clearTimeout added after Promise.race in success and error paths; applied to Dira and ArcGIS clients too
- [x] #002 · Fix Dira pagination silent failure — ActionStatus checked, throws on error envelope; NumOfRecords: 0 on page 1 breaks with warning
- [x] #011 · [SEC] Tighten CSP headers — replaced unsafe-eval + unsafe-inline in script-src with per-request nonce + strict-dynamic; Next.js reads nonce from CSP response header
- [x] #016 · Fix ActionStatus undefined throws — changed !== 0 to (?? 0) !== 0 so missing field is treated as success, not an error
- [x] #003 · Fix aggregator stale cache TTL reset — stale fallback now uses staleDiskCache.ts instead of Date.now(), preserving true data age for correct API retry timing
- [x] testing · Bootstrap Vitest + 18 unit tests for fetchAllDiraProjects — covers pagination, ActionStatus guard (#016), NumOfRecords edge cases (#018), HTTP retry, request shape
- [x] #005 · Remove conflicting revalidate export — removed revalidate=300 from mechir/page.tsx; force-dynamic already prevents ISR caching
- [x] #017 · Fix ProjectItems pushed before ActionStatus guard — push already occurs after ActionStatus check in current code; confirmed resolved
- [x] #018 · Guard NumOfRecords NaN in Dira pagination — added Number.isFinite() + <= 0 check in dira/client.ts; NaN/undefined/null/negative values now break the loop with a warning instead of silently misreporting total
- [x] #019 · Replace timeoutId definite-assignment assertion — all three clients refactored to use shared fetchWithRetry utility; `let timeoutId!` replaced with `let timeoutId: ReturnType<typeof setTimeout> | undefined` with guarded clearTimeout
- [x] #020 · Fix 4xx over-retry in Dira client — dira/client.ts now uses fetchWithRetry with `isRetryableStatus: (s) => s >= 500`; 4xx responses are returned directly without retry
- [x] refactor · Extract fetchWithRetry utility — 3-way duplicated Promise.race timeout + retry loop extracted to src/lib/utils/fetchWithRetry.ts; all three HTTP clients (ckan, arcgis, dira) now use it
- [x] refactor · Extract diskCache factory — 2-way duplicated disk-backed cache implementation extracted to src/lib/utils/diskCache.ts; arcgis/cache.ts and dira/cache.ts reduced to ~15 lines each; adds isValidPayload type guard on disk cache read (partial mitigation for #012)
