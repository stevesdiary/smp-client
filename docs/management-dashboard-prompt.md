# SMP Management Web Dashboard — React UI Prompt

> **Reference document.**
> This prompt is designed to be handed to an AI assistant, React developer, or design tool to generate the complete admin-facing web dashboard for the School Management Platform (EDUPLUS).

---

## The Brief

Build a **React web dashboard for school administrators** that gives complete operational visibility into every aspect of school life — enrollment, attendance, academic performance, finances, staff, and all operational modules — with deep analytics filterable by academic year and term.

The dashboard must feel **authoritative, data-rich, and immediately actionable**: an administrator opens this at 7:45 AM, scans the KPIs, spots anything that needs attention, and takes action — all within 30 seconds. No hunting for information. No loading spinners blocking the whole screen.

**Design philosophy:** Data-forward, Vercel/Linear-inspired.

> *"A dashboard that makes you feel in control is worth more than a dashboard that merely shows data."*

Apply these three principles throughout:

- **Density** — Show more, hide less. Admins are power users. Whitespace is earned, not gifted.
- **Semantics** — Color carries meaning. Green = growth/good. Red = alert/risk. Amber = warning/pending. Reserve color for signal, not decoration.
- **Immediacy** — The most important number on the screen is the one that changed since yesterday. Surface deltas everywhere.

**Tech stack:** React 18 + TypeScript, Tailwind CSS, Shadcn UI, Lucide React, Recharts, TanStack React Query v5.

**Extends:** The existing `DashboardPage.tsx` (do not create from scratch — extend and replace the current role-based shell).

---

## Design System

### Color Palette

```typescript
// Base — slate scale (primary surfaces)
slate950:  '#020617'   // Deepest text, headings
slate900:  '#0f172a'   // Sidebar background
slate800:  '#1e293b'   // Active sidebar item
slate700:  '#334155'   // Borders, dividers
slate600:  '#475569'   // Muted text, labels
slate500:  '#64748b'   // Placeholder, timestamps
slate200:  '#e2e8f0'   // Card borders (light mode)
slate100:  '#f1f5f9'   // Table row hover (light mode)
slate50:   '#f8fafc'   // Page background (light mode)

// Primary — teal (brand, actions, links)
teal600:   '#0d9488'   // Primary buttons, active states
teal500:   '#14b8a6'   // Hover
teal100:   '#ccfbf1'   // Light tint backgrounds
teal50:    '#f0fdfa'   // Subtle tint (badge bg)

// Semantic — exact meanings, use consistently
success:   '#16a34a'   // Present, paid, completed, growth
warning:   '#d97706'   // Late, pending, at-risk
danger:    '#dc2626'   // Absent, overdue, failed, decline
neutral:   '#64748b'   // Excused, N/A, muted

// Data visualization palette (6 categorical colors)
// Use in this order for chart series
dataBlue:    '#3b82f6'  // Series 1
dataTeal:    '#14b8a6'  // Series 2
dataViolet:  '#8b5cf6'  // Series 3
dataAmber:   '#f59e0b'  // Series 4
dataRose:    '#f43f5e'  // Series 5
dataEmerald: '#10b981'  // Series 6

// Surface system (light mode — primary target)
background:       '#f8fafc'   // Page background
surfaceCard:      '#ffffff'   // Card surface
surfaceMuted:     '#f1f5f9'   // Table rows, secondary bg
surfaceBorder:    '#e2e8f0'   // Dividers
```

### Typography

```typescript
// Font: Inter (Google Fonts) — already used in codebase
// Fallback: 'Plus Jakarta Sans', system-ui

// Scale (Tailwind class equivalents)
displayLarge:  { size: '2.25rem', weight: 700, tracking: '-0.025em' }  // text-4xl font-bold
displayMedium: { size: '1.875rem', weight: 700, tracking: '-0.025em' } // text-3xl font-bold
title1:        { size: '1.5rem',   weight: 600, tracking: '-0.015em' } // text-2xl font-semibold
title2:        { size: '1.25rem',  weight: 600, tracking: '-0.01em'  } // text-xl font-semibold
title3:        { size: '1.125rem', weight: 600 }                       // text-lg font-semibold
body:          { size: '0.875rem', weight: 400 }                       // text-sm
bodyMedium:    { size: '0.875rem', weight: 500 }                       // text-sm font-medium
caption:       { size: '0.75rem',  weight: 400 }                       // text-xs
captionBold:   { size: '0.75rem',  weight: 600, tracking: '0.05em'  } // text-xs font-semibold uppercase
```

### Spacing & Radius

```typescript
// 8-point grid (Tailwind equivalents)
spacing1:   '0.25rem'  // gap-1
spacing2:   '0.5rem'   // gap-2
spacing3:   '0.75rem'  // gap-3
spacing4:   '1rem'     // gap-4
spacing5:   '1.25rem'  // gap-5
spacing6:   '1.5rem'   // gap-6
spacing8:   '2rem'     // gap-8
spacing10:  '2.5rem'   // gap-10
spacing12:  '3rem'     // gap-12

// Border radius
radiusSm:   '0.375rem' // rounded-md   — inputs, badges
radiusMd:   '0.5rem'   // rounded-lg   — buttons, chips
radiusLg:   '0.75rem'  // rounded-xl   — cards
radiusXL:   '1rem'     // rounded-2xl  — hero sections, modals
```

### Elevation & Shadow

