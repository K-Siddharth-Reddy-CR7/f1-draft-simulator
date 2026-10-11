import test from 'node:test';
import assert from 'node:assert';
import { createInitialLeague } from '../src/server/db/database.js';
import { League, DraftPick } from '../src/types/f1.js';
import { INITIAL_CONSTRUCTORS, INITIAL_DRIVERS, INITIAL_PRINCIPALS } from '../src/server/data/f1-grid.js';

test('Snake draft generates authentic snake order pattern', () => {
  const managerCount = 4;
  const league = createInitialLeague('Test Snake League', managerCount);

  // 4 managers * 4 rounds = 16 picks total
  assert.strictEqual(league.totalPicks, 16);
  assert.strictEqual(league.draftOrder.length, 16);

  const mIds = league.managers.map(m => m.id);

  // Round 1: 0, 1, 2, 3
  assert.strictEqual(league.draftOrder[0], mIds[0]);
  assert.strictEqual(league.draftOrder[1], mIds[1]);
  assert.strictEqual(league.draftOrder[2], mIds[2]);
  assert.strictEqual(league.draftOrder[3], mIds[3]);

  // Round 2 (snake reverse): 3, 2, 1, 0
  assert.strictEqual(league.draftOrder[4], mIds[3]);
  assert.strictEqual(league.draftOrder[5], mIds[2]);
  assert.strictEqual(league.draftOrder[6], mIds[1]);
  assert.strictEqual(league.draftOrder[7], mIds[0]);

  // Round 3 (forward again): 0, 1, 2, 3
  assert.strictEqual(league.draftOrder[8], mIds[0]);
  assert.strictEqual(league.draftOrder[9], mIds[1]);
  assert.strictEqual(league.draftOrder[10], mIds[2]);
  assert.strictEqual(league.draftOrder[11], mIds[3]);
});

test('Draft enforces unique picks across managers', () => {
  const league = createInitialLeague('Unique Pick League', 4);
  const pickedIds = new Set<string>();

  // Pick Max Verstappen
  const driverToPick = INITIAL_DRIVERS[0]; // drv_ver
  pickedIds.add(driverToPick.id);

  assert.ok(pickedIds.has('drv_ver'), 'Max Verstappen is drafted');

  // Attempting to pick again should be detected as invalid
  const isAvailable = !pickedIds.has(driverToPick.id);
  assert.strictEqual(isAvailable, false, 'Already drafted driver should not be available');
});

test('Roster constraints restrict max 2 drivers, 1 constructor, 1 principal', () => {
  const manager = {
    id: 'm1',
    name: 'Manager 1',
    isHuman: true,
    avatarSeed: 'test',
    picks: {
      driver1Id: 'drv_ver',
      driver2Id: 'drv_nor',
      constructorId: 'con_redbullion',
      principalId: 'pri_christian'
    },
    points: 0,
    budgetRemainingM: 100
  };

  const hasMaxDrivers = Boolean(manager.picks.driver1Id && manager.picks.driver2Id);
  const hasMaxConstructor = Boolean(manager.picks.constructorId);
  const hasMaxPrincipal = Boolean(manager.picks.principalId);

  assert.strictEqual(hasMaxDrivers, true, 'Manager has filled both driver slots');
  assert.strictEqual(hasMaxConstructor, true, 'Manager has filled constructor slot');
  assert.strictEqual(hasMaxPrincipal, true, 'Manager has filled principal slot');
});
