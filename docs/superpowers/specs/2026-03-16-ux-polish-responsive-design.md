# UX Polish & Responsive Design Spec

## Context

HomeAI is an Israeli real estate investment analysis platform with 6 pages (Dashboard, Map, City, Projects, Compare, Method). The UI is built with Next.js + Tailwind CSS + shadcn/ui components. The app currently renders well on desktop (1280px+) but has critical UX issues on mobile and tablet:

- Navigation overflows on mobile — no collapse, hamburger, or bottom nav
- Map and chart containers have fixed pixel heights that are too tall on mobile
- Grids use desktop-first column counts without mobile breakpoints
- Tables show 6-8 columns with no mobile card alternative
- Touch targets are too small in several areas
- No responsive typography scaling

The goal: make every page feel native-quality on mobile (375px), comfortable on tablet (768px), and polished on desktop (1280px+) — with equal priority for all three.

### Breakpoint Definitions (Tailwind v4 defaults)

| Name | Breakpoint | Target |
|------|-----------|--------|
| (base) | 0-639px | Mobile phones (portrait) |
| `sm:` | 640px+ | Large phones / small tablets |
| `md:` | 768px+ | Tablets — **this is the mobile/desktop nav switch point** |
| `lg:` | 1024px+ | Desktop / large tablets |
| `xl:` | 1280px+ | Wide desktop |

Throughout this spec, "mobile" means base (no prefix), "tablet" means `md:`, and "desktop" means `lg:`. The `xl:` breakpoint is used sparingly for wide layouts.

### RTL Handling — Explicitly Deferred

The app currently sets `lang="he" dir="ltr"` — Hebrew language but left-to-right layout. Most content renders in Hebrew text within LTR containers. Converting to full RTL (`dir="rtl"`) would require auditing every directional margin, padding, and flex alignment across all components. This is a significant effort orthogonal to responsive design and is **explicitly deferred** to a separate future task. For now, all responsive changes use logical/direction-neutral patterns where possible (e.g., `gap` over `ml/mr`, `justify-between` over absolute positioning).

### Landscape Mode — Out of Scope

Phone landscape (e.g., 667x375) is not a primary use case for this data-heavy app. The bottom nav will remain visible in landscape. No landscape-specific overrides are included in this spec.

---

## Layer 1: Mobile Bottom Tab Bar

### Design

Create a `MobileBottomNav` component that renders a fixed bottom tab bar on screens < 768px (md breakpoint). The existing top `Navigation` component hides its nav links on mobile and only shows the logo.

**Bottom bar layout (5 visible tabs + overflow):**

```
[ Dashboard ]  [ Map ]  [ City ]  [ Projects ]  [ Compare ]
   house       map       building   hammer        scale
```

- Each tab: icon (lucide-react) + label (text-xs), stacked vertically
- Active tab: primary color icon + label, inactive: muted-foreground
- Fixed bottom, `h-16`, `z-50`, `bg-background/95 backdrop-blur`, border-top
- "Method" page accessible from the top nav logo area (info icon) or a "More" option replacing Compare if needed in the future
- Safe area padding: `pb-[env(safe-area-inset-bottom)]` for notched phones
- Requires adding `viewport-fit=cover` to the viewport meta tag in `layout.tsx`

**Top Navigation changes on mobile (<md):**
- Hide the horizontal nav links (`hidden md:flex`)
- Keep logo + app name visible
- Add a small info/menu icon on the right that links to Method page

**Desktop (>= md):** No change — existing horizontal top nav remains as-is.

### Files to modify
- `src/components/layout/Navigation.tsx` — hide nav links on mobile, add Method icon
- Create `src/components/layout/MobileBottomNav.tsx` — new bottom tab bar
- `src/app/layout.tsx` — add `MobileBottomNav`, bottom padding on main content, `viewport-fit=cover` meta tag

---

## Layer 2: Layout Shell & Global Responsive Foundations

### 2a. Root Layout Responsive Padding

Current: `<main className="container py-6">` — no horizontal mobile padding control.

Change to: `<main className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-4 md:py-6 pb-20 md:pb-6">`
- Replace Tailwind's `container` class with explicit `mx-auto max-w-7xl` to avoid potential padding conflicts in Tailwind v4
- `pb-20` on mobile to clear the bottom nav bar (80px clearance for 64px nav + 16px breathing room)
- Tighter vertical padding on mobile (`py-4`)

### 2b. Responsive Typography Scale

Add utility classes (or apply directly) for heading consistency across the app:

| Element | Mobile | Tablet (md) | Desktop (lg) |
|---------|--------|-------------|---------------|
| Page title (h1) | text-2xl | text-3xl | text-3xl |
| Section title (h2) | text-lg | text-xl | text-2xl |
| Card title | text-sm | text-base | text-base |
| Body text | text-sm | text-sm | text-sm |
| Stat numbers | text-xl | text-2xl | text-2xl |

