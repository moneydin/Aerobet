
import React, { useEffect, useState, useRef } from 'react';
import { GameHistory, GameStatus, UserStats, Mission } from '../types';
import AIPredictor from './AIPredictor';
import BankrollStatus from './BankrollStatus';
import { getCustomSkinImage, getCustomSkins } from '../src/utils/customSkins';

interface GameCanvasProps {
  status: GameStatus;
  multiplier: number;
  countdown: number;
  history: GameHistory[];
  stats?: {
    count: number;
    amount: number;
    wins: number;
    winnersCount: number;
  };
  isSubscribed?: boolean;
  onOpenUpgrade?: () => void;
  userStats?: UserStats;
  trackedMission?: Mission;
  activeSkin?: string;
}

const MissionHUD: React.FC<{ mission: Mission }> = ({ mission }) => {
    const progress = Math.min(100, (mission.current / mission.target) * 100);
    const barColor = mission.tier === 'premium' ? 'from-[#913ef2] to-[#5b0ca8]' : 'from-[#28a745] to-[#1e7e34]';

    return (
        <div className="absolute top-16 right-4 z-40 bg-black/40 backdrop-blur-md rounded-lg border border-white/5 p-2 w-36 shadow-lg animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[7px] font-bold uppercase text-white/50 tracking-wider truncate max-w-[70%]">
                    {mission.title}
                </span>
                <span className="text-[7px] font-black text-white tabular-nums">
                    {Math.floor(mission.current)}/{mission.target}
                </span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                />
            </div>
            {mission.minMultiplier && mission.minMultiplier > 0 && (
                <div className="flex items-center gap-1 mt-1 text-[6px] text-white/30 uppercase">
                    <div className="w-1 h-1 rounded-full bg-[#d97d1b]" />
                    Min: {mission.minMultiplier.toFixed(2)}x
                </div>
            )}
        </div>
    );
};

