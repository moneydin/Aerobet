
import React, { useState } from 'react';

interface RankingsModalProps {
  onClose: () => void;
}

const RankingsModal: React.FC<RankingsModalProps> = ({ onClose }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Dados Mockados para o Ranking
  const RANKING_DATA = [
      { rank: 1, name: "MestreDoAero", amount: 15420.50, multiplier: 1250.00, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=King" },
      { rank: 2, name: "ReiDoVoo", amount: 12100.00, multiplier: 850.20, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
      { rank: 3, name: "Jogador_Elite", amount: 8450.75, multiplier: 520.10, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AERObetFan10", isMe: true }, // Simulando o usuário
      { rank: 4, name: "VencedorMax", amount: 5200.20, multiplier: 210.50, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zico" },
      { rank: 5, name: "VooRasante", amount: 3100.00, multiplier: 105.00, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pilot" },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#1b1c1d] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#141516]">
             <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">Ranking Global</h2>
                <div className="flex gap-1">
                    {(['daily', 'weekly', 'monthly'] as const).map(p => (
                        <button 
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`text-[9px] uppercase font-bold px-3 py-1 rounded-full transition-colors ${period === p ? 'bg-[#e51a31] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                        >
                            {p === 'daily' ? 'Diário' : p === 'weekly' ? 'Semanal' : 'Mensal'}
                        </button>
                    ))}
                </div>
             </div>
             <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
             </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto no-scrollbar flex-1 bg-[#050505]">
            <div className="flex justify-between px-4 mb-2 text-[8px] font-black uppercase text-white/20 tracking-widest">
                <span>Rank / Jogador</span>
                <div className="flex gap-4">
                    <span>Maior Multi</span>
                    <span className="w-16 text-right">Total Ganho</span>
                </div>
            </div>

            <div className="space-y-2">
                {RANKING_DATA.map((player) => (
                    <div 
                        key={player.rank} 
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            player.isMe 
                            ? 'bg-[#e51a31]/10 border-[#e51a31]/40 shadow-[0_0_15px_rgba(229,26,49,0.2)]' 
                            : 'bg-[#1b1c1d] border-white/5'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-lg shadow-lg ${
                                player.rank === 1 ? 'bg-yellow-500 text-black' : 
                                player.rank === 2 ? 'bg-gray-300 text-black' : 
                                player.rank === 3 ? 'bg-amber-700 text-black' : 'bg-white/10 text-white/50'
                            }`}>
                                {player.rank}
                            </div>
                            <div className="flex items-center gap-3">
                                <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full bg-black/50" />
                                <div className="flex flex-col">
                                    <span className={`text-xs font-bold ${player.isMe ? 'text-[#e51a31]' : 'text-white'}`}>
                                        {player.name} {player.isMe && '(Você)'}
                                    </span>
                                    {player.rank <= 3 && (
                                        <span className="text-[8px] text-yellow-500 uppercase font-black tracking-widest">Top Player</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-right">
                             <span className="text-xs font-bold text-[#913ef2]">{player.multiplier.toFixed(2)}x</span>
                             <span className="text-xs font-black italic text-[#28a745] w-20">R$ {(player.amount/1000).toFixed(1)}k</span>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 p-4 bg-[#1b1c1d] rounded-xl border border-white/5 text-center">
                 <p className="text-[10px] text-white/40 mb-2">Os rankings são resetados diariamente às 00:00 UTC.</p>
                 <button className="text-xs font-bold text-[#e51a31] hover:underline">Ver regras de premiação</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RankingsModal;