Apply to: every page's title and section headings.

### Files to modify
- `src/app/layout.tsx` — responsive padding + bottom nav clearance
- All page files — responsive heading classes

---

## Layer 3: Page-by-Page Responsive Fixes

### 3a. Dashboard Page (`src/app/page.tsx`, `MarketSummaryCharts`, `TopCitiesTable`)

**Title:** `text-3xl` → `text-2xl md:text-3xl`

**Market Summary Charts:**
- Chart grid: keep `md:grid-cols-2 lg:grid-cols-4`, add responsive chart heights
- **Recharts responsive pattern** (reuse across all charts in the app):
  Wrap each `<ResponsiveContainer>` in a `<div>` with responsive height classes, then set `<ResponsiveContainer width="100%" height="100%">`. The outer div controls size via CSS:
  ```tsx
  <div className="h-[200px] md:h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart ...>
    </ResponsiveContainer>
  </div>
  ```
- Left margin: `margin.left: 80` → `margin.left: 40` (always — simpler than media queries in JS)
- Y-axis label width: `width={75}` → `width={50}` (always)

**Top Cities Table:**
- Wrap in `overflow-x-auto` with horizontal scroll indicator
- On mobile (<md): hide lower-priority columns (District, Renewal, Construction) — show only: #, City, Score, Population, Avg Price
- Controls row: `flex flex-col sm:flex-row gap-2 sm:gap-3`
- Add `whitespace-nowrap` on table headers

### 3b. Map Page (`MapExplorerClient`, `CityMap`)

**Controls:**
- Select widths: `w-[200px]` → `w-full sm:w-[200px]`
- Controls layout: `flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3`
- Input: `max-w-xs` → `w-full sm:max-w-xs`

**Stats cards:**
- Grid: `grid-cols-2 md:grid-cols-4` → `grid-cols-2 md:grid-cols-4` (keep — 2 cols on mobile is acceptable for 4 small stat cards)

**Map container (CityMap.tsx):**
- Height: `h-[600px]` → `h-[350px] md:h-[450px] lg:h-[600px]`
- Legend: reduce font size on mobile, move to bottom-center on small screens
- City popup: `w-72` → `w-[calc(100vw-2rem)] sm:w-72`, position `bottom-2 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto`
  - On mobile: popup renders as a card at the bottom of the map (not overlapping content above)
  - On desktop: existing top-right absolute positioning
- Popup close button: increase touch target to `min-w-[44px] min-h-[44px]` (meets 44px touch requirement)

**Top Opportunities:**
- Grid: `md:grid-cols-3` → `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`

### 3c. City View Page (`CityViewClient`)

**Header:**
- `flex items-start justify-between` → `flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3`
- Score badge moves below city name on mobile

**Section navigation (sticky):**
- `flex gap-2` → `flex gap-2 overflow-x-auto` with custom scrollbar-hide CSS for horizontal scroll on mobile
- Add to `globals.css`: `.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } .scrollbar-hide::-webkit-scrollbar { display: none; }`
- Tab text: `text-sm` → `text-xs sm:text-sm`

**Map:**
- Height: `h-[500px]` → `h-[300px] md:h-[400px] lg:h-[500px]`

**Stat cards:**
- Grid: `sm:grid-cols-2 lg:grid-cols-4` → `grid-cols-2 sm:grid-cols-2 lg:grid-cols-4` (already reasonable)
- Stat number: `text-2xl` → `text-xl md:text-2xl`

**Age distribution:**
- Grid: `grid-cols-6 gap-2` → `grid-cols-3 sm:grid-cols-6 gap-2` (2 rows on mobile)
- Bar height: `h-32` → `h-24 sm:h-32`

**Score radar + sub-scores:**
- Grid: `md:grid-cols-2` (already stacks on mobile — OK)

**Neighborhood pricing chart:**
- Y-axis width: `width={120}` → `width={80}` on mobile
- Bar chart margins: tighten on mobile

### 3d. Projects Page (`src/app/projects/page.tsx`)

**Title:** `text-3xl` → `text-2xl md:text-3xl`

**Stats cards:** `md:grid-cols-3` → `grid-cols-1 sm:grid-cols-3` (acceptable)

**Project cards:** `md:grid-cols-2 lg:grid-cols-3` (already good)

**Tab buttons:** Ensure horizontal scroll with `overflow-x-auto` if many tabs

### 3e. Compare Page (`CompareClient`)

**City selectors:**
- Grid: `grid-cols-2 gap-4` → `grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4`
- On mobile, cities stack vertically (City A above City B)

