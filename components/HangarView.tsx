import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { getCustomSkins, getCustomSkinImage } from '../src/utils/customSkins';

interface SkinItem {
  id: string;
  name: string;
  description: string;
  previewColorGradient: string;
  bgColor: string;
  badge?: string;
  specs: string[];
}

const AVAILABLE_SKINS: SkinItem[] = [
  {
    id: 'fenix',
    name: 'Fênix Rubra',
    description: 'O caça lendário padrão, forjado com titânio aeroespacial e neon vermelho flamejante.',
    previewColorGradient: 'from-[#ff2d55] to-[#8b0010]',
    bgColor: 'bg-red-500/10 border-red-500/20',
    specs: ['Chassis Titânio', 'Neon Turbilhonante', 'Clássico Flamengo']
  },
  {
    id: 'silver',
    name: 'Tempestade de Prata',
    description: 'Chassi polido em cromo glacial com propulsores de plasma e neon azul criogênico de alta altitude.',
    previewColorGradient: 'from-[#00f2fe] to-[#4facfe]',
    bgColor: 'bg-sky-500/10 border-sky-500/20',
    specs: ['Cromo Glacial', 'Plasma Azul', 'Propulsão Ionizada']
  },
  {
    id: 'purple',
    name: 'Nebulosa Roxa',
    description: 'Visual cósmico ionizado de alta frequência com rastro gravitacional em violeta profundo galáctico.',
    previewColorGradient: 'from-[#f107a3] to-[#7b2ff7]',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    specs: ['Matriz Cósmica', 'Anti-G Violeta', 'Sombra de Nebulosa']
  },
  {
    id: 'gold',
    name: 'Áureo Imperial',
    description: 'Fuselagem exclusiva de gala revestida a ouro 24 quilates polido com acabamento interno em fibra de carbono.',
    previewColorGradient: 'from-[#ffe259] to-[#ffa751]',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    specs: ['Banho Ouro 24K', 'Fibra Carbono', 'Realeza Aero']
  },
  {
    id: 'green',
    name: 'Quasar Ácido',
    description: 'Camuflagem militar de alta visibilidade tática carregada de energia radioativa pulsante.',
    previewColorGradient: 'from-[#00ff87] to-[#60efff]',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    specs: ['Tático Radioativo', 'Neon Fluorescente', 'Blindagem Reforçada']
  },
  {
    id: 'dark',
    name: 'Sombra de Elite',
    description: 'Chassi invisível em fibra de carbono fosca preta com frisos fluorescentes vermelhos de combate esportivo.',
    previewColorGradient: 'from-[#141416] to-[#ff2d55]',
    bgColor: 'bg-zinc-800/20 border-zinc-700/30',
    specs: ['Ocultação Stealth', 'Preto Fosco Carbono', 'Chassis Ultraleve']
  },
  {
    id: 'soberano',
    name: 'Soberano Dourado',
    description: 'O caça lendário mais cobiçado da galáxia. Fuselagem de titânio negro realçado com rastro de poeira estelar de ouro puro.',
    previewColorGradient: 'from-[#ffe45c] via-[#dca817] to-[#111018]',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    specs: ['Banhado a Ouro Real', 'Propulsão Stardust', 'Cristais de Energia']
  },
  {
    id: 'aerobrasil',
    name: 'AeroBrasil',
    description: 'Chassi do patriota espacial. Aerodinâmica pintada com as cores nacionais e o tradicional brasão de estrelas do Brasil.',
    previewColorGradient: 'from-[#009b3a] via-[#fdf11e] to-[#002776]',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    specs: ['Pintura Brasílis', 'Poeira de Estrelas BR', 'Turbo Canarinho']
  }
];

interface HangarViewProps {
  unlockedSkins: string[];
  activeSkin: string;
  onChangeSkin: (skinId: string) => void;
  onNavigateToStore: () => void;
  onClose: () => void;
}

