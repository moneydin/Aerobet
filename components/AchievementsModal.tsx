
import React, { useState } from 'react';
import { Achievement, Mission, GameEvent } from '../types';

interface AchievementsModalProps {
  onClose: () => void;
  achievements: Achievement[];
  missions: Mission[];
  events: GameEvent[];
  tournaments: GameEvent[];
  onClaim: (id: string) => void;
}

const VictoryCard = ({ type, title, subtitle, reward, date }: any) => {
    const getColor = () => {
        switch(type) {
            case 'mission': return 'border-[#28a745]/30 bg-[#28a745]/5 text-[#28a745]';
            case 'tournament': return 'border-[#e51a31]/30 bg-[#e51a31]/5 text-[#e51a31]';
            case 'event': return 'border-[#34b1e2]/30 bg-[#34b1e2]/5 text-[#34b1e2]';
            default: return 'border-white/10 bg-white/5 text-white';
        }
    };

    const getIcon = () => {
        switch(type) {
            case 'mission': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
            case 'tournament': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
            case 'event': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
            default: return null;
        }
    };

    return (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${getColor()} transition-all hover:bg-opacity-20`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/20`}>
                    {getIcon()}
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-wide text-white">{title}</h4>
                    <p className="text-[10px] opacity-60 font-medium">{subtitle}</p>
                </div>
            </div>
            <div className="text-right">
                <span className="text-[9px] font-bold opacity-50 uppercase block tracking-widest">{type === 'mission' ? 'Recompensa' : 'Prêmio'}</span>
                <span className="text-sm font-black italic">{reward}</span>
            </div>
        </div>
    );
};

