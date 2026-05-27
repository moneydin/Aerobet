
import React, { useState } from 'react';
import { FreeFlightTransaction } from '../types';

interface FreeFlightsModalProps {
  onClose: () => void;
  freeFlights: number;
  history?: FreeFlightTransaction[]; // Prop opcional para histórico
}

const FreeFlightsModal: React.FC<FreeFlightsModalProps> = ({ onClose, freeFlights, history = [] }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#1b1c1d] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative max-h-[85vh]">
        
        {/* Botão de Fechar (X) */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-white/10 text-white/50 hover:text-white p-2 rounded-full transition-colors"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div className="bg-gradient-to-br from-[#913ef2] to-[#5b0ca8] p-8 pb-4 text-center relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
            <div className="relative z-10">
                <h2 className="text-white/80 font-bold uppercase tracking-widest text-xs mb-2">Seu Saldo de Voos</h2>
                <div className="text-6xl font-black text-white italic drop-shadow-lg">{freeFlights}</div>
                <div className="inline-block bg-black/20 rounded-full px-3 py-1 mt-2 border border-white/10 text-[10px] font-bold text-white uppercase">
                    Valor Fixo: R$ 1,00 / Voo
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#141516] border-b border-white/5">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'overview' ? 'text-white bg-white/5' : 'text-white/30 hover:text-white/60'}`}
            >
                Visão Geral
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'history' ? 'text-white bg-white/5' : 'text-white/30 hover:text-white/60'}`}
            >
                Histórico
            </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-[#141516] flex-1 overflow-y-auto no-scrollbar">
            {activeTab === 'overview' ? (
                <>
                    <h3 className="text-sm font-bold text-white uppercase mb-4">Como Funciona</h3>
                    
                    <div className="space-y-3">
                        <div className="flex gap-4 items-start p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-[#913ef2]/20 flex items-center justify-center text-[#913ef2] shrink-0 font-bold">
                                1
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">Coleta Manual</h4>
                                <p className="text-[10px] text-white/50 leading-tight">Ao subir de nível, vá ao seu perfil para coletar os voos. Voos da roleta entram automaticamente.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-[#913ef2]/20 flex items-center justify-center text-[#913ef2] shrink-0 font-bold">
                                2
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">Sem Custo</h4>
                                <p className="text-[10px] text-white/50 leading-tight">Ative o modo "Voo Grátis" no painel de aposta para usar seu saldo sem gastar dinheiro.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-[#913ef2]/20 flex items-center justify-center text-[#913ef2] shrink-0 font-bold">
                                3
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">Regra de Saque</h4>
                                <p className="text-[10px] text-white/50 leading-tight">Para garantir o prêmio em dinheiro real, você deve sacar com multiplicador acima de <span className="text-white font-bold">2.00x</span>.</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full mt-6 bg-white text-black py-3 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                    >
                        Voltar ao Jogo
                    </button>
                </>
            ) : (
                <div className="space-y-3">
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-white/30">
                            <p className="text-xs font-bold uppercase tracking-widest">Nenhum registro encontrado</p>
                        </div>
                    ) : (
                        history.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                        tx.type === 'credit' ? 'bg-[#28a745]/10 text-[#28a745]' : 'bg-[#e51a31]/10 text-[#e51a31]'
                                    }`}>
                                        {tx.type === 'credit' ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/></svg>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white">{tx.source}</span>
                                        <span className="text-[9px] text-white/40">{formatDate(tx.date)}</span>
                                    </div>
                                </div>
                                <span className={`text-sm font-black ${tx.type === 'credit' ? 'text-[#28a745]' : 'text-white/60'}`}>
                                    {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default FreeFlightsModal;
