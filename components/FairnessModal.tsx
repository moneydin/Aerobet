
import React from 'react';
import { GameHistory } from '../types';

interface FairnessModalProps {
  history: GameHistory;
  onClose: () => void;
}

const FairnessModal: React.FC<FairnessModalProps> = ({ history, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1b1c1d] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#e51a31] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
            </div>
            <h3 className="font-black italic uppercase tracking-tighter text-lg">Provadamente Justo</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
          <div className="text-center bg-black/20 p-4 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">Resultado do Round</span>
            <span className="text-4xl font-black italic" style={{ color: history.color }}>{history.multiplier.toFixed(2)}x</span>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Hash SHA-256</label>
              <div className="bg-black/40 p-3 rounded-lg border border-white/5 break-all font-mono text-[11px] text-white/70">
                {history.hash}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Semente do Servidor (Server Seed)</label>
                <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 break-all font-mono text-[11px] text-white/70">
                  {history.serverSeed}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Semente do Cliente (Client Seed)</label>
                <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 break-all font-mono text-[11px] text-white/70">
                  {history.clientSeed}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">ID da Rodada (Round ID)</label>
                <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 break-all font-mono text-[11px] text-white/70">
                  {history.roundId}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#e51a31]/10 border border-[#e51a31]/20 p-4 rounded-xl flex gap-3">
            <svg className="text-[#e51a31] shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <p className="text-[11px] text-white/60 leading-relaxed">
              O resultado é gerado combinando o <span className="text-white font-bold">Server Seed</span>, <span className="text-white font-bold">Client Seed</span> e o <span className="text-white font-bold">Round ID</span>. O hash resultante é imutável e determina exatamente quando o avião irá voar.
            </p>
          </div>
        </div>

        <div className="p-4 bg-black/20 border-t border-white/5">
          <button 
            onClick={() => window.open('https://github.com/spribe-io/provably-fair', '_blank')}
            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-widest"
          >
            Verificar no GitHub
          </button>
        </div>
      </div>
    </div>
  );
};

export default FairnessModal;
