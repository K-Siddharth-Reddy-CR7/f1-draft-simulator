import React, { useState } from 'react';
import {
  Wrench,
  DollarSign,
  TrendingUp,
  Award,
  Zap,
  Shield,
  Heart,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Constructor, Driver, SeasonState, TeamPrincipal } from '../types/f1.js';

interface TeamPaddockProps {
  season: SeasonState;
  onRefreshSeason: () => void;
}

export const TeamPaddock: React.FC<TeamPaddockProps> = ({
  season,
  onRefreshSeason
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(season.userTeamId || season.constructors[0].id);
  const [loadingUpgrade, setLoadingUpgrade] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const team: Constructor | undefined = season.constructors.find(c => c.id === selectedTeamId);
  const teamDrivers: Driver[] = season.drivers.filter(d => team?.driverIds.includes(d.id));
  const principal: TeamPrincipal | undefined = season.teamPrincipals.find(p => p.id === team?.principalId);

  const handleUpgrade = async (category: 'aero' | 'engine' | 'chassis' | 'pitCrew') => {
    if (!team) return;
    setLoadingUpgrade(category);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/season/team/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, teamId: team.id })
      });
      const data = await res.json();
      if (!data.success) {
        setFeedbackMessage({ type: 'error', text: data.error || 'Upgrade failed.' });
      } else {
        setFeedbackMessage({
          type: 'success',
          text: `Successfully upgraded ${category.toUpperCase()} to Level ${data.newLevel}!`
        });
        onRefreshSeason();
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Upgrade request error.' });
    } finally {
      setLoadingUpgrade(null);
    }
  };

  if (!team) {
    return <div className="p-8 text-center text-neutral-400">Loading team paddock...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Team Header & Switcher */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md"
              style={{ backgroundColor: team.primaryColor }}
            >
              {team.shortName.substring(0, 3).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
                <span>HEADQUARTERS</span>
                <span>·</span>
                <span>{team.country}</span>
                <span>·</span>
                <span>{team.powerUnitSupplier}</span>
              </div>
              <h1 className="text-2xl font-black text-white">{team.name}</h1>
            </div>
          </div>

          {/* Team Switcher dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 font-mono">PADDOCK TEAM:</span>
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-red-500"
            >
              {season.constructors.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget Cap & Season Metrics Strip */}
        <div className="mt-6 pt-6 border-t border-neutral-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-800/60">
            <span className="text-neutral-400 text-xs block mb-1">Cost Cap Balance</span>
            <span className="text-xl font-black text-emerald-400 font-mono tabular-nums">
              ${team.budgetRemainingM}M
            </span>
          </div>
          <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-800/60">
            <span className="text-neutral-400 text-xs block mb-1">Championship Points</span>
            <span className="text-xl font-black text-white font-mono tabular-nums">
              {team.points} PTS
            </span>
          </div>
          <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-800/60">
            <span className="text-neutral-400 text-xs block mb-1">Race Victories</span>
            <span className="text-xl font-black text-amber-400 font-mono tabular-nums">
              {team.wins} WINS
            </span>
          </div>
          <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-800/60">
            <span className="text-neutral-400 text-xs block mb-1">Reliability Rating</span>
            <span className="text-xl font-black text-neutral-200 font-mono tabular-nums">
              {team.reliability}/100
            </span>
          </div>
        </div>

        {feedbackMessage && (
          <div className={`mt-4 p-3 rounded-md text-xs font-mono border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-red-950/40 border-red-800/60 text-red-300'
          }`}>
            {feedbackMessage.text}
          </div>
        )}
      </div>

      {/* Driver Lineup Cards */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-red-500" />
          <span>Driver Cockpit & Morale</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamDrivers.map((driver) => (
            <div
              key={driver.id}
              className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-5 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-red-400 font-bold mb-1">
                    <span>CAR #{driver.number}</span>
                    <span>·</span>
                    <span>{driver.code}</span>
                  </div>
                  <h3 className="text-lg font-black text-white">{driver.name}</h3>
                  <p className="text-xs text-neutral-400">{driver.country} · {driver.age} years old</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-400 block font-mono">Contract</span>
                  <span className="text-sm font-bold text-white font-mono">${driver.salaryMillions}M/yr</span>
                  <span className="text-[11px] text-neutral-400 block">{driver.contractYears}y left</span>
                </div>
              </div>

              {/* Psychology & Condition Meters */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/60">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Morale</span>
                    <span className="text-white font-bold">{driver.morale}%</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${driver.morale}%` }}
                    />
                  </div>
                </div>

                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/60">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Confidence</span>
                    <span className="text-white font-bold">{driver.confidence}%</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full"
                      style={{ width: `${driver.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/60">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Chemistry</span>
                    <span className="text-white font-bold">{driver.chemistry}%</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${driver.chemistry}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Technical Ratings */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800/40">
                  <span className="text-neutral-400 text-[10px] block">RAW PACE</span>
                  <span className="text-white font-bold text-sm">{driver.stats.pace}</span>
                </div>
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800/40">
                  <span className="text-neutral-400 text-[10px] block">RACECRAFT</span>
                  <span className="text-white font-bold text-sm">{driver.stats.racecraft}</span>
                </div>
                <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800/40">
                  <span className="text-neutral-400 text-[10px] block">TIRE MGMT</span>
                  <span className="text-white font-bold text-sm">{driver.stats.tireManagement}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* R&D Development Trees */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-red-500" />
          <span>Aerodynamic & Powertrain Development Lab</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Aero Upgrade */}
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-4 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-neutral-400">AERODYNAMICS</span>
                <span className="text-xs font-mono font-bold text-white">
                  LVL {team.upgrades.aero}/5
                </span>
              </div>
              <h3 className="font-bold text-white text-base mb-1">Front Wing & Venturi Floors</h3>
              <p className="text-xs text-neutral-400 mb-3">
                Current Rating: <span className="text-white font-bold font-mono">{team.baseAero + (team.upgrades.aero * 2)}</span>
              </p>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <div
                    key={lvl}
                    className={`h-2 flex-1 rounded-sm ${
                      lvl <= team.upgrades.aero ? 'bg-red-500' : 'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => handleUpgrade('aero')}
              disabled={team.upgrades.aero >= 5 || loadingUpgrade === 'aero'}
              className="w-full py-2 text-xs font-semibold rounded bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white transition-colors"
            >
              {team.upgrades.aero >= 5 ? 'Max Level' : `Upgrade ($${8 + (team.upgrades.aero * 3)}M)`}
            </button>
          </div>

          {/* Engine Upgrade */}
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-4 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-neutral-400">POWER UNIT</span>
                <span className="text-xs font-mono font-bold text-white">
                  LVL {team.upgrades.engine}/5
                </span>
              </div>
              <h3 className="font-bold text-white text-base mb-1">Turbocharger & MGU-K</h3>
              <p className="text-xs text-neutral-400 mb-3">
                Current Rating: <span className="text-white font-bold font-mono">{team.baseEngine + (team.upgrades.engine * 2)}</span>
              </p>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <div
                    key={lvl}
                    className={`h-2 flex-1 rounded-sm ${
                      lvl <= team.upgrades.engine ? 'bg-amber-500' : 'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => handleUpgrade('engine')}
              disabled={team.upgrades.engine >= 5 || loadingUpgrade === 'engine'}
              className="w-full py-2 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white transition-colors"
            >
              {team.upgrades.engine >= 5 ? 'Max Level' : `Upgrade ($${8 + (team.upgrades.engine * 3)}M)`}
            </button>
          </div>

          {/* Chassis Upgrade */}
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-4 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-neutral-400">CHASSIS</span>
                <span className="text-xs font-mono font-bold text-white">
                  LVL {team.upgrades.chassis}/5
                </span>
              </div>
              <h3 className="font-bold text-white text-base mb-1">Suspension Geometry</h3>
              <p className="text-xs text-neutral-400 mb-3">
                Current Rating: <span className="text-white font-bold font-mono">{team.baseChassis + (team.upgrades.chassis * 2)}</span>
              </p>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <div
                    key={lvl}
                    className={`h-2 flex-1 rounded-sm ${
                      lvl <= team.upgrades.chassis ? 'bg-cyan-500' : 'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => handleUpgrade('chassis')}
              disabled={team.upgrades.chassis >= 5 || loadingUpgrade === 'chassis'}
              className="w-full py-2 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white transition-colors"
            >
              {team.upgrades.chassis >= 5 ? 'Max Level' : `Upgrade ($${8 + (team.upgrades.chassis * 3)}M)`}
            </button>
          </div>

          {/* Pit Crew Training */}
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-4 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-neutral-400">PIT CREW</span>
                <span className="text-xs font-mono font-bold text-white">
                  LVL {team.upgrades.pitCrew}/5
                </span>
              </div>
              <h3 className="font-bold text-white text-base mb-1">Gantry & Drill Equipment</h3>
              <p className="text-xs text-neutral-400 mb-3">
                Current Rating: <span className="text-white font-bold font-mono">{team.pitCrewRating + (team.upgrades.pitCrew * 2)}</span>
              </p>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <div
                    key={lvl}
                    className={`h-2 flex-1 rounded-sm ${
                      lvl <= team.upgrades.pitCrew ? 'bg-emerald-500' : 'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => handleUpgrade('pitCrew')}
              disabled={team.upgrades.pitCrew >= 5 || loadingUpgrade === 'pitCrew'}
              className="w-full py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white transition-colors"
            >
              {team.upgrades.pitCrew >= 5 ? 'Max Level' : `Upgrade ($${8 + (team.upgrades.pitCrew * 3)}M)`}
            </button>
          </div>
        </div>
      </div>

      {/* Team Principal Profile */}
      {principal && (
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-neutral-400 block mb-1">
              TEAM PRINCIPAL · {principal.nationality}
            </span>
            <h3 className="text-lg font-bold text-white">{principal.name}</h3>
            <p className="text-xs text-amber-400 font-semibold my-1">{principal.perkName}</p>
            <p className="text-xs text-neutral-400 max-w-xl">{principal.perkDescription}</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-neutral-400 block">LEADERSHIP</span>
              <span className="text-white font-bold">{principal.leadership}</span>
            </div>
            <div className="text-right border-l border-neutral-800 pl-4">
              <span className="text-neutral-400 block">TACTICS</span>
              <span className="text-white font-bold">{principal.tactics}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
