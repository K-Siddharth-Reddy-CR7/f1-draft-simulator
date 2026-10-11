import {
  Circuit,
  Constructor,
  Driver,
  QualifyingLap,
  RaceLapEvent,
  RaceResultEntry,
  RaceStatus,
  RaceWeekend,
  Standings,
  TeamPrincipal,
  TyreCompound,
  WeatherCondition
} from '../../types/f1.js';

// Deterministic PRNG using Mulberry32
export class SeededRandom {
  private state: number;

  constructor(seed: number = Date.now()) {
    this.state = seed >>> 0;
  }

  // Returns number in [0, 1)
  next(): number {
    this.state = (this.state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Float between min and max
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Integer between min and max inclusive
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // True with probability p (0-1)
  chance(p: number): boolean {
    return this.next() < p;
  }

  // Pick one item from array
  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

export function formatLapTime(timeSec: number): string {
  const minutes = Math.floor(timeSec / 60);
  const seconds = (timeSec % 60).toFixed(3);
  const padSec = parseFloat(seconds) < 10 ? `0${seconds}` : seconds;
  return `${minutes}:${padSec}`;
}

export function getPointsForPosition(pos: number): number {
  switch (pos) {
    case 1: return 25;
    case 2: return 18;
    case 3: return 15;
    case 4: return 12;
    case 5: return 10;
    case 6: return 8;
    case 7: return 6;
    case 8: return 4;
    case 9: return 2;
    case 10: return 1;
    default: return 0;
  }
}

// Compute total car performance index for a circuit
export function computeCarPerformance(constructor: Constructor, circuit: Circuit, principal?: TeamPrincipal): number {
  let aeroWeight = 0.35;
  let engineWeight = 0.35;
  let chassisWeight = 0.30;

  if (circuit.downforce === 'Low') {
    engineWeight = 0.50;
    aeroWeight = 0.25;
    chassisWeight = 0.25;
  } else if (circuit.downforce === 'Very High') {
    aeroWeight = 0.45;
    chassisWeight = 0.35;
    engineWeight = 0.20;
  }

  const aeroScore = constructor.baseAero + (constructor.upgrades.aero * 1.8);
  const engineScore = constructor.baseEngine + (constructor.upgrades.engine * 1.8);
  const chassisScore = constructor.baseChassis + (constructor.upgrades.chassis * 1.8);

  let total = (aeroScore * aeroWeight) + (engineScore * engineWeight) + (chassisScore * chassisWeight);

  if (principal && principal.perkName === 'Aerodynamic Synergy' && (circuit.downforce === 'High' || circuit.downforce === 'Very High')) {
    total += 1.5;
  }

  return total;
}

// Run Free Practice Sessions (FP1, FP2, FP3)
export function simulatePracticeSessions(
  circuit: Circuit,
  drivers: Driver[],
  constructors: Constructor[],
  principals: TeamPrincipal[],
  rng: SeededRandom
) {
  const sessions: Array<'FP1' | 'FP2' | 'FP3'> = ['FP1', 'FP2', 'FP3'];
  const teamMap = new Map(constructors.map(c => [c.id, c]));

  return sessions.map((session, sIdx) => {
    const times = drivers.map(d => {
      const team = teamMap.get(d.currentTeamId) || constructors[0];
      const carPerf = computeCarPerformance(team, circuit);
      const score = (carPerf * 0.5) + (d.stats.pace * 0.4) + rng.range(-3, 3);
      const timeSec = circuit.baseLapTimeSec + ((100 - score) * 0.09) + rng.range(0.4, 1.8) + (2 - sIdx) * 0.35;
      return {
        driver: d,
        team,
        timeSec
      };
    }).sort((a, b) => a.timeSec - b.timeSec);

    const leaderTime = times[0].timeSec;
    const top5 = times.slice(0, 5).map((t, idx) => ({
      position: idx + 1,
      driverName: t.driver.name,
      driverCode: t.driver.code,
      teamName: t.team.shortName,
      lapTimeFormatted: formatLapTime(t.timeSec),
      gapFormatted: idx === 0 ? 'LEADER' : `+${(t.timeSec - leaderTime).toFixed(3)}s`
    }));

    return {
      session,
      leader: {
        driverId: times[0].driver.id,
        driverName: times[0].driver.name,
        driverCode: times[0].driver.code,
        teamName: times[0].team.shortName,
        lapTimeFormatted: formatLapTime(times[0].timeSec)
      },
      top5
    };
  });
}

// Run Qualifying Session
export function simulateQualifying(
  circuit: Circuit,
  drivers: Driver[],
  constructors: Constructor[],
  principals: TeamPrincipal[],
  rng: SeededRandom
): QualifyingLap[] {
  const teamMap = new Map(constructors.map(c => [c.id, c]));
  const principalMap = new Map(principals.map(p => [p.teamId, p]));

  const rawTimes: Array<{
    driver: Driver;
    team: Constructor;
    timeSec: number;
  }> = [];

  for (const driver of drivers) {
    const team = teamMap.get(driver.currentTeamId) || constructors[0];
    const principal = principalMap.get(team.id);

    const carPerf = computeCarPerformance(team, circuit, principal);
    const driverPace = driver.stats.pace;
    const consistency = driver.stats.consistency;
    const confidence = driver.confidence;

    // Combined score (higher is faster)
    const combinedScore = (carPerf * 0.55) + (driverPace * 0.35) + (confidence * 0.10);

    // Delta per point around ~0.08s per index point
    const baseGap = (100 - combinedScore) * 0.085;

    // Consistency introduces small random variance (less variance if higher consistency)
    const varianceRange = (100 - consistency) * 0.007;
    const variance = rng.range(-varianceRange, varianceRange);

    const timeSec = circuit.baseLapTimeSec + baseGap + variance;

    rawTimes.push({
      driver,
      team,
      timeSec
    });
  }

  // Sort ascending by lap time
  rawTimes.sort((a, b) => a.timeSec - b.timeSec);
  const poleTime = rawTimes[0].timeSec;

  return rawTimes.map((entry, index) => {
    const position = index + 1;
    const gap = entry.timeSec - poleTime;
    const gapFormatted = position === 1 ? 'POLE' : `+${gap.toFixed(3)}s`;

    let eliminatedIn: 'Q1' | 'Q2' | undefined;
    if (position > 15) eliminatedIn = 'Q1';
    else if (position > 10) eliminatedIn = 'Q2';

    return {
      position,
      driverId: entry.driver.id,
      driverName: entry.driver.name,
      driverCode: entry.driver.code,
      teamId: entry.team.id,
      teamName: entry.team.shortName,
      teamColor: entry.team.primaryColor,
      lapTimeSec: entry.timeSec,
      lapTimeFormatted: formatLapTime(entry.timeSec),
      gapFormatted,
      eliminatedIn
    };
  });
}

// Run Full Race Simulation
export function simulateRace(
  circuit: Circuit,
  qualifyingGrid: QualifyingLap[],
  drivers: Driver[],
  constructors: Constructor[],
  principals: TeamPrincipal[],
  rng: SeededRandom
): {
  results: RaceResultEntry[];
  lapEvents: RaceLapEvent[];
  safetyCars: number;
  virtualSafetyCars: number;
  fastestLap: { driverId: string; driverName: string; driverCode: string; teamName: string; lap: number; timeFormatted: string };
  weather: { condition: WeatherCondition; trackTempC: number; airTempC: number; rainfallPercent: number };
} {
  const driverMap = new Map(drivers.map(d => [d.id, d]));
  const teamMap = new Map(constructors.map(c => [c.id, c]));
  const principalMap = new Map(principals.map(p => [p.teamId, p]));

  // Generate race weather
  const isRain = rng.chance(circuit.rainProbability);
  let weatherCondition: WeatherCondition = 'Sunny';
  let rainfall = 0;
  let trackTemp = rng.int(32, 48);
  let airTemp = rng.int(22, 33);

  if (isRain) {
    if (rng.chance(0.4)) {
      weatherCondition = 'Heavy Rain';
      rainfall = rng.int(60, 95);
      trackTemp = rng.int(18, 24);
      airTemp = rng.int(16, 21);
    } else {
      weatherCondition = 'Drizzle';
      rainfall = rng.int(20, 50);
      trackTemp = rng.int(22, 28);
      airTemp = rng.int(19, 24);
    }
  } else if (rng.chance(0.35)) {
    weatherCondition = 'Overcast';
    trackTemp = rng.int(25, 34);
    airTemp = rng.int(20, 26);
  }

  // Starting tyre compound
  let startingCompound: TyreCompound = 'Medium';
  if (weatherCondition === 'Heavy Rain') startingCompound = 'Wet';
  else if (weatherCondition === 'Drizzle') startingCompound = 'Intermediate';
  else {
    startingCompound = rng.chance(0.4) ? 'Soft' : 'Medium';
  }

  // Setup initial car states based on qualifying grid
  interface ActiveCar {
    driver: Driver;
    team: Constructor;
    gridPosition: number;
    currentPosition: number;
    status: RaceStatus;
    statusReason?: string;
    totalTimeSec: number;
    gapToLeaderSec: number;
    tyreCompound: TyreCompound;
    tyreWear: number; // 0-100%
    pitStops: Array<{ lap: number; durationSec: number; compound: TyreCompound }>;
    lapsCompleted: number;
    bestLapSec: number;
    bestLapNum: number;
  }

  const cars: ActiveCar[] = qualifyingGrid.map(q => {
    const driver = driverMap.get(q.driverId)!;
    const team = teamMap.get(q.teamId)!;
    return {
      driver,
      team,
      gridPosition: q.position,
      currentPosition: q.position,
      status: 'FINISHED',
      totalTimeSec: 0,
      gapToLeaderSec: (q.position - 1) * 0.4, // initial staggered start
      tyreCompound: startingCompound,
      tyreWear: 5,
      pitStops: [],
      lapsCompleted: 0,
      bestLapSec: 99999,
      bestLapNum: 0
    };
  });

  const lapEvents: RaceLapEvent[] = [];
  let safetyCars = 0;
  let virtualSafetyCars = 0;
  let isUnderSC = false;
  let scCountdown = 0;

  const totalLaps = circuit.laps;

  // Stint lap loop
  for (let lap = 1; lap <= totalLaps; lap++) {
    // Check if safety car ends
    if (isUnderSC) {
      scCountdown--;
      if (scCountdown <= 0) {
        isUnderSC = false;
        lapEvents.push({
          lap,
          type: 'GREEN_FLAG',
          message: 'Safety car in this lap! Green flag racing resumes.'
        });
      }
    }

    // Random Safety Car check if not already active
    if (!isUnderSC && rng.chance(circuit.safetyCarProbability * 0.035)) {
      isUnderSC = true;
      scCountdown = rng.int(2, 4);
      safetyCars++;
      lapEvents.push({
        lap,
        type: 'SAFETY_CAR',
        message: 'SAFETY CAR DEPLOYED! Track marshals responding to debris on circuit.'
      });
    }

    // Weather change mid-race (low chance for thrilling drama)
    if (lap === Math.floor(totalLaps * 0.45) && rng.chance(circuit.rainProbability * 0.6) && weatherCondition === 'Sunny') {
      weatherCondition = 'Drizzle';
      rainfall = 35;
      lapEvents.push({
        lap,
        type: 'WEATHER_CHANGE',
        message: 'Weather alert: Rain reported in Sector 2! Teams preparing intermediate tires.'
      });
    }

    // Process each running car
    for (const car of cars) {
      if (car.status !== 'FINISHED') continue; // car has retired

      car.lapsCompleted = lap;
      const principal = principalMap.get(car.team.id);

      // Tyre wear calculation
      const wearRate = (circuit.tireDegradation === 'High' ? 2.5 : circuit.tireDegradation === 'Medium' ? 1.8 : 1.2) *
        (1 - (car.driver.stats.tireManagement - 50) * 0.005);
      car.tyreWear += wearRate;

      // Base lap pace calculation
      const carPerf = computeCarPerformance(car.team, circuit, principal);
      let driverSkill = (car.driver.stats.pace * 0.5) + (car.driver.stats.racecraft * 0.5);

      if (weatherCondition === 'Drizzle' || weatherCondition === 'Heavy Rain') {
        driverSkill = (car.driver.stats.wetSkill * 0.7) + (car.driver.stats.pace * 0.3);
      }

      // Penalty if wrong tires in rain
      let tyreGripPenalty = 0;
      if (weatherCondition === 'Heavy Rain' && car.tyreCompound !== 'Wet') tyreGripPenalty = 12.0;
      else if (weatherCondition === 'Drizzle' && car.tyreCompound !== 'Intermediate' && car.tyreCompound !== 'Wet') tyreGripPenalty = 6.0;
      else if ((weatherCondition === 'Sunny' || weatherCondition === 'Overcast') && (car.tyreCompound === 'Wet' || car.tyreCompound === 'Intermediate')) tyreGripPenalty = 5.0;

      // Deg penalty
      const degPenalty = Math.max(0, (car.tyreWear - 50) * 0.04);

      // Base lap time for this lap
      let lapTimeSec = circuit.baseLapTimeSec + ((100 - carPerf) * 0.07) + ((100 - driverSkill) * 0.05) + tyreGripPenalty + degPenalty;

      if (isUnderSC) {
        lapTimeSec += 15.0; // Slower under safety car
      } else {
        lapTimeSec += rng.range(-0.4, 0.4);
      }

      car.totalTimeSec += lapTimeSec;

      // Track fastest lap
      if (!isUnderSC && lapTimeSec < car.bestLapSec) {
        car.bestLapSec = lapTimeSec;
        car.bestLapNum = lap;
      }

      // Reliability & Collision check
      // Mechanical failure chance per lap (affected by constructor reliability)
      const reliabilityScore = car.team.reliability;
      const mechanicalRisk = (100 - reliabilityScore) * 0.0007;

      if (rng.chance(mechanicalRisk)) {
        const failureTypes: RaceStatus[] = ['DNF_ENGINE', 'DNF_HYDRAULICS', 'DNF_SUSPENSION'];
        car.status = rng.pick(failureTypes);
        const reason = car.status === 'DNF_ENGINE' ? 'Engine failure - smoke billowing from airbox' :
                       car.status === 'DNF_HYDRAULICS' ? 'Loss of hydraulic pressure' : 'Suspension failure over kerbs';
        car.statusReason = reason;

        lapEvents.push({
          lap,
          type: 'DNF',
          driverId: car.driver.id,
          driverName: car.driver.name,
          teamColor: car.team.primaryColor,
          message: `${car.driver.name} has retired with ${reason}!`
        });
        continue;
      }

      // Collision risk (higher with low driver consistency and hard overtaking circuits)
      const collisionRisk = (100 - car.driver.stats.consistency) * 0.0004;
      if (rng.chance(collisionRisk)) {
        car.status = 'DNF_CRASH';
        car.statusReason = 'Heavy impact into barriers';
        lapEvents.push({
          lap,
          type: 'DNF',
          driverId: car.driver.id,
          driverName: car.driver.name,
          teamColor: car.team.primaryColor,
          message: `YELLOW FLAG: ${car.driver.name} loses control and crashes into barriers at Turn 4!`
        });
        // Trigger safety car if not already out
        if (!isUnderSC) {
          isUnderSC = true;
          scCountdown = 3;
          safetyCars++;
          lapEvents.push({
            lap,
            type: 'SAFETY_CAR',
            message: 'SAFETY CAR deployed following barrier damage.'
          });
        }
        continue;
      }

      // Pit Stop Logic
      const shouldPitForTyreWear = car.tyreWear > 75;
      const needsWetTyres = (weatherCondition === 'Drizzle' && car.tyreCompound !== 'Intermediate') ||
                            (weatherCondition === 'Heavy Rain' && car.tyreCompound !== 'Wet');
      const needsDryTyres = (weatherCondition === 'Sunny' || weatherCondition === 'Overcast') && (car.tyreCompound === 'Intermediate' || car.tyreCompound === 'Wet');

      if ((shouldPitForTyreWear || needsWetTyres || needsDryTyres) && lap < totalLaps - 3) {
        // Decide next compound
        let nextCompound: TyreCompound = 'Hard';
        if (weatherCondition === 'Heavy Rain') nextCompound = 'Wet';
        else if (weatherCondition === 'Drizzle') nextCompound = 'Intermediate';
        else {
          nextCompound = car.tyreCompound === 'Soft' ? 'Medium' : car.tyreCompound === 'Medium' ? 'Hard' : 'Soft';
        }

        // Pit stop execution time based on pit crew rating
        const pitCrewRating = car.team.pitCrewRating + (car.team.upgrades.pitCrew * 2);
        let stopTime = 2.2 + ((100 - pitCrewRating) * 0.035);

        // Principal perk bonus
        if (principal && principal.perkName === 'Lightning Pit Execution') {
          stopTime -= 0.35;
        }

        // Possible stop error
        if (rng.chance(0.04)) {
          stopTime += rng.range(2.0, 4.5); // Sticky wheel nut!
        }

        const pitTransit = isUnderSC ? 12.0 : 20.5; // Under SC, pit stops cost much less track position
        const totalStopPenalty = stopTime + pitTransit;
        car.totalTimeSec += totalStopPenalty;
        car.tyreWear = 0;
        car.tyreCompound = nextCompound;

        car.pitStops.push({
          lap,
          durationSec: parseFloat(stopTime.toFixed(2)),
          compound: nextCompound
        });

        lapEvents.push({
          lap,
          type: 'PIT_STOP',
          driverId: car.driver.id,
          driverName: car.driver.name,
          teamColor: car.team.primaryColor,
          message: `${car.driver.name} pits for ${nextCompound} tires (${stopTime.toFixed(2)}s stationary).`
        });
      }
    }

    // Sort running cars periodically for overtake events
    const running = cars.filter(c => c.status === 'FINISHED').sort((a, b) => a.totalTimeSec - b.totalTimeSec);
    running.forEach((car, idx) => {
      const prevPos = car.currentPosition;
      car.currentPosition = idx + 1;

      // Emit overtakes for top 8 positions
      if (prevPos > car.currentPosition && car.currentPosition <= 8 && !isUnderSC && rng.chance(0.4)) {
        lapEvents.push({
          lap,
          type: 'OVERTAKE',
          driverId: car.driver.id,
          driverName: car.driver.name,
          teamColor: car.team.primaryColor,
          message: `${car.driver.name} makes a bold move up the inside into P${car.currentPosition}!`
        });
      }
    });
  }

  // Final race sorting
  const finishedCars = cars.filter(c => c.status === 'FINISHED').sort((a, b) => a.totalTimeSec - b.totalTimeSec);
  const retiredCars = cars.filter(c => c.status !== 'FINISHED').sort((a, b) => b.lapsCompleted - a.lapsCompleted);
  const allClassified = [...finishedCars, ...retiredCars];

  const winnerTime = finishedCars[0]?.totalTimeSec || 5000;

  // Find overall fastest lap among classified drivers
  let bestLapDriver = allClassified[0];
  let overallBestLapTime = 99999;
  for (const car of allClassified) {
    if (car.bestLapSec < overallBestLapTime) {
      overallBestLapTime = car.bestLapSec;
      bestLapDriver = car;
    }
  }

  // Format race results
  const results: RaceResultEntry[] = allClassified.map((car, index) => {
    const position = index + 1;
    const isFinished = car.status === 'FINISHED';
    const delta = car.gridPosition - position;

    let gapToWinner = 'DNF';
    if (isFinished) {
      if (position === 1) gapToWinner = 'WINNER';
      else {
        const gapSec = car.totalTimeSec - winnerTime;
        gapToWinner = `+${gapSec.toFixed(3)}s`;
      }
    }

    let points = isFinished ? getPointsForPosition(position) : 0;
    const isFastestLap = bestLapDriver.driver.id === car.driver.id;

    // Fastest lap extra point awarded if finished inside Top 10
    if (isFastestLap && position <= 10 && isFinished) {
      points += 1;
    }

    return {
      position,
      gridPosition: car.gridPosition,
      positionsDelta: delta,
      driverId: car.driver.id,
      driverName: car.driver.name,
      driverCode: car.driver.code,
      driverNumber: car.driver.number,
      teamId: car.team.id,
      teamName: car.team.shortName,
      teamColor: car.team.primaryColor,
      status: car.status,
      statusReason: car.statusReason,
      totalTimeSec: car.totalTimeSec,
      gapToWinner,
      points,
      fastestLap: isFastestLap,
      fastestLapTimeSec: car.bestLapSec,
      fastestLapFormatted: formatLapTime(car.bestLapSec),
      lapsCompleted: car.lapsCompleted,
      pitStops: car.pitStops,
      currentTyre: car.tyreCompound,
      tyreWearPercent: Math.min(100, Math.round(car.tyreWear))
    };
  });

  const fastestLapInfo = {
    driverId: bestLapDriver.driver.id,
    driverName: bestLapDriver.driver.name,
    driverCode: bestLapDriver.driver.code,
    teamName: bestLapDriver.team.shortName,
    lap: bestLapDriver.bestLapNum || Math.floor(circuit.laps * 0.8),
    timeFormatted: formatLapTime(overallBestLapTime)
  };

  return {
    results,
    lapEvents: lapEvents.slice(0, 50), // Keep clean curated highlight log
    safetyCars,
    virtualSafetyCars,
    fastestLap: fastestLapInfo,
    weather: {
      condition: weatherCondition,
      trackTempC: trackTemp,
      airTempC: airTemp,
      rainfallPercent: rainfall
    }
  };
}

// Update championship standings and driver progression
export function applyRaceResultsToSeason(
  raceWeekend: RaceWeekend,
  drivers: Driver[],
  constructors: Constructor[],
  principals: TeamPrincipal[]
): {
  updatedDrivers: Driver[];
  updatedConstructors: Constructor[];
  standings: Standings;
} {
  const driverMap = new Map(drivers.map(d => [d.id, { ...d }]));
  const constructorMap = new Map(constructors.map(c => [c.id, { ...c }]));

  for (const entry of raceWeekend.raceResults) {
    const driver = driverMap.get(entry.driverId);
    const constructor = constructorMap.get(entry.teamId);

    if (driver) {
      driver.points += entry.points;
      if (entry.position === 1) driver.wins += 1;
      if (entry.position <= 3 && entry.status === 'FINISHED') driver.podiums += 1;
      if (entry.gridPosition === 1) driver.poles += 1;
      if (entry.fastestLap) driver.fastestLaps += 1;
      if (entry.status !== 'FINISHED') driver.dnfs += 1;

      // Morale & Confidence adjustments
      if (entry.position === 1) {
        driver.morale = Math.min(100, driver.morale + 6);
        driver.confidence = Math.min(100, driver.confidence + 5);
      } else if (entry.position <= 3) {
        driver.morale = Math.min(100, driver.morale + 4);
        driver.confidence = Math.min(100, driver.confidence + 3);
      } else if (entry.status === 'DNF_CRASH') {
        driver.morale = Math.max(40, driver.morale - 8);
        driver.confidence = Math.max(40, driver.confidence - 7);
      } else if (entry.status !== 'FINISHED') {
        driver.morale = Math.max(50, driver.morale - 4);
      }

      // Rookie & Young Driver dynamic development
      if (driver.age <= 24 && driver.developmentPotential >= 4) {
        if (Math.random() < 0.25) {
          driver.stats.racecraft = Math.min(99, driver.stats.racecraft + 1);
        }
        if (Math.random() < 0.20) {
          driver.stats.experience = Math.min(99, driver.stats.experience + 1);
        }
      }
    }

    if (constructor) {
      constructor.points += entry.points;
      if (entry.position === 1) constructor.wins += 1;
      if (entry.position <= 3 && entry.status === 'FINISHED') constructor.podiums += 1;
    }
  }

  // Update WDC standings
  const updatedDriversList = Array.from(driverMap.values());
  const sortedDrivers = [...updatedDriversList].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.podiums - a.podiums;
  });

  const driverStandings = sortedDrivers.map((driver, index) => {
    const team = constructorMap.get(driver.currentTeamId);
    return {
      rank: index + 1,
      driverId: driver.id,
      driverName: driver.name,
      driverCode: driver.code,
      driverNumber: driver.number,
      teamId: driver.currentTeamId,
      teamName: team?.shortName || 'Privateer',
      teamColor: team?.primaryColor || '#FFFFFF',
      countryCode: driver.countryCode,
      points: driver.points,
      wins: driver.wins,
      podiums: driver.podiums,
      poles: driver.poles,
      fastestLaps: driver.fastestLaps,
      dnfs: driver.dnfs
    };
  });

  // Update WCC standings
  const updatedConstructorsList = Array.from(constructorMap.values());
  const sortedConstructors = [...updatedConstructorsList].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.podiums - a.podiums;
  });

  const constructorStandings = sortedConstructors.map((team, index) => ({
    rank: index + 1,
    constructorId: team.id,
    name: team.name,
    shortName: team.shortName,
    primaryColor: team.primaryColor,
    countryCode: team.countryCode,
    points: team.points,
    wins: team.wins,
    podiums: team.podiums,
    drivers: team.driverIds.map(dId => driverMap.get(dId)?.code || '')
  }));

  return {
    updatedDrivers: updatedDriversList,
    updatedConstructors: updatedConstructorsList,
    standings: {
      drivers: driverStandings,
      constructors: constructorStandings
    }
  };
}
