export type WeatherCondition = 'Sunny' | 'Overcast' | 'Drizzle' | 'Heavy Rain';
export type TyreCompound = 'Soft' | 'Medium' | 'Hard' | 'Intermediate' | 'Wet';
export type RaceStatus = 'FINISHED' | 'DNF_ENGINE' | 'DNF_CRASH' | 'DNF_HYDRAULICS' | 'DNF_SUSPENSION' | 'DNF_PUNCTURE';

export interface DriverStats {
  pace: number;          // 50-99: Pure speed on single lap
  racecraft: number;     // 50-99: Overtaking & defending
  consistency: number;   // 50-99: Fewer errors & crashes
  tireManagement: number;// 50-99: Tire longevity
  wetSkill: number;      // 50-99: Performance in rain
  experience: number;    // 50-99: Setup bonus & stability
}

export interface Driver {
  id: string;
  name: string;
  code: string;          // 3-letter code e.g. VER, HAM, NOR
  number: number;
  country: string;
  countryCode: string;
  age: number;
  stats: DriverStats;
  morale: number;        // 0-100
  confidence: number;    // 0-100
  chemistry: number;     // 0-100
  salaryMillions: number;// Annual salary
  contractYears: number; // Years remaining
  developmentPotential: number; // 1-5 stars
  currentTeamId: string;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  dnfs: number;
}

export interface ConstructorUpgrades {
  aero: number;        // Level 0-5 (+points to aero)
  engine: number;      // Level 0-5 (+points to power)
  chassis: number;     // Level 0-5 (+points to balance)
  pitCrew: number;     // Level 0-5 (Reduces pit stop time & error)
}

export interface Constructor {
  id: string;
  name: string;
  shortName: string;
  country: string;
  countryCode: string;
  primaryColor: string;
  secondaryColor: string;
  powerUnitSupplier: string;
  baseAero: number;       // 60-99
  baseEngine: number;     // 60-99
  baseChassis: number;    // 60-99
  reliability: number;    // 60-99 (Engine & mechanical failure chance)
  pitCrewRating: number;  // 60-99 (Pit stop speed)
  developmentRate: number;// 60-99 (R&D speed)
  budgetRemainingM: number; // $140M cost cap balance
  upgrades: ConstructorUpgrades;
  driverIds: [string, string];
  principalId: string;
  points: number;
  wins: number;
  podiums: number;
}

export interface TeamPrincipal {
  id: string;
  name: string;
  nationality: string;
  teamId: string;
  leadership: number;   // 60-99
  tactics: number;      // 60-99
  developmentBoost: number; // 60-99
  salaryMillions: number;
  perkName: string;
  perkDescription: string;
}

export interface Circuit {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  round: number;
  laps: number;
  lapDistanceKm: number;
  downforce: 'Low' | 'Medium' | 'High' | 'Very High';
  tireDegradation: 'Low' | 'Medium' | 'High';
  overtakingEase: 'Easy' | 'Moderate' | 'Hard' | 'Extreme';
  safetyCarProbability: number; // 0.0 - 1.0
  rainProbability: number;      // 0.0 - 1.0
  baseLapTimeSec: number;
}

export interface QualifyingLap {
  position: number;
  driverId: string;
  driverName: string;
  driverCode: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  lapTimeSec: number;
  lapTimeFormatted: string;
  gapFormatted: string;
  eliminatedIn?: 'Q1' | 'Q2';
}

export interface PitStopEvent {
  lap: number;
  durationSec: number;
  compound: TyreCompound;
}

export interface RaceResultEntry {
  position: number;
  gridPosition: number;
  positionsDelta: number;
  driverId: string;
  driverName: string;
  driverCode: string;
  driverNumber: number;
  teamId: string;
  teamName: string;
  teamColor: string;
  status: RaceStatus;
  statusReason?: string;
  totalTimeSec?: number;
  gapToWinner?: string;
  points: number;
  fastestLap: boolean;
  fastestLapTimeSec?: number;
  fastestLapFormatted?: string;
  lapsCompleted: number;
  pitStops: PitStopEvent[];
  currentTyre: TyreCompound;
  tyreWearPercent: number;
}

