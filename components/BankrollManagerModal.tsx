
import React, { useState, useEffect } from 'react';
import { UserStats, BankrollPlan } from '../types';

interface BankrollManagerModalProps {
  onClose: () => void;
  isSubscribed: boolean;
  onSubscribe: (autoRenew: boolean) => void;
  balance: number;
  stats: UserStats;
  onUpdatePlan: (plan: BankrollPlan) => void;
  onActivatePlan?: (planId: string, slot: 1 | 2 | 'disable') => void;
  onDeletePlan?: (planId: string) => void; 
  onResetPlan?: (planId: string) => void;
  onSetBetMode?: (mode: 'manual' | 'auto' | 'manager') => void;
}

const BankrollManagerModal: React.FC<BankrollManagerModalProps> = ({ 
    onClose, 
    isSubscribed, 
    onSubscribe, 
    balance,
    stats,
    onUpdatePlan,
    onActivatePlan,
    onDeletePlan,
    onResetPlan,
    onSetBetMode
}) => {
  // Estados de Navegação
  const [view, setView] = useState<'sales' | 'dashboard'>('sales');
  const [activeTab, setActiveTab] = useState<'overview' | 'strategy' | 'tutorial'>('overview');

  // Estados de Edição/Criação
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Estados do Formulário de Estratégia
  const [planName, setPlanName] = useState(''); 
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [operationMode, setOperationMode] = useState<'manual' | 'auto'>('auto'); 
  const [totalGoalInput, setTotalGoalInput] = useState('');
  const [entryPercent, setEntryPercent] = useState(5.0);
  
  // NOVOS CAMPOS ELITE
  const [targetWins, setTargetWins] = useState(5); 
  const [stopLossPercent, setStopLossPercent] = useState(20); 

  const [isAutoCalculated, setIsAutoCalculated] = useState(false);

  // Estados de Processamento
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(true);

  // Inicialização
  useEffect(() => {
      if (isSubscribed) {
          setView('dashboard');
          if (stats.bankrollPlans.length === 0) {
              setActiveTab('strategy'); // Se não tem planos, vai pra criação
          }
      }
  }, [isSubscribed, stats.bankrollPlans]);

  // Função para abrir o formulário de edição/criação
  const openStrategyForm = (plan?: BankrollPlan) => {
      setErrorMsg(null);
      if (plan) {
          setEditingPlanId(plan.id);
          setPlanName(plan.name);
          setTimeframe(plan.timeframe);
          setOperationMode(plan.operationMode || 'auto');
          setTotalGoalInput(plan.totalGoal.toString());
          setEntryPercent(plan.entryPercentage);
          setTargetWins(plan.winsNeeded);
          setStopLossPercent(Math.round((plan.stopLoss / balance) * 100));
      } else {
          // Reset form for new plan
          setEditingPlanId(null);
          setPlanName('');
          setTimeframe('monthly');
          setOperationMode('auto');
          setTotalGoalInput('');
          setEntryPercent(5.0);
          setTargetWins(5);
          setStopLossPercent(20);
      }
      setActiveTab('strategy');
  };

  // --- CÁLCULO DE SUGESTÃO AUTOMÁTICA DA IA ---
  useEffect(() => {
      if (!totalGoalInput || !balance || !isSubscribed || activeTab !== 'strategy') return;
      if (isAutoCalculated) return; 

      const goal = parseFloat(totalGoalInput);
      if (isNaN(goal) || goal <= 0) return;

      let days = 30;
      if (timeframe === 'weekly') days = 7;
      if (timeframe === 'biweekly') days = 15;
      if (timeframe === 'daily') days = 1;

      const dailyGoal = goal / days;
      const suggestedEntryAmount = dailyGoal / 1.5; 
      let suggestedPct = (suggestedEntryAmount / balance) * 100;
      const minEntryPct = (1.00 / balance) * 100;
      suggestedPct = Math.max(minEntryPct, Math.min(20, suggestedPct)); 

      setEntryPercent(parseFloat(suggestedPct.toFixed(2)));
  }, [totalGoalInput, timeframe, balance, isSubscribed, activeTab]);


  // --- CÁLCULO REATIVO ELITE ---
  const calculateMetrics = () => {
      const goal = parseFloat(totalGoalInput) || 0;
      let days = 30;
      if (timeframe === 'weekly') days = 7;
      if (timeframe === 'biweekly') days = 15;
      if (timeframe === 'daily') days = 1;

      const dailyGoal = goal / days;
      const entryAmountRaw = balance * (entryPercent / 100);
      const entryAmount = Math.max(1.00, entryAmountRaw); 
      
      let calculatedMultiplier = 1.00;

      if (entryAmount > 0 && targetWins > 0) {
          calculatedMultiplier = (dailyGoal / (targetWins * entryAmount)) + 1;
      }

      if (calculatedMultiplier < 1.10) calculatedMultiplier = 1.10; 
      if (calculatedMultiplier > 100) calculatedMultiplier = 100;

      const probability = Math.min(99, (0.97 / calculatedMultiplier) * 100);

      let derivedGoalType: 'conservative' | 'moderate' | 'aggressive' = 'moderate';
      if (calculatedMultiplier < 1.30) derivedGoalType = 'conservative'; 
      else if (calculatedMultiplier > 2.00) derivedGoalType = 'aggressive';

      return { 
          dailyGoal, 
          entryAmount, 
          targetMultiplier: calculatedMultiplier, 
          winsNeeded: targetWins, 
          derivedGoalType,
          probability,
          stopLossValue: balance * (stopLossPercent / 100)
      };
  };

  const metrics = calculateMetrics();

  const handleSavePlan = () => {
      const goal = parseFloat(totalGoalInput);
      if (!planName.trim()) {
          setErrorMsg("Dê um nome para sua meta.");
          return;
      }
      if (isNaN(goal) || goal <= 0) {
          setErrorMsg("Defina uma meta válida.");
          return;
      }
      if (balance < 1.00) {
          setErrorMsg("Saldo insuficiente para operar.");
          return;
      }
      if (metrics.targetMultiplier > 100) {
          setErrorMsg("Alvo impossível! Aumente a entrada ou o prazo.");
          return;
      }

      setIsProcessing(true);
      setErrorMsg(null);

      const existingPlan = stats.bankrollPlans.find(p => p.id === editingPlanId);

      const newPlan: BankrollPlan = {
          id: editingPlanId || `plan-${Date.now()}`,
          name: planName,
          timeframe,
          goalType: metrics.derivedGoalType,
          operationMode, // Novo campo
          totalGoal: goal,
          dailyGoal: metrics.dailyGoal,
          entryPercentage: entryPercent,
          entryAmount: metrics.entryAmount,
          targetMultiplier: metrics.targetMultiplier,
          winsNeeded: targetWins,
          stopLoss: metrics.stopLossValue, 
          currentDayProfit: existingPlan ? existingPlan.currentDayProfit : 0,
          active: true, 
          history: existingPlan ? existingPlan.history : [],
          createdAt: existingPlan ? existingPlan.createdAt : Date.now()
      };

      setTimeout(() => {
          onUpdatePlan(newPlan);
          if (onActivatePlan && !stats.activePlanIds.slot1) {
              onActivatePlan(newPlan.id, 1);
          }
          // REMOVIDO: onSetBetMode call to avoid forcing global state. 
          // Mode switching is now handled in App.tsx via onActivatePlan logic.
          setActiveTab('overview');
          setIsProcessing(false);
      }, 1000);
  };

  const handleSubscribeClick = () => {
      if (balance < 97.90) {
          setErrorMsg("Saldo insuficiente. Faça um depósito.");
          return;
      }
      setIsProcessing(true);
      setTimeout(() => {
          onSubscribe(autoRenew);
          setIsProcessing(false);
      }, 1500);
  };

  // Funções de Ação com Stop Propagation explícito e Window Confirm
  const onClickDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      if(window.confirm('Tem certeza que deseja EXCLUIR esta meta permanentemente?')) {
          if(onDeletePlan) onDeletePlan(id);
      }
  };

  const onClickReset = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      if(window.confirm('Deseja zerar o progresso de hoje desta meta?')) {
          if(onResetPlan) onResetPlan(id);
      }
  };

  const handleComplete = (e: React.MouseEvent, planId: string) => {
      e.stopPropagation();
      e.preventDefault();
      // Remove do slot ativo (desativa visualmente do HUD)
      if (onActivatePlan) onActivatePlan(planId, 'disable');
      alert("Parabéns! Meta concluída e removida do painel ativo.");
  };

  const handleActivate = (e: React.MouseEvent, planId: string, slot: 1 | 2) => {
      e.stopPropagation();
      if (onActivatePlan) onActivatePlan(planId, slot);
      // REMOVIDO: lógica de onSetBetMode aqui. Deixamos o App.tsx decidir.
  };

  const handleDisable = (e: React.MouseEvent, planId: string) => {
      e.stopPropagation();
      if (onActivatePlan) onActivatePlan(planId, 'disable');
  }

  const formatMoney = (val: number) => `R$ ${Math.abs(val).toFixed(2)}`;

  // --- VISUALIZAÇÃO DE VENDAS (REDESIGNED ESTILO ELITE) ---
  if (view === 'sales') {
      return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 font-sans">
             <div className="bg-[#09090b] w-full max-w-sm rounded-[1.5rem] sm:rounded-[2rem] border border-[#e51a31]/30 shadow-[0_0_50px_rgba(229,26,49,0.2)] relative overflow-hidden flex flex-col max-h-[95dvh] sm:max-h-[90vh]">
                 
                 {/* Decorative Red Glow */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#e51a31]/10 rounded-full blur-[80px] pointer-events-none" />
                 
                 {/* Top Indicator */}
                 <div className="h-1.5 w-full bg-gradient-to-r from-[#e51a31] to-[#8b0010]" />
                 
                 {/* Close Button */}
                 <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                 </button>

                 <div className="p-8 pt-10 relative z-10 flex flex-col h-full">
                     <h2 className="text-3xl font-black text-white italic uppercase leading-[0.9] mb-1">
                         LUCRE MAIS COM A <span className="text-[#e51a31]">NOSSA IA</span> E GESTÃO.
                     </h2>
                     
                     <p className="text-xs text-white/60 mt-4 leading-relaxed font-medium">
                         AERObet Elite: O sistema que analisa o gráfico e gerencia sua banca automaticamente com precisão cirúrgica.
                     </p>

                     <div className="space-y-4 mt-8">
                         <div className="bg-[#141516] p-4 rounded-xl flex items-center gap-4 border border-white/5 hover:border-[#e51a31]/30 transition-colors">
                             <div className="w-10 h-10 rounded-full bg-[#e51a31]/10 flex items-center justify-center text-[#e51a31]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                             </div>
                             <div>
                                 <h4 className="text-xs font-black text-white uppercase tracking-tight">Auto Gestão</h4>
                                 <p className="text-[10px] text-white/50 leading-tight">A IA define a entrada ideal baseada na sua meta diária.</p>
                             </div>
                         </div>

                         <div className="bg-[#141516] p-4 rounded-xl flex items-center gap-4 border border-white/5 hover:border-[#34b1e2]/30 transition-colors">
                             <div className="w-10 h-10 rounded-full bg-[#34b1e2]/10 flex items-center justify-center text-[#34b1e2]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                             </div>
                             <div>
                                 <h4 className="text-xs font-black text-white uppercase tracking-tight">Proteção de Banca</h4>
                                 <p className="text-[10px] text-white/50 leading-tight">Stop Loss e Stop Win inteligentes para proteger seu lucro.</p>
                             </div>
                         </div>
                     </div>

                     <div className="mt-8 pt-4">
                         <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Plano Mensal</p>
                         <div className="flex items-end gap-1 mb-2">
                             <span className="text-4xl font-black text-white italic tracking-tighter">R$ 97,90</span>
                             <span className="text-xs text-white/50 mb-1.5 font-bold">/mês</span>
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-[#28a745]">
                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                             Disponível no seu saldo
                         </div>
                     </div>

                     <div className="space-y-2 mt-5 mb-6">
                         {[
                             "Acesso ao Robô Trader",
                             "Gestão de Banca Automática",
                             "Análises de Tendência",
                             "Suporte Prioritário"
                         ].map((item, idx) => (
                             <div key={idx} className="flex items-center gap-2">
                                 <div className="w-4 h-4 rounded-full bg-[#e51a31] flex items-center justify-center text-black">
                                     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                                 </div>
                                 <span className="text-xs font-bold text-white/80">{item}</span>
                             </div>
                         ))}
                     </div>

                     {errorMsg && (
                        <div className="text-[10px] text-[#e51a31] font-bold text-center mb-3 bg-[#e51a31]/10 py-2 rounded">
                            {errorMsg}
                        </div>
                     )}

                     <div className="mt-auto">
                         <button 
                            onClick={handleSubscribeClick}
                            disabled={isProcessing}
                            className="w-full bg-[#e51a31] hover:bg-[#ff1f3a] text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(229,26,49,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2"
                         >
                             {isProcessing ? (
                                 <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    PROCESSANDO
                                 </>
                             ) : 'ATIVAR AGORA'}
                         </button>
                         <div className="flex items-center justify-center gap-2 mt-4 cursor-pointer opacity-60 hover:opacity-100 transition-opacity" onClick={() => setAutoRenew(!autoRenew)}>
                             <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${autoRenew ? 'bg-[#e51a31] border-[#e51a31]' : 'border-white/30'}`}>
                                 {autoRenew && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                             </div>
                             <span className="text-[10px] font-bold text-white uppercase tracking-wide">Renovação Automática</span>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
      );
  }

  // --- RENDER DEFAULT DASHBOARD (IF SUBSCRIBED) ---
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-0 lg:p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 font-sans">
        <div className="bg-[#09090b] w-full lg:max-w-5xl h-[100dvh] lg:h-[85vh] lg:rounded-3xl border-none lg:border border-white/10 shadow-2xl flex flex-col lg:flex-row overflow-hidden">
            
            {/* Sidebar */}
            <aside className="w-full lg:w-64 bg-[#141516] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-row lg:flex-col shrink-0 items-center lg:items-stretch justify-between lg:justify-start p-4 lg:p-0">
                <div className="lg:p-6 lg:border-b border-white/5 flex flex-col justify-center">
                    <h2 className="text-sm lg:text-xl font-black text-white italic uppercase tracking-tighter">Gestão <span className="text-[#e51a31]">Elite</span></h2>
                    <div className="flex items-center gap-2 mt-1 lg:mt-2">
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-[#28a745] animate-pulse"></div>
                        <span className="text-[8px] lg:text-[10px] font-bold text-white/50 uppercase tracking-wider">Sistema Online</span>
                    </div>
                </div>
                
                <nav className="flex lg:flex-col gap-2 lg:gap-1 lg:p-4 overflow-x-auto lg:overflow-visible items-center lg:items-stretch">
                    <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-[#e51a31] text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        <span className="hidden lg:inline">Meus Planos</span>
                        <span className="lg:hidden">Planos</span>
                    </button>
                    <button onClick={() => openStrategyForm()} className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'strategy' && !editingPlanId ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                        <span className="hidden lg:inline">Criar Novo</span>
                        <span className="lg:hidden">Criar</span>
                    </button>
                    <button onClick={onClose} className="lg:hidden p-2 text-white/40">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </nav>

                <div className="hidden lg:flex flex-col p-4 border-t border-white/5 mt-auto gap-4">
                    {/* Subscription Validity Card */}
                    <div className="bg-[#1b1c1d] rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[#e51a31]" />
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Membro Elite</span>
                        </div>
                        <p className="text-[9px] text-white/40 uppercase font-bold">Válido até:</p>
                        <p className="text-xs text-white font-mono font-bold">
                            {new Date(stats.subscriptionExpiresAt || Date.now()).toLocaleDateString('pt-BR')}
                        </p>
                    </div>

                    <button onClick={onClose} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase">
                        Sair do Painel
                    </button>
                </div>
            </aside>

            {/* Conteúdo Principal */}
            <main className="flex-1 bg-[#050505] overflow-y-auto no-scrollbar p-4 lg:p-8">
                
                {/* --- TAB: OVERVIEW (List of Plans) --- */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end border-b border-white/5 pb-4 lg:pb-6 gap-2">
                            <div>
                                <h2 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter">Minhas Metas</h2>
                                <p className="text-white/50 text-xs lg:text-sm mt-1">
                                    Gerencie suas estratégias e selecione em qual slot ativar.
                                </p>
                            </div>
                        </header>

                        {stats.bankrollPlans.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                                <h3 className="text-xl font-black italic uppercase text-white mb-2">Nenhuma Meta Ativa</h3>
                                <p className="text-white/50 mb-6 text-sm">Crie sua primeira estratégia.</p>
                                <button onClick={() => openStrategyForm()} className="bg-[#e51a31] text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#ff1f3a]">
                                    Criar Nova Meta
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stats.bankrollPlans.map(plan => {
                                    const progressPercent = Math.min(100, Math.max(0, (plan.currentDayProfit / plan.dailyGoal) * 100));
                                    const isActiveSlot1 = stats.activePlanIds.slot1 === plan.id;
                                    const isActiveSlot2 = stats.activePlanIds.slot2 === plan.id;
                                    const isActiveAny = isActiveSlot1 || isActiveSlot2;
                                    const isCompleted = plan.currentDayProfit >= plan.dailyGoal;

                                    return (
                                        <div key={plan.id} className={`p-6 rounded-2xl border transition-all ${isActiveAny ? 'bg-[#1b1c1d] border-[#e51a31] shadow-[0_0_20px_rgba(229,26,49,0.15)] relative overflow-hidden' : 'bg-[#0f0f10] border-white/5 hover:border-white/10'}`}>
                                            
                                            {/* Status Badges */}
                                            <div className="flex gap-2 absolute top-0 right-0">
                                                {plan.operationMode === 'auto' ? (
                                                    <div className="px-2 py-1 bg-[#913ef2] text-white text-[8px] font-black uppercase rounded-bl-xl">AUTO</div>
                                                ) : (
                                                    <div className="px-2 py-1 bg-[#d97d1b] text-white text-[8px] font-black uppercase rounded-bl-xl">MANUAL</div>
                                                )}
                                                {isActiveSlot1 && <div className="px-3 py-1 bg-[#28a745] text-white text-[9px] font-black uppercase rounded-bl-xl">Slot 1</div>}
                                                {isActiveSlot2 && <div className="px-3 py-1 bg-[#34b1e2] text-white text-[9px] font-black uppercase rounded-bl-xl">Slot 2</div>}
                                            </div>
                                            
                                            <div className="flex justify-between items-start mb-4 mt-2">
                                                <div>
                                                    <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{plan.name}</h3>
                                                    <span className="text-[10px] text-white/40 uppercase font-bold">{plan.timeframe} • {plan.goalType === 'conservative' ? 'Seguro' : plan.goalType === 'moderate' ? 'Moderado' : 'Agressivo'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openStrategyForm(plan)} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors" title="Editar">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => onClickReset(e, plan.id)} 
                                                        className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors cursor-pointer relative z-20" 
                                                        title="Reiniciar Dia"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => onClickDelete(e, plan.id)} 
                                                        className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-[#e51a31] transition-colors cursor-pointer relative z-20" 
                                                        title="Excluir"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase">
                                                    <span>Progresso Hoje</span>
                                                    <span className={plan.currentDayProfit >= 0 ? 'text-[#28a745]' : 'text-[#e51a31]'}>{formatMoney(plan.currentDayProfit)} / {formatMoney(plan.dailyGoal)}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#28a745]" style={{ width: `${progressPercent}%` }} />
                                                </div>
                                                <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg">
                                                    <div className="text-center flex-1 border-r border-white/5">
                                                        <span className="block text-[8px] text-white/30 uppercase">Entrada</span>
                                                        <span className="block text-xs font-black text-white">{formatMoney(plan.entryAmount)}</span>
                                                    </div>
                                                    <div className="text-center flex-1">
                                                        <span className="block text-[8px] text-white/30 uppercase">Alvo</span>
                                                        <span className="block text-xs font-black text-[#e51a31]">{plan.targetMultiplier.toFixed(2)}x</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {isCompleted ? (
                                                <button 
                                                    onClick={(e) => handleComplete(e, plan.id)}
                                                    className="w-full py-3 rounded-xl bg-[#28a745] hover:bg-[#218838] text-white text-xs font-black uppercase tracking-widest transition-all animate-pulse shadow-lg"
                                                >
                                                    META CONCLUÍDA! (SAIR)
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    {isActiveSlot1 ? (
                                                        <button onClick={(e) => handleDisable(e, plan.id)} className="flex-1 py-3 rounded-xl bg-[#28a745]/20 text-[#28a745] border border-[#28a745]/50 text-xs font-black uppercase tracking-widest transition-all">
                                                            Parar Slot 1
                                                        </button>
                                                    ) : (
                                                        <button onClick={(e) => handleActivate(e, plan.id, 1)} className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-[#28a745]/10 hover:text-[#28a745] hover:border-[#28a745] text-white text-xs font-black uppercase tracking-widest transition-all">
                                                            Ativar Slot 1
                                                        </button>
                                                    )}

                                                    {isActiveSlot2 ? (
                                                        <button onClick={(e) => handleDisable(e, plan.id)} className="flex-1 py-3 rounded-xl bg-[#34b1e2]/20 text-[#34b1e2] border border-[#34b1e2]/50 text-xs font-black uppercase tracking-widest transition-all">
                                                            Parar Slot 2
                                                        </button>
                                                    ) : (
                                                        <button onClick={(e) => handleActivate(e, plan.id, 2)} className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-[#34b1e2]/10 hover:text-[#34b1e2] hover:border-[#34b1e2] text-white text-xs font-black uppercase tracking-widest transition-all">
                                                            Ativar Slot 2
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB: STRATEGY (Create/Edit) --- */}
                {activeTab === 'strategy' && (
                    <div className="max-w-full lg:max-w-2xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <header>
                            <h2 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter">
                                {editingPlanId ? 'Editar Estratégia' : 'Nova Estratégia'}
                            </h2>
                            <p className="text-white/50 text-xs lg:text-sm mt-1">Configure o comportamento do robô para esta meta.</p>
                        </header>

                        {errorMsg && (
                            <div className="p-4 bg-[#e51a31]/10 border border-[#e51a31]/30 rounded-xl text-[#e51a31] text-xs font-bold text-center">
                                {errorMsg}
                            </div>
                        )}

                        <div className="bg-[#1b1c1d] p-5 lg:p-8 rounded-3xl border border-white/5 space-y-6 lg:space-y-8">
                            
                            {/* 0. Plan Name */}
                            <div>
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Nome da Meta</label>
                                <input 
                                    type="text" 
                                    value={planName} 
                                    onChange={(e) => setPlanName(e.target.value)}
                                    placeholder="Ex: Alavancagem Manhã, Meta Carro..."
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-[#e51a31] outline-none"
                                />
                            </div>

                            {/* 1. Modo & Prazo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Modo de Operação</label>
                                    <div className="flex bg-black rounded-xl p-1 border border-white/10">
                                        <button 
                                            onClick={() => setOperationMode('auto')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${operationMode === 'auto' ? 'bg-[#913ef2] text-white shadow-lg' : 'text-white/40'}`}
                                        >
                                            Automático (Robô)
                                        </button>
                                        <button 
                                            onClick={() => setOperationMode('manual')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${operationMode === 'manual' ? 'bg-[#d97d1b] text-white shadow-lg' : 'text-white/40'}`}
                                        >
                                            Manual
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Prazo da Meta</label>
                                    <select 
                                        value={timeframe} 
                                        onChange={(e) => setTimeframe(e.target.value as any)}
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#e51a31] outline-none appearance-none font-bold uppercase"
                                    >
                                        <option value="daily">Diária</option>
                                        <option value="weekly">Semanal (7 Dias)</option>
                                        <option value="biweekly">Quinzenal (15 Dias)</option>
                                        <option value="monthly">Mensal (30 Dias)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Valor da Meta (Total)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-white/30 text-sm font-bold">R$</span>
                                    <input 
                                        type="number" 
                                        value={totalGoalInput} 
                                        onChange={(e) => setTotalGoalInput(e.target.value)}
                                        placeholder="Ex: 1000"
                                        className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-bold focus:border-[#e51a31] outline-none"
                                    />
                                </div>
                            </div>

                            <hr className="border-white/5" />

                            {/* 2. Configuração de Operação */}
                            <div>
                                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Configuração Operacional</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Entrada Slider */}
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sua Entrada (% Banca)</label>
                                            <span className={`text-lg font-black ${entryPercent > 20 ? 'text-[#e51a31]' : 'text-[#28a745]'}`}>{entryPercent.toFixed(2)}%</span>
                                        </div>
                                        <div className="relative pt-1">
                                            <input 
                                                type="range" 
                                                min="0.1" 
                                                max="30" 
                                                step="0.1" 
                                                value={entryPercent} 
                                                onChange={(e) => { setEntryPercent(parseFloat(e.target.value)); setIsAutoCalculated(true); }}
                                                className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-[#e51a31] relative z-10"
                                            />
                                            <div className="absolute top-1 left-0 w-full h-2 rounded-lg overflow-hidden pointer-events-none">
                                                <div className="h-full bg-gradient-to-r from-[#28a745] via-yellow-500 to-[#e51a31]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Target Wins Input */}
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Meta de Vitórias/Dia</label>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setTargetWins(Math.max(1, targetWins - 1)); setIsAutoCalculated(true); }} className="w-10 h-10 bg-black rounded-lg border border-white/10 text-white font-bold">-</button>
                                            <div className="flex-1 bg-black border border-white/10 rounded-lg h-10 flex items-center justify-center font-black text-white">
                                                {targetWins}
                                            </div>
                                            <button onClick={() => { setTargetWins(targetWins + 1); setIsAutoCalculated(true); }} className="w-10 h-10 bg-black rounded-lg border border-white/10 text-white font-bold">+</button>
                                        </div>
                                        <p className="text-[9px] text-white/30 mt-1">Quanto mais vitórias buscar, menor o risco por operação.</p>
                                    </div>
                                </div>

                                {/* Stop Loss Slider */}
                                <div className="mt-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Stop Loss Diário (% Risco)</label>
                                        <span className="text-lg font-black text-[#e51a31]">{stopLossPercent}% ({formatMoney(metrics.stopLossValue)})</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="50" 
                                        step="1" 
                                        value={stopLossPercent} 
                                        onChange={(e) => setStopLossPercent(parseInt(e.target.value))}
                                        className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-[#e51a31]"
                                    />
                                    <p className="text-[9px] text-white/30 mt-1">O robô para imediatamente se seu prejuízo líquido atingir este valor no dia.</p>
                                </div>
                            </div>

                            {/* Live Preview */}
                            <div className="bg-black/40 p-4 lg:p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[50px]" />
                                
                                <div className="flex justify-between items-center border-b border-white/5 pb-3 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-yellow-500"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                        <h4 className="text-xs font-bold text-white uppercase">Cálculo Elite IA</h4>
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${metrics.derivedGoalType === 'conservative' ? 'bg-[#28a745]/20 text-[#28a745]' : metrics.derivedGoalType === 'moderate' ? 'bg-[#34b1e2]/20 text-[#34b1e2]' : 'bg-[#e51a31]/20 text-[#e51a31]'}`}>
                                        Modo: {metrics.derivedGoalType === 'conservative' ? 'Seguro' : metrics.derivedGoalType === 'moderate' ? 'Equilibrado' : 'Alavancado'}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6 relative z-10">
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-white/40 uppercase tracking-widest">Valor da Entrada</span>
                                        <div className="text-xl font-black text-white">{formatMoney(metrics.entryAmount)}</div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-[9px] text-white/40 uppercase tracking-widest">Alvo Necessário</span>
                                        <div className={`text-3xl font-black italic ${metrics.targetMultiplier < 1.5 ? 'text-[#28a745]' : metrics.targetMultiplier > 2.5 ? 'text-[#e51a31]' : 'text-yellow-500'}`}>
                                            {metrics.targetMultiplier.toFixed(2)}x
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleSavePlan}
                                disabled={isProcessing}
                                className="w-full bg-gradient-to-r from-[#e51a31] to-[#b91527] hover:from-[#ff1f3a] hover:to-[#e51a31] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all border border-[#e51a31]/20"
                            >
                                {isProcessing ? 'Salvando...' : 'Salvar Meta'}
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    </div>
  );
};

export default BankrollManagerModal;