const SKIN_COLORS = {
  fenix: {
    primary: [
      { offset: '0%', color: '#2c2c30' },
      { offset: '30%', color: '#1e1e21' },
      { offset: '70%', color: '#141416' },
      { offset: '100%', color: '#0c0c0e' }
    ],
    secondary: [
      { offset: '0%', color: '#3c3d42' },
      { offset: '50%', color: '#252528' },
      { offset: '100%', color: '#101011' }
    ],
    glow: [
      { offset: '0%', color: '#ff2d55' },
      { offset: '50%', color: '#e51a31' },
      { offset: '100%', color: '#8b0010' }
    ],
    cockpit: [
      { offset: '0%', color: '#ff3b30' },
      { offset: '40%', color: '#ff453a' },
      { offset: '100%', color: '#800000' }
    ],
    fire: [
      { offset: '0%', color: '#ffffff', opacity: 1 },
      { offset: '20%', color: '#ffcc00', opacity: 1 },
      { offset: '55%', color: '#ff3a30', opacity: 1 },
      { offset: '100%', color: '#ff2d55', opacity: 0 }
    ],
    areaColor: '#e51a31'
  },
  silver: {
    primary: [
      { offset: '0%', color: '#ffffff' },
      { offset: '30%', color: '#e2e8f0' },
      { offset: '70%', color: '#94a3b8' },
      { offset: '100%', color: '#475569' }
    ],
    secondary: [
      { offset: '0%', color: '#1e293b' },
      { offset: '50%', color: '#0f172a' },
      { offset: '100%', color: '#020617' }
    ],
    glow: [
      { offset: '0%', color: '#a5f3fc' },
      { offset: '50%', color: '#06b6d4' },
      { offset: '100%', color: '#0891b2' }
    ],
    cockpit: [
      { offset: '0%', color: '#22d3ee' },
      { offset: '40%', color: '#0891b2' },
      { offset: '100%', color: '#0f766e' }
    ],
    fire: [
      { offset: '0%', color: '#ffffff', opacity: 1 },
      { offset: '20%', color: '#a5f3fc', opacity: 1 },
      { offset: '55%', color: '#06b6d4', opacity: 1 },
      { offset: '100%', color: '#0891b2', opacity: 0 }
    ],
    areaColor: '#06b6d4'
  },
  purple: {
    primary: [
      { offset: '0%', color: '#a21caf' },
      { offset: '30%', color: '#701a75' },
      { offset: '70%', color: '#4a044e' },
      { offset: '100%', color: '#3b0764' }
    ],
    secondary: [
      { offset: '0%', color: '#2e1065' },
      { offset: '50%', color: '#1e1b4b' },
      { offset: '100%', color: '#0f052d' }
    ],
    glow: [
      { offset: '0%', color: '#f472b6' },
      { offset: '50%', color: '#d946ef' },
      { offset: '100%', color: '#a21caf' }
    ],
    cockpit: [
      { offset: '0%', color: '#f472b6' },
      { offset: '40%', color: '#c084fc' },
      { offset: '100%', color: '#6b21a8' }
    ],
    fire: [
      { offset: '0%', color: '#ffffff', opacity: 1 },
      { offset: '20%', color: '#f472b6', opacity: 1 },
      { offset: '55%', color: '#d946ef', opacity: 1 },
      { offset: '100%', color: '#a21caf', opacity: 0 }
    ],
    areaColor: '#d946ef'
  },
  gold: {
    primary: [
      { offset: '0%', color: '#fef08a' },
      { offset: '30%', color: '#facc15' },
      { offset: '70%', color: '#ca8a04' },
      { offset: '100%', color: '#854d0e' }
    ],
    secondary: [
      { offset: '0%', color: '#1e1b4b' },
      { offset: '50%', color: '#111827' },
      { offset: '100%', color: '#030712' }
    ],
    glow: [
      { offset: '0%', color: '#fef08a' },
      { offset: '50%', color: '#eab308' },
      { offset: '100%', color: '#ca8a04' }
    ],
    cockpit: [
      { offset: '0%', color: '#fef08a' },
      { offset: '40%', color: '#fb923c' },
      { offset: '100%', color: '#c2410c' }
    ],
    fire: [
      { offset: '0%', color: '#ffffff', opacity: 1 },
      { offset: '20%', color: '#fef08a', opacity: 1 },
      { offset: '55%', color: '#f59e0b', opacity: 1 },
      { offset: '100%', color: '#ca8a04', opacity: 0 }
    ],
    areaColor: '#eab308'
  },
  green: {
    primary: [
      { offset: '0%', color: '#064e3b' },
      { offset: '30%', color: '#064e40' },
      { offset: '70%', color: '#022c22' },
      { offset: '100%', color: '#022c15' }
    ],
    secondary: [
      { offset: '0%', color: '#1e2937' },
      { offset: '50%', color: '#111827' },
      { offset: '100%', color: '#030712' }
    ],
    glow: [
      { offset: '0%', color: '#4ade80' },
      { offset: '50%', color: '#22c55e' },
      { offset: '100%', color: '#15803d' }
    ],
    cockpit: [
      { offset: '0%', color: '#a3e635' },
      { offset: '40%', color: '#4ade80' },
      { offset: '100%', color: '#14532d' }
    ],
    fire: [
      { offset: '0%', color: '#ffffff', opacity: 1 },
      { offset: '20%', color: '#a3e635', opacity: 1 },
      { offset: '55%', color: '#22c55e', opacity: 1 },
      { offset: '100%', color: '#15803d', opacity: 0 }
    ],
    areaColor: '#22c55e'
  },
  dark: {
    primary: [
      { offset: '0%', color: '#1c1917' },
      { offset: '30%', color: '#1c1917' },
      { offset: '70%', color: '#1c1917' },
      { offset: '100%', color: '#0c0a09' }
    ],
    secondary: [
      { offset: '0%', color: '#ff2d55' },
      { offset: '50%', color: '#e51a31' },
      { offset: '100%', color: '#8b0010' }
    ],
    glow: [
      { offset: '0%', color: '#ff2d55' },
      { offset: '50%', color: '#e51a31' },
      { offset: '100%', color: '#8b0010' }
    ],
    cockpit: [
      { offset: '0%', color: '#dc2626' },
      { offset: '40%', color: '#991b1b' },
      { offset: '100%', color: '#450a0a' }
    ],
    fire: [
      { offset: '0%', color: '#ffffff', opacity: 1 },
      { offset: '20%', color: '#ffe2e2', opacity: 1 },
      { offset: '55%', color: '#ff2d55', opacity: 1 },
      { offset: '100%', color: '#8b0010', opacity: 0 }
    ],
    areaColor: '#ff2d55'
  },
  soberano: {
    primary: [
      { offset: '0%', color: '#111018' },
      { offset: '30%', color: '#1a1130' },
      { offset: '70%', color: '#090514' },
      { offset: '100%', color: '#000000' }
    ],
    secondary: [
      { offset: '0%', color: '#ffe45c' },
      { offset: '50%', color: '#dca817' },
      { offset: '100%', color: '#9d7100' }
    ],
    glow: [
      { offset: '0%', color: '#fffbdf' },
      { offset: '50%', color: '#ffd700' },
      { offset: '100%', color: '#ca8a04' }
    ],
    cockpit: [
      { offset: '0%', color: '#ec4899' },
      { offset: '40%', color: '#a855f7' },
      { offset: '100%', color: '#4c1d95' }
    ],
    fire: [
      { offset: '0%', color: '#ffffff', opacity: 1 },
      { offset: '20%', color: '#ffd700', opacity: 1 },
      { offset: '55%', color: '#ff7700', opacity: 1 },
      { offset: '100%', color: '#ffd700', opacity: 0 }
    ],
    areaColor: '#eab308'
  },
  aerobrasil: {
    primary: [
      { offset: '0%', color: '#00aa3a' },
      { offset: '30%', color: '#00852c' },
      { offset: '70%', color: '#004f1a' },
      { offset: '100%', color: '#00220a' }
    ],
    secondary: [
      { offset: '0%', color: '#fff000' },
      { offset: '50%', color: '#fdd800' },
      { offset: '100%', color: '#c59a00' }
    ],
    glow: [
      { offset: '0%', color: '#6eff8b' },
      { offset: '50%', color: '#fdd800' },
      { offset: '100%', color: '#00852c' }
    ],
    cockpit: [
      { offset: '0%', color: '#4da6ff' },
      { offset: '40%', color: '#002276' },
      { offset: '100%', color: '#000040' }
    ],
    fire: [
      { offset: '0%', color: '#ffffff', opacity: 1 },
      { offset: '20%', color: '#fffb00', opacity: 1 },
      { offset: '55%', color: '#00e640', opacity: 1 },
      { offset: '100%', color: '#00852c', opacity: 0 }
    ],
    areaColor: '#00aa3a'
  }
};

