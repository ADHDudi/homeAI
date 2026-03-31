# HomeAI Project Backlog

## 🔴 High Priority

## 🟡 Medium Priority
- [ ] #003 · Fix aggregator stale cache TTL reset — stale disk-cache fallback uses Date.now() instead of preserving original timestamp, prevents API retry during outages
- [ ] #004 · Add CKAN fetch AbortController — Promise.race timeout doesn't cancel underlying HTTP request, abandoned fetches consume sockets until server closes connection
- [ ] #005 · Remove conflicting revalidate export — mechir/page.tsx has both force-dynamic and revalidate=300, the latter is silently ignored by Next.js
- [ ] #006 · Seed disk cache on deploy — mechir page takes 16s on cold start because Dira API paginate all 2433 projects; a seeding script at deploy time would fix this
- [ ] #012 · [SEC] Validate disk cache on read — aggregator, dira, arcgis, and geocode caches parse JSON with no schema check; poisoned cache file could inject bad data; add Zod validation
- [ ] #013 · [SEC] Distribute rate limiter across instances — in-memory Map in middleware.ts resets per instance; in multi-instance deployments attackers can bypass the 60 req/min limit; migrate to Redis or Upstash
- [ ] #017 · Fix ProjectItems pushed before ActionStatus guard — on pages >1 error-envelope items append to allProjects before the throw evicts them; move push below the ActionStatus check
- [ ] #018 · Guard NumOfRecords NaN in Dira pagination — missing or non-numeric NumOfRecords sets total to NaN; NaN < NaN is false so loop exits after page 1 silently; add Number.isFinite() guard

## 🟢 Low Priority / Ideas
- [ ] #007 · Mobile nav 6-tab overflow — nav was designed for 5 tabs; "Mechir LaMishtaken" label may truncate on 320px screens
- [ ] #008 · ArcGIS dedup collision risk — ActiveProjectId ?? OBJECTID fallback could collide with Dira ProjectNumber causing wrong suppression of upcoming projects
- [ ] #009 · Add open lottery push notification — schedule a periodic check for new open lotteries and surface a banner when status changes
- [ ] #010 · City page Mechir integration — show relevant upcoming lottery projects on the city detail page
- [ ] #014 · [SEC] Whitelist CKAN filter fields — filters object is JSON-stringified and forwarded to CKAN API without field-name allowlist; tighten Zod schema to reject unexpected keys
- [ ] #015 · Prune extraneous npm packages — several @emnapi/* packages listed as extraneous in npm ls; run npm prune to reduce attack surface
- [ ] #019 · Replace timeoutId definite-assignment assertion — all three clients use `let timeoutId!` which hides undefined if fetch throws before Promise constructor runs; use `| undefined` type and guard clearTimeout call

## ✅ Done
- [x] #000 · Add Mechir LaMishtaken tab — full lottery tab with Dira API + ArcGIS data sources, caching, filters, charts, and detail panels
- [x] #001 · Fix timer leak in CKAN client — clearTimeout added after Promise.race in success and error paths; applied to Dira and ArcGIS clients too
- [x] #002 · Fix Dira pagination silent failure — ActionStatus checked, throws on error envelope; NumOfRecords: 0 on page 1 breaks with warning
- [x] #011 · [SEC] Tighten CSP headers — replaced unsafe-eval + unsafe-inline in script-src with per-request nonce + strict-dynamic; Next.js reads nonce from CSP response header
- [x] #016 · Fix ActionStatus undefined throws — changed !== 0 to (?? 0) !== 0 so missing field is treated as success, not an error
