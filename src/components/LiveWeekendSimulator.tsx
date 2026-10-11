import React, { useState, useEffect, useRef } from 'react';
import {
  Flag,
  Play,
  Zap,
  ShieldAlert,
  Gauge,
  Timer,
  Trophy,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Car,
  FastForward,
  SkipForward
} from 'lucide-react';
import {
  PracticeSessionResult,
  QualifyingLap,
  RaceLapEvent,
  RaceResultEntry,
  RaceWeekend,
  SeasonState,
  TyreCompound
} from '../types/f1.js';

interface SimulatorProps {
  season: SeasonState;
  onRefreshSeason: () => void;
  onSelectTab: (tab: any) => void;
}

export const LiveWeekendSimulator: React.FC<SimulatorProps> = ({
  season,
  onRefreshSeason,
  onSelectTab
}) => {
  const currentWeekend: RaceWeekend | undefined =
    season.schedule[season.currentRound - 1] || season.schedule[season.schedule.length - 1];
  const circuit = currentWeekend?.circuit;

  const [loading, setLoading] = useState(false);
  const [advancingRound, setAdvancingRound] = useState(false);

  // Weekend data
  const [practiceData, setPracticeData] = useState<PracticeSessionResult[]>(currentWeekend?.practiceResults || []);
  const [qualifyingData, setQualifyingData] = useState<QualifyingLap[]>(currentWeekend?.qualifyingResults || []);
  const [raceData, setRaceData] = useState<RaceResultEntry[]>(currentWeekend?.raceResults || []);
  const [lapEvents, setLapEvents] = useState<RaceLapEvent[]>(currentWeekend?.lapEvents || []);

  // Live racing movement states
  const [isRacingLive, setIsRacingLive] = useState(false);
  const [currentLap, setCurrentLap] = useState<number>(currentWeekend?.raceCompleted ? (circuit?.laps || 57) : 0);
  const [simSpeed, setSimSpeed] = useState<number>(2); // 1x, 2x, 5x
  const [livePositions, setLivePositions] = useState<Array<{
    driverId: string;
    driverName: string;
    driverCode: string;
    driverNumber: number;
    teamId: string;
    teamName: string;
    teamColor: string;
    currentPos: number;
    startPos: number;
    delta: number;
    tyre: TyreCompound;
    tyreWear: number;
    pits: number;
    gap: string;
    status: string;
    statusReason?: string;
    points: number;
  }>>([]);

  const [activeSummaryTab, setActiveSummaryTab] = useState<'race' | 'qualifying' | 'practice'>('race');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (currentWeekend) {
      setPracticeData(currentWeekend.practiceResults || []);
      setQualifyingData(currentWeekend.qualifyingResults || []);
      setRaceData(currentWeekend.raceResults || []);
      setLapEvents(currentWeekend.lapEvents || []);
      if (currentWeekend.raceCompleted) {
        setCurrentLap(currentWeekend.circuit.laps);
        setIsRacingLive(false);
      } else {
        setCurrentLap(0);
      }
    }
  }, [currentWeekend, season.currentRound]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Initial live positions from grid or race results
  useEffect(() => {
    if (raceData.length > 0) {
      setLivePositions(
        raceData.map(r => ({
          driverId: r.driverId,
          driverName: r.driverName,
          driverCode: r.driverCode,
          driverNumber: r.driverNumber,
          teamId: r.teamId,
          teamName: r.teamName,
          teamColor: r.teamColor,
          currentPos: r.position,
          startPos: r.gridPosition,
          delta: r.positionsDelta,
          tyre: r.currentTyre,
          tyreWear: r.tyreWearPercent,
          pits: r.pitStops.length,
          gap: r.gapToWinner || 'WINNER',
          status: r.status,
          statusReason: r.statusReason,
          points: r.points
        }))
      );
    } else if (qualifyingData.length > 0) {
      setLivePositions(
        qualifyingData.map(q => ({
          driverId: q.driverId,
          driverName: q.driverName,
          driverCode: q.driverCode,
          driverNumber: season.drivers.find(d => d.id === q.driverId)?.number || 0,
          teamId: q.teamId,
          teamName: q.teamName,
          teamColor: q.teamColor,
          currentPos: q.position,
          startPos: q.position,
          delta: 0,
          tyre: 'Medium',
          tyreWear: 5,
          pits: 0,
          gap: q.gapFormatted,
          status: 'FINISHED',
          points: 0
        }))
      );
    }
  }, [raceData, qualifyingData, season.drivers]);

  // Click Simulate Full Race
  const handleSimulateFullRace = async () => {
    if (!circuit) return;
    setLoading(true);

    try {
      const res = await fetch('/api/season/simulate-race', { method: 'POST' });
      const data = await res.json();

      if (data.success && data.raceOutcome) {
        setPracticeData(data.practiceResults || []);
        setQualifyingData(data.qualifyingResults || []);
        setRaceData(data.raceOutcome.results || []);
        setLapEvents(data.raceOutcome.lapEvents || []);

        // Start from qualifying starting positions
        const initialOrder = (data.qualifyingResults || []).map((q: QualifyingLap) => ({
          driverId: q.driverId,
          driverName: q.driverName,
          driverCode: q.driverCode,
          driverNumber: season.drivers.find(d => d.id === q.driverId)?.number || 0,
          teamId: q.teamId,
          teamName: q.teamName,
          teamColor: q.teamColor,
          currentPos: q.position,
          startPos: q.position,
          delta: 0,
          tyre: 'Medium' as TyreCompound,
          tyreWear: 5,
          pits: 0,
          gap: q.gapFormatted,
          status: 'FINISHED',
          points: 0
        }));

        setLivePositions(initialOrder);
        setCurrentLap(1);
        setIsRacingLive(true);
      }
    } catch (err) {
      console.error('Race simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Live Lap Loop Runner
  useEffect(() => {
    if (!isRacingLive || !circuit) return;

    const intervalMs = Math.max(90, 450 / simSpeed);

    timerRef.current = setInterval(() => {
      setCurrentLap(prevLap => {
        const nextLap = prevLap + 1;

        if (nextLap >= circuit.laps) {
          clearInterval(timerRef.current);
          setIsRacingLive(false);

          // Settle positions to final race results
          if (raceData.length > 0) {
            setLivePositions(
              raceData.map(r => ({
                driverId: r.driverId,
                driverName: r.driverName,
                driverCode: r.driverCode,
                driverNumber: r.driverNumber,
                teamId: r.teamId,
                teamName: r.teamName,
                teamColor: r.teamColor,
                currentPos: r.position,
                startPos: r.gridPosition,
                delta: r.positionsDelta,
                tyre: r.currentTyre,
                tyreWear: r.tyreWearPercent,
                pits: r.pitStops.length,
                gap: r.gapToWinner || 'WINNER',
                status: r.status,
                statusReason: r.statusReason,
                points: r.points
              }))
            );
          }
          onRefreshSeason();
          return circuit.laps;
        }

        // Mid-race movement simulation
        setLivePositions(currentList => {
          const updated = [...currentList];
          const progress = nextLap / circuit.laps;

          // Blend starting pos towards final finish pos
          const finalMap = new Map(raceData.map(r => [r.driverId, r]));

          updated.sort((a, b) => {
            const targetA = finalMap.get(a.driverId)?.position ?? a.startPos;
            const targetB = finalMap.get(b.driverId)?.position ?? b.startPos;

            // Interpolate target position with minor stochastic jitter
            const scoreA = (a.startPos * (1 - progress)) + (targetA * progress) + (Math.random() * 0.6 - 0.3);
            const scoreB = (b.startPos * (1 - progress)) + (targetB * progress) + (Math.random() * 0.6 - 0.3);
            return scoreA - scoreB;
          });

          return updated.map((car, idx) => {
            const newPos = idx + 1;
            const finalCar = finalMap.get(car.driverId);
            return {
              ...car,
              currentPos: newPos,
              delta: car.startPos - newPos,
              tyreWear: Math.min(95, Math.round(progress * 80 + (idx % 3) * 5)),
              gap: newPos === 1 ? 'LEADER' : `+${((newPos - 1) * (0.8 + progress * 0.4)).toFixed(3)}s`,
              status: (finalCar && finalCar.status !== 'FINISHED' && progress > 0.6) ? finalCar.status : 'FINISHED'
            };
          });
        });

        return nextLap;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRacingLive, circuit, simSpeed, raceData]);

  // Skip Live Replay directly to finish
  const handleSkipToFinish = () => {
    if (!circuit || raceData.length === 0) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRacingLive(false);
    setCurrentLap(circuit.laps);
    setLivePositions(
      raceData.map(r => ({
        driverId: r.driverId,
        driverName: r.driverName,
        driverCode: r.driverCode,
        driverNumber: r.driverNumber,
        teamId: r.teamId,
        teamName: r.teamName,
        teamColor: r.teamColor,
        currentPos: r.position,
        startPos: r.gridPosition,
        delta: r.positionsDelta,
        tyre: r.currentTyre,
        tyreWear: r.tyreWearPercent,
        pits: r.pitStops.length,
        gap: r.gapToWinner || 'WINNER',
        status: r.status,
        statusReason: r.statusReason,
        points: r.points
      }))
    );
    onRefreshSeason();
  };

  // Proceed to next round or view final championship standings
  const handleAdvanceToNextRound = async () => {
    setAdvancingRound(true);
    try {
      const res = await fetch('/api/season/advance-round', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onRefreshSeason();
      }
      if (season.currentRound >= season.totalRounds || season.isCompleted) {
        onSelectTab('standings');
      }
    } catch (err) {
      console.error('Failed to advance round:', err);
      if (season.currentRound >= season.totalRounds || season.isCompleted) {
        onSelectTab('standings');
      }
    } finally {
      setAdvancingRound(false);
    }
  };

  const getTyreBadgeColor = (compound: TyreCompound) => {
    switch (compound) {
      case 'Soft': return 'text-red-400 bg-red-950/40 border-red-800/60';
      case 'Medium': return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      case 'Hard': return 'text-neutral-200 bg-neutral-900 border-neutral-700/60';
      case 'Intermediate': return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
      case 'Wet': return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60';
      default: return 'text-neutral-400 bg-neutral-900 border-neutral-800';
    }
  };

  if (!circuit) {
    return <div className="p-8 text-center text-neutral-400">Loading championship calendar...</div>;
  }

  // Summary calculations
  const poleSitter = qualifyingData[0];
  const raceWinner = raceData[0];
  const fastestLap = currentWeekend?.fastestLapHolder;
  const retirements = raceData.filter(r => r.status !== 'FINISHED');

  let biggestMover: RaceResultEntry | null = null;
  let maxGain = -999;
  for (const r of raceData) {
    if (r.status === 'FINISHED' && r.positionsDelta > maxGain) {
      maxGain = r.positionsDelta;
      biggestMover = r;
    }
  }

  const isRaceFinished = currentWeekend?.raceCompleted && !isRacingLive;

  return (
    <div className="space-y-6">
      {/* Season Finale Banner if all 24 rounds completed */}
      {season.isCompleted && (
        <div className="rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/40 p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold text-amber-400 tracking-wider">
                CHAMPIONSHIP FINALE COMPLETE · ALL 24 ROUNDS SIMULATED
              </div>
              <div className="text-base font-extrabold text-white">
                2026 World Champions Crowned & Prize Money Awarded
              </div>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('standings')}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-2 shadow transition-all shrink-0 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-black" />
            <span>View Final Championship Standings & Prize Money</span>
          </button>
        </div>
      )}

      {/* Circuit Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono uppercase tracking-wider mb-2">
              <span className="text-red-500 font-bold">Round {circuit.round} of {season.totalRounds}</span>
              <span>·</span>
              <span>{circuit.city}, {circuit.country}</span>
              <span>·</span>
              <span>{circuit.laps} Laps ({circuit.lapDistanceKm} km)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {circuit.name}
            </h1>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            {!currentWeekend?.raceCompleted && !isRacingLive && (
              <button
                onClick={handleSimulateFullRace}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 text-sm font-black text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-lg shadow-red-950/40"
              >
                <Zap className="w-4 h-4" />
                <span>{loading ? 'Simulating Weekend...' : 'Simulate Full Race'}</span>
              </button>
            )}

            {isRacingLive && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-red-400 animate-pulse flex items-center gap-1.5 mr-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  RACE IN PROGRESS
                </span>

                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-mono">
                  {[1, 2, 4].map(spd => (
                    <button
                      key={spd}
                      onClick={() => setSimSpeed(spd)}
                      className={`px-2 py-1 rounded ${simSpeed === spd ? 'bg-red-600 text-white font-bold' : 'text-neutral-400'}`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSkipToFinish}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Skip to Finish</span>
                </button>
              </div>
            )}

            {isRaceFinished && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleAdvanceToNextRound}
                  disabled={advancingRound}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer ${
                    season.currentRound >= season.totalRounds || season.isCompleted
                      ? 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-amber-900/40 ring-2 ring-amber-400/50'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {season.currentRound >= season.totalRounds || season.isCompleted ? (
                    <>
                      <Trophy className="w-4 h-4 text-black" />
                      <span>View Final Championship Standings & Prize Money</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Round {season.currentRound + 1}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Lap & Movement Telemetry Ticker */}
        {(isRacingLive || currentLap > 0) && (
          <div className="mt-5 pt-4 border-t border-neutral-800/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-neutral-400">RACE PROGRESS:</span>
              <span className="text-white font-bold text-sm tabular-nums">
                LAP {currentLap} / {circuit.laps}
              </span>
            </div>
            <div className="w-1/2 max-w-xs bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="bg-red-500 h-full transition-all duration-200"
                style={{ width: `${Math.min(100, (currentLap / circuit.laps) * 100)}%` }}
              />
            </div>
            <span className="text-neutral-400">
              {currentLap >= circuit.laps ? 'CHEQUERED FLAG 🏁' : 'GREEN FLAG 🟢'}
            </span>
          </div>
        )}
      </div>

      {/* RACE WEEKEND SUMMARY PANEL (Practices, Qualifying, Race Result - Race Centric) */}
      {isRaceFinished && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase mb-1">
                <Trophy className="w-4 h-4" />
                <span>Official Grand Prix Race Weekend Summary</span>
              </div>
              <h2 className="text-xl font-black text-white">
                {circuit.name} Weekend Classification
              </h2>
            </div>

            {/* Summary Tabs: Race Summary / Qualifying / Practices */}
            <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-semibold">
              <button
                onClick={() => setActiveSummaryTab('race')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  activeSummaryTab === 'race' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Race Highlights
              </button>
              <button
                onClick={() => setActiveSummaryTab('qualifying')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  activeSummaryTab === 'qualifying' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Qualifying Ladder
              </button>
              <button
                onClick={() => setActiveSummaryTab('practice')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  activeSummaryTab === 'practice' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Practice (FP1-FP3)
              </button>
            </div>
          </div>

          {/* TAB 1: Race Highlights Summary */}
          {activeSummaryTab === 'race' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                {/* Winner */}
                <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
                  <span className="text-neutral-400 block text-[10px] uppercase font-sans mb-1">
                    🥇 Race Winner (P1)
                  </span>
                  <h3 className="text-base font-black text-amber-400">{raceWinner?.driverName}</h3>
                  <p className="text-neutral-300 font-sans text-[11px]">{raceWinner?.teamName} · +25 PTS</p>
                </div>

                {/* Pole Position */}
                <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
                  <span className="text-neutral-400 block text-[10px] uppercase font-sans mb-1">
                    ⏱️ Pole Sitter
                  </span>
                  <h3 className="text-base font-black text-white">{poleSitter?.driverName}</h3>
                  <p className="text-neutral-300 font-sans text-[11px]">{poleSitter?.teamName} · {poleSitter?.lapTimeFormatted}</p>
                </div>

                {/* Fastest Lap */}
                <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
                  <span className="text-neutral-400 block text-[10px] uppercase font-sans mb-1">
                    ⚡ Fastest Lap (+1 PT)
                  </span>
                  <h3 className="text-base font-black text-purple-400">{fastestLap?.driverName}</h3>
                  <p className="text-neutral-300 font-sans text-[11px]">{fastestLap?.timeFormatted} (Lap {fastestLap?.lap})</p>
                </div>

                {/* Biggest Mover */}
                <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
                  <span className="text-neutral-400 block text-[10px] uppercase font-sans mb-1">
                    🚀 Biggest Mover
                  </span>
                  {biggestMover && biggestMover.positionsDelta > 0 ? (
                    <div>
                      <h3 className="text-base font-black text-emerald-400">{biggestMover.driverName}</h3>
                      <p className="text-neutral-300 font-sans text-[11px]">
                        P{biggestMover.gridPosition} → P{biggestMover.position} (+{biggestMover.positionsDelta} places)
                      </p>
                    </div>
                  ) : (
                    <p className="text-neutral-500 font-sans">Even grid retention</p>
                  )}
                </div>
              </div>

              {/* Incidents & Weather */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800">
                  <span className="text-neutral-400 font-mono font-bold block mb-2 uppercase">
                    Retirements & Mechanical Casualties ({retirements.length})
                  </span>
                  {retirements.length > 0 ? (
                    <ul className="space-y-1 text-red-300 font-mono text-[11px]">
                      {retirements.map(r => (
                        <li key={r.driverId}>
                          <strong>{r.driverName}</strong> ({r.teamName}): {r.statusReason || r.status}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-emerald-400">All 20 drivers completed the Grand Prix distance.</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 font-mono">
                  <span className="text-neutral-400 font-bold block mb-2 uppercase">
                    Grand Prix Strategy & Statistics
                  </span>
                  <div className="space-y-1 text-neutral-300 text-[11px]">
                    <p>Safety Car Periods: <strong className="text-white">{currentWeekend.safetyCarPeriods}</strong></p>
                    <p>Track Weather: <strong className="text-white">{currentWeekend.weather.condition} ({currentWeekend.weather.trackTempC}°C)</strong></p>
                    <p>Total Race Laps: <strong className="text-white">{circuit.laps}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Qualifying Ladder */}
          {activeSummaryTab === 'qualifying' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 font-mono text-neutral-400">
                    <th className="py-2 px-3">GRID POS</th>
                    <th className="py-2 px-3">DRIVER</th>
                    <th className="py-2 px-3">CONSTRUCTOR</th>
                    <th className="py-2 px-3 text-right">LAP TIME</th>
                    <th className="py-2 px-3 text-right">GAP TO POLE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850">
                  {qualifyingData.map(q => (
                    <tr key={q.driverId} className="hover:bg-neutral-850/50">
                      <td className="py-2 px-3 font-mono font-bold text-white">P{q.position}</td>
                      <td className="py-2 px-3 font-semibold text-white">{q.driverName}</td>
                      <td className="py-2 px-3 text-neutral-300">{q.teamName}</td>
                      <td className="py-2 px-3 text-right font-mono text-white">{q.lapTimeFormatted}</td>
                      <td className="py-2 px-3 text-right font-mono text-neutral-400">{q.gapFormatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Free Practice Sessions (FP1, FP2, FP3) */}
          {activeSummaryTab === 'practice' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              {practiceData.map(p => (
                <div key={p.session} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
                    <span className="font-bold text-white text-sm">{p.session} SESSION</span>
                    <span className="text-[10px] text-neutral-400">Fastest 5</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {p.top5.map(t => (
                      <div key={t.position} className="flex items-center justify-between">
                        <span className="text-neutral-400">P{t.position} {t.driverName}</span>
                        <span className="text-white">{t.lapTimeFormatted}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LIVE RUNNING 20-CAR MOVEMENT TOWER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Car className="w-4 h-4 text-red-500" />
            <span>
              {isRacingLive ? `Live Track Standings (Lap ${currentLap}/${circuit.laps})` : 'All 20 Grid Positions'}
            </span>
          </h2>
          <span className="text-xs font-mono text-neutral-400">
            20 Drivers Classified
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/60 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/80 text-neutral-400 font-mono">
                  <th className="py-2.5 px-3 w-10 text-center">POS</th>
                  <th className="py-2.5 px-2 w-12 text-center">GRID</th>
                  <th className="py-2.5 px-2 w-12 text-center">+/-</th>
                  <th className="py-2.5 px-3">DRIVER & NUMBER</th>
                  <th className="py-2.5 px-3">CONSTRUCTOR</th>
                  <th className="py-2.5 px-2 text-center">TYRE</th>
                  <th className="py-2.5 px-2 text-center">PITS</th>
                  <th className="py-2.5 px-3 text-right">GAP / INTERVAL</th>
                  <th className="py-2.5 px-3 text-right">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850/40">
                {livePositions.map((row) => {
                  const isLeader = row.currentPos === 1;
                  const isUserCar = row.teamId === season.userTeamId;
                  const isDnf = row.status !== 'FINISHED';

                  return (
                    <tr
                      key={row.driverId}
                      className={`transition-all duration-300 ${
                        isUserCar
                          ? 'bg-red-950/20 border-l-2 border-red-500'
                          : isLeader
                          ? 'bg-amber-950/10'
                          : 'hover:bg-neutral-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-bold font-mono tabular-nums text-white">
                        {row.currentPos}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono tabular-nums text-neutral-400">
                        P{row.startPos}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono tabular-nums">
                        {row.delta > 0 ? (
                          <span className="text-emerald-400 flex items-center justify-center gap-0.5">
                            <TrendingUp className="w-3 h-3" />
                            {row.delta}
                          </span>
                        ) : row.delta < 0 ? (
                          <span className="text-red-400 flex items-center justify-center gap-0.5">
                            <TrendingDown className="w-3 h-3" />
                            {Math.abs(row.delta)}
                          </span>
                        ) : (
                          <span className="text-neutral-500">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-1.5 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: row.teamColor }}
                          />
                          <span className="font-semibold text-white">
                            {row.driverName}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-400">
                            #{row.driverNumber}
                          </span>
                          {isUserCar && (
                            <span className="text-[9px] bg-red-900/60 text-red-200 border border-red-600/60 px-1 py-0.2 rounded font-mono font-bold">
                              YOUR TEAM
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-300 font-medium">
                        {row.teamName}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border font-mono ${getTyreBadgeColor(row.tyre)}`}>
                          {row.tyre[0]}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono tabular-nums text-neutral-400">
                        {row.pits}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {isDnf ? (
                          <span className="text-red-400 font-semibold" title={row.statusReason}>
                            {row.status.replace('DNF_', '')}
                          </span>
                        ) : (
                          <span className={row.currentPos === 1 ? 'text-amber-400 font-bold' : 'text-neutral-200'}>
                            {row.gap}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                        {row.points > 0 ? (
                          <span className="text-red-400">+{row.points}</span>
                        ) : (
                          <span className="text-neutral-600">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {livePositions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-500">
                      Grid awaiting race simulation. Click "Simulate Full Race" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
