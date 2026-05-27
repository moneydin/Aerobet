
import React, { useState, useEffect, useMemo } from 'react';
import { Mission } from '../types';

interface MissionsModalProps {
  onClose: () => void;
  missions: Mission[];
  onClaim: (missionId: string) => void;
  onStart: (missionId: string) => void; 
  onTrack: (missionId: string) => void; 
  lastDepositTime: number; 
  isSubscribed: boolean; 
  onOpenDeposit: () => void; 
  onOpenSubscription: () => void;
}

// --- SUB-COMPONENT: Mission Icon ---
const MissionIcon = ({ type, tier, size = "md" }: { type: string, tier: 'free' | 'premium', size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 28 : 20;
    
    // Cores baseadas no Tier e Tipo
    const bgClass = tier === 'premium' 
        ? 'bg-gradient-to-br from-[#913ef2] to-[#5b0ca8] text-white shadow-[#913ef2]/30' 
        : 'bg-[#1b1c1d] border border-white/10 text-white/60';

    const icon = () => {
        switch (type) {
            case 'multiplier_hit':
                return <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
            case 'total_wager':
                return <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/><path d="M12 16V8"/><path d="M16 12H8"/></svg>;
            default: // bets_count
                return <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
        }
    }

    return (
        <div className={`${sizeClasses} rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${bgClass}`}>
            {icon()}
        </div>
    );
};

// --- SUB-COMPONENT: Mission Card (List Item) ---
const MissionCard: React.FC<{ mission: Mission, onClick: () => void, locked: boolean }> = ({ mission, onClick, locked }) => {
    const progress = Math.min(100, (mission.current / mission.target) * 100);
    
    return (
        <div 
            onClick={onClick}
            className={`relative p-4 rounded-2xl border transition-all cursor-pointer group bg-[#141516] hover:bg-[#1a1b1d] ${
                locked ? 'opacity-60 border-white/5' : 
                mission.completed && !mission.rewardClaimed ? 'border-[#28a745]/50 shadow-[0_0_15px_rgba(40,167,69,0.1)]' : 
                mission.accepted ? 'border-[#34b1e2]/30' : 'border-white/5 hover:border-white/10'
            }`}
        >
            <div className="flex items-center gap-4">
                <MissionIcon type={mission.type} tier={mission.tier} size="md" />
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wide truncate pr-2">{mission.title}</h4>
                        {mission.completed && !mission.rewardClaimed && <span className="bg-[#28a745] text-black text-[8px] font-black uppercase px-2 py-0.5 rounded animate-pulse">Coletar</span>}
                        {locked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                    </div>
                    
                    <p className="text-[10px] text-white/40 truncate mb-2">{mission.description}</p>
                    
                    {mission.accepted && !mission.completed && (
                        <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                            <div className="h-full bg-[#34b1e2]" style={{ width: `${progress}%` }} />
                        </div>
                    )}
                    
                    {!mission.accepted && !mission.completed && (
                        <div className="flex gap-2">
                            {mission.rewardBalance > 0 && <span className="text-[9px] font-bold text-[#28a745]">R$ {mission.rewardBalance}</span>}
                            {mission.rewardFlights > 0 && <span className="text-[9px] font-bold text-[#913ef2]">{mission.rewardFlights} Voos</span>}
                            {mission.rewardXP > 0 && <span className="text-[9px] font-bold text-yellow-500">{mission.rewardXP} XP</span>}
                        </div>
                    )}
                </div>
                
                <div className="text-white/20 group-hover:text-white transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Mission Detail View ---
const MissionDetail: React.FC<{ 
    mission: Mission, 
    onBack: () => void,
    onAction: (action: 'start' | 'claim' | 'track' | 'unlock') => void,
    isLocked: boolean,
    lockReason?: 'deposit' | 'subscription'
}> = ({ mission, onBack, onAction, isLocked, lockReason }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const progress = Math.min(100, (mission.current / mission.target) * 100);

    const handleMainAction = () => {
        setIsProcessing(true);
        if (isLocked) {
            onAction('unlock');
        } else if (mission.completed && !mission.rewardClaimed) {
            onAction('claim');
        } else if (mission.accepted) {
            onAction('track');
        } else {
            onAction('start');
        }
        // Timeout de segurança visual
        setTimeout(() => setIsProcessing(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-[#09090b] animate-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className={`p-6 border-b border-white/5 relative overflow-hidden shrink-0 ${mission.tier === 'premium' ? 'bg-gradient-to-br from-[#1b1c1d] to-[#2a0e3d]' : 'bg-[#1b1c1d]'}`}>
                <button onClick={onBack} className="absolute top-4 left-4 p-2 text-white/50 hover:text-white transition-colors z-20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                </button>
                
                <div className="flex flex-col items-center text-center mt-4 relative z-10">
                    <MissionIcon type={mission.type} tier={mission.tier} size="lg" />
                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mt-4">{mission.title}</h2>
                    <div className="flex gap-2 mt-2">
                        {mission.tier === 'premium' && <span className="bg-[#913ef2] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded">Elite</span>}
                        {mission.entryCost ? <span className="bg-[#d97d1b] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded">Pago</span> : <span className="bg-[#28a745] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded">Grátis</span>}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Description */}
                <div className="bg-[#141516] p-4 rounded-xl border border-white/5">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Objetivo</h4>
                    <p className="text-sm text-white/80 font-medium leading-relaxed">{mission.description}</p>
                </div>

                {/* Progress (if accepted) or Requirements */}
                {mission.accepted ? (
                    <div className="bg-[#141516] p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Progresso Atual</span>
                            <span className={`text-sm font-black ${mission.completed ? 'text-[#28a745]' : 'text-white'}`}>
                                {Math.floor(mission.current)} / {mission.target}
                            </span>
                        </div>
                        <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/5">
                            <div className={`h-full transition-all duration-1000 ${mission.completed ? 'bg-[#28a745]' : 'bg-[#34b1e2]'}`} style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#141516] p-3 rounded-xl border border-white/5 text-center">
                            <span className="text-[9px] font-bold text-white/40 uppercase block mb-1">Meta</span>
                            <span className="text-sm font-black text-white">{mission.target}</span>
                        </div>
                        <div className="bg-[#141516] p-3 rounded-xl border border-white/5 text-center">
                            <span className="text-[9px] font-bold text-white/40 uppercase block mb-1">Min. Multiplicador</span>
                            <span className="text-sm font-black text-[#d97d1b]">{mission.minMultiplier ? `${mission.minMultiplier}x` : 'Qualquer'}</span>
                        </div>
                    </div>
                )}

                {/* Rewards */}
                <div>
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Recompensas</h4>
                    <div className="grid grid-cols-3 gap-3">
                        <div className={`bg-[#141516] p-3 rounded-xl border flex flex-col items-center justify-center gap-1 ${mission.rewardBalance > 0 ? 'border-[#28a745]/30' : 'border-white/5 opacity-50'}`}>
                            <span className={`text-xs font-black ${mission.rewardBalance > 0 ? 'text-[#28a745]' : 'text-white/20'}`}>R$</span>
                            <span className="text-sm font-bold text-white">{mission.rewardBalance}</span>
                        </div>
                        <div className={`bg-[#141516] p-3 rounded-xl border flex flex-col items-center justify-center gap-1 ${mission.rewardFlights > 0 ? 'border-[#913ef2]/30' : 'border-white/5 opacity-50'}`}>
                            <span className={`text-[10px] font-black uppercase ${mission.rewardFlights > 0 ? 'text-[#913ef2]' : 'text-white/20'}`}>Voos</span>
                            <span className="text-sm font-bold text-white">{mission.rewardFlights}</span>
                        </div>
                        <div className={`bg-[#141516] p-3 rounded-xl border flex flex-col items-center justify-center gap-1 ${mission.rewardXP > 0 ? 'border-yellow-500/30' : 'border-white/5 opacity-50'}`}>
                            <span className={`text-[10px] font-black uppercase ${mission.rewardXP > 0 ? 'text-yellow-500' : 'text-white/20'}`}>XP</span>
                            <span className="text-sm font-bold text-white">{mission.rewardXP}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-6 bg-[#141516] border-t border-white/5 shrink-0">
                <button 
                    onClick={handleMainAction}
                    disabled={isProcessing}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                        isLocked 
                        ? (lockReason === 'subscription' ? 'bg-gradient-to-r from-[#e51a31] to-[#8b0010] text-white' : 'bg-[#e51a31] text-white')
                        : mission.completed && !mission.rewardClaimed 
                        ? 'bg-[#28a745] hover:bg-[#218838] text-white animate-pulse'
                        : mission.accepted 
                        ? 'bg-[#1b1c1d] border border-white/20 text-white hover:bg-white/5'
                        : 'bg-[#34b1e2] hover:bg-[#2096c4] text-white'
                    }`}
                >
                    {isProcessing ? (
                        <>
                            <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            Processando...
                        </>
                    ) : isLocked ? (
                        <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            {lockReason === 'subscription' ? 'Desbloquear com Elite' : 'Faça um Depósito'}
                        </>
                    ) : mission.completed && !mission.rewardClaimed ? (
                        'Resgatar Prêmios'
                    ) : mission.accepted ? (
                        'Fixar no Jogo'
                    ) : (
                        mission.entryCost ? `Pagar Entrada (R$ ${mission.entryCost})` : 'Aceitar Missão'
                    )}
                </button>
            </div>
        </div>
    );
};

const MissionsModal: React.FC<MissionsModalProps> = ({ 
    onClose, 
    missions, 
    onClaim, 
    onStart, 
    onTrack, 
    lastDepositTime, 
    isSubscribed, 
    onOpenDeposit,
    onOpenSubscription
}) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  const hasDepositedRecently = (Date.now() - lastDepositTime) < (7 * 24 * 60 * 60 * 1000);

  useEffect(() => {
    const updateTimer = () => {
        const now = new Date();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const diff = endOfDay.getTime() - now.getTime();
        
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredMissions = missions.filter(m => activeTab === 'free' ? m.tier !== 'premium' : m.tier === 'premium');
  
  // Selected Mission Object
  const selectedMission = missions.find(m => m.id === selectedMissionId) || null;

  // Global Claim All Logic
  const completedMissions = filteredMissions.filter(m => {
      const isLocked = activeTab === 'free' ? !hasDepositedRecently : !isSubscribed;
      return m.completed && !m.rewardClaimed && !isLocked;
  });
  const canClaimAll = completedMissions.length > 1;

  const handleClaimAll = () => {
      completedMissions.forEach(m => onClaim(m.id));
  };

  const handleDetailAction = (action: 'start' | 'claim' | 'track' | 'unlock') => {
      if (!selectedMissionId) return;
      
      if (action === 'unlock') {
          if (activeTab === 'premium') onOpenSubscription();
          else onOpenDeposit();
      } else if (action === 'claim') {
          onClaim(selectedMissionId);
          setSelectedMissionId(null); // Fecha após claim
      } else if (action === 'start') {
          onStart(selectedMissionId);
          // Opcional: Manter aberto ou fechar. Fechar parece natural para começar a jogar.
          setSelectedMissionId(null);
          onClose(); // Fecha o modal todo para ir ao jogo
      } else if (action === 'track') {
          onTrack(selectedMissionId);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 font-sans">
      <div className="bg-[#09090b] w-full max-w-2xl rounded-[2rem] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        
        {/* Background FX */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#e51a31]/10 to-transparent pointer-events-none" />

        {selectedMission ? (
            <MissionDetail 
                mission={selectedMission} 
                onBack={() => setSelectedMissionId(null)}
                onAction={handleDetailAction}
                isLocked={selectedMission.tier === 'premium' ? !isSubscribed : !hasDepositedRecently}
                lockReason={selectedMission.tier === 'premium' ? 'subscription' : 'deposit'}
            />
        ) : (
            <>
                <div className="p-6 md:p-8 pb-0 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                                Centro de <span className="text-[#e51a31]">Missões</span>
                            </h2>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Complete desafios e ganhe prêmios</p>
                        </div>
                        <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-white/50 hover:text-white transition-colors border border-white/5">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <button 
                            onClick={() => setActiveTab('free')}
                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden ${
                                activeTab === 'free' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-white/40 hover:text-white'
                            }`}
                        >
                            Missões Diárias
                        </button>
                        <button 
                            onClick={() => setActiveTab('premium')}
                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden ${
                                activeTab === 'premium' ? 'bg-gradient-to-r from-[#e51a31] to-[#8b0010] text-white shadow-lg' : 'bg-white/5 text-white/40 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                {activeTab !== 'premium' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                                Missões Elite
                            </div>
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 bg-[#141516] p-4 rounded-2xl border border-white/5 shadow-inner mb-4">
                        <div className="flex-1 flex items-center justify-between md:justify-start gap-4 border-b md:border-b-0 md:border-r border-white/5 pb-3 md:pb-0 md:pr-4">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Reset Diário</span>
                                <div className="text-xl font-mono font-black text-white tabular-nums tracking-widest">{timeLeft}</div>
                            </div>
                        </div>
                        
                        <div className="flex-1 flex items-center justify-between gap-4">
                            <div className="flex flex-col w-full">
                                <div className="flex justify-between items-end mb-1.5">
                                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Disponíveis</span>
                                    <span className="text-[10px] font-black text-white">{completedMissions.length} <span className="text-white/40">/ {filteredMissions.length}</span></span>
                                </div>
                                <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-[#e51a31] to-[#ff4d61] transition-all duration-1000 ease-out"
                                        style={{ width: `${(completedMissions.length / Math.max(1, filteredMissions.length)) * 100}%` }}
                                    />
                                </div>
                            </div>
                            {canClaimAll && (
                                <button 
                                    onClick={handleClaimAll}
                                    className="bg-[#28a745] hover:bg-[#218838] text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all whitespace-nowrap animate-pulse"
                                >
                                    Resgatar Tudo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 pt-0 space-y-4">
                    {filteredMissions.map((mission) => {
                        const isLocked = activeTab === 'free' ? !hasDepositedRecently : !isSubscribed;
                        return (
                            <MissionCard 
                                key={mission.id} 
                                mission={mission} 
                                locked={isLocked}
                                onClick={() => setSelectedMissionId(mission.id)}
                            />
                        );
                    })}
                    
                    {filteredMissions.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-white/20">
                            <span className="text-xs font-bold uppercase tracking-widest">Nenhuma missão disponível</span>
                        </div>
                    )}
                </div>
            </>
        )}

      </div>
    </div>
  );
};

export default MissionsModal;