const HangarView: React.FC<HangarViewProps> = ({
  unlockedSkins,
  activeSkin,
  onChangeSkin,
  onNavigateToStore,
  onClose
}) => {
  const [activeParticles, setActiveParticles] = React.useState<{ id: number; x: number; y: number; color: string; size: number; delay: number }[]>([]);
  const [isEquippedFlashing, setIsEquippedFlashing] = React.useState(false);

  const getSkinColor = (skinId: string) => {
    switch (skinId) {
      case 'fenix': return '#ff2d55';
      case 'silver': return '#00f2fe';
      case 'purple': return '#7b2ff7';
      case 'gold': return '#ffe259';
      case 'green': return '#00ff87';
      case 'dark': return '#ff2d55';
      case 'soberano': return '#ffe45c';
      case 'aerobrasil': return '#009b3a';
      default: return '#f59e0b';
    }
  };

  const triggerBurst = (skinId: string) => {
    setIsEquippedFlashing(true);
    setTimeout(() => setIsEquippedFlashing(false), 600);

    const themeColor = getSkinColor(skinId);
    
    const newParticles = Array.from({ length: 32 }).map((_, i) => {
      const angle = (i / 32) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const distance = 70 + Math.random() * 110;
      return {
        id: Date.now() + i + Math.random(),
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: themeColor,
        size: 3 + Math.random() * 5,
        delay: Math.random() * 0.12
      };
    });

    setActiveParticles(newParticles);
  };

  const handleEquipSkin = (skinId: string) => {
    onChangeSkin(skinId);
    triggerBurst(skinId);
  };

  const allSkins = useMemo(() => {
    return [...AVAILABLE_SKINS, ...getCustomSkins()];
  }, []);

  const currentSkinItem = allSkins.find(s => s.id === activeSkin) || allSkins[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0b0d] overflow-y-auto font-sans text-white p-4 md:p-6 select-none relative overflow-hidden">
      {/* Dynamic Scrolling Grid CSS & Floating Keyframes */}
      <style>{`
        @keyframes hangarGridScroll {
          0% { background-position: 0px 0px; }
          100% { background-position: 40px 40px; }
        }
        .hangar-grid {
          background-image: 
            linear-gradient(rgba(245, 158, 11, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245, 158, 11, 0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: hangarGridScroll 25s linear infinite;
        }
        @keyframes driftBlob1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes driftBlob2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-40px, 40px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-drift-1 {
          animation: driftBlob1 20s infinite ease-in-out;
        }
        .animate-drift-2 {
          animation: driftBlob2 18s infinite ease-in-out;
        }
      `}</style>

      {/* Floating Interactive Background Lights (Dynamic Skin Color Sync!) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Main dynamic neon mood light */}
        <div 
          className={`absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tr ${currentSkinItem.previewColorGradient} opacity-[0.12] blur-[140px] transition-all duration-1000 animate-drift-1`} 
        />
        {/* Secondary helper ambience light */}
        <div 
          className={`absolute -bottom-40 -right-20 w-[600px] h-[600px] rounded-full bg-gradient-to-br ${currentSkinItem.previewColorGradient} opacity-[0.08] blur-[160px] transition-all duration-1000 animate-drift-2`} 
        />
        {/* Hangar grid pattern */}
        <div className="absolute inset-0 hangar-grid opacity-60 mix-blend-screen" />
        
        {/* Ambient Dark Overhead Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0b0d]/80 via-transparent to-[#0a0b0d]" />
      </div>

      {/* Floating dust motes / glowing tech dots */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white opacity-25"
            style={{
              top: `${15 + i * 15}%`,
              left: `${10 + (i * 17) % 80}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 z-10 relative">
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white flex items-center gap-2 drop-shadow-md">
            🛸 Hangar de Caças
          </h2>
          <p className="text-[10px] md:text-xs text-white/50 font-black uppercase tracking-wider">
            Personalize o seu caça e decole com estilo na arena
          </p>
        </motion.div>
        
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onClose}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/75 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 active:scale-95 border border-white/5 backdrop-blur-md"
        >
          Voltar
        </motion.button>
      </div>

      {/* Main Container - Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-10 relative flex-1">
        
        {/* Left Side: Active skin Showcase Card */}
        <motion.div 
          id="hangar-view-active-skin-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: isEquippedFlashing ? [1, 1.04, 1] : 1,
            borderColor: isEquippedFlashing ? `rgba(245, 158, 11, 0.4)` : 'rgba(255, 255, 255, 0.05)',
            boxShadow: isEquippedFlashing 
              ? `0 0 35px ${getSkinColor(activeSkin)}33` 
              : `0 25px 50px -12px rgba(0,0,0,0.5)`,
          }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-5 bg-[#141518]/90 backdrop-blur-xl rounded-3xl p-5 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col gap-4 group"
        >
          {/* Subtle frame flare */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="text-[10px] font-black uppercase tracking-wider text-white/40 border-b border-white/5 pb-2 flex justify-between items-center">
            <span>Configuração Ativa do Caça</span>
            <span className="text-[#f59e0b] animate-pulse font-bold tracking-widest text-[9px]">ONLINE</span>
          </div>

          {/* Plane Preview Display & Hologram projection pad (Estilo 3D Premium) */}
          <div className="h-56 md:h-64 rounded-2xl bg-gradient-to-b from-[#0e1014] to-[#050608] relative overflow-hidden flex flex-col items-center justify-center p-4 shadow-2xl shadow-black/80 border border-white/5 group">
            {/* Rich background grid details */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px] opacity-40 pointer-events-none z-0" />
            
            {/* Ambient shadow gradient */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-0" />
            
            {/* Hologram Circle Pedestal Base */}
            <div className="absolute bottom-6 w-52 h-10 bg-black/50 border border-white/10 rounded-full flex items-center justify-center filter blur-[1px] transform rotateX(60deg) z-0 shadow-[0_0_20px_rgba(255,255,255,0.08)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-500">
              <div className="w-44 h-8 border-[3px] border-dashed border-white/10 rounded-full animate-[spin_20s_linear_infinite]" />
            </div>

            {/* Massive background glow matching skin */}
            <div className={`absolute w-56 h-56 rounded-full bg-gradient-to-br ${currentSkinItem.previewColorGradient} opacity-30 filter blur-3xl group-hover:opacity-40 animate-pulse transition-opacity duration-500 z-0`} />

            {/* Jet Floating over holographic projector pad */}
            <motion.div 
              key={activeSkin}
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ 
                y: [0, -12, 0],
                rotate: [0, 2, -2, 0],
                opacity: 1, 
                scale: 1 
              }}
              transition={{
                y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                rotate: { repeat: Infinity, duration: 5, ease: "easeInOut" },
                opacity: { duration: 0.4 },
                scale: { duration: 0.4 }
              }}
              className="z-20 filter relative w-full h-full flex items-center justify-center"
            >
              <img
                src={activeSkin.startsWith('custom_') ? (getCustomSkinImage(activeSkin) || '/images/skin_aerobrasil.png') : `/images/skin_${activeSkin}.png`}
                alt={currentSkinItem.name}
                referrerPolicy="no-referrer"
                className="w-40 h-40 md:w-52 md:h-52 object-contain mix-blend-screen filter drop-shadow-[0_15px_30px_rgba(0,0,0,1)] select-none pointer-events-none transform -rotate-12 group-hover:scale-110 transition-transform duration-500"
              />
            </motion.div>

            {/* Particle Burst System */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-visible">
              {activeParticles.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full shadow-[0_0_8px_currentColor]"
                  style={{
                    backgroundColor: p.color,
                    color: p.color,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: p.x,
                    y: p.y,
                    opacity: [1, 0.8, 0],
                    scale: [1, 1.6, 0.2]
                  }}
                  transition={{
                    duration: 0.9 + Math.random() * 0.3,
                    ease: "easeOut",
                    delay: p.delay
                  }}
                />
              ))}
            </div>

            {/* Pulsating status badge */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-[8px] font-black uppercase px-2.5 py-1 rounded-full border border-white/10 shadow-lg tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 relative" />
              Equipado no Simulador
            </div>
          </div>

          <div className="space-y-2 mt-1">
            <motion.h3 
              key={currentSkinItem.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-black italic uppercase tracking-tight text-white leading-none"
            >
              {currentSkinItem.name}
            </motion.h3>
            <p className="text-xs text-white/75 leading-relaxed font-semibold">
              {currentSkinItem.description}
            </p>
          </div>

          {/* Spec details */}
          <div className="border-t border-white/5 pt-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Especificações Técnicas</div>
            <div className="flex flex-wrap gap-2">
              {currentSkinItem.specs.map((spec, idx) => (
                <span key={idx} className="text-[9px] font-black uppercase tracking-wide px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-white/90">
                  ⚡ {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Action Equipar Visual Button with Theme-sensitive Explosion Trigger */}
          <motion.button
            id="btn-equip-visual-active-card"
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleEquipSkin(currentSkinItem.id)}
            className="w-full mt-2 py-3 px-4 rounded-xl font-black uppercase tracking-wider text-xs transition-all duration-300 flex items-center justify-center gap-2 border bg-[#141518] text-white shadow-xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-hover:border-white/20 select-none cursor-pointer"
            style={{
              borderColor: `${getSkinColor(currentSkinItem.id)}44`,
              boxShadow: `0 4px 15px ${getSkinColor(currentSkinItem.id)}15`,
              background: `linear-gradient(135deg, rgba(20,21,24,0.95), ${getSkinColor(currentSkinItem.id)}22)`
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: getSkinColor(currentSkinItem.id) }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: getSkinColor(currentSkinItem.id) }} />
            </span>
            <span>Equipar Visual ({currentSkinItem.name})</span>
          </motion.button>
        </motion.div>

        {/* Right Side: Grid of available plane list */}
        <div className="lg:col-span-7 space-y-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex justify-between items-center px-1"
          >
            <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Sua Coleção Adquirida</h4>
            <button 
              onClick={onNavigateToStore}
              className="text-xs font-black uppercase tracking-wide text-[#f59e0b] hover:underline flex items-center gap-1 active:scale-95 transition-transform"
            >
              🚀 Ir para a Loja comprar Skins
            </button>
          </motion.div>

          {/* Skin items container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allSkins.filter((skin) => unlockedSkins.includes(skin.id)).map((skin, ind) => {
              const isActive = activeSkin === skin.id;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + (ind * 0.05) }}
                  key={skin.id}
                  onClick={() => handleEquipSkin(skin.id)}
                  className={`rounded-2xl border p-3 flex items-center gap-3 transition-all duration-300 relative group select-none ${
                    isActive
                      ? 'bg-[#1e1c14]/90 border-[#f59e0b] shadow-[0_8px_25px_rgba(245,158,11,0.12)]'
                      : 'bg-[#141518]/80 border-white/5 hover:border-white/20 hover:bg-[#18191c]/90 cursor-pointer'
                  }`}
                >
                  {/* Miniature skin render circle */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${skin.previewColorGradient} flex items-center justify-center p-1.5 flex-shrink-0 shadow-lg border border-white/5 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    <img
                      src={`/images/skin_${skin.id}.png`}
                      alt={skin.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain mix-blend-screen drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 select-none pointer-events-none"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black uppercase tracking-tight text-white truncate leading-none">
                        {skin.name}
                      </h4>
                    </div>
                    
                    <p className="text-[10px] text-white/40 mt-1 truncate">
                      Disponível no Hangar
                    </p>
                  </div>

                  {/* Right hand state indicator */}
                  <div className="flex-shrink-0">
                    {isActive ? (
                      <span className="bg-[#f59e0b] text-black text-[7.5px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                        ATIVO
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-md group-hover:bg-emerald-500 group-hover:text-black transition-colors duration-200">
                        EQUIPAR
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HangarView;
