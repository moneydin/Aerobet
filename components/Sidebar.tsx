
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LiveBet, GameStatus, ChatMessage } from '../types';
import Chat from './Chat';

interface SidebarProps {
  allBets: LiveBet[];
  gameStatus: GameStatus;
  currentMultiplier: number;
  stats: {
    count: number;
    amount: number;
    wins: number;
  };
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  myHistory?: LiveBet[];
}

const MOCK_TOP_BETS: LiveBet[] = [
  { id: 'top-1', username: 'ReiDoAERObet', amount: 500, multiplier: 842.50, payout: 421250 },
  { id: 'top-2', username: 'SorteSuprema', amount: 200, multiplier: 125.40, payout: 25080 },
  { id: 'top-3', username: 'VooInfinito', amount: 450, multiplier: 88.21, payout: 39694.5 },
  { id: 'top-4', username: 'CrashMaster', amount: 100, multiplier: 54.10, payout: 5410 },
  { id: 'top-5', username: 'Beta_Tester', amount: 50, multiplier: 42.00, payout: 2100 },
];

const Sidebar: React.FC<SidebarProps> = ({ allBets, gameStatus, currentMultiplier, stats, chatMessages, onSendMessage, myHistory: externalMyHistory }) => {
  const [mainTab, setMainTab] = useState<'bets' | 'chat'>('bets');
  const [betTab, setBetTab] = useState<'all' | 'my' | 'top'>('all');
  const [myHistory, setMyHistory] = useState<LiveBet[]>([]);
  const [lastWonBetId, setLastWonBetId] = useState<string | null>(null);
  
  const lastStatusRef = useRef<GameStatus>(gameStatus);
  const processedBetIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Se o histórico externo for fornecido, confiamos no fluxo de dados mestre do App.tsx
    if (externalMyHistory) return;

    // Filtrar apenas minhas apostas que possuem ID
    const myCurrentBets = allBets.filter(b => b.isMe && b.id);
    
    // 1. Verificar Ganhos (Cashouts)
    myCurrentBets.forEach(bet => {
      if (bet.payout && !processedBetIds.current.has(bet.id)) {
        processedBetIds.current.add(bet.id);
        setMyHistory(prev => [{ ...bet }, ...prev].slice(0, 50));
        setLastWonBetId(bet.id);
        setTimeout(() => setLastWonBetId(null), 1000); 
      }
    });

    // 2. Verificar Perdas (Crash)
    if (gameStatus === GameStatus.CRASHED && lastStatusRef.current === GameStatus.FLYING) {
      myCurrentBets.forEach(bet => {
        if (!bet.payout && !processedBetIds.current.has(bet.id)) {
          processedBetIds.current.add(bet.id);
          setMyHistory(prev => [{ 
            ...bet, 
            multiplier: currentMultiplier, 
            payout: 0 
          }, ...prev].slice(0, 50));
        }
      });
    }

    lastStatusRef.current = gameStatus;
  }, [allBets, gameStatus, currentMultiplier, externalMyHistory]);

  const displayedBets = useMemo(() => {
    if (betTab === 'my') {
      const rawMyHistory = externalMyHistory || myHistory;
      if (!rawMyHistory || rawMyHistory.length === 0) return [];
      
      const consolidated: any[] = [];
      const visited = new Set<string>();

      for (let i = 0; i < rawMyHistory.length; i++) {
        const current = rawMyHistory[i];
        if (visited.has(current.id)) continue;

        // Group together current bet and other bets from the same round
        const matchingBets = rawMyHistory.filter((b) => {
          if (visited.has(b.id)) return false;
          if (b.id === current.id) return true;
          
          if (current.roundId && b.roundId) {
            return current.roundId === b.roundId;
          }
          
          // Temporal proximity fallback for quick local bets (within 4 seconds)
          const timeDiff = Math.abs((b.timestamp || 0) - (current.timestamp || 0));
          return timeDiff < 4000;
        });

        matchingBets.forEach(mb => visited.add(mb.id));

        if (matchingBets.length > 1) {
          const totalAmount = matchingBets.reduce((sum, b) => sum + b.amount, 0);
          const totalPayout = matchingBets.reduce((sum, b) => sum + (b.payout || 0), 0);
          
          const subBets = matchingBets.map(b => ({
            id: b.id,
            amount: b.amount,
            multiplier: b.multiplier,
            payout: b.payout,
            cashedOut: b.cashedOut,
            timestamp: b.timestamp
          }));

          const activeMults = matchingBets.map(b => b.multiplier).filter((m): m is number => m !== undefined && m > 0);
          const maxMult = activeMults.length > 0 ? Math.max(...activeMults) : 1.00;
          const anyCashedOut = matchingBets.some(b => b.cashedOut || (b.payout && b.payout > 0));

          consolidated.push({
            ...current,
            id: `grouped-${current.roundId || current.id}`,
            amount: totalAmount,
            payout: totalPayout,
            multiplier: maxMult,
            cashedOut: anyCashedOut,
            isGrouped: true,
            subBets
          });
        } else {
          consolidated.push(current);
        }
      }

      consolidated.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return consolidated;
    }
    if (betTab === 'top') return MOCK_TOP_BETS;
    return allBets;
  }, [betTab, allBets, myHistory, externalMyHistory]);

  const gridClasses = "grid grid-cols-[1fr_65px_55px_80px] gap-1 items-center w-full";

  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col h-full bg-[#1b1c1d] rounded-[24px] overflow-hidden border border-white/5 shadow-2xl transition-all font-sans relative">
      
      {/* Top Toggle Switcher (Bets vs Chat) */}
      <div className="flex bg-[#141516] p-1 border-b border-white/5 shrink-0">
          <button 
            onClick={() => setMainTab('bets')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainTab === 'bets' ? 'bg-[#2c2d30] text-white shadow' : 'text-white/30 hover:text-white'}`}
          >
              Apostas
          </button>
          <button 
            onClick={() => setMainTab('chat')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${mainTab === 'chat' ? 'bg-[#2c2d30] text-white shadow' : 'text-white/30 hover:text-white'}`}
          >
              Bate-Papo
              <span className="absolute top-2 right-4 w-1.5 h-1.5 bg-[#28a745] rounded-full animate-pulse shadow-[0_0_5px_#28a745]" />
          </button>
      </div>

      {mainTab === 'bets' ? (
        <>
            {/* Bet Sub-Tabs */}
            <div className="p-1.5 bg-[#141516] flex gap-1 shrink-0 border-t border-white/5">
                {(['all', 'my', 'top'] as const).map(tab => (
                <button 
                    key={tab}
                    onClick={() => setBetTab(tab)}
                    className={`flex-1 text-[10px] font-black uppercase py-2 rounded-lg transition-all duration-200 tracking-wider ${
                    betTab === tab 
                        ? 'bg-[#1b1c1d] text-white shadow border border-white/5' 
                        : 'text-white/25 hover:text-white/40'
                    }`}
                >
                    {tab === 'all' ? 'Todas' : tab === 'my' ? 'Minhas' : 'Top'}
                </button>
                ))}
            </div>

            {betTab === 'all' ? (
                <div className="px-3 py-2 bg-black/20 flex justify-between items-center border-b border-white/5 shrink-0 animate-in fade-in slide-in-from-top-1">
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">Apostas Atuais</span>
                    <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#28a745] animate-pulse shadow-[0_0_5px_rgba(40,167,69,0.5)]" />
                    <span className="text-xs font-black text-white/90 tabular-nums">{stats.count}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">Volume Total</span>
                    <span className="text-xs font-black italic text-white/60">R$ {formatValue(stats.amount)}</span>
                    </div>
                </div>
                </div>
            ) : (
                <div className="px-3 py-2 bg-black/10 flex items-center justify-between border-b border-white/5 shrink-0 animate-in fade-in duration-300">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">
                    {betTab === 'my' ? 'Seu Histórico' : 'Recordes do Mês'}
                </span>
                <div className="flex items-center gap-1">
                    <div className={`w-1 h-1 rounded-full ${betTab === 'my' ? 'bg-[#e51a31]' : 'bg-[#d97d1b]'}`} />
                    <span className="text-[8px] font-bold text-white/10 italic">Atualizado ao vivo</span>
                </div>
                </div>
            )}

            <div className={`px-3 py-1.5 bg-black/30 text-[8px] text-white/15 uppercase font-black border-b border-white/5 tracking-widest shrink-0 ${gridClasses}`}>
                <span className="truncate">Usuário</span>
                <span className="text-right">Aposta</span>
                <span className="text-center">Mult.</span>
                <span className="text-right">Saque</span>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar bg-black/5 relative">
                {displayedBets.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
                    <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center mb-3 opacity-10">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10 leading-tight">
                    {betTab === 'my' ? 'Nenhuma aposta realizada nesta sessão' : 'Aguardando novas entradas...'}
                    </span>
                </div>
                ) : (
                <div className="flex flex-col">
                    {displayedBets.map((bet) => {
                    const isWin = !!(bet.payout && bet.payout > 0);
                    // O status "Rumo ao Céu" deve estar ativo APENAS enquanto o avião está efetivamente voando (FLYING)
                    const isActive = !isWin && !bet.cashedOut && gameStatus === GameStatus.FLYING && (Date.now() - (bet.timestamp || 0) < 60000);
                    const isLoss = !isWin && !isActive;
                    const isBigWin = (bet.multiplier || 0) >= 10;
                    const isHugeWin = (bet.multiplier || 0) >= 50;
                    const isNewlyWon = isWin && bet.id === lastWonBetId;

                    return (
                        <div 
                        key={bet.id} 
                        className={`px-3 py-2 text-[10px] border-b border-white/[0.02] transition-all hover:bg-white/[0.03] animate-in slide-in-from-right-1 duration-300 ${gridClasses} ${
                            betTab === 'my' 
                            ? (isWin ? 'bg-[#28a745]/10 border-l-[3px] border-l-[#28a745]' : isActive ? 'bg-white/[0.03] border-l-[3px] border-l-amber-500 animate-pulse' : 'bg-[#e51a31]/5 border-l-[3px] border-l-[#e51a31]')
                            : (bet.isMe ? 'bg-[#e51a31]/10 border-l-[2px] border-l-[#e51a31]' : '')
                        } ${isNewlyWon ? 'animate-win-glow' : ''}`}
                        >
                        <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-4 h-4 rounded-lg flex items-center justify-center text-[8px] flex-shrink-0 transition-transform ${
                            bet.isMe ? 'bg-[#e51a31] scale-105 shadow-lg shadow-[#e51a31]/20' : 'bg-white/5'
                            } text-white font-black overflow-hidden`}>
                            {(bet.isMe ? 'V' : bet.username[0])}
                            </div>
                            <div className="flex flex-col min-w-0">
                            <span className={`truncate font-bold tracking-tight ${bet.isMe ? 'text-white' : 'text-white/40'}`}>
                                {bet.isMe ? 'Você' : bet.username}
                            </span>
                            {betTab === 'my' && (
                                <span className={`text-[6px] font-black uppercase tracking-tighter ${
                                    isActive ? 'text-amber-500 animate-pulse' :
                                    isWin ? 'text-[#28a745]' : 'text-[#e51a31]'
                                }`}>
                                {isActive ? 'ATIVO' : isWin ? 'GANHOU' : 'PERDEU'}
                                </span>
                            )}
                            </div>
                        </div>
                        
                        <span className={`text-right font-black tabular-nums tracking-tighter ${bet.isMe ? 'text-white' : 'text-white/70'}`}>
                            R$ {formatValue(bet.amount)}
                        </span>
                        
                        <div className="flex justify-center gap-1 flex-wrap">
                            {bet.isGrouped && bet.subBets ? (
                              bet.subBets.map((sub: any, sIdx: number) => {
                                const subWin = !!(sub.payout && sub.payout > 0);
                                const subLoss = !subWin && !isActive;
                                return (
                                  <span key={sub.id || sIdx} className={`font-black px-1 py-0.5 rounded-md text-[8px] border transition-all duration-300 ${
                                      subWin ? 'bg-[#28a745]/20 text-[#28a745] border-[#28a745]/30' :
                                      subLoss ? 'bg-[#e51a31]/20 text-[#e51a31] border-[#e51a31]/30' :
                                      'bg-white/5 text-white/50 border-white/5'
                                  }`}>
                                      {sub.multiplier ? sub.multiplier.toFixed(2) : '1.00'}x
                                  </span>
                                );
                              })
                            ) : (bet.multiplier !== undefined && !isActive) ? (
                              <span className={`font-black px-1.5 py-0.5 rounded-md text-[9px] border transition-all duration-300 ${
                                  isWin ? 'bg-[#28a745]/20 text-[#28a745] border-[#28a745]/30' :
                                  isLoss ? 'bg-[#e51a31]/20 text-[#e51a31] border-[#e51a31]/30' :
                                  isHugeWin ? 'bg-[#d97d1b] text-white border-white/20 animate-pulse' :
                                  isBigWin ? 'bg-[#913ef2]/20 text-[#913ef2] border-[#913ef2]/30' :
                                  'bg-white/5 text-white/80 border-white/5'
                              }`}>
                                  {(bet.multiplier && bet.multiplier > 0) ? bet.multiplier.toFixed(2) : '1.00'}x
                              </span>
                            ) : (
                              <div className="w-4 h-0.5 bg-white/10 rounded-full animate-pulse" />
                            )}
                        </div>
                        
                        <span className={`text-right font-black tabular-nums transition-colors tracking-tighter ${
                            isWin ? 'text-[#28a745]' : isActive ? 'text-amber-500/50' : 'text-white/10'
                        }`}>
                            {isWin ? `R$ ${formatValue(bet.payout!)}` : isActive ? 'Rumo ao céu' : 'R$ 0,00'}
                        </span>
                        </div>
                    );
                    })}
                </div>
                )}
            </div>

            <div className="px-4 py-2 bg-[#141516] border-t border-white/5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                <div className="relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#28a745]" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-[#28a745] animate-ping opacity-75" />
                </div>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Conexão ao Vivo</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span className="text-[10px] font-black text-white/60 tabular-nums">
                    {1240 + Math.floor(Math.random() * 200)}
                </span>
                </div>
            </div>
        </>
      ) : (
          /* CHAT COMPONENT */
          <Chat 
            messages={chatMessages} 
            onSendMessage={onSendMessage} 
          />
      )}
    </div>
  );
};

export default Sidebar;
