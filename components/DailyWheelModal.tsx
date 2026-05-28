
import React, { useState, useEffect, useRef } from 'react';
import { WheelPrize } from '../types';
import { sounds } from '../utils/sounds';

interface DailyWheelModalProps {
  onClose: () => void;
  onClaimPrize: (type: 'balance' | 'flight', amount: number) => void;
  lastSpinTime: number;
  lastDepositTime: number;
  onOpenWallet: () => void;
  prizes: WheelPrize[];
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

// Particles Component
const ConfettiExplosion = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {Array.from({ length: 50 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-confetti"
                    style={{
                        left: '50%',
                        top: '50%',
                        backgroundColor: ['#e51a31', '#ffd700', '#28a745', '#34b1e2', '#ffffff'][i % 5],
                        '--x': `${(Math.random() - 0.5) * 600}px`,
                        '--y': `${(Math.random() - 0.5) * 600}px`,
                        animationDelay: `${Math.random() * 0.2}s`,
                        animationDuration: `${0.8 + Math.random()}s`
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
};

const DailyWheelModal: React.FC<DailyWheelModalProps> = ({ 
    onClose, 
    onClaimPrize, 
    lastSpinTime, 
    lastDepositTime,
    onOpenWallet,
    prizes
}) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<WheelPrize | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [lightsOn, setLightsOn] = useState(true);
  
  // Refs para animação de tick sound
  const currentRotationRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const lastTickAngleRef = useRef(0);

  // Eligibilidade Checks
  const now = Date.now();
  const hasDepositedRecently = (now - lastDepositTime) < SEVEN_DAYS_MS;
  const isCooldown = (now - lastSpinTime) < ONE_DAY_MS;

  // Efeito de luzes piscando
  useEffect(() => {
      const interval = setInterval(() => setLightsOn(p => !p), 500);
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (isCooldown) {
          const interval = setInterval(() => {
              const remaining = lastSpinTime + ONE_DAY_MS - Date.now();
              if (remaining <= 0) {
                  setTimeLeft(null);
                  clearInterval(interval);
              } else {
                  const hours = Math.floor(remaining / (1000 * 60 * 60));
                  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                  setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
              }
          }, 1000);
          return () => clearInterval(interval);
      }
  }, [isCooldown, lastSpinTime]);

  const handleSpin = () => {
    if (spinning || claimed || isCooldown || !hasDepositedRecently) return;

    setSpinning(true);
    setPrize(null);
    sounds.playClick();
    
    // --- LÓGICA DE PROBABILIDADE PONDERADA ---
    const totalWeight = prizes.reduce((sum, item) => sum + (item.probability || 0), 0);
    let random = Math.random() * totalWeight;
    let selectedPrize = prizes[0];
    let prizeIndex = 0;

    for (let i = 0; i < prizes.length; i++) {
        if (random < prizes[i].probability) {
            selectedPrize = prizes[i];
            prizeIndex = i;
            break;
        }
        random -= prizes[i].probability;
    }
    
    const sliceAngle = 360 / prizes.length;
    // Adiciona rotação aleatória dentro da fatia para realismo (evita sempre o centro)
    const randomOffset = (Math.random() * sliceAngle * 0.6) - (sliceAngle * 0.3); 
    const extraSpins = 360 * 8; // 8 voltas rápidas
    const targetRotation = currentRotationRef.current + extraSpins + (360 - (prizeIndex * sliceAngle)) - (sliceAngle / 2) + randomOffset;

    setRotation(targetRotation);

    // Audio Tick Loop Simulation during spin
    const startTime = Date.now();
    const duration = 5000; // Match CSS transition

    const tickCheck = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        
        // Easing function cubic-bezier(0.1, 0.7, 0.1, 1) approx for JS
        // Simplified easeOutQuart for sound sync
        const ease = 1 - Math.pow(1 - progress, 4);
        
        const currentRot = currentRotationRef.current + (targetRotation - currentRotationRef.current) * ease;
        
        // Toca som a cada passagem de pino (sliceAngle)
        if (Math.abs(currentRot - lastTickAngleRef.current) >= sliceAngle) {
            sounds.playWheelTick();
            lastTickAngleRef.current = currentRot;
        }

        if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(tickCheck);
        } else {
            currentRotationRef.current = targetRotation % 360; // Normalize for next spin
        }
    };
    animationFrameRef.current = requestAnimationFrame(tickCheck);

    setTimeout(() => {
      setSpinning(false);
      setPrize(selectedPrize);
      setClaimed(true);
      if (selectedPrize.type !== 'none') {
          sounds.playFanfare();
          onClaimPrize(selectedPrize.type as any, selectedPrize.amount);
      } else {
          sounds.playCrash(); // Som triste
      }
    }, 5000); 
  };

  // Helper SVG para fatias
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = prizes.map((prize, index) => {
      const sliceAngle = 1 / prizes.length;
      const startAngle = index * sliceAngle;
      const endAngle = (index + 1) * sliceAngle;

      // -0.25 para alinhar 0 graus ao topo (12 horas)
      const [startX, startY] = getCoordinatesForPercent(startAngle - 0.25);
      const [endX, endY] = getCoordinatesForPercent(endAngle - 0.25);

      const largeArcFlag = sliceAngle > 0.5 ? 1 : 0;

      const pathData = [
          `M 0 0`,
          `L ${startX} ${startY}`,
          `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          `L 0 0`,
      ].join(' ');

      const midAngle = (startAngle + endAngle) / 2 - 0.25;
      const textX = Math.cos(2 * Math.PI * midAngle) * 0.65;
      const textY = Math.sin(2 * Math.PI * midAngle) * 0.65;
      const rotationDeg = (midAngle + 0.25) * 360 + 90;

      // Posição do Pino (Peg) no início da fatia
      const [pegX, pegY] = getCoordinatesForPercent(startAngle - 0.25);

      return (
          <g key={prize.id}>
              {/* Slice */}
              <path 
                d={pathData} 
                fill={prize.color} 
                stroke="#d97d1b" // Gold border
                strokeWidth="0.015" 
              />
              {/* Overlay Gloss */}
              <path 
                d={pathData} 
                fill="url(#sliceGloss)" 
                opacity="0.3"
                style={{ mixBlendMode: 'overlay' }}
              />
              
              {/* Text */}
              <text 
                x={textX} 
                y={textY} 
                fill={prize.text} 
                fontSize={prize.label.length > 8 ? "0.07" : "0.09"} 
                fontWeight="900" 
                textAnchor="middle" 
                alignmentBaseline="middle"
                transform={`rotate(${rotationDeg}, ${textX}, ${textY})`}
                style={{ textTransform: 'uppercase', filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))' }}
              >
                  {prize.label}
              </text>

              {/* Peg (Pino) */}
              <circle cx={pegX} cy={pegY} r="0.03" fill="url(#goldGradient)" stroke="#000" strokeWidth="0.005" />
          </g>
      );
  });

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 font-sans">
      <style>{`
        @keyframes confetti {
            0% { opacity: 1; transform: translate(0, 0) scale(1); }
            100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(0.5); }
        }
        .animate-confetti { animation: confetti forwards ease-out; }
      `}</style>

      {prize && prize.type !== 'none' && <ConfettiExplosion />}

      <div className="bg-[#1b1c1d] w-full max-w-md rounded-[24px] sm:rounded-[32px] border-2 border-[#d97d1b]/30 shadow-[0_0_60px_rgba(217,125,27,0.15)] flex flex-col items-center max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto no-scrollbar relative">
        
        {/* Decorative Top Lights */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d97d1b] to-transparent opacity-50" />

        {/* Header */}
        <div className="w-full bg-gradient-to-b from-[#252525] to-[#141516] p-5 flex justify-between items-center border-b border-white/5 z-10">
           <div className="flex flex-col">
               <h2 className="text-xl font-black text-white italic uppercase tracking-tighter drop-shadow-md">
                   Sorte <span className="text-[#d97d1b]">Diária</span>
               </h2>
               <p className="text-[9px] text-[#d97d1b] font-bold uppercase tracking-widest">Prêmios Exclusivos</p>
           </div>
           <button onClick={onClose} className="text-white/30 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
           </button>
        </div>

        {/* Wheel Container */}
        <div className="p-8 pb-12 relative w-full flex justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-[#101010]">
            
            {/* Pointer (Flapper) */}
            <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-30 drop-shadow-2xl origin-top transition-transform duration-100 ${spinning ? 'animate-pulse' : ''}`} style={{ transform: spinning ? 'translateX(-50%) rotate(-5deg)' : 'translateX(-50%)' }}>
                <svg width="50" height="60" viewBox="0 0 50 60">
                    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.5"/>
                    </filter>
                    <path d="M25 60 L10 10 L40 10 Z" fill="#e51a31" stroke="#fff" strokeWidth="3" filter="url(#dropShadow)"/>
                    <circle cx="25" cy="10" r="5" fill="#333" />
                </svg>
            </div>

            {/* Main Wheel Body */}
            <div className="w-72 h-72 relative rounded-full p-2 bg-gradient-to-b from-[#d97d1b] to-[#8b5a00] shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                
                {/* Lights Ring */}
                <div className="absolute inset-0 rounded-full border-[3px] border-[#5c3a00] z-20 pointer-events-none">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div 
                            key={i}
                            className={`absolute w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,215,0,0.8)] transition-colors duration-300 ${lightsOn ? 'bg-[#ffed4a]' : 'bg-[#6b5500]'}`}
                            style={{
                                top: '50%', left: '50%',
                                transform: `rotate(${i * 30}deg) translate(140px) rotate(-${i * 30}deg)` // Posiciona no aro externo
                            }}
                        />
                    ))}
                </div>

