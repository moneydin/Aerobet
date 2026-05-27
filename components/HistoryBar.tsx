
import React from 'react';
import { GameHistory } from '../types';
import { getMultiplierColor } from '../constants';

interface HistoryBarProps {
  history: GameHistory[];
  onShowFullHistory: () => void;
}

const HistoryBar: React.FC<HistoryBarProps> = ({ history, onShowFullHistory }) => {
  return (
    <div className="flex items-center gap-1 overflow-hidden py-1 px-2 w-full bg-[#141516] rounded-t-xl border-b border-white/5 relative h-8 shrink-0">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pr-10">
        {history.length === 0 ? (
          <div className="text-white/40 text-[8px] font-bold uppercase tracking-widest px-2 py-1 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#f59e0b] animate-ping" />
            Carregando histórico...
          </div>
        ) : (
          history.slice(0, 20).map((h) => (
            <div 
              key={h.roundId} 
              className="px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap border border-white/10 shadow-sm"
              style={{ 
                color: getMultiplierColor(h.multiplier), 
                backgroundColor: 'rgba(255, 255, 255, 0.03)'
              }}
            >
              {h.multiplier.toFixed(2)}x
            </div>
          ))
        )}
      </div>
      
      {/* Botão de Histórico Completo (Lado Direito) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center px-2 bg-gradient-to-l from-[#141516] via-[#141516] to-transparent pl-8 pointer-events-none">
         <button 
            onClick={onShowFullHistory}
            className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors pointer-events-auto border border-white/5 shadow-lg active:scale-90"
         >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
         </button>
      </div>
    </div>
  );
};

export default HistoryBar;