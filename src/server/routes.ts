import { Router, Request, Response } from 'express';
import {
  applyRaceResultsToSeason,
  SeededRandom,
  simulatePracticeSessions,
  simulateQualifying,
  simulateRace
} from './simulation/engine.js';
import {
  createInitialLeague,
  createInitialSeason,
  getAllLeagues,
  getAllSeasons,
  getCurrentSeason,
  getLeague,
  getSeason,
  saveLeague,
  saveSeason
} from './db/database.js';
import {
  INITIAL_CONSTRUCTORS,
  INITIAL_DRIVERS,
  INITIAL_PRINCIPALS,
  OFFICIAL_CIRCUITS
} from './data/f1-grid.js';
import { DraftPick, League, LeagueManager, SeasonState } from '../types/f1.js';

export const apiRouter = Router();

// Helper to assign user team and randomize the rest of the 20-car grid
function setupUserTeamAndRandomizeGrid(
  season: SeasonState,
  constructorId: string,
  principalId: string,
  driver1Id: string,
  driver2Id: string
): void {
  season.userTeamId = constructorId;
  season.userHasChosenTeam = true;
  season.userDraftedRoster = {
    constructorId,
    principalId,
    driver1Id,
    driver2Id
  };

  // 1. Assign User Team
  const userTeam = season.constructors.find(c => c.id === constructorId);
  if (userTeam) {
    userTeam.driverIds = [driver1Id, driver2Id];
    userTeam.principalId = principalId;
  }

  // 2. Separate remaining 18 drivers and 9 constructors
  const remainingDrivers = season.drivers
    .filter(d => d.id !== driver1Id && d.id !== driver2Id)
    .sort(() => Math.random() - 0.5);

  const remainingConstructors = season.constructors
    .filter(c => c.id !== constructorId);

  const remainingPrincipals = season.teamPrincipals
    .filter(p => p.id !== principalId)
    .sort(() => Math.random() - 0.5);

  // 3. Randomly pair remaining drivers and principals into remaining constructors
  remainingConstructors.forEach((team, idx) => {
    const d1 = remainingDrivers[idx * 2];
    const d2 = remainingDrivers[idx * 2 + 1];
    const pri = remainingPrincipals[idx];

    if (d1 && d2) {
      team.driverIds = [d1.id, d2.id];
      d1.currentTeamId = team.id;
      d2.currentTeamId = team.id;
    }
    if (pri) {
      team.principalId = pri.id;
    }
  });

  // Update user drivers
  const userD1 = season.drivers.find(d => d.id === driver1Id);
  const userD2 = season.drivers.find(d => d.id === driver2Id);
  if (userD1) userD1.currentTeamId = constructorId;
  if (userD2) userD2.currentTeamId = constructorId;

  // Re-sync initial standings driver-to-team mappings
  for (const standing of season.standings.drivers) {
    const d = season.drivers.find(drv => drv.id === standing.driverId);
    if (d) {
      const team = season.constructors.find(c => c.id === d.currentTeamId);
      standing.teamId = d.currentTeamId;
      standing.teamName = team?.shortName || '';
      standing.teamColor = team?.primaryColor || '#FFF';
    }
  }

  for (const cStanding of season.standings.constructors) {
    const team = season.constructors.find(c => c.id === cStanding.constructorId);
    if (team) {
      cStanding.drivers = team.driverIds.map(dId => season.drivers.find(d => d.id === dId)?.code || '');
    }
  }
}

// ========================
// SEASON ENDPOINTS
// ========================

