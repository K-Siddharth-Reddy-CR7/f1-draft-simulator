import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import {
  Constructor,
  Driver,
  League,
  RaceWeekend,
  SeasonState,
  Standings,
  TeamPrincipal
} from '../../types/f1.js';
import {
  INITIAL_CONSTRUCTORS,
  INITIAL_DRIVERS,
  INITIAL_PRINCIPALS,
  OFFICIAL_CIRCUITS
} from '../data/f1-grid.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'apex_gp.db');
const db = new DatabaseSync(DB_PATH);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS seasons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    current_round INTEGER NOT NULL,
    is_completed INTEGER NOT NULL,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leagues (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    draft_status TEXT NOT NULL,
    current_pick INTEGER NOT NULL,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export function createInitialSeason(seed?: number): SeasonState {
  const drivers: Driver[] = JSON.parse(JSON.stringify(INITIAL_DRIVERS));
  const constructors: Constructor[] = JSON.parse(JSON.stringify(INITIAL_CONSTRUCTORS));
  const principals: TeamPrincipal[] = JSON.parse(JSON.stringify(INITIAL_PRINCIPALS));

  const schedule: RaceWeekend[] = OFFICIAL_CIRCUITS.map(circuit => ({
    round: circuit.round,
    circuit,
    weather: {
      condition: 'Sunny',
      trackTempC: 35,
      airTempC: 25,
      rainfallPercent: 0
    },
    qualifyingCompleted: false,
    qualifyingResults: [],
    raceCompleted: false,
    raceResults: [],
    lapEvents: [],
    safetyCarPeriods: 0,
    virtualSafetyCarPeriods: 0
  }));

  const initialStandings: Standings = {
    drivers: drivers.map((d, index) => ({
      rank: index + 1,
      driverId: d.id,
      driverName: d.name,
      driverCode: d.code,
      driverNumber: d.number,
      teamId: d.currentTeamId,
      teamName: constructors.find(c => c.id === d.currentTeamId)?.shortName || '',
      teamColor: constructors.find(c => c.id === d.currentTeamId)?.primaryColor || '#FFF',
      countryCode: d.countryCode,
      points: 0,
      wins: 0,
      podiums: 0,
      poles: 0,
      fastestLaps: 0,
      dnfs: 0
    })),
    constructors: constructors.map((c, index) => ({
      rank: index + 1,
      constructorId: c.id,
      name: c.name,
      shortName: c.shortName,
      primaryColor: c.primaryColor,
      countryCode: c.countryCode,
      points: 0,
      wins: 0,
      podiums: 0,
      drivers: c.driverIds.map(dId => drivers.find(d => d.id === dId)?.code || '')
    }))
  };

  return {
    id: `season_2026_${Date.now()}`,
    name: '2026 Formula 1 World Championship',
    year: 2026,
    currentRound: 1,
    totalRounds: OFFICIAL_CIRCUITS.length,
    schedule,
    drivers,
    constructors,
    teamPrincipals: principals,
    standings: initialStandings,
    userTeamId: 'con_veloce',
    userHasChosenTeam: false,
    isCompleted: false,
    randomSeed: seed ?? 42
  };
}

export function saveSeason(season: SeasonState): void {
  const stmt = db.prepare(`
    INSERT INTO seasons (id, name, year, current_round, is_completed, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      year = excluded.year,
      current_round = excluded.current_round,
      is_completed = excluded.is_completed,
      data_json = excluded.data_json,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    season.id,
    season.name,
    season.year,
    season.currentRound,
    season.isCompleted ? 1 : 0,
    JSON.stringify(season),
    new Date().toISOString()
  );
}

export function getSeason(id: string): SeasonState | null {
  const stmt = db.prepare('SELECT data_json FROM seasons WHERE id = ?');
  const row = stmt.get(id) as { data_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.data_json);
}

export function getCurrentSeason(): SeasonState {
  const stmt = db.prepare('SELECT data_json FROM seasons ORDER BY updated_at DESC LIMIT 1');
  const row = stmt.get() as { data_json: string } | undefined;
  if (!row) {
    const initial = createInitialSeason(42);
    saveSeason(initial);
    return initial;
  }
  return JSON.parse(row.data_json);
}

export function getAllSeasons(): Array<{ id: string; name: string; year: number; currentRound: number; isCompleted: boolean; updatedAt: string }> {
  const stmt = db.prepare('SELECT id, name, year, current_round, is_completed, updated_at FROM seasons ORDER BY updated_at DESC');
  const rows = stmt.all() as Array<{ id: string; name: string; year: number; current_round: number; is_completed: number; updated_at: string }>;
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    year: r.year,
    currentRound: r.current_round,
    isCompleted: Boolean(r.is_completed),
    updatedAt: r.updated_at
  }));
}

// Fantasy Leagues & Snake Draft
export function createInitialLeague(name: string = 'Premier Paddock League', managerCount: number = 6): League {
  const humanManager = {
    id: 'mgr_human',
    name: 'You (Principal)',
    isHuman: true,
    avatarSeed: 'apex_leader',
    picks: {},
    points: 0,
    budgetRemainingM: 100
  };

  const aiNames = [
    'Scuderia Rival AI',
    'Silver Star Syndicate',
    'Papaya Strategists',
    'Red Horn Dynamics',
    'Alpine Tactical',
    'Silverstone Racing Lab',
    'Monza Speed Club'
  ];

  const managers = [humanManager];
  for (let i = 1; i < managerCount; i++) {
    managers.push({
      id: `mgr_ai_${i}`,
      name: aiNames[i - 1] || `AI Manager ${i}`,
      isHuman: false,
      avatarSeed: `ai_${i}`,
      picks: {},
      points: 0,
      budgetRemainingM: 100
    });
  }

  // Generate snake draft order for 4 rounds (Driver 1, Driver 2, Constructor, Principal)
  // Round 1: 0 to N-1
  // Round 2: N-1 down to 0
  // Round 3: 0 to N-1
  // Round 4: N-1 down to 0
  const draftOrder: string[] = [];
  const rounds = 4;
  for (let r = 0; r < rounds; r++) {
    if (r % 2 === 0) {
      for (let m = 0; m < managers.length; m++) {
        draftOrder.push(managers[m].id);
      }
    } else {
      for (let m = managers.length - 1; m >= 0; m--) {
        draftOrder.push(managers[m].id);
      }
    }
  }

  return {
    id: `league_${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    numberOfManagers: managers.length,
    managers,
    draftStatus: 'NOT_STARTED',
    currentPickIndex: 0,
    totalPicks: draftOrder.length,
    draftOrder,
    picksHistory: []
  };
}

export function saveLeague(league: League): void {
  const stmt = db.prepare(`
    INSERT INTO leagues (id, name, draft_status, current_pick, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      draft_status = excluded.draft_status,
      current_pick = excluded.current_pick,
      data_json = excluded.data_json,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    league.id,
    league.name,
    league.draftStatus,
    league.currentPickIndex,
    JSON.stringify(league),
    new Date().toISOString()
  );
}

export function getLeague(id: string): League | null {
  const stmt = db.prepare('SELECT data_json FROM leagues WHERE id = ?');
  const row = stmt.get(id) as { data_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.data_json);
}

export function getAllLeagues(): League[] {
  const stmt = db.prepare('SELECT data_json FROM leagues ORDER BY updated_at DESC');
  const rows = stmt.all() as Array<{ data_json: string }>;
  if (rows.length === 0) {
    const defaultLeague = createInitialLeague();
    saveLeague(defaultLeague);
    return [defaultLeague];
  }
  return rows.map(r => JSON.parse(r.data_json));
}