export interface RaceLapEvent {
  lap: number;
  type: 'OVERTAKE' | 'PIT_STOP' | 'SAFETY_CAR' | 'VSC' | 'GREEN_FLAG' | 'DNF' | 'WEATHER_CHANGE' | 'FASTEST_LAP';
  driverId?: string;
  driverName?: string;
  teamColor?: string;
  message: string;
}

export interface PracticeSessionResult {
  session: 'FP1' | 'FP2' | 'FP3';
  leader: {
    driverId: string;
    driverName: string;
    driverCode: string;
    teamName: string;
    lapTimeFormatted: string;
  };
  top5: Array<{
    position: number;
    driverName: string;
    driverCode: string;
    teamName: string;
    lapTimeFormatted: string;
    gapFormatted: string;
  }>;
}

export interface RaceWeekend {
  round: number;
  circuit: Circuit;
  weather: {
    condition: WeatherCondition;
    trackTempC: number;
    airTempC: number;
    rainfallPercent: number;
  };
  practiceCompleted?: boolean;
  practiceResults?: PracticeSessionResult[];
  qualifyingCompleted: boolean;
  qualifyingResults: QualifyingLap[];
  raceCompleted: boolean;
  raceResults: RaceResultEntry[];
  lapEvents: RaceLapEvent[];
  safetyCarPeriods: number;
  virtualSafetyCarPeriods: number;
  fastestLapHolder?: {
    driverId: string;
    driverName: string;
    driverCode: string;
    teamName: string;
    lap: number;
    timeFormatted: string;
  };
}

export interface DriverStanding {
  rank: number;
  driverId: string;
  driverName: string;
  driverCode: string;
  driverNumber: number;
  teamId: string;
  teamName: string;
  teamColor: string;
  countryCode: string;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  dnfs: number;
}

export interface ConstructorStanding {
  rank: number;
  constructorId: string;
  name: string;
  shortName: string;
  primaryColor: string;
  countryCode: string;
  points: number;
  wins: number;
  podiums: number;
  drivers: string[];
}

export interface Standings {
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
}

export interface SeasonState {
  id: string;
  name: string;
  year: number;
  currentRound: number; // 1-24
  totalRounds: number;
  schedule: RaceWeekend[];
  drivers: Driver[];
  constructors: Constructor[];
  teamPrincipals: TeamPrincipal[];
  standings: Standings;
  userTeamId: string;
  userHasChosenTeam: boolean;
  userDraftedRoster?: {
    driver1Id: string;
    driver2Id: string;
    constructorId: string;
    principalId: string;
  };
  isCompleted: boolean;
  randomSeed?: number;
}

export interface LeagueManager {
  id: string;
  name: string;
  isHuman: boolean;
  avatarSeed: string;
  picks: {
    driver1Id?: string;
    driver2Id?: string;
    constructorId?: string;
    principalId?: string;
  };
  points: number;
  budgetRemainingM: number;
}

export interface DraftPick {
  overallPickNumber: number;
  roundNumber: number;
  pickInRound: number;
  managerId: string;
  managerName: string;
  assetType: 'DRIVER' | 'CONSTRUCTOR' | 'PRINCIPAL';
  assetId: string;
  assetName: string;
  assetMeta?: string;
  timestamp: string;
}

export interface League {
  id: string;
  name: string;
  createdAt: string;
  numberOfManagers: number;
  managers: LeagueManager[];
  draftStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  currentPickIndex: number;
  totalPicks: number;
  draftOrder: string[]; // sequence of managerIds in snake order
  picksHistory: DraftPick[];
  seasonId?: string;
}
