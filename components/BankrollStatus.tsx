
import React from 'react';
import { UserStats } from '../types';

interface BankrollStatusProps {
  stats: UserStats;
  isSubscribed: boolean;
  onOpenManager: () => void;
}

const TargetIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#28a745] drop-shadow-[0_0_5px_rgba(40,167,69,0.7)]">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
        <line x1="12" y1="2" x2="12" y2="22" className="opacity-30" />
        <line x1="2" y1="12" x2="22" y2="12" className="opacity-30" />
    </svg>
);

const BankrollStatus: React.FC<BankrollStatusProps> = ({ stats, isSubscribed, onOpenManager }) => {
  const planSlot1 = stats.bankrollPlans.find(p => p.id === stats.activePlanIds.slot1);
  const planSlot2 = stats.bankrollPlans.find(p => p.id === stats.activePlanIds.slot2);

  // --- MODO BLOQUEADO (NÃO ASSINANTE) ---
  if (!isSubscribed) {
      return (
        <button 
            onClick={onOpenManager}
            className="absolute top-4 right-4 z-40 bg-black/40 backdrop-blur-md rounded-full border border-[#d97d1b]/30 px-3 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg group hover:bg-[#d97d1b]/10 transition-colors"
        >
            <div className="flex flex-col text-right">
                <span className="text-[8px] font-bold text-[#d97d1b] uppercase tracking-wider leading-none">
                    Gestão Pro
                </span>
                <span className="text-[10px] font-black text-white leading-none mt-0.5 filter blur-[3px] group-hover:blur-[2px] transition-all">
                    Meta: R$ 500
                </span>
            </div>
            <div className="text-[#d97d1b]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
        </button>
      );
  }

  // --- MODO DESBLOQUEADO (SEM PLANO DEFINIDO) ---
  if (!planSlot1 && !planSlot2) {
      return (
        <button 
            onClick={onOpenManager}
            className="absolute top-4 right-4 z-40 bg-black/40 backdrop-blur-md rounded-full border border-white/10 px-3 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg hover:bg-white/5 transition-colors"
        >
            <div className="flex flex-col text-right">
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider leading-none">
                    Gestão Ativa
                </span>
                <span className="text-[10px] font-black text-white leading-none mt-0.5">
                    Definir Meta
                </span>
            </div>
            <div className="text-white/50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </div>
        </button>
      );
  }

  // Helper para renderizar progresso de um plano
  const renderPlanStatus = (plan: any, label: string) => {
      const progress = Math.min(100, Math.max(0, (plan.currentDayProfit / plan.dailyGoal) * 100));
      const isProfit = plan.currentDayProfit >= 0;
      
      return (
        <div className="flex items-center gap-3">
            <div className="flex flex-col text-right min-w-[80px]">
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider leading-none mb-0.5">
                {label} ({plan.name.slice(0, 8)}...)
                </span>
                
                {/* Valores */}
                <div className="flex items-center justify-end gap-1">
                    <span className={`text-sm font-black leading-none tabular-nums ${isProfit ? 'text-[#28a745]' : 'text-[#e51a31]'}`}>
                        {isProfit ? '+' : '-'}R$ {Math.abs(plan.currentDayProfit).toFixed(0)}
                    </span>
                    <span className="text-[10px] text-white/30 font-bold">/ {plan.dailyGoal.toFixed(0)}</span>
                </div>

                {/* Mini Progress Bar */}
                <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${progress >= 100 ? 'bg-yellow-400 animate-pulse' : 'bg-[#28a745]'}`}
                        style={{ width: `${progress}%` }} 
                    />
                </div>
            </div>
            <div className={`${progress >= 100 ? 'text-yellow-400 animate-bounce' : 'text-[#28a745] group-hover:scale-110 transition-transform'}`}>
                <TargetIcon />
            </div>
        </div>
      );
  };

  // Se for o mesmo plano nos dois slots, mostra uma vez só
  if (planSlot1 && planSlot2 && planSlot1.id === planSlot2.id) {
      return (
        <button onClick={onOpenManager} className="absolute top-4 right-4 z-40 bg-black/40 backdrop-blur-md rounded-full border border-[#28a745]/30 px-3 py-2 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg hover:bg-[#28a745]/5 transition-colors group">
            {renderPlanStatus(planSlot1, "Meta (Slots 1&2)")}
        </button>
      );
  }

  // --- MODO MULTI-PLANO ---
  return (
    <button 
        onClick={onOpenManager}
        className="absolute top-4 right-4 z-40 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300"
    >
        {planSlot1 && (
            <div className="bg-black/40 backdrop-blur-md rounded-full border border-[#28a745]/30 px-3 py-2 shadow-lg hover:bg-[#28a745]/5 transition-colors group">
                {renderPlanStatus(planSlot1, "Slot 1")}
            </div>
        )}
        {planSlot2 && (
            <div className="bg-black/40 backdrop-blur-md rounded-full border border-[#34b1e2]/30 px-3 py-2 shadow-lg hover:bg-[#34b1e2]/5 transition-colors group">
                {renderPlanStatus(planSlot2, "Slot 2")}
            </div>
        )}
    </button>
  );
};

export default BankrollStatus;
