
import React, { useState } from 'react';
import { UserStats } from '../types';

interface SubscriptionModalProps {
  onClose: () => void;
  stats: UserStats;
  balance: number;
  onSubscribe: (autoRenew: boolean) => void;
  onToggleAutoRenew: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ 
    onClose, 
    stats, 
    balance,
    onSubscribe,
    onToggleAutoRenew
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados de Assinatura
  const isSubscribed = (stats.subscriptionExpiresAt || 0) > Date.now();
  const neverSubscribed = !stats.subscriptionExpiresAt || stats.subscriptionExpiresAt === 0;
  const isExpired = !isSubscribed && !neverSubscribed;

  const expiresDate = stats.subscriptionExpiresAt ? new Date(stats.subscriptionExpiresAt) : null;
  
  // Cálculo de dias restantes e progresso
  const totalDuration = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms
  const timeRemaining = stats.subscriptionExpiresAt ? Math.max(0, stats.subscriptionExpiresAt - Date.now()) : 0;
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
  const progressPercent = Math.min(100, Math.max(0, (timeRemaining / totalDuration) * 100));

  const PROMO_PRICE = 47.90;

  const handleRenew = () => {
      if (balance < PROMO_PRICE) return;
      setIsProcessing(true);
      setTimeout(() => {
          onSubscribe(stats.autoRenewSubscription || true);
          setIsProcessing(false);
      }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 font-sans">
        <div className="bg-[#09090b] w-full max-w-lg rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden relative">
            
            {/* Header com Gradiente */}
            <div className="bg-gradient-to-r from-[#141516] to-[#09090b] p-6 border-b border-white/5 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#e51a31]/10 blur-[50px] pointer-events-none" />
                
                <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e51a31] to-[#8b0010] flex items-center justify-center text-white shadow-lg shadow-[#e51a31]/20">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Minha Assinatura</h2>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Gestão do Plano Elite</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-[#141516] border-b border-white/5 shrink-0">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeTab === 'overview' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                >
                    Visão Geral
                    {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#e51a31] shadow-[0_0_10px_#e51a31]" />}
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeTab === 'history' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                >
                    Histórico
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#e51a31] shadow-[0_0_10px_#e51a31]" />}
                </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto no-scrollbar flex-1 bg-[#050505]">
                
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        
                        {/* --- CASE 1: NUNCA ASSINOU (OFERTA) --- */}
                        {neverSubscribed && (
                            <div className="relative rounded-2xl p-1 bg-gradient-to-b from-[#e51a31] to-[#09090b]">
                                <div className="bg-[#0f0f10] rounded-xl p-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-[#28a745] text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-lg flex items-center gap-1">
                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20.24 12.24a6 1.2 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>
                                        50% OFF
                                    </div>
                                    
                                    <h3 className="text-xl font-black text-white italic uppercase mb-1">Plano Elite</h3>
                                    <p className="text-[10px] text-white/50 mb-4 font-medium">Desbloqueie o poder máximo da plataforma.</p>
                                    
                                    <div className="space-y-2 mb-6">
                                        {["IA Trader Automática", "Gestão de Banca Pro", "Suporte Prioritário 24/7", "Emblema Exclusivo"].map((feat, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full bg-[#28a745]/20 flex items-center justify-center text-[#28a745]">
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                                                </div>
                                                <span className="text-xs text-white/80 font-bold">{feat}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col mb-4">
                                        <div className="flex items-center gap-2 text-white/30 line-through text-xs font-bold uppercase tracking-widest">
                                            De R$ 97,90
                                        </div>
                                        <div className="flex items-end gap-1">
                                            <span className="text-4xl font-black text-[#28a745] italic tracking-tighter animate-pulse">R$ {PROMO_PRICE.toFixed(2)}</span>
                                            <span className="text-xs text-white/50 mb-1.5 font-bold">/mês</span>
                                        </div>
                                        <div className="text-[9px] text-[#e51a31] font-bold uppercase mt-1">Oferta por tempo limitado!</div>
                                    </div>

                                    <button 
                                        onClick={handleRenew}
                                        disabled={isProcessing || balance < PROMO_PRICE}
                                        className="w-full bg-[#28a745] hover:bg-[#218838] disabled:bg-gray-800 disabled:opacity-50 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(40,167,69,0.4)] active:scale-95 transition-all"
                                    >
                                        {isProcessing ? 'Processando...' : 'PEGAR OFERTA AGORA'}
                                    </button>
                                    {balance < PROMO_PRICE && <p className="text-[9px] text-[#e51a31] mt-2 font-bold text-center">Saldo insuficiente. Faça um depósito.</p>}
                                </div>
                            </div>
                        )}

                        {/* --- CASE 2: ATIVO (GERENCIAMENTO) --- */}
                        {isSubscribed && (
                            <>
                                <div className="rounded-2xl p-6 border relative overflow-hidden bg-[#1b1c1d] border-[#28a745]/30">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#28a745]/10 blur-[30px]" />
                                    
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div>
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Status Atual</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#28a745] shadow-[0_0_8px_#28a745]" />
                                                <h3 className="text-xl font-black italic uppercase text-white">Plano Ativo</h3>
                                            </div>
                                        </div>
                                        <div className="bg-[#141516] px-3 py-1.5 rounded-lg border border-white/10 text-center">
                                            <span className="text-[9px] font-bold text-white/40 uppercase block">Restam</span>
                                            <span className="text-lg font-black text-white leading-none">{daysRemaining}</span>
                                            <span className="text-[8px] text-white/30 uppercase">Dias</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase">
                                            <span>Validade</span>
                                            <span className="text-white">{expiresDate?.toLocaleDateString()}</span>
                                        </div>
                                        <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/5">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[#28a745] to-[#34b1e2] transition-all duration-1000"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Configurações</h4>
                                    
                                    <div className="flex items-center justify-between p-4 bg-[#141516] rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-bold text-white uppercase">Renovação Automática</h5>
                                                <p className="text-[10px] text-white/40">Debitar do saldo automaticamente.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={onToggleAutoRenew}
                                            className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${stats.autoRenewSubscription ? 'bg-[#28a745]' : 'bg-[#2c2d30]'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${stats.autoRenewSubscription ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* --- CASE 3: EXPIRADO (REATIVAÇÃO) --- */}
                        {isExpired && (
                            <div className="rounded-2xl p-6 border relative overflow-hidden bg-[#1b1c1d] border-[#e51a31]/30">
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Status Atual</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#e51a31]" />
                                            <h3 className="text-xl font-black italic uppercase text-white/60">Plano Expirado</h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center py-2">
                                    <p className="text-xs text-white/60 mb-4">
                                        Seu plano não foi renovado automaticamente. Reative agora para recuperar o acesso imediato ao Robô e Gestão.
                                    </p>
                                    <button 
                                        onClick={handleRenew}
                                        disabled={isProcessing || balance < PROMO_PRICE}
                                        className="w-full bg-[#28a745] hover:bg-[#218838] disabled:bg-gray-800 disabled:opacity-50 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
                                    >
                                        {isProcessing ? 'Processando...' : `REATIVAR POR R$ ${PROMO_PRICE.toFixed(2)}`}
                                    </button>
                                    {balance < PROMO_PRICE && <p className="text-[9px] text-[#e51a31] mt-2 font-bold">Saldo insuficiente para reativar.</p>}
                                </div>
                            </div>
                        )}

                        {/* Benefits Grid (Visible for Active and Expired to remind value) */}
                        {!neverSubscribed && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Seus Benefícios Elite</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-[#141516] p-3 rounded-xl border border-white/5 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-[#34b1e2]/20 flex items-center justify-center text-[#34b1e2]">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                        </div>
                                        <span className="text-[10px] font-bold text-white uppercase">Robô Trader</span>
                                    </div>
                                    <div className="bg-[#141516] p-3 rounded-xl border border-white/5 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-[#28a745]/20 flex items-center justify-center text-[#28a745]">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                                        </div>
                                        <span className="text-[10px] font-bold text-white uppercase">Gestão Auto</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                        {isSubscribed && (
                            <div className="bg-[#28a745]/10 border border-[#28a745]/20 p-4 rounded-xl flex justify-between items-center">
                                <div>
                                    <h5 className="text-xs font-bold text-white uppercase">Assinatura Mensal</h5>
                                    <p className="text-[10px] text-white/50">{new Date(stats.subscriptionExpiresAt! - totalDuration).toLocaleDateString()}</p>
                                </div>
                                <span className="text-xs font-black text-[#28a745]">- R$ {PROMO_PRICE.toFixed(2)}</span>
                            </div>
                        )}
                        
                        {/* Mock History para preencher se expirado */}
                        {(isSubscribed || isExpired) && (
                            <div className="bg-[#1b1c1d] border border-white/5 p-4 rounded-xl flex justify-between items-center opacity-50 grayscale">
                                <div>
                                    <h5 className="text-xs font-bold text-white uppercase">Assinatura Mensal</h5>
                                    <p className="text-[10px] text-white/50">30 dias atrás</p>
                                </div>
                                <span className="text-xs font-black text-white">- R$ {PROMO_PRICE.toFixed(2)}</span>
                            </div>
                        )}

                        {neverSubscribed && (
                            <div className="text-center py-10">
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Nenhum histórico de assinatura</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};

export default SubscriptionModal;
