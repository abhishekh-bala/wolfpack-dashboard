# Team WolfPack Sales Dashboard - Complete Technical Documentation

> **Version**: 1.0  
> **Last Updated**: January 2026  
> **Purpose**: Complete rebuild documentation for developers

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Tech Stack (Explained)](#2-tech-stack-explained)
3. [System Architecture](#3-system-architecture)
4. [Frontend Breakdown](#4-frontend-breakdown)
5. [Backend / Supabase Breakdown](#5-backend--supabase-breakdown)
6. [Metrics & Business Logic](#6-metrics--business-logic)
7. [Environment & Configuration](#7-environment--configuration)
8. [Step-by-Step Rebuild Guide](#8-step-by-step-rebuild-guide)
9. [Common Pitfalls & Bugs](#9-common-pitfalls--bugs)
10. [How to Remove Lovable Completely](#10-how-to-remove-lovable-completely)
11. [Future Improvements](#11-future-improvements)

---

## 1. High-Level Overview

### Purpose of the Application

The **Team WolfPack Sales Dashboard** is an internal sales performance tracking tool designed for sales team leaders and managers. It provides real-time visibility into individual and team sales performance metrics by parsing exported MHTML reports from an external sales reporting system.

### Target Users

- **Sales Team Leaders**: Track daily/monthly performance of their team members
- **Sales Managers**: Monitor KPIs, set targets, and identify underperformers
- **Individual Sales Representatives**: View their own performance metrics

### Core Problems It Solves

1. **Manual Data Entry Elimination**: Automatically parses MHTML sales reports instead of manual data entry
2. **Target Tracking**: Compares actual performance against configurable daily/monthly targets
3. **Real-time KPI Calculation**: Automatically calculates conversion rates, revenue per chat (NRPC), and deficit metrics
4. **Data Persistence**: Published dashboards persist in a database for team-wide viewing
5. **Screenshot-Ready Views**: Fullscreen mode optimized for taking screenshots to share in team meetings

### Key Features

- ✅ **MHTML File Parsing**: Upload and parse sales reports exported from external systems
- ✅ **Local vs Published Data Model**: Work locally with unpublished changes, then publish to database
- ✅ **Configurable Targets**: Set daily and monthly targets for orders, revenue, and conversion rate per agent
- ✅ **Chat Count Tracking**: Input chat counts per agent to calculate conversion metrics
- ✅ **KPI Override System**: Manually override any agent's orders/revenue in real-time
- ✅ **Day/Month Toggle**: Switch between daily and monthly views
- ✅ **Performance Charts**: Bar, Pie, and Line charts for visualizing metrics
- ✅ **Fullscreen Mode**: High-contrast screenshot mode for presentations
- ✅ **Formula Overrides**: Customize calculation formulas (advanced users)
- ✅ **Simple Authentication**: Username/password login (hardcoded credentials)

### Non-Features (What It Intentionally Does NOT Do)

- ❌ **No Multi-Tenant Support**: Single team only, no organization/team management
- ❌ **No User Registration**: Credentials are hardcoded, not a sign-up system
- ❌ **No Historical Tracking**: Only shows current snapshot, no historical data storage
- ❌ **No Direct CRM Integration**: Requires manual MHTML export from source system
- ❌ **No Mobile App**: Web-only, not a native mobile application
- ❌ **No Email/Notification System**: No automated alerts or reports

---

## 2. Tech Stack (Explained)

### Frontend Framework: React 18 with TypeScript

**What it is**: React is a JavaScript library for building user interfaces. TypeScript adds static type checking.

**Why it was chosen**:
- Component-based architecture for reusable UI elements
- Strong ecosystem with extensive libraries
- TypeScript catches bugs at compile time
- Industry standard for web applications

**What problem it solves**: Enables building a complex, interactive dashboard with maintainable, type-safe code.

**What could replace it**: Vue.js, Svelte, Angular, or vanilla JavaScript (not recommended for this complexity).

### Build Tool: Vite

**What it is**: A fast build tool and development server for modern web projects.

**Why it was chosen**:
- Extremely fast hot module replacement (HMR)
- Native ES modules support
- Optimized production builds
- First-class TypeScript support

**What problem it solves**: Fast development experience and optimized production bundles.

**What could replace it**: Webpack, Parcel, Create React App (CRA), or esbuild.

### Styling: Tailwind CSS

**What it is**: A utility-first CSS framework that provides low-level utility classes.

**Why it was chosen**:
- Rapid UI development with utility classes
- Highly customizable design system
- No CSS file management
- Built-in responsive design

**What problem it solves**: Consistent styling without writing custom CSS files.

**What could replace it**: CSS Modules, Styled Components, Emotion, SCSS, or plain CSS.

### UI Components: shadcn/ui

**What it is**: A collection of re-usable React components built on Radix UI primitives.

**Why it was chosen**:
- Accessible by default (ARIA compliant)
- Fully customizable (you own the code)
- Built on Radix UI primitives
- Tailwind CSS integration

**What problem it solves**: Provides production-ready, accessible UI components.

**What could replace it**: Material UI, Ant Design, Chakra UI, or custom components.

### State Management: React useState + TanStack Query

**What it is**: Built-in React state hooks plus a server-state management library.

**Why it was chosen**:
- Simple local state with useState
- TanStack Query handles server state, caching, and refetching
- No Redux complexity needed for this app size

**What problem it solves**: Manages UI state and server data synchronization.

**What could replace it**: Redux, Zustand, Jotai, MobX, or React Context.

### Charts: Recharts

**What it is**: A composable charting library built on React and D3.

**Why it was chosen**:
- React-native components
- Responsive containers
- Wide variety of chart types
- Easy customization

**What problem it solves**: Visualizes sales performance data in multiple chart formats.

**What could replace it**: Chart.js, D3.js directly, Victory, Nivo, or ApexCharts.

### Backend: Supabase (PostgreSQL)

**What it is**: An open-source Firebase alternative with PostgreSQL database, authentication, and real-time subscriptions.

**Why it was chosen**:
- Instant API from database schema
- Row Level Security (RLS) for data protection
- JavaScript SDK for easy integration
- Hosted solution (no server management)

**What problem it solves**: Provides data persistence, authentication, and API layer.

**What could replace it**: Firebase, AWS Amplify, PlanetScale, Prisma + PostgreSQL, or any REST/GraphQL API.

### Routing: React Router v6

**What it is**: The standard routing library for React applications.

**Why it was chosen**:
- Declarative routing
- Nested routes support
- URL parameter handling
- Browser history management

**What problem it solves**: Enables navigation between pages (though this app has minimal routing).

**What could replace it**: TanStack Router, Wouter, or custom routing.

### Icons: Lucide React

**What it is**: A library of beautiful, consistent SVG icons as React components.

**Why it was chosen**:
- Tree-shakeable (only import what you use)
- Consistent style
- React component-based
- Large icon set

**What problem it solves**: Provides visual iconography throughout the UI.

**What could replace it**: Heroicons, Feather Icons, Font Awesome, or custom SVGs.

### Fonts: Google Fonts

**What it is**: Free, open-source fonts hosted by Google.

**Fonts Used**:
- **Space Grotesk**: Primary font for body text and headings
- **JetBrains Mono**: Monospace font for numbers and code

**Why they were chosen**: Modern, professional appearance suitable for a data dashboard.

---

## 3. System Architecture

### Text-Based Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                         React Application                            ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  ││
│  │  │  LoginPage   │  │  Dashboard   │  │       AdminPanel         │  ││
│  │  │              │  │              │  │                          │  ││
│  │  │ - Username   │  │ - StatCards  │  │ - Target Management      │  ││
│  │  │ - Password   │  │ - SalesTable │  │ - Chat Count Input       │  ││
│  │  │ - Validation │  │ - Charts     │  │ - Formula Overrides      │  ││
│  │  └──────┬───────┘  │ - FileUpload │  └──────────────────────────┘  ││
│  │         │          └──────┬───────┘                                 ││
│  │         │                 │                                          ││
│  │         v                 v                                          ││
│  │  ┌────────────────────────────────────────────────────────────────┐ ││
│  │  │                      State Management                          │ ││
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │ ││
│  │  │  │  localStorage   │  │  useState Hooks │  │  useGuideTargets│ │ ││
│  │  │  │ - Auth status   │  │ - Local data    │  │  - DB targets   │ │ ││
│  │  │  │ - Credentials   │  │ - UI state      │  │  - Formulas     │ │ ││
│  │  │  └─────────────────┘  └─────────────────┘  └────────┬───────┘ │ ││
│  │  └─────────────────────────────────────────────────────┼──────────┘ ││
│  └────────────────────────────────────────────────────────┼────────────┘│
│                                                           │              │
└───────────────────────────────────────────────────────────┼──────────────┘
                                                            │
                              HTTPS                         │
                                                            v
┌─────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                        PostgreSQL Database                           ││
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────┐ ││
│  │  │   guide_targets    │  │ formula_overrides  │  │published_sales_││
│  │  │                    │  │                    │  │     data       │ ││
│  │  │ - name             │  │ - id               │  │                │ ││
│  │  │ - target_orders    │  │ - name             │  │ - sales_data   │ ││
│  │  │ - target_revenue   │  │ - formula          │  │ - kpi_overrides│ ││
│  │  │ - target_conversion│  │ - enabled          │  │ - published_at │ ││
│  │  │ - chat_count       │  └────────────────────┘  └────────────────┘ ││
│  │  │ - monthly_* fields │                                              ││
│  │  └────────────────────┘                                              ││
│  │                                                                       ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │                    Row Level Security (RLS)                    │  ││
│  │  │                 (Currently allows public access)               │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### Frontend ↔ Backend Communication Flow

```
1. USER OPENS APP
   │
   v
2. App.tsx renders Index.tsx
   │
   v
3. Index.tsx checks localStorage for auth status
   │
   ├── Not authenticated → Show LoginPage
   │
   └── Authenticated → Show Dashboard
                        │
                        v
4. Dashboard mounts
   │
   ├── useGuideTargets hook fetches from Supabase:
   │   - guide_targets table
   │   - formula_overrides table
   │
   └── Dashboard fetches from Supabase:
       - published_sales_data table (latest record)
       │
       v
5. User uploads MHTML file
   │
   v
6. File content parsed locally (parseMhtml function)
   │
   v
7. Parsed data stored in LOCAL state (not DB yet)
   │
   v
8. User clicks "Publish to Database"
   │
   v
9. Dashboard sends to Supabase:
   - DELETE existing records from published_sales_data
   - INSERT new record with sales_data and kpi_overrides
   │
   v
10. Local state cleared, published state updated
```

### Authentication Flow (Step-by-Step)

```
1. User visits the app
   │
   v
2. Index.tsx runs on mount:
   - Calls initializeCredentials() to set default creds in localStorage
   - Calls isAuthenticated() to check if user is logged in
   │
   v
3. isAuthenticated() checks localStorage for "wolfpack_auth" key
   │
   ├── If "true" → User sees Dashboard
   │
   └── If not "true" → User sees LoginPage
                        │
                        v
4. User enters username and password
   │
   v
5. handleSubmit() validates:
   - Username must equal "abhishekh_dey"
   - Password must equal "D1asdfghjkl;'"
   │
   ├── Valid → saveCredentials(), setAuthenticated(true), call onLogin()
   │   │
   │   v
   │   Index.tsx re-renders → Shows Dashboard
   │
   └── Invalid → Show error toast

6. User clicks "Sign Out"
   │
   v
7. handleLogout() calls:
   - logout() → removes "wolfpack_auth" from localStorage
   - onLogout() → Index.tsx state updates
   │
   v
8. Index.tsx re-renders → Shows LoginPage
```

### Data Flow: Revenue Metric from DB → UI

```
1. SUPABASE DATABASE
   │
   │  published_sales_data table contains:
   │  {
   │    "sales_data": {
   │      "salesData": [
   │        { "name": "Doe, John", "newRevenue": 1234.56, ... }
   │      ],
   │      "summary": { "newSales": 5678.90, ... }
   │    }
   │  }
   │
   v
2. DASHBOARD COMPONENT (useEffect on mount)
   │
   │  const { data } = await supabase
   │    .from('published_sales_data')
   │    .select('*')
   │    .order('published_at', { ascending: false })
   │    .limit(1)
   │    .single();
   │
   v
3. STATE VARIABLES
   │
   │  setPublishedData(data.sales_data)
   │  // publishedData now contains ParsedMhtmlData object
   │
   v
4. COMPUTED VALUES
   │
   │  const parsedData = hasLocalChanges ? localParsedData : publishedData;
   │  const effectiveSalesData = getEffectiveSalesData();
   │  // Applies any KPI overrides to sales data
   │
   v
5. SUMMARY CALCULATION
   │
   │  const effectiveSummary = effectiveSalesData.reduce(
   │    (acc, agent) => ({
   │      newOrders: acc.newOrders + agent.orders,
   │      newSales: acc.newSales + agent.newRevenue,
   │    }),
   │    { newOrders: 0, newSales: 0 }
   │  );
   │
   v
6. STATCARD COMPONENT
   │
   │  <StatCard
   │    title="New Revenue"
   │    value={formatCurrency(summaryToUse?.newSales || 0)}
   │    ...
   │  />
   │
   v
7. UI RENDER
   │
   │  formatCurrency(5678.90) → "$5,678.90"
   │
   v
8. USER SEES: StatCard with "New Revenue" = "$5,678.90"
```

---

## 4. Frontend Breakdown

### File Structure Overview

```
src/
├── assets/
│   └── wolfpack-logo.png          # Team logo image
├── components/
│   ├── ui/                        # shadcn/ui components (buttons, inputs, etc.)
│   ├── AdminPanel.tsx             # Configuration dialog
│   ├── Dashboard.tsx              # Main dashboard component
│   ├── FileUpload.tsx             # MHTML file upload component
│   ├── LoginPage.tsx              # Authentication page
│   ├── NavLink.tsx                # Navigation link component (unused)
│   ├── PerformanceCharts.tsx      # Bar/Pie/Line charts
│   ├── SalesTable.tsx             # Sales data table with KPI override
│   └── StatCard.tsx               # Summary metric card
├── hooks/
│   ├── use-mobile.tsx             # Mobile detection hook
│   ├── use-toast.ts               # Toast notification hook
│   └── useGuideTargets.ts         # Custom hook for targets/formulas
├── integrations/
│   └── supabase/
│       ├── client.ts              # Supabase client initialization
│       └── types.ts               # Auto-generated TypeScript types
├── lib/
│   ├── mhtmlParser.ts             # MHTML file parsing logic
│   ├── storage.ts                 # localStorage utilities
│   └── utils.ts                   # General utilities (cn function)
├── pages/
│   ├── Index.tsx                  # Main entry page
│   └── NotFound.tsx               # 404 page
├── App.tsx                        # Root component with routing
├── App.css                        # Additional CSS (minimal)
├── index.css                      # Main CSS with Tailwind and theme
├── main.tsx                       # Application entry point
└── vite-env.d.ts                  # Vite type definitions
```

---

### Page: Index.tsx

**File**: `src/pages/Index.tsx`

**Purpose**: Entry point that handles authentication state and renders either LoginPage or Dashboard.

**Props**: None (it's a page component)

**State Variables**:
| Variable | Type | Purpose |
|----------|------|---------|
| `isLoggedIn` | `boolean` | Whether user is authenticated |
| `isLoading` | `boolean` | Loading state during auth check |

**Side Effects**:
- `useEffect` on mount: Initializes default credentials, checks auth status

**API Calls**: None (uses localStorage)

**Error Handling**: None needed (simple auth check)

**Loading States**: Shows spinner while checking auth

```typescript
// Key logic
useEffect(() => {
  initializeCredentials();
  setIsLoggedIn(isAuthenticated());
  setIsLoading(false);
}, []);

return isLoggedIn ? (
  <Dashboard onLogout={handleLogout} />
) : (
  <LoginPage onLogin={handleLogin} />
);
```

---

### Component: LoginPage.tsx

**File**: `src/components/LoginPage.tsx`

**Purpose**: Renders login form and validates credentials.

**Props**:
| Prop | Type | Purpose |
|------|------|---------|
| `onLogin` | `() => void` | Callback when login succeeds |

**State Variables**:
| Variable | Type | Purpose |
|----------|------|---------|
| `username` | `string` | Input value for username |
| `password` | `string` | Input value for password |
| `showPassword` | `boolean` | Toggle password visibility |
| `isLoading` | `boolean` | Loading state during login |

**Side Effects**: None

**API Calls**: None (validates against hardcoded values)

**Error Handling**:
- Shows toast notification on invalid credentials

**Loading States**:
- Button shows "Authenticating..." while processing

**Hardcoded Credentials**:
```typescript
const VALID_USERNAME = 'abhishekh_dey';
const VALID_PASSWORD = "D1asdfghjkl;'";
```

---

### Component: Dashboard.tsx

**File**: `src/components/Dashboard.tsx`

**Purpose**: Main dashboard that displays all sales data, metrics, and controls.

**Props**:
| Prop | Type | Purpose |
|------|------|---------|
| `onLogout` | `() => void` | Callback when user logs out |

**State Variables**:
| Variable | Type | Purpose |
|----------|------|---------|
| `publishedData` | `ParsedMhtmlData \| null` | Data from database |
| `publishedOverrides` | `Record<string, Partial<SalesData>>` | Saved KPI overrides |
| `localParsedData` | `ParsedMhtmlData \| null` | Locally parsed file data |
| `localKpiOverrides` | `Record<string, Partial<SalesData>>` | Unsaved KPI overrides |
| `hasLocalChanges` | `boolean` | Whether unsaved changes exist |
| `isProcessing` | `boolean` | File parsing in progress |
| `isPublishing` | `boolean` | Database save in progress |
| `isLoadingPublished` | `boolean` | Loading published data |
| `isFullscreen` | `boolean` | Fullscreen/screenshot mode |
| `viewMode` | `'day' \| 'month'` | Daily or monthly view |
| `editingAgent` | `string \| null` | Agent currently being edited |

**Side Effects**:
1. Load published data from Supabase on mount
2. Sync fullscreen state with browser fullscreen API
3. Prevent scroll in fullscreen mode

**API Calls**:
1. `supabase.from('published_sales_data').select(...)` - Load published data
2. `supabase.from('published_sales_data').delete(...)` - Clear old data
3. `supabase.from('published_sales_data').insert(...)` - Save new data

**Error Handling**:
- Console logs errors
- Toast notifications for success/failure

**Loading States**:
- Full-screen spinner while loading

**Key Functions**:
| Function | Purpose |
|----------|---------|
| `handleFileContent` | Parses uploaded MHTML content |
| `handlePublishData` | Saves data to Supabase |
| `handleClearData` | Discards local changes |
| `handleKpiOverride` | Updates an agent's KPI value |
| `clearAgentOverride` | Removes an agent's override |
| `getEffectiveSalesData` | Applies overrides to sales data |
| `toggleFullscreen` | Enters/exits fullscreen mode |

---

### Component: SalesTable.tsx

**File**: `src/components/SalesTable.tsx`

**Purpose**: Displays agent performance data in a table with inline editing.

**Props**:
| Prop | Type | Purpose |
|------|------|---------|
| `salesData` | `SalesData[]` | Agent sales data |
| `targets` | `GuideTarget[]` | Target configurations |
| `compact` | `boolean` | Compact display mode |
| `isFullscreen` | `boolean` | Fullscreen styling |
| `viewMode` | `'day' \| 'month'` | Which targets to use |
| `kpiOverrides` | `Record<string, Partial<SalesData>>` | Current overrides |
| `onKpiOverride` | `(name, field, value) => void` | Override callback |
| `onClearOverride` | `(name) => void` | Clear override callback |
| `editingAgent` | `string \| null` | Currently editing agent |
| `onEditAgent` | `(name \| null) => void` | Set editing agent |

**State Variables**:
| Variable | Type | Purpose |
|----------|------|---------|
| `editValues` | `Partial<SalesData>` | Values while editing |

**Side Effects**: None

**API Calls**: None (receives data via props)

**Key Features**:
- Merges sales data with targets
- Calculates deficits, conversion rates, NRPC
- Inline editing for orders and revenue
- Visual indicators for over/under performance
- Team Leader badge for specific name

**Computed Data Interface**:
```typescript
interface ComputedData extends SalesData {
  targetRevenue: number;
  revenueDeficit: number;
  targetOrders: number;
  orderDeficit: number;
  chatCount: number;
  currentConversion: number;
  targetConversion: number;
  ordersToTarget: number;
  isFromFile: boolean;
  hasChatData: boolean;
  nrpc: number;
}
```

---

### Component: StatCard.tsx

**File**: `src/components/StatCard.tsx`

**Purpose**: Displays a single KPI metric in a styled card.

**Props**:
| Prop | Type | Purpose |
|------|------|---------|
| `title` | `string` | Metric name |
| `value` | `string` | Formatted metric value |
| `subtitle` | `string` | Optional description |
| `icon` | `LucideIcon` | Icon component |
| `variant` | `'default' \| 'success' \| 'warning' \| 'danger'` | Color scheme |
| `compact` | `boolean` | Smaller size |
| `isFullscreen` | `boolean` | Larger size for screenshots |

**State Variables**: None

**Side Effects**: None

**API Calls**: None

---

### Component: FileUpload.tsx

**File**: `src/components/FileUpload.tsx`

**Purpose**: Drag-and-drop file upload for MHTML files.

**Props**:
| Prop | Type | Purpose |
|------|------|---------|
| `onFileContent` | `(content: string) => void` | Callback with file content |
| `isProcessing` | `boolean` | Disable during processing |

**State Variables**:
| Variable | Type | Purpose |
|----------|------|---------|
| `isDragging` | `boolean` | Visual feedback for drag |
| `fileName` | `string \| null` | Uploaded file name |

**Side Effects**: None

**API Calls**: None

**Error Handling**:
- Validates file extension (.mhtml or .mht)
- Toast notification on file read error

---

### Component: AdminPanel.tsx

**File**: `src/components/AdminPanel.tsx`

**Purpose**: Configuration dialog for targets, chat counts, and formulas.

**Props**:
| Prop | Type | Purpose |
|------|------|---------|
| `targets` | `GuideTarget[]` | Current targets |
| `formulas` | `FormulaOverride[]` | Current formulas |
| `onSaveTargets` | `(targets) => Promise<void>` | Save targets callback |
| `onSaveFormulas` | `(formulas) => Promise<void>` | Save formulas callback |
| `onResetFormulas` | `() => Promise<void>` | Reset formulas callback |
| `viewMode` | `'day' \| 'month'` | Current view mode |
| `onViewModeChange` | `(mode) => void` | Change view mode |

**State Variables**:
| Variable | Type | Purpose |
|----------|------|---------|
| `localTargets` | `GuideTarget[]` | Editable copy of targets |
| `localFormulas` | `FormulaOverride[]` | Editable copy of formulas |
| `newGuideName` | `string` | Input for new guide name |
| `isSaving` | `boolean` | Save in progress |

**Side Effects**:
- Syncs local state when props change

**Tabs**:
1. **Daily/Monthly Targets**: Add/remove guides, set target orders/revenue/conversion
2. **Daily/Monthly Chats**: Quick input for chat counts
3. **Formula Overrides**: Customize calculation formulas

---

### Component: PerformanceCharts.tsx

**File**: `src/components/PerformanceCharts.tsx`

**Purpose**: Visualizes sales data in Bar, Pie, and Line charts.

**Props**:
| Prop | Type | Purpose |
|------|------|---------|
| `salesData` | `SalesData[]` | Agent sales data |
| `targets` | `GuideTarget[]` | Target configurations |
| `viewMode` | `'day' \| 'month'` | Which targets to use |

**State Variables**:
| Variable | Type | Purpose |
|----------|------|---------|
| `metric` | `MetricKey` | Selected metric to display |

**Available Metrics**:
- `newRevenue`: New revenue per agent
- `newOrders`: New orders per agent
- `nrpc`: New Revenue Per Chat
- `conversion`: Conversion percentage

**Features**:
- Metric selector buttons
- Three chart types via tabs
- Only shows agents with chat data

---

### Hook: useGuideTargets.ts

**File**: `src/hooks/useGuideTargets.ts`

**Purpose**: Manages guide targets and formula overrides from Supabase.

**Returns**:
| Property | Type | Purpose |
|----------|------|---------|
| `targets` | `GuideTarget[]` | Current targets |
| `formulas` | `FormulaOverride[]` | Current formulas |
| `isLoading` | `boolean` | Loading state |
| `saveTargets` | `(targets) => Promise<void>` | Save targets |
| `saveFormulas` | `(formulas) => Promise<void>` | Save formulas |
| `resetFormulas` | `() => Promise<void>` | Reset to defaults |
| `refetchTargets` | `() => Promise<void>` | Refetch targets |
| `refetchFormulas` | `() => Promise<void>` | Refetch formulas |

**Interfaces**:
```typescript
interface GuideTarget {
  id?: string;
  name: string;
  // Daily
  targetOrders: number;
  targetRevenue: number;
  targetConversion: number;
  chatCount: number;
  // Monthly
  monthlyTargetOrders: number;
  monthlyTargetRevenue: number;
  monthlyTargetConversion: number;
  monthlyChatCount: number;
}

interface FormulaOverride {
  id: string;
  name: string;
  formula: string;
  enabled: boolean;
}
```

---

### Library: mhtmlParser.ts

**File**: `src/lib/mhtmlParser.ts`

**Purpose**: Parses MHTML files exported from sales reporting systems.

**Exports**:
| Export | Type | Purpose |
|--------|------|---------|
| `parseMhtml` | `function` | Main parsing function |
| `formatCurrency` | `function` | Format number as USD |
| `formatNumber` | `function` | Format number with decimals |
| `formatPercent` | `function` | Format number as percentage |
| `SalesData` | `interface` | Individual agent data |
| `ParsedMhtmlData` | `interface` | Complete parsed result |

**Parsing Steps**:
1. Extract base64-encoded content from MHTML
2. Decode base64 to HTML string
3. Parse summary data (regex patterns)
4. Extract employee rows (regex patterns)
5. Fallback parsing if primary pattern fails

**Data Interfaces**:
```typescript
interface SalesData {
  name: string;
  orders: number;
  avgOrderSize: number;
  total: number;
  newRevenue: number;
}

interface ParsedMhtmlData {
  salesData: SalesData[];
  summary: {
    totalSales: number;
    totalOrders: number;
    avgOrderSize: number;
    salesPerRep: number;
    newSales: number;
    newOrders: number;
  };
  dateRange: string;
  supervisor: string;
}
```

---

### Library: storage.ts

**File**: `src/lib/storage.ts`

**Purpose**: localStorage utilities for auth and legacy storage.

**Exports**:
| Export | Purpose |
|--------|---------|
| `saveCredentials` | Save username/password |
| `getCredentials` | Retrieve credentials |
| `isAuthenticated` | Check auth status |
| `setAuthenticated` | Set auth status |
| `logout` | Clear auth status |
| `getTargets` | Legacy: Get targets from localStorage |
| `saveTargets` | Legacy: Save targets to localStorage |
| `getFormulas` | Legacy: Get formulas from localStorage |
| `saveFormulas` | Legacy: Save formulas to localStorage |
| `getDefaultFormulas` | Get default formula definitions |

---

## 5. Backend / Supabase Breakdown

### Table: guide_targets

**Purpose**: Stores daily and monthly performance targets for each sales guide/agent.

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `name` | `text` | No | - | Agent name (unique identifier) |
| `target_orders` | `integer` | No | `0` | Daily target orders |
| `target_revenue` | `numeric` | No | `0` | Daily target revenue |
| `target_conversion` | `numeric` | No | `0` | Daily target conversion % |
| `chat_count` | `integer` | No | `0` | Daily chat count |
| `monthly_target_orders` | `integer` | No | `0` | Monthly target orders |
| `monthly_target_revenue` | `numeric` | No | `0` | Monthly target revenue |
| `monthly_target_conversion` | `numeric` | No | `0` | Monthly target conversion % |
| `monthly_chat_count` | `integer` | No | `0` | Monthly chat count |
| `created_at` | `timestamptz` | No | `now()` | Row creation time |
| `updated_at` | `timestamptz` | No | `now()` | Last update time |

**Relationships**: None

**Indexes**: Primary key on `id`

**Example Row**:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Doe, John",
  "target_orders": 5,
  "target_revenue": 500.00,
  "target_conversion": 15.0,
  "chat_count": 35,
  "monthly_target_orders": 100,
  "monthly_target_revenue": 10000.00,
  "monthly_target_conversion": 12.5,
  "monthly_chat_count": 700,
  "created_at": "2026-01-10T10:00:00Z",
  "updated_at": "2026-01-14T15:30:00Z"
}
```

**Why This Table Exists**: Enables setting performance expectations per agent that persist across sessions and are shared among all dashboard users.

---

### Table: formula_overrides

**Purpose**: Stores custom calculation formulas (advanced feature).

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | `text` | No | - | Formula identifier (e.g., "revenue_deficit") |
| `name` | `text` | No | - | Human-readable name |
| `formula` | `text` | No | - | JavaScript expression |
| `enabled` | `boolean` | No | `true` | Whether formula is active |
| `created_at` | `timestamptz` | No | `now()` | Row creation time |
| `updated_at` | `timestamptz` | No | `now()` | Last update time |

**Example Row**:
```json
{
  "id": "revenue_deficit",
  "name": "Revenue Deficit",
  "formula": "targetRevenue - newRevenue",
  "enabled": true,
  "created_at": "2026-01-10T10:00:00Z",
  "updated_at": "2026-01-10T10:00:00Z"
}
```

**Why This Table Exists**: Allows power users to customize how metrics are calculated without code changes.

---

### Table: published_sales_data

**Purpose**: Stores the currently published dashboard data and KPI overrides.

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `sales_data` | `jsonb` | No | - | Complete ParsedMhtmlData object |
| `kpi_overrides` | `jsonb` | Yes | `'{}'::jsonb` | Agent KPI override values |
| `published_at` | `timestamptz` | No | `now()` | When data was published |
| `updated_at` | `timestamptz` | No | `now()` | Last update time |

**Example Row**:
```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "sales_data": {
    "salesData": [
      {"name": "Doe, John", "orders": 3, "avgOrderSize": 150.00, "total": 450.00, "newRevenue": 350.00},
      {"name": "Smith, Jane", "orders": 5, "avgOrderSize": 200.00, "total": 1000.00, "newRevenue": 800.00}
    ],
    "summary": {
      "totalSales": 1450.00,
      "totalOrders": 8,
      "avgOrderSize": 181.25,
      "salesPerRep": 725.00,
      "newSales": 1150.00,
      "newOrders": 8
    },
    "dateRange": "01/14/2026 - 01/14/2026",
    "supervisor": "Team WolfPack"
  },
  "kpi_overrides": {
    "Doe, John": {"orders": 4, "newRevenue": 400.00}
  },
  "published_at": "2026-01-14T16:00:00Z",
  "updated_at": "2026-01-14T16:00:00Z"
}
```

**Why This Table Exists**: Enables persistent storage of the current dashboard state so that team members can view the same data across different browser sessions.

---

### Row Level Security (RLS) Policies

All three tables have RLS **enabled** with **public access** policies:

```sql
-- Example for guide_targets (same pattern for all tables)
CREATE POLICY "Allow public read on guide_targets" 
ON public.guide_targets FOR SELECT USING (true);

CREATE POLICY "Allow public insert on guide_targets" 
ON public.guide_targets FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on guide_targets" 
ON public.guide_targets FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on guide_targets" 
ON public.guide_targets FOR DELETE USING (true);
```

**⚠️ Security Warning**: The current RLS policies allow unrestricted public access. This is acceptable for an internal tool but would need to be locked down for production with proper authentication.

---

### Database Trigger

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
```

**Purpose**: Automatically updates the `updated_at` column on row modifications.

---

## 6. Metrics & Business Logic

### Key Metrics Explained

#### New Revenue
**Formula**: Sum of `newRevenue` from all agents in sales data  
**Source**: Parsed from MHTML file  
**Unit**: USD currency  
**Display Format**: `$1,234.56`

#### New Orders
**Formula**: Sum of `orders` from all agents in sales data  
**Source**: Parsed from MHTML file  
**Unit**: Integer count  
**Display Format**: `123`

#### New AOS (Average Order Size)
**Formula**: `newRevenue / newOrders`  
**Edge Case**: If `newOrders === 0`, displays "-"  
**Unit**: USD currency  
**Display Format**: `$123.45`

#### NRPC (New Revenue Per Chat)
**Formula**: `totalNewRevenue / totalChats`  
**Source**: Revenue from file, chats from targets  
**Edge Case**: If `totalChats === 0`, displays "-"  
**Unit**: USD currency  
**Display Format**: `$12.34`

#### NewConversion%
**Formula**: `(newOrders / totalChats) * 100`  
**Edge Case**: If `totalChats === 0`, displays "-"  
**Unit**: Percentage  
**Display Format**: `15.5%`

#### Revenue Deficit
**Formula**: `targetRevenue - actualRevenue`  
**Interpretation**: 
- Positive = Under target (bad)
- Negative = Over target (good)
- Zero = Exactly at target
**Display**: Red with down arrow (deficit) or green with up arrow (surplus)

#### Order Deficit
**Formula**: `targetOrders - actualOrders`  
**Interpretation**: Same as revenue deficit

#### Orders to Target (Need)
**Formula**: `Math.ceil((targetConversion / 100) * chatCount - orders)`  
**Purpose**: How many more orders needed to hit conversion target  
**Edge Case**: Capped at minimum of 0

### Per-Agent Calculations

For each agent in SalesTable:

```typescript
// Get values based on view mode (day/month)
const chatCount = viewMode === 'day' ? target.chatCount : target.monthlyChatCount;
const targetRevenue = viewMode === 'day' ? target.targetRevenue : target.monthlyTargetRevenue;
const targetOrders = viewMode === 'day' ? target.targetOrders : target.monthlyTargetOrders;
const targetConversion = viewMode === 'day' ? target.targetConversion : target.monthlyTargetConversion;

// Calculate metrics
const revenueDeficit = targetRevenue - newRevenue;
const orderDeficit = targetOrders - orders;
const currentConversion = chatCount > 0 ? (orders / chatCount) * 100 : 0;
const ordersToTarget = chatCount > 0 
  ? Math.max(0, Math.ceil((targetConversion / 100) * chatCount - orders))
  : 0;
const nrpc = chatCount > 0 ? newRevenue / chatCount : 0;
```

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Zero chat count | Conversion and NRPC show "-", "No Data" badge |
| Zero orders | AOS shows "-" |
| No sales data for agent | Show target row with zero values |
| Agent in file but not in targets | Show in table with no target columns |
| No MHTML uploaded | Show empty state or targets only |
| No targets configured | Show file data without target comparison |
| Null/undefined values | Default to 0 |

### Time Range Handling

The app supports two view modes:
1. **Day**: Uses `target_orders`, `target_revenue`, `target_conversion`, `chat_count`
2. **Month**: Uses `monthly_target_orders`, `monthly_target_revenue`, `monthly_target_conversion`, `monthly_chat_count`

Toggle between modes affects:
- All target values in calculations
- Labels in AdminPanel
- Summary header text
- Chart data source

---

## 7. Environment & Configuration

### Required Environment Variables

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abcdefghij.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | `eyJhbGciOiJIUzI1NiI...` |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | `abcdefghij` |

### Where Variables Are Used

```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Example .env File

```env
VITE_SUPABASE_PROJECT_ID="abcdefghij"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
VITE_SUPABASE_URL="https://abcdefghij.supabase.co"
```

### How to Rotate Keys Safely

1. **Generate new keys** in Supabase Dashboard → Settings → API
2. **Update `.env`** with new values
3. **Test locally** to ensure connections work
4. **Deploy** with new environment variables
5. **Old keys** will stop working immediately (Supabase doesn't support key rotation with grace period)

**Warning**: The anon key is public and visible in browser. Only the service role key needs protection (not used in this client-side app).

---

## 8. Step-by-Step Rebuild Guide

### Prerequisites

- Node.js 18+ installed
- npm or bun package manager
- A Supabase account (free tier works)
- Code editor (VS Code recommended)

---

### Step 1: Create Project

```bash
# Create new Vite project with React and TypeScript
npm create vite@latest wolfpack-dashboard -- --template react-ts

# Navigate into project
cd wolfpack-dashboard

# Open in editor
code .
```

**Expected output**: New folder with Vite React TypeScript template

---

### Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js@^2.90.1 \
  @tanstack/react-query@^5.83.0 \
  react-router-dom@^6.30.1 \
  recharts@^2.15.4 \
  lucide-react@^0.462.0 \
  class-variance-authority@^0.7.1 \
  clsx@^2.1.1 \
  tailwind-merge@^2.6.0 \
  sonner@^1.7.4 \
  date-fns@^3.6.0

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate

# Initialize Tailwind
npx tailwindcss init -p
```

---

### Step 3: Setup Folder Structure

Create the following folder structure:

```bash
mkdir -p src/components/ui
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/pages
mkdir -p src/integrations/supabase
mkdir -p src/assets
```

---

### Step 4: Configure Tailwind

**tailwind.config.ts**:
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

---

### Step 5: Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and anon key from Settings → API
3. Create `.env` file:

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_ANON_KEY"
VITE_SUPABASE_PROJECT_ID="YOUR_PROJECT_ID"
```

4. Create Supabase client:

**src/integrations/supabase/client.ts**:
```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

### Step 6: Create Database Tables

In Supabase Dashboard → SQL Editor, run:

```sql
-- Guide Targets Table
CREATE TABLE public.guide_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  target_orders integer NOT NULL DEFAULT 0,
  target_revenue numeric NOT NULL DEFAULT 0,
  target_conversion numeric NOT NULL DEFAULT 0,
  chat_count integer NOT NULL DEFAULT 0,
  monthly_target_orders integer NOT NULL DEFAULT 0,
  monthly_target_revenue numeric NOT NULL DEFAULT 0,
  monthly_target_conversion numeric NOT NULL DEFAULT 0,
  monthly_chat_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Formula Overrides Table
CREATE TABLE public.formula_overrides (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  formula text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Published Sales Data Table
CREATE TABLE public.published_sales_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_data jsonb NOT NULL,
  kpi_overrides jsonb DEFAULT '{}'::jsonb,
  published_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guide_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_sales_data ENABLE ROW LEVEL SECURITY;

-- Create public access policies (adjust for production!)
CREATE POLICY "Allow public access" ON public.guide_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.formula_overrides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.published_sales_data FOR ALL USING (true) WITH CHECK (true);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply triggers
CREATE TRIGGER update_guide_targets_updated_at
  BEFORE UPDATE ON public.guide_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formula_overrides_updated_at
  BEFORE UPDATE ON public.formula_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_published_sales_data_updated_at
  BEFORE UPDATE ON public.published_sales_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

### Step 7: Implement Auth (storage.ts)

**src/lib/storage.ts**:
```typescript
export interface Credentials {
  username: string;
  password: string;
}

const CREDENTIALS_KEY = 'wolfpack_credentials';
const AUTH_KEY = 'wolfpack_auth';

export function saveCredentials(credentials: Credentials): void {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export function getCredentials(): Credentials | null {
  const stored = localStorage.getItem(CREDENTIALS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function setAuthenticated(value: boolean): void {
  localStorage.setItem(AUTH_KEY, value ? 'true' : 'false');
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}
```

---

### Step 8: Build Dashboard UI

Copy the component files from the source code:
1. `src/components/LoginPage.tsx`
2. `src/components/Dashboard.tsx`
3. `src/components/SalesTable.tsx`
4. `src/components/StatCard.tsx`
5. `src/components/FileUpload.tsx`
6. `src/components/AdminPanel.tsx`
7. `src/components/PerformanceCharts.tsx`

---

### Step 9: Connect APIs (useGuideTargets hook)

Copy `src/hooks/useGuideTargets.ts` from source.

---

### Step 10: Handle Errors & Loading

Each component includes:
- Loading spinners during async operations
- Toast notifications for success/error feedback
- Try/catch blocks around Supabase calls
- Console.error logging

---

### Step 11: Deploy

**Option A: Vercel**
```bash
npm install -g vercel
vercel
# Follow prompts, add env vars in Vercel dashboard
```

**Option B: Netlify**
```bash
npm run build
# Upload dist folder to Netlify
# Add env vars in Netlify dashboard
```

**Option C: Self-host**
```bash
npm run build
# Serve dist folder with any static file server (nginx, apache, etc.)
```

---

## 9. Common Pitfalls & Bugs

### Issue: "MHTML parsing returns empty data"

**Why it breaks**: The MHTML structure varies between different export systems. The regex patterns may not match.

**How to debug**:
1. Open MHTML file in text editor
2. Search for base64 content section
3. Decode base64 and inspect HTML structure
4. Adjust regex patterns in `mhtmlParser.ts`

### Issue: "Supabase queries return empty arrays"

**Why it breaks**: 
- RLS policies might be blocking access
- Table might be empty
- Wrong table name or column names

**How to debug**:
1. Check Supabase Dashboard → Table Editor
2. Verify RLS policies allow SELECT
3. Check console for error messages
4. Test query directly in Supabase SQL Editor

### Issue: "KPI overrides not persisting"

**Why it breaks**: User might not have clicked "Publish to Database"

**How to debug**:
1. Check `hasLocalChanges` state
2. Verify "Unpublished Changes" badge appears
3. Check network tab for POST request on publish

### Issue: "Charts show no data"

**Why it breaks**: Charts filter out agents with zero chat count

**How to debug**:
1. Add chat counts in Admin Panel
2. Check that targets exist for agents
3. Verify `viewMode` matches where chat counts were entered

### Issue: "Login doesn't work"

**Why it breaks**: Incorrect username or password

**How to debug**:
1. Check hardcoded values in LoginPage.tsx
2. Verify no extra whitespace in inputs
3. Check case sensitivity

### Issue: "Fullscreen mode doesn't work"

**Why it breaks**: Browser fullscreen API may be blocked

**How to debug**:
1. Toast will show "using fullscreen dashboard styling instead"
2. Some browsers block fullscreen in iframes
3. Styling still applies even without browser fullscreen

---

## 10. How to Remove Lovable Completely

### Lovable-Specific Parts

1. **File**: `src/integrations/supabase/types.ts`
   - **What it is**: Auto-generated TypeScript types from Supabase schema
   - **How to replace**: Generate manually using Supabase CLI: `supabase gen types typescript`

2. **File**: `supabase/config.toml`
   - **What it is**: Supabase local development config
   - **How to replace**: Create manually or use `supabase init`

3. **Environment variables**
   - **What they are**: Auto-configured by Lovable Cloud
   - **How to replace**: Manually create `.env` file with your Supabase credentials

4. **Deployment**
   - **What it is**: Lovable hosts the app automatically
   - **How to replace**: Deploy to Vercel, Netlify, or self-host

### Self-Hosting Steps

1. **Clone/download the code**
2. **Create your own Supabase project**
3. **Run the SQL from Step 6 to create tables**
4. **Create `.env` with your credentials**
5. **Build and deploy**:
   ```bash
   npm install
   npm run build
   # Upload dist/ to your hosting
   ```

### Verification Checklist

- [ ] App loads without Lovable domain
- [ ] Supabase queries work with your project
- [ ] Login works
- [ ] File upload works
- [ ] Data persists after refresh
- [ ] No references to `lovable.dev` or `lovable.app` in code

---

## 11. Future Improvements

### Scalability

1. **Multi-team support**: Add organization/team tables, modify RLS for isolation
2. **User management**: Replace hardcoded auth with Supabase Auth
3. **Historical data**: Store snapshots over time for trend analysis
4. **API rate limiting**: Add rate limits if traffic increases

### Security

1. **Proper authentication**: Implement Supabase Auth with email/password or SSO
2. **Role-based access**: Create admin vs viewer roles
3. **Audit logging**: Track who made changes and when
4. **Input validation**: Sanitize file uploads more thoroughly
5. **Tighten RLS policies**: Remove public access, require authentication

### Performance

1. **Pagination**: Add pagination to SalesTable for large datasets
2. **Caching**: Implement React Query caching strategies
3. **Lazy loading**: Code-split large components
4. **Image optimization**: Compress and cache logo

### Feature Roadmap

1. **Email reports**: Send daily/weekly summaries
2. **Goal tracking**: Track progress over time
3. **Team leaderboards**: Rank agents by performance
4. **Custom date ranges**: Filter by specific dates
5. **Export functionality**: PDF/Excel export
6. **Mobile app**: React Native version
7. **Real-time updates**: Supabase Realtime for live collaboration
8. **Integration with CRM**: Direct API connection instead of MHTML

---

## Appendix: Quick Reference

### File Locations

| Feature | File |
|---------|------|
| Entry point | `src/main.tsx` |
| Routing | `src/App.tsx` |
| Auth check | `src/pages/Index.tsx` |
| Login | `src/components/LoginPage.tsx` |
| Main dashboard | `src/components/Dashboard.tsx` |
| Data table | `src/components/SalesTable.tsx` |
| Charts | `src/components/PerformanceCharts.tsx` |
| Settings | `src/components/AdminPanel.tsx` |
| File parser | `src/lib/mhtmlParser.ts` |
| DB hook | `src/hooks/useGuideTargets.ts` |
| Styles | `src/index.css` |
| Tailwind config | `tailwind.config.ts` |

### Key Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Useful Links

- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Recharts Documentation](https://recharts.org)
- [Lucide Icons](https://lucide.dev)

---

*End of Documentation*
