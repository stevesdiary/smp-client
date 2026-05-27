# SMP Parent Mobile App — Flutter UI Prompt

> **Reference document.**
> This prompt is designed to be handed to an AI assistant, Flutter developer, or design tool to generate the complete parent-facing mobile application for the School Management Platform.

---

## The Brief

Build a **Flutter mobile application for school parents** that surfaces real-time information about their children — attendance, grades, timetable, fees, and AI-powered learning insights. The app must feel **premium, calm, and trustworthy**: a parent opens this app at 7 AM before school drop-off, and it must communicate everything they need to know in seconds with zero cognitive friction.

**Design philosophy:** Steve Jobs' approach to Apple product design.
> *"Design is not just what it looks like and feels like. Design is how it works."*

Apply the three Apple HIG principles throughout:
- **Clarity** — Text is legible. Icons are unambiguous. Every element serves a purpose.
- **Deference** — The UI steps aside for the content. Whitespace is not empty space, it is breathing room.
- **Depth** — Layered surfaces, purposeful motion, and subtle shadow give the user a sense of place.

**Tech stack:** Flutter (Dart), targeting iOS and Android with iOS-quality feel.

---

## Design System

### Color Palette

```dart
// Primary — deep indigo (authority, trust)
primary:          Color(0xFF1C1C6E)   // Deep navy
primaryLight:     Color(0xFF3B3BA8)   // Interactive blue
primarySurface:   Color(0xFFF0F0FF)   // Tinted background

// Semantic
success:          Color(0xFF34C759)   // Apple green — PRESENT, SUCCESS
warning:          Color(0xFFFF9F0A)   // Apple amber — LATE, PENDING
danger:           Color(0xFFFF3B30)   // Apple red — ABSENT, OVERDUE, FAILED
neutral:          Color(0xFF8E8E93)   // Apple gray — EXCUSED, N/A

// Surface system (light mode)
background:       Color(0xFFF2F2F7)   // iOS system background
surfacePrimary:   Color(0xFFFFFFFF)   // Card / sheet surface
surfaceSecondary: Color(0xFFF2F2F7)   // Grouped table background
surfaceTertiary:  Color(0xFFE5E5EA)   // Dividers, borders

// Typography
labelPrimary:     Color(0xFF000000)   // Primary text
labelSecondary:   Color(0xFF3C3C43).withOpacity(0.6)  // Secondary
labelTertiary:    Color(0xFF3C3C43).withOpacity(0.3)  // Placeholder

// Dark mode equivalents follow iOS dark system colors
```

### Typography

```dart
// Font: SF Pro equivalent → use 'Inter' from Google Fonts or 'Plus Jakarta Sans'
// NEVER use generic Roboto — it reads as Android.

const TextStyle displayLarge   = TextStyle(fontSize: 34, fontWeight: FontWeight.w700, letterSpacing: -0.5);
const TextStyle displayMedium  = TextStyle(fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: -0.3);
const TextStyle title1         = TextStyle(fontSize: 22, fontWeight: FontWeight.w600, letterSpacing: -0.2);
const TextStyle title2         = TextStyle(fontSize: 17, fontWeight: FontWeight.w600, letterSpacing: -0.1);
const TextStyle title3         = TextStyle(fontSize: 15, fontWeight: FontWeight.w600);
const TextStyle body           = TextStyle(fontSize: 17, fontWeight: FontWeight.w400);
const TextStyle callout        = TextStyle(fontSize: 16, fontWeight: FontWeight.w400);
const TextStyle subheadline    = TextStyle(fontSize: 15, fontWeight: FontWeight.w400);
const TextStyle footnote       = TextStyle(fontSize: 13, fontWeight: FontWeight.w400);
const TextStyle caption        = TextStyle(fontSize: 12, fontWeight: FontWeight.w400, letterSpacing: 0.1);
const TextStyle captionBold    = TextStyle(fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5);
```

