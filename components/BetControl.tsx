
import React, { useState, useEffect, useRef } from 'react';
import { GameStatus, Bet, BankrollPlan, GameHistory, AeroFantasyLeagueType, FreeFlightConfig } from '../types';
import { MIN_BET, MAX_BET } from '../constants';

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
  aerocoinBalance
}) => {
  const [amount, setAmount] = useState(activeEventId ? 100 : 1.00); 
  const [inputValue, setInputValue] = useState(activeEventId ? "100" : "1.00");
  const [isFocused, setIsFocused] = useState(false);
  const [isOptimisticCashing, setIsOptimisticCashing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
  
  // Definir os valores rápidos dos botões
  const quickAmounts = activeEventId && !isMultiplierLeague 
      ? [100, 250, 500, 1000] 
      : [10, 20, 50, 100];

  return (
    <div className={`rounded-xl p-2 md:p-3 flex flex-col gap-2 md:gap-3 border shadow-2xl h-full transition-all duration-300 relative overflow-hidden touch-manipulation ${
        activeEventId ? 'bg-[#0f1922] border-[#34b1e2]/30' :
        isFreeBetActive ? 'bg-[#2a0e3d] border-[#913ef2]/30' : 
        mode === 'manager' && isManagerRunning ? 'bg-[#0c1a24] border-[#34b1e2]/30' :
        'bg-[#1b1c1d] border-white/5'
    }`}>
      {mode === 'auto' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#913ef2]/5 blur-[60px] pointer-events-none" />
      )}
      {mode === 'manager' && isManagerRunning && (
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#34b1e2]/10 blur-[50px] pointer-events-none animate-pulse" />
      )}
      
      {activeEventId && (
          <div className="absolute top-0 left-0 w-full bg-[#34b1e2] h-1 animate-pulse" />
      )}

      {/* Header */}
      <div className="flex justify-between items-center z-10 w-full gap-2">
          <div className={`flex bg-[#141516] rounded-full p-0.5 md:p-1 flex-1 transition-opacity ${isModeLocked ? 'opacity-50 pointer-events-none' : ''}`}>
            <button 
              disabled={isModeLocked}
              onPointerDown={(e) => { e.preventDefault(); if(!isModeLocked) { setMode('manual'); setIsManagerRunning(false); } }} 
              className={`flex-1 text-[7.5px] sm:text-[9px] font-black uppercase py-1 px-1 sm:py-2 rounded-full transition-all duration-75 active:scale-95 ${mode === 'manual' ? 'bg-[#2c2d30] text-white shadow-md' : 'text-white/30 hover:text-white/50'}`}
            >
              Manual
            </button>
            <button 
              disabled={isModeLocked}
              onPointerDown={(e) => { e.preventDefault(); if(!isModeLocked) { setMode('auto'); setIsManagerRunning(false); } }} 
              className={`flex-1 text-[7.5px] sm:text-[9px] font-black uppercase py-1 px-1 sm:py-2 rounded-full transition-all duration-75 active:scale-95 ${mode === 'auto' ? 'bg-[#913ef2] text-white shadow-[0_0_10px_rgba(145,62,242,0.4)]' : 'text-white/30 hover:text-white/50'}`}
            >
              Auto
            </button>
            <button 
              disabled={isModeLocked}
              onPointerDown={(e) => { e.preventDefault(); if(!isModeLocked) { setMode('manager'); } }} 
              className={`flex-1 text-[7.5px] sm:text-[9px] font-black uppercase py-1 px-1 sm:py-2 rounded-full transition-all duration-75 active:scale-95 flex items-center justify-center gap-0.5 ${mode === 'manager' ? 'bg-[#34b1e2] text-black shadow-[0_0_10px_rgba(52,177,226,0.4)]' : 'text-white/30 hover:text-white/50'}`}
            >
              {!isSubscribed && <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              Gestão
            </button>
          </div>

          {/* Toggle de Voo Grátis (Hidden in Event Mode) */}
          {hasFreeFlightsAvailable && mode !== 'manager' && !activeEventId && (
              <div className={`flex items-center gap-1.5 bg-[#141516] pl-1.5 pr-1 py-0.5 rounded-full border border-white/5 shrink-0 transition-opacity ${isModeLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span className="text-[7.5px] font-bold text-[#913ef2] uppercase mr-0.5 hidden sm:inline">
                      {freeFlights} Voos
                  </span>
                  <button 
                    disabled={isModeLocked}
                    onPointerDown={(e) => { e.preventDefault(); setUseFreeFlightMode(!useFreeFlightMode); }}
                    className={`w-7 h-4 rounded-full relative transition-colors duration-200 ${useFreeFlightMode ? 'bg-[#913ef2]' : 'bg-[#2c2d30]'}`}
                  >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-md transition-all duration-200 ${useFreeFlightMode ? 'left-3.5' : 'left-0.5'}`} />
                  </button>
              </div>
          )}
          
          {/* Active Event Badge */}
          {activeEventId && (
              <div className="bg-[#34b1e2] text-black text-[7px] sm:text-[8px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse shadow-md">
                  {isMultiplierLeague ? 'VOOS' : 'AC'}
              </div>
          )}
      </div>

      <div className="flex gap-1.5 md:gap-3 h-full min-h-[110px] sm:min-h-[125px] z-10 relative">
        {/* LOCK OVERLAY FOR MANAGER IN EVENT */}
        {isLocked && (
            <div className="absolute inset-0 z-20 bg-black/95 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center text-center p-2">
                {activeEventId ? (
                    <>
                        <svg className="text-[#34b1e2] mb-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        <p className="text-[8px] font-bold text-[#34b1e2] uppercase tracking-wider">IA Bloqueada</p>
                    </>
                ) : (
                    <button 
                        onClick={onOpenManager}
                        className="bg-[#d97d1b] hover:bg-[#b66614] text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-wider text-[8px] shadow-[0_0_10px_rgba(217,125,27,0.3)] active:scale-95 transition-transform duration-75 flex items-center gap-1.5 animate-pulse"
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        REBLOC
                    </button>
                )}
            </div>
        )}

        <div className="flex-[1.1] flex flex-col gap-1.5 min-w-0">
           <div className={`bg-black rounded-xl p-1.5 sm:p-2.5 flex flex-col items-center justify-between border-2 transition-all h-full ${
               isFocused ? (activeEventId ? 'border-[#34b1e2]' : 'border-[#e51a31]') : 
               activeEventId ? 'border-[#34b1e2]/30 bg-[#0f1922]' :
               isFreeBetActive ? 'border-[#913ef2]/40 bg-[#1e0a2b]' : 
               mode === 'manager' && isManagerRunning ? 'border-[#34b1e2]/40 bg-[#0c1a24]' : 'border-white/5 shadow-inner'
           }`}>
              
              {mode === 'manager' && !activeEventId ? (
                  <div className="flex flex-col items-center justify-center h-full w-full py-0.5">
                      <span className="text-[7.5px] sm:text-[9px] font-bold text-white/30 uppercase tracking-wider mb-0.5">Fixo ({bankrollPlan?.entryPercentage.toFixed(1)}%)</span>
                      <div className="text-sm sm:text-lg font-black text-[#34b1e2] italic truncate w-full text-center">
                          R$ {bankrollPlan ? bankrollPlan.entryAmount.toFixed(2) : '0.00'}
                      </div>
                      <div className="mt-1 px-1.5 py-0.5 rounded bg-[#34b1e2]/10 text-[7px] sm:text-[8px] text-[#34b1e2] font-bold uppercase">
                          Alvo: {bankrollPlan?.targetMultiplier.toFixed(2)}x
                      </div>
                  </div>
              ) : (
                  <>
                    <div className="flex items-center justify-between w-full mb-1">
                        <button 
                        disabled={isFreeBetActive || isMultiplierLeague}
                        onPointerDown={(e) => { e.preventDefault(); adjustAmount(-1); }} 
                        className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-[#2c2d30] hover:bg-[#3d3f44] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full font-bold text-base sm:text-xl active:scale-90 transition-transform duration-75"
                        >
                        -
                        </button>
                        <div className="flex flex-col items-center w-full min-w-0">
                            <input 
                            type="text" 
                            inputMode="decimal"
                            disabled={isFreeBetActive || isMultiplierLeague}
                            value={isMultiplierLeague ? "1 Voo" : inputValue} 
                            onChange={handleInputChange} 
                            onFocus={(e) => { setIsFocused(true); e.target.select(); }} 
                            onBlur={handleBlur} 
                            className={`bg-transparent text-center font-black text-sm sm:text-xl w-full outline-none tracking-tight ${activeEventId ? 'text-[#34b1e2]' : isFreeBetActive ? 'text-[#913ef2]' : 'text-white'}`} 
                            />
                            {isFreeBetActive && <span className="text-[7px] sm:text-[8px] font-bold text-[#913ef2] uppercase tracking-normal sm:tracking-widest -mt-1 truncate w-full text-center">Grátis</span>}
                            {activeEventId && !isMultiplierLeague && <span className="text-[7px] sm:text-[8px] font-bold text-[#34b1e2] uppercase tracking-normal sm:tracking-widest -mt-1 truncate w-full text-center">AC</span>}
                            {isMultiplierLeague && <span className="text-[7px] sm:text-[8px] font-bold text-[#34b1e2] uppercase tracking-normal sm:tracking-widest -mt-1 truncate w-full text-center">Liga Fixa</span>}
                        </div>
                        <button 
                        disabled={isFreeBetActive || isMultiplierLeague}
                        onPointerDown={(e) => { e.preventDefault(); adjustAmount(1); }} 
                        className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-[#2c2d30] hover:bg-[#3d3f44] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full font-bold text-base sm:text-xl active:scale-90 transition-transform duration-75"
                        >
                        +
                        </button>
                    </div>
                    
                    {/* Botões de Valor Rápido */}
                    <div className={`grid grid-cols-2 gap-1 md:gap-2 w-full transition-opacity ${isMultiplierLeague ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        {quickAmounts.map(v => (
                        <button 
                            key={v} 
                            disabled={isFreeBetActive || isMultiplierLeague}
                            onPointerDown={(e) => { e.preventDefault(); setAmount(v); setInputValue(activeEventId ? v.toFixed(0) : v.toFixed(2)); }} 
                            className={`text-[8px] sm:text-[10px] font-black py-1 sm:py-1.5 rounded-lg transition-transform duration-75 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed ${
                                activeEventId ? 'bg-[#34b1e2]/10 text-[#34b1e2] hover:bg-[#34b1e2]/20' :
                                mode === 'auto' ? 'bg-[#913ef2]/10 text-[#913ef2] hover:bg-[#913ef2]/20' : 'bg-[#2c2d30] text-white/80 hover:bg-[#3d3f44] hover:text-white'
                            }`}
                        >
                            {activeEventId ? v : v.toFixed(0)}
                        </button>
                        ))}
                    </div>
                  </>
              )}
           </div>
        </div>

        <div className="flex-1 min-w-0">
          {isCashedOut ? (
             <div className="w-full h-full bg-black/40 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-[#28a745]/30 animate-in fade-in zoom-in duration-300 p-1">
                <span className="text-[7.5px] sm:text-[9.5px] font-black text-white/40 uppercase tracking-wider mb-0.5 text-center truncate w-full">
                    {activeBet?.multiplier ? `@ ${activeBet.multiplier.toFixed(2)}x` : 'Sacado'}
                </span>
                <span className="text-xs sm:text-base font-black text-[#28a745] italic text-center truncate w-full">
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
              className="w-full h-full bg-[#cb011a] hover:bg-[#a30115] text-white rounded-xl flex flex-col items-center justify-center p-1.5 sm:p-2.5 transition-transform duration-75 active:scale-95 shadow-[0_4px_12px_rgba(203,1,26,0.25)] group select-none touch-manipulation min-w-0"
            >
              <span className="text-[7.5px] sm:text-[9.5px] font-black uppercase tracking-wider mb-0.5 opacity-80 text-center truncate w-full">Cancelar</span>
              <span className="text-xs sm:text-base font-black italic text-center truncate w-full">{activeEventId && isMultiplierLeague ? 'VOO' : activeEventId ? (activeBet?.amount || nextRoundBet || 0).toFixed(0) : 'R$ ' + (activeBet?.amount || nextRoundBet || 0).toFixed(0)}</span>
            </button>
          ) : (isActive && status === GameStatus.FLYING) || isOptimisticCashing ? (
            <button 
              onPointerDown={handleCashoutAction} 
              disabled={isOptimisticCashing || !canCashoutFree}
              className={`w-full h-full select-none touch-manipulation min-w-0 ${
                  isOptimisticCashing ? 'bg-[#b66614] cursor-wait' : 
                  !canCashoutFree ? 'bg-gray-700 cursor-not-allowed border-2 border-gray-600' :
                  'bg-[#d97d1b] hover:bg-[#c66b16]'
                } text-white rounded-xl flex flex-col items-center justify-center p-1.5 sm:p-2.5 transition-transform duration-75 active:scale-95 shadow-[0_6px_18px_rgba(217,125,27,0.35)]`}
            >
              <span className="text-[7.5px] sm:text-[9.5px] font-black uppercase tracking-wider mb-0.5 opacity-90 text-center truncate w-full">
                  {isOptimisticCashing ? 'Sacando' : !canCashoutFree ? `> ${minFFMult}x` : 'Sacar'}
              </span>
              <span className={`text-xs sm:text-base font-black italic leading-tight drop-shadow-md text-center truncate w-full ${!canCashoutFree ? 'opacity-50' : ''}`}>
                {activeEventId && isMultiplierLeague ? (activeBet!.multiplier || currentMultiplier).toFixed(2) + 'x' : activeEventId ? (activeBet!.amount * currentMultiplier).toFixed(0) : 'R$ ' + (activeBet!.amount * currentMultiplier).toFixed(2)}
              </span>
            </button>
          ) : (
            <button 
              disabled={
                  (activeEventId && !isMultiplierLeague && (aerocoinBalance || 0) < amount) || 
                  (!activeEventId && !isFreeBetActive && balance < amount && mode !== 'manager') || 
                  isLocked
              } 
              onPointerDown={handleBetAction} 
              className={`w-full h-full rounded-xl flex flex-col items-center justify-center p-1.5 sm:p-2.5 transition-transform duration-75 active:scale-95 shadow-md group select-none touch-manipulation min-w-0
                ${activeEventId
                  ? 'bg-[#34b1e2] hover:bg-[#2096c4] shadow-[0_0_12px_rgba(52,177,226,0.3)] text-black'
                  : mode === 'manager'
                  ? isManagerRunning 
                    ? 'bg-[#cb011a] hover:bg-[#a30115] shadow-[0_0_12px_rgba(203,1,26,0.4)] animate-pulse'
                    : 'bg-[#34b1e2] hover:bg-[#2096c4] shadow-[0_0_12px_rgba(52,177,226,0.3)] text-black'
                  : isFreeBetActive
                  ? 'bg-[#913ef2] hover:bg-[#7e34d4] shadow-[0_0_12px_rgba(145,62,242,0.4)] animate-pulse'
                  : isAutoBetRunning 
                  ? 'bg-[#913ef2] hover:bg-[#7e34d4] shadow-[0_4px_12px_rgba(145,62,242,0.25)]' 
                  : (balance < amount ? 'bg-gray-800 opacity-50' : 'bg-[#28a745] hover:bg-[#218838] shadow-[0_4px_12px_rgba(40,167,69,0.3)]')
                }`}
            >
              <span className="text-[7.5px] sm:text-[9.5px] font-black uppercase tracking-wider mb-0.5 opacity-80 text-center leading-tight truncate w-full">
                {activeEventId && isMultiplierLeague ? 'VOO' : activeEventId ? 'Apostar AC' : mode === 'manager' 
                    ? (isManagerRunning ? 'PARAR' : 'ATIVAR') 
                    : isAutoBetRunning 
                        ? 'Auto' 
                        : isFreeBetActive ? `GRÁTIS` : (status === GameStatus.FLYING ? 'Próximo' : 'Apostar')}
              </span>
              
              {mode === 'manager' && !activeEventId ? (
                  <div className="flex flex-col items-center py-0.5">
                      {isManagerRunning ? (
                          <div className="flex flex-col items-center">
                              <span className="text-white font-bold text-[7.5px] sm:text-[9.5px] uppercase animate-pulse">
                                  {aiAnalysisState === 'scanning' ? 'Lendo' : 'Operando'}
                              </span>
                          </div>
                      ) : (
                          <span className="text-[7.5px] sm:text-[9.5px] font-black uppercase">Iniciar</span>
                      )}
                  </div>
              ) : (
                  <span className="text-xs sm:text-base font-black italic text-center truncate w-full">{activeEventId && isMultiplierLeague ? 'DECOLAR' : activeEventId ? amount.toFixed(0) : 'R$ ' + amount.toFixed(0)}</span>
              )}
              
              {isAutoBetRunning && <div className="mt-0.5 w-1 h-1 rounded-full bg-white animate-pulse" />}
            </button>
          )}
        </div>
      </div>

      {managerMessage && mode === 'manager' && !activeEventId && (
          <div className="absolute bottom-2 left-0 right-0 text-center z-30">
              <span className={`text-[9px] font-bold px-2 py-1 rounded text-white border border-white/10 ${managerMessage.includes('Pular') ? 'bg-[#e51a31]/90' : managerMessage.includes('Stop') ? 'bg-[#e51a31]/90' : 'bg-[#34b1e2]/90'}`}>
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
               <div className="flex items-center gap-1.5 bg-[#1b1c1d] px-2 py-1 rounded-lg border border-white/10">
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={autoCashOutText} 
                    onChange={handleAutoCashOutChange}
                    onBlur={handleAutoCashOutBlur}
                    onFocus={(e) => e.target.select()}
                    placeholder="0.00"
                    className="bg-transparent w-12 text-center text-xs font-black text-white outline-none" 
                  />
                  <span className="text-xs font-black text-[#d97d1b]">x</span>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BetControl;
