import test from 'node:test';
import assert from 'node:assert';
import {
  formatLapTime,
  getPointsForPosition,
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

test('SeededRandom produces identical sequence for same seed', () => {
  const rng1 = new SeededRandom(12345);
  const rng2 = new SeededRandom(12345);

  const seq1 = [rng1.next(), rng1.range(10, 50), rng1.int(1, 100)];
  const seq2 = [rng2.next(), rng2.range(10, 50), rng2.int(1, 100)];

  assert.deepStrictEqual(seq1, seq2, 'Random generator sequences must match exactly for identical seeds');
});

test('Points scoring matches standard Grand Prix regulations', () => {
  assert.strictEqual(getPointsForPosition(1), 25);
  assert.strictEqual(getPointsForPosition(2), 18);
  assert.strictEqual(getPointsForPosition(3), 15);
  assert.strictEqual(getPointsForPosition(4), 12);
  assert.strictEqual(getPointsForPosition(5), 10);
  assert.strictEqual(getPointsForPosition(6), 8);
  assert.strictEqual(getPointsForPosition(7), 6);
  assert.strictEqual(getPointsForPosition(8), 4);
  assert.strictEqual(getPointsForPosition(9), 2);
  assert.strictEqual(getPointsForPosition(10), 1);
  assert.strictEqual(getPointsForPosition(11), 0);
  assert.strictEqual(getPointsForPosition(20), 0);
});

test('Qualifying generates properly sorted 20-car grid', () => {
  const circuit = OFFICIAL_CIRCUITS[0]; // Bahrain
  const rng = new SeededRandom(999);

  const results = simulateQualifying(circuit, INITIAL_DRIVERS, INITIAL_CONSTRUCTORS, INITIAL_PRINCIPALS, rng);

  assert.strictEqual(results.length, 20, 'All 20 drivers must qualify');
  assert.strictEqual(results[0].position, 1, 'Pole position must be rank 1');
  assert.strictEqual(results[0].gapFormatted, 'POLE');

  // Verify times are strictly non-decreasing
  for (let i = 1; i < results.length; i++) {
    assert.ok(results[i].lapTimeSec >= results[i - 1].lapTimeSec, 'Qualifying times must be in ascending order');
    assert.strictEqual(results[i].position, i + 1);
  }
});

test('Race simulation produces valid classification and is reproducible with seed', () => {
  const circuit = OFFICIAL_CIRCUITS[0];
  const qRng = new SeededRandom(42);
  const grid = simulateQualifying(circuit, INITIAL_DRIVERS, INITIAL_CONSTRUCTORS, INITIAL_PRINCIPALS, qRng);

  const raceSeed = 777;
  const race1 = simulateRace(circuit, grid, INITIAL_DRIVERS, INITIAL_CONSTRUCTORS, INITIAL_PRINCIPALS, new SeededRandom(raceSeed));
  const race2 = simulateRace(circuit, grid, INITIAL_DRIVERS, INITIAL_CONSTRUCTORS, INITIAL_PRINCIPALS, new SeededRandom(raceSeed));

  assert.strictEqual(race1.results.length, 20, 'All 20 drivers must be in classification');
  assert.strictEqual(race1.results[0].position, 1, 'Winner is P1');
  assert.strictEqual(race1.results[0].gapToWinner, 'WINNER');

  // Compare race1 and race2 winners and full results for reproducibility
  assert.strictEqual(race1.results[0].driverId, race2.results[0].driverId, 'Same seed must produce identical race winner');
  assert.strictEqual(race1.results[1].driverId, race2.results[1].driverId, 'Same seed must produce identical P2');
  assert.strictEqual(race1.fastestLap.driverId, race2.fastestLap.driverId, 'Same seed must produce identical fastest lap holder');
  assert.strictEqual(race1.results[0].points, 25 + (race1.fastestLap.driverId === race1.results[0].driverId ? 1 : 0));
});

test('Lap time formatter outputs standard motorsport format', () => {
  assert.strictEqual(formatLapTime(90.123), '1:30.123');
  assert.strictEqual(formatLapTime(65.045), '1:05.045');
  assert.strictEqual(formatLapTime(124.500), '2:04.500');
});

test('Real official F1 team names and 20-car grid positions exist', () => {
  const teamNames = INITIAL_CONSTRUCTORS.map(c => c.name);
  assert.ok(teamNames.includes('Scuderia Ferrari HP'), 'Ferrari must be present');
  assert.ok(teamNames.includes('McLaren F1 Team'), 'McLaren must be present');
  assert.ok(teamNames.includes('Oracle Red Bull Racing'), 'Red Bull must be present');
  assert.ok(teamNames.includes('Mercedes-AMG PETRONAS F1 Team'), 'Mercedes must be present');

  const circuit = OFFICIAL_CIRCUITS[0];
  const qRng = new SeededRandom(111);
  const grid = simulateQualifying(circuit, INITIAL_DRIVERS, INITIAL_CONSTRUCTORS, INITIAL_PRINCIPALS, qRng);

  assert.strictEqual(grid.length, 20, 'Starting grid must have exactly 20 positions');

  const race = simulateRace(circuit, grid, INITIAL_DRIVERS, INITIAL_CONSTRUCTORS, INITIAL_PRINCIPALS, qRng);
  assert.strictEqual(race.results.length, 20, 'Race finish classification must have exactly 20 positions');

  // Verify all starting positions 1 through 20 are represented
  const startingPositions = race.results.map(r => r.gridPosition).sort((a, b) => a - b);
  assert.deepStrictEqual(startingPositions, Array.from({ length: 20 }, (_, i) => i + 1));

  // Verify delta equals gridPosition - finishPosition
  for (const row of race.results) {
    assert.strictEqual(row.positionsDelta, row.gridPosition - row.position);
  }
});
