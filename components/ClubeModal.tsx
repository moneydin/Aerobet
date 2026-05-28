
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserStats, ClubeConfig } from '../types';

interface ClubeModalProps {
  onClose: () => void;
  stats: UserStats;
  config: ClubeConfig;
  onJoin: () => void;
}

const ClubeModal: React.FC<ClubeModalProps> = ({ onClose, stats, config, onJoin }) => {
  const progress = (stats.clubeFlightsCount / config.targetFlights) * 100;
  const remaining = config.targetFlights - stats.clubeFlightsCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-[#1b1c1d] rounded-2xl sm:rounded-[32px] border border-white/10 overflow-hidden shadow-2xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col"
      >
        <div className="w-full overflow-y-auto no-scrollbar flex flex-col">
        {/* Header com Gradiente */}
        <div className="bg-gradient-to-br from-[#34b1e2] to-[#2096c4] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Exclusivo</span>
              </div>
              <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none mb-2">Clube <span className="text-black">AERObet</span></h2>
            <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Sua fidelidade recompensada com voos grátis</p>
          </div>
        </div>

        <div className="p-8">
          {!stats.clubeMember ? (
            <div className="text-center space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                <p className="text-white/70 text-sm leading-relaxed mb-4">
                  Participe do nosso clube de fidelidade e ganhe recompensas automáticas. A cada voo realizado, você fica mais perto de ganhar voos grátis!
                </p>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <span className="block text-[10px] font-bold text-white/30 uppercase mb-1">Objetivo</span>
                    <span className="text-sm font-black text-white">{config.targetFlights} Voos</span>
                  </div>
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <span className="block text-[10px] font-bold text-white/30 uppercase mb-1">Prêmio</span>
                    <span className="text-sm font-black text-[#34b1e2]">{config.rewardFlights} Voos Grátis</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={onJoin}
                className="w-full bg-[#34b1e2] hover:bg-[#2096c4] text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-[#34b1e2]/20 transition-all active:scale-95"
              >
                Participar do Clube
              </button>
              <p className="text-[10px] text-white/30 uppercase font-bold">Ao participar, você concorda com os termos do Clube AERObet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Seu Progresso Atual</span>
                    <h3 className="text-2xl font-black italic text-white uppercase">{stats.clubeFlightsCount} / {config.targetFlights} <span className="text-xs not-italic font-bold text-white/40 ml-1">Voos</span></h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-[#34b1e2] uppercase tracking-widest block mb-1">Faltam</span>
                    <span className="text-lg font-black text-white">{remaining}</span>
                  </div>
                </div>

                <div className="h-4 bg-black rounded-full overflow-hidden border border-white/5 p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-[#34b1e2] to-[#2096c4] rounded-full shadow-[0_0_15px_rgba(52,177,226,0.5)]"
                  />
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 bg-[#34b1e2]/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34b1e2" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase mb-1">Próxima Recompensa</h4>
                  <p className="text-[10px] text-white/50 font-medium">Complete os {config.targetFlights} voos para receber automaticamente {config.rewardFlights} voos grátis na sua conta.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <span>Membro desde</span>
                  <span>{new Date(stats.clubeCycleStartDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ClubeModal;