```typescript
// Subtle — data dashboards avoid heavy shadows
shadowCard:    'shadow-sm'                        // Standard card
shadowFloat:   'shadow-md'                        // Dropdowns, tooltips
shadowModal:   'shadow-xl'                        // Modals, sheets

// Card border instead of shadow (preferred for data-dense layouts)
cardBorder:    'border border-slate-200'
activeCardBorder: 'border border-teal-200 bg-teal-50'
```

### Chart Defaults

```typescript
// Recharts global config
const CHART_DEFAULTS = {
  margin:        { top: 8, right: 16, bottom: 8, left: 0 },
  gridColor:     '#e2e8f0',    // surfaceBorder
  axisColor:     '#94a3b8',    // slate-400
  tooltipBg:     '#0f172a',    // slate-900
  tooltipText:   '#f8fafc',    // slate-50
  animationDuration: 400,
  fontFamily:    'Inter, system-ui',
  fontSize:      12,
};

// Bar chart bar radius
barRadius: [4, 4, 0, 0]  // rounded top only

// Area chart gradient fill
areaOpacity: { start: 0.3, end: 0.0 }  // top-to-bottom fade
```

---

## Navigation Architecture

```
AppShell
├── Sidebar (existing — role-filtered nav)
│   ├── Logo / School name
│   ├── Command center
│   │   ├── /dashboard         ← Admin home
│   │   ├── /dashboard/analytics ← NEW: deep analytics
│   │   └── /notices
│   ├── Academic core
│   │   ├── /students, /teachers, /classes
│   │   ├── /academic-years, /subjects, /timetable
│   │   └── /gradebook
│   ├── Operations
│   │   ├── /attendance, /payments, /fees
│   │   ├── /events, /transport, /inventory
│   │   └── /hostel, /health
│   ├── Campus life
│   │   ├── /sports, /disciplinary, /courses
│   ├── Digital learning
│   │   ├── /elearning, /library, /certificates
│   └── System
│       ├── /billing, /candidates, /settings
│       └── /website-editor, /custom-domain-setup
│
├── TopBar (global — all pages)
│   ├── [Hamburger — mobile only]
│   ├── Page title (dynamic)
│   ├── [Search icon — global search, future]
│   ├── [Bell icon — notifications badge]
│   └── [Avatar — user menu: profile, settings, logout]
│
└── Main content area (route outlet)
```

**Sidebar behavior:**
- Collapsed to icon-only at `< 1280px`, fully hidden at `< 768px` (overlay drawer)
- Active item: `bg-slate-800 text-white`, left accent stripe `w-0.5 bg-teal-500`
- Inactive item: `text-slate-400 hover:text-white hover:bg-slate-800/50`
- Section headers: `captionBold text-slate-500 uppercase px-3 py-2`

**Transitions:**
- Route change: instant (no animation — data dashboards feel faster without page transitions)
- Sidebar collapse/expand: `transition-all duration-200 ease-in-out`
- Chart mount: `animationDuration: 400` (Recharts built-in)
- Skeleton → content: `animate-pulse` fade, 200ms

---

## Screen 1: Main Dashboard (`/dashboard`)

**Purpose:** Give the school administrator a complete 30-second overview of the school's current state.

**Layout:** 3-column grid at 1280px+. Two main columns + one contextual sidebar column.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TOPBAR: Good morning, {FirstName}  ·  Term 3, 2025/2026  ·  🔔 3  [AV] │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ZONE 1: HEADER STRIP                                                    │
│  ┌────────────────────────────────────────────────────────┐              │
│  │  Greenwood Academy                                      │              │
│  │  Tuesday, 27 May 2026  ·  Term 3, 2025/2026            │              │
│  │  ● Live · Updated just now           [View Analytics →] │              │
│  └────────────────────────────────────────────────────────┘              │
│                                                                           │
│  ZONE 2: KPI STRIP (4 cards)                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐               │
│  │ Students │ │  Staff   │ │ Classes  │ │  Revenue     │               │
│  │   1,247  │ │    84    │ │    36    │ │ ₦2.4M        │               │
│  │ ▲12 +1%  │ │ ▲3 +3.7% │ │ same    │ │ ▲15% vs T2   │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘               │
│                                                                           │
│  ZONE 3: ANALYTICS GRID (2×2)            │  ZONE 5: CONTEXTUAL PANEL   │
│  ┌────────────────────┐ ┌──────────────┐ │  ┌────────────────────────┐  │
│  │ Attendance Today   │ │ Revenue MTD  │ │  │ Quick Actions          │  │
│  │ Area chart: 30d    │ │ Bar: by term │ │  │ [+Student] [Attend]    │  │
│  └────────────────────┘ └──────────────┘ │  │ [Payment] [Notice]     │  │
│  ┌────────────────────┐ ┌──────────────┐ │  ├────────────────────────┤  │
│  │ Grade Distribution │ │ Enrollment   │ │  │ Upcoming Events (7d)   │  │
│  │ Horizontal bars    │ │ Line by term │ │  │ • Sports Day   Jun 2   │  │
│  └────────────────────┘ └──────────────┘ │  │ • Term 3 Exams Jun 10  │  │
│                                           │  ├────────────────────────┤  │
│  ZONE 4: LIVE FEED                        │  │ Notifications (3 new)  │  │
│  ┌───────────────────────────────────────┐│  │ Emeka marked absent    │  │
│  │ 09:14 ● JSS 1A marked present  94%   ││  │ Payment ₦25k received  │  │
│  │ 09:02 ● Payment ₦50,000 — Obi Emeka  ││  │ AI insight ready       │  │
│  │ 08:55 ● Grade posted — Math JSS 2B   ││  └────────────────────────┘  │
│  └───────────────────────────────────────┘│                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Zone 1 — Header Strip

