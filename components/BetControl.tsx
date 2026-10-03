
import React, { useState, useEffect, useRef } from 'react';
import { GameStatus, Bet, BankrollPlan, GameHistory, AeroFantasyLeagueType, FreeFlightConfig } from '../types';
import { MIN_BET, MAX_BET } from '../constants';
import NumpadModal from './NumpadModal';

interface BetControlProps {
  mode: 'manual' | 'auto' | 'manager';
  setMode: (mode: 'manual' | 'auto' | 'manager') => void;
  status: GameStatus;
  currentMultiplier: number;
  balance: number;
  freeFlights: number;
  freeFlightConfigs?: FreeFlightConfig[];
  onPlaceBet: (amount: number, useFreeBet: boolean) => void;
  onCancelBet: () => void;
  onCashout: (specificMult?: number) => void; 
  activeBet: Bet | null;
  nextRoundBet: number | null;
  isSubscribed?: boolean;
  bankrollPlan?: BankrollPlan;
  onOpenManager?: () => void;
  history?: GameHistory[];
  activeEventId?: string | null; 
  activeLeagueType?: AeroFantasyLeagueType | null; // NOVO
  fantasyFlightsLeft?: number | null;
  aerocoinBalance?: number;      
}

const BetControl: React.FC<BetControlProps> = ({ 
  mode,
  setMode,
  status, 
  currentMultiplier, 
  balance, 
  freeFlights,
  freeFlightConfigs = [],
  onPlaceBet, 
  onCancelBet,
  onCashout, 
  activeBet,
  nextRoundBet,
  isSubscribed,
  bankrollPlan,
  onOpenManager,
  history = [],
  activeEventId,
  activeLeagueType,
  fantasyFlightsLeft,
  aerocoinBalance
}) => {
  const [amount, setAmount] = useState(activeEventId ? 100 : 5.00); 
  const [inputValue, setInputValue] = useState(activeEventId ? "100" : "5.00");
  const [isFocused, setIsFocused] = useState(false);
  const [isOptimisticCashing, setIsOptimisticCashing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [isAutoCashoutNumpadOpen, setIsAutoCashoutNumpadOpen] = useState(false);
  
  const [useFreeFlightMode, setUseFreeFlightMode] = useState(false);
  
  // Auto Bet State
  const [autoBetEnabled, setAutoBetEnabled] = useState(false);
  const [autoCashOutEnabled, setAutoCashOutEnabled] = useState(false);
  const [autoCashOutValue, setAutoCashOutValue] = useState(2.00);
  const [autoCashOutText, setAutoCashOutText] = useState("2.00");

  // Manager Mode State
  const [isManagerRunning, setIsManagerRunning] = useState(false);
  const [managerMessage, setManagerMessage] = useState<string | null>(null);
  const [aiAnalysisState, setAiAnalysisState] = useState<'idle' | 'scanning' | 'decided'>('idle');
  const [aiConfidence, setAiConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  
  const [aiDecision, setAiDecision] = useState<'analyzing' | 'bet' | 'skip'>('analyzing');
  const analysisTimeoutRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lastStatusRef = useRef<GameStatus>(status);
  const hasPlacedBetThisRound = useRef(false);

  const hasFreeFlightsAvailable = freeFlights > 0;
  const activeFFConfig = freeFlightConfigs.find(c => c.active);
  const minFFMult = activeFFConfig?.minCashoutMultiplier || 1.5;
  const ffValue = activeFFConfig?.valuePerFlight || 1.0;

  // Se estiver em evento, voo grátis é desabilitado visualmente/logicamente
  const isFreeBetActive = !activeEventId && hasFreeFlightsAvailable && useFreeFlightMode;
  const isMultiplierLeague = activeEventId && activeLeagueType === 'multiplier';

  // --- TRAVA DE MUDANÇA DE MODO ---
  // O jogador não pode trocar de modo APENAS se estiver voando (Aposta Ativa + Jogo Voando)
  // Se ele sacar (status 'cashed') ou perder (status 'lost'), ou o jogo não estiver voando, libera.
  const isModeLocked = status === GameStatus.FLYING && activeBet?.status === 'active';

  // Se entrar em modo evento (Moedas), seta valor default apropriado
  useEffect(() => {
      if (activeEventId) {
          if (activeLeagueType === 'multiplier') {
              // Liga de multiplicador não usa valor monetário, é fixo 1 voo
              setAmount(1);
              setInputValue("1 Voo");
          } else {
              // Liga de Aerocoins usa valores mais altos
              if (amount < 10) {
                  setAmount(100);
                  setInputValue("100");
              }
          }
      } else {
          // Reset p/ real se sair do evento
          if (amount >= 100 && !isFreeBetActive) {
              setAmount(1.00);
              setInputValue("1.00");
          }
      }
  }, [activeEventId, activeLeagueType]);

  // Sincroniza o valor da aposta com o plano da IA quando em modo Manager
  useEffect(() => {
    if (mode === 'manager' && bankrollPlan && !activeEventId) {
        setAmount(bankrollPlan.entryAmount);
        setInputValue(bankrollPlan.entryAmount.toFixed(2));
    }
  }, [mode, bankrollPlan, activeEventId]);

  useEffect(() => {
    if (isFreeBetActive && amount !== ffValue) {
      setAmount(ffValue);
      setInputValue(ffValue.toFixed(2));
    }
  }, [isFreeBetActive, amount, ffValue]);

  useEffect(() => {
    if (!isFocused && !isMultiplierLeague) {
        setInputValue(activeEventId ? amount.toFixed(0) : amount.toFixed(2));
    }
  }, [amount, isFocused, activeEventId, isMultiplierLeague]);

  useEffect(() => {
    if (!activeBet || activeBet.status !== 'active') {
      setIsOptimisticCashing(false);
    }
  }, [activeBet]);

  // --- LÓGICA AVANÇADA DE TRADER (IA) ---
  const analyzeMarketTrend = (historyData: GameHistory[]) => {
      if (historyData.length < 5) return { action: 'bet', reason: 'Análise Inicial', confidence: 'medium' }; 
      const last1 = historyData[0];
      const last5 = historyData.slice(0, 5);
      
      if (last1.multiplier < 1.15) return { action: 'skip', reason: 'Pular: Risco de Crash Duplo', confidence: 'high' };
      const bluesInLast5 = last5.filter(h => h.multiplier < 2.00).length;
      if (bluesInLast5 >= 3 && last1.multiplier < 2.00) return { action: 'skip', reason: 'Pular: Tendência de Baixa', confidence: 'high' };
      
      const isAlternating = 
          (historyData[0].multiplier > 2 && historyData[1].multiplier < 2 && historyData[2].multiplier > 2) ||
          (historyData[0].multiplier < 2 && historyData[1].multiplier > 2 && historyData[2].multiplier < 2);
      
      if (isAlternating) return { action: 'skip', reason: 'Pular: Mercado Indeciso', confidence: 'medium' };
      if (historyData[0].multiplier >= 2.00 && historyData[1].multiplier >= 2.00) return { action: 'bet', reason: 'Entrada: Surfando a Tendência', confidence: 'high' };
      if (historyData[0].multiplier >= 10.00 && bluesInLast5 >= 3) return { action: 'bet', reason: 'Entrada: Estabilização Pós-Vela', confidence: 'medium' };

      return { action: 'bet', reason: 'Entrada: Padrão Seguro', confidence: 'high' };
  };

  // Executa análise quando entra em WAITING
  useEffect(() => {
      if (status === GameStatus.WAITING && lastStatusRef.current !== GameStatus.WAITING) {
          hasPlacedBetThisRound.current = false;
          
          if (mode === 'manager' && isManagerRunning) {
              setAiDecision('analyzing');
              setAiAnalysisState('scanning');
              setManagerMessage("Lendo Gráfico...");

              const processingTime = 1500 + Math.random() * 2000;
              
              analysisTimeoutRef.current = setTimeout(() => {
                  const decision = analyzeMarketTrend(history);
                  setAiConfidence(decision.confidence as any);
                  if (decision.action === 'skip') {
                      setAiDecision('skip');
                      setManagerMessage(decision.reason);
                      setAiAnalysisState('decided');
                  } else {
                      setAiDecision('bet');
                      setManagerMessage(decision.reason);
                      setAiAnalysisState('decided');
                  }
              }, processingTime);
          }
      }
      return () => clearTimeout(analysisTimeoutRef.current);
  }, [status, mode, isManagerRunning, history]);


  // --- AUTO BET LOGIC ---
  useEffect(() => {
      if (status === GameStatus.WAITING && !hasPlacedBetThisRound.current && !activeBet && !nextRoundBet) {
          
          if (mode === 'manager' && isManagerRunning && isSubscribed && bankrollPlan && !activeEventId) {
              if (bankrollPlan.currentDayProfit >= bankrollPlan.dailyGoal) { setIsManagerRunning(false); setManagerMessage("Meta Batida! Robô parado."); return; }
              if (bankrollPlan.currentDayProfit <= -bankrollPlan.stopLoss) { setIsManagerRunning(false); setManagerMessage("Stop Loss Atingido! Proteção Ativada."); return; }
              if (balance < bankrollPlan.entryAmount) { setIsManagerRunning(false); setManagerMessage("Saldo Insuficiente."); return; }

              if (aiDecision === 'bet' && aiAnalysisState === 'decided') {
                  onPlaceBet(bankrollPlan.entryAmount, false);
                  hasPlacedBetThisRound.current = true;
              } 
          }
          else if (mode === 'auto' && autoBetEnabled) {
              // Verifica saldo Aerocoin ou Real
              if (activeEventId) {
                  if (activeLeagueType !== 'multiplier') {
                      if ((aerocoinBalance || 0) < amount) return;
                  }
                  // Se for multiplier league, sempre permite (validado no parent)
              } else {
                  if (!isFreeBetActive && balance < amount) return;
              }
              
              onPlaceBet(amount, isFreeBetActive);
              hasPlacedBetThisRound.current = true;
          }
      }

      lastStatusRef.current = status;
  }, [status, mode, isManagerRunning, isSubscribed, bankrollPlan, balance, activeBet, nextRoundBet, onPlaceBet, amount, isFreeBetActive, autoBetEnabled, aiDecision, aiAnalysisState, history, activeEventId, activeLeagueType, aerocoinBalance]);


  // --- AUTO CASHOUT LOGIC (PRECISÃO EXATA) ---
  useEffect(() => {
      if (status === GameStatus.FLYING && activeBet && activeBet.status === 'active' && !isOptimisticCashing) {
          
          let targetMult = null;

          if (mode === 'manager' && isManagerRunning && bankrollPlan && !activeEventId) {
              targetMult = bankrollPlan.targetMultiplier;
          } else if (mode === 'auto' && autoCashOutEnabled) {
              targetMult = autoCashOutValue;
          }

          if (targetMult && currentMultiplier >= targetMult) {
              if (activeBet.isFreeFlight && currentMultiplier < 2.00) return;
              setIsOptimisticCashing(true);
              onCashout(targetMult); 
          }
      }
  }, [status, currentMultiplier, activeBet, mode, isManagerRunning, bankrollPlan, autoCashOutEnabled, autoCashOutValue, isOptimisticCashing, onCashout, activeEventId]);


  // ... Handlers ...
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFreeBetActive || mode === 'manager' || isMultiplierLeague) return;
    let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    setInputValue(val);
    const num = parseFloat(val);
    if (!isNaN(num)) setAmount(num);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (isFreeBetActive) {
        setAmount(ffValue);
        setInputValue(ffValue.toFixed(2));
        return;
    }
    if (isMultiplierLeague) return;

    let num = parseFloat(inputValue);
    const min = activeEventId ? 10 : MIN_BET;
    const max = activeEventId ? 100000 : MAX_BET;
    
    if (isNaN(num) || num < min) num = min;
    if (num > max) num = max;
    setAmount(num);
    setInputValue(activeEventId ? num.toFixed(0) : num.toFixed(2));
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
    setTimeout(() => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 200);
  };

  const adjustAmount = (delta: number) => {
    if (isFreeBetActive || mode === 'manager' || isMultiplierLeague) return;
    const min = activeEventId ? 10 : MIN_BET;
    const max = activeEventId ? 100000 : MAX_BET;
    // Escala maior para Aerocoins
    const actualDelta = activeEventId ? delta * 50 : delta; 
    
    const next = Math.min(max, Math.max(min, amount + actualDelta));
    setAmount(next);
    setInputValue(activeEventId ? next.toFixed(0) : next.toFixed(2));
  };

  const multiplyAmount = (factor: number) => {
    if (isFreeBetActive || mode === 'manager' || isMultiplierLeague) return;
    const min = activeEventId ? 10 : MIN_BET;
    const max = activeEventId ? 100000 : MAX_BET;
    let next = amount * factor;
    if (activeEventId) {
      next = Math.round(next / 10) * 10;
    } else {
      next = Math.round(next * 100) / 100;
    }
    next = Math.min(max, Math.max(min, next));
    setAmount(next);
    setInputValue(activeEventId ? next.toFixed(0) : next.toFixed(2));
  };

  const handleCashoutAction = (e: React.PointerEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (activeBet?.isFreeFlight && currentMultiplier < minFFMult) return;

    if (activeBet?.status === 'active' && status === GameStatus.FLYING && !isOptimisticCashing) {
      setIsOptimisticCashing(true);
      onCashout(); 
      setTimeout(() => setIsOptimisticCashing(false), 500);
    }
  };

  const handleBetAction = async (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isProcessing) return;
      
      const currentBalance = activeEventId ? (aerocoinBalance || 0) : balance;
      // Se for liga de multiplicador, ignora saldo (usa voos, validado no parent)
      // Se for liga de aerocoins, checa aerocoins.
      // Se for real, checa balance ou free bet.

      const canBet = activeEventId 
          ? (activeLeagueType === 'multiplier' || (aerocoinBalance || 0) >= amount)
          : (isFreeBetActive || balance >= amount || mode === 'manager'); // Manager checks balance internally before start

      if (!canBet || isLocked) return;
      
      setIsProcessing(true);
      try {
          if (mode === 'manager') {
              setIsManagerRunning(!isManagerRunning);
              if(!isManagerRunning) {
                  setManagerMessage(null);
                  setAiAnalysisState('idle');
              }
          } else {
              await onPlaceBet(amount, isFreeBetActive);
          }
      } finally {
          setIsProcessing(false);
      }
  };

  const handleCancelAction = async (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isProcessing) return;
      
      setIsProcessing(true);
      try {
          await onCancelBet();
      } finally {
          setIsProcessing(false);
      }
  };

  const handleAutoCashOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[0-9]*[.,]?[0-9]*$/.test(val) || val === "") {
      setAutoCashOutText(val);
      const numericVal = parseFloat(val.replace(',', '.'));
      if (!isNaN(numericVal)) {
        setAutoCashOutValue(numericVal);
      }
    }
  };

  const handleAutoCashOutBlur = () => {
    let numericVal = parseFloat(autoCashOutText.replace(',', '.'));
    if (isNaN(numericVal) || numericVal < 1.01) numericVal = 1.01;
    setAutoCashOutValue(numericVal);
    setAutoCashOutText(numericVal.toFixed(2));
  };

  const isCashedOut = activeBet?.status === 'cashed';
  const isActive = activeBet?.status === 'active';
  const isScheduled = !!nextRoundBet;
  const canCancel = (status === GameStatus.WAITING && isActive) || isScheduled;

  const isAutoBetRunning = (mode === 'auto' && autoBetEnabled) || (mode === 'manager' && isManagerRunning);
  const canCashoutFree = isActive && activeBet?.isFreeFlight ? currentMultiplier >= minFFMult : true;
  
  // Bloqueia IA no modo Evento
  const isLocked = (mode === 'manager' && ((!isSubscribed || !bankrollPlan) || activeEventId));

  const currentBalance = activeEventId ? (aerocoinBalance || 0) : balance;
  
  // Definir os valores rápidos dos botões exatamente conforme solicitado
  const quickAmounts = activeEventId && !isMultiplierLeague 
      ? [100, 250, 500, 1000, 2500] 
      : [5, 10, 20, 50, 100];

  return (
    <div 
      ref={containerRef}
      className={`rounded-2xl p-2.5 sm:p-3.5 flex flex-col justify-between gap-2.5 sm:gap-3 border shadow-2xl h-full transition-all duration-300 relative overflow-hidden touch-manipulation ${
        activeEventId ? 'bg-[#0f1922] border-[#34b1e2]/40' :
        isFreeBetActive ? 'bg-[#230c33] border-[#913ef2]/40' : 
        mode === 'manager' && isManagerRunning ? 'bg-[#0c1a24] border-[#34b1e2]/40' :
        'bg-[#181a1d] border-white/10'
    }`}>
      {mode === 'auto' && (
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#913ef2]/10 blur-[60px] pointer-events-none" />
      )}
      {mode === 'manager' && isManagerRunning && (
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#34b1e2]/15 blur-[50px] pointer-events-none animate-pulse" />
      )}
      
      {activeEventId && (
          <div className="absolute top-0 left-0 w-full bg-[#34b1e2] h-1 animate-pulse" />
      )}

      {/* Header com Modos */}
      <div className="flex justify-between items-center z-10 w-full gap-2">
          <div className={`flex bg-[#0d0e10] rounded-xl p-1 flex-1 border border-white/5 transition-opacity ${isModeLocked ? 'opacity-50 pointer-events-none' : ''}`}>
            <button 
              disabled={isModeLocked}
              onPointerDown={(e) => { e.preventDefault(); if(!isModeLocked) { setMode('manual'); setIsManagerRunning(false); } }} 
              className={`flex-1 text-[9px] sm:text-[11px] font-black uppercase py-1.5 px-2 rounded-lg transition-all duration-75 active:scale-95 cursor-pointer ${mode === 'manual' ? 'bg-[#2a2d34] text-white shadow-md' : 'text-white/40 hover:text-white/70'}`}
            >
              Manual
            </button>
            <button 
              disabled={isModeLocked}
              onPointerDown={(e) => { e.preventDefault(); if(!isModeLocked) { setMode('auto'); setIsManagerRunning(false); } }} 
              className={`flex-1 text-[9px] sm:text-[11px] font-black uppercase py-1.5 px-2 rounded-lg transition-all duration-75 active:scale-95 cursor-pointer ${mode === 'auto' ? 'bg-[#913ef2] text-white shadow-[0_0_12px_rgba(145,62,242,0.45)]' : 'text-white/40 hover:text-white/70'}`}
            >
              Auto
            </button>
            <button 
              disabled={isModeLocked}
              onPointerDown={(e) => { e.preventDefault(); if(!isModeLocked) { setMode('manager'); } }} 
              className={`flex-1 text-[9px] sm:text-[11px] font-black uppercase py-1.5 px-2 rounded-lg transition-all duration-75 active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${mode === 'manager' ? 'bg-[#34b1e2] text-black shadow-[0_0_12px_rgba(52,177,226,0.45)] font-black' : 'text-white/40 hover:text-white/70'}`}
            >
              {!isSubscribed && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              Gestão
            </button>
          </div>

          {/* Toggle de Voo Grátis */}
          {hasFreeFlightsAvailable && mode !== 'manager' && !activeEventId && (
              <div className={`flex items-center gap-1.5 bg-[#0d0e10] pl-2 pr-1.5 py-1 rounded-xl border border-white/5 shrink-0 transition-opacity ${isModeLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span className="text-[9px] font-bold text-[#913ef2] uppercase mr-0.5 hidden sm:inline">
                      {freeFlights} Voos
                  </span>
                  <button 
                    disabled={isModeLocked}
                    onPointerDown={(e) => { e.preventDefault(); setUseFreeFlightMode(!useFreeFlightMode); }}
                    className={`w-8 h-4.5 rounded-full relative transition-colors duration-200 cursor-pointer ${useFreeFlightMode ? 'bg-[#913ef2]' : 'bg-[#2c2d30]'}`}
                  >
                      <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-md transition-all duration-200 ${useFreeFlightMode ? 'left-[16px]' : 'left-0.5'}`} />
                  </button>
              </div>
          )}
          
          {/* Active Event Badge */}
          {activeEventId && (
              <div className="bg-[#34b1e2] text-black text-[8px] sm:text-[10px] font-black uppercase px-2.5 py-1 rounded-lg animate-pulse shadow-md">
                  {isMultiplierLeague ? 'VOOS' : 'AC'}
              </div>
          )}
      </div>

      <div className="flex gap-2 sm:gap-3.5 h-full min-h-[120px] sm:min-h-[135px] z-10 relative items-stretch">
        {/* LOCK OVERLAY FOR MANAGER IN EVENT */}
        {isLocked && (
            <div className="absolute inset-0 z-20 bg-black/95 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center text-center p-3">
                {activeEventId ? (
                    <>
                        <svg className="text-[#34b1e2] mb-1.5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        <p className="text-[10px] font-bold text-[#34b1e2] uppercase tracking-wider">IA Bloqueada em Eventos</p>
                    </>
                ) : (
                    <button 
                        onClick={onOpenManager}
                        className="bg-[#d97d1b] hover:bg-[#b66614] text-white px-4 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] shadow-[0_0_15px_rgba(217,125,27,0.35)] active:scale-95 transition-transform duration-75 flex items-center gap-2 animate-pulse"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        DESBLOQUEAR PLANO
                    </button>
                )}
            </div>
        )}

        {/* Lado Esquerdo: Seletor de Valor Espaçoso */}
        <div className="flex-[1.15] flex flex-col justify-between min-w-0">
           <div className={`bg-[#0c0d10] rounded-2xl p-2 sm:p-3 flex flex-col justify-between border-2 transition-all h-full ${
               isFocused ? (activeEventId ? 'border-[#34b1e2]' : 'border-[#e51a31]') : 
               activeEventId ? 'border-[#34b1e2]/40 bg-[#0f1922]' :
               isFreeBetActive ? 'border-[#913ef2]/40 bg-[#1e0a2b]' : 
               mode === 'manager' && isManagerRunning ? 'border-[#34b1e2]/40 bg-[#0c1a24]' : 'border-white/10 shadow-inner'
           }`}>
              
              {mode === 'manager' && !activeEventId ? (
                  <div className="flex flex-col items-center justify-center h-full w-full py-1">
                      <span className="text-[9px] sm:text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1">Entrada Fixa ({bankrollPlan?.entryPercentage.toFixed(1)}%)</span>
                      <div className="text-lg sm:text-2xl font-black text-[#34b1e2] italic truncate w-full text-center">
                          R$ {bankrollPlan ? bankrollPlan.entryAmount.toFixed(2) : '0.00'}
                      </div>
                      <div className="mt-1.5 px-2.5 py-0.5 rounded-md bg-[#34b1e2]/15 text-[8px] sm:text-[9.5px] text-[#34b1e2] font-black uppercase">
                          Alvo: {bankrollPlan?.targetMultiplier.toFixed(2)}x
                      </div>
                  </div>
              ) : (
                  <>
                    <div className="flex items-center justify-between w-full mb-1 sm:mb-1.5">
                        <button 
                          disabled={isFreeBetActive || isMultiplierLeague}
                          onPointerDown={(e) => { e.preventDefault(); adjustAmount(-1); }} 
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#242730] hover:bg-[#343845] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full font-black text-base sm:text-lg active:scale-90 transition-transform duration-75 shrink-0 select-none cursor-pointer shadow-sm border border-white/5"
                        >
                          -
                        </button>
                        <div 
                          onClick={() => {
                            if (!isFreeBetActive && !isMultiplierLeague && mode !== 'manager') {
                              setIsNumpadOpen(true);
                            }
                          }}
                          className={`flex flex-col items-center justify-center w-full min-w-0 px-2 py-1 rounded-xl transition-all select-none ${!isFreeBetActive && !isMultiplierLeague && mode !== 'manager' ? 'cursor-pointer hover:bg-white/5 active:scale-95' : ''}`}
                        >
                            <span className={`text-center font-black text-base sm:text-2xl w-full outline-none tracking-tight truncate drop-shadow-sm ${activeEventId ? 'text-[#34b1e2]' : isFreeBetActive ? 'text-[#913ef2]' : 'text-white'}`}>
                              {isMultiplierLeague ? "1 Voo" : (activeEventId ? amount.toFixed(0) : `R$ ${amount.toFixed(2)}`)}
                            </span>
                            {isFreeBetActive && <span className="text-[8px] sm:text-[9px] font-bold text-[#913ef2] uppercase tracking-wider -mt-0.5 truncate w-full text-center">Voo Grátis</span>}
                            {activeEventId && !isMultiplierLeague && <span className="text-[8px] sm:text-[9px] font-bold text-[#34b1e2] uppercase tracking-wider -mt-0.5 truncate w-full text-center">Aerocoins</span>}
                            {isMultiplierLeague && <span className="text-[8px] sm:text-[9px] font-bold text-[#34b1e2] uppercase tracking-wider -mt-0.5 truncate w-full text-center">Liga Fixa</span>}
                        </div>
                        <button 
                          disabled={isFreeBetActive || isMultiplierLeague}
                          onPointerDown={(e) => { e.preventDefault(); adjustAmount(1); }} 
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#242730] hover:bg-[#343845] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full font-black text-base sm:text-lg active:scale-90 transition-transform duration-75 shrink-0 select-none cursor-pointer shadow-sm border border-white/5"
                        >
                          +
                        </button>
                    </div>
                    
                    {/* Botões de Valor Rápido Espaçosos: 5, 10, 20, 50, 100 */}
                    <div className={`grid grid-cols-5 gap-1.5 sm:gap-2 w-full transition-opacity ${isMultiplierLeague ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        {quickAmounts.map(v => (
                        <button 
                            key={v} 
                            disabled={isFreeBetActive || isMultiplierLeague}
                            onPointerDown={(e) => { e.preventDefault(); setAmount(v); setInputValue(activeEventId ? v.toFixed(0) : v.toFixed(2)); }} 
                            className={`text-[9px] sm:text-xs md:text-[13px] font-black py-1.5 sm:py-2.5 rounded-xl transition-all duration-75 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed truncate text-center cursor-pointer shadow-sm border ${
                                activeEventId 
                                  ? 'bg-[#34b1e2]/15 hover:bg-[#34b1e2]/25 text-[#34b1e2] border-[#34b1e2]/30' 
                                  : mode === 'auto' 
                                  ? 'bg-[#913ef2]/15 hover:bg-[#913ef2]/25 text-[#913ef2] border-[#913ef2]/30' 
                                  : 'bg-[#20232a] hover:bg-[#2c313a] text-white/95 hover:text-white border-white/10'
                            }`}
                        >
                            {activeEventId ? v : v}
                        </button>
                        ))}
                    </div>
                  </>
              )}
           </div>
        </div>

        {/* Lado Direito: Botão de Ação Gigante e Imponente */}
        <div className="flex-1 min-w-0 flex items-stretch">
          {isCashedOut ? (
             <div className="w-full h-full bg-black/50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-[#28a745]/40 animate-in fade-in zoom-in duration-300 p-2 text-center">
                <span className="text-[9px] sm:text-xs font-black text-white/50 uppercase tracking-widest mb-1 text-center truncate w-full">
                    {activeBet?.multiplier ? `@ ${activeBet.multiplier.toFixed(2)}x` : 'Sacado'}
                </span>
                <span className="text-sm sm:text-xl md:text-2xl font-black text-[#28a745] italic text-center truncate w-full drop-shadow-md">
                    {activeEventId && isMultiplierLeague 
                        ? (activeBet?.multiplier?.toFixed(2) + ' PTS') 
                        : activeEventId 
                            ? (activeBet?.payout?.toFixed(0) + ' AC') 
                            : `R$ ${(activeBet?.payout || 0).toFixed(2)}`
                    }
                </span>
             </div>
          ) : canCancel ? (
            <button 
              onPointerDown={handleCancelAction} 
              className="w-full h-full bg-gradient-to-b from-[#e51a31] to-[#b80e22] hover:from-[#ff2d55] hover:to-[#cb011a] text-white rounded-2xl flex flex-col items-center justify-center p-2.5 sm:p-3.5 transition-all duration-75 active:scale-95 shadow-[0_6px_20px_rgba(229,26,49,0.4)] border border-[#ff2d55]/40 group select-none touch-manipulation min-w-0 cursor-pointer"
            >
              <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest mb-0.5 opacity-90 text-center truncate w-full">Cancelar</span>
              <span className="text-base sm:text-2xl font-black italic text-center truncate w-full drop-shadow-md">{activeEventId && isMultiplierLeague ? 'VOO' : activeEventId ? (activeBet?.amount || nextRoundBet || 0).toFixed(0) : 'R$ ' + (activeBet?.amount || nextRoundBet || 0).toFixed(0)}</span>
            </button>
          ) : (isActive && status === GameStatus.FLYING) || isOptimisticCashing ? (
            <button 
              onPointerDown={handleCashoutAction} 
              disabled={isOptimisticCashing || !canCashoutFree}
              className={`w-full h-full select-none touch-manipulation min-w-0 rounded-2xl flex flex-col items-center justify-center p-2.5 sm:p-3.5 transition-all duration-75 active:scale-95 cursor-pointer ${
                  isOptimisticCashing ? 'bg-[#b66614] cursor-wait' : 
                  !canCashoutFree ? 'bg-gray-700 cursor-not-allowed border-2 border-gray-600' :
                  'bg-gradient-to-b from-[#d97d1b] to-[#a85b09] hover:from-[#f39c12] hover:to-[#c66b16] shadow-[0_6px_24px_rgba(217,125,27,0.45)] border border-[#f39c12]/50'
                } text-white`}
            >
              <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest mb-0.5 opacity-90 text-center truncate w-full">
                  {isOptimisticCashing ? 'Processando' : !canCashoutFree ? `> ${minFFMult}x` : 'SACAR'}
              </span>
              <span className={`text-base sm:text-2xl md:text-3xl font-black italic leading-tight drop-shadow-md text-center truncate w-full ${!canCashoutFree ? 'opacity-50' : ''}`}>
                {activeEventId && isMultiplierLeague ? (activeBet!.multiplier || currentMultiplier).toFixed(2) + 'x' : activeEventId ? (activeBet!.amount * currentMultiplier).toFixed(0) : 'R$ ' + (activeBet!.amount * currentMultiplier).toFixed(2)}
              </span>
            </button>
          ) : (
            <button 
              disabled={
                  (activeEventId && isMultiplierLeague && fantasyFlightsLeft !== null && fantasyFlightsLeft <= 0) ||
                  (activeEventId && !isMultiplierLeague && (aerocoinBalance || 0) < amount) || 
                  (!activeEventId && !isFreeBetActive && balance < amount && mode !== 'manager') || 
                  isLocked
              } 
              onPointerDown={handleBetAction} 
              className={`w-full h-full rounded-2xl flex flex-col items-center justify-center p-2.5 sm:p-3.5 transition-all duration-75 active:scale-95 shadow-xl group select-none touch-manipulation min-w-0 cursor-pointer
                ${activeEventId
                  ? (isMultiplierLeague && fantasyFlightsLeft !== null && fantasyFlightsLeft <= 0)
                    ? 'bg-gray-800 opacity-50 text-white/50 border border-white/5 cursor-not-allowed'
                    : 'bg-gradient-to-b from-[#34b1e2] to-[#1f87b0] hover:from-[#4fc3f7] hover:to-[#229acf] shadow-[0_0_18px_rgba(52,177,226,0.35)] text-black border border-[#4fc3f7]/50'
                  : mode === 'manager'
                  ? isManagerRunning 
                    ? 'bg-gradient-to-b from-[#e51a31] to-[#b80e22] shadow-[0_0_18px_rgba(229,26,49,0.45)] text-white animate-pulse border border-red-500/40'
                    : 'bg-gradient-to-b from-[#34b1e2] to-[#1f87b0] shadow-[0_0_18px_rgba(52,177,226,0.35)] text-black border border-[#4fc3f7]/50'
                  : isFreeBetActive
                  ? 'bg-gradient-to-b from-[#913ef2] to-[#691cb8] shadow-[0_0_18px_rgba(145,62,242,0.45)] text-white animate-pulse border border-purple-400/40'
                  : isAutoBetRunning 
                  ? 'bg-gradient-to-b from-[#913ef2] to-[#691cb8] shadow-[0_4px_16px_rgba(145,62,242,0.35)] text-white border border-purple-400/40' 
                  : (balance < amount ? 'bg-gray-800 opacity-50 text-white/50 border border-white/5' : 'bg-gradient-to-b from-[#28a745] to-[#1e7e34] hover:from-[#2ecc71] hover:to-[#218838] shadow-[0_6px_20px_rgba(40,167,69,0.4)] text-white border border-[#2ecc71]/40')
                }`}
            >
              <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest mb-0.5 opacity-90 text-center leading-tight truncate w-full">
                {activeEventId && isMultiplierLeague 
                    ? (fantasyFlightsLeft !== null && fantasyFlightsLeft <= 0 ? 'FIM DA COTA' : 'VOO') 
                    : activeEventId ? 'Apostar AC' : mode === 'manager' 
                    ? (isManagerRunning ? 'PARAR IA' : 'ATIVAR IA') 
                    : isAutoBetRunning 
                        ? 'AUTO' 
                        : isFreeBetActive ? `VOO GRÁTIS` : (status === GameStatus.FLYING ? 'PRÓXIMA' : 'APOSTAR')}
              </span>
              
              {mode === 'manager' && !activeEventId ? (
                  <div className="flex flex-col items-center py-0.5">
                      {isManagerRunning ? (
                          <div className="flex flex-col items-center">
                              <span className="text-white font-black text-[9px] sm:text-xs uppercase animate-pulse">
                                  {aiAnalysisState === 'scanning' ? 'Analisando...' : 'Operando'}
                              </span>
                          </div>
                      ) : (
                          <span className="text-xs sm:text-base font-black uppercase tracking-wider">INICIAR</span>
                      )}
                  </div>
              ) : (
                  <span className="text-base sm:text-2xl md:text-3xl font-black italic text-center truncate w-full drop-shadow-md">
                    {activeEventId && isMultiplierLeague 
                        ? (fantasyFlightsLeft !== null && fantasyFlightsLeft <= 0 ? 'ESGOTADO' : 'DECOLAR') 
                        : activeEventId ? amount.toFixed(0) : 'R$ ' + amount.toFixed(0)}
                  </span>
              )}
              
              {isAutoBetRunning && <div className="mt-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </button>
          )}
        </div>
      </div>

      {managerMessage && mode === 'manager' && !activeEventId && (
          <div className="absolute bottom-2 left-0 right-0 text-center z-30">
              <span className={`text-[10px] font-black px-3 py-1 rounded-lg text-white border border-white/10 shadow-lg ${managerMessage.includes('Pular') ? 'bg-[#e51a31]/95' : managerMessage.includes('Stop') ? 'bg-[#e51a31]/95' : 'bg-[#34b1e2]/95 text-black'}`}>
                  {managerMessage}
              </span>
          </div>
      )}

      {mode === 'auto' && (
        <div className="flex flex-col gap-2 mt-0.5 pt-2 border-t border-white/5 animate-in slide-in-from-bottom-2 duration-500 z-10">
          <div className="grid grid-cols-2 gap-2">
            <div className={`flex items-center justify-between px-2 py-1.5 rounded-xl border transition-all ${autoBetEnabled ? 'bg-[#913ef2]/10 border-[#913ef2]/40' : 'bg-[#141516] border-white/5'}`}>
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-white/50 tracking-wider">Aposta Auto</span>
                <span className={`text-[7px] sm:text-[8px] font-bold uppercase transition-colors ${autoBetEnabled ? 'text-[#913ef2]' : 'text-white/20'}`}>
                  {autoBetEnabled ? 'Ativado' : 'Off'}
                </span>
              </div>
              <button 
                onPointerDown={(e) => { e.preventDefault(); setAutoBetEnabled(!autoBetEnabled); }} 
                className={`w-8 h-4.5 rounded-full relative transition-all duration-75 shadow-inner ${autoBetEnabled ? 'bg-[#913ef2]' : 'bg-[#2c2d30]'}`}
              >
                <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all duration-205 shadow-md ${autoBetEnabled ? 'left-[16px]' : 'left-0.5'}`} />
              </button>
            </div>

            <div className={`flex items-center justify-between px-2 py-1.5 rounded-xl border transition-all ${autoCashOutEnabled ? 'bg-[#d97d1b]/10 border-[#d97d1b]/40' : 'bg-[#141516] border-white/5'}`}>
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-white/50 tracking-wider">Auto Saque</span>
                <span className={`text-[7px] sm:text-[8px] font-bold uppercase transition-colors ${autoCashOutEnabled ? 'text-[#d97d1b]' : 'text-white/20'}`}>
                  {autoCashOutEnabled ? 'Ativado' : 'Off'}
                </span>
              </div>
              <button 
                onPointerDown={(e) => { e.preventDefault(); setAutoCashOutEnabled(!autoCashOutEnabled); }} 
                className={`w-8 h-4.5 rounded-full relative transition-all duration-75 shadow-inner ${autoCashOutEnabled ? 'bg-[#d97d1b]' : 'bg-[#2c2d30]'}`}
              >
                <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all duration-205 shadow-md ${autoCashOutEnabled ? 'left-[16px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          <div className={`transition-all duration-300 ${autoCashOutEnabled ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none -translate-y-2'}`}>
             <div className="bg-black/60 px-2 py-1.5 rounded-xl border border-white/5 flex items-center justify-between shadow-md">
               <div className="flex flex-col">
                 <span className="text-[8px] font-black uppercase text-[#d97d1b] tracking-wider mb-0.5">Alvo Saque:</span>
                 <p className="text-[6.5px] font-bold text-white/30 uppercase">Multiplicador</p>
               </div>
               <div 
                 onClick={() => { if (autoCashOutEnabled) setIsAutoCashoutNumpadOpen(true); }}
                 className="flex items-center gap-1.5 bg-[#1b1c1d] hover:bg-[#282a2e] px-2.5 py-1 rounded-lg border border-white/10 cursor-pointer active:scale-95 transition-all select-none"
               >
                  <span className="w-12 text-center text-xs font-black text-white">{autoCashOutValue.toFixed(2)}</span>
                  <span className="text-xs font-black text-[#d97d1b]">x</span>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Numpad Modals Integrados - Zero interferência de teclado mobile nativo */}
      <NumpadModal 
        isOpen={isNumpadOpen}
        onClose={() => setIsNumpadOpen(false)}
        onConfirm={(val) => {
          setAmount(val);
          setInputValue(activeEventId ? val.toFixed(0) : val.toFixed(2));
        }}
        currentValue={amount}
        min={activeEventId ? 10 : MIN_BET}
        max={activeEventId ? 100000 : MAX_BET}
        title={activeEventId ? "Definir Aposta (Aerocoins)" : "Definir Valor da Aposta"}
        currencyPrefix={activeEventId ? "AC " : "R$ "}
        balance={activeEventId ? aerocoinBalance : balance}
        quickPresets={activeEventId ? [100, 250, 500, 1000, 2500] : [5, 10, 20, 50, 100]}
      />

      <NumpadModal 
        isOpen={isAutoCashoutNumpadOpen}
        onClose={() => setIsAutoCashoutNumpadOpen(false)}
        onConfirm={(val) => {
          setAutoCashOutValue(val);
          setAutoCashOutText(val.toFixed(2));
        }}
        currentValue={autoCashOutValue}
        min={1.01}
        max={1000.00}
        title="Definir Alvo de Auto Saque"
        currencyPrefix=""
        suffix="x"
        quickPresets={[1.5, 2.0, 3.0, 5.0, 10.0]}
      />
    </div>
  );
};

export default BetControl;