### Spacing & Radius

```dart
// 8-point grid
const double spacing2  =  2.0;
const double spacing4  =  4.0;
const double spacing8  =  8.0;
const double spacing12 = 12.0;
const double spacing16 = 16.0;
const double spacing20 = 20.0;
const double spacing24 = 24.0;
const double spacing32 = 32.0;
const double spacing40 = 40.0;

// Border radius
const double radiusSmall  =  8.0;   // Chips, badges
const double radiusMedium = 12.0;   // Buttons, inputs
const double radiusLarge  = 16.0;   // Cards
const double radiusXL     = 24.0;   // Bottom sheets, hero cards
const double radiusFull   = 999.0;  // Pills, avatars
```

### Elevation & Shadow

```dart
// Apple-style shadows — soft, low contrast, color-tinted
BoxShadow cardShadow = BoxShadow(
  color: Color(0xFF000000).withOpacity(0.06),
  blurRadius: 16,
  offset: Offset(0, 4),
);

BoxShadow floatingShadow = BoxShadow(
  color: Color(0xFF000000).withOpacity(0.12),
  blurRadius: 32,
  offset: Offset(0, 8),
);
```

---

## Navigation Architecture

```
Root
├── SplashScreen          (animated logo + auth check)
├── OnboardingFlow        (first launch only)
│   ├── WelcomeScreen
│   └── LoginScreen
└── MainShell             (persistent bottom nav)
    ├── Tab 0: HomeScreen         (dashboard)
    ├── Tab 1: ChildrenScreen     (child selector → child detail)
    ├── Tab 2: NotificationsScreen
    └── Tab 3: ProfileScreen

Modal routes (presented as bottom sheets / full-screen modals):
├── PaymentInitiationSheet
├── AIInsightsSheet
├── FeeDetailSheet
└── AttendanceDetailSheet
```

**Bottom navigation style:** 4-icon max. Use SF Symbols–style icons (filled for active, outline for inactive). No labels on active tab — use a subtle pill indicator under the icon.

**Transitions:**
- Tab switches: fade + slight scale (no slide)
- Push navigation: standard iOS slide from right
- Modal presentation: slide up from bottom with spring physics
- Data refresh: skeleton → content (never spinner blocking the whole screen)

---

## Screen Specifications

---

### 1. Splash Screen

**Purpose:** Load auth state while showing brand identity.

**Design:**
- Full-screen deep navy (`primary`) background
- Centered school logo or SMP mark — white, 80px, with a subtle drop shadow
- Animated: logo scales from 0.8 → 1.0 with spring curve on appear
- Fade to white/system background before routing
- Duration: max 1.5 seconds

---

### 2. Login Screen

**Purpose:** Authenticate the parent.

**Design:**
- White background, no header bar
- Logo at top — 60px, navy
- Headline: "Welcome back" in `displayMedium`
- Sub: "Sign in to your family account" in `footnote`, labelSecondary
- Vertical form, generous spacing (spacing32 between sections)

**Form fields (iOS-style):**
- Grouped background container (surfaceSecondary, radiusLarge)
- Divider between email and password inputs
- Labels float on focus (animated placeholder → label)
- Eye icon to toggle password visibility
- No border on individual fields — the group container provides the boundary

**CTA:**
- Full-width filled button, primary color, radiusMedium, 52px height
- Text: "Sign In", title2, white
- Loading state: CircularProgressIndicator (white, 20px) replaces text, button dims to 80% opacity
- Haptic: light impact on tap, success notification on authenticated

**Bottom:**
- "Forgot password?" in footnote, primaryLight, centered
- School contact link if auth fails

---

### 3. Home Screen (Dashboard)

**Purpose:** Give the parent a 10-second summary of all children's status.

**Layout:** Scrollable column with a sticky greeting header.

