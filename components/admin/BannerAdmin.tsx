
import React, { useState } from 'react';
import { Banner } from '../../types';

interface BannerAdminProps {
  banners: Banner[];
  onUpdateBanners: (banners: Banner[]) => void;
}

const BannerAdmin: React.FC<BannerAdminProps> = ({ banners, onUpdateBanners }) => {
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);

  const handleSave = () => {
    if (!editingBanner?.title || !editingBanner?.image) {
      alert("Preencha o título e a URL da imagem.");
      return;
    }

    if (editingBanner.id) {
      // Update
      onUpdateBanners(banners.map(b => b.id === editingBanner.id ? { ...b, ...editingBanner } as Banner : b));
    } else {
      // Create
      const newBanner: Banner = {
        ...editingBanner,
        id: `banner-${Date.now()}`,
        active: true,
      } as Banner;
      onUpdateBanners([...banners, newBanner]);
    }
    setEditingBanner(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Deseja excluir este banner?")) {
      onUpdateBanners(banners.filter(b => b.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    onUpdateBanners(banners.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest border-l-2 border-[#e51a31] pl-3">Gerenciamento de Banners</h3>
        <button 
          onClick={() => setEditingBanner({ title: '', subtitle: '', image: '', color: 'from-[#e51a31] to-[#8b0010]', hasButton: false, buttonText: '', buttonAction: '', active: true })}
          className="bg-[#28a745] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#218838] transition-all"
        >
          Novo Banner
        </button>
      </div>

      {editingBanner && (
        <div className="bg-[#1b1c1d] p-6 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <h4 className="text-xs font-bold text-white uppercase mb-6">{editingBanner.id ? 'Editar Banner' : 'Criar Novo Banner'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Título</label>
                <input 
                  type="text" 
                  value={editingBanner.title} 
                  onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#e51a31]" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Subtítulo</label>
                <input 
                  type="text" 
                  value={editingBanner.subtitle} 
                  onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#e51a31]" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">URL da Imagem</label>
                <input 
                  type="text" 
                  value={editingBanner.image} 
                  onChange={e => setEditingBanner({ ...editingBanner, image: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#e51a31]" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Gradiente (Tailwind classes)</label>
                <input 
                  type="text" 
                  value={editingBanner.color} 
                  onChange={e => setEditingBanner({ ...editingBanner, color: e.target.value })}
                  placeholder="from-[#color] to-[#color]"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#e51a31]" 
                />
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-white/5">
                <input 
                  type="checkbox" 
                  id="hasButton"
                  checked={editingBanner.hasButton} 
                  onChange={e => setEditingBanner({ ...editingBanner, hasButton: e.target.checked })}
                  className="w-4 h-4 accent-[#e51a31]"
                />
                <label htmlFor="hasButton" className="text-xs font-bold text-white cursor-pointer">Ativar Botão de Ação</label>
              </div>

              {editingBanner.hasButton && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Texto do Botão</label>
                    <input 
                      type="text" 
                      value={editingBanner.buttonText} 
                      onChange={e => setEditingBanner({ ...editingBanner, buttonText: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#e51a31]" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Link / Ação</label>
                    <input 
                      type="text" 
                      value={editingBanner.buttonAction} 
                      onChange={e => setEditingBanner({ ...editingBanner, buttonAction: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#e51a31]" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={() => setEditingBanner(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Cancelar</button>
            <button onClick={handleSave} className="flex-2 py-3 bg-[#e51a31] hover:bg-[#ff1f3a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg">Salvar Banner</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {banners.length === 0 ? (
          <div className="text-center py-12 bg-[#1b1c1d] rounded-2xl border border-dashed border-white/10 text-white/20 text-xs font-bold uppercase">Nenhum banner configurado.</div>
        ) : (
          banners.map(banner => (
            <div key={banner.id} className="bg-[#1b1c1d] rounded-2xl border border-white/5 overflow-hidden flex flex-col md:flex-row group hover:border-white/10 transition-all">
              <div className="w-full md:w-48 h-24 md:h-auto relative shrink-0">
                <img src={banner.image} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className={`absolute inset-0 bg-gradient-to-r ${banner.color} opacity-40`} />
              </div>
              <div className="p-5 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-black italic text-white uppercase tracking-tight">{banner.title}</h5>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${banner.active ? 'bg-[#28a745]/20 text-[#28a745]' : 'bg-white/10 text-white/40'}`}>
                      {banner.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 font-medium line-clamp-1">{banner.subtitle}</p>
                  {banner.hasButton && (
                    <div className="mt-2 flex items-center gap-2 text-[9px] font-bold text-[#34b1e2] uppercase">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      {banner.buttonText} → {banner.buttonAction?.slice(0, 30)}...
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleActive(banner.id)} className={`p-2 rounded-lg transition-colors ${banner.active ? 'bg-[#28a745]/10 text-[#28a745] hover:bg-[#28a745] hover:text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`} title={banner.active ? 'Desativar' : 'Ativar'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                  </button>
                  <button onClick={() => setEditingBanner(banner)} className="p-2 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg transition-colors" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(banner.id)} className="p-2 bg-[#e51a31]/10 text-[#e51a31] hover:bg-[#e51a31] hover:text-white rounded-lg transition-colors" title="Excluir">
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

export default BannerAdmin;
