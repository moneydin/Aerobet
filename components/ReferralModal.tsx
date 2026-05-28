
import React, { useState } from 'react';
import { Referral } from '../types';

interface ReferralModalProps {
  onClose: () => void;
  referralCode: string; // Geralmente o username
  referrals: Referral[];
  onClaim: (referralId: string) => void;
}

const ReferralModal: React.FC<ReferralModalProps> = ({ onClose, referralCode, referrals, onClaim }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
      navigator.clipboard.writeText(referralCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  const totalEarned = referrals
    .filter(r => r.status === 'claimed')
    .reduce((acc, _) => acc + 10, 0);

  const pendingCount = referrals.filter(r => r.status !== 'claimed').length;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 font-sans">
      <div className="bg-[#09090b] w-full max-w-2xl rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden relative">
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#28a745]/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-start relative z-10">
            <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">
                    Indique e <span className="text-[#28a745]">Ganhe R$ 10</span>
                </h2>
                <p className="text-xs text-white/50 font-medium">Convide amigos. Você e ele ganham bônus real.</p>
            </div>
            <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>

        <div className="p-6 md:p-8 flex-1 overflow-y-auto no-scrollbar space-y-8 relative z-10">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1b1c1d] p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Total Ganho</span>
                    <span className="text-2xl font-black text-[#28a745]">R$ {totalEarned.toFixed(2)}</span>
                </div>
                <div className="bg-[#1b1c1d] p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Amigos Pendentes</span>
                    <span className="text-2xl font-black text-white">{pendingCount}</span>
                </div>
            </div>

            {/* Share Section */}
            <div className="bg-[#141516] p-6 rounded-2xl border border-white/5">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Seu Código de Indicação</h3>
                
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 bg-black p-4 rounded-xl border border-dashed border-white/20 flex items-center justify-center relative group">
                        <span className="text-2xl font-black text-white tracking-[0.2em]">{referralCode}</span>
                        <div className="absolute inset-0 bg-[#28a745]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                    </div>
                    <button 
                        onClick={handleCopy}
                        className={`px-8 py-4 rounded-xl font-bold uppercase text-xs transition-all shadow-lg flex items-center justify-center gap-2 md:w-40 ${isCopied ? 'bg-[#28a745] text-white' : 'bg-white text-black hover:bg-gray-200'}`}
                    >
                        {isCopied ? (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                Copiado
                            </>
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                Copiar
                            </>
                        )}
                    </button>
                </div>
                <p className="text-[10px] text-white/30 mt-2 text-center">Peça para seu amigo inserir este código no momento do cadastro.</p>
            </div>

            {/* Rules */}
            <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#1b1c1d] border border-white/20 flex items-center justify-center text-white text-xs font-bold relative z-10">1</div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Envie o Código</h4>
                            <p className="text-[10px] text-white/50 leading-relaxed max-w-sm">Seu amigo deve se cadastrar usando o código <span className="text-white font-bold">{referralCode}</span>.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#1b1c1d] border border-white/20 flex items-center justify-center text-white text-xs font-bold relative z-10">2</div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Requisitos</h4>
                            <p className="text-[10px] text-white/50 leading-relaxed max-w-sm">
                                O amigo deve depositar min. <span className="text-[#28a745] font-bold">R$ 20,00</span> e realizar <span className="text-[#913ef2] font-bold">10 voos</span> com saque a partir de <span className="text-[#d97d1b] font-bold">2.00x</span>.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#28a745] flex items-center justify-center text-white relative z-10 shadow-[0_0_15px_rgba(40,167,69,0.4)] animate-pulse">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Ambos Ganham R$ 10,00</h4>
                            <p className="text-[10px] text-white/50 leading-relaxed max-w-sm">Assim que ele cumprir a meta, você e ele recebem R$ 10,00 de saldo real.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Referrals List */}
            <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Meus Indicados</h3>
                <div className="space-y-3">
                    {referrals.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Nenhuma indicação ainda</p>
                        </div>
                    ) : (
                        referrals.map((ref) => {
                            const depositDone = ref.depositedAmount >= 20;
                            const flightsDone = ref.flightsCount >= 10;
                            const isReady = depositDone && flightsDone;
                            
                            return (
                                <div key={ref.id} className="bg-[#141516] p-4 rounded-xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white uppercase">
                                            {ref.username[0]}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-white">{ref.username}</h4>
                                            <span className="text-[9px] text-white/40">Entrou em: {new Date(ref.registeredAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="flex gap-4 w-full md:w-auto justify-center">
                                        <div className={`flex flex-col items-center ${depositDone ? 'opacity-100' : 'opacity-40'}`}>
                                            <span className="text-[8px] font-bold uppercase mb-1">Depósito 20+</span>
                                            <div className={`w-2 h-2 rounded-full ${depositDone ? 'bg-[#28a745] shadow-[0_0_5px_#28a745]' : 'bg-white/20'}`} />
                                        </div>
                                        <div className="w-px h-8 bg-white/10"></div>
                                        <div className={`flex flex-col items-center ${flightsDone ? 'opacity-100' : 'opacity-40'}`}>
                                            <span className="text-[8px] font-bold uppercase mb-1">10 Voos (2.0x+)</span>
                                            <div className="flex items-center gap-1">
                                                <div className={`w-2 h-2 rounded-full ${flightsDone ? 'bg-[#28a745] shadow-[0_0_5px_#28a745]' : 'bg-white/20'}`} />
                                                <span className="text-[8px] text-white/50">{ref.flightsCount}/10</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="w-full md:w-auto">
                                        {ref.status === 'claimed' ? (
                                            <div className="px-4 py-2 bg-[#28a745]/10 rounded-lg border border-[#28a745]/20 text-[#28a745] text-[10px] font-black uppercase text-center w-full md:w-32">
                                                Resgatado
                                            </div>
                                        ) : isReady ? (
                                            <button 
                                                onClick={() => onClaim(ref.id)}
                                                className="w-full md:w-32 px-4 py-2 bg-[#28a745] hover:bg-[#218838] text-white rounded-lg text-[10px] font-black uppercase shadow-lg animate-pulse transition-all active:scale-95"
                                            >
                                                Resgatar R$10
                                            </button>
                                        ) : (
                                            <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 text-white/30 text-[10px] font-bold uppercase text-center w-full md:w-32">
                                                Pendente
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ReferralModal;
