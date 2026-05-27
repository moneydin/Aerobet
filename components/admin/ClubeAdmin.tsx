import React, { useState } from 'react';
import { ClubeConfig } from '../../types';

interface ClubeAdminProps {
  config: ClubeConfig;
  onUpdateConfig: (config: ClubeConfig) => void;
}

const ClubeAdmin: React.FC<ClubeAdminProps> = ({ config, onUpdateConfig }) => {
  const [formData, setFormData] = useState<ClubeConfig>(config);

  const handleSave = () => {
    onUpdateConfig(formData);
    alert('Configurações do Clube Aerobet salvas com sucesso!');
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#1b1c1d] p-6 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-black italic text-white uppercase tracking-tight">Configurações do Clube</h3>
            <p className="text-xs text-white/40">Defina as regras para o programa de fidelidade.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Status do Clube:</span>
            <button 
              onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                formData.active ? 'bg-[#28a745] text-white shadow-lg shadow-[#28a745]/20' : 'bg-white/5 text-white/40'
              }`}
            >
              {formData.active ? 'ATIVO' : 'INATIVO'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Meta de Voos (Ciclo)</label>
              <input 
                type="number" 
                value={formData.targetFlights}
                onChange={e => setFormData(prev => ({ ...prev, targetFlights: parseInt(e.target.value) }))}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#34b1e2]"
                placeholder="Ex: 50"
              />
              <p className="text-[9px] text-white/30 mt-1">Quantidade de voos que o usuário deve fazer para completar o ciclo.</p>
            </div>

            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Recompensa (Voos Grátis)</label>
              <input 
                type="number" 
                value={formData.rewardFlights}
                onChange={e => setFormData(prev => ({ ...prev, rewardFlights: parseInt(e.target.value) }))}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#34b1e2]"
                placeholder="Ex: 5"
              />
              <p className="text-[9px] text-white/30 mt-1">Quantidade de voos grátis concedidos ao completar o ciclo.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Aposta Mínima para Contagem</label>
              <div className="flex items-center gap-2">
                <span className="text-white/40 font-bold text-xs">R$</span>
                <input 
                  type="number" 
                  value={formData.minBetAmount}
                  onChange={e => setFormData(prev => ({ ...prev, minBetAmount: parseFloat(e.target.value) }))}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#34b1e2]"
                  placeholder="Ex: 1.00"
                />
              </div>
              <p className="text-[9px] text-white/30 mt-1">Apenas apostas acima deste valor contam para o progresso do clube.</p>
            </div>

            <div className="bg-[#34b1e2]/5 p-4 rounded-xl border border-[#34b1e2]/20">
              <h4 className="text-[10px] font-black text-[#34b1e2] uppercase tracking-widest mb-2">Resumo da Regra</h4>
              <p className="text-xs text-white/60 leading-relaxed italic">
                "O membro do clube que realizar <span className="text-white font-bold">{formData.targetFlights} voos</span> com valor mínimo de <span className="text-white font-bold">R$ {formData.minBetAmount.toFixed(2)}</span> receberá <span className="text-white font-bold">{formData.rewardFlights} voos grátis</span> como recompensa."
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-8 bg-[#34b1e2] hover:bg-[#2096c4] text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-[#34b1e2]/20 active:scale-95 transition-all"
        >
          Salvar Configurações do Clube
        </button>
      </div>

      <div className="bg-[#1b1c1d] p-6 rounded-2xl border border-white/5">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Dicas de Gestão</h3>
        <ul className="space-y-3">
          <li className="flex gap-3 text-xs text-white/50">
            <div className="w-1.5 h-1.5 rounded-full bg-[#34b1e2] mt-1 shrink-0" />
            <span>O Clube Aerobet é uma ferramenta de retenção. Metas muito altas podem desmotivar jogadores casuais.</span>
          </li>
          <li className="flex gap-3 text-xs text-white/50">
            <div className="w-1.5 h-1.5 rounded-full bg-[#34b1e2] mt-1 shrink-0" />
            <span>Combine o Clube com Campanhas de Voos Grátis para maximizar o engajamento em datas especiais.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ClubeAdmin;