**Header:**
```
Good morning, {FirstName}               [Bell icon, badge count]
Tuesday, 26 May 2026
```
- `displayMedium` for greeting
- `footnote` for date, labelSecondary
- Bell: `CupertinoIcons.bell` or equivalent — tap opens NotificationsScreen
- Unread badge: red pill with count

**Child Summary Cards (horizontal scroll):**
Each child gets a card — this is the primary navigation entry point.
```
┌─────────────────────────────────────┐
│  👦  Emeka Obi                       │
│      JSS 1 · Greenwood Academy      │
│                                     │
│  ●●●●●●●  (attendance dots)         │
│  Attendance 94%  ·  3 alerts        │
└─────────────────────────────────────┘
```
- Card: white, radiusXL, `cardShadow`
- Avatar: circle with initials, primarySurface bg, primaryLight text
- Attendance sparkline: 7 colored dots (last 7 days) — green/red/amber
- Tap → navigates to ChildDetailScreen with Hero animation on the card

**Today's Activity Feed:**
- Section header: "Today" in `title3`, labelSecondary
- Empty state: "All clear — no activity yet today" with checkmark illustration
- Feed items (in reverse chronological order):
  - `[icon] [primary text]  [time]` layout
  - Attendance marked (green check, school icon)
  - Grade posted (star icon, subject name)
  - Fee due soon (orange clock icon)
  - New AI insight ready (sparkle icon)

**Quick Actions Row:**
```
[📋 Attendance]  [📊 Grades]  [🗓 Timetable]  [💳 Fees]
```
- 2×2 grid of rounded square buttons, surfaceSecondary bg
- SF-symbol-style icons, primaryLight color
- `footnote` labels below each

---

### 4. Child Detail Screen

**Purpose:** Full per-child view with all academic information.

**Header (collapsible, large title style):**
```
← [Back]

[Avatar 56px]
Emeka Obi
JSS 1  ·  2025/2026
```
- Background: gradient from `primary` (top) → white (bottom), 200px tall
- Child name: `displayMedium`, white
- Class and year: `subheadline`, white at 70% opacity
- Animated: collapses to inline nav title on scroll

**Metric Strip (3 cards in a row, sticky below collapsed header):**

| Card | Value | Color accent |
|------|-------|--------------|
| Attendance | 94% | success |
| Grades | 12 recorded | primaryLight |
| Paid | ₦85,000 | neutral |

Each card: white bg, radiusMedium, left border-accent (4px, colored), `displayMedium` value, `caption` label.

**Tabbed Content:**

Use a horizontally scrollable custom tab bar — pill-style active indicator, not underline.

```
[Attendance]  [Grades]  [Timetable]  [Fees]  [AI Insights]
```

---

#### Tab: Attendance

**List of last 30 records**, grouped by month.

Per-record row:
```
[Status dot]  Wednesday, 22 May        PRESENT  ›
              No remarks
```
- Status dot: 10px circle, colored per status
- Date: `callout`, labelPrimary
- Status label: `captionBold`, colored text
- Remarks: `footnote`, labelSecondary (hidden if empty)
- Tap → `AttendanceDetailSheet` (full remarks, time, teacher)

**Empty state:** Illustration of calendar + "No attendance records yet"

**Attendance Rate Widget (top of tab):**
```
┌────────────────────────────────┐
│  Overall Attendance            │
│                                │
│      ████████░░  94%           │
│      28 present · 2 absent    │
└────────────────────────────────┘
```
- Animated progress bar on tab enter
- Arc/ring progress optional (more visual impact)

---

#### Tab: Grades

**Grouped by subject.**

Subject header:
```
Mathematics                   87% avg
```
- `title3` for subject name
- Percentage average in `footnote`, primaryLight

Per-grade row:
```
Assignment 3 — Algebra Quiz    85/100   May 20
```
- Assignment title: `subheadline`
- Score: `callout`, success if ≥70%, warning if 50–69%, danger if <50%
- Date: `footnote`, labelSecondary

