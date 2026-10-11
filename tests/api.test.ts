import test from 'node:test';
import assert from 'node:assert';
import {
  createInitialLeague,
  createInitialSeason,
  getCurrentSeason,
  getLeague,
  getSeason,
  saveLeague,
  saveSeason
} from '../src/server/db/database.js';

test('Season persistence roundtrip to SQLite database', () => {
  const season = createInitialSeason(12345);
  season.name = 'Test SQLite Championship 2026';
  saveSeason(season);

  const retrieved = getSeason(season.id);
  assert.ok(retrieved !== null, 'Season must be retrieved from database');
  assert.strictEqual(retrieved?.id, season.id);
  assert.strictEqual(retrieved?.name, 'Test SQLite Championship 2026');
  assert.strictEqual(retrieved?.drivers.length, 20);
  assert.strictEqual(retrieved?.constructors.length, 10);
});

test('League draft persistence roundtrip to SQLite database', () => {
  const league = createInitialLeague('Test Persistence League', 5);
  saveLeague(league);

  const retrieved = getLeague(league.id);
  assert.ok(retrieved !== null, 'League must be retrieved from database');
  assert.strictEqual(retrieved?.name, 'Test Persistence League');
  assert.strictEqual(retrieved?.managers.length, 5);
  assert.strictEqual(retrieved?.totalPicks, 20); // 5 * 4 rounds
});
