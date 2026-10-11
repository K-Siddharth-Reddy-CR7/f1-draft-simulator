import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { LiveWeekendSimulator } from './components/LiveWeekendSimulator.js';
import { StandingsCalendar } from './components/StandingsCalendar.js';
import { TeamPaddock } from './components/TeamPaddock.js';
import { DriverMarket } from './components/DriverMarket.js';
import { OnboardingTeamSetup } from './components/OnboardingTeamSetup.js';
import { SeasonState } from './types/f1.js';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [season, setSeason] = useState<SeasonState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'simulator' | 'standings' | 'paddock' | 'market'>('simulator');
  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [showTeamPickerModal, setShowTeamPickerModal] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('2026 Formula 1 World Championship');
  const [newSeasonSeed, setNewSeasonSeed] = useState('42');
  const [selectedUserTeam, setSelectedUserTeam] = useState('con_veloce');

  const fetchSeason = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/season/current');
      const data = await res.json();
      if (data.success && data.season) {
        setSeason(data.season);
      } else {
        setError(data.error || 'Failed to load season state');
      }
    } catch (err: any) {
      setError(err.message || 'Network connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeason();
  }, []);

  const handleSelectTeam = async (
    teamId: string,
    draftedRoster?: { driver1Id: string; driver2Id: string; constructorId: string; principalId: string }
  ) => {
    try {
      setLoading(true);
      const res = await fetch('/api/season/select-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, draftedRoster })
      });
      const data = await res.json();
      if (data.success && data.season) {
        setSeason(data.season);
        setShowTeamPickerModal(false);
      }
    } catch (err) {
      console.error('Failed to select team:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/season/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSeasonName,
          seed: Number(newSeasonSeed) || 42,
          userTeamId: selectedUserTeam
        })
      });
      const data = await res.json();
      if (data.success && data.season) {
        setSeason(data.season);
        setShowNewSeasonModal(false);
        setActiveTab('simulator');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create new season');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !season) {
    return (
      <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center text-neutral-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span>INITIALIZING PITWALL HQ SIMULATION ENGINE...</span>
        </div>
      </div>
    );
  }

  if (error && !season) {
    return (
      <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Connection Error</h2>
          <p className="text-xs text-neutral-400">{error}</p>
          <button
            onClick={fetchSeason}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-500"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const userTeam = season?.constructors.find(c => c.id === season.userTeamId);

  return (
    <div className="min-h-screen bg-[#0a0a0d] text-neutral-100 flex flex-col">
      {/* Onboarding Team Setup */}
      {season && (!season.userHasChosenTeam || showTeamPickerModal) && (
        <OnboardingTeamSetup
          season={season}
          onSelectTeam={handleSelectTeam}
        />
      )}

      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRound={season?.currentRound || 1}
        totalRounds={season?.totalRounds || 24}
        isSeasonCompleted={season?.isCompleted || false}
        onNewSeason={() => setShowNewSeasonModal(true)}
      />

      {/* Your Team Paddock Banner */}
      {userTeam && season?.userHasChosenTeam && (
        <div className="bg-neutral-900/40 border-b border-neutral-800/60 py-2 px-4 sm:px-8 text-xs font-mono">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: userTeam.primaryColor }} />
              <span className="text-neutral-400">YOU ARE PRINCIPAL OF:</span>
              <span className="font-bold text-white">{userTeam.name}</span>
              <span className="text-neutral-500 hidden sm:inline">
                ({userTeam.driverIds.map(dId => season.drivers.find(d => d.id === dId)?.name).join(' & ')})
              </span>
            </div>
            <button
              onClick={() => setShowTeamPickerModal(true)}
              className="text-neutral-400 hover:text-white underline text-[11px]"
            >
              Change / Re-Draft Team
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {season && (
          <>
            {activeTab === 'simulator' && (
              <LiveWeekendSimulator
                season={season}
                onRefreshSeason={fetchSeason}
                onSelectTab={setActiveTab}
              />
            )}

            {activeTab === 'standings' && (
              <StandingsCalendar
                season={season}
                onRefreshSeason={fetchSeason}
                onSelectRound={() => {
                  setActiveTab('simulator');
                }}
              />
            )}

            {activeTab === 'paddock' && (
              <TeamPaddock
                season={season}
                onRefreshSeason={fetchSeason}
              />
            )}

            {activeTab === 'market' && (
              <DriverMarket />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-[#08080a] py-6 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">Pitwall HQ</span>
            <span>·</span>
            <span>Formula 1 Grand Prix Season & Team Management Simulator</span>
          </div>
          <div className="text-neutral-500 text-[11px] text-center sm:text-right">
            Independent motorsport simulation. F1, Formula 1, and related marks are trademarks of Formula One Licensing B.V.
          </div>
        </div>
      </footer>

      {/* New Season Modal */}
      {showNewSeasonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-white text-base">Start New Championship Season</h3>
              <button
                onClick={() => setShowNewSeasonModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewSeason} className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1 font-mono">CHAMPIONSHIP NAME</label>
                <input
                  type="text"
                  value={newSeasonName}
                  onChange={e => setNewSeasonName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-medium focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-mono">DETERMINISTIC SIMULATION SEED</label>
                <input
                  type="number"
                  value={newSeasonSeed}
                  onChange={e => setNewSeasonSeed(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  placeholder="e.g. 42"
                  required
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Supplying the same seed produces fully reproducible race weekends.
                </span>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-mono">YOUR PRINCIPAL TEAM</label>
                <select
                  value={selectedUserTeam}
                  onChange={e => setSelectedUserTeam(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-medium focus:outline-none focus:border-red-500"
                >
                  {season?.constructors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.powerUnitSupplier})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSeasonModal(false)}
                  className="px-4 py-2 rounded text-neutral-400 hover:text-white bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded font-bold text-white bg-red-600 hover:bg-red-500 shadow-sm"
                >
                  Initialize Season
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