**Empty state:** "No grades recorded yet — check back after assessments"

---

#### Tab: Timetable

**Weekly view — day sections.**

Day section header:
```
MONDAY
```
- `captionBold`, labelSecondary, letterSpacing wide

Per-slot card:
```
┌──────────────────────────────┐
│  08:00 – 09:00               │
│  Mathematics                 │
│  Mr. Samuel Okafor  · Rm 12  │
└──────────────────────────────┘
```
- Time: `footnote`, labelSecondary
- Subject: `title3`, labelPrimary
- Teacher + Room: `footnote`, labelSecondary
- Left accent stripe: color-coded by subject (use hash → color function)

**Navigation:** Horizontal swipe between days. Current day highlighted.

---

#### Tab: Fees

**Two sections: Outstanding → Paid**

**Outstanding fee card:**
```
┌────────────────────────────────────┐
│  School Fees — 2025/2026 Term 3    │
│  ₦50,000 outstanding               │
│  ──────────────────────────────    │
│  Due: June 15, 2026                │
│  [Pay Now →]                       │
└────────────────────────────────────┘
```
- Card: white, radiusLarge, danger-tinted left border if overdue
- Amount: `title1`, danger if overdue, warning if due soon, labelPrimary otherwise
- "Pay Now" button: primary filled, full-width, opens `PaymentInitiationSheet`

**Optional fees section:**
- List of available opt-in fees with "Enroll" button
- Already-enrolled: checkmark, muted style

**Payment history (collapsible section):**
Per-payment row:
```
School Fees — Term 3       ₦25,000    May 10    ✓
```
- Status badge: pill, success/danger/warning colored background at 15% opacity, colored text

---

#### Tab: AI Insights

**Purpose:** Show the AI-generated performance analysis in a warm, encouraging tone.

**Design:**
```
┌────────────────────────────────────┐
│  ✦  AI Insights                    │
│     Generated today at 9:14 AM     │
│                                    │
│  Strengths                         │
│  ─────────                         │
│  "Strong performance in            │
│   Mathematics (87% avg) and        │
│   consistent attendance (94%)..."  │
│                                    │
│  Areas to Watch                    │
│  ──────────────                    │
│  "English assignment submission    │
│   delays noted in 2 recent..."     │
│                                    │
│  For You at Home                   │
│  ─────────────                     │
│  • Dedicate 30 min/day to...       │
│  • Encourage reading before...     │
│  • Review the timetable with...    │
│                                    │
│  [Refresh Insights]                │
└────────────────────────────────────┘
```
- Card: `primarySurface` background (light indigo tint)
- Sparkle icon (✦) in primaryLight
- Section headers in `footnote`, primaryLight, uppercase with wide letterSpacing
- Body text in `callout`, labelPrimary
- Recommendations: bulleted list with custom dot (primaryLight circle, 6px)
- "Refresh Insights" text button: `footnote`, primaryLight
- Loading state: 3-line skeleton with shimmer animation
- If AI unavailable (503): gentle inline message — "Insights are being prepared. Check back soon."

---

### 5. Notifications Screen

**Header:** "Notifications" in `displayMedium`

**Section: Today / Earlier**

Per-notification row:
```
[Icon]  Child marked absent              9:02 AM
        Emeka Obi was marked ABSENT on
        Tuesday, 26 May 2026
```
- Icon: colored circle (12px) matching notification type
  - Red circle: absence alert
  - Green circle: grade posted
  - Orange circle: fee reminder
  - Purple circle: general
- Unread rows: white bg, with a subtle left border (2px, primaryLight)
- Read rows: surfaceSecondary bg
- Swipe left to dismiss
- "Mark all read" button in top-right

**Empty state:** Checkmark illustration + "You're all caught up"

---

### 6. Profile Screen

