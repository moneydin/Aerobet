
import React, { useState } from 'react';
import { FreeFlightConfig } from '../../types';

interface FreeFlightAdminProps {
  configs: FreeFlightConfig[];
  onUpdateConfigs: (configs: FreeFlightConfig[]) => void;
}

const FreeFlightAdmin: React.FC<FreeFlightAdminProps> = ({ configs, onUpdateConfigs }) => {
  const [editingConfig, setEditingConfig] = useState<Partial<FreeFlightConfig> | null>(null);

  const handleSave = () => {
    if (!editingConfig?.title || !editingConfig?.description) {
      alert("Preencha o título e a descrição da campanha.");
      return;
    }

    if (editingConfig.id) {
      // Update
      onUpdateConfigs(configs.map(c => c.id === editingConfig.id ? { ...c, ...editingConfig } as FreeFlightConfig : c));
    } else {
      // Create
      const newConfig: FreeFlightConfig = {
        ...editingConfig,
        id: `ffc-${Date.now()}`,
        active: true,
      } as FreeFlightConfig;
      onUpdateConfigs([...configs, newConfig]);
    }
    setEditingConfig(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Deseja excluir esta configuração de voos grátis?")) {
      onUpdateConfigs(configs.filter(c => c.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    onUpdateConfigs(configs.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest border-l-2 border-[#34b1e2] pl-3">Campanhas de Voos Grátis</h3>
        <button 
          onClick={() => setEditingConfig({ title: '', description: '', quantity: 10, valuePerFlight: 1.0, minCashoutMultiplier: 2.0, active: true })}
          className="bg-[#34b1e2] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2096c4] transition-all"
        >
          Nova Campanha
        </button>
      </div>

      {editingConfig && (
        <div className="bg-[#1b1c1d] p-6 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <h4 className="text-xs font-bold text-white uppercase mb-6">{editingConfig.id ? 'Editar Campanha' : 'Criar Nova Campanha'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Título da Campanha</label>
                <input 
                  type="text" 
                  value={editingConfig.title} 
                  onChange={e => setEditingConfig({ ...editingConfig, title: e.target.value })}
                  placeholder="Ex: Bônus de Boas-vindas"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#34b1e2]" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">O que fazer para ganhar?</label>
                <textarea 
                  value={editingConfig.description} 
                  onChange={e => setEditingConfig({ ...editingConfig, description: e.target.value })}
                  placeholder="Ex: Faça um depósito acima de R$ 50 para ganhar."
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#34b1e2] h-24 resize-none" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Qtd de Voos</label>
                  <input 
                    type="number" 
                    value={editingConfig.quantity} 
                    onChange={e => setEditingConfig({ ...editingConfig, quantity: parseInt(e.target.value) })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#34b1e2]" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Valor por Voo (R$)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={editingConfig.valuePerFlight} 
                    onChange={e => setEditingConfig({ ...editingConfig, valuePerFlight: parseFloat(e.target.value) })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#34b1e2]" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Multiplicador Mínimo para Saque</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    step="0.1"
                    value={editingConfig.minCashoutMultiplier} 
                    onChange={e => setEditingConfig({ ...editingConfig, minCashoutMultiplier: parseFloat(e.target.value) })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#34b1e2]" 
                  />
                  <span className="text-xs font-bold text-white/40">x</span>
                </div>
                <p className="text-[9px] text-white/30 mt-1 italic">O jogador só poderá dar cashout se o avião atingir este valor.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={() => setEditingConfig(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Cancelar</button>
            <button onClick={handleSave} className="flex-2 py-3 bg-[#34b1e2] hover:bg-[#2096c4] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg">Salvar Configuração</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {configs.length === 0 ? (
          <div className="text-center py-12 bg-[#1b1c1d] rounded-2xl border border-dashed border-white/10 text-white/20 text-xs font-bold uppercase">Nenhuma campanha de voos grátis ativa.</div>
        ) : (
          configs.map(config => (
            <div key={config.id} className="bg-[#1b1c1d] rounded-2xl border border-white/5 p-5 group hover:border-white/10 transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-black italic text-white uppercase tracking-tight">{config.title}</h5>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${config.active ? 'bg-[#28a745]/20 text-[#28a745]' : 'bg-white/10 text-white/40'}`}>
                      {config.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60 font-medium mb-3">{config.description}</p>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Quantidade</span>
                      <span className="text-xs font-black text-white">{config.quantity} Voos</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Valor Unitário</span>
                      <span className="text-xs font-black text-[#28a745]">R$ {config.valuePerFlight.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Saque Mínimo</span>
                      <span className="text-xs font-black text-[#d97d1b]">{config.minCashoutMultiplier.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleActive(config.id)} className={`p-2 rounded-lg transition-colors ${config.active ? 'bg-[#28a745]/10 text-[#28a745] hover:bg-[#28a745] hover:text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`} title={config.active ? 'Desativar' : 'Ativar'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                  </button>
                  <button onClick={() => setEditingConfig(config)} className="p-2 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg transition-colors" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(config.id)} className="p-2 bg-[#e51a31]/10 text-[#e51a31] hover:bg-[#e51a31] hover:text-white rounded-lg transition-colors" title="Excluir">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FreeFlightAdmin;
