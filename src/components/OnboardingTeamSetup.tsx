import React, { useState } from 'react';
import {
  Trophy,
  Users,
  CheckCircle2,
  Wrench,
  ChevronRight,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeft,
  Dice5
} from 'lucide-react';
import { Constructor, Driver, SeasonState, TeamPrincipal } from '../types/f1.js';

interface OnboardingProps {
  season: SeasonState;
  onSelectTeam: (
    teamId: string,
    draftedRoster?: { driver1Id: string; driver2Id: string; constructorId: string; principalId: string }
  ) => Promise<void>;
}

export const OnboardingTeamSetup: React.FC<OnboardingProps> = ({
  season,
  onSelectTeam
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Selections
  const [selectedConstructorId, setSelectedConstructorId] = useState<string>('con_veloce');
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>('pri_fred');
  const [selectedDriver1Id, setSelectedDriver1Id] = useState<string>('drv_lec');
  const [selectedDriver2Id, setSelectedDriver2Id] = useState<string>('drv_ham');
  const [submitting, setSubmitting] = useState(false);

  const selectedConstructor = season.constructors.find(c => c.id === selectedConstructorId) || season.constructors[0];
  const selectedPrincipal = season.teamPrincipals.find(p => p.id === selectedPrincipalId) || season.teamPrincipals[0];
  const driver1 = season.drivers.find(d => d.id === selectedDriver1Id) || season.drivers[0];
  const driver2 = season.drivers.find(d => d.id === selectedDriver2Id) || season.drivers[1];

  const handleLaunch = async () => {
    if (selectedDriver1Id === selectedDriver2Id) {
      alert('Driver 1 and Driver 2 must be different drivers!');
      return;
    }
    setSubmitting(true);
    try {
      await onSelectTeam(selectedConstructorId, {
        constructorId: selectedConstructorId,
        principalId: selectedPrincipalId,
        driver1Id: selectedDriver1Id,
        driver2Id: selectedDriver2Id
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07070a]/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        {/* Step Progress Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-black text-white text-xs">
              APX
            </div>
            <div>
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                Team Commission Wizard · Step {currentStep} of 4
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {currentStep === 1 && '1. Choose Your Constructor'}
                {currentStep === 2 && '2. Choose Your Team Principal'}
                {currentStep === 3 && '3. Choose Your 2 Drivers'}
                {currentStep === 4 && '4. Review & Randomize Rival Grid'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === step
                    ? 'bg-red-600 text-white shadow-md'
                    : currentStep > step
                    ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/50'
                    : 'bg-neutral-950 text-neutral-600 border border-neutral-800'
                }`}
              >
                {currentStep > step ? '✓' : step}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: Choose Constructor */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-400">
              Select the Formula 1 team chassis, aerodynamics, and power unit package you want to manage:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {season.constructors.map(c => {
                const isSelected = c.id === selectedConstructorId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedConstructorId(c.id);
                      setSelectedPrincipalId(c.principalId);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-red-500 bg-neutral-800/90 ring-1 ring-red-500 shadow-lg'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: c.primaryColor }}
                        />
                        <span className="font-bold text-sm text-white">{c.name}</span>
                      </div>
                      <p className="text-xs text-neutral-400 font-mono mb-2">
                        Engine: {c.powerUnitSupplier}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center pt-2 border-t border-neutral-850">
                      <div className="bg-neutral-900 p-1 rounded">
                        <span className="text-neutral-500 block">AERO</span>
                        <span className="text-white font-bold">{c.baseAero}</span>
                      </div>
                      <div className="bg-neutral-900 p-1 rounded">
                        <span className="text-neutral-500 block">ENGINE</span>
                        <span className="text-white font-bold">{c.baseEngine}</span>
                      </div>
                      <div className="bg-neutral-900 p-1 rounded">
                        <span className="text-neutral-500 block">CHASSIS</span>
                        <span className="text-white font-bold">{c.baseChassis}</span>
                      </div>
                      <div className="bg-neutral-900 p-1 rounded">
                        <span className="text-neutral-500 block">PIT CREW</span>
                        <span className="text-white font-bold">{c.pitCrewRating}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md transition-all"
              >
                <span>Continue to Principal Selection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Choose Team Principal */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-400">
              Select the Team Principal to lead technical strategy, pit execution, and paddock morale:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {season.teamPrincipals.map(p => {
                const isSelected = p.id === selectedPrincipalId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPrincipalId(p.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-red-500 bg-neutral-800/90 ring-1 ring-red-500 shadow-lg'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white">{p.name}</span>
                        <span className="text-[11px] font-mono text-neutral-400">{p.nationality}</span>
                      </div>
                      <span className="text-xs font-semibold text-amber-400 block mb-1">
                        {p.perkName}
                      </span>
                      <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
                        {p.perkDescription}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-850 text-xs font-mono">
                      <span>Leadership: <strong className="text-white">{p.leadership}</strong></span>
                      <span>Tactics: <strong className="text-white">{p.tactics}</strong></span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md transition-all"
              >
                <span>Continue to Drivers Selection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Choose 2 Drivers */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-400">
              Select your 2 drivers from the official Formula 1 grid (the remaining 18 drivers will be randomized across rival teams):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 mb-2">
              <div>
                <label className="text-xs font-mono text-neutral-400 block mb-1 uppercase font-bold">
                  Driver 1 Seat
                </label>
                <select
                  value={selectedDriver1Id}
                  onChange={e => setSelectedDriver1Id(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-white font-bold"
                >
                  {season.drivers.map(d => (
                    <option key={d.id} value={d.id} disabled={d.id === selectedDriver2Id}>
                      #{d.number} {d.name} ({d.code}) · Pace: {d.stats.pace}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                  {driver1.country} · Salary: ${driver1.salaryMillions}M · Craft: {driver1.stats.racecraft} · Wet: {driver1.stats.wetSkill}
                </p>
              </div>

              <div>
                <label className="text-xs font-mono text-neutral-400 block mb-1 uppercase font-bold">
                  Driver 2 Seat
                </label>
                <select
                  value={selectedDriver2Id}
                  onChange={e => setSelectedDriver2Id(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-white font-bold"
                >
                  {season.drivers.map(d => (
                    <option key={d.id} value={d.id} disabled={d.id === selectedDriver1Id}>
                      #{d.number} {d.name} ({d.code}) · Pace: {d.stats.pace}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                  {driver2.country} · Salary: ${driver2.salaryMillions}M · Craft: {driver2.stats.racecraft} · Wet: {driver2.stats.wetSkill}
                </p>
              </div>
            </div>

            {/* Quick Driver Stats Radar Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">Car #1: {driver1.name}</span>
                  <span className="font-mono text-red-500 font-bold">#{driver1.number}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-center">
                  <div className="bg-neutral-900 p-1 rounded">Pace: {driver1.stats.pace}</div>
                  <div className="bg-neutral-900 p-1 rounded">Craft: {driver1.stats.racecraft}</div>
                  <div className="bg-neutral-900 p-1 rounded">Cons: {driver1.stats.consistency}</div>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">Car #2: {driver2.name}</span>
                  <span className="font-mono text-red-500 font-bold">#{driver2.number}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-center">
                  <div className="bg-neutral-900 p-1 rounded">Pace: {driver2.stats.pace}</div>
                  <div className="bg-neutral-900 p-1 rounded">Craft: {driver2.stats.racecraft}</div>
                  <div className="bg-neutral-900 p-1 rounded">Cons: {driver2.stats.consistency}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                disabled={selectedDriver1Id === selectedDriver2Id}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                <span>Review & Launch Grid</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Randomize Rest of Grid */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedConstructor.primaryColor }}
                  />
                  <div>
                    <h3 className="text-lg font-black text-white">{selectedConstructor.name}</h3>
                    <p className="text-xs text-neutral-400">Led by Principal {selectedPrincipal.name}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-red-500 bg-red-950/60 border border-red-800 px-2 py-1 rounded">
                  YOUR TEAM
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">DRIVER 1</span>
                  <span className="font-bold text-white text-sm">{driver1.name} (#{driver1.number})</span>
                  <p className="text-[11px] text-neutral-400 font-sans mt-0.5">Pace: {driver1.stats.pace} · Salary: ${driver1.salaryMillions}M</p>
                </div>

                <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">DRIVER 2</span>
                  <span className="font-bold text-white text-sm">{driver2.name} (#{driver2.number})</span>
                  <p className="text-[11px] text-neutral-400 font-sans mt-0.5">Pace: {driver2.stats.pace} · Salary: ${driver2.salaryMillions}M</p>
                </div>
              </div>

              {/* Grid Randomization Notice */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/30 to-neutral-900 border border-red-800/40 flex items-center gap-3 text-xs">
                <Dice5 className="w-6 h-6 text-red-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Rival Grid Randomization</h4>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    The remaining 18 official drivers and 9 constructors will be randomly paired into rival teams with custom team principals, giving you an unpredictable, competitive 2026 World Championship grid!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleLaunch}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 text-sm font-black text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-xl transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>{submitting ? 'Randomizing Grid...' : 'Launch Season & Go To Round 1'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
