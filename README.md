# Pitwall HQ: Formula 1 Season & Team Management Simulator

A full-stack Formula 1 team management and Grand Prix season simulator built with React 19, TypeScript, Express, Tailwind CSS, and SQLite.

> **Disclaimer**: Pitwall HQ is an independent motorsport simulation game and is not affiliated with, endorsed by, or associated with Formula 1, the FIA, or Formula One Licensing B.V.

---

## Features

### 1. Interactive Team Drafting & Setup
- Choose any official Constructor (Ferrari, Red Bull Racing, Mercedes, McLaren, Aston Martin, Alpine, Williams, RB, Stake Sauber, Haas).
- Appoint a Team Principal with tactical strengths and pit crew bonuses.
- Draft your 2-driver lineup from the 20-driver grid. The rest of the grid is automatically and realistically balanced across rival constructors.

### 2. Live Grand Prix Weekend Simulation
- **Live Track Movement**: Watch cars battle and overtake on-track with lap-by-lap position updates, tyre wear, and gap telemetry at 1x, 2x, or 4x speed, or skip directly to the finish.
- **Weekend Summary**: Comprehensive race weekend summary with Practice (FP1, FP2, FP3), Qualifying (Q1, Q2, Q3 ladder), and Race Classifications.
- **Dynamic Physics & Incidents**: Models tyre compound strategies (Soft, Medium, Hard, Inter, Wet), degradation, safety car and VSC periods, mechanical retirements (engine, hydraulics, collisions), and fastest lap bonus points.
- **Deterministic Seeding**: Provide any custom seed (e.g. `42`) to reproduce identical race outcomes and championship storylines.

### 3. Championship Standings & Official Prize Money
- **Dual Championship View**: View both the World Drivers' Championship (WDC) and World Constructors' Championship (WCC) on the same page.
- **$1,000,000,000 FIA Constructors Prize Fund**: Accurate Concorde Agreement prize money distribution ($140M for 1st down to $61M for 10th).
- **$116,500,000 Driver Performance Bonus Pool**: Driver bonuses ranging from $25M for the World Champion to $600K for 20th.
- **Interactive 24-Race Calendar**: Review past race results or check upcoming rounds across all 24 Grand Prix tracks.

### 4. Paddock R&D & Cost Cap Management
- Upgrade Aerodynamics, Power Unit, Chassis Dynamics, and Pit Crew Training within the FIA cost cap budget.
- Track driver morale, experience, chemistry, and performance evolution across the 24-race season.

---

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Outfit & JetBrains Mono typography.
- **Backend**: Express on Node.js v22 with unified Vite middleware (`server.ts`).
- **Database**: Embedded SQLite persistence using `node:sqlite`.
- **Testing**: Node test runner (`tsx --test`) covering physics, qualifying, scoring, and persistence.

---

## Setup & Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Run Automated Tests
```bash
npm test
```

### 4. Production Build
```bash
npm run build
npm start
```