**Comparison header cards:**
- Grid: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`

**Comparison rows (`CompareRow` component, lines 37-64):**
- Desktop (`sm:+`): keep existing `grid-cols-3` (City A value | Label | City B value)
- Mobile (base): stacked card layout using conditional rendering:
  ```tsx
  {/* Mobile: stacked */}
  <div className="sm:hidden rounded-lg border p-3 space-y-1">
    <div className="text-xs font-medium text-muted-foreground text-center">{label}</div>
    <div className="flex justify-between">
      <span className={winnerA ? 'text-primary font-bold' : ''}>{valueA}</span>
      <span className={winnerB ? 'text-primary font-bold' : ''}>{valueB}</span>
    </div>
  </div>
  {/* Desktop: 3-col grid */}
  <div className="hidden sm:grid grid-cols-3 gap-4 ...">
    {/* existing layout */}
  </div>
  ```
- Winner-highlighting color logic stays identical on both layouts
- The `border-b` separator on desktop rows is replaced by card borders on mobile

**Quick picks:**
- `flex flex-wrap gap-2` (already wraps — OK)

### 3f. Methodology Page (`src/app/methodology/page.tsx`)

**Container:** `max-w-4xl` → `max-w-4xl w-full px-4`

**Data source rows:**
- `flex items-center justify-between` → `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1`

**Title:** `text-3xl` → `text-2xl md:text-3xl`

---

## Layer 4: Visual Polish & Consistency

### 4a. Transitions & Hover States
- Add `transition-colors duration-150` to all interactive cards and links (if not already present)
- Bottom nav tabs: `transition-colors duration-150`
- Map popup: `transition-opacity duration-200` for enter/exit

### 4b. Focus & Active States
- Bottom nav active tab: scale slight bump `scale-[1.02]` + primary color
- Cards: `hover:shadow-md transition-shadow` on clickable cards
- Active page link in bottom nav: bold weight + colored icon

### 4c. Loading Skeletons
- Ensure all loading states use consistent skeleton heights matching their responsive content
- **MapExplorerClient** dynamic import fallback (line 24): `h-[600px]` → `h-[350px] md:h-[450px] lg:h-[600px]`
- **CityViewClient** map loading skeleton: `h-[500px]` → `h-[300px] md:h-[400px] lg:h-[500px]`
- **CityViewClient** neighborhood section loading skeleton: match responsive heights

### 4d. Spacing Rhythm
- Standardize section gaps: `space-y-4 md:space-y-6 lg:space-y-8` across all pages
- Card internal padding: consistent `p-3 md:p-4 lg:p-6`

---

## Files Summary

### Create (1)
| File | Purpose |
|------|---------|
| `src/components/layout/MobileBottomNav.tsx` | Fixed bottom tab bar for mobile |

### Modify (15)
| File | Changes |
|------|---------|
| `src/components/layout/Navigation.tsx` | Hide nav links on mobile, add Method icon |
| `src/app/layout.tsx` | Add MobileBottomNav, responsive padding, bottom clearance, viewport-fit meta |
| `src/app/globals.css` | Add `.scrollbar-hide` utility class |
| `src/app/page.tsx` | Responsive title + section headings |
| `src/components/dashboard/MarketSummaryCharts.tsx` | Responsive chart wrapper divs, tighter margins |
| `src/components/dashboard/TopCitiesTable.tsx` | Hide columns on mobile, responsive controls |
| `src/components/map/MapExplorerClient.tsx` | Responsive controls, grids, loading skeleton height |
| `src/components/map/CityMap.tsx` | Responsive map height, popup sizing, touch targets |
| `src/components/city-view/CityViewClient.tsx` | Responsive header, map, age chart, stats, loading skeletons |
| `src/components/city/NeighborhoodPricing.tsx` | Responsive Y-axis width, chart margins |
| `src/app/projects/page.tsx` | Responsive title, tab overflow |
| `src/components/compare/CompareClient.tsx` | Stacked selectors, mobile comparison rows |
| `src/app/methodology/page.tsx` | Container padding, responsive rows |
| `src/components/shared/StatCard.tsx` | Responsive stat number size |

---

## Verification Plan

1. **Mobile (375px):** Use Claude Preview `preview_resize` with `preset: "mobile"` on each page:
   - Bottom nav visible, 5 tabs, active state highlighted
   - All content fits within viewport width (no horizontal scroll on body)
   - Maps at ~350px height, charts readable
   - Tables scroll horizontally with visible indicator
   - Touch targets >= 44px on interactive elements

2. **Tablet (768px):** Use `preview_resize` with `preset: "tablet"`:
   - Top nav visible, bottom nav hidden
   - Grids at 2-3 columns
   - Maps at ~450px height

3. **Desktop (1280px):** Use `preview_resize` with `preset: "desktop"`:
   - No regressions from current layout
   - Full column grids, original map heights

4. **Navigation flow:** Click through all 6 pages on mobile via bottom nav — verify active states and page transitions
