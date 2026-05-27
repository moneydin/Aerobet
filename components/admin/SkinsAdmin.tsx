import React, { useState, useRef, useEffect } from 'react';
import { getCustomSkins, saveCustomSkin, CustomSkin } from '../../src/utils/customSkins';

export default function SkinsAdmin() {
  const [skins, setSkins] = useState<CustomSkin[]>([]);
  const [newSkin, setNewSkin] = useState<Partial<CustomSkin>>({
    name: '',
    price: 100,
    priceType: 'co',
    previewColorGradient: 'from-[#000000] to-[#1a1c23]',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    smokeColor: '#ff0000',
    lineColor: '#ff0000',
    offsetX: -90,
    offsetY: -90,
    scale: 1.1,
    rotation: 12
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSkins(getCustomSkins());
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ser menor que 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 400;
        if (width > max || height > max) {
          if (width > height) {
            height = Math.floor((height * max) / width);
            width = max;
          } else {
            width = Math.floor((width * max) / height);
            height = max;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        
        setNewSkin(prev => ({
          ...prev,
          imageBase64: canvas.toDataURL('image/png')
        }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSkin = () => {
    if (!newSkin.name || !newSkin.imageBase64) {
      alert("Preencha o nome e selecione uma imagem.");
      return;
    }

    const skinToSave: CustomSkin = {
      id: 'custom_' + Date.now(),
      name: newSkin.name,
      category: 'skin',
      description: 'Aeronave customizada adicionada pelo admin.',
      priceType: newSkin.priceType || 'co',
      price: newSkin.price || 100,
      previewColorGradient: newSkin.previewColorGradient || 'from-[#0b0c0d] to-[#1a1c23]',
      bgColor: newSkin.bgColor || 'bg-indigo-500/10 border-indigo-500/20',
      rating: 5.0,
      reviewsCount: 1,
      specs: ['Design Exclusivo', 'Custom Edition'],
      imageBase64: newSkin.imageBase64,
      smokeColor: newSkin.smokeColor || '#ff0000',
      lineColor: newSkin.lineColor || '#ff0000',
      offsetX: newSkin.offsetX !== undefined ? newSkin.offsetX : -90,
      offsetY: newSkin.offsetY !== undefined ? newSkin.offsetY : -90,
      scale: newSkin.scale !== undefined ? newSkin.scale : 1.1,
      rotation: newSkin.rotation !== undefined ? newSkin.rotation : 12,
    };

    const updated = saveCustomSkin(skinToSave);
    setSkins(updated);
    alert("Skin criada com sucesso!");
    setNewSkin({
      name: '',
      price: 100,
      priceType: 'co',
      previewColorGradient: 'from-[#000000] to-[#1a1c23]',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      smokeColor: '#ff0000',
      lineColor: '#ff0000',
      offsetX: -90,
      offsetY: -90,
      scale: 1.1,
      rotation: 12,
      imageBase64: undefined
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#1b1c1d] rounded-2xl border border-white/5 p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-l-2 border-[#34b1e2] pl-3">Adicionar Nova Skin</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Nome da Aeronave</label>
              <input type="text" value={newSkin.name} onChange={e => setNewSkin({...newSkin, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#34b1e2] outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Preço</label>
                <input type="number" value={newSkin.price} onChange={e => setNewSkin({...newSkin, price: parseFloat(e.target.value)})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#34b1e2] outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Moeda (rc / co)</label>
                <select value={newSkin.priceType} onChange={e => setNewSkin({...newSkin, priceType: e.target.value as any})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#34b1e2] outline-none">
                  <option value="co">AeroCoins (co)</option>
                  <option value="rc">RealCash (rc)</option>
                </select>
              </div>
            </div>

            <div>
               <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Upload da Imagem (Max 2MB)</label>
               <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="w-full text-xs text-white file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white" />
            </div>
            
            {newSkin.imageBase64 && (
              <div className="mt-4 flex flex-col items-center justify-center p-4 bg-black/40 rounded-xl border border-white/5">
                 <img src={newSkin.imageBase64} alt="Preview" className="w-32 h-32 object-contain" />
              </div>
            )}
          </div>
          
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Cor Fumaça (Hex/Url)</label>
                  <input type="text" value={newSkin.smokeColor} onChange={e => setNewSkin({...newSkin, smokeColor: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Cor Linha (Hex/Url)</label>
                  <input type="text" value={newSkin.lineColor} onChange={e => setNewSkin({...newSkin, lineColor: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">OffsetX Gráfico</label>
                  <input type="number" value={newSkin.offsetX} onChange={e => setNewSkin({...newSkin, offsetX: parseFloat(e.target.value)})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">OffsetY Gráfico</label>
                  <input type="number" value={newSkin.offsetY} onChange={e => setNewSkin({...newSkin, offsetY: parseFloat(e.target.value)})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Scale Gráfico (ex: 1.1)</label>
                  <input type="number" step="0.1" value={newSkin.scale} onChange={e => setNewSkin({...newSkin, scale: parseFloat(e.target.value)})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Rotation Gráfico (°)</label>
                  <input type="number" value={newSkin.rotation} onChange={e => setNewSkin({...newSkin, rotation: parseFloat(e.target.value)})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
               </div>
             </div>
          </div>
        </div>

        <button onClick={handleCreateSkin} className="mt-8 bg-[#34b1e2] text-white py-4 px-8 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#2096c4] shadow-lg active:scale-95 transition-all">
          Salvar Nova Configuração
        </button>
      </div>

      <div className="bg-[#1b1c1d] rounded-2xl border border-white/5 p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Skins Cadastradas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {skins.map(sk => (
             <div key={sk.id} className="bg-black/50 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                <img src={sk.imageBase64} className="w-20 h-20 object-contain mb-2 mix-blend-screen" alt={sk.name}/>
                <span className="text-xs font-bold text-white">{sk.name}</span>
                <span className="text-[10px] text-white/50">{sk.priceType === 'co' ? 'AeroCoins' : 'RealCash'}: {sk.price}</span>
             </div>
           ))}
           {skins.length === 0 && <span className="text-xs text-white/30">Nenhuma custom skin adicionada.</span>}
        </div>
      </div>
    </div>
  );
}