**Layout:** Full-width horizontal bar, `bg-white border-b border-slate-200`, `px-6 py-4`

**Left:**
- School name: `title2 text-slate-900`
- Date + current term: `caption text-slate-500` — format `"Tuesday, 27 May 2026 · Term 3, 2025/2026"`
- Live indicator: pulsing green dot (`animate-ping` inner + `bg-success` outer) + "Updated just now" in `caption text-slate-400`

**Right:**
- "View Analytics →" link button: `text-sm font-medium text-teal-600 hover:text-teal-700` — routes to `/dashboard/analytics`

**Data:** Current academic year/term from `GET /academic-years` (filter `isCurrent: true`) and `GET /terms` (filter `isCurrent: true`).

---

### Zone 2 — KPI Strip

Four `StatCard` components in a responsive grid: `grid grid-cols-2 lg:grid-cols-4 gap-4`.

**StatCard spec:**

```
┌──────────────────────────────────────┐
│  [Icon]              [Sparkline]     │
│                                      │
│  1,247                               │
│  Total Students                      │
│                                      │
│  ▲ 12 students  +1.0%  vs last term  │
└──────────────────────────────────────┘
```

- Container: `bg-white rounded-xl border border-slate-200 p-5`
- Icon: Lucide, 20px, `text-slate-400`, top-left
- Sparkline: 7-point mini line chart (Recharts `LineChart` 80×32px), top-right, no axes
- Value: `text-3xl font-bold text-slate-900`
- Label: `text-sm text-slate-500 mt-0.5`
- Delta row: `text-xs mt-3 flex items-center gap-1`
  - Positive delta: `TrendingUp` icon, `text-success` — "▲ N  +X%"
  - Negative delta: `TrendingDown` icon, `text-danger` — "▼ N  -X%"
  - Zero delta: `Minus` icon, `text-slate-400` — "No change"
- "vs last term" suffix: `text-slate-400`

**The 4 KPI cards:**

| Card | Icon | Value source | Delta basis |
|------|------|-------------|-------------|
| Total Students | `Users` | `GET /students` total count | vs previous term enrollment |
| Total Staff | `GraduationCap` | `GET /teachers` count + staff count | vs previous term |
| Active Classes | `BookOpen` | `GET /classes` count | vs previous term |
| Revenue (MTD) | `Banknote` | `GET /payments?status=SUCCESS` sum this month | vs same month last term |

**Loading state:** `SkeletonZone` — animated pulse rectangle 140×96px per card.

**Empty state:** Value shows `—` with `text-slate-400`; delta row hidden.

---

### Zone 3 — Analytics Grid

Four chart panels in a `2×2` grid: `grid grid-cols-1 md:grid-cols-2 gap-4`.

Each chart panel:
```
┌──────────────────────────────────────────────┐
│  Section title           [Filter dropdown]   │
│  Subtitle / context label                    │
│                                              │
│  [Chart area — Recharts]                     │
│                                              │
│  Legend row (if multi-series)                │
└──────────────────────────────────────────────┘
```
- Container: `bg-white rounded-xl border border-slate-200 p-5`
- Title: `text-sm font-semibold text-slate-700`
- Subtitle: `text-xs text-slate-400 mb-4`
- Chart height: `240px` (fixed)

**Panel 1: Attendance Overview**
- Type: `AreaChart` (Recharts)
- Data: Last 30 days school-wide attendance rate (% present per day)
- X-axis: day labels (Mon 12, Tue 13, …), 8 labels max, `text-xs text-slate-400`
- Y-axis: 0–100%, ticks at 25/50/75/100
- Area fill: `dataBlue` gradient (0.3 → 0.0 opacity)
- Stroke: `dataBlue` 2px
- Tooltip: `"May 22: 94.2% present (847/900)"`
- Subtitle: "School-wide · Last 30 days"
- Reference line at 80%: dashed `warning` color, label "Target"

**Panel 2: Revenue & Collections**
- Type: `BarChart` (Recharts, grouped)
- Data: Monthly collected vs. outstanding fees for last 6 months
- Bars: `dataEmerald` (Collected) + `dataAmber` (Outstanding)
- Bar radius: `[4, 4, 0, 0]`
- Tooltip: `"May 2026: ₦2.4M collected · ₦0.6M outstanding"`
- Legend: inline color squares + labels, `text-xs`
- Y-axis: formatted as `₦Xk` or `₦XM`

**Panel 3: Grade Distribution**
- Type: `BarChart` (horizontal)
- Data: Average grade per subject, current term
- Y-axis: subject names (truncate at 16 chars)
- X-axis: 0–100
- Bars: colored by performance threshold —
  - `≥ 70%` → `dataEmerald`
  - `50–69%` → `dataAmber`
  - `< 50%` → `dataRose`
- Label at end of bar: `"87%"` in `text-xs font-medium`
- Subtitle: "Subject averages · Current term"

**Panel 4: Enrollment Trend**
- Type: `LineChart` (Recharts, multi-line)
- Data: Total enrolled students per term for last 6 terms
- X-axis: term labels ("T1 2024", "T2 2024", …)
- Lines: one per class level (JSS1–JSS3, SS1–SS3), 6 lines using the 6 data colors
- Dots: radius 4px on each data point
- Tooltip: lists all class counts for that term
- Legend: scrollable horizontal legend below chart

---

### Zone 4 — Live Feed

A chronological reverse-ordered activity stream showing the last 20 events across all modules.

```
┌──────────────────────────────────────────────────────────┐
│  Live Feed                              [View all →]     │
│  ──────────────────────────────────────────────────      │
│  ●  JSS 1A attendance marked · 94% present     9:14 AM   │
│  ●  Payment received · Emeka Obi · ₦50,000     9:02 AM   │
│  ●  Grade posted · Mathematics JSS 2B          8:55 AM   │
│  ●  Student enrolled · Adaeze Nwosu · SS1A     8:30 AM   │
│  ●  AI insight generated · Tunde Bakare        8:28 AM   │
│  ●  Discipline incident · JSS 3B · Minor       Yesterday │
└──────────────────────────────────────────────────────────┘
```

**Container:** `bg-white rounded-xl border border-slate-200 p-5`

**Per feed item (LiveFeedItem component):**
```
[Type dot]  [Primary text]               [Timestamp]
            [Secondary text — optional]
```
- Type dot: 8px circle, colored by event type:
  - Attendance marked → `dataBlue`
  - Payment received → `dataEmerald`
  - Grade posted → `dataViolet`
  - Student enrolled → `dataTeal`
  - AI insight → `dataAmber`
  - Discipline incident → `dataRose`
  - General/notice → `slate-400`
- Primary text: `text-sm text-slate-700`
- Secondary text: `text-xs text-slate-400` (e.g., student name, class)
- Timestamp: `text-xs text-slate-400` right-aligned
  - Today: `"9:14 AM"`
  - Yesterday: `"Yesterday"`
  - Earlier: `"May 22"`

**Feed composition (client-side merge):**
Combine data from multiple React Query hooks into one sorted stream:
- Recent attendances (`GET /attendances?limit=5&sort=desc`)
- Recent payments (`GET /payments?limit=5&sort=desc`)
- Recent grades (`GET /gradebook/grades?limit=5&sort=desc`)
- Recent enrollments (`GET /students?limit=5&sort=desc`)

Sort all by `createdAt` desc, take top 20. No dedicated "feed" endpoint needed.

**Empty state:** `"All quiet — no activity yet today"` + `CheckCircle2` icon in `text-slate-300`.

---

### Zone 5 — Contextual Panel (Right Sidebar)

Right-column panel, `w-72`, visible at `1280px+`. Stacks below main content on smaller screens.

**Quick Actions block:**

```
┌──────────────────────────────────────┐
│  Quick Actions                       │
│  ┌────────┐ ┌────────┐              │
│  │ [User+]│ │[Check] │              │
│  │ Add    │ │ Mark   │              │
│  │Student │ │Attend. │              │
│  └────────┘ └────────┘              │
│  ┌────────┐ ┌────────┐              │
│  │[₦]    │ │[Bell]  │              │
│  │Record  │ │Create  │              │
│  │Payment │ │Notice  │              │
│  └────────┘ └────────┘              │
└──────────────────────────────────────┘
```

- 2×2 grid of `QuickActionButton` components
- Each: `bg-slate-50 hover:bg-teal-50 hover:border-teal-200 rounded-xl border border-slate-200 p-4 flex flex-col items-center gap-2 transition-colors cursor-pointer`
- Icon: Lucide 22px, `text-slate-600 group-hover:text-teal-600`
- Label: `text-xs font-medium text-slate-600`
- Routes: `UserPlus` → `/students?action=new`, `CheckSquare` → `/attendance`, `Banknote` → `/payments`, `Bell` → `/notices?action=new`

**Upcoming Events block:**

```
┌──────────────────────────────────────┐
│  Upcoming Events                     │
│  ──────────────                      │
│  ● Sports Day                        │
│    Mon, Jun 2 · All school           │
│  ● Term 3 Examinations               │
│    Tue, Jun 10 · 14 days             │
│  ● PTA Meeting                       │
│    Fri, Jun 13 · Parents             │
└──────────────────────────────────────┘
```

Data: `GET /events?upcoming=true&limit=5` sorted by date asc.

Per item:
- Dot: 6px, `bg-teal-500`
- Event name: `text-sm font-medium text-slate-700`
- Date + days until: `text-xs text-slate-400`
  - Within 3 days: `text-warning` — "Tomorrow" / "in 2 days"
  - 7+ days: `text-slate-400` — "Jun 10"

**Notifications block:**

```
┌──────────────────────────────────────┐
│  Notifications   3 new   [Mark all]  │
│  ──────────────────────────          │
│  ● Emeka Obi was marked absent       │
│    9:02 AM                           │
│  ● Payment ₦25,000 received          │
│    8:55 AM                           │
│  [View all notifications →]          │
└──────────────────────────────────────┘
```

Data: `GET /notifications?limit=3&unread=true`

Unread item: `bg-teal-50 border-l-2 border-teal-500`
Read item: `bg-white`

---

## Screen 2: Analytics Dashboard (`/dashboard/analytics`)

**Purpose:** Deep-dive into school performance with comparisons across terms and sessions.

**Layout:** Full-width page with sticky header containing the term selector, then a vertical stack of analytics sections.

```
┌──────────────────────────────────────────────────────────────┐
│  Analytics                                                    │
│  ─────────────────────────────────────────────────────────   │
│  [2025/2026 ▾] [Term 3 ▾]    [Compare mode ○]  [Export ↓]  │
│  ═══════════════════════════════════════════════════════════  │
│                                                               │
│  § Enrollment        § Attendance       § Academic Perf      │
│  § Financial         § Operations       § Staff              │
│  § AI Insights                                               │
└──────────────────────────────────────────────────────────────┘
```

**Sticky analytics header:**
- `sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-3`
- `TermSelector` component (see Component Library)
- Compare mode toggle: Shadcn `Switch` + `"Compare with previous term"` label
- Export button: `Download` icon + "Export" text, outline variant — triggers CSV download of current view data

**Section structure (each analytics section):**
```
[Section icon]  Section Title              [Expand/Collapse ▾]
                Context subtitle
────────────────────────────────────────────────────────
[Chart grid or table — fills section]
```
- Section container: `bg-white rounded-xl border border-slate-200 mb-4`
- Section header: `px-6 py-4 flex items-center justify-between cursor-pointer` (collapsible)
- Content area: `px-6 pb-6`

---

### Section A: Enrollment Analytics

**Icon:** `Users` (Lucide)

**Metric summary row (3 stat cards):**
- Total Enrolled · New This Term · Retention Rate

**Chart 1 — Students by Class (current term)**
- Type: `BarChart` vertical
- X-axis: class names (JSS 1A, JSS 1B, JSS 2A, …)
- Y-axis: student count
- Bar color: `dataBlue`
- Bar label: count above bar
- Height: 200px

**Chart 2 — Enrollment Growth (session view)**
- Type: `LineChart` multi-series
- X-axis: terms (T1 2023, T2 2023, T3 2023, T1 2024, …)
- Series: one line per class level (JSS1, JSS2, JSS3, SS1, SS2, SS3)
- 6 data colors
- Height: 240px

**Compare mode:** When enabled, show two grouped bars side by side (selected term vs. previous term) using `dataBlue` + `dataTeal` with a legend.

**Table — New vs. Returning Students:**
| Class | Total | New | Returning | Retention % |
| JSS 1A | 42 | 42 | — | — |
| JSS 2B | 40 | 2 | 38 | 95% |

---

### Section B: Attendance Analytics

**Icon:** `CalendarCheck` (Lucide)

**Metric summary row:**
- School-wide Average · Best Class · Worst Class · Chronic Absent Count

**Chart 1 — Weekly Attendance Rate**
- Type: `AreaChart`
- Data: school-wide % present per week for the selected term
- Reference line at 80% (target)
- X-axis: week labels ("Wk 1 Jan 6", …)
- Fill: `dataBlue` gradient

**Chart 2 — Class Comparison (current term)**
- Type: `BarChart` horizontal
- Y-axis: class names
- X-axis: attendance %
- Color threshold: green if ≥80%, amber 70–79%, red <70%
- Sort: descending by attendance %

**Table — Chronic Absenteeism:**
Students with attendance rate < 80% for the selected term.

| Student | Class | Present | Total Days | Rate | Status |
|---------|-------|---------|------------|------|--------|
| Tunde B | JSS 2A | 18 | 28 | 64% | ⚠ At Risk |

- Badge: `warning` if 70–79%, `danger` if < 70%
- Tap row → navigates to student profile (future)
- "Download list" button exports CSV

**Chart 3 — Attendance by Day of Week**
- Type: `BarChart` vertical, 5 bars (Mon–Fri)
- Shows: average % present per weekday for the term
- Useful for spotting chronic Monday/Friday absences

---

### Section C: Academic Performance Analytics

**Icon:** `TrendingUp` (Lucide)

**Metric summary row:**
- School Average Grade · Subjects with Avg < 50% · Students at Risk (< 50% in 2+ subjects)

**Chart 1 — Subject Averages (current term)**
- Type: `BarChart` horizontal
- Same threshold coloring as Grade Distribution widget
- All subjects listed

**Chart 2 — Grade Trend (3 terms)**
- Type: `LineChart` multi-series, one line per subject
- X-axis: last 3 terms
- Shows whether each subject's average is rising or falling
- Height: 280px

**Table — Top Performing Classes:**
| Class | Avg Grade | Subjects Recorded | vs Last Term |
|-------|-----------|------------------|-------------|
| SS2A | 81% | 8 | ▲ +4% |
| JSS1B | 78% | 7 | ▲ +2% |

**Table — Students at Risk:**
Students with grade average < 50% in 2 or more subjects.

| Student | Class | Subjects Below 50% | Avg | Action |
|---------|-------|--------------------|-----|--------|
| Kofi A | JSS 2B | English, Math | 44% | [View Profile] |

- Sorted by number of subjects below 50% (most critical first)
- Action column: button linking to future student detail view

---

### Section D: Financial Analytics

**Icon:** `Banknote` (Lucide)

**Metric summary row:**
- Total Billed (term) · Total Collected · Outstanding · Collection Rate %

**Chart 1 — Billed vs. Collected by Term**
- Type: `BarChart` grouped
- X-axis: last 6 terms
- Bars: `dataEmerald` (Collected) + `dataAmber` (Outstanding)
- Labels above bars: ₦XM format

**Chart 2 — Payment Status Breakdown**
- Type: `PieChart` / `RadialBarChart` (donut style)
- Segments: SUCCESS (emerald), PENDING (amber), FAILED (rose)
- Center label: collection rate %
- Legend: status + count + amount

**Chart 3 — Revenue by Term within Session**
- Type: `BarChart` grouped by session (academic year)
- Shows Term 1, Term 2, Term 3 bars per academic year
- Enables year-over-year comparison across sessions

