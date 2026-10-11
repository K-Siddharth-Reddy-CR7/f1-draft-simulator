import test from 'node:test';
import assert from 'node:assert';
import {
  applyRaceResultsToSeason,
  SeededRandom,
  simulateQualifying,
  simulateRace
} from '../src/server/simulation/engine.js';
import {
  INITIAL_CONSTRUCTORS,
  INITIAL_DRIVERS,
  INITIAL_PRINCIPALS,
  OFFICIAL_CIRCUITS
} from '../src/server/data/f1-grid.js';
import { RaceWeekend } from '../src/types/f1.js';

test('Constructor points equal sum of points scored by its drivers', () => {
  const circuit = OFFICIAL_CIRCUITS[0];
  const rng = new SeededRandom(555);
  const qGrid = simulateQualifying(circuit, INITIAL_DRIVERS, INITIAL_CONSTRUCTORS, INITIAL_PRINCIPALS, rng);
  const raceResult = simulateRace(circuit, qGrid, INITIAL_DRIVERS, INITIAL_CONSTRUCTORS, INITIAL_PRINCIPALS, rng);

  const weekend: RaceWeekend = {
    round: 1,
    circuit,
    weather: raceResult.weather,
    qualifyingCompleted: true,
    qualifyingResults: qGrid,
    raceCompleted: true,
    raceResults: raceResult.results,
    lapEvents: raceResult.lapEvents,
    safetyCarPeriods: raceResult.safetyCars,
    virtualSafetyCarPeriods: raceResult.virtualSafetyCars,
    fastestLapHolder: raceResult.fastestLap
  };

  const { updatedDrivers, updatedConstructors } = applyRaceResultsToSeason(
    weekend,
    INITIAL_DRIVERS,
    INITIAL_CONSTRUCTORS,
    INITIAL_PRINCIPALS
  );

  for (const team of updatedConstructors) {
    const teamDriverPoints = updatedDrivers
      .filter(d => team.driverIds.includes(d.id))
      .reduce((sum, d) => sum + d.points, 0);

    assert.strictEqual(
      team.points,
      teamDriverPoints,
      `Constructor ${team.name} points (${team.points}) must equal driver sum (${teamDriverPoints})`
    );
  }
});

test('Championship standings are properly ranked by points descending', () => {
  const circuit = OFFICIAL_CIRCUITS[0];
  const rng = new SeededRandom(101);
  const qGrid = simulateQualifying(circuit, INITIAL_DRIVERS, INITIAL_CONSTRUCTORS, INITIAL_PRINCIPALS, rng);
  const race = simulateRace(circuit, qGrid, INITIAL_DRIVERS, INITIAL_CONSTRUCTORS, INITIAL_PRINCIPALS, rng);

  const weekend: RaceWeekend = {
    round: 1,
    circuit,
    weather: race.weather,
    qualifyingCompleted: true,
    qualifyingResults: qGrid,
    raceCompleted: true,
    raceResults: race.results,
    lapEvents: race.lapEvents,
    safetyCarPeriods: race.safetyCars,
    virtualSafetyCarPeriods: race.virtualSafetyCars
  };

  const { standings } = applyRaceResultsToSeason(
    weekend,
    INITIAL_DRIVERS,
    INITIAL_CONSTRUCTORS,
    INITIAL_PRINCIPALS
  );

  // Check drivers standings order
  for (let i = 1; i < standings.drivers.length; i++) {
    const prev = standings.drivers[i - 1];
    const curr = standings.drivers[i];
    assert.ok(prev.points >= curr.points, 'Driver standing points must be descending');
    assert.strictEqual(curr.rank, i + 1);
  }

  // Check constructors standings order
  for (let i = 1; i < standings.constructors.length; i++) {
    const prev = standings.constructors[i - 1];
    const curr = standings.constructors[i];
    assert.ok(prev.points >= curr.points, 'Constructor standing points must be descending');
    assert.strictEqual(curr.rank, i + 1);
  }
});