**Header:**
```
[Avatar 72px — initials]
{Parent Full Name}
{email address}
```
- Avatar: large circle, primarySurface bg, primary text
- Name: `title1`
- Email: `subheadline`, labelSecondary

**Grouped settings list (iOS-style):**

Section: My Account
- Edit Profile
- Change Password
- Linked Children (shows count badge)

Section: Notifications
- Push Notifications toggle
- Email Alerts toggle
- Attendance Alerts toggle

Section: App
- App Version (non-interactive, labelSecondary)
- Privacy Policy
- Contact Support

Section:
- Sign Out (danger red text, centered)

---

## Component Library

### StatusBadge

```dart
Widget statusBadge(AttendanceStatus status) {
  // PRESENT  → green bg (10% opacity), green text
  // ABSENT   → red bg, red text
  // LATE     → amber bg, amber text
  // EXCUSED  → gray bg, gray text
  // Maps to PaymentStatus too:
  // SUCCESS  → green, FAILED → red, PENDING → amber
}
```

### MetricCard

```dart
Widget metricCard({
  required String value,
  required String label,
  required Color accentColor,
  Widget? icon,
})
// White card, left 4px accent border, shadow
// value in title1, label in caption
```

### SectionHeader

```dart
Widget sectionHeader(String title, { String? action, VoidCallback? onAction })
// title in title3, labelPrimary
// action in footnote, primaryLight (right-aligned)
```

### AppButton (Primary / Secondary / Destructive)

```dart
Widget appButton({
  required String label,
  required VoidCallback? onPressed,
  AppButtonVariant variant = AppButtonVariant.primary,
  bool loading = false,
  bool fullWidth = true,
})
// 52px height, radiusMedium
// Primary: primary bg, white text
// Secondary: transparent, primaryLight text, 1.5px primary border
// Destructive: transparent, danger text
// Loading: CircularProgressIndicator, disabled state
```

### SkeletonLoader

```dart
Widget skeleton({ double width, double height, double radius = 8 })
// Animated shimmer: surfaceTertiary → surfaceSecondary → surfaceTertiary
// Use for: cards, list rows, text blocks while loading
```

### ChildAvatar

```dart
Widget childAvatar(String name, { double size = 40 })
// Circle, primarySurface bg, initials in primaryLight
// 2px white border, cardShadow
```

---

## Animations & Motion

**Philosophy:** Motion should feel like physics, not choreography.

| Interaction | Animation |
|---|---|
| Screen push | Slide right + fade, 280ms, easeInOut |
| Modal present | Slide up, spring (damping 0.8), 350ms |
| Tab switch | Crossfade, 180ms |
| Card tap | Scale to 0.97, 80ms, then release spring |
| List appear | Staggered fade+slide up, 40ms between items |
| Progress bar | Animate width over 600ms, easeOut |
| Skeleton → content | Fade out skeleton, fade in content, 200ms |
| Pull to refresh | Custom Cupertino-style spinner |
| Haptics | Light impact on tap, success on auth, error on failure |

**Hero animations:** Use Flutter `Hero` widget on child cards. When a parent taps a child card on the Home screen, the card morphs into the ChildDetailScreen header — seamless spatial continuity.

---

## API Integration Notes