**Table — Top Outstanding Accounts (current term):**
| Student | Class | Fee Type | Amount | Due Date | Overdue |
|---------|-------|----------|--------|----------|---------|
| Amara O | SS1A | School Fees | ₦50,000 | May 15 | 12 days |

- Sorted by overdue days (most overdue first)
- `danger` badge if overdue, `warning` if due within 7 days
- Shows top 10 by default, "Show all" expands
- Export to CSV button

---

### Section E: Operational Module Analytics

**Icon:** `LayoutGrid` (Lucide)

Six sub-panels in a `3×2` grid, each a mini card:

**E1 — Library**
- Books borrowed this month (number)
- Overdue books count (danger badge if > 0)
- Mini bar chart: borrowing count per month (last 6 months)
- Most-borrowed category: fiction/science/etc.

**E2 — E-Learning**
- Active courses count
- Course completion rate: `X%` (completions / enrollments)
- Average quiz score across all quizzes this term
- Mini horizontal bar: top 3 courses by completion rate

**E3 — Events**
- Events this term: total count
- Total participants
- Mini bar: attendance per event (last 5 events)

**E4 — Discipline**
- Total incidents this term
- By severity: Minor / Moderate / Severe (donut or 3 stat pills)
- Mini line chart: incidents per month (trend)
- Change vs. last term: delta with arrow

**E5 — Health**
- Health records logged this term
- Medical incidents: count
- Mini donut: incidents by type (injury, illness, vaccination, etc.)

**E6 — Transport**
- Active buses: count
- Students assigned to transport: count
- Average route occupancy: `X%`
- Mini horizontal bar: occupancy per route

---

### Section F: Staff & Teacher Analytics

**Icon:** `GraduationCap` (Lucide)

**Table — Teacher Performance (current term):**

| Teacher | Classes | Attend. Marking Rate | Grades Submitted | Avg Grade |
|---------|---------|---------------------|-----------------|-----------|
| Mr. Okafor | 3 | ████████░ 87% | 12/14 | 81% |
| Ms. Adeyemi | 4 | ██████████ 96% | 8/8 | 74% |

- Attendance marking rate: days attendance was marked / school days in term
  - Progress bar: `success` if ≥ 80%, `warning` 60–79%, `danger` < 60%
- Grades submitted: assignments graded / total assignments
- Sort by column on header click

**Chart — Classes per Teacher**
- Type: `BarChart` horizontal
- Y-axis: teacher names
- X-axis: number of active classes
- Color: `dataBlue`

---

### Section G: AI Insights Summary

**Icon:** `Sparkles` (Lucide)

> Only shown if Claude AI integration is active (check for `GET /ai/insights` availability).

**Metric row:**
- Students with insights this term · Insights generated today · Avg insight age

**Insight theme tags:**
Common themes extracted from AI insights (manually or via keyword match on insight text).
Display as tag cloud:
```
[Mathematics struggles × 24]  [Attendance improvement × 18]
[English writing × 12]        [Consistent performance × 31]
```
- Tags sorted by frequency
- Color: `bg-teal-50 text-teal-700 border border-teal-200 rounded-full`

**Chart — Insights Generated per Month:**
- Type: `BarChart`
- Tracks how many students had insights generated per month

**Table — Students with No Insights (this term):**
Students who have not had an AI insight generated for the current term — helps admin identify data gaps.

---

## Component Library

### `StatCard`

```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  delta?: {
    value: number;       // absolute change
    percent: number;     // percentage change
    direction: 'up' | 'down' | 'neutral';
    label?: string;      // "vs last term"
  };
  sparklineData?: number[];  // last 7 data points
  loading?: boolean;
  className?: string;
}
```

- Loading: renders `SkeletonZone` of appropriate size
- Delta direction `'up'`: green if it's a good metric (students, revenue), red if bad metric (absences, incidents) — caller controls semantics via `positiveIsGood?: boolean`
- Sparkline: 80×32px `LineChart`, no axes, no tooltip, stroke 1.5px

---

### `AnalyticsChart`

```tsx
interface AnalyticsChartProps {
  title: string;
  subtitle?: string;
  height?: number;          // default: 240
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  filterSlot?: ReactNode;   // optional dropdown/toggle in header
  children: ReactNode;      // Recharts component goes here
}
```

- Renders the chart container (white card, padding, title, subtitle)
- Handles `loading` → `SkeletonZone` overlay
- Handles `empty` → `EmptyZone` with message
- `filterSlot` renders in the top-right of the card header

---

### `LiveFeedItem`

```tsx
interface LiveFeedItemProps {
  type: 'attendance' | 'payment' | 'grade' | 'enrollment' | 'insight' | 'discipline' | 'general';
  primary: string;
  secondary?: string;
  timestamp: Date | string;
  onClick?: () => void;
}
```

- Dot color from type map (see Zone 4 spec)
- Timestamp formatting: `formatRelativeTime(timestamp)` → "just now", "9:14 AM", "Yesterday", "May 22"

---

### `QuickActionButton`

```tsx
interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}
```

---

### `TermSelector`

```tsx
interface TermSelectorProps {
  value: { academicYearId: string; termId: string };
  onChange: (value: { academicYearId: string; termId: string }) => void;
  compareValue?: { academicYearId: string; termId: string };
  onCompareChange?: (value: { academicYearId: string; termId: string } | null) => void;
  showCompare?: boolean;
}
```

