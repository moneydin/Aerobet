import React, { useState, useRef, useEffect } from 'react';
import { getCustomSkins, saveCustomSkin, toggleCustomSkinActive, CustomSkin } from '../../src/utils/customSkins';
import { PRODUCTS_LIST } from '../StoreModal';

export default function AeronavesAdmin() {
  const [aeronaves, setAeronaves] = useState<CustomSkin[]>([]);
  const [previewMode, setPreviewMode] = useState<'air' | 'start'>('air');
  const [expandedControl, setExpandedControl] = useState<'offsetX' | 'offsetY' | 'scale' | 'rotation'>('offsetX');
  const [newAeronave, setNewAeronave] = useState<Partial<CustomSkin>>({
    name: '', price: 100, priceType: 'co', previewColorGradient: 'from-[#000000] to-[#1a1c23]',
    bgColor: 'bg-[#1b1c1d] border-[#34b1e2]/20', smokeColor: '#ff0000', smokeColor2: '#ff0000',
    lineColor: '#ff0000', lineColor2: '#ff0000', offsetX: -90, offsetY: -90, scale: 1.1, rotation: 12, flipX: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const processAndResizeImage = (file: File, maxDimension: number, isCover: boolean) => {
    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem não pode passar de 2MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.floor((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.floor((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/png');
        setNewAeronave(prev => isCover 
          ? { ...prev, coverImageBase64: base64 } 
          : { ...prev, imageBase64: base64 }
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processAndResizeImage(e.target.files[0], 800, true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processAndResizeImage(e.target.files[0], 400, false);
  };

  const refreshAeronaves = () => {
    const defaultAeronaves = PRODUCTS_LIST.filter(p => p.category === 'skin').map(p => ({
       id: p.id,
       name: p.name,
       category: 'skin' as const,
       description: p.description || '',
       priceType: (p as any).priceType || 'rc',
       price: (p as any).price || 0,
       previewColorGradient: p.previewColorGradient || '',
       bgColor: p.bgColor || '',
       rating: p.rating,
       reviewsCount: p.reviewsCount,
       specs: p.specs,
       imageBase64: `/images/skin_${p.id}.png`,
       isActive: true
    }));
    
    const customAeronaves = getCustomSkins();
    const finalAeronaves = [...defaultAeronaves.filter(ds => !customAeronaves.find(cs => cs.id === ds.id)), ...customAeronaves];
    setAeronaves(finalAeronaves);
  };

  useEffect(() => {
    refreshAeronaves();
  }, []);

  const handleSaveAeronave = () => {
    if (!newAeronave.name || !newAeronave.imageBase64) {
      alert("Preencha o nome e selecione uma imagem do avião.");
      return;
    }

    const aeronaveToSave: CustomSkin = {
      id: newAeronave.id || ('custom_' + Date.now()),
      name: newAeronave.name,
      category: 'skin',
      description: newAeronave.description || 'Aeronave customizada exclusiva.',
      priceType: newAeronave.priceType || 'co',
      price: newAeronave.price || 0,
      previewColorGradient: newAeronave.previewColorGradient || 'from-[#0b0c0d] to-[#1a1c23]',
      bgColor: newAeronave.bgColor || 'bg-[#1b1c1d] border-white/5',
      rating: newAeronave.rating || 5.0,
      reviewsCount: newAeronave.reviewsCount || 1,
      specs: newAeronave.specs && newAeronave.specs.length > 0 ? newAeronave.specs : ['Design Exclusivo', 'Aeronáutica Custom'],
      imageBase64: newAeronave.imageBase64,
      smokeColor: newAeronave.smokeColor || '#ff0000',
      smokeColor2: newAeronave.smokeColor2 || newAeronave.smokeColor || '#ff0000',
      lineColor: newAeronave.lineColor || '#ff0000',
      lineColor2: newAeronave.lineColor2 || newAeronave.lineColor || '#ff0000',
      offsetX: newAeronave.offsetX !== undefined ? newAeronave.offsetX : -90,
      offsetY: newAeronave.offsetY !== undefined ? newAeronave.offsetY : -90,
      scale: newAeronave.scale !== undefined ? newAeronave.scale : 1.1,
      rotation: newAeronave.rotation !== undefined ? newAeronave.rotation : 12,
      offsetXStart: newAeronave.offsetXStart !== undefined ? newAeronave.offsetXStart : -90,
      offsetYStart: newAeronave.offsetYStart !== undefined ? newAeronave.offsetYStart : -90,
      scaleStart: newAeronave.scaleStart !== undefined ? newAeronave.scaleStart : 1.1,
      rotationStart: newAeronave.rotationStart !== undefined ? newAeronave.rotationStart : 12,
      flipX: newAeronave.flipX || false,
      isActive: newAeronave.isActive !== undefined ? newAeronave.isActive : true,
      badge: newAeronave.badge,
      coverImageBase64: newAeronave.coverImageBase64
    };

    saveCustomSkin(aeronaveToSave);
    refreshAeronaves();
    alert("Aeronave publicada com sucesso!");
    resetForm();
  };

  const resetForm = () => {
    setNewAeronave({
      name: '', price: 100, priceType: 'co', previewColorGradient: 'from-[#000000] to-[#1a1c23]',
      bgColor: 'bg-[#1b1c1d] border-[#34b1e2]/20', smokeColor: '#ff0000', smokeColor2: '#ff0000',
      lineColor: '#ff0000', lineColor2: '#ff0000', offsetX: -90, offsetY: -90, scale: 1.1, rotation: 12, flipX: false,
      offsetXStart: -90, offsetYStart: -90, scaleStart: 1.1, rotationStart: 12, imageBase64: undefined, coverImageBase64: undefined, description: '', badge: '', specs: []
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER AERONAVES */}
      <div className="flex flex-col items-center justify-center pt-8 pb-4">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#34b1e2] to-sky-400 mb-2 drop-shadow-md">Engenharia de Aeronaves</h2>
        <p className="text-sm md:text-base text-white/50 font-medium">Hangar de desenvolvimento. Crie, teste e publique frotas.</p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* SETUP BOARD AREA */}
        <div className="bg-[#111214] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden p-8 md:p-10 relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
             <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
               <span className="text-[#34b1e2]">✈️</span> {newAeronave.id ? "Modificação de Aeronave" : "Novo Protótipo"}
             </h3>
             {newAeronave.id && (
               <button onClick={resetForm} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-colors">
                 Cancelar / Novo Modelo
               </button>
             )}
          </div>
          
          <div className="flex flex-col-reverse lg:flex-row gap-12 relative z-10">
            {/* LADO ESQUERDO: CONTROLES */}
            <div className="w-full lg:w-1/2 space-y-6">
              
              {/* Bloqueio de Informações Básicas */}
              <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-5">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest pl-2 border-l-2 border-sky-400">Identificação Comercial</h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Modelo / Nome</label>
                    <input type="text" placeholder="Nome oficial na loja..." value={newAeronave.name || ''} onChange={e => setNewAeronave({...newAeronave, name: e.target.value})} className="w-full bg-[#1b1c1d] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-sky-400 focus:bg-[#202225] outline-none transition-colors" />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Descrição Comercial</label>
                     <input type="text" placeholder="Uma frase impactante..." value={newAeronave.description || ''} onChange={e => setNewAeronave({...newAeronave, description: e.target.value})} className="w-full bg-[#1b1c1d] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-sky-400 focus:bg-[#202225] outline-none transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Valor</label>
                    <input type="number" value={newAeronave.price ?? 0} onChange={e => setNewAeronave({...newAeronave, price: parseFloat(e.target.value)})} className="w-full bg-[#1b1c1d] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-sky-400 focus:bg-[#202225] outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Moeda (rc / co)</label>
                    <select value={newAeronave.priceType || 'co'} onChange={e => setNewAeronave({...newAeronave, priceType: e.target.value as 'rc'|'co'})} className="w-full bg-[#1b1c1d] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-sky-400 focus:bg-[#202225] outline-none transition-colors">
                      <option value="co">AeroCoins (AC$)</option>
                      <option value="rc">RealCash (R$)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bloqueio Visual */}
              <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-5">
                <h4 className="text-xs font-bold text-[#e51a31] uppercase tracking-widest pl-2 border-l-2 border-[#e51a31]">Cores e Rastro (Fumaça)</h4>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* FUMAÇA */}
                  <div className="space-y-4 bg-[#1b1c1d] p-4 rounded-xl border border-white/5">
                    <div>
                       <label className="text-[10px] font-bold text-white/40 uppercase block mb-2">Fumaça Mestre</label>
                       <div className="flex gap-3 items-center">
                         <input type="color" value={newAeronave.smokeColor || '#ff0000'} onChange={e => setNewAeronave({...newAeronave, smokeColor: e.target.value})} className="w-12 h-10 rounded-lg cursor-pointer shrink-0 border-none outline-none p-0 bg-transparent" />
                         <span className="text-[10px] text-white/50 font-mono uppercase">{newAeronave.smokeColor || '#ff0000'}</span>
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-white/40 uppercase block flex items-center justify-between mb-2">
                         <span>Fumaça Ponta</span>
                         <label className="flex items-center gap-1 cursor-pointer">
                           <input type="checkbox" checked={newAeronave.smokeColor2 !== newAeronave.smokeColor && newAeronave.smokeColor2 !== undefined} onChange={e => setNewAeronave({...newAeronave, smokeColor2: e.target.checked ? '#ffffff' : newAeronave.smokeColor})} className="w-3 h-3 accent-sky-400 rounded-sm" />
                           <span className="text-[8px] text-white/60">Degradê</span>
                         </label>
                       </label>
                       {(newAeronave.smokeColor2 !== newAeronave.smokeColor && newAeronave.smokeColor2 !== undefined) ? (
                         <div className="flex gap-3 items-center">
                           <input type="color" value={newAeronave.smokeColor2 || '#ffffff'} onChange={e => setNewAeronave({...newAeronave, smokeColor2: e.target.value})} className="w-12 h-10 rounded-lg cursor-pointer shrink-0 border-none outline-none p-0 bg-transparent" />
                           <span className="text-[10px] text-white/50 font-mono uppercase">{newAeronave.smokeColor2 || '#ffffff'}</span>
                         </div>
                       ) : (
                         <div className="h-10 bg-white/5 rounded-lg flex items-center justify-center text-[9px] text-white/20 uppercase cursor-not-allowed">Secundária Off</div>
                       )}
                    </div>
                  </div>

                  {/* LINHA DE VOO */}
                  <div className="space-y-4 bg-[#1b1c1d] p-4 rounded-xl border border-white/5">
                    <div>
                       <label className="text-[10px] font-bold text-white/40 uppercase block mb-2">Linha Mestre</label>
                       <div className="flex gap-3 items-center">
                         <input type="color" value={newAeronave.lineColor || '#ff0000'} onChange={e => setNewAeronave({...newAeronave, lineColor: e.target.value})} className="w-12 h-10 rounded-lg cursor-pointer shrink-0 border-none outline-none p-0 bg-transparent" />
                         <span className="text-[10px] text-white/50 font-mono uppercase">{newAeronave.lineColor || '#ff0000'}</span>
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-white/40 uppercase block flex items-center justify-between mb-2">
                         <span>Linha Ponta</span>
                         <label className="flex items-center gap-1 cursor-pointer">
                           <input type="checkbox" checked={newAeronave.lineColor2 !== newAeronave.lineColor && newAeronave.lineColor2 !== undefined} onChange={e => setNewAeronave({...newAeronave, lineColor2: e.target.checked ? '#ffffff' : newAeronave.lineColor})} className="w-3 h-3 accent-[#e51a31] rounded-sm" />
                           <span className="text-[8px] text-white/60">Degradê</span>
                         </label>
                       </label>
                      {(newAeronave.lineColor2 !== newAeronave.lineColor && newAeronave.lineColor2 !== undefined) ? (
                         <div className="flex gap-3 items-center">
                           <input type="color" value={newAeronave.lineColor2 || '#ffffff'} onChange={e => setNewAeronave({...newAeronave, lineColor2: e.target.value})} className="w-12 h-10 rounded-lg cursor-pointer shrink-0 border-none outline-none p-0 bg-transparent" />
                           <span className="text-[10px] text-white/50 font-mono uppercase">{newAeronave.lineColor2 || '#ffffff'}</span>
                         </div>
                      ) : (
                         <div className="h-10 bg-white/5 rounded-lg flex items-center justify-center text-[9px] text-white/20 uppercase cursor-not-allowed">Secundária Off</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploads */}
              <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-5">
                <h4 className="text-xs font-bold text-[#10b981] uppercase tracking-widest pl-2 border-l-2 border-[#10b981]">Ativos e Mídias</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1b1c1d] rounded-xl border border-white/5 p-4 hover:border-white/20 transition-colors group">
                     <label className="text-[10px] font-bold text-white uppercase block mb-3 text-center">Sprite do Avião (PNG)</label>
                     <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" id="upload-sprite" />
                     <label htmlFor="upload-sprite" className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/20 rounded-lg cursor-pointer group-hover:bg-white/5 group-hover:border-[#10b981]/50 transition-all">
                        {newAeronave.imageBase64 ? (
                          <img src={newAeronave.imageBase64} className="h-16 object-contain mix-blend-screen" alt="preview" />
                        ) : (
                          <span className="text-xs font-mono text-white/40">Selecionar Imagem</span>
                        )}
                     </label>
                  </div>

                  <div className="bg-[#1b1c1d] rounded-xl border border-white/5 p-4 hover:border-white/20 transition-colors group">
                     <label className="text-[10px] font-bold text-white uppercase block mb-3 text-center">Capa Comercial (Opcional)</label>
                     <input type="file" accept="image/*" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" id="upload-cover" />
                     <label htmlFor="upload-cover" className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/20 rounded-lg cursor-pointer group-hover:bg-white/5 group-hover:border-[#10b981]/50 transition-all overflow-hidden relative">
                        {newAeronave.coverImageBase64 ? (
                          <img src={newAeronave.coverImageBase64} className="w-full h-full object-cover absolute inset-0 opacity-80" alt="capa" />
                        ) : (
                          <span className="text-xs font-mono text-white/40">Opcional para Loja</span>
                        )}
                     </label>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-[#1b1c1d] p-3 rounded-xl border border-white/5">
                  <input type="checkbox" id="flipX" checked={newAeronave.flipX || false} onChange={e => setNewAeronave({...newAeronave, flipX: e.target.checked})} className="w-5 h-5 rounded border-white/10 bg-black/50 accent-[#10b981]" />
                  <label htmlFor="flipX" className="text-xs font-bold text-white/70 uppercase select-none cursor-pointer">Inverter Orientação do Avião Horizontalmente (FlipX)?</label>
                </div>
              </div>

            </div>

            {/* LADO DIREITO: LIVE PREVIEW & CONTROLES DIMENSIONAIS */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="lg:sticky lg:top-4 space-y-6">
                
                {/* Visualizador do Jogo Emulator */}
                <div className="w-full rounded-[2rem] overflow-hidden border-2 border-[#34b1e2]/30 relative bg-[#050505] shadow-[0_0_40px_rgba(52,177,226,0.15)]">
                  <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
                    <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest text-[#34b1e2] border border-[#34b1e2]/30 pointer-events-auto shadow-lg">
                      Ambiente de Validação Gráfica
                    </div>
                    <div className="flex bg-black/80 backdrop-blur-md rounded-lg overflow-hidden border border-white/10 pointer-events-auto">
                      <button onClick={() => setPreviewMode('start')} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${previewMode === 'start' ? 'bg-[#34b1e2] text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>Momento ZERO (Pista)</button>
                      <button onClick={() => setPreviewMode('air')} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${previewMode === 'air' ? 'bg-[#34b1e2] text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>VOANDO (No Ar)</button>
                    </div>
                  </div>
                  
                  {/* Dynamic Overlay Glow */}
                  <div 
                    className="absolute inset-0 opacity-30 filter blur-[80px] pointer-events-none mix-blend-screen transition-colors duration-1000"
                    style={{ background: `radial-gradient(circle at 60% 40%, ${newAeronave.smokeColor || '#fff'} 0%, transparent 60%)` }}
                  />

                  <div className="w-full h-[280px] sm:h-[320px] md:h-[350px] relative flex-1">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <linearGradient id="previewFire" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                          <stop offset="20%" stopColor={newAeronave.smokeColor || '#ff0000'} stopOpacity="1" />
                          <stop offset="55%" stopColor={newAeronave.smokeColor2 || newAeronave.smokeColor || '#ff0000'} stopOpacity="1" />
                          <stop offset="100%" stopColor={newAeronave.smokeColor2 || newAeronave.smokeColor || '#ff0000'} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="previewArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={newAeronave.smokeColor || '#ff0000'} stopOpacity="0.4" />
                          <stop offset="100%" stopColor={newAeronave.smokeColor2 || newAeronave.smokeColor || '#ff0000'} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="previewLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={newAeronave.lineColor2 || newAeronave.lineColor || '#ff0000'} />
                          <stop offset="100%" stopColor={newAeronave.lineColor || '#ff0000'} />
                        </linearGradient>
                        <filter id="neonGlowPreview" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {previewMode === 'air' ? (
                        <>
                          <g filter="url(#neonGlowPreview)">
                            <path
                              d="M 160 500 C 505 500, 712 444, 850 220"
                              fill="none"
                              stroke="url(#previewLine)"
                              strokeWidth="14"
                              strokeLinecap="round"
                              strokeOpacity="0.9"
                            />
                          </g>
                          <path
                            d="M 160 500 C 505 500, 712 444, 850 220 L 850 500 Z"
                            fill="url(#previewArea)"
                            filter="url(#neonGlowPreview)"
                            opacity="0.8"
                          />
                        </>
                      ) : (
                        <ellipse cx={150} cy={525} rx={50} ry={8} fill="rgba(0,0,0,0.4)" filter="blur(6px)" />
                      )}
                      
                      {/* PLANE GROUP */}
                      <g transform={previewMode === 'air' ? "translate(850, 220) rotate(-18) scale(1.6)" : "translate(160, 500) rotate(0) scale(1.6)"}>
                        {previewMode === 'air' && (
                          <g className="animate-pulse">
                            <path d="M-80,-7 C-130,-16 -160,0 -185,0 C-160,5 -130,16 -80,7 Z" fill="url(#previewFire)" opacity="0.9" />
                            <path d="M-80,-3.5 Q-115,-0.5 -135,-0.5 Q-115,-0.5 -80,3.5 Z" fill="#ffffff" opacity="1" />
                            <rect x="-83" y="-8.5" width="8" height="17" rx="2" fill="#2d2d30" stroke="#0c0c0e" strokeWidth="0.5" />
                          </g>
                        )}
                        
                        {/* Custom Offset Group */}
                        <g transform={`translate(-10, -5) scale(${previewMode === 'air' ? (newAeronave.scale ?? 1.1) : (newAeronave.scaleStart ?? newAeronave.scale ?? 1.1)}) rotate(${previewMode === 'air' ? (newAeronave.rotation ?? 12) : (newAeronave.rotationStart ?? newAeronave.rotation ?? 12)})`}>
                          <image
                            href={newAeronave.imageBase64 || '/images/skin_fenix.png'}
                            x={previewMode === 'air' ? (newAeronave.offsetX ?? -90) : (newAeronave.offsetXStart ?? newAeronave.offsetX ?? -90)}
                            y={previewMode === 'air' ? (newAeronave.offsetY ?? -90) : (newAeronave.offsetYStart ?? newAeronave.offsetY ?? -90)}
                            width="180"
                            height="180"
                            style={{
                              mixBlendMode: 'screen',
                              filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.9))',
                              transform: newAeronave.flipX ? 'scaleX(-1)' : 'none',
                              transformOrigin: 'center'
                            }}
                          />
                        </g>
                      </g>
                    </svg>
                  </div>
                </div>

                {/* SLIDERS DE COMPENSAÇÃO DIMENSIONAL */}
                <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-5">
                  <h4 className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest pl-2 border-l-2 border-[#f59e0b]">
                    Sliders de Calibração: {previewMode === 'air' ? 'Estado de Voo' : 'Estado na Pista'}
                  </h4>
                  
                  <div className="space-y-2">
                    {/* OffsetX */}
                    <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5 transition-all">
                       <button onClick={() => setExpandedControl(expandedControl === 'offsetX' ? null : 'offsetX')} className="w-full flex items-center justify-between p-3 md:p-4 text-left hover:bg-white/5 transition-colors">
                         <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-white/60 uppercase">OffsetX (Horizontal)</span>
                           <span className="font-mono text-[#34b1e2] text-xs bg-[#34b1e2]/10 px-1.5 py-0.5 rounded">{previewMode === 'air' ? (newAeronave.offsetX ?? 0) : (newAeronave.offsetXStart ?? newAeronave.offsetX ?? 0)}</span>
                         </div>
                         <svg className={`w-4 h-4 text-white/40 transition-transform ${expandedControl === 'offsetX' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                       </button>
                       {expandedControl === 'offsetX' && (
                         <div className="p-3 md:p-4 pt-2 border-t border-white/5 bg-black/40">
                           <div className="flex items-center gap-3">
                             <button onClick={() => previewMode === 'air' ? setNewAeronave({...newAeronave, offsetX: (newAeronave.offsetX ?? -90) - 1}) : setNewAeronave({...newAeronave, offsetXStart: (newAeronave.offsetXStart ?? newAeronave.offsetX ?? -90) - 1})} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg active:bg-white/20 text-white/50 hover:text-white">-</button>
                             <input type="range" min="-200" max="200" step="1" value={previewMode === 'air' ? (newAeronave.offsetX ?? -90) : (newAeronave.offsetXStart ?? newAeronave.offsetX ?? -90)} onChange={e => previewMode === 'air' ? setNewAeronave({...newAeronave, offsetX: parseFloat(e.target.value)}) : setNewAeronave({...newAeronave, offsetXStart: parseFloat(e.target.value)})} className="flex-1 accent-[#34b1e2] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                             <button onClick={() => previewMode === 'air' ? setNewAeronave({...newAeronave, offsetX: (newAeronave.offsetX ?? -90) + 1}) : setNewAeronave({...newAeronave, offsetXStart: (newAeronave.offsetXStart ?? newAeronave.offsetX ?? -90) + 1})} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg active:bg-white/20 text-white/50 hover:text-white">+</button>
                           </div>
                         </div>
                       )}
                    </div>
                    
                    {/* OffsetY */}
                    <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5 transition-all">
                       <button onClick={() => setExpandedControl(expandedControl === 'offsetY' ? null : 'offsetY')} className="w-full flex items-center justify-between p-3 md:p-4 text-left hover:bg-white/5 transition-colors">
                         <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-white/60 uppercase">OffsetY (Vertical)</span>
                           <span className="font-mono text-[#34b1e2] text-xs bg-[#34b1e2]/10 px-1.5 py-0.5 rounded">{previewMode === 'air' ? (newAeronave.offsetY ?? 0) : (newAeronave.offsetYStart ?? newAeronave.offsetY ?? 0)}</span>
                         </div>
                         <svg className={`w-4 h-4 text-white/40 transition-transform ${expandedControl === 'offsetY' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                       </button>
                       {expandedControl === 'offsetY' && (
                         <div className="p-3 md:p-4 pt-2 border-t border-white/5 bg-black/40">
                           <div className="flex items-center gap-3">
                             <button onClick={() => previewMode === 'air' ? setNewAeronave({...newAeronave, offsetY: (newAeronave.offsetY ?? -90) - 1}) : setNewAeronave({...newAeronave, offsetYStart: (newAeronave.offsetYStart ?? newAeronave.offsetY ?? -90) - 1})} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg active:bg-white/20 text-white/50 hover:text-white">-</button>
                             <input type="range" min="-200" max="200" step="1" value={previewMode === 'air' ? (newAeronave.offsetY ?? -90) : (newAeronave.offsetYStart ?? newAeronave.offsetY ?? -90)} onChange={e => previewMode === 'air' ? setNewAeronave({...newAeronave, offsetY: parseFloat(e.target.value)}) : setNewAeronave({...newAeronave, offsetYStart: parseFloat(e.target.value)})} className="flex-1 accent-[#34b1e2] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                             <button onClick={() => previewMode === 'air' ? setNewAeronave({...newAeronave, offsetY: (newAeronave.offsetY ?? -90) + 1}) : setNewAeronave({...newAeronave, offsetYStart: (newAeronave.offsetYStart ?? newAeronave.offsetY ?? -90) + 1})} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg active:bg-white/20 text-white/50 hover:text-white">+</button>
                           </div>
                         </div>
                       )}
                    </div>

                    {/* Scale */}
                    <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5 transition-all">
                       <button onClick={() => setExpandedControl(expandedControl === 'scale' ? null : 'scale')} className="w-full flex items-center justify-between p-3 md:p-4 text-left hover:bg-white/5 transition-colors">
                         <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-white/60 uppercase">Scale (Tamanho)</span>
                           <span className="font-mono text-[#34b1e2] text-xs bg-[#34b1e2]/10 px-1.5 py-0.5 rounded">{previewMode === 'air' ? (newAeronave.scale ?? 1.1).toFixed(2) : (newAeronave.scaleStart ?? newAeronave.scale ?? 1.1).toFixed(2)}x</span>
                         </div>
                         <svg className={`w-4 h-4 text-white/40 transition-transform ${expandedControl === 'scale' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                       </button>
                       {expandedControl === 'scale' && (
                         <div className="p-3 md:p-4 pt-2 border-t border-white/5 bg-black/40">
                           <div className="flex items-center gap-3">
                             <button onClick={() => previewMode === 'air' ? setNewAeronave({...newAeronave, scale: Math.max(0.1, (newAeronave.scale ?? 1.1) - 0.05)}) : setNewAeronave({...newAeronave, scaleStart: Math.max(0.1, (newAeronave.scaleStart ?? newAeronave.scale ?? 1.1) - 0.05)})} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg active:bg-white/20 text-white/50 hover:text-white">-</button>
                             <input type="range" min="0.1" max="4.0" step="0.05" value={previewMode === 'air' ? (newAeronave.scale ?? 1.1) : (newAeronave.scaleStart ?? newAeronave.scale ?? 1.1)} onChange={e => previewMode === 'air' ? setNewAeronave({...newAeronave, scale: parseFloat(e.target.value)}) : setNewAeronave({...newAeronave, scaleStart: parseFloat(e.target.value)})} className="flex-1 accent-[#34b1e2] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                             <button onClick={() => previewMode === 'air' ? setNewAeronave({...newAeronave, scale: (newAeronave.scale ?? 1.1) + 0.05}) : setNewAeronave({...newAeronave, scaleStart: (newAeronave.scaleStart ?? newAeronave.scale ?? 1.1) + 0.05})} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg active:bg-white/20 text-white/50 hover:text-white">+</button>
                           </div>
                         </div>
                       )}
                    </div>

                    {/* Rotation */}
                    <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5 transition-all">
                       <button onClick={() => setExpandedControl(expandedControl === 'rotation' ? null : 'rotation')} className="w-full flex items-center justify-between p-3 md:p-4 text-left hover:bg-white/5 transition-colors">
                         <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-white/60 uppercase">Rotation (Ângulo)</span>
                           <span className="font-mono text-[#34b1e2] text-xs bg-[#34b1e2]/10 px-1.5 py-0.5 rounded">{previewMode === 'air' ? (newAeronave.rotation ?? 0) : (newAeronave.rotationStart ?? newAeronave.rotation ?? 0)}°</span>
                         </div>
                         <svg className={`w-4 h-4 text-white/40 transition-transform ${expandedControl === 'rotation' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                       </button>
                       {expandedControl === 'rotation' && (
                         <div className="p-3 md:p-4 pt-2 border-t border-white/5 bg-black/40">
                           <div className="flex items-center gap-3">
                             <button onClick={() => previewMode === 'air' ? setNewAeronave({...newAeronave, rotation: (newAeronave.rotation ?? 12) - 1}) : setNewAeronave({...newAeronave, rotationStart: (newAeronave.rotationStart ?? newAeronave.rotation ?? 12) - 1})} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg active:bg-white/20 text-white/50 hover:text-white">-</button>
                             <input type="range" min="-180" max="180" step="1" value={previewMode === 'air' ? (newAeronave.rotation ?? 12) : (newAeronave.rotationStart ?? newAeronave.rotation ?? 12)} onChange={e => previewMode === 'air' ? setNewAeronave({...newAeronave, rotation: parseFloat(e.target.value)}) : setNewAeronave({...newAeronave, rotationStart: parseFloat(e.target.value)})} className="flex-1 accent-[#34b1e2] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                             <button onClick={() => previewMode === 'air' ? setNewAeronave({...newAeronave, rotation: (newAeronave.rotation ?? 12) + 1}) : setNewAeronave({...newAeronave, rotationStart: (newAeronave.rotationStart ?? newAeronave.rotation ?? 12) + 1})} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg active:bg-white/20 text-white/50 hover:text-white">+</button>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <button onClick={handleSaveAeronave} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-5 px-8 rounded-2xl font-black uppercase text-sm tracking-widest hover:brightness-110 shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-[30deg] translate-x-[-200%] hover:animate-[shine_1s_ease-in-out_infinite]" />
                  <span>Publicar Aeronave na Loja Oficial</span> 🚀
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FROTA CADASTRADA */}
        <div className="bg-[#111214] rounded-[2rem] border border-white/5 shadow-xl p-8 md:p-10 mb-24">
           <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
             <span className="text-sky-400">📊</span> Frota Comercial Ativa (Loja e Drops)
           </h3>

           <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {aeronaves.map(sk => {
                const active = sk.isActive !== false;
                return (
                <div key={sk.id} className={`group bg-black/60 rounded-2xl border border-white/10 overflow-hidden flex flex-col transition-all hover:bg-black hover:border-white/20 hover:shadow-2xl hover:scale-[1.02] ${!active ? 'opacity-40 grayscale' : ''}`}>
                   
                   <div className="h-32 relative flex items-center justify-center bg-gradient-to-br from-black to-[#0a0a0c] pt-4">
                     <div 
                        className="absolute inset-x-0 bottom-0 h-24 blur-2xl opacity-40 mix-blend-screen transition-opacity group-hover:opacity-60"
                        style={{ background: `radial-gradient(ellipse at bottom, ${sk.smokeColor || '#34b1e2'} 0%, transparent 80%)` }}
                     />
                     <img src={sk.imageBase64} className="w-24 h-24 object-contain mix-blend-screen relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform group-hover:scale-110" style={{ transform: sk.flipX ? 'scaleX(-1)' : 'none' }} alt={sk.name}/>
                     
                     <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-md">
                        <span className="text-[9px] font-black uppercase text-white/60">{sk.category === 'skin' ? 'Aeronave' : 'Item'}</span>
                     </div>
                     {!active && <div className="absolute top-3 right-3 bg-red-500/20 px-2 py-1 rounded-md border border-red-500/30"><span className="text-[9px] font-black uppercase text-red-500">Inativa</span></div>}
                   </div>

                   <div className="p-5 flex flex-col flex-1 border-t border-white/5">
                     <span className="text-sm font-black text-white tracking-widest uppercase truncate">{sk.name}</span>
                     <span className="text-[10px] text-white/50 mt-1 uppercase font-bold">{sk.priceType === 'co' ? 'AeroCoins' : 'RealCash'}: <span className={sk.priceType === 'co' ? 'text-sky-400' : 'text-green-400'}>{sk.price}</span></span>
                     
                     <div className="flex w-full gap-2 mt-5">
                       <button
                         onClick={() => { setNewAeronave(sk); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                         className="flex-1 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                       >
                         Editar Layout
                       </button>
                       <button
                         onClick={() => { toggleCustomSkinActive(sk.id, sk); refreshAeronaves(); }}
                         className={`w-12 flex items-center justify-center rounded-xl border transition-all ${active ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           {active ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                           ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                           )}
                         </svg>
                       </button>
                     </div>
                   </div>
                </div>
                );
              })}
              {aeronaves.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                   <span className="text-4xl mb-3">🛠️</span>
                   <span className="text-xs font-bold uppercase text-white/30 tracking-widest">Nenhuma aeronave comercializada</span>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
