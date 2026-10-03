import React, { useState, useRef } from 'react';
import { LandingConfig, DEFAULT_LANDING_CONFIG, saveLandingConfig, useLandingConfig } from '../../src/utils/landingConfig';

interface LandingAdminProps {
  onPreviewLanding?: () => void;
}

export const LandingAdmin: React.FC<LandingAdminProps> = ({ onPreviewLanding }) => {
  const { config, setConfig, isLoading } = useLandingConfig();
  const [formData, setFormData] = useState<LandingConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync formData whenever remote config changes if not dirty
  React.useEffect(() => {
    setFormData(config);
  }, [config]);

  // Image File Inputs
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const aerobetFileInputRef = useRef<HTMLInputElement>(null);
  const aerofantasyFileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const hangarFileInputRef = useRef<HTMLInputElement>(null);

  // Image resizing helper via Canvas
  const processImageFile = (
    file: File,
    maxDimension: number,
    quality: number,
    onSuccess: (base64: string) => void
  ) => {
    if (file.size > 8 * 1024 * 1024) {
      alert('O arquivo selecionado é muito grande. Escolha uma imagem de até 8MB.');
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
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const base64 = canvas.toDataURL(mime, quality);
        onSuccess(base64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    const success = await saveLandingConfig(formData);
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setConfig(formData);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setErrorMessage('Erro ao salvar no banco de dados. As alterações foram salvas localmente.');
    }
  };

  const handleResetAll = () => {
    if (window.confirm('Tem certeza de que deseja restaurar todas as imagens e fundo da Landing Page para os padrões de fábrica?')) {
      setFormData({ ...DEFAULT_LANDING_CONFIG });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <h3 className="text-lg font-black italic uppercase tracking-wider text-white">
              Personalização da Landing Page
            </h3>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Altere a imagem de fundo principal da landing page e substitua as fotos de capa dos modos AeroGame e AeroFantasy por upload direto do seu dispositivo ou link.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onPreviewLanding && (
            <button
              onClick={onPreviewLanding}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>👁️</span>
              <span>Ver Landing Page</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#e51a31] to-red-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(229,26,49,0.4)] transition-all cursor-pointer flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-bold animate-in slide-in-from-top-2 duration-200">
          <span className="text-base">✅</span>
          <span>Alterações da Landing Page salvas com sucesso no banco de dados e sincronizadas em tempo real!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-400 text-xs font-bold">
          <span className="text-base">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 1: FUNDO DA LANDING PAGE */}
      {/* ============================================================== */}
      <div className="bg-[#1b1c1d] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
              🖼️
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white">
                Fundo Geral da Landing Page
              </h4>
              <p className="text-[11px] text-white/50">
                Imagem panorâmica exibida como plano de fundo completo na tela de entrada/boas-vindas.
              </p>
            </div>
          </div>

          {formData.backgroundImage && (
            <button
              onClick={() => setFormData(prev => ({ ...prev, backgroundImage: '' }))}
              className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase cursor-pointer"
            >
              Remover Fundo (Usar Padrão Escuro)
            </button>
          )}
        </div>

        {/* Live Preview Box */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 h-52 sm:h-64 flex items-center justify-center bg-black/60">
          {formData.backgroundImage ? (
            <>
              <img
                src={formData.backgroundImage}
                alt="Preview Fundo"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  filter: `blur(${formData.backgroundBlur}px)`,
                  transform: formData.backgroundBlur > 0 ? 'scale(1.05)' : 'none'
                }}
              />
              <div
                className="absolute inset-0 bg-[#09090b]"
                style={{ opacity: formData.backgroundOpacity }}
              />
              <div className="relative z-10 text-center px-4">
                <span className="bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white border border-white/20">
                  Preview do Fundo Ativo
                </span>
                <p className="text-[11px] text-white/70 font-medium mt-2 max-w-sm drop-shadow">
                  A opacidade do filtro escuro ({Math.round(formData.backgroundOpacity * 100)}%) garante excelente legibilidade aos textos e cartões.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center p-6 space-y-2 text-white/40">
              <span className="text-3xl block">🌌</span>
              <p className="text-xs font-bold uppercase tracking-wider">Nenhuma Imagem de Fundo Configurada</p>
              <p className="text-[11px] text-white/30 max-w-sm">
                Atualmente a landing page utiliza o fundo escuro espacial original com gradientes e ambient lighting.
              </p>
            </div>
          )}
        </div>

        {/* Upload & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* File Upload Button */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">
              Fazer Upload de Imagem do Dispositivo
            </label>
            <input
              type="file"
              ref={bgFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  processImageFile(file, 1600, 0.82, (base64) => {
                    setFormData(prev => ({ ...prev, backgroundImage: base64 }));
                  });
                }
              }}
            />
            <button
              onClick={() => bgFileInputRef.current?.click()}
              className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 active:scale-[0.99] border border-dashed border-white/20 hover:border-red-500 rounded-2xl text-xs font-black uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">📁</span>
              <span>Escolher Arquivo do Computador / Celular</span>
            </button>
            <span className="text-[10px] text-white/40 block">Formatos aceitos: JPG, PNG, WEBP (Otimizado automaticamente).</span>
          </div>

          {/* Or Image URL */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">
              Ou Informar URL Externa da Imagem
            </label>
            <input
              type="text"
              value={formData.backgroundImage?.startsWith('data:') ? '' : formData.backgroundImage}
              onChange={(e) => setFormData(prev => ({ ...prev, backgroundImage: e.target.value }))}
              placeholder="https://exemplo.com/fundo-aero.jpg"
              className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/20 outline-none focus:border-red-500 font-mono transition-colors"
            />
            <span className="text-[10px] text-white/40 block">Insira um link direto de imagem HTTPS hospedada na web.</span>
          </div>
        </div>

        {/* Sliders for Opacity and Blur */}
        {formData.backgroundImage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5 animate-in fade-in duration-200">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                  Escurecimento do Fundo (Overlay)
                </label>
                <span className="text-xs font-black text-red-400 font-mono">
                  {Math.round(formData.backgroundOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={formData.backgroundOpacity}
                onChange={(e) => setFormData(prev => ({ ...prev, backgroundOpacity: parseFloat(e.target.value) }))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <span className="text-[10px] text-white/40 block mt-1">Quanto maior o valor, mais escuro o fundo fica para destacar os cartões de modo.</span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                  Desfoque do Fundo (Blur)
                </label>
                <span className="text-xs font-black text-red-400 font-mono">
                  {formData.backgroundBlur}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={formData.backgroundBlur}
                onChange={(e) => setFormData(prev => ({ ...prev, backgroundBlur: parseInt(e.target.value) }))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <span className="text-[10px] text-white/40 block mt-1">Aplica efeito de profundidade de campo suave à imagem de fundo.</span>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SECTION 2: IMAGENS DOS CARDS DE MODO */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CARD AEROGAME (CRASH) */}
        <div className="bg-[#1b1c1d] border border-red-500/20 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚀</span>
                <h4 className="text-sm font-black uppercase tracking-wider text-red-400">
                  Card Modo AeroGame (Crash)
                </h4>
              </div>
              <button
                onClick={() => setFormData(prev => ({ ...prev, aerobetImage: DEFAULT_LANDING_CONFIG.aerobetImage }))}
                className="text-[10px] font-bold text-white/40 hover:text-white uppercase transition-colors cursor-pointer"
              >
                Restaurar Padrão
              </button>
            </div>

            {/* Preview Image */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 h-44 sm:h-52 bg-black mb-4">
              <img
                src={formData.aerobetImage || DEFAULT_LANDING_CONFIG.aerobetImage}
                alt="Modo AeroGame"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow">
                AeroGame Crash
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <span className="text-[10px] text-white/80 font-bold block drop-shadow">Imagem Atual do Card</span>
              </div>
            </div>

            {/* Upload & URL */}
            <div className="space-y-3">
              <input
                type="file"
                ref={aerobetFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    processImageFile(file, 900, 0.85, (base64) => {
                      setFormData(prev => ({ ...prev, aerobetImage: base64 }));
                    });
                  }
                }}
              />
              <button
                onClick={() => aerobetFileInputRef.current?.click()}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 active:scale-[0.99] border border-dashed border-red-500/30 hover:border-red-500 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📷</span>
                <span>Fazer Upload de Nova Imagem do AeroGame</span>
              </button>

              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block mb-1">
                  Ou URL da Imagem
                </label>
                <input
                  type="text"
                  value={formData.aerobetImage?.startsWith('data:') ? '' : formData.aerobetImage}
                  onChange={(e) => setFormData(prev => ({ ...prev, aerobetImage: e.target.value }))}
                  placeholder="URL direta da foto do modo crash..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-red-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD AEROFANTASY (LIGAS & TORNEIOS) */}
        <div className="bg-[#1b1c1d] border border-sky-500/20 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <h4 className="text-sm font-black uppercase tracking-wider text-sky-400">
                  Card Modo AeroFantasy (Ligas)
                </h4>
              </div>
              <button
                onClick={() => setFormData(prev => ({ ...prev, aerofantasyImage: DEFAULT_LANDING_CONFIG.aerofantasyImage }))}
                className="text-[10px] font-bold text-white/40 hover:text-white uppercase transition-colors cursor-pointer"
              >
                Restaurar Padrão
              </button>
            </div>

            {/* Preview Image */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 h-44 sm:h-52 bg-black mb-4">
              <img
                src={formData.aerofantasyImage || DEFAULT_LANDING_CONFIG.aerofantasyImage}
                alt="Modo AeroFantasy"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-sky-600/90 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow">
                AeroFantasy Ligas
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <span className="text-[10px] text-white/80 font-bold block drop-shadow">Imagem Atual do Card</span>
              </div>
            </div>

            {/* Upload & URL */}
            <div className="space-y-3">
              <input
                type="file"
                ref={aerofantasyFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    processImageFile(file, 900, 0.85, (base64) => {
                      setFormData(prev => ({ ...prev, aerofantasyImage: base64 }));
                    });
                  }
                }}
              />
              <button
                onClick={() => aerofantasyFileInputRef.current?.click()}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 active:scale-[0.99] border border-dashed border-sky-500/30 hover:border-sky-500 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📷</span>
                <span>Fazer Upload de Nova Imagem do AeroFantasy</span>
              </button>

              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block mb-1">
                  Ou URL da Imagem
                </label>
                <input
                  type="text"
                  value={formData.aerofantasyImage?.startsWith('data:') ? '' : formData.aerofantasyImage}
                  onChange={(e) => setFormData(prev => ({ ...prev, aerofantasyImage: e.target.value }))}
                  placeholder="URL direta da foto de ligas/troféu..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* SECTION 3: HERO BANNER & RODAPÉ */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* HERO BANNER SECTION */}
        <div className="bg-[#1b1c1d] border border-white/5 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>✨</span>
              <span>Banner do Topo (Hero Section)</span>
            </h4>
            {formData.heroBannerImage && (
              <button
                onClick={() => setFormData(prev => ({ ...prev, heroBannerImage: '' }))}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase transition-colors cursor-pointer"
              >
                Remover
              </button>
            )}
          </div>

          <p className="text-[11px] text-white/50">
            Adicione uma imagem de fundo para o cabeçalho de boas-vindas da landing page ("Escolha seu Modo de Jogo").
          </p>

          {formData.heroBannerImage ? (
            <div className="relative rounded-2xl overflow-hidden h-32 border border-white/10">
              <img
                src={formData.heroBannerImage}
                alt="Hero Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black/60 px-3 py-1 rounded-full border border-white/20">
                  Banner do Topo Configurado
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 h-24 flex items-center justify-center text-[11px] text-white/40">
              Usando gradiente nativo escuro com glow vermelho e azul
            </div>
          )}

          <input
            type="file"
            ref={heroFileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                processImageFile(file, 1400, 0.82, (base64) => {
                  setFormData(prev => ({ ...prev, heroBannerImage: base64 }));
                });
              }
            }}
          />
          <button
            onClick={() => heroFileInputRef.current?.click()}
            className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>📁</span>
            <span>Upload de Imagem para o Topo</span>
          </button>
        </div>

        {/* HANGAR BANNER SECTION */}
        <div className="bg-[#1b1c1d] border border-white/5 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>🛸</span>
              <span>Banner do Rodapé (Hangar & Loja)</span>
            </h4>
            {formData.hangarBannerImage && (
              <button
                onClick={() => setFormData(prev => ({ ...prev, hangarBannerImage: '' }))}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase transition-colors cursor-pointer"
              >
                Remover
              </button>
            )}
          </div>

          <p className="text-[11px] text-white/50">
            Adicione uma imagem de fundo estilizada para a barra inferior de aeronaves da frota e loja de skins.
          </p>

          {formData.hangarBannerImage ? (
            <div className="relative rounded-2xl overflow-hidden h-32 border border-white/10">
              <img
                src={formData.hangarBannerImage}
                alt="Hangar Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black/60 px-3 py-1 rounded-full border border-white/20">
                  Banner do Rodapé Configurado
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 h-24 flex items-center justify-center text-[11px] text-white/40">
              Usando estilo escuro com botão para o Hangar e Loja
            </div>
          )}

          <input
            type="file"
            ref={hangarFileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                processImageFile(file, 1400, 0.82, (base64) => {
                  setFormData(prev => ({ ...prev, hangarBannerImage: base64 }));
                });
              }
            }}
          />
          <button
            onClick={() => hangarFileInputRef.current?.click()}
            className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>📁</span>
            <span>Upload de Imagem para o Rodapé</span>
          </button>
        </div>

      </div>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handleResetAll}
          className="text-xs font-bold text-white/40 hover:text-red-400 transition-colors uppercase cursor-pointer"
        >
          Restaurar Todas as Imagens Padrão
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onPreviewLanding && (
            <button
              onClick={onPreviewLanding}
              className="flex-1 sm:flex-none px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Visualizar Landing
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-8 py-3.5 bg-gradient-to-r from-[#e51a31] to-red-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(229,26,49,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando no Banco...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Salvar e Publicar no Site</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingAdmin;