- Two cascading `Select` components: Year → Term
- Year options: from `GET /academic-years` sorted desc
- Term options: from `GET /terms?academicYearId={id}` — updates when year changes
- Current year/term pre-selected on mount (find `isCurrent: true`)
- Compare mode: shows a second identical selector when `showCompare=true`
- Persists selection to URL params: `?academicYearId=xxx&termId=yyy`
- On mount: reads from URL params first, falls back to current term

---

### `DataBadge`

Extends Shadcn `Badge` with semantic variants:

```tsx
type DataBadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

// Maps to:
// success → bg-success/10 text-success border-success/20
// warning → bg-warning/10 text-warning border-warning/20
// danger  → bg-danger/10  text-danger  border-danger/20
// neutral → bg-slate-100  text-slate-500 border-slate-200
// info    → bg-teal-50    text-teal-600  border-teal-200
```

Used throughout for: attendance status, payment status, discipline severity, risk level.

---

### `SkeletonZone`

```tsx
interface SkeletonZoneProps {
  variant: 'card' | 'chart' | 'table-row' | 'feed-item' | 'kpi';
  count?: number;  // for table-row and feed-item
}
```

All variants use `animate-pulse bg-slate-100 rounded`:
- `kpi`: 140×96px
- `card`: full-width, 280px tall
- `chart`: full-width, 240px tall
- `table-row`: full-width, 44px tall (stacked)
- `feed-item`: full-width, 48px tall (stacked)

---

### `EmptyZone`

```tsx
interface EmptyZoneProps {
  icon?: LucideIcon;     // default: BarChart2
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}
```

Centered in the parent container. Icon in `text-slate-300` at 48px. Title in `title3 text-slate-500`. Description in `body text-slate-400`.

---

### `SectionHeader`

```tsx
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string | number;  // e.g. count badge
  action?: { label: string; onClick: () => void };
}
```

---

## API Integration

### Endpoints Used by the Dashboard

All requests include `Authorization: Bearer <token>` and `X-Tenant-ID: <tenantId>` headers (handled by the global Axios instance in `src/lib/api.ts`).

**KPI Data:**
```
GET /students                              → total student count
GET /teachers                              → total teacher count
GET /classes                               → total class count
GET /payments?status=SUCCESS&month=current → revenue sum
GET /academic-years                        → current year/term context
GET /terms?academicYearId={id}             → terms for year
```

**Dashboard Widgets:**
```
GET /attendances?startDate={30dAgo}&endDate={today}     → attendance chart data
GET /payments?startDate={6mAgo}&endDate={today}         → revenue chart data
GET /gradebook/grades?termId={id}                       → grade distribution
GET /students?academicYearId={id}                       → enrollment per year
GET /events?upcoming=true&limit=5                       → upcoming events
GET /notifications?limit=3                              → recent notifications
GET /notifications/unread-count                         → badge count
```

**Analytics Pages:**
```
GET /attendances?classId={id}&termId={id}              → class attendance data
GET /gradebook/grades?termId={id}&academicYearId={id}  → grades analytics
GET /payments?termId={id}&academicYearId={id}          → financial analytics
GET /disciplinary?termId={id}                          → discipline analytics
GET /library/transactions?month={m}                    → library analytics
GET /elearning/completions?termId={id}                 → e-learning analytics
GET /ai/insights?termId={id}                           → AI insights summary
GET /events?termId={id}                                → events analytics
```

### React Query Cache Strategy

```typescript
// Dashboard KPIs — refresh every 5 minutes
queryOptions({ staleTime: 5 * 60 * 1000 })

// Charts (live feed zone) — refresh every 2 minutes
queryOptions({ staleTime: 2 * 60 * 1000 })

// Analytics data — refresh every 10 minutes (less volatile)
queryOptions({ staleTime: 10 * 60 * 1000 })

// Notifications unread count — refresh every 60 seconds
queryOptions({ staleTime: 60 * 1000, refetchInterval: 60 * 1000 })
```

### URL State for Analytics

```typescript
// Term selector state lives in URL — bookmarkable and shareable
// Route: /dashboard/analytics?academicYearId=xxx&termId=yyy&compareTermId=zzz

// Hook: useAnalyticsParams()
const { academicYearId, termId, compareTermId, setParams } = useAnalyticsParams();
```

### Error Handling

| Error | Behavior |
|-------|----------|
| 401 Unauthorized | Auto-logout + redirect to `/login` (handled by Axios interceptor) |
| 503 on `/ai/insights` | Section shows `EmptyZone` with "AI insights are being prepared" message |
| Network error | Show offline banner at top of page + use stale cached data |
| Empty data | Each zone has specific `EmptyZone` state (see below) |
| Rate limit (429) | Show "Data loading…" with spinner, retry after 2s |

### Empty States

| Zone | Empty Message |
|------|--------------|
| KPI strip | Dashes `—` for values; no delta shown |
| Attendance chart | "No attendance data recorded yet for this period" |
| Revenue chart | "No payments recorded this period" |
| Grade distribution | "No grades submitted yet — check back after assessments" |
| Live feed | "All quiet — no activity recorded today" |
| Upcoming events | "No upcoming events scheduled" |
| Notifications | "You're all caught up" |

---

## Suggested File Structure

