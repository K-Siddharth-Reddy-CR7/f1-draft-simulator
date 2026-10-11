import React, { useState } from 'react';
import {
  Trophy,
  Calendar,
  ChevronRight,
  Zap,
  CheckCircle2,
  Clock,
  Flag,
  Award,
  DollarSign,
  Coins,
  Shield,
  Sparkles,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import {
  ConstructorStanding,
  DriverStanding,
  RaceWeekend,
  SeasonState
} from '../types/f1.js';

interface StandingsCalendarProps {
  season: SeasonState;
  onRefreshSeason: () => void;
  onSelectRound?: (round: number) => void;
}

// Official FIA Formula 1 Prize Distribution for Constructors (Concorde Fund: $1,000,000,000)
export const CONSTRUCTOR_PRIZE_MONEY: Record<number, number> = {
  1: 140_000_000,
  2: 131_000_000,
  3: 122_000_000,
  4: 113_000_000,
  5: 104_000_000,
  6: 95_000_000,
  7: 87_000_000,
  8: 78_000_000,
  9: 69_000_000,
  10: 61_000_000,
};

// Driver Performance Bonus & Championship Prize Pool ($116,500,000)
export const DRIVER_PRIZE_MONEY: Record<number, number> = {
  1: 25_000_000,
  2: 18_000_000,
  3: 14_000_000,
  4: 11_000_000,
  5: 9_000_000,
  6: 7_500_000,
  7: 6_000_000,
  8: 5_000_000,
  9: 4_000_000,
  10: 3_200_000,
  11: 2_500_000,
  12: 2_000_000,
  13: 1_700_000,
  14: 1_400_000,
  15: 1_200_000,
  16: 1_000_000,
  17: 900_000,
  18: 800_000,
  19: 700_000,
  20: 600_000,
};

export const formatCurrency = (amount: number): string => {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  return `$${(amount / 1_000).toFixed(0)}K`;
};

export const formatFullCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

export const StandingsCalendar: React.FC<StandingsCalendarProps> = ({
  season,
  onRefreshSeason,
  onSelectRound
}) => {
  // If season is completed, default to showing both standings and prize money!
  const [activeTab, setActiveTab] = useState<'both' | 'constructors' | 'drivers' | 'calendar'>('both');
  const [selectedHistoricalRace, setSelectedHistoricalRace] = useState<RaceWeekend | null>(null);
  const [simulatingToEnd, setSimulatingToEnd] = useState(false);

  const handleSimulateToEnd = async () => {
    if (!confirm('Simulate all remaining rounds in the 2026 World Championship?')) return;
    setSimulatingToEnd(true);
    try {
      const res = await fetch('/api/season/simulate-to-end', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onRefreshSeason();
        setActiveTab('both');
      }
    } catch (err) {
      console.error('Failed to simulate to end:', err);
    } finally {
      setSimulatingToEnd(false);
    }
  };

  const driversList = season.standings.drivers || [];
  const constructorsList = season.standings.constructors || [];
  const championDriver = driversList[0];
  const championConstructor = constructorsList[0];

  // User's team and prize metrics
  const userTeam = season.constructors.find(c => c.id === season.userTeamId);
  const userConstructorStanding = constructorsList.find(c => c.constructorId === season.userTeamId);
  const userRank = userConstructorStanding?.rank || 1;
  const userTeamPrize = CONSTRUCTOR_PRIZE_MONEY[userRank] || 61_000_000;
  const userDrivers = driversList.filter(d => userTeam?.driverIds.includes(d.driverId));
  const userDriversPrize = userDrivers.reduce((acc, d) => acc + (DRIVER_PRIZE_MONEY[d.rank] || 600_000), 0);
  const userTotalPrize = userTeamPrize + userDriversPrize;

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-2">
              <span className="text-red-500 font-bold tracking-wider">
                2026 OFFICIAL FIA PITWALL HQ WORLD CHAMPIONSHIP
              </span>
              <span>·</span>
              <span className="text-white font-bold">
                {season.isCompleted
                  ? 'SEASON FINALE (24/24 COMPLETED)'
                  : `ROUND ${season.currentRound} OF ${season.totalRounds}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Championship Standings & Prize Money</span>
              {season.isCompleted && (
                <span className="text-xs bg-amber-500 text-black font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  Official Final Results
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Selector Tabs */}
            <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('both')}
                className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'both'
                    ? 'bg-red-600 text-white shadow-sm font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>Both Standings & Prize Money</span>
              </button>
              <button
                onClick={() => setActiveTab('constructors')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'constructors'
                    ? 'bg-neutral-800 text-white shadow-sm font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Constructors (WCC)
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'drivers'
                    ? 'bg-neutral-800 text-white shadow-sm font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Drivers (WDC)
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'bg-neutral-800 text-white shadow-sm font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Race Calendar ({season.schedule.filter(s => s.raceCompleted).length}/{season.totalRounds})
              </button>
            </div>

            {!season.isCompleted && (
              <button
                onClick={handleSimulateToEnd}
                disabled={simulatingToEnd}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors shadow-sm cursor-pointer shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Sim to Finale</span>
              </button>
            )}
          </div>
        </div>

        {/* Season Champion & Prize Money Showcase */}
        <div className="mt-6 pt-6 border-t border-neutral-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Driver Champion Card */}
          <div className="bg-gradient-to-br from-amber-950/40 via-neutral-900/90 to-neutral-950 p-4 rounded-xl border border-amber-600/40 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-amber-400 tracking-wider flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                {season.isCompleted ? "WORLD DRIVERS' CHAMPION" : 'WDC LEADER'}
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                +{formatCurrency(DRIVER_PRIZE_MONEY[1])} BONUS
              </span>
            </div>
            <h3 className="text-lg font-black text-white">{championDriver?.driverName}</h3>
            <p className="text-xs text-neutral-300 font-medium">{championDriver?.teamName}</p>
            <div className="mt-3 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold">{championDriver?.points} PTS</span>
              <span className="text-neutral-400">{championDriver?.wins} Wins · {championDriver?.podiums} Podiums</span>
            </div>
          </div>

          {/* Constructor Champion Card */}
          <div className="bg-gradient-to-br from-red-950/40 via-neutral-900/90 to-neutral-950 p-4 rounded-xl border border-red-600/40 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-red-400 tracking-wider flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                {season.isCompleted ? "WORLD CONSTRUCTORS' CHAMPIONS" : 'WCC LEADER'}
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-mono font-bold">
                {formatCurrency(CONSTRUCTOR_PRIZE_MONEY[1])} PRIZE
              </span>
            </div>
            <h3 className="text-lg font-black text-white">{championConstructor?.name}</h3>
            <p className="text-xs text-neutral-300 font-medium">
              {championConstructor?.drivers.join(' & ')}
            </p>
            <div className="mt-3 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs font-mono">
              <span className="text-red-400 font-bold">{championConstructor?.points} PTS</span>
              <span className="text-neutral-400">{championConstructor?.wins} Wins · {championConstructor?.podiums} Podiums</span>
            </div>
          </div>

          {/* Your Team Financial & Standings Card */}
          {userTeam && userConstructorStanding && (
            <div className="bg-gradient-to-br from-emerald-950/40 via-neutral-900/90 to-neutral-950 p-4 rounded-xl border border-emerald-600/40 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  YOUR PRINCIPAL PAYOUT
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  P{userRank} FINISH
                </span>
              </div>
              <h3 className="text-lg font-black text-white">{userTeam.name}</h3>
              <p className="text-xs text-emerald-400 font-mono font-bold">
                {formatFullCurrency(userTotalPrize)} Total Earned
              </p>
              <div className="mt-3 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-300">WCC: {formatCurrency(userTeamPrize)}</span>
                <span className="text-neutral-300">Drivers: {formatCurrency(userDriversPrize)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW: BOTH STANDINGS & PRIZE MONEY (Full Gala View) */}
      {activeTab === 'both' && (
        <div className="space-y-8">
          {/* SECTION 1: WORLD CONSTRUCTORS' CHAMPIONSHIP & PRIZE MONEY */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600" />
                <h2 className="text-lg font-black text-white tracking-wide uppercase">
                  World Constructors' Championship (WCC) & FIA Prize Fund
                </h2>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                Official $1,000,000,000 FIA Concorde Distribution Pool
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/60 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/90 text-neutral-400 font-mono">
                      <th className="py-3 px-4 w-12 text-center">POS</th>
                      <th className="py-3 px-4">CONSTRUCTOR</th>
                      <th className="py-3 px-4">DRIVER LINEUP</th>
                      <th className="py-3 px-3 text-center">WINS</th>
                      <th className="py-3 px-3 text-center">PODIUMS</th>
                      <th className="py-3 px-4 text-right">POINTS</th>
                      <th className="py-3 px-4 text-right font-bold text-amber-400">PRIZE MONEY</th>
                      <th className="py-3 px-3 text-center">SHARE</th>
                      <th className="py-3 px-3 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40">
                    {constructorsList.map((team) => {
                      const prize = CONSTRUCTOR_PRIZE_MONEY[team.rank] || 61_000_000;
                      const sharePct = ((prize / 1_000_000_000) * 100).toFixed(1);
                      const isUser = team.constructorId === season.userTeamId;
                      const isChampion = team.rank === 1;

                      return (
                        <tr
                          key={team.constructorId}
                          className={`hover:bg-neutral-800/40 transition-colors ${
                            isChampion
                              ? 'bg-amber-950/20'
                              : isUser
                              ? 'bg-red-950/20'
                              : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center font-mono font-bold tabular-nums">
                            {team.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-black font-black text-xs">
                                1
                              </span>
                            ) : team.rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-300 text-black font-black text-xs">
                                2
                              </span>
                            ) : team.rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs">
                                3
                              </span>
                            ) : (
                              <span className="text-white text-sm font-semibold">P{team.rank}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-2.5 h-5 rounded-sm shrink-0"
                                style={{ backgroundColor: team.primaryColor }}
                              />
                              <div>
                                <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                                  <span>{team.name}</span>
                                  {isUser && (
                                    <span className="text-[9px] bg-red-900/60 text-red-200 border border-red-600/60 px-1 py-0.2 rounded font-mono font-bold">
                                      YOUR TEAM
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-neutral-300">
                            {team.drivers.join(' · ')}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono tabular-nums text-neutral-200">
                            {team.wins}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono tabular-nums text-neutral-200">
                            {team.podiums}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-red-400 tabular-nums">
                            {team.points}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-400 tabular-nums">
                            {formatFullCurrency(prize)}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono text-neutral-400 tabular-nums">
                            {sharePct}%
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {isChampion ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono">
                                🏆 WORLD CHAMPIONS
                              </span>
                            ) : team.rank <= 3 ? (
                              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 text-[10px] font-bold font-mono">
                                PODIUM FINISH
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-500 font-mono">
                                Top 10 Payout
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 2: WORLD DRIVERS' CHAMPIONSHIP & PRIZE BONUSES */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <h2 className="text-lg font-black text-white tracking-wide uppercase">
                  World Drivers' Championship (WDC) & Driver Bonuses
                </h2>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                Official $116,500,000 Driver Performance Bonus Pool
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/60 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/90 text-neutral-400 font-mono">
                      <th className="py-3 px-4 w-12 text-center">POS</th>
                      <th className="py-3 px-4">DRIVER</th>
                      <th className="py-3 px-4">CONSTRUCTOR</th>
                      <th className="py-3 px-3 text-center">WINS</th>
                      <th className="py-3 px-3 text-center">PODIUMS</th>
                      <th className="py-3 px-3 text-center">POLES</th>
                      <th className="py-3 px-3 text-center">FL</th>
                      <th className="py-3 px-3 text-center">DNF</th>
                      <th className="py-3 px-4 text-right">POINTS</th>
                      <th className="py-3 px-4 text-right font-bold text-amber-400">DRIVER PRIZE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40">
                    {driversList.map((driver) => {
                      const prize = DRIVER_PRIZE_MONEY[driver.rank] || 600_000;
                      const isChampion = driver.rank === 1;
                      const isUserDriver = userTeam?.driverIds.includes(driver.driverId);

                      return (
                        <tr
                          key={driver.driverId}
                          className={`hover:bg-neutral-800/40 transition-colors ${
                            isChampion
                              ? 'bg-amber-950/20'
                              : isUserDriver
                              ? 'bg-red-950/20'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                            {driver.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-black font-black text-xs">
                                1
                              </span>
                            ) : driver.rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-300 text-black font-black text-xs">
                                2
                              </span>
                            ) : driver.rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs">
                                3
                              </span>
                            ) : (
                              <span className="text-white text-xs font-semibold">P{driver.rank}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-1.5 h-4 rounded-full"
                                style={{ backgroundColor: driver.teamColor }}
                              />
                              <span className="font-bold text-white text-sm">{driver.driverName}</span>
                              <span className="text-[11px] font-mono text-neutral-400">
                                #{driver.driverNumber} · {driver.driverCode}
                              </span>
                              {isUserDriver && (
                                <span className="text-[9px] bg-red-900/60 text-red-200 border border-red-600/60 px-1 py-0.2 rounded font-mono font-bold">
                                  YOUR DRIVER
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-neutral-300 font-medium">
                            {driver.teamName}
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-neutral-200">
                            {driver.wins}
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-neutral-200">
                            {driver.podiums}
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-neutral-400">
                            {driver.poles}
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-neutral-400">
                            {driver.fastestLaps}
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-neutral-500">
                            {driver.dnfs}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-red-400 tabular-nums">
                            {driver.points}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-sm text-amber-400 tabular-nums">
                            {formatFullCurrency(prize)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CONSTRUCTORS STANDINGS ONLY */}
      {activeTab === 'constructors' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/60 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/90 text-neutral-400 font-mono">
                    <th className="py-3 px-4 w-12 text-center">POS</th>
                    <th className="py-3 px-4">CONSTRUCTOR</th>
                    <th className="py-3 px-4">DRIVER LINEUP</th>
                    <th className="py-3 px-3 text-center">WINS</th>
                    <th className="py-3 px-3 text-center">PODIUMS</th>
                    <th className="py-3 px-4 text-right">POINTS</th>
                    <th className="py-3 px-4 text-right font-bold text-amber-400">PRIZE MONEY</th>
                    <th className="py-3 px-3 text-center">SHARE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40">
                  {constructorsList.map((team) => {
                    const prize = CONSTRUCTOR_PRIZE_MONEY[team.rank] || 61_000_000;
                    const sharePct = ((prize / 1_000_000_000) * 100).toFixed(1);
                    const isUser = team.constructorId === season.userTeamId;
                    const isChampion = team.rank === 1;

                    return (
                      <tr
                        key={team.constructorId}
                        className={`hover:bg-neutral-800/40 transition-colors ${
                          isChampion
                            ? 'bg-amber-950/20'
                            : isUser
                            ? 'bg-red-950/20'
                            : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center font-mono font-bold tabular-nums">
                          {team.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-black font-black text-xs">
                              1
                            </span>
                          ) : (
                            <span className="text-white text-sm font-semibold">P{team.rank}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-2.5 h-5 rounded-sm shrink-0"
                              style={{ backgroundColor: team.primaryColor }}
                            />
                            <span className="font-extrabold text-white text-sm">{team.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-300">
                          {team.drivers.join(' · ')}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono tabular-nums text-neutral-200">
                          {team.wins}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono tabular-nums text-neutral-200">
                          {team.podiums}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-red-400 tabular-nums">
                          {team.points}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-400 tabular-nums">
                          {formatFullCurrency(prize)}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-neutral-400 tabular-nums">
                          {sharePct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: DRIVERS STANDINGS ONLY */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/60 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/90 text-neutral-400 font-mono">
                    <th className="py-3 px-4 w-12 text-center">POS</th>
                    <th className="py-3 px-4">DRIVER</th>
                    <th className="py-3 px-4">CONSTRUCTOR</th>
                    <th className="py-3 px-3 text-center">WINS</th>
                    <th className="py-3 px-3 text-center">PODIUMS</th>
                    <th className="py-3 px-3 text-center">POLES</th>
                    <th className="py-3 px-3 text-center">FL</th>
                    <th className="py-3 px-3 text-center">DNF</th>
                    <th className="py-3 px-4 text-right">PTS</th>
                    <th className="py-3 px-4 text-right font-bold text-amber-400">PRIZE BONUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40">
                  {driversList.map((driver) => {
                    const prize = DRIVER_PRIZE_MONEY[driver.rank] || 600_000;
                    const isChampion = driver.rank === 1;

                    return (
                      <tr
                        key={driver.driverId}
                        className={`hover:bg-neutral-800/40 transition-colors ${
                          isChampion ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-white">
                          {driver.rank}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-1.5 h-4 rounded-full"
                              style={{ backgroundColor: driver.teamColor }}
                            />
                            <span className="font-bold text-white text-sm">{driver.driverName}</span>
                            <span className="text-[11px] font-mono text-neutral-400">
                              #{driver.driverNumber} · {driver.driverCode}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-300 font-medium">
                          {driver.teamName}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-neutral-200">
                          {driver.wins}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-neutral-200">
                          {driver.podiums}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-neutral-400">
                          {driver.poles}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-neutral-400">
                          {driver.fastestLaps}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-neutral-500">
                          {driver.dnfs}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-sm text-red-400 tabular-nums">
                          {driver.points}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm text-amber-400 tabular-nums">
                          {formatFullCurrency(prize)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: RACE CALENDAR (24 ROUNDS) */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {season.schedule.map((weekend) => {
            const isCompleted = weekend.raceCompleted;
            const isCurrent = weekend.round === season.currentRound && !isCompleted;
            const winner = weekend.raceResults[0];

            return (
              <div
                key={weekend.round}
                className={`rounded-xl border p-4 transition-all ${
                  isCurrent
                    ? 'border-red-500/80 bg-neutral-900/90 shadow-md ring-1 ring-red-500/30'
                    : isCompleted
                    ? 'border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700 cursor-pointer'
                    : 'border-neutral-850/60 bg-neutral-950/40 opacity-70'
                }`}
                onClick={() => {
                  if (isCompleted) setSelectedHistoricalRace(weekend);
                }}
              >
                <div className="flex items-center justify-between mb-2 text-xs font-mono">
                  <span className={isCurrent ? 'text-red-400 font-bold' : 'text-neutral-500'}>
                    ROUND {weekend.round}
                  </span>
                  {isCompleted ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>COMPLETED</span>
                    </span>
                  ) : isCurrent ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>UP NEXT</span>
                    </span>
                  ) : (
                    <span className="text-neutral-600">UPCOMING</span>
                  )}
                </div>

                <h3 className="font-bold text-white text-base mb-1">{weekend.circuit.name}</h3>
                <p className="text-xs text-neutral-400 mb-3">
                  {weekend.circuit.city}, {weekend.circuit.country} · {weekend.circuit.laps} Laps
                </p>

                {isCompleted && winner && (
                  <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-neutral-500 text-[11px] block">Winner</span>
                      <span className="font-bold text-white">{winner.driverName}</span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {winner.teamName}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Historical Race Details Modal */}
      {selectedHistoricalRace && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-red-500 font-bold block mb-1">
                  ROUND {selectedHistoricalRace.round} RESULTS
                </span>
                <h2 className="text-xl font-black text-white">
                  {selectedHistoricalRace.circuit.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedHistoricalRace(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-800 rounded-md cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 font-mono text-neutral-400">
                    <th className="py-2 px-3">POS</th>
                    <th className="py-2 px-3">DRIVER</th>
                    <th className="py-2 px-3">TEAM</th>
                    <th className="py-2 px-3 text-right">GAP</th>
                    <th className="py-2 px-3 text-right">POINTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40">
                  {selectedHistoricalRace.raceResults.map(r => (
                    <tr key={r.driverId} className="hover:bg-neutral-850">
                      <td className="py-2 px-3 font-mono font-bold text-white">{r.position}</td>
                      <td className="py-2 px-3 font-semibold text-white">{r.driverName}</td>
                      <td className="py-2 px-3 text-neutral-300">{r.teamName}</td>
                      <td className="py-2 px-3 text-right font-mono text-neutral-400">{r.gapToWinner}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-red-400">+{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