                {/* Rotating Inner Part */}
                <div 
                    className="w-full h-full rounded-full overflow-hidden border-4 border-[#332200] relative bg-[#1b1c1d]"
                    style={{ 
                        transform: `rotate(${rotation}deg)`, 
                        transition: spinning ? 'transform 5s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none' 
                    }}
                >
                    <svg viewBox="-1 -1 2 2" className="w-full h-full">
                        <defs>
                            <radialGradient id="sliceGloss">
                                <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                            </radialGradient>
                            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fff7cc" />
                                <stop offset="50%" stopColor="#d97d1b" />
                                <stop offset="100%" stopColor="#8b5a00" />
                            </linearGradient>
                        </defs>
                        {slices}
                    </svg>
                </div>

                {/* Center Hub */}
                <div className="absolute inset-0 m-auto w-20 h-20 bg-gradient-to-br from-[#2c2d30] to-black rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.8)] flex items-center justify-center z-20 border-4 border-[#d97d1b]">
                    <div className="w-14 h-14 bg-[#e51a31] rounded-full flex items-center justify-center font-black italic text-white text-lg shadow-inner border border-white/20">
                        A<span className="text-black">13</span>
                    </div>
                    {/* Bolts */}
                    {[0, 90, 180, 270].map(deg => (
                        <div key={deg} className="absolute w-2 h-2 bg-[#8b8b8b] rounded-full shadow-inner" style={{ transform: `rotate(${deg}deg) translate(32px)` }} />
                    ))}
                </div>
            </div>
        </div>

