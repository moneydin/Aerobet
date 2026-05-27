
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameStatus, GameHistory } from '../types';
import { getMultiplierColor } from '../constants';

interface AIPredictorProps {
  status: GameStatus;
  history: GameHistory[];
  isSubscribed: boolean;
  onOpenUpgrade: () => void;
}

interface TraderSignal {
    action: 'WAIT' | 'ENTER';
    target?: number;
    reason: string;
    confidence: 'low' | 'medium' | 'high';
    patternName?: string;
}

interface PredictionLog {
    roundId: string;
    multiplierResult: number;
    prediction: TraderSignal;
    outcome: 'WIN' | 'LOSS' | 'SKIP';
}

const BrainIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2h3Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 2.5 2.5h3A2.5 2.5 0 0 0 20 19.5v-15A2.5 2.5 0 0 0 17.5 2h-3Z" />
        <path d="M12 18v4" />
        <path d="M12 2v4" />
    </svg>
);

const WaitIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const EnterIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

// --- MODAL DE DETALHES (AUDITORIA REAL) ---
const AIDetailsModal: React.FC<{ 
    onClose: () => void, 
    logs: PredictionLog[],
    accuracy: number
}> = ({ onClose, logs, accuracy }) => {
    
    // Inverte para mostrar o mais recente primeiro
    const displayLogs = [...logs].reverse();

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#141516] w-full max-w-sm rounded-3xl border border-[#34b1e2]/30 shadow-[0_0_50px_rgba(52,177,226,0.15)] flex flex-col overflow-hidden relative max-h-[70vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-white/5 bg-gradient-to-r from-[#0c1a24] to-[#141516] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#34b1e2]/10 flex items-center justify-center text-[#34b1e2] border border-[#34b1e2]/20">
                            <BrainIcon />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Auditoria IA</h3>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${accuracy >= 80 ? 'bg-[#28a745]' : 'bg-yellow-500'} animate-pulse`}/>
                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                                    Assertividade: <span className="text-white">{accuracy.toFixed(1)}%</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-white/50 hover:text-white transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                {/* List Header */}
                <div className="px-3 py-2 bg-[#09090b] border-b border-white/5 flex text-[8px] font-bold text-white/30 uppercase tracking-widest">
                    <span className="w-16">Resultado</span>
                    <span className="flex-1 text-center">Previsão IA</span>
                    <span className="w-16 text-right">Status</span>
                </div>

                {/* Lista de Histórico Real */}
                <div className="flex-1 overflow-y-auto bg-[#09090b] p-2 space-y-1 no-scrollbar">
                    {displayLogs.length === 0 ? (
                        <div className="text-center py-10 text-white/20 text-[10px] uppercase font-bold tracking-wider">
                            Aguardando primeira análise...
                        </div>
                    ) : (
                        displayLogs.map((log) => (
                            <div key={log.roundId} className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${log.outcome === 'SKIP' ? 'bg-white/[0.01] border-transparent opacity-50' : 'bg-white/[0.03] border-white/[0.05]'}`}>
                                {/* Coluna 1: Resultado Real */}
                                <span className="w-16 font-bold text-[11px]" style={{ color: getMultiplierColor(log.multiplierResult) }}>
                                    {log.multiplierResult.toFixed(2)}x
                                </span>
                                
                                {/* Coluna 2: O que a IA disse */}
                                <div className="flex-1 flex flex-col items-center">
                                    {log.prediction.action === 'WAIT' ? (
                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">-- Pulou --</span>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-white/90 font-black">Saída {log.prediction.target?.toFixed(2)}x</span>
                                            <span className="text-[7px] text-white/40 uppercase">{log.prediction.reason}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Coluna 3: Resultado da Call */}
                                <div className="w-16 flex justify-end">
                                    {log.outcome === 'SKIP' ? (
                                        <span className="text-[9px] font-bold text-white/10">-</span>
                                    ) : log.outcome === 'WIN' ? (
                                        <span className="text-[9px] font-black bg-[#28a745]/20 text-[#28a745] px-1.5 py-0.5 rounded border border-[#28a745]/30">WIN</span>
                                    ) : (
                                        <span className="text-[9px] font-black bg-[#e51a31]/20 text-[#e51a31] px-1.5 py-0.5 rounded border border-[#e51a31]/30">LOSS</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const AIPredictor: React.FC<AIPredictorProps> = ({ status, history, isSubscribed, onOpenUpgrade }) => {
  const [currentSignal, setCurrentSignal] = useState<TraderSignal>({ action: 'WAIT', reason: 'Aguardando...', confidence: 'low' });
  const [predictionLogs, setPredictionLogs] = useState<PredictionLog[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Ref para armazenar a previsão feita durante o WAITING para comparar no CRASHED
  const lastPredictionRef = useRef<TraderSignal | null>(null);
  const lastProcessedRoundId = useRef<string | null>(null);

  // --- 1. LÓGICA DE ANÁLISE DE MERCADO ---
  const analyzeMarket = (data: GameHistory[]): TraderSignal => {
      if (data.length < 3) return { action: 'WAIT', reason: 'Coletando dados...', confidence: 'low' };

      const last = data[0];
      const last5 = data.slice(0, 5);
      
      const blues = last5.filter(x => x.multiplier < 2.00).length;
      const purples = last5.filter(x => x.multiplier >= 2.00).length;

      // Lógica de "Analista"
      // Se vieram 2 velas baixas (< 1.20) seguidas, perigo de crash
      if (data[0].multiplier < 1.20 && data[1].multiplier < 1.20) {
          return { action: 'WAIT', reason: 'Zona de Perigo', confidence: 'high' };
      }

      // Se estamos numa sequência de alternância (Padrão Xadrez)
      const isAlternating = (data[0].multiplier < 2 && data[1].multiplier >= 2) || (data[0].multiplier >= 2 && data[1].multiplier < 2);
      if (isAlternating && blues > 2) {
           return { action: 'WAIT', reason: 'Indecisão', confidence: 'medium' };
      }

      // Oportunidade: Sequência de pagantes
      if (purples >= 3) {
          return { action: 'ENTER', target: 2.00, reason: 'Surfando Alta', confidence: 'high', patternName: 'Tendência Alta' };
      }

      // Recuperação Padrão (Entrada Segura)
      if (blues >= 3) {
          return { action: 'ENTER', target: 1.50, reason: 'Correção', confidence: 'medium', patternName: 'Recuperação' };
      }

      // Padrão Neutro
      if (Math.random() > 0.5) {
          return { action: 'ENTER', target: 1.90, reason: 'Padrão Normal', confidence: 'low', patternName: 'Scalping' };
      }

      return { action: 'WAIT', reason: 'Aguardando', confidence: 'low' };
  };

  // --- 2. CICLO DE VIDA DO JOGO ---
  useEffect(() => {
    // FASE 1: WAITING (Fazer a previsão)
    if (status === GameStatus.WAITING) {
      setIsAnalyzing(true);
      
      // Delay simulado de "pensamento" da IA
      const analysisTimer = setTimeout(() => {
          const signal = analyzeMarket(history);
          setCurrentSignal(signal);
          lastPredictionRef.current = signal; // Guarda a previsão
          setIsAnalyzing(false);
      }, 1000 + Math.random() * 1000);

      return () => clearTimeout(analysisTimer);
    }

    // FASE 2: CRASHED (Validar o resultado)
    if (status === GameStatus.CRASHED && history.length > 0) {
        const lastRound = history[0];
        
        // Evita processar o mesmo round duas vezes
        if (lastProcessedRoundId.current === lastRound.roundId) return;
        lastProcessedRoundId.current = lastRound.roundId;

        const prediction = lastPredictionRef.current;
        if (prediction) {
            let outcome: 'WIN' | 'LOSS' | 'SKIP' = 'SKIP';

            if (prediction.action === 'ENTER' && prediction.target) {
                outcome = lastRound.multiplier >= prediction.target ? 'WIN' : 'LOSS';
            }

            // Adiciona ao log auditável
            const newLog: PredictionLog = {
                roundId: lastRound.roundId,
                multiplierResult: lastRound.multiplier,
                prediction: prediction,
                outcome: outcome
            };

            setPredictionLogs(prev => [...prev, newLog].slice(-50)); // Mantém últimos 50
        }
    }
  }, [status, history]);

  // --- 3. CÁLCULO DE ASSERTIVIDADE REAL ---
  const realAccuracy = useMemo(() => {
      const activeBets = predictionLogs.filter(log => log.prediction.action === 'ENTER');
      if (activeBets.length === 0) return 100; // Começa otimista
      const wins = activeBets.filter(log => log.outcome === 'WIN').length;
      return (wins / activeBets.length) * 100;
  }, [predictionLogs]);

  if (status === GameStatus.CRASHED && !isAnalyzing) return null;

  // --- MODO BLOQUEADO (NÃO ASSINANTE) ---
  if (!isSubscribed) {
      return (
        <button 
            onClick={onOpenUpgrade}
            className="absolute top-4 left-4 z-40 bg-black/40 backdrop-blur-md rounded-full border border-[#d97d1b]/30 px-3 py-1.5 flex items-center gap-2 shadow-lg group hover:bg-[#d97d1b]/10 transition-colors animate-in fade-in slide-in-from-left-2"
        >
            <div className="text-[#d97d1b]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div className="flex flex-col text-left">
                <span className="text-[8px] font-bold text-[#d97d1b] uppercase tracking-wider leading-none">
                    IA Premium
                </span>
                <span className="text-[9px] font-black text-white leading-none mt-0.5 filter blur-[3px]">
                    Sinal Oculto
                </span>
            </div>
        </button>
      );
  }

  // --- MODO ANALISTA (ASSINANTE) - WIDGET COMPACTO ---
  return (
    <>
        <button 
            onClick={() => setShowDetails(true)}
            className={`absolute top-4 left-4 z-40 backdrop-blur-xl rounded-full border pl-2 pr-3 py-1.5 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-left-2 ${
                isAnalyzing ? 'bg-black/60 border-white/10' :
                currentSignal.action === 'WAIT' ? 'bg-black/60 border-yellow-500/30' :
                'bg-black/80 border-[#34b1e2]/50 shadow-[#34b1e2]/20'
            }`}
        >
            {/* Ícone de Status */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 ${
                isAnalyzing ? 'bg-white/5 border-white/10 text-white/50' :
                currentSignal.action === 'WAIT' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                'bg-[#34b1e2]/20 border-[#34b1e2]/50 text-[#34b1e2] animate-pulse'
            }`}>
                {isAnalyzing ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : currentSignal.action === 'WAIT' ? (
                    <WaitIcon />
                ) : (
                    <EnterIcon />
                )}
            </div>

            {/* Informações Compactas */}
            <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${currentSignal.action === 'WAIT' ? 'text-yellow-500' : 'text-[#34b1e2]'}`}>
                        {isAnalyzing ? 'ANALISANDO' : currentSignal.action === 'WAIT' ? 'AGUARDAR' : 'ENTRAR'}
                    </span>
                    {!isAnalyzing && (
                        <span className={`text-[7px] font-bold px-1 rounded uppercase ${
                            realAccuracy >= 80 ? 'text-[#28a745] bg-[#28a745]/10' : 'text-yellow-500 bg-yellow-500/10'
                        }`}>
                            {realAccuracy.toFixed(0)}%
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-black text-white leading-none whitespace-nowrap drop-shadow-md">
                    {isAnalyzing ? (
                        <span className="text-white/30">Lendo padrão...</span>
                    ) : currentSignal.action === 'WAIT' ? (
                        currentSignal.reason
                    ) : (
                        `Alvo ${currentSignal.target?.toFixed(2)}x`
                    )}
                </span>
            </div>
        </button>

        {showDetails && (
            <AIDetailsModal 
                onClose={() => setShowDetails(false)}
                logs={predictionLogs}
                accuracy={realAccuracy}
            />
        )}
    </>
  );
};

export default AIPredictor;