const GameCanvas: React.FC<GameCanvasProps> = ({ 
    status, 
    multiplier, 
    countdown, 
    stats, 
    history, 
    isSubscribed = false, 
    onOpenUpgrade = () => {},
    userStats,
    trackedMission,
    activeSkin = 'aerobrasil'
}) => {
  let skinConfig = SKIN_COLORS[activeSkin as keyof typeof SKIN_COLORS] || SKIN_COLORS.aerobrasil;
  let customOffset = { x: -90, y: -90, scale: 1.1, rotation: 12 };
  
  if (activeSkin?.startsWith('custom_')) {
    const customSkins = getCustomSkins();
    const s = customSkins.find(cs => cs.id === activeSkin);
    if (s) {
      customOffset = {
        x: s.offsetX ?? -90,
        y: s.offsetY ?? -90,
        scale: s.scale ?? 1.1,
        rotation: s.rotation ?? 12
      };
      if (s.lineColor || s.smokeColor) {
        // Clone config to override colors
        skinConfig = { ...skinConfig };
        
        if (s.smokeColor) {
           skinConfig.fire = [
             { offset: '0%', color: '#ffffff', opacity: 1 },
             { offset: '20%', color: '#ffffff', opacity: 1 },
             { offset: '55%', color: s.smokeColor, opacity: 1 },
             { offset: '100%', color: s.smokeColor, opacity: 0 }
           ];
           skinConfig.areaColor = s.smokeColor;
        }
        if (s.lineColor) {
           skinConfig.areaColor = s.lineColor;
        }
      }
    }
  }

  const [isShaking, setIsShaking] = useState(false);
  const [showHud, setShowHud] = useState(true); 
  
  // Refs para Manipulação Direta do DOM (Performance 60FPS)
  const gridRef = useRef<HTMLDivElement>(null);
  const multiplierTextRef = useRef<HTMLHeadingElement>(null);
  const planeGroupRef = useRef<SVGGElement>(null);
  const curvePathRef = useRef<SVGPathElement>(null);
  const areaPathRef = useRef<SVGPathElement>(null);
  
  const requestRef = useRef<number>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const prevStatusRef = useRef<GameStatus>(status);
  const crashStartTimeRef = useRef<number | null>(null);
  const flightStartTimeRef = useRef<number | null>(null);
  
  // Guardamos a última posição para animar o crash a partir dela
  const lastFlightPositionRef = useRef({ x: 160, y: 500, rotation: 0 });

  const multiplierRef = useRef(multiplier);
  const smoothMultiplierRef = useRef(1.00);

  useEffect(() => {
    multiplierRef.current = multiplier;
  }, [multiplier]);

  useEffect(() => {
    if (status === GameStatus.FLYING) {
      if (prevStatusRef.current !== GameStatus.FLYING) {
        flightStartTimeRef.current = Date.now();
        smoothMultiplierRef.current = 1.00;
      } else if (!flightStartTimeRef.current) {
        const elapsedSeconds = Math.log(Math.max(1.0001, multiplierRef.current)) / Math.log(1.12);
        flightStartTimeRef.current = Date.now() - (elapsedSeconds * 1000);
        smoothMultiplierRef.current = multiplierRef.current;
      }
    }
    if (prevStatusRef.current === GameStatus.FLYING && status === GameStatus.CRASHED) {
      setIsShaking(true);
      crashStartTimeRef.current = Date.now();
      setTimeout(() => setIsShaking(false), 500);
    }
    
    if (status === GameStatus.WAITING) {
      crashStartTimeRef.current = null;
      flightStartTimeRef.current = null;
      // Reset visual elements immediately
      if (planeGroupRef.current) planeGroupRef.current.setAttribute('transform', `translate(160, 500) rotate(0) scale(1)`);
      if (curvePathRef.current) curvePathRef.current.setAttribute('d', '');
      if (areaPathRef.current) areaPathRef.current.setAttribute('d', '');
    }

    prevStatusRef.current = status;
  }, [status]);

  // --- GAME LOOP ---
  useEffect(() => {
    const animate = (time: number) => {
      // 1. Grid Animation (Always runs)
      let speed = 0.15;
      
      // Constants for Canvas Math
      const width = 1000;
      const height = 600; 
      const startX = 160; 
      const floorY = 500;
      const maxX = width - 150;
      const minY = 220;

      const currentMult = multiplierRef.current;

      if (status === GameStatus.FLYING) {
        // Use o multiplicador de estado unificado diretamente para sincronização absoluta de 100%
        const displayMult = currentMult;

        // Calcula o tempo decorrido preciso com base na fórmula exponencial do multiplicador
        const flightTimeElapsed = Math.max(0, Math.log(Math.max(1.0001, displayMult)) / Math.log(1.12));

        // Atualiza Texto com FPS do Monitor (silky smooth)
        if (multiplierTextRef.current) {
            multiplierTextRef.current.textContent = displayMult.toFixed(2) + 'x';
        }

        // Acelera grid baseado no mult
        const speedMultiplier = 1 + Math.log10(displayMult) * 1.5;
        speed = 2.2 * speedMultiplier;

        // Calcula Posição do Avião
        const progress = Math.min(1, Math.log10(displayMult) / Math.log10(150));
        
        const takeoffSpeed = 250; 
        const timeBasedX = takeoffSpeed * flightTimeElapsed;
        const multiplierBasedX = (width - 400) * Math.pow(progress, 0.7);
        const calculatedX = startX + Math.max(timeBasedX, multiplierBasedX);

        const takeoffAscentRate = 150;
        const timeBasedY = takeoffAscentRate * Math.pow(Math.max(0, flightTimeElapsed - 0.3), 1.5);
        const multiplierBasedY = (height - 300) * Math.pow(progress, 0.85);
        const calculatedY = floorY - Math.max(timeBasedY, multiplierBasedY);

        let planeX = Math.min(maxX, calculatedX);
        let planeY = Math.max(minY, calculatedY);

        // Cruising Oscillation
        if (calculatedY < minY) {
            planeY += Math.sin(time / 450) * 10;
        }

        const rotation = -5 - Math.min(25, (planeY < floorY - 5 ? (progress * 20) + (flightTimeElapsed * 2) : 0));
        
        // Vibration
        const vibration = Math.sin(time / 10) * (0.5 + progress * 2);
        
        // Save for crash
        lastFlightPositionRef.current = { x: planeX, y: planeY, rotation };

        // Apply Transform to Plane Group
        if (planeGroupRef.current) {
            const scale = 1.1 + progress * 0.15;
            planeGroupRef.current.setAttribute('transform', `translate(${planeX}, ${planeY + vibration}) rotate(${rotation}) scale(${scale})`);
        }

        // Draw Trail (Curve)
        if (displayMult >= 1.00) {
            const finalPathY = planeY; 
            const cp1x = startX + (planeX - startX) * 0.5;
            const cp1y = floorY;
            const cp2x = startX + (planeX - startX) * 0.8;
            const cp2y = floorY - (floorY - finalPathY) * 0.2;
            const d = `M ${startX} ${floorY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${planeX} ${finalPathY}`;
            
            if (curvePathRef.current) curvePathRef.current.setAttribute('d', d);
            if (areaPathRef.current) areaPathRef.current.setAttribute('d', `${d} L ${planeX} ${floorY} Z`);
        }

      } else if (status === GameStatus.CRASHED) {
        // --- CRASH LOGIC ---
        speed = 0.8;
        let elapsed = 0;
        if (crashStartTimeRef.current) {
          elapsed = (Date.now() - crashStartTimeRef.current) / 1000;
        }
        
        // Alinha imediatamente com o valor final oficial do crash
        smoothMultiplierRef.current = currentMult;
        
        // Texto Estático do Crash
        if (multiplierTextRef.current) {
            multiplierTextRef.current.textContent = currentMult.toFixed(2) + 'x';
        }

        // Animação de Queda (Simples)
        const startCrashX = lastFlightPositionRef.current.x;
        const startCrashY = lastFlightPositionRef.current.y;
        
        const planeX = startCrashX + (elapsed * 2000); 
        const planeY = startCrashY - (elapsed * 1000); 
        const rotation = lastFlightPositionRef.current.rotation - (elapsed * 50);

        if (planeGroupRef.current) {
             planeGroupRef.current.setAttribute('transform', `translate(${planeX}, ${planeY}) rotate(${rotation}) scale(1)`);
        }

      } else {
         // --- WAITING LOGIC ---
         if (multiplierTextRef.current) {
            multiplierTextRef.current.textContent = '1.00x';
         }
         
         // Bobbing effect while waiting
         const bobbing = Math.sin(time / 250) * 1.5;
         if (planeGroupRef.current) {
             planeGroupRef.current.setAttribute('transform', `translate(160, ${500 + bobbing}) rotate(0) scale(1.1)`);
         }
      }

      // Update Grid Position (Hardware-accelerated silky smooth drift with translate3d)
      offsetRef.current.x = (offsetRef.current.x + speed) % 120;
      offsetRef.current.y = (offsetRef.current.y - speed * 0.3) % 120;

      if (gridRef.current) {
        gridRef.current.style.transform = `translate3d(${-offsetRef.current.x}px, ${-offsetRef.current.y}px, 0)`;
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status]); 

  const width = 1000;
  const height = 600; 
  const isWaiting = status === GameStatus.WAITING;
  const isFlying = status === GameStatus.FLYING;
  const isCrashed = status === GameStatus.CRASHED;

  return (
    <div className={`relative w-full h-full bg-[#050505] flex items-center justify-center overflow-hidden select-none transition-colors duration-1000 ${isCrashed ? 'bg-[#150000]' : ''} ${isShaking ? 'animate-canvas-shake' : ''}`}>
      
      {/* HUD Controls (Eye Toggle) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={() => setShowHud(!showHud)}
            className="p-1.5 rounded-full bg-black/40 border border-white/10 text-white/30 hover:text-white transition-colors"
            title={showHud ? "Ocultar HUD" : "Mostrar HUD"}
          >
              {showHud ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              )}
          </button>
      </div>

      {/* Esquerda: IA Preditiva */}
      {showHud && (
          <AIPredictor 
            status={status} 
            history={history} 
            isSubscribed={isSubscribed} 
            onOpenUpgrade={onOpenUpgrade}
          />
      )}

      {/* Direita: Meta Diária */}
      {showHud && userStats && (
          <BankrollStatus 
            stats={userStats}
            isSubscribed={isSubscribed}
            onOpenManager={onOpenUpgrade}
          />
      )}

      {/* Direita (Abaixo da Meta): Missão Ativa */}
      {showHud && trackedMission && (
          <MissionHUD mission={trackedMission} />
      )}
      
      {/* Styles for dynamic canvas visuals & wind lines */}
      <style>{`
        @keyframes windStreakSlow {
          0% { transform: translateX(110%); }
          100% { transform: translateX(-150vw); }
        }
        @keyframes windStreakFast {
          0% { transform: translateX(110%); }
          100% { transform: translateX(-150vw); }
        }
        @keyframes starFieldDrift {
          0% { transform: translateX(0px); opacity: 0.15; }
          40% { opacity: 0.7; }
          85% { opacity: 0.7; }
          100% { transform: translateX(-100vw); opacity: 0.15; }
        }
        @keyframes nebulaPulse {
          0%, 100% { transform: scale(1) translate(0px, 0px); opacity: 0.14; }
          50% { transform: scale(1.18) translate(-40px, 25px); opacity: 0.28; }
        }
      `}</style>

      {/* Dynamic Animated Cosmic Background Wrapper */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Sky/Space Canvas Depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#020204] via-[#050609] to-[#010103] opacity-100 transition-colors duration-1000" />
        
        {/* Dynamic Theme Glow Blobs synced with selected skin color */}
        <div 
          className="absolute top-1/4 left-1/3 w-[550px] h-[550px] rounded-full filter blur-[150px] transition-all mix-blend-screen pointer-events-none duration-1000"
          style={{
            background: `radial-gradient(circle, ${skinConfig.areaColor} 0%, transparent 70%)`,
            animationName: 'nebulaPulse',
            animationDuration: '14s',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full filter blur-[130px] transition-all mix-blend-screen pointer-events-none duration-1000"
          style={{
            background: `radial-gradient(circle, ${isCrashed ? '#e51a31' : skinConfig.areaColor} 0%, transparent 70%)`,
            animationName: 'nebulaPulse',
            animationDuration: '18s',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
            animationDirection: 'reverse',
            opacity: 0.6
          }}
        />

        {/* Cyber Grid Horizon Lines */}
        <div className="absolute bottom-0 inset-x-0 h-[300px] bg-gradient-to-t from-cyan-500/[0.02] to-transparent pointer-events-none opacity-20" />

        {/* Dynamic Speed Wind Strips */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isCrashed ? 'opacity-10' : 'opacity-100'}`}>
          {[...Array(10)].map((_, idx) => {
            const top = 15 + (idx * 7) + (Math.sin(idx) * 2);
            const width = 60 + (idx * 30 % 140);
            const height = 1 + (idx % 2 === 0 ? 0.5 : 0);
            const duration = 0.8 + ((idx * 9) % 15) / 10;
            const delay = (idx * 0.25) % 2;

            return (
              <div 
                key={idx}
                className="absolute left-full rounded-full bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                style={{
                  top: `${top}%`,
                  width: `${width}px`,
                  height: `${height}px`,
                  animationName: isFlying ? 'windStreakFast' : 'windStreakSlow',
                  animationDuration: isFlying ? `${duration * 0.4}s` : `${duration * 4}s`,
                  animationDelay: `${delay}s`,
                  animationIterationCount: 'infinite',
                  animationTimingFunction: isFlying ? 'cubic-bezier(0.25, 1, 0.5, 1)' : 'linear',
                  opacity: isFlying ? 0.35 : 0.08,
                }}
              />
            );
          })}
        </div>
        
        {/* Floating Glowing Stardust / Space Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(14)].map((_, i) => {
            const size = 1.2 + (i % 2);
            return (
              <div
                key={i}
                className="absolute rounded-full bg-white transition-all pointer-events-none"
                style={{
                  top: `${10 + (i * 6.3) % 80}%`,
                  left: `${5 + (i * 17) % 90}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  boxShadow: `0 0 6px rgba(255,255,255,0.7)`,
                  opacity: isFlying ? 0.4 : 0.12,
                  animationName: 'starFieldDrift',
                  animationDuration: isFlying ? '2.5s' : '16s',
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                  animationDelay: `${(i * 0.5) % 4}s`
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          ref={gridRef}
          className="absolute inset-[-120px] opacity-[0.09] transition-opacity duration-1000" 
          style={{ 
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255,255,255,0.05) 1.5px, transparent 1.5px)`, 
            backgroundSize: '120px 120px',
            transform: 'translate3d(0px, 0px, 0px)',
          }} 
        />
      </div>
      
      {(isWaiting || isFlying) && stats && stats.count > 0 && (
        <div className="absolute bottom-4 right-4 z-40 bg-black/40 backdrop-blur-md rounded-full border border-white/10 px-4 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-lg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/50">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <div className="flex flex-col text-right">
            <span className="text-sm font-black text-white leading-none tabular-nums">
              { isWaiting ? stats.count : stats.count - stats.winnersCount }
            </span>
            <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider leading-none">
              { isWaiting ? 'Jogadores' : 'No Voo' }
            </span>
          </div>
          { isFlying && stats.winnersCount > 0 && (
              <>
                  <div className="h-5 w-px bg-white/10" />
                  <div className="flex flex-col text-right">
                      <span className="text-sm font-black text-[#d97d1b] leading-none tabular-nums">
                          {stats.winnersCount}
                      </span>
                      <span className="text-[8px] font-bold text-[#d97d1b]/60 uppercase tracking-wider leading-none">
                          Sacou
                      </span>
                  </div>
              </>
          )}
        </div>
      )}

      <div className="z-30 text-center select-none pointer-events-none absolute w-full px-4 flex flex-col items-center">
        {isWaiting && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-3 py-1.5 px-5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">
               <div className="flex items-center font-black text-lg italic tracking-tighter uppercase">
                  <span className="text-[#e51a31]">AERO</span>
                  <span className="text-white">bet</span>
               </div>
            </div>

            <div className="flex flex-col items-center">
               <p className="text-white/20 font-black text-[8px] uppercase tracking-[0.4em] mb-1.5">Aguardando próxima rodada</p>
               <div className="flex items-center gap-3">
                  <div className="text-white font-black text-3xl italic tabular-nums drop-shadow-lg">
                     {(countdown/1000).toFixed(1)}s
                  </div>
                  <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                     <div 
                       className="h-full bg-[#e51a31] transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(229,26,49,0.5)]"
                       style={{ width: `${(countdown / 5000) * 100}%` }}
                     />
                  </div>
               </div>
            </div>
          </div>
        )}

        {isFlying && (
          <div className="flex flex-col items-center justify-center">
            {/* Direct DOM Manipulation Ref - ZERO LAG */}
            <h1 
                ref={multiplierTextRef}
                className="text-white text-7xl md:text-9xl font-black italic tracking-tighter drop-shadow-[0_0_20px_rgba(229,26,49,0.35)] tabular-nums"
            >
                {multiplier.toFixed(2)}x
            </h1>
          </div>
        )}

        {isCrashed && (
          <div className="flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <h2 className="text-[#e51a31] text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-1 drop-shadow-[0_0_30px_rgba(229,26,49,0.6)]">
              VOOU PARA LONGE!
            </h2>
            <div className="text-white text-7xl md:text-8xl font-black italic opacity-80 tabular-nums">
              {multiplier.toFixed(2)}x
            </div>
          </div>
        )}
      </div>

      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-10" 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="planeBody" x1="0" y1="0" x2="0" y2="1">
            {skinConfig.glow.map((stop, sIdx) => (
              <stop key={sIdx} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
          <linearGradient id="metallicPrimary" x1="0" y1="0" x2="0" y2="1">
            {skinConfig.primary.map((stop, sIdx) => (
              <stop key={sIdx} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
          <linearGradient id="metallicSecondary" x1="0" y1="0" x2="1" y2="0">
            {skinConfig.secondary.map((stop, sIdx) => (
              <stop key={sIdx} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
          <linearGradient id="glowingRed" x1="0" y1="0" x2="1" y2="0">
            {skinConfig.glow.map((stop, sIdx) => (
              <stop key={sIdx} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
          <linearGradient id="cockpitRed" x1="0" y1="0" x2="0" y2="1">
            {skinConfig.cockpit.map((stop, sIdx) => (
              <stop key={sIdx} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
          <linearGradient id="fireGradient" x1="0" y1="0" x2="1" y2="0">
            {skinConfig.fire.map((stop, sIdx) => (
              <stop key={sIdx} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity !== undefined ? stop.opacity : 1} />
            ))}
          </linearGradient>
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skinConfig.areaColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={skinConfig.areaColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {isWaiting && (
          <g className="animate-in fade-in duration-500">
            {/* Unidade Técnica de Abastecimento (Caminhão/Box) */}
            <g transform="translate(40, 520)">
              <rect x="0" y="0" width="80" height="30" rx="4" fill="#141516" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <rect x="60" y="-8" width="30" height="35" rx="3" fill="#0c0d0e" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <rect x="5" y="-12" width="50" height="15" rx="7" fill="#e51a31" stroke="#8b0010" strokeWidth="0.5" />
              <text x="30" y="-2" fill="white" fontSize="6" fontWeight="900" textAnchor="middle" opacity="0.6">GASOLINA</text>
              <circle cx="15" cy="30" r="6" fill="#000" />
              <circle cx="75" cy="30" r="6" fill="#000" />
            </g>
            {/* Mangueira de combustível animada */}
            <path 
              d={`M 110 530 Q 135 540, 115 512`} // Hardcoded endpoint near plane default pos
              fill="none" 
              stroke="#e51a31" 
              strokeWidth="2" 
              strokeDasharray="4,6" 
              strokeLinecap="round"
              opacity="0.4"
            >
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="0.5s" repeatCount="indefinite" />
            </path>
          </g>
        )}

        {!isCrashed && (
           <ellipse 
              // Shadow follows plane logic roughly, or simply center it for waiting
              cx={isWaiting ? 150 : -100} cy={525} rx={50} ry={8} 
              fill="rgba(0,0,0,0.3)" filter="blur(8px)"
              // Can animate this via ref too if needed, but low priority
           />
        )}

        <path
            ref={areaPathRef}
            fill="url(#areaGradient)"
            filter="url(#neonGlow)"
            opacity={0.6}
        />

        <g>
            <path 
                ref={curvePathRef}
                fill="none" 
                stroke={skinConfig.areaColor} 
                strokeWidth="12" 
                strokeLinecap="round" 
                strokeOpacity="0.4" 
                filter="url(#neonGlow)" 
            />
        </g>

        {/* PLANE GROUP CONTROLLED BY REF - LUXURY BLACK & RED RACING JET */}
        <g ref={planeGroupRef}>
          {/* Engine Exhaust Flame Layer 1 (Wide Backwash) */}
          <path d="M-80,-7 C-130,-16 -160,0 -185,0 C-160,5 -130,16 -80,7 Z" fill="url(#fireGradient)" opacity="0.8">
            <animate attributeName="d" values="M-80,-7 C-130,-16 -160,0 -185,0 C-160,5 -130,16 -80,7 Z; M-80,-5 C-120,-10 -150,0 -170,2 C-150,2 -120,10 -80,5 Z; M-80,-7 C-130,-16 -160,0 -185,0 C-160,5 -130,16 -80,7 Z" dur="0.08s" repeatCount="indefinite" />
          </path>
          
          {/* Engine Exhaust Flame Layer 2 (Intense Inner Flame Core) */}
          <path d="M-80,-3.5 Q-115,-0.5 -135,-0.5 Q-115,-0.5 -80,3.5 Z" fill="#ffffff" opacity="0.95">
            <animate attributeName="d" values="M-80,-3.5 Q-115,-0.5 -135,-0.5 Q-115,-0.5 -80,3.5 Z; M-80,-2 Q-105,-0.5 -125,-0.5 Q-105,-0.5 -80,2 Z; M-80,-3.5 Q-115,-0.5 -135,-0.5 Q-115,-0.5 -80,3.5 Z" dur="0.05s" repeatCount="indefinite" />
          </path>

          {/* Engine Jet Thruster Nozzle Ring */}
          <rect x="-83" y="-8.5" width="8" height="17" rx="2" fill="#2d2d30" stroke="#0c0c0e" strokeWidth="0.5" />
          
          {/* 3D Rendered Plane Image dynamically mapped to active skin */}
          <g transform={`translate(-10, -5) scale(${customOffset.scale}) rotate(${customOffset.rotation})`}>
            <image 
              href={activeSkin?.startsWith('custom_') ? (getCustomSkinImage(activeSkin) || `/images/skin_aerobrasil.png`) : `/images/skin_${activeSkin || 'aerobrasil'}.png`} 
              x={customOffset.x} 
              y={customOffset.y} 
              width="180" 
              height="180" 
              style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0px 8px 12px rgba(0,0,0,0.85))' }}
            />
          </g>
          
        </g>
      </svg>
    </div>
  );
};

export default GameCanvas;