        {/* Footer Area */}
        <div className="w-full p-6 bg-[#141516] border-t border-white/5 text-center relative z-10 flex flex-col justify-center min-h-[180px]">
            {prize ? (
                <div className="animate-in zoom-in slide-in-from-bottom-4 duration-300">
                    {prize.type === 'none' ? (
                        <>
                            <h3 className="text-xl font-black text-white italic mb-1">Tente Novamente</h3>
                            <p className="text-xs text-white/50 mb-6 max-w-[80%] mx-auto">
                                A sorte favorece os audazes. Volte amanhã!
                            </p>
                            <button 
                                onClick={onClose}
                                className="w-full bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-xl font-black uppercase tracking-widest transition-all text-xs"
                            >
                                Fechar
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="inline-block bg-[#28a745]/20 text-[#28a745] px-3 py-1 rounded-full text-[10px] font-black uppercase mb-2 animate-pulse border border-[#28a745]/30">
                                Prêmio Garantido
                            </div>
                            <h3 className="text-3xl font-black text-white italic mb-6 drop-shadow-lg">
                                {prize.label}
                            </h3>
                            <button 
                                onClick={onClose}
                                className="w-full bg-gradient-to-r from-[#28a745] to-[#1e7e34] hover:brightness-110 text-white py-3.5 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#28a745]/20 active:scale-95 transition-all text-xs"
                            >
                                Resgatar Prêmio
                            </button>
                        </>
                    )}
                </div>
            ) : !hasDepositedRecently ? (
                <div className="animate-in fade-in">
                    <div className="bg-[#e51a31]/10 border border-[#e51a31]/20 p-3 rounded-xl mb-4 flex items-center gap-3">
                        <div className="bg-[#e51a31] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">!</div>
                        <p className="text-[10px] text-left text-white/80 leading-tight">
                            Faça um depósito para desbloquear seu giro grátis diário.
                        </p>
                    </div>
                    <button 
                        onClick={onOpenWallet}
                        className="w-full bg-[#28a745] hover:bg-[#218838] text-white py-3.5 rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all text-xs"
                    >
                        Depositar Agora
                    </button>
                </div>
            ) : isCooldown ? (
                <div className="animate-in fade-in">
                    <p className="text-[10px] text-[#d97d1b] uppercase font-bold mb-2 tracking-widest">Próximo Giro Em</p>
                    <div className="text-4xl font-black text-white font-mono tracking-widest mb-6 bg-black/30 py-2 rounded-xl border border-white/5">
                        {timeLeft || "Calculando..."}
                    </div>
                    <button 
                        disabled
                        className="w-full bg-[#2c2d30] text-white/30 py-3.5 rounded-xl font-black uppercase tracking-widest cursor-not-allowed text-xs border border-white/5"
                    >
                        Volte Amanhã
                    </button>
                </div>
            ) : (
                <div className="animate-in fade-in">
                    <p className="text-xs text-white/50 mb-4 font-medium">Gire para ganhar saldo bônus ou voos grátis.</p>
                    <button 
                        onClick={handleSpin}
                        disabled={spinning}
                        className="w-full bg-gradient-to-r from-[#d97d1b] to-[#b66614] hover:brightness-110 disabled:grayscale text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-[0_0_25px_rgba(217,125,27,0.4)] transition-all active:scale-95 text-sm border-t border-white/20"
                    >
                        {spinning ? 'GIRANDO...' : 'GIRAR AGORA'}
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default DailyWheelModal;
