# AERO-INTEL — SFO Air Traffic Operations & Fleet Intelligence

An interactive business-intelligence dashboard for San Francisco International Airport landing
operations, covering **July 2005 – September 2018**. The app loads the raw SFO landings dataset in
the browser, aggregates it on the fly, and presents it across seven analytical views — traffic
trends, the Boeing/Airbus duopoly, carrier fleets, geographic routes, aircraft gauge evolution, a
raw data explorer, and executive insights.

Everything runs client-side. There is no backend, no API key, and no build-time data pipeline
required — the CSV is fetched from `public/` and parsed in the browser on load.

## Credit

The dataset created by Mohamadreza Momeni and sourced from [Kaggle](https://www.kaggle.com/datasets/imtkaggleteam/air-traffic-landings)

---

## Dataset

| | |
|---|---|
| Source file | [Kaggle](https://www.kaggle.com/datasets/imtkaggleteam/air-traffic-landings) |
| Records | 22,048 rows |
| Period | 200507 – 201809 (monthly `Activity Period` keys) |
| Total landings | ~2.50M |
| Total landed weight | ~418.67B lbs |
| Airlines / models | 107 operating airlines, 89 aircraft models |

Each row is one month × airline × aircraft × route-scope combination, with 14 columns:

```
Activity Period, Operating Airline, Operating Airline IATA Code, Published Airline,
Published Airline IATA Code, GEO Summary, GEO Region, Landing Aircraft Type,
Aircraft Body Type, Aircraft Manufacturer, Aircraft Model, Aircraft Version,
Landing Count, Total Landed Weight
```

`Total Landed Weight` is in **pounds**; the UI can convert to metric tonnes at display time.

---

## Getting started

Requires Node.js 20.19+.

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173 (opens automatically)
```

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check with `tsc`, then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run type-check` | Run `tsc --noEmit` without building |

---

## Tech stack

- **React 19** + **TypeScript 5.7** (strict mode)
- **Vite 6** for dev server and bundling
- **Recharts 2.15** for all visualizations
- **Tailwind CSS 3.4** with a custom `aviation-*` / `boeing-*` dark palette
- **lucide-react** for icons; Inter + JetBrains Mono via Google Fonts

---

## Project structure

```
src/
├── App.tsx                     # State root: data load, filters, memoized aggregations
├── main.tsx                    # React entry point
├── index.css                   # Tailwind layers + .glass-panel utility
├── types/index.ts              # FlightRecord, FilterState, and all aggregate shapes
├── utils/
│   ├── dataProcessor.ts        # CSV parsing, filtering, and every aggregation function
│   ├── formatters.ts           # Number/weight/percent formatting, color mapping
│   └── chartChildren.tsx       # flattenSeries() — Recharts/React 19 fragment shim (see below)
├── components/
│   ├── Header.tsx              # Record counts, unit toggle, reset, CSV import
│   ├── FilterBar.tsx           # Search, year range, OEM chips, filter drawer
│   ├── KPICards.tsx            # Six-metric HUD summary bar
│   ├── NavigationTabs.tsx      # Tab bar; owns the TabId union type
│   ├── CustomTooltip.tsx       # Shared unit-aware Recharts tooltip
│   └── views/                  # One component per tab (see below)
└── data/prepareData.cjs        # Optional offline pre-aggregation utility
```

### Data flow

```
public/raw_data.csv
   └─ fetch on mount (App.tsx)
       └─ parseCSVData()          → FlightRecord[]        (raw records)
           └─ filterRecords()     → FlightRecord[]        (filtered by FilterState)
               └─ calculate*()    → aggregates            (memoized per filter change)
                   └─ views                               (props only, no data fetching)
```

All aggregation is recomputed with `useMemo` whenever filters change. The view components are
presentational — they receive aggregates as props and never fetch or parse anything themselves.

The aggregation functions in `dataProcessor.ts`:

| Function | Returns |
|---|---|
| `calculateSummaryMetrics` | KPI totals, OEM shares, domestic/international split |
| `calculateMonthlyAggregates` | Per-month series split by OEM, route scope, and body type |
| `calculateManufacturerStats` | Landings/weight/share per manufacturer, with top models |
| `calculateAirlineStats` | Per-carrier volumes, OEM ratios, top models, regions served |
| `calculateGeoRegionStats` | Per-region volumes, top carriers and models, avg gauge |
| `calculateModelStats` | Per-airframe volumes and average weight per landing |

---

## Views

| Tab | Component | Contents |
|---|---|---|
| **Mission Control** | `OverviewView` | Main operations timeline with metric (landings / weight / avg weight), breakdown (OEM / route scope / body type / total), granularity (month / quarter / year), and chart type (area / line / bar) toggles; top 10 airlines; OEM market-share pie; top airframes |
| **Boeing vs Airbus** | `BoeingVsAirbusView` | Head-to-head scoreboard, duopoly trajectory chart (share % or absolute volume), flagship airframe comparison, and carrier fleet loyalty (Boeing-exclusive / Airbus-exclusive / mixed fleets) |
| **Carrier Intelligence** | `AirlinesView` | Per-airline volumes, fleet composition, and route footprint |
| **Geographic Routes** | `GeoDynamicsView` | Interactive corridor globe (drag/zoom/click), per-region drill-down, domestic vs international distribution, average aircraft gauge by region |
| **Fleet & Gauge** | `FleetEvolutionView` | Body-type mix shift over time and the up-gauging (avg MTOW per flight) trend |
| **Data Explorer** | `DataExplorerView` | Sortable, paginated raw table with pivot-by (manufacturer / airline / region / year) and CSV export of the current filtered set |
| **Executive Insights** | `InsightsView` | Monthly seasonality cycle, historical aviation milestones, strategic takeaways |

### Global controls

- **Search** — matches airline, IATA code, manufacturer, model, or region
- **Timeline** — year-range selection (2005–2018)
- **Quick OEM chips** — Boeing / Airbus / Bombardier / Embraer
- **Filter drawer** — aircraft OEM, body type, route scope, operation type, geo region
- **Unit toggle** — pounds ↔ metric tonnes, applied across every chart, KPI, and tooltip
- **Import CSV** — load your own file with the same 14-column schema, parsed entirely in-browser
- **Reset** — clear all filters back to the full dataset

---

## Known issue and workaround: Recharts + React 19

`src/utils/chartChildren.tsx` exists to work around a real incompatibility between **Recharts 2.x**
and **React 19**, and should not be removed without understanding why.

Recharts discovers its graphical items (`<Area>`, `<Line>`, `<Bar>`) by walking the chart's
children, and uses `isFragment()` from **react-is@18** to look inside a `<>…</>` wrapper. React 19
changed its element marker from `Symbol.for('react.element')` to
`Symbol.for('react.transitional.element')`, which react-is@18 does not recognize. As a result, any
series wrapped in a fragment is **silently dropped** — the chart renders its grid and X axis but no
series, no legend, and no Y-axis domain.

`flattenSeries()` flattens fragments into a plain array before handing children to Recharts, which
`React.Children` walks correctly regardless of react-is. It is applied at the `renderSeries()` call
sites in `OverviewView.tsx` and around the series conditional in `BoeingVsAirbusView.tsx`.

**If you add a chart that returns multiple series from a conditional or helper function, wrap the
result in `flattenSeries()`** — or return a plain array instead of a fragment. A single series
element needs no wrapper.

The alternative fix is a `package.json` override pinning `react-is` to v19. Recharts only imports
`isFragment` from it, so that is low-risk, but the shim was chosen because it is self-contained and
survives a `node_modules` wipe.

---

## Optional: offline pre-aggregation

`src/data/prepareData.cjs` copies `raw_data.csv` into `public/` and writes a pre-computed
`public/data/summary.json` (monthly series plus top airlines, manufacturers, regions, body types,
and models).

```bash
node src/data/prepareData.cjs
```

It is **not** wired into any npm script, and the app does not currently read `summary.json` — the
dashboard parses the CSV directly at runtime. Keep the script if you plan to move to a
pre-aggregated data path or need a quick dataset sanity check; it is otherwise inert.

---

## Data attribution

Air Traffic Landings Statistics published by San Francisco International Airport (SFO) via the
DataSF open data portal.
