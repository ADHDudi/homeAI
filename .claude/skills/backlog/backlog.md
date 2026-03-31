# HomeAI Project Backlog

## 🔴 High Priority

## 🟡 Medium Priority
- [ ] #003 · Fix aggregator stale cache TTL reset — stale disk-cache fallback uses Date.now() instead of preserving original timestamp, prevents API retry during outages
- [ ] #004 · Add CKAN fetch AbortController — Promise.race timeout doesn't cancel underlying HTTP request, abandoned fetches consume sockets until server closes connection
- [ ] #005 · Remove conflicting revalidate export — mechir/page.tsx has both force-dynamic and revalidate=300, the latter is silently ignored by Next.js
- [ ] #006 · Seed disk cache on deploy — mechir page takes 16s on cold start because Dira API paginate all 2433 projects; a seeding script at deploy time would fix this

## 🟢 Low Priority / Ideas
- [ ] #007 · Mobile nav 6-tab overflow — nav was designed for 5 tabs; "Mechir LaMishtaken" label may truncate on 320px screens
- [ ] #008 · ArcGIS dedup collision risk — ActiveProjectId ?? OBJECTID fallback could collide with Dira ProjectNumber causing wrong suppression of upcoming projects
- [ ] #009 · Add open lottery push notification — schedule a periodic check for new open lotteries and surface a banner when status changes
- [ ] #010 · City page Mechir integration — show relevant upcoming lottery projects on the city detail page

## ✅ Done
- [x] #000 · Add Mechir LaMishtaken tab — full lottery tab with Dira API + ArcGIS data sources, caching, filters, charts, and detail panels
- [x] #001 · Fix timer leak in CKAN client — clearTimeout added after Promise.race in success and error paths; applied to Dira and ArcGIS clients too
- [x] #002 · Fix Dira pagination silent failure — ActionStatus checked, throws on error envelope; NumOfRecords: 0 on page 1 breaks with warning
