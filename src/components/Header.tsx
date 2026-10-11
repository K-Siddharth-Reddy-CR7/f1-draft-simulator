import React from 'react';
import { Flag, Trophy, Wrench, BarChart3, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'simulator' | 'standings' | 'paddock' | 'market';
  setActiveTab: (tab: 'simulator' | 'standings' | 'paddock' | 'market') => void;
  currentRound: number;
  totalRounds: number;
  isSeasonCompleted: boolean;
  onNewSeason: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentRound,
  totalRounds,
  isSeasonCompleted,
  onNewSeason
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-b border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-black tracking-tighter text-white text-xs shadow-sm">
            HQ
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
            Pitwall HQ
          </span>
          <span className="hidden sm:inline-block text-xs text-neutral-400 font-mono tabular-nums border-l border-neutral-800 pl-3">
            {isSeasonCompleted ? 'SEASON FINALE' : `ROUND ${currentRound}/${totalRounds}`}
          </span>
        </div>

        {/* Zone 2: Navigation Links (Clean single-line prose, anti-slop zero-pill) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 whitespace-nowrap transition-colors py-1 ${
              activeTab === 'simulator'
                ? 'text-white border-b-2 border-red-500 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Grand Prix</span>
          </button>

          <button
            onClick={() => setActiveTab('standings')}
            className={`flex items-center gap-2 whitespace-nowrap transition-colors py-1 ${
              activeTab === 'standings'
                ? 'text-white border-b-2 border-red-500 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Championship</span>
          </button>

          <button
            onClick={() => setActiveTab('paddock')}
            className={`flex items-center gap-2 whitespace-nowrap transition-colors py-1 ${
              activeTab === 'paddock'
                ? 'text-white border-b-2 border-red-500 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Team Paddock</span>
          </button>

          <button
            onClick={() => setActiveTab('market')}
            className={`flex items-center gap-2 whitespace-nowrap transition-colors py-1 ${
              activeTab === 'market'
                ? 'text-white border-b-2 border-red-500 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Grid Database</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNewSeason}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/60 rounded-md transition-colors whitespace-nowrap"
            title="Reset or start new season with custom seed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Season</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-800/60 bg-[#09090c] px-2 py-2 text-xs">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-2 py-1 ${activeTab === 'simulator' ? 'text-red-400 font-bold' : 'text-neutral-400'}`}
        >
          Grand Prix
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={`px-2 py-1 ${activeTab === 'standings' ? 'text-red-400 font-bold' : 'text-neutral-400'}`}
        >
          Standings
        </button>
        <button
          onClick={() => setActiveTab('paddock')}
          className={`px-2 py-1 ${activeTab === 'paddock' ? 'text-red-400 font-bold' : 'text-neutral-400'}`}
        >
          Paddock
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`px-2 py-1 ${activeTab === 'market' ? 'text-red-400 font-bold' : 'text-neutral-400'}`}
        >
          Market
        </button>
      </div>
    </header>
  );
};