```
src/
├── pages/
│   └── dashboard/
│       ├── DashboardPage.tsx          (replace existing — main 5-zone layout)
│       ├── AnalyticsPage.tsx          (NEW — /dashboard/analytics)
│       ├── hooks/
│       │   ├── useDashboardData.ts    (KPI + live feed queries)
│       │   ├── useAnalyticsData.ts    (all analytics queries)
│       │   └── useAnalyticsParams.ts  (URL param state for TermSelector)
│       └── components/
│           ├── KPIStrip.tsx
│           ├── AttendanceChart.tsx
│           ├── RevenueChart.tsx
│           ├── GradeDistributionChart.tsx
│           ├── EnrollmentTrendChart.tsx
│           ├── LiveFeed.tsx
│           ├── QuickActions.tsx
│           ├── UpcomingEvents.tsx
│           ├── NotificationsPanel.tsx
│           ├── analytics/
│           │   ├── EnrollmentSection.tsx
│           │   ├── AttendanceSection.tsx
│           │   ├── AcademicSection.tsx
│           │   ├── FinancialSection.tsx
│           │   ├── OperationsSection.tsx
│           │   ├── StaffSection.tsx
│           │   └── AIInsightsSection.tsx
│           └── TermSelector.tsx
│
└── components/
    └── shared/
        ├── StatCard.tsx               (NEW — KPI tile with sparkline + delta)
        ├── AnalyticsChart.tsx         (NEW — chart wrapper with loading/empty)
        ├── LiveFeedItem.tsx           (NEW — feed row component)
        ├── QuickActionButton.tsx      (NEW — quick action tile)
        ├── SkeletonZone.tsx           (NEW — loading placeholders)
        ├── EmptyZone.tsx              (NEW — no-data states)
        └── DataBadge.tsx              (EXTEND existing Badge component)
```

**New dependency to install:**
```bash
npm install recharts
npm install @types/recharts  # if types not bundled
```

**Existing components to reuse (do not recreate):**
- `src/components/ui/` — all Shadcn components (Button, Card, Badge, Select, Switch, Table, Dialog, Tabs)
- `src/components/shared/ModuleHero` — use for the Analytics page hero
- `src/components/shared/DataTable` — use for all data tables in analytics sections
- `src/lib/api.ts` — configured Axios instance
- `src/lib/utils.ts` — `formatDate`, `formatCurrency`, `getApiErrorMessage`
- `src/store/authStore.ts` — `useAuthStore` for user context (school name, role, tenantId)

---

## Accessibility & Responsiveness

### Accessibility (WCAG 2.1 AA)

- All chart containers have `role="img"` and `aria-label` describing the chart
- Data tables included as visually-hidden (`sr-only`) fallbacks for each chart
- All interactive elements have minimum 44×44px touch target
- Color is never the **only** indicator — pair with icons, text labels, or patterns
- Keyboard navigation: Tab through all interactive elements in logical order
- Screen reader tested on: login → dashboard → analytics → term selector

### Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| `1280px+` (xl) | Full 5-zone layout: sidebar + 3 columns |
| `1024px–1279px` (lg) | Sidebar collapsed to icons + 2 columns |
| `768px–1023px` (md) | Sidebar as overlay drawer + single column |
| `< 768px` (sm) | Mobile — single column, read-only, charts simplified |

**Mobile behavior:**
- Dashboard is primarily a **desktop experience** — state this clearly in UI
- On mobile: show KPI strip + live feed only; hide charts (too dense to read)
- Show banner: `"For the full analytics experience, open on a larger screen"`
- All CRUD actions still accessible via sidebar navigation on mobile

### Data Loading Performance

- All dashboard zones use independent queries — partial loading is acceptable
- Each zone renders its `SkeletonZone` independently; no full-page spinner
- Charts do not block KPI cards from rendering
- Target: KPI strip visible within 800ms of page load (stale data acceptable)
- Target: Charts populated within 2 seconds on a standard connection
- Use `initialData` from stale React Query cache where available

---

## The Admin's 10-Second Check

A school administrator opens this dashboard every morning. After 10 seconds, they should know:

1. **Is the school growing?** — KPI strip shows student count delta vs. last term. Green arrow = yes.
2. **Did attendance happen today?** — Live feed shows attendance markings. If nothing, something's wrong.
3. **Is revenue healthy?** — Revenue KPI shows MTD vs. last term. Red arrow = collect faster.
4. **Are any students at academic risk?** — Grade Distribution chart reveals subjects with class averages below 50%.
5. **What needs action right now?** — Notifications panel surfaces the 3 most recent alerts.
6. **What's coming up this week?** — Upcoming Events panel shows the next 5 events with countdowns.
7. **Is there a financial crisis?** — Red-badged students in the contextual panel signals overdue payments.

If any of these 7 answers require clicking deeper than the dashboard surface, the design has failed.

**Checklist for implementation:**

- [ ] Dashboard loads with stale data in < 800ms (React Query cache)
- [ ] KPI deltas always show direction vs. a meaningful baseline (never just a raw number)
- [ ] No zone ever shows an empty white box — every zone has a skeleton and an empty state
- [ ] Quick actions are always visible without scrolling on 1280px+ screens
- [ ] Analytics mode is accessible in one click from the dashboard header
- [ ] Term selector in analytics persists across page navigations (URL params)
- [ ] On first launch (no data): every zone shows a helpful empty state with a call to action
- [ ] Recharts tooltips are keyboard-accessible (focus triggers tooltip)
- [ ] All monetary values use `formatCurrency()` from `src/lib/utils.ts` (₦ symbol, comma separator)
- [ ] All dates use `formatDate()` from `src/lib/utils.ts` (consistent locale)