// GET /api/season/current
apiRouter.get('/season/current', (_req: Request, res: Response) => {
  try {
    const season = getCurrentSeason();
    res.json({ success: true, season });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/season/list
apiRouter.get('/season/list', (_req: Request, res: Response) => {
  try {
    const seasons = getAllSeasons();
    res.json({ success: true, seasons });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/season/new
apiRouter.post('/season/new', (req: Request, res: Response) => {
  try {
    const { name, seed, userTeamId, draftedRoster } = req.body || {};
    const newSeason = createInitialSeason(seed !== undefined ? Number(seed) : undefined);
    if (name) newSeason.name = String(name);

    if (draftedRoster) {
      setupUserTeamAndRandomizeGrid(
        newSeason,
        draftedRoster.constructorId,
        draftedRoster.principalId,
        draftedRoster.driver1Id,
        draftedRoster.driver2Id
      );
    } else if (userTeamId) {
      newSeason.userTeamId = String(userTeamId);
      newSeason.userHasChosenTeam = true;
    }

    saveSeason(newSeason);
    res.json({ success: true, season: newSeason });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/season/select-team
apiRouter.post('/api/season/select-team', (req: Request, res: Response) => {
  try {
    const { teamId, draftedRoster } = req.body || {};
    const season = getCurrentSeason();

    if (draftedRoster) {
      setupUserTeamAndRandomizeGrid(
        season,
        draftedRoster.constructorId,
        draftedRoster.principalId,
        draftedRoster.driver1Id,
        draftedRoster.driver2Id
      );
    } else if (teamId) {
      const team = season.constructors.find(c => c.id === teamId);
      if (team) {
        setupUserTeamAndRandomizeGrid(
          season,
          team.id,
          team.principalId,
          team.driverIds[0],
          team.driverIds[1]
        );
      }
    }

    saveSeason(season);
    res.json({ success: true, season });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/season/select-team', (req: Request, res: Response) => {
  try {
    const { teamId, draftedRoster } = req.body || {};
    const season = getCurrentSeason();

    if (draftedRoster) {
      setupUserTeamAndRandomizeGrid(
        season,
        draftedRoster.constructorId,
        draftedRoster.principalId,
        draftedRoster.driver1Id,
        draftedRoster.driver2Id
      );
    } else if (teamId) {
      const team = season.constructors.find(c => c.id === teamId);
      if (team) {
        setupUserTeamAndRandomizeGrid(
          season,
          team.id,
          team.principalId,
          team.driverIds[0],
          team.driverIds[1]
        );
      }
    }

    saveSeason(season);
    res.json({ success: true, season });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/season/advance-round
apiRouter.post('/season/advance-round', (_req: Request, res: Response) => {
  try {
    const season = getCurrentSeason();
    if (season.isCompleted) {
      return res.json({ success: true, season, message: 'Season already completed.' });
    }

    if (season.currentRound >= season.totalRounds) {
      season.isCompleted = true;
    } else {
      season.currentRound += 1;
    }

    saveSeason(season);
    res.json({ success: true, season });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/season/simulate-qualifying
apiRouter.post('/season/simulate-qualifying', (req: Request, res: Response) => {
  try {
    const season = getCurrentSeason();
    if (season.isCompleted) {
      return res.status(400).json({ success: false, error: 'Season is already completed.' });
    }

    const weekend = season.schedule[season.currentRound - 1];
    if (!weekend) {
      return res.status(400).json({ success: false, error: 'Invalid current round.' });
    }

    const roundSeed = ((season.randomSeed || 42) * 1000) + (season.currentRound * 17);
    const rng = new SeededRandom(roundSeed);

    // Simulate practice sessions if not yet simulated
    if (!weekend.practiceCompleted) {
      weekend.practiceResults = simulatePracticeSessions(
        weekend.circuit,
        season.drivers,
        season.constructors,
        season.teamPrincipals,
        new SeededRandom(roundSeed - 13)
      );
      weekend.practiceCompleted = true;
    }

    const qualifyingResults = simulateQualifying(
      weekend.circuit,
      season.drivers,
      season.constructors,
      season.teamPrincipals,
      rng
    );

    weekend.qualifyingCompleted = true;
    weekend.qualifyingResults = qualifyingResults;

    saveSeason(season);
    res.json({ success: true, season, qualifyingResults, practiceResults: weekend.practiceResults });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/season/simulate-race
apiRouter.post('/season/simulate-race', (req: Request, res: Response) => {
  try {
    const season = getCurrentSeason();
    if (season.isCompleted) {
      return res.status(400).json({ success: false, error: 'Season is already completed.' });
    }

    const weekend = season.schedule[season.currentRound - 1];
    if (!weekend) {
      return res.status(400).json({ success: false, error: 'Invalid current round.' });
    }

    const roundSeed = ((season.randomSeed || 42) * 1000) + (season.currentRound * 31);
    const rng = new SeededRandom(roundSeed);

    // Auto-run Practice if not already run
    if (!weekend.practiceCompleted) {
      weekend.practiceResults = simulatePracticeSessions(
        weekend.circuit,
        season.drivers,
        season.constructors,
        season.teamPrincipals,
        new SeededRandom(roundSeed - 13)
      );
      weekend.practiceCompleted = true;
    }

    // Auto-run qualifying if not already run
    if (!weekend.qualifyingCompleted) {
      const qRng = new SeededRandom(roundSeed - 7);
      weekend.qualifyingResults = simulateQualifying(
        weekend.circuit,
        season.drivers,
        season.constructors,
        season.teamPrincipals,
        qRng
      );
      weekend.qualifyingCompleted = true;
    }

    // Run race
    const raceOutcome = simulateRace(
      weekend.circuit,
      weekend.qualifyingResults,
      season.drivers,
      season.constructors,
      season.teamPrincipals,
      rng
    );

    weekend.raceCompleted = true;
    weekend.raceResults = raceOutcome.results;
    weekend.lapEvents = raceOutcome.lapEvents;
    weekend.safetyCarPeriods = raceOutcome.safetyCars;
    weekend.virtualSafetyCarPeriods = raceOutcome.virtualSafetyCars;
    weekend.fastestLapHolder = raceOutcome.fastestLap;
    weekend.weather = raceOutcome.weather;

    // Apply results to season stats & standings
    const { updatedDrivers, updatedConstructors, standings } = applyRaceResultsToSeason(
      weekend,
      season.drivers,
      season.constructors,
      season.teamPrincipals
    );

    season.drivers = updatedDrivers;
    season.constructors = updatedConstructors;
    season.standings = standings;

    // NOTE: DO NOT auto-increment currentRound here!
    // The user must see the live movement, results and summary.
    // They will advance to next round using /api/season/advance-round.

    saveSeason(season);
    res.json({
      success: true,
      season,
      raceOutcome,
      practiceResults: weekend.practiceResults,
      qualifyingResults: weekend.qualifyingResults
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/season/simulate-to-end
apiRouter.post('/season/simulate-to-end', (_req: Request, res: Response) => {
  try {
    const season = getCurrentSeason();
    if (season.isCompleted) {
      return res.json({ success: true, season, message: 'Season already completed.' });
    }

    while (!season.isCompleted && season.currentRound <= season.totalRounds) {
      const weekend = season.schedule[season.currentRound - 1];
      const roundSeed = ((season.randomSeed || 42) * 1000) + (season.currentRound * 31);
      const rng = new SeededRandom(roundSeed);

      if (!weekend.qualifyingCompleted) {
        weekend.qualifyingResults = simulateQualifying(
          weekend.circuit,
          season.drivers,
          season.constructors,
          season.teamPrincipals,
          new SeededRandom(roundSeed - 7)
        );
        weekend.qualifyingCompleted = true;
      }

      const raceOutcome = simulateRace(
        weekend.circuit,
        weekend.qualifyingResults,
        season.drivers,
        season.constructors,
        season.teamPrincipals,
        rng
      );

      weekend.raceCompleted = true;
      weekend.raceResults = raceOutcome.results;
      weekend.lapEvents = raceOutcome.lapEvents;
      weekend.safetyCarPeriods = raceOutcome.safetyCars;
      weekend.virtualSafetyCarPeriods = raceOutcome.virtualSafetyCars;
      weekend.fastestLapHolder = raceOutcome.fastestLap;
      weekend.weather = raceOutcome.weather;

      const { updatedDrivers, updatedConstructors, standings } = applyRaceResultsToSeason(
        weekend,
        season.drivers,
        season.constructors,
        season.teamPrincipals
      );

      season.drivers = updatedDrivers;
      season.constructors = updatedConstructors;
      season.standings = standings;

      if (season.currentRound >= season.totalRounds) {
        season.isCompleted = true;
      } else {
        season.currentRound += 1;
      }
    }

    saveSeason(season);
    res.json({ success: true, season });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/season/team/upgrade
apiRouter.post('/season/team/upgrade', (req: Request, res: Response) => {
  try {
    const { category, teamId } = req.body;
    if (!category || !['aero', 'engine', 'chassis', 'pitCrew'].includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid upgrade category. Must be aero, engine, chassis, or pitCrew.' });
    }

    const season = getCurrentSeason();
    const targetTeamId = teamId || season.userTeamId;
    const team = season.constructors.find(c => c.id === targetTeamId);

    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }

    const currentLevel = team.upgrades[category as keyof typeof team.upgrades];
    if (currentLevel >= 5) {
      return res.status(400).json({ success: false, error: `Upgrade ${category} is already at maximum level 5.` });
    }

    const upgradeCost = 8 + (currentLevel * 3); // $8M, $11M, $14M, etc.
    if (team.budgetRemainingM < upgradeCost) {
      return res.status(400).json({ success: false, error: `Insufficient budget. Requires $${upgradeCost}M, have $${team.budgetRemainingM}M.` });
    }

    team.budgetRemainingM -= upgradeCost;
    team.upgrades[category as keyof typeof team.upgrades] += 1;

    saveSeason(season);
    res.json({ success: true, season, team, upgraded: category, newLevel: team.upgrades[category as keyof typeof team.upgrades] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/season/race/:round
apiRouter.get('/season/race/:round', (req: Request, res: Response) => {
  try {
    const round = parseInt(req.params.round, 10);
    const season = getCurrentSeason();
    const weekend = season.schedule.find(w => w.round === round);
    if (!weekend) {
      return res.status(404).json({ success: false, error: `Race round ${round} not found.` });
    }
    res.json({ success: true, weekend });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================
// LEAGUE & DRAFT ENDPOINTS
// ========================

// GET /api/leagues
apiRouter.get('/leagues', (_req: Request, res: Response) => {
  try {
    const leagues = getAllLeagues();
    res.json({ success: true, leagues });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/leagues
apiRouter.post('/leagues', (req: Request, res: Response) => {
  try {
    const { name, managersCount } = req.body || {};
    const league = createInitialLeague(name || 'Pitwall HQ League', managersCount ? Number(managersCount) : 6);
    saveLeague(league);
    res.json({ success: true, league });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to determine drafted asset IDs
function getDraftedAssetIds(league: League): Set<string> {
  const set = new Set<string>();
  for (const pick of league.picksHistory) {
    set.add(pick.assetId);
  }
  return set;
}

// GET /api/leagues/:id
apiRouter.get('/leagues/:id', (req: Request, res: Response) => {
  try {
    const league = getLeague(req.params.id);
    if (!league) {
      return res.status(404).json({ success: false, error: 'League not found.' });
    }

    const draftedIds = getDraftedAssetIds(league);

    const availableDrivers = INITIAL_DRIVERS.map(d => ({
      ...d,
      isDrafted: draftedIds.has(d.id)
    }));

    const availableConstructors = INITIAL_CONSTRUCTORS.map(c => ({
      ...c,
      isDrafted: draftedIds.has(c.id)
    }));

    const availablePrincipals = INITIAL_PRINCIPALS.map(p => ({
      ...p,
      isDrafted: draftedIds.has(p.id)
    }));

    // Current manager on the clock
    const currentManagerId = league.draftOrder[league.currentPickIndex] || null;
    const currentManager = currentManagerId ? league.managers.find(m => m.id === currentManagerId) : null;

    res.json({
      success: true,
      league,
      currentManager,
      availableDrivers,
      availableConstructors,
      availablePrincipals
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/leagues/:id/draft-pick
apiRouter.post('/leagues/:id/draft-pick', (req: Request, res: Response) => {
  try {
    const league = getLeague(req.params.id);
    if (!league) {
      return res.status(404).json({ success: false, error: 'League not found.' });
    }

    if (league.draftStatus === 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Draft is already completed.' });
    }

    const { managerId, assetType, assetId } = req.body;
    if (!managerId || !assetType || !assetId) {
      return res.status(400).json({ success: false, error: 'managerId, assetType, and assetId are required.' });
    }

    // Verify manager is on clock
    const currentExpectedManagerId = league.draftOrder[league.currentPickIndex];
    if (currentExpectedManagerId !== managerId) {
      return res.status(400).json({ success: false, error: `It is not ${managerId}'s turn to pick.` });
    }

    const manager = league.managers.find(m => m.id === managerId);
    if (!manager) {
      return res.status(404).json({ success: false, error: 'Manager not found in league.' });
    }

    // Verify asset has not already been drafted in this league (Unique pick constraint)
    const draftedIds = getDraftedAssetIds(league);
    if (draftedIds.has(assetId)) {
      return res.status(400).json({ success: false, error: 'This asset has already been drafted by another manager.' });
    }

    // Find asset details & validate roster slots
    let assetName = '';
    let assetMeta = '';

    if (assetType === 'DRIVER') {
      const driver = INITIAL_DRIVERS.find(d => d.id === assetId);
      if (!driver) return res.status(404).json({ success: false, error: 'Driver not found.' });
      if (!manager.picks.driver1Id) {
        manager.picks.driver1Id = driver.id;
      } else if (!manager.picks.driver2Id) {
        manager.picks.driver2Id = driver.id;
      } else {
        return res.status(400).json({ success: false, error: 'Manager already has 2 drivers drafted.' });
      }
      assetName = `${driver.name} (#${driver.number})`;
      assetMeta = `Pace: ${driver.stats.pace} · Age: ${driver.age}`;
    } else if (assetType === 'CONSTRUCTOR') {
      const constructor = INITIAL_CONSTRUCTORS.find(c => c.id === assetId);
      if (!constructor) return res.status(404).json({ success: false, error: 'Constructor not found.' });
      if (manager.picks.constructorId) {
        return res.status(400).json({ success: false, error: 'Manager already has a constructor drafted.' });
      }
      manager.picks.constructorId = constructor.id;
      assetName = constructor.name;
      assetMeta = `Aero: ${constructor.baseAero} · Engine: ${constructor.baseEngine}`;
    } else if (assetType === 'PRINCIPAL') {
      const principal = INITIAL_PRINCIPALS.find(p => p.id === assetId);
      if (!principal) return res.status(404).json({ success: false, error: 'Principal not found.' });
      if (manager.picks.principalId) {
        return res.status(400).json({ success: false, error: 'Manager already has a team principal drafted.' });
      }
      manager.picks.principalId = principal.id;
      assetName = principal.name;
      assetMeta = `Perk: ${principal.perkName}`;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid assetType.' });
    }

    // Record draft pick
    const roundNumber = Math.floor(league.currentPickIndex / league.managers.length) + 1;
    const pickInRound = (league.currentPickIndex % league.managers.length) + 1;

    const pickRecord: DraftPick = {
      overallPickNumber: league.currentPickIndex + 1,
      roundNumber,
      pickInRound,
      managerId: manager.id,
      managerName: manager.name,
      assetType,
      assetId,
      assetName,
      assetMeta,
      timestamp: new Date().toISOString()
    };

    league.picksHistory.push(pickRecord);
    league.currentPickIndex += 1;
    league.draftStatus = 'IN_PROGRESS';

    if (league.currentPickIndex >= league.totalPicks) {
      league.draftStatus = 'COMPLETED';
    }

    saveLeague(league);
    res.json({ success: true, league, pickRecord });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: AI Pick Selection
function selectAiPick(manager: LeagueManager, draftedIds: Set<string>): { assetType: 'DRIVER' | 'CONSTRUCTOR' | 'PRINCIPAL'; assetId: string } | null {
  // If missing driver 1
  if (!manager.picks.driver1Id) {
    const bestDriver = [...INITIAL_DRIVERS]
      .filter(d => !draftedIds.has(d.id))
      .sort((a, b) => b.stats.pace - a.stats.pace)[0];
    if (bestDriver) return { assetType: 'DRIVER', assetId: bestDriver.id };
  }

  // If missing constructor
  if (!manager.picks.constructorId) {
    const bestTeam = [...INITIAL_CONSTRUCTORS]
      .filter(c => !draftedIds.has(c.id))
      .sort((a, b) => (b.baseAero + b.baseEngine) - (a.baseAero + a.baseEngine))[0];
    if (bestTeam) return { assetType: 'CONSTRUCTOR', assetId: bestTeam.id };
  }

  // If missing driver 2
  if (!manager.picks.driver2Id) {
    const bestDriver = [...INITIAL_DRIVERS]
      .filter(d => !draftedIds.has(d.id))
      .sort((a, b) => b.stats.racecraft - a.stats.racecraft)[0];
    if (bestDriver) return { assetType: 'DRIVER', assetId: bestDriver.id };
  }

  // If missing principal
  if (!manager.picks.principalId) {
    const bestPrincipal = [...INITIAL_PRINCIPALS]
      .filter(p => !draftedIds.has(p.id))
      .sort((a, b) => (b.leadership + b.tactics) - (a.leadership + a.tactics))[0];
    if (bestPrincipal) return { assetType: 'PRINCIPAL', assetId: bestPrincipal.id };
  }

  return null;
}

// POST /api/leagues/:id/auto-pick (execute one auto-pick for current manager on the clock)
apiRouter.post('/leagues/:id/auto-pick', (req: Request, res: Response) => {
  try {
    const league = getLeague(req.params.id);
    if (!league) return res.status(404).json({ success: false, error: 'League not found.' });
    if (league.draftStatus === 'COMPLETED') return res.status(400).json({ success: false, error: 'Draft completed.' });

    const currentManagerId = league.draftOrder[league.currentPickIndex];
    const manager = league.managers.find(m => m.id === currentManagerId);
    if (!manager) return res.status(400).json({ success: false, error: 'Current manager not found.' });

    const draftedIds = getDraftedAssetIds(league);
    const chosen = selectAiPick(manager, draftedIds);
    if (!chosen) {
      return res.status(400).json({ success: false, error: 'No valid picks remaining for manager.' });
    }

    // Call draft pick logic
    let assetName = '';
    let assetMeta = '';
    if (chosen.assetType === 'DRIVER') {
      const d = INITIAL_DRIVERS.find(drv => drv.id === chosen.assetId)!;
      if (!manager.picks.driver1Id) manager.picks.driver1Id = d.id;
      else manager.picks.driver2Id = d.id;
      assetName = `${d.name} (#${d.number})`;
      assetMeta = `Pace: ${d.stats.pace}`;
    } else if (chosen.assetType === 'CONSTRUCTOR') {
      const c = INITIAL_CONSTRUCTORS.find(con => con.id === chosen.assetId)!;
      manager.picks.constructorId = c.id;
      assetName = c.name;
      assetMeta = `Aero: ${c.baseAero}`;
    } else {
      const p = INITIAL_PRINCIPALS.find(pri => pri.id === chosen.assetId)!;
      manager.picks.principalId = p.id;
      assetName = p.name;
      assetMeta = `Perk: ${p.perkName}`;
    }

    const roundNumber = Math.floor(league.currentPickIndex / league.managers.length) + 1;
    const pickInRound = (league.currentPickIndex % league.managers.length) + 1;

    const pickRecord: DraftPick = {
      overallPickNumber: league.currentPickIndex + 1,
      roundNumber,
      pickInRound,
      managerId: manager.id,
      managerName: manager.name,
      assetType: chosen.assetType,
      assetId: chosen.assetId,
      assetName,
      assetMeta,
      timestamp: new Date().toISOString()
    };

    league.picksHistory.push(pickRecord);
    league.currentPickIndex += 1;
    league.draftStatus = league.currentPickIndex >= league.totalPicks ? 'COMPLETED' : 'IN_PROGRESS';

    saveLeague(league);
    res.json({ success: true, league, pickRecord });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/leagues/:id/simulate-full-draft
apiRouter.post('/leagues/:id/simulate-full-draft', (req: Request, res: Response) => {
  try {
    const league = getLeague(req.params.id);
    if (!league) return res.status(404).json({ success: false, error: 'League not found.' });

    while (league.currentPickIndex < league.totalPicks) {
      const currentManagerId = league.draftOrder[league.currentPickIndex];
      const manager = league.managers.find(m => m.id === currentManagerId)!;
      const draftedIds = getDraftedAssetIds(league);
      const chosen = selectAiPick(manager, draftedIds);
      if (!chosen) break;

      let assetName = '';
      let assetMeta = '';
      if (chosen.assetType === 'DRIVER') {
        const d = INITIAL_DRIVERS.find(drv => drv.id === chosen.assetId)!;
        if (!manager.picks.driver1Id) manager.picks.driver1Id = d.id;
        else manager.picks.driver2Id = d.id;
        assetName = `${d.name} (#${d.number})`;
        assetMeta = `Pace: ${d.stats.pace}`;
      } else if (chosen.assetType === 'CONSTRUCTOR') {
        const c = INITIAL_CONSTRUCTORS.find(con => con.id === chosen.assetId)!;
        manager.picks.constructorId = c.id;
        assetName = c.name;
        assetMeta = `Aero: ${c.baseAero}`;
      } else {
        const p = INITIAL_PRINCIPALS.find(pri => pri.id === chosen.assetId)!;
        manager.picks.principalId = p.id;
        assetName = p.name;
        assetMeta = `Perk: ${p.perkName}`;
      }

      const roundNumber = Math.floor(league.currentPickIndex / league.managers.length) + 1;
      const pickInRound = (league.currentPickIndex % league.managers.length) + 1;

      league.picksHistory.push({
        overallPickNumber: league.currentPickIndex + 1,
        roundNumber,
        pickInRound,
        managerId: manager.id,
        managerName: manager.name,
        assetType: chosen.assetType,
        assetId: chosen.assetId,
        assetName,
        assetMeta,
        timestamp: new Date().toISOString()
      });

      league.currentPickIndex += 1;
    }

    league.draftStatus = 'COMPLETED';
    saveLeague(league);
    res.json({ success: true, league });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Grid data endpoints
apiRouter.get('/drivers', (_req: Request, res: Response) => {
  res.json({ success: true, drivers: INITIAL_DRIVERS });
});

apiRouter.get('/constructors', (_req: Request, res: Response) => {
  res.json({ success: true, constructors: INITIAL_CONSTRUCTORS });
});

apiRouter.get('/principals', (_req: Request, res: Response) => {
  res.json({ success: true, principals: INITIAL_PRINCIPALS });
});

apiRouter.get('/circuits', (_req: Request, res: Response) => {
  res.json({ success: true, circuits: OFFICIAL_CIRCUITS });
});