const AchievementsModal: React.FC<AchievementsModalProps> = ({ 
    onClose, 
    achievements, 
    missions,
    events,
    tournaments,
    onClaim 
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'victories'>('badges');
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Lógica de Conquistas (Badges)
  const filteredAchievements = achievements.filter(a => {
      if (filter === 'unlocked') return a.unlocked;
      if (filter === 'locked') return !a.unlocked;
      return true;
  });

  const totalUnlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;
  const progressPercentage = (totalUnlocked / total) * 100;

  // Lógica de Vitórias (History)
  const victoryHistory = [
      // 1. Missões Completas e Resgatadas
      ...missions
          .filter(m => m.completed && m.rewardClaimed)
          .map(m => ({
              id: m.id,
              type: 'mission',
              title: m.title,
              subtitle: 'Missão Cumprida',
              reward: m.rewardBalance > 0 ? `R$ ${m.rewardBalance}` : `+${m.rewardFlights} Voos`,
              date: Date.now() // Em um app real, usar timestamp de conclusão
          })),
      
      // 2. Torneios (Participando e em zona de premiação ou encerrado com vitoria)
      ...tournaments
          .filter(t => t.userJoined)
          .map(t => {
              // Verifica ranking do usuário (ID 1 mockado)
              const myRankIndex = t.participantsList?.findIndex(p => p.userId === 1) ?? -1;
              const myRank = myRankIndex + 1;
              const isWinning = myRank > 0 && myRank <= (t.prizes?.length || 0);
              const prize = t.prizes?.find(p => p.position === myRank)?.reward || '-';
              
              if (!isWinning) return null; // Filtra quem não ganhou nada

              return {
                  id: t.id,
                  type: 'tournament',
                  title: t.title,
                  subtitle: t.status === 'live' ? `Posição Atual: #${myRank}` : `Finalizou em #${myRank}`,
                  reward: prize,
                  date: t.endTime || Date.now()
              };
          }).filter(Boolean),

      // 3. Eventos
      ...events
          .filter(e => e.userJoined)
          .map(e => {
              const myRankIndex = e.participantsList?.findIndex(p => p.userId === 1) ?? -1;
              const myRank = myRankIndex + 1;
              const isWinning = myRank > 0 && myRank <= (e.prizes?.length || 0);
              const prize = e.prizes?.find(p => p.position === myRank)?.reward || '-';

              if (!isWinning) return null;

              return {
                  id: e.id,
                  type: 'event',
                  title: e.title,
                  subtitle: e.status === 'live' ? `Zona de Prêmio: #${myRank}` : `Venceu em #${myRank}`,
                  reward: prize,
                  date: e.endTime || Date.now()
              };
          }).filter(Boolean)
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#1b1c1d] w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#141516] p-6 border-b border-white/5 pb-0">
           <div className="flex justify-between items-start mb-6">
               <div>
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">
                    Galeria de <span className="text-yellow-500">Conquistas</span>
                  </h2>
                  <p className="text-xs text-white/60 font-medium">Seus troféus, insígnias e histórico de vitórias.</p>
               </div>
               <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
               </button>
           </div>

           {/* Tabs Switcher */}
           <div className="flex gap-6">
               <button 
                   onClick={() => setActiveTab('badges')}
                   className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeTab === 'badges' ? 'text-white' : 'text-white/40 hover:text-white'}`}
               >
                   Insígnias
                   {activeTab === 'badges' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500 shadow-[0_0_10px_#eab308]" />}
               </button>
               <button 
                   onClick={() => setActiveTab('victories')}
                   className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeTab === 'victories' ? 'text-white' : 'text-white/40 hover:text-white'}`}
               >
                   Histórico de Vitórias
                   {activeTab === 'victories' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#28a745] shadow-[0_0_10px_#28a745]" />}
               </button>
           </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1 bg-[#050505]">
           
           {/* --- TAB: BADGES --- */}
           {activeTab === 'badges' && (
               <>
                   {/* Progress Bar */}
                   <div className="mb-6">
                       <div className="flex justify-between text-[10px] font-bold uppercase text-white/40 mb-2">
                           <span>Progresso Total</span>
                           <span>{totalUnlocked} / {total} Desbloqueados</span>
                       </div>
                       <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/5 relative">
                           <div 
                               className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000 ease-out"
                               style={{ width: `${progressPercentage}%` }}
                           />
                       </div>
                   </div>

                   {/* Filters */}
                   <div className="flex gap-2 mb-4">
                       {(['all', 'unlocked', 'locked'] as const).map(f => (
                           <button 
                               key={f}
                               onClick={() => setFilter(f)}
                               className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                                   filter === f 
                                   ? 'bg-white text-black shadow-lg' 
                                   : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                               }`}
                           >
                               {f === 'all' ? 'Todos' : f === 'unlocked' ? 'Desbloqueados' : 'Bloqueados'}
                           </button>
                       ))}
                   </div>

                   {/* Badges Grid */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredAchievements.map(achiev => {
                         const percentage = Math.min(100, (achiev.progress / achiev.total) * 100);
                         const isCompleted = achiev.unlocked;
                         
                         return (
                            <div 
                                key={achiev.id} 
                                className={`relative p-5 rounded-2xl border transition-all duration-300 group flex flex-col justify-between ${
                                    isCompleted 
                                    ? 'bg-gradient-to-br from-[#2c2d30] to-[#1b1c1d] border-yellow-500/30 hover:border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                                    : 'bg-[#1b1c1d] border-white/5 opacity-80'
                                }`}
                            >
                                <div className="flex gap-4 mb-4">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-105 ${
                                        isCompleted 
                                        ? 'bg-gradient-to-br from-yellow-500 to-amber-700 text-white' 
                                        : 'bg-white/5 text-white/20'
                                    }`}>
                                         {achiev.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm font-black uppercase tracking-wide truncate ${isCompleted ? 'text-white' : 'text-white/50'}`}>
                                            {achiev.title}
                                        </h3>
                                        <p className="text-[10px] text-white/50 mt-1 leading-tight line-clamp-2">
                                            {achiev.secret && !isCompleted ? "Desbloqueie para revelar o segredo." : achiev.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between text-[8px] font-bold uppercase text-white/30 mb-1">
                                        <span>{isCompleted ? 'Completo' : 'Em Andamento'}</span>
                                        <span>{Math.floor(achiev.progress)} / {achiev.total}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            className={`h-full transition-all duration-700 ${isCompleted ? 'bg-yellow-500' : 'bg-white/20'}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider">Recompensa</span>
                                        <span className={`text-xs font-black ${isCompleted ? 'text-yellow-500' : 'text-white/20'}`}>
                                            {achiev.rewardFlights ? `${achiev.rewardFlights} Voos` : achiev.rewardBalance ? `R$ ${achiev.rewardBalance.toFixed(2)}` : 'Prêmio'}
                                        </span>
                                    </div>

                                    {isCompleted ? (
                                        achiev.claimed ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                                <span className="text-[9px] font-black uppercase tracking-widest">Resgatado</span>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => onClaim(achiev.id)}
                                                className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20 active:scale-95 transition-all animate-pulse"
                                            >
                                                Resgatar
                                            </button>
                                        )
                                    ) : (
                                        <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-white/20">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                         );
                      })}
                   </div>
               </>
           )}

           {/* --- TAB: VICTORIES --- */}
           {activeTab === 'victories' && (
               <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
                   {victoryHistory.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-white/10 rounded-2xl">
                           <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-4">
                               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                           </div>
                           <h3 className="text-white font-bold text-sm uppercase tracking-wide">Sem Vitórias Registradas</h3>
                           <p className="text-white/40 text-xs mt-1 max-w-xs">Participe de Missões, Torneios e Eventos para preencher seu histórico de campeão.</p>
                       </div>
                   ) : (
                       victoryHistory.map((victory: any, idx) => (
                           <VictoryCard 
                               key={`${victory.type}-${victory.id}-${idx}`}
                               type={victory.type}
                               title={victory.title}
                               subtitle={victory.subtitle}
                               reward={victory.reward}
                               date={victory.date}
                           />
                       ))
                   )}
               </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;
