
import React from 'react';
import { GameHistory } from '../types';
import { getMultiplierColor } from '../constants';

interface FullHistoryModalProps {
  history: GameHistory[];
  onClose: () => void;
}

const FullHistoryModal: React.FC<FullHistoryModalProps> = ({ history, onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-[#1b1c1d] w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex flex-col">
            <h3 className="font-black italic uppercase tracking-tighter text-xl text-white">Histórico de Rodadas</h3>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Últimos 100 resultados</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {history.map((h) => (
              <div
                key={h.roundId}
                className="flex flex-col items-center gap-1"
              >
                <div 
                  className="w-full aspect-[2/1] rounded-full flex items-center justify-center text-[11px] font-black border border-white/10 shadow-lg"
                  style={{ 
                    color: getMultiplierColor(h.multiplier), 
                    backgroundColor: 'rgba(255, 255, 255, 0.03)'
                  }}
                >
                  {h.multiplier.toFixed(2)}x
                </div>
              </div>
            ))}
          </div>

          {history.length === 0 && (
            <div className="py-20 text-center opacity-20">
               <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
               <p className="font-black uppercase tracking-widest text-xs">Aguardando dados...</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-black/20 border-t border-white/5 flex justify-center">
           <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">Resultados gerados via algoritmo criptográfico</p>
        </div>
      </div>
    </div>
  );
};

export default FullHistoryModal;