
import React, { useState } from 'react';
import { AlertConfig } from '../types';

interface AlertsModalProps {
  onClose: () => void;
  config: AlertConfig;
  onSave: (config: AlertConfig) => void;
}

const AlertsModal: React.FC<AlertsModalProps> = ({ onClose, config, onSave }) => {
  const [target, setTarget] = useState(config.target.toString());
  const [sound, setSound] = useState(config.sound);
  const [visual, setVisual] = useState(config.visual);
  const [enabled, setEnabled] = useState(config.enabled);

  const handleSave = () => {
    const numTarget = parseFloat(target);
    if (isNaN(numTarget) || numTarget < 1.01) {
        alert("O multiplicador alvo deve ser maior que 1.00x");
        return;
    }
    onSave({
        target: numTarget,
        sound,
        visual,
        enabled
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#1b1c1d] w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-[#141516] p-6 border-b border-white/5 flex items-center justify-between">
           <div>
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Alertas de Vela</h2>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Monitor de Oportunidades</p>
           </div>
           <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
           </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-[#050505]">
            
            <div className="bg-[#141516] p-4 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest">Ativar Monitoramento</label>
                    <button 
                        onClick={() => setEnabled(!enabled)}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${enabled ? 'bg-[#28a745]' : 'bg-[#2c2d30]'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${enabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                <div className={`transition-all duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Alvo da Vela (Ex: 10.00x)</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            step="0.10"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-lg font-black text-white focus:border-[#e51a31] outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 font-black">X</span>
                    </div>
                    <p className="text-[9px] text-white/30 mt-2">Você será notificado sempre que o jogo atingir ou ultrapassar este valor.</p>
                </div>
            </div>

            <div className={`grid grid-cols-2 gap-4 transition-all duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <button 
                    onClick={() => setSound(!sound)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${sound ? 'bg-[#34b1e2]/10 border-[#34b1e2] text-[#34b1e2]' : 'bg-[#141516] border-white/5 text-white/40 hover:text-white'}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    <span className="text-[9px] font-black uppercase">Som</span>
                </button>
                <button 
                    onClick={() => setVisual(!visual)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${visual ? 'bg-[#913ef2]/10 border-[#913ef2] text-[#913ef2]' : 'bg-[#141516] border-white/5 text-white/40 hover:text-white'}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span className="text-[9px] font-black uppercase">Visual</span>
                </button>
            </div>

            <button 
                onClick={handleSave}
                className="w-full bg-[#e51a31] hover:bg-[#ff1f3a] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
            >
                Salvar Configuração
            </button>

        </div>
      </div>
    </div>
  );
};

export default AlertsModal;