**Base URL:** Configured per environment (dev/staging/prod)
**Auth:** Bearer token (JWT, 7-day expiry), stored in FlutterSecureStorage
**Headers required on all requests:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenantId>    ← from JWT payload
Content-Type: application/json
```

**Endpoints used by this app:**

```
POST  /auth/login                           → authenticate
GET   /parent/children                      → list children
GET   /parent/children/:id/attendance       → last 30 records
GET   /parent/children/:id/grades           → all grades
GET   /parent/children/:id/timetable        → weekly schedule
GET   /parent/children/:id/payments         → payment history
GET   /parent/fees                          → fee summaries all children
GET   /parent/fees/:studentId               → fee detail one child
POST  /parent/fees/pay                      → initiate payment
GET   /parent/fees/:studentId/opt-in        → optional fee templates
POST  /parent/fees/:studentId/opt-in        → enroll in optional fee
GET   /ai/insights/:studentId               → AI performance insights
GET   /notifications                        → notification list
POST  /notifications/read                   → mark read
POST  /notifications/read-all              → mark all read
GET   /notifications/unread-count           → badge count
POST  /notifications/subscribe              → register push token
```

**State management:** Riverpod (recommended) or Bloc.
- Each domain (children, attendance, grades, fees, notifications) gets its own provider/bloc
- Cache attendance + grades locally for 24h (Hive or Isar)
- Notifications use FCM push (preferred) or 60s polling fallback

**Error handling:**
- 401 → force logout + navigate to Login
- 503 on `/ai/insights` → show graceful "preparing insights" message
- Network error → show offline banner + cached data
- 403 → log and show generic error (should not occur for valid parent sessions)

---

## Localization & Formatting

```dart
// Currency: Nigerian Naira
NumberFormat.currency(locale: 'en_NG', symbol: '₦', decimalDigits: 0)
// → ₦50,000

// Date: long form for records
DateFormat('EEEE, d MMMM yyyy', 'en_NG')  // → Tuesday, 26 May 2026

// Date: short form for lists
DateFormat('d MMM', 'en_NG')  // → 26 May

// Time
DateFormat('HH:mm')  // → 09:00

// Attendance rate
'${rate.toStringAsFixed(0)}%'  // → 94%
```

---

## Accessibility

- All interactive elements: minimum 44×44pt touch target
- Color is never the ONLY indicator of status (always pair with text/icon)
- Semantic labels on all icon buttons
- Dynamic type support — use `textScaleFactor` in all text widgets
- Screen reader (TalkBack/VoiceOver) tested on core flows: login → dashboard → child detail

---

## Suggested File Structure

```
lib/
├── main.dart
├── app.dart                    (MaterialApp, theme, routing)
├── core/
│   ├── theme/
│   │   ├── colors.dart
│   │   ├── typography.dart
│   │   └── theme.dart
│   ├── api/
│   │   ├── api_client.dart     (Dio + interceptors)
│   │   └── endpoints.dart
│   ├── storage/
│   │   └── secure_storage.dart
│   └── utils/
│       ├── formatters.dart     (currency, date, percentage)
│       └── haptics.dart
├── features/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── auth_provider.dart
│   ├── home/
│   │   ├── home_screen.dart
│   │   └── home_provider.dart
│   ├── children/
│   │   ├── children_screen.dart
│   │   ├── child_detail_screen.dart
│   │   └── children_provider.dart
│   ├── attendance/
│   ├── grades/
│   ├── timetable/
│   ├── fees/
│   ├── insights/
│   └── notifications/
└── widgets/
    ├── status_badge.dart
    ├── metric_card.dart
    ├── section_header.dart
    ├── app_button.dart
    ├── skeleton_loader.dart
    └── child_avatar.dart
```

---

## The Steve Jobs Checklist

1. **One job per screen.** Home shows summaries. Child detail shows everything about one child. Never mix.
2. **Progressive disclosure.** The dashboard shows a number. Tap to see the list. Tap a row to see the detail. Never show everything at once.
3. **Speed is a feature.** Skeleton loaders instead of spinners. Cache aggressively. Never make a parent wait more than 300ms for something they've seen before.
4. **Don't explain.** If a status badge needs a legend, the design failed. Colors and icons must be self-evident.
5. **Delight in the details.** Spring animations. Haptic feedback on the right moments. The child's name appears in the greeting. These details say "someone cared."
6. **Errors are rare, not normal.** Error states should feel calm and instructive — not alarming. Red should be used sparingly so when it appears (unpaid fee, absent child), it means something.
7. **The parent's job is done when they close the app.** Not when they find the information. The app should surface, not require searching.
