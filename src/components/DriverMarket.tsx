import React, { useState } from 'react';
import {
  Users,
  Search,
  Scale,
  ArrowRightLeft,
  Award,
  Sparkles,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { Driver, Constructor, TeamPrincipal } from '../types/f1.js';
import {
  INITIAL_CONSTRUCTORS,
  INITIAL_DRIVERS,
  INITIAL_PRINCIPALS
} from '../server/data/f1-grid.js';

export const DriverMarket: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'drivers' | 'constructors' | 'principals' | 'compare'>('drivers');
  const [searchQuery, setSearchQuery] = useState('');

  // Comparison driver selections
  const [compareDriverAId, setCompareDriverAId] = useState<string>('drv_ver');
  const [compareDriverBId, setCompareDriverBId] = useState<string>('drv_nor');

  const driverA = INITIAL_DRIVERS.find(d => d.id === compareDriverAId) || INITIAL_DRIVERS[0];
  const driverB = INITIAL_DRIVERS.find(d => d.id === compareDriverBId) || INITIAL_DRIVERS[1];

  const filteredDrivers = INITIAL_DRIVERS.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConstructors = INITIAL_CONSTRUCTORS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.powerUnitSupplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrincipals = INITIAL_PRINCIPALS.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.perkName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderComparisonRow = (label: string, valA: number, valB: number) => {
    const diff = valA - valB;
    return (
      <div className="flex items-center justify-between py-2 border-b border-neutral-800/60 text-xs font-mono">
        <span className={`w-16 font-bold tabular-nums text-right ${valA > valB ? 'text-emerald-400' : valA < valB ? 'text-neutral-400' : 'text-neutral-200'}`}>
          {valA}
        </span>
        <div className="flex-1 mx-4 text-center">
          <span className="text-neutral-400 font-sans">{label}</span>
          {diff !== 0 && (
            <span className={`ml-2 text-[10px] ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ({diff > 0 ? `+${diff}` : diff})
            </span>
          )}
        </div>
        <span className={`w-16 font-bold tabular-nums text-left ${valB > valA ? 'text-emerald-400' : valB < valA ? 'text-neutral-400' : 'text-neutral-200'}`}>
          {valB}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-2">
              <span className="text-red-500 font-bold">GRID DATABASE</span>
              <span>·</span>
              <span>20 DRIVERS · 10 CONSTRUCTORS · 10 PRINCIPALS</span>
            </div>
            <h1 className="text-2xl font-black text-white">Personnel & Specifications</h1>
          </div>

          <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'drivers' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Drivers
            </button>
            <button
              onClick={() => setActiveTab('constructors')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'constructors' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Constructors
            </button>
            <button
              onClick={() => setActiveTab('principals')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'principals' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Principals
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'compare' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
          </div>
        </div>
      </div>

      {/* Head to Head Driver Comparison Mode */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Driver A Selector */}
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-5 space-y-3">
              <span className="text-xs font-mono text-neutral-400 block">SELECT DRIVER A</span>
              <select
                value={compareDriverAId}
                onChange={e => setCompareDriverAId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2 text-sm text-white font-bold"
              >
                {INITIAL_DRIVERS.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code} #{d.number}) - {d.country}
                  </option>
                ))}
              </select>
              <div className="pt-2">
                <h3 className="text-xl font-black text-white">{driverA.name}</h3>
                <p className="text-xs text-neutral-400">${driverA.salaryMillions}M/yr · {driverA.age} years old · {driverA.contractYears}y contract</p>
              </div>
            </div>

            {/* Driver B Selector */}
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-5 space-y-3">
              <span className="text-xs font-mono text-neutral-400 block">SELECT DRIVER B</span>
              <select
                value={compareDriverBId}
                onChange={e => setCompareDriverBId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2 text-sm text-white font-bold"
              >
                {INITIAL_DRIVERS.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code} #{d.number}) - {d.country}
                  </option>
                ))}
              </select>
              <div className="pt-2">
                <h3 className="text-xl font-black text-white">{driverB.name}</h3>
                <p className="text-xs text-neutral-400">${driverB.salaryMillions}M/yr · {driverB.age} years old · {driverB.contractYears}y contract</p>
              </div>
            </div>
          </div>

          {/* Comparative Metrics Table */}
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-6 shadow-xl max-w-2xl mx-auto">
            <h3 className="text-sm font-bold text-center uppercase tracking-wider text-neutral-400 font-mono mb-4">
              Head-to-Head Telemetry Breakdown
            </h3>
            <div className="space-y-1">
              {renderComparisonRow('Single Lap Pace', driverA.stats.pace, driverB.stats.pace)}
              {renderComparisonRow('Wheel-to-Wheel Racecraft', driverA.stats.racecraft, driverB.stats.racecraft)}
              {renderComparisonRow('Driving Consistency', driverA.stats.consistency, driverB.stats.consistency)}
              {renderComparisonRow('Tire Degradation Management', driverA.stats.tireManagement, driverB.stats.tireManagement)}
              {renderComparisonRow('Wet Weather Skill', driverA.stats.wetSkill, driverB.stats.wetSkill)}
              {renderComparisonRow('Experience & Setup Mastery', driverA.stats.experience, driverB.stats.experience)}
              {renderComparisonRow('Current Cockpit Morale', driverA.morale, driverB.morale)}
              {renderComparisonRow('Self Confidence', driverA.confidence, driverB.confidence)}
            </div>
          </div>
        </div>
      )}

      {/* Drivers List View */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredDrivers.map(d => (
            <div key={d.id} className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-4 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-red-500">#{d.number} · {d.code}</span>
                  <span className="text-xs font-mono text-neutral-400">{d.countryCode}</span>
                </div>
                <h3 className="font-bold text-white text-base">{d.name}</h3>
                <p className="text-xs text-neutral-400 mb-3">${d.salaryMillions}M/yr · {d.age}yo</p>

                <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-center mb-3">
                  <div className="bg-neutral-950/60 p-1.5 rounded border border-neutral-800/40">
                    <span className="text-neutral-400 block text-[10px]">PACE</span>
                    <span className="text-white font-bold">{d.stats.pace}</span>
                  </div>
                  <div className="bg-neutral-950/60 p-1.5 rounded border border-neutral-800/40">
                    <span className="text-neutral-400 block text-[10px]">CRAFT</span>
                    <span className="text-white font-bold">{d.stats.racecraft}</span>
                  </div>
                  <div className="bg-neutral-950/60 p-1.5 rounded border border-neutral-800/40">
                    <span className="text-neutral-400 block text-[10px]">WET</span>
                    <span className="text-white font-bold">{d.stats.wetSkill}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>Morale: {d.morale}%</span>
                <span>Pot: {'★'.repeat(d.developmentPotential)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Constructors View */}
      {activeTab === 'constructors' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConstructors.map(c => (
            <div key={c.id} className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.primaryColor }} />
                <div>
                  <h3 className="font-bold text-white text-base">{c.name}</h3>
                  <span className="text-xs text-neutral-400">{c.country}</span>
                </div>
              </div>
              <p className="text-xs text-neutral-400 font-mono">Engine: {c.powerUnitSupplier}</p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60">
                  <span className="text-neutral-400 block text-[10px]">AERO</span>
                  <span className="text-white font-bold">{c.baseAero}</span>
                </div>
                <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60">
                  <span className="text-neutral-400 block text-[10px]">ENGINE</span>
                  <span className="text-white font-bold">{c.baseEngine}</span>
                </div>
                <div className="bg-neutral-950 p-2 rounded border border-neutral-800/60">
                  <span className="text-neutral-400 block text-[10px]">CHASSIS</span>
                  <span className="text-white font-bold">{c.baseChassis}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Principals View */}
      {activeTab === 'principals' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrincipals.map(p => (
            <div key={p.id} className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-5 shadow-lg space-y-2">
              <span className="text-xs font-mono text-neutral-400">{p.nationality}</span>
              <h3 className="font-bold text-white text-base">{p.name}</h3>
              <p className="text-xs text-amber-400 font-semibold">{p.perkName}</p>
              <p className="text-xs text-neutral-400 leading-relaxed">{p.perkDescription}</p>
              <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-xs font-mono text-neutral-300">
                <span>Leadership: {p.leadership}</span>
                <span>Tactics: {p.tactics}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
