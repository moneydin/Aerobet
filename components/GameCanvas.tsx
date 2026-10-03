
import React, { useEffect, useState, useRef } from 'react';
import { GameHistory, GameStatus, UserStats, Mission } from '../types';
import AIPredictor from './AIPredictor';
import BankrollStatus from './BankrollStatus';
import { getCustomSkinImage, getCustomSkins, useCustomSkins } from '../src/utils/customSkins';
import { WAIT_TIME } from '../constants';
import { CanvasBackgroundConfig } from '../utils/canvasBackground';

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
  canvasBgConfig?: CanvasBackgroundConfig;
  activeCanvasBgImage?: string;
  activeCanvasBgVideo?: string;
}

const SeamlessCanvasBackground: React.FC<{
  config?: CanvasBackgroundConfig;
  activeImage?: string;
  activeVideo?: string;
}> = ({ config, activeImage, activeVideo }) => {
  const targetType = config?.bgType || 'image';
  const targetSrc = targetType === 'video' ? (activeVideo || '') : (activeImage || '');

  const [currentMedia, setCurrentMedia] = useState<{ type: 'video' | 'image'; src: string }>({
    type: targetType,
    src: targetSrc
  });
  const [prevMedia, setPrevMedia] = useState<{ type: 'video' | 'image'; src: string } | null>(null);
  const [isCrossfading, setIsCrossfading] = useState(false);

  useEffect(() => {
    if (targetSrc && targetSrc !== currentMedia.src) {
      setPrevMedia(currentMedia);
      setCurrentMedia({ type: targetType, src: targetSrc });
      setIsCrossfading(true);
      const timer = setTimeout(() => {
        setIsCrossfading(false);
        setPrevMedia(null);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [targetSrc, targetType]);

  if (!config?.enabled || (!currentMedia.src && !prevMedia?.src)) return null;

  return (
    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
      {/* Previous Media Layer (keeps old background visible while switching, avoiding black flash) */}
      {prevMedia && prevMedia.src && isCrossfading && (
        <div className="absolute inset-0 z-0 opacity-100 transition-opacity duration-700">
          {prevMedia.type === 'video' ? (
            <video
              src={prevMedia.src}
              muted
              loop
              playsInline
              autoPlay
              className="w-full h-full object-cover"
              style={{
                objectFit: config.fit || 'cover',
                opacity: config.opacity,
                filter: `blur(${config.blur || 0}px)`
              }}
            />
          ) : (
            <img
              src={prevMedia.src}
              alt=""
              className="w-full h-full object-cover"
              style={{
                objectFit: config.fit || 'cover',
                opacity: config.opacity,
                filter: `blur(${config.blur || 0}px)`
              }}
            />
          )}
        </div>
      )}

      {/* Current Media Layer */}
      {currentMedia.src && (
        <div className={`absolute inset-0 z-10 transition-opacity duration-700 ${isCrossfading ? 'animate-in fade-in duration-500' : 'opacity-100'}`}>
          {currentMedia.type === 'video' ? (
            <video
              src={currentMedia.src}
              muted
              loop
              playsInline
              autoPlay
              className="w-full h-full object-cover"
              style={{
                objectFit: config.fit || 'cover',
                opacity: config.opacity,
                filter: `blur(${config.blur || 0}px)`
              }}
            />
          ) : (
            <img
              src={currentMedia.src}
              alt=""
              className="w-full h-full object-cover"
              style={{
                objectFit: config.fit || 'cover',
                opacity: config.opacity,
                filter: `blur(${config.blur || 0}px)`
              }}
            />
          )}
        </div>
      )}

      {/* Contrast-enhancing Darkness Overlay */}
      <div 
        className="absolute inset-0 z-20 bg-black transition-opacity duration-500 pointer-events-none" 
        style={{ opacity: config.overlayDarkness }}
      />
    </div>
  );
};

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

// Função única e autoritativa para cálculo e formatação de altitude diretamente ligada ao multiplicador
export const getAltitudeFromMultiplier = (mult: number, isWaiting: boolean) => {
  if (isWaiting) {
    return { meters: 0, text: '0 m', level: 'SOLO', barPct: 4, rate: 'PISTA 09L', validMult: 1.00 };
  }
  // Garante que a altitude seja exatamente baseada no multiplicador com precisão de 2 casas decimais
  const validMult = Math.max(1.00, parseFloat(mult.toFixed(2)));
  const meters = Math.round(validMult * 1000);
  const text = meters >= 100000 
    ? `${(meters / 1000).toFixed(1).replace('.', ',')} km` 
    : `${meters.toLocaleString('pt-BR')} m`;
  
  let level = 'DECOLAGEM';
  if (meters >= 85000) level = 'ÓRBITA SUBESPACIAL';
  else if (meters >= 25000) level = 'MESOSFERA HIPERSÔNICA';
  else if (meters >= 10000) level = 'ESTRATOSFERA';
  else if (meters >= 1500) level = 'CRUZEIRO SUBSÔNICO';

  const barPct = Math.min(100, Math.max(4, (Math.log10(validMult) / Math.log10(100)) * 100));
  const climbRate = Math.round(120 + Math.log10(Math.max(1.05, validMult)) * 480);
  const rate = `▲ +${climbRate} m/s`;

  return { meters, text, level, barPct, rate, validMult };
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
    activeSkin = 'aerobrasil',
    canvasBgConfig,
    activeCanvasBgImage = '',
    activeCanvasBgVideo = ''
}) => {
  const customSkins = useCustomSkins();

  let skinConfig = SKIN_COLORS[activeSkin as keyof typeof SKIN_COLORS] || SKIN_COLORS.aerobrasil;
  let customOffset: any = { 
    x: -90, y: -90, scale: 1.1, rotation: 12, flipX: false,
    start: { x: -90, y: -90, scale: 1.1, rotation: 12 }
  };
  
  let s = customSkins.find(cs => cs.id === activeSkin);

  if (s) {
    customOffset = {
      x: s.offsetX ?? -90,
        y: s.offsetY ?? -90,
        scale: s.scale ?? 1.1,
        rotation: s.rotation ?? 12,
        flipX: s.flipX || false,
        start: {
            x: s.offsetXStart ?? s.offsetX ?? -90,
            y: s.offsetYStart ?? s.offsetY ?? -90,
            scale: s.scaleStart ?? s.scale ?? 1.1,
            rotation: s.rotationStart ?? s.rotation ?? 12,
        }
      };
      if (s.lineColor || s.smokeColor) {
        // Clone config to override colors
        skinConfig = { ...skinConfig } as any;
        
        if (s.smokeColor) {
           skinConfig.fire = [
             { offset: '0%', color: '#ffffff', opacity: 1 },
             { offset: '20%', color: s.smokeColor, opacity: 1 },
             { offset: '55%', color: s.smokeColor2 || s.smokeColor, opacity: 1 },
             { offset: '100%', color: s.smokeColor2 || s.smokeColor, opacity: 0 }
           ];
           skinConfig.areaColor = s.smokeColor;
           (skinConfig as any).areaColor2 = s.smokeColor2 || s.smokeColor;
        }
        if (s.lineColor) {
           skinConfig.areaColor = s.lineColor;
           (skinConfig as any).lineColor2 = s.lineColor2 || s.lineColor;
        }
      }
    }

  const [isShaking, setIsShaking] = useState(false);
  const [showHud, setShowHud] = useState(true); 
  
  // Refs para Manipulação Direta do DOM (Performance 60FPS)
  const gridRef = useRef<HTMLDivElement>(null);
  const multiplierTextRef = useRef<HTMLHeadingElement>(null);
  const planeGroupRef = useRef<SVGGElement>(null);
  const customGroupRef = useRef<SVGGElement>(null);
  const customImageRef = useRef<SVGImageElement>(null);
  const curvePathRef = useRef<SVGPathElement>(null);
  const areaPathRef = useRef<SVGPathElement>(null);
  const shockwaveRef = useRef<SVGCircleElement>(null);
  
  // Refs para Altitude e Telemetria em Tempo Real (60/120 FPS)
  const altitudeTextRef = useRef<HTMLSpanElement>(null);
  const altitudeLevelRef = useRef<HTMLSpanElement>(null);
  const altitudeRateRef = useRef<HTMLSpanElement>(null);
  const altitudeBarRef = useRef<HTMLDivElement>(null);
  const altitudePulseRef = useRef<HTMLSpanElement>(null);

  // Armazena com precisão a altitude, nível e taxa reais durante o voo
  const lastRealAltitudeRef = useRef<number>(0);
  const lastRealLevelRef = useRef<string>('SOLO');
  const lastRealRateRef = useRef<string>('PISTA 09L');
  const lastRealBarPctRef = useRef<number>(4);

  // Refs para Tripulação em Tempo Real (Contagem de Pessoas Reais na Rodada)
  const statsRef = useRef(stats);
  const lockedRoundCrewRef = useRef<number>(0);
  const isCrewLockedRef = useRef<boolean>(false);
  const crewTextRef = useRef<HTMLSpanElement>(null);
  const crewWinnersTextRef = useRef<HTMLSpanElement>(null);
  const crewWinnersContainerRef = useRef<HTMLDivElement>(null);
  const crewStatusLabelRef = useRef<HTMLSpanElement>(null);
  const crewPulseRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    statsRef.current = stats;
    const currentRealCount = stats?.count || 0;
    const currentWinners = stats?.winnersCount || 0;

    if (status === GameStatus.WAITING) {
      lockedRoundCrewRef.current = currentRealCount;
      if (crewTextRef.current) crewTextRef.current.textContent = String(currentRealCount);
      if (crewStatusLabelRef.current) {
        crewStatusLabelRef.current.textContent = currentRealCount > 0 ? 'EMBARCANDO...' : 'EMBARQUE ABERTO';
      }
    } else if (status === GameStatus.FLYING) {
      const totalInRound = Math.max(lockedRoundCrewRef.current, currentRealCount);
      lockedRoundCrewRef.current = totalInRound;
      const remaining = Math.max(0, totalInRound - currentWinners);
      if (crewTextRef.current) crewTextRef.current.textContent = String(remaining);
      if (crewWinnersTextRef.current) crewWinnersTextRef.current.textContent = String(currentWinners);
      if (crewWinnersContainerRef.current) crewWinnersContainerRef.current.style.display = currentWinners > 0 ? 'flex' : 'none';
    }
  }, [stats, status]);
  
  const requestRef = useRef<number>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const prevStatusRef = useRef<GameStatus>(status);
  const crashStartTimeRef = useRef<number | null>(null);
  const flightStartTimeRef = useRef<number | null>(null);
  const waitingStartTimeRef = useRef<number | null>(null);
  
  // Guardamos a última posição para animar o crash a partir dela
  const lastFlightPositionRef = useRef({ x: 160, y: 500, rotation: 0 });

  const multiplierRef = useRef(multiplier);
  const smoothMultiplierRef = useRef(1.00);
  const latestFlightMultiplierRef = useRef<number>(1.00);
  const finalCrashMultiplierRef = useRef<number | null>(null);
  const [crashedMultiplier, setCrashedMultiplier] = useState<number>(1.00);

  useEffect(() => {
    multiplierRef.current = multiplier;
  }, [multiplier]);

  useEffect(() => {
    if (status === GameStatus.FLYING) {
      finalCrashMultiplierRef.current = null;
      isCrewLockedRef.current = true;
      lockedRoundCrewRef.current = Math.max(lockedRoundCrewRef.current, statsRef.current?.count || 0);
      if (prevStatusRef.current !== GameStatus.FLYING) {
        flightStartTimeRef.current = Date.now();
        smoothMultiplierRef.current = 1.00;
      } else if (!flightStartTimeRef.current) {
        const elapsedSeconds = Math.log(Math.max(1.0001, multiplierRef.current)) / Math.log(1.12);
        flightStartTimeRef.current = Date.now() - (elapsedSeconds * 1000);
        smoothMultiplierRef.current = multiplierRef.current;
      }
    }
    
    if (status === GameStatus.CRASHED) {
      const finalMult = Math.max(multiplier, multiplierRef.current, latestFlightMultiplierRef.current, 1.00);
      finalCrashMultiplierRef.current = finalMult;
      setCrashedMultiplier(finalMult);
      multiplierRef.current = finalMult;
      
      const alt = getAltitudeFromMultiplier(finalMult, false);
      if (altitudeTextRef.current) {
        altitudeTextRef.current.textContent = alt.text;
      }
      if (altitudeRateRef.current) {
        altitudeRateRef.current.textContent = `FINAL (${alt.validMult.toFixed(2)}x)`;
        altitudeRateRef.current.className = 'text-[8px] sm:text-[9px] font-black font-mono tracking-tight shrink-0 text-cyan-400';
      }
      if (altitudeLevelRef.current) {
        altitudeLevelRef.current.textContent = alt.level;
      }
      if (altitudeBarRef.current) {
        altitudeBarRef.current.style.height = `${alt.barPct}%`;
      }
      if (altitudePulseRef.current) {
        altitudePulseRef.current.className = 'w-1.5 h-1.5 rounded-full shrink-0 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]';
      }

      if (!crashStartTimeRef.current) {
        crashStartTimeRef.current = Date.now();
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
      }
    }
    
    if (status === GameStatus.WAITING) {
      finalCrashMultiplierRef.current = null;
      crashStartTimeRef.current = null;
      flightStartTimeRef.current = null;
      waitingStartTimeRef.current = Date.now();
      isCrewLockedRef.current = false;
      const realWaitingCount = statsRef.current?.count || 0;
      lockedRoundCrewRef.current = realWaitingCount;

      if (crewTextRef.current) {
        crewTextRef.current.textContent = String(realWaitingCount);
      }
      if (crewStatusLabelRef.current) {
        crewStatusLabelRef.current.textContent = realWaitingCount > 0 ? 'EMBARCANDO...' : 'EMBARQUE ABERTO';
      }
      if (crewWinnersContainerRef.current) {
        crewWinnersContainerRef.current.style.display = 'none';
      }
      if (crewPulseRef.current) {
        crewPulseRef.current.className = 'w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400 animate-ping shadow-[0_0_6px_rgba(251,191,36,0.9)]';
      }

      // Reset visual elements immediately
      if (planeGroupRef.current) {
        planeGroupRef.current.setAttribute('transform', `translate(160, 500) rotate(0) scale(1.6)`);
        planeGroupRef.current.setAttribute('opacity', '1');
      }
      if (curvePathRef.current) curvePathRef.current.setAttribute('d', '');
      if (areaPathRef.current) areaPathRef.current.setAttribute('d', '');
      if (shockwaveRef.current) shockwaveRef.current.setAttribute('opacity', '0');
    } else {
      waitingStartTimeRef.current = null;
    }

    prevStatusRef.current = status;
  }, [status, multiplier]);

  const customOffsetRef = useRef(customOffset);
  useEffect(() => {
    customOffsetRef.current = customOffset;
  }, [customOffset]);

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
        const alt = getAltitudeFromMultiplier(displayMult, false);

        // Calcula o tempo decorrido preciso com base na fórmula exponencial do multiplicador
        const flightTimeElapsed = Math.max(0, Math.log(Math.max(1.0001, displayMult)) / Math.log(1.12));

        // Atualiza Texto com FPS do Monitor (silky smooth)
        if (multiplierTextRef.current) {
            multiplierTextRef.current.textContent = alt.validMult.toFixed(2) + 'x';
        }

        // Guarda a telemetria real contínua do voo
        latestFlightMultiplierRef.current = alt.validMult;
        lastRealAltitudeRef.current = alt.meters;
        lastRealLevelRef.current = alt.level;
        lastRealRateRef.current = alt.rate;
        lastRealBarPctRef.current = alt.barPct;

        if (altitudeTextRef.current) {
          altitudeTextRef.current.textContent = alt.text;
        }

        if (altitudeRateRef.current) {
          altitudeRateRef.current.textContent = alt.rate;
          altitudeRateRef.current.className = 'text-[8px] sm:text-[9px] font-black font-mono tracking-tight shrink-0 text-emerald-400';
        }

        if (altitudeLevelRef.current) {
          altitudeLevelRef.current.textContent = alt.level;
        }

        if (altitudeBarRef.current) {
          altitudeBarRef.current.style.height = `${alt.barPct}%`;
        }

        if (altitudePulseRef.current) {
          altitudePulseRef.current.className = 'w-1.5 h-1.5 rounded-full shrink-0 bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.9)]';
        }

        // Atualiza Tripulação em Voo (diminui em tempo real conforme as pessoas sacam)
        const totalInRound = Math.max(lockedRoundCrewRef.current, statsRef.current?.count || 0);
        lockedRoundCrewRef.current = totalInRound;
        const realWinners = statsRef.current?.winnersCount || 0;
        const remainingInFlight = Math.max(0, totalInRound - realWinners);

        if (crewTextRef.current) {
          crewTextRef.current.textContent = String(remainingInFlight);
        }
        if (crewWinnersTextRef.current) {
          crewWinnersTextRef.current.textContent = String(realWinners);
        }
        if (crewWinnersContainerRef.current) {
          crewWinnersContainerRef.current.style.display = realWinners > 0 ? 'flex' : 'none';
        }
        if (crewStatusLabelRef.current) {
          crewStatusLabelRef.current.textContent = 'EM VOO';
        }
        if (crewPulseRef.current) {
          crewPulseRef.current.className = 'w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]';
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

        // Smooth up and down oscillation during flight (Turbulence / Air Pockets)
        let flightOscillation = 0;
        let rotationOscillation = 0;
        
        if (flightTimeElapsed > 1.0) {
            // Amplitude grows gently as game progresses, maxing out at 35px
            const oscillationMag = Math.min(35, 10 + progress * 50); 
            // Slower, majestic sine wave
            flightOscillation = Math.sin(time / 900) * oscillationMag;
            // Cosine wave for rotation gives a natural pitch up/down feeling
            rotationOscillation = Math.cos(time / 900) * (oscillationMag / 2.5);
        }

        // Apply oscillation but never go safely below floor
        if (calculatedY < floorY - 20) {
           planeY += flightOscillation;
           planeY = Math.max(minY - 20, Math.min(floorY - 20, planeY));
        }

        const baseRotation = -5 - Math.min(25, (planeY < floorY - 5 ? (progress * 20) + (flightTimeElapsed * 2) : 0));
        const rotation = baseRotation + rotationOscillation;
        
        // Engine Vibration
        const vibration = Math.sin(time / 15) * (0.8 + progress * 2.5);
        
        // Save for crash
        lastFlightPositionRef.current = { x: planeX, y: planeY, rotation };

        // Apply Transform to Plane Group
        if (planeGroupRef.current) {
            const scale = 1.6 + progress * 0.25;
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
        // --- CRASH LOGIC (FLIGHT ESCAPE / VOOU PARA LONGE) ---
        speed = 0.8;
        if (!crashStartTimeRef.current) {
          crashStartTimeRef.current = Date.now();
        }
        const elapsed = (Date.now() - crashStartTimeRef.current) / 1000;
        
        // Alinha imediatamente com o valor final oficial do crash
        smoothMultiplierRef.current = currentMult;

        // Posição de escape suave e progressiva (decolagem para longe sem cortes bruscos)
        const startCrashX = Math.max(260, lastFlightPositionRef.current.x);
        const startCrashY = Math.min(420, lastFlightPositionRef.current.y);
        
        // Aceleração exponencial supersônica cinematográfica
        const progress = Math.min(1, elapsed / 2.2);
        const hyperSpeed = Math.pow(progress, 2.2);
        const planeX = startCrashX + (elapsed * 500) + (hyperSpeed * 1300);
        const planeY = startCrashY - (elapsed * 300) - (hyperSpeed * 850);
        const rotation = lastFlightPositionRef.current.rotation - Math.min(30, elapsed * 18);
        const scale = Math.max(0.15, 1.6 - (progress * 1.35));
        const opacity = Math.max(0, 1 - (elapsed / 2.2));

        if (planeGroupRef.current) {
             planeGroupRef.current.setAttribute('transform', `translate(${planeX}, ${planeY}) rotate(${rotation}) scale(${scale})`);
             planeGroupRef.current.setAttribute('opacity', String(opacity));
        }

        // Sonic boom shockwave expansion
        if (shockwaveRef.current) {
             const shockRadius = Math.min(220, elapsed * 300);
             const shockOpacity = Math.max(0, 1 - (elapsed / 0.9));
             shockwaveRef.current.setAttribute('cx', String(startCrashX));
             shockwaveRef.current.setAttribute('cy', String(startCrashY));
             shockwaveRef.current.setAttribute('r', String(shockRadius));
             shockwaveRef.current.setAttribute('opacity', String(shockOpacity));
        }

        // Mantém a curva/rastro do voo desenhada com perfeição até o ponto final alcançado
        const curveEndX = Math.max(startX + 20, lastFlightPositionRef.current.x);
        const finalPathY = lastFlightPositionRef.current.y;
        const cp1x = startX + (curveEndX - startX) * 0.5;
        const cp1y = floorY;
        const cp2x = startX + (curveEndX - startX) * 0.8;
        const cp2y = floorY - (floorY - finalPathY) * 0.2;
        const d = `M ${startX} ${floorY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curveEndX} ${finalPathY}`;
        
        if (curvePathRef.current) curvePathRef.current.setAttribute('d', d);
        if (areaPathRef.current) areaPathRef.current.setAttribute('d', `${d} L ${curveEndX} ${floorY} Z`);

        // Mantém e exibe a altitude e métrica REAL exata alcançada pelo avião quando voou pra longe
        if (finalCrashMultiplierRef.current === null) {
          finalCrashMultiplierRef.current = Math.max(multiplier, multiplierRef.current, latestFlightMultiplierRef.current, 1.00);
        }
        const finalCrashMult = finalCrashMultiplierRef.current;
        const alt = getAltitudeFromMultiplier(finalCrashMult, false);

        if (altitudeTextRef.current) {
          altitudeTextRef.current.textContent = alt.text;
        }
        if (altitudeRateRef.current) {
          altitudeRateRef.current.textContent = `FINAL (${alt.validMult.toFixed(2)}x)`;
          altitudeRateRef.current.className = 'text-[8px] sm:text-[9px] font-black font-mono tracking-tight shrink-0 text-cyan-400';
        }
        if (altitudeLevelRef.current) {
          altitudeLevelRef.current.textContent = alt.level;
        }
        if (altitudeBarRef.current) {
          altitudeBarRef.current.style.height = `${alt.barPct}%`;
        }
        if (altitudePulseRef.current) {
          altitudePulseRef.current.className = 'w-1.5 h-1.5 rounded-full shrink-0 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]';
        }

        // Tripulação congelada no fim do voo
        if (crewPulseRef.current) {
          crewPulseRef.current.className = 'w-1.5 h-1.5 rounded-full shrink-0 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]';
        }
        if (crewStatusLabelRef.current) {
          crewStatusLabelRef.current.textContent = 'FINAL';
        }

      } else {
         // --- WAITING LOGIC ---
         if (multiplierTextRef.current) {
            multiplierTextRef.current.textContent = '1.00x';
         }

         lastRealAltitudeRef.current = 0;
         lastRealLevelRef.current = 'SOLO';
         lastRealRateRef.current = 'PISTA 09L';
         lastRealBarPctRef.current = 4;

         if (altitudeTextRef.current) {
            altitudeTextRef.current.textContent = '0 m';
         }
         if (altitudeRateRef.current) {
            altitudeRateRef.current.textContent = 'PISTA 09L';
            altitudeRateRef.current.className = 'text-[8px] sm:text-[9px] font-black font-mono tracking-tight shrink-0 text-white/30';
         }
         if (altitudeLevelRef.current) {
            altitudeLevelRef.current.textContent = 'SOLO';
         }
         if (altitudeBarRef.current) {
            altitudeBarRef.current.style.height = '4%';
         }
         if (altitudePulseRef.current) {
            altitudePulseRef.current.className = 'w-1.5 h-1.5 rounded-full shrink-0 bg-white/30';
         }

         // Tripulação embarcando em tempo real conforme entram na rodada
         const realWaitingCount = statsRef.current?.count || 0;
         lockedRoundCrewRef.current = realWaitingCount;

         if (crewTextRef.current) {
            crewTextRef.current.textContent = String(realWaitingCount);
         }
         if (crewStatusLabelRef.current) {
            crewStatusLabelRef.current.textContent = realWaitingCount > 0 ? 'EMBARCANDO...' : 'EMBARQUE ABERTO';
         }
         if (crewWinnersContainerRef.current) {
            crewWinnersContainerRef.current.style.display = 'none';
         }
         if (crewPulseRef.current) {
            crewPulseRef.current.className = 'w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400 animate-ping shadow-[0_0_6px_rgba(251,191,36,0.9)]';
         }
         
         // Bobbing effect while waiting
         const bobbing = Math.sin(time / 250) * 1.5;
         if (planeGroupRef.current) {
             planeGroupRef.current.setAttribute('transform', `translate(160, ${500 + bobbing}) rotate(0) scale(1.6)`);
         }
      }

      // Update Grid Position (Hardware-accelerated silky smooth drift with translate3d)
      offsetRef.current.x = (offsetRef.current.x + speed) % 120;
      offsetRef.current.y = (offsetRef.current.y - speed * 0.3) % 120;

      if (gridRef.current) {
        gridRef.current.style.transform = `translate3d(${-offsetRef.current.x}px, ${-offsetRef.current.y}px, 0)`;
      }

      // Smooth transition for custom offsets
      let easeProgress = 0;
      if (status === GameStatus.FLYING) {
         const tMult = multiplierRef.current;
         const flightTimeElapsed = Math.max(0, Math.log(Math.max(1.0001, tMult)) / Math.log(1.12));
         easeProgress = Math.min(1, flightTimeElapsed / 1.0); 
      } else if (status === GameStatus.CRASHED) {
         easeProgress = 1;
      }
      const co = customOffsetRef.current;
      const curOffsetX = co.start.x + (co.x - co.start.x) * easeProgress;
      const curOffsetY = co.start.y + (co.y - co.start.y) * easeProgress;
      const curScale = co.start.scale + (co.scale - co.start.scale) * easeProgress;
      const curRotation = co.start.rotation + (co.rotation - co.start.rotation) * easeProgress;
      
      if (customGroupRef.current) customGroupRef.current.setAttribute('transform', `translate(-10, -5) scale(${curScale}) rotate(${curRotation})`);
      if (customImageRef.current) {
          customImageRef.current.setAttribute('x', String(curOffsetX));
          customImageRef.current.setAttribute('y', String(curOffsetY));
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
  const finalEffectiveMult = isCrashed 
    ? (finalCrashMultiplierRef.current || (multiplier > 1.0 ? multiplier : (crashedMultiplier > 1.0 ? crashedMultiplier : 1.00))) 
    : multiplier;
  const initialAltitudeData = getAltitudeFromMultiplier(finalEffectiveMult, isWaiting);

  // Contagem de pessoas reais na rodada em tempo real
  const realRoundCount = stats?.count || 0;
  const realWinnersCount = stats?.winnersCount || 0;
  const inFlightCount = isWaiting 
    ? realRoundCount 
    : Math.max(0, Math.max(lockedRoundCrewRef.current, realRoundCount) - realWinnersCount);

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
        <div className="absolute inset-0 bg-gradient-to-tr from-[#020204] via-[#050609] to-[#010103] opacity-100 transition-colors duration-1000 z-0" />
        
        {/* Custom Background Image/Video with Blur, Fit and Opacity (Seamless transition without black flash) */}
        <SeamlessCanvasBackground 
          config={canvasBgConfig} 
          activeImage={activeCanvasBgImage} 
          activeVideo={activeCanvasBgVideo} 
        />
        
        {/* Dynamic Theme Glow Blobs synced with selected skin color - Hiden when custom background is active to avoid blur/fog overlap */}
        {!canvasBgConfig?.enabled && (
          <>
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
          </>
        )}

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
      
      {/* Canto Inferior Direito: Tripulação em Voo (Tempo Real) */}
      {showHud && (
        <div className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-40 pointer-events-none select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-black/65 sm:bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-2.5 sm:gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.6)] border-r-2 border-r-emerald-400">
            {/* Informações da Tripulação */}
            <div className="flex flex-col text-right">
              {/* Header Label com Indicador de Status */}
              <div className="flex items-center justify-end gap-1.5 mb-0.5">
                <span 
                  ref={crewStatusLabelRef}
                  className="text-[7px] sm:text-[7.5px] font-bold uppercase tracking-wider text-white/50 truncate"
                >
                  {isWaiting 
                    ? (realRoundCount > 0 ? 'EMBARCANDO...' : 'EMBARQUE ABERTO') 
                    : isFlying 
                    ? 'EM VOO' 
                    : 'FINAL'}
                </span>
                <span className="text-white/20 text-[7px]">•</span>
                <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400 font-mono">
                  TRIPULAÇÃO
                </span>
                <span 
                  ref={crewPulseRef}
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isFlying 
                      ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]' 
                      : isCrashed 
                      ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]' 
                      : 'bg-amber-400 animate-ping shadow-[0_0_6px_rgba(251,191,36,0.9)]'
                  }`} 
                />
              </div>

              {/* Contadores da Tripulação em Voo e Saques */}
              <div className="flex items-center justify-end gap-2">
                {/* Tripulantes que já Sacaram */}
                <div 
                  ref={crewWinnersContainerRef}
                  className="items-baseline gap-1"
                  style={{ display: !isWaiting && realWinnersCount > 0 ? 'flex' : 'none' }}
                >
                  <span 
                    ref={crewWinnersTextRef}
                    className="font-black italic text-sm sm:text-base text-[#d97d1b] font-mono leading-none tracking-tight tabular-nums drop-shadow-md"
                  >
                    {realWinnersCount}
                  </span>
                  <span className="text-[7.5px] sm:text-[8px] font-bold text-[#d97d1b]/70 uppercase tracking-wider leading-none">
                    Sacou
                  </span>
                  <div className="h-3.5 w-px bg-white/10 ml-1" />
                </div>

                {/* Tripulação Ativa no Voo */}
                <div className="flex items-baseline gap-1">
                  <span 
                    ref={crewTextRef}
                    className="font-black italic text-base sm:text-lg md:text-xl text-white font-mono leading-none tracking-tight tabular-nums drop-shadow-md"
                  >
                    {inFlightCount}
                  </span>
                  <span className="text-[7.5px] sm:text-[8px] font-bold text-white/40 uppercase tracking-wider leading-none">
                    {isWaiting ? 'A Bordo' : 'No Voo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ícone de Tripulação com Avião */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-emerald-400 shadow-inner">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Canto Inferior Esquerdo: Telemetria & Altitude de Voo em Tempo Real */}
      {showHud && (
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-40 pointer-events-none select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-black/65 sm:bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-2 sm:gap-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] border-l-2 border-l-cyan-400">
            {/* Medidor visual de altitude vertical (Altimeter Bar) */}
            <div className="flex flex-col items-center justify-end h-7 sm:h-8 w-1.5 sm:w-2 bg-white/10 rounded-full overflow-hidden p-0.5 shrink-0">
              <div 
                ref={altitudeBarRef}
                className="w-full bg-gradient-to-t from-cyan-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-150 ease-linear shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                style={{ height: `${initialAltitudeData.barPct}%` }}
              />
            </div>

            {/* Dados do Instrumento */}
            <div className="flex flex-col">
              {/* Rótulo Superior com Indicador de Status */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <span 
                  ref={altitudePulseRef}
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isWaiting 
                      ? 'bg-white/30' 
                      : isCrashed 
                      ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                      : 'bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.9)]'
                  }`} 
                />
                <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-cyan-300/80 font-mono">
                  ALTITUDE
                </span>
                <span className="text-white/20 text-[7px]">•</span>
                <span 
                  ref={altitudeLevelRef}
                  className="text-[7px] sm:text-[7.5px] font-bold uppercase tracking-wider text-white/50 truncate max-w-[85px] sm:max-w-[120px]"
                >
                  {initialAltitudeData.level}
                </span>
              </div>

              {/* Valor Principal da Altitude e Taxa Vertical */}
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span 
                  ref={altitudeTextRef}
                  className="font-black italic text-sm sm:text-base md:text-lg text-white font-mono leading-none tracking-tight tabular-nums drop-shadow-md"
                >
                  {initialAltitudeData.text}
                </span>

                <span 
                  ref={altitudeRateRef}
                  className={`text-[8px] sm:text-[9px] font-black font-mono tracking-tight shrink-0 ${
                    isWaiting ? 'text-white/30' : isCrashed ? 'text-cyan-400' : 'text-emerald-400'
                  }`}
                >
                  {isWaiting ? 'PISTA 09L' : isCrashed ? `FINAL (${initialAltitudeData.validMult.toFixed(2)}x)` : initialAltitudeData.rate}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="z-30 text-center select-none pointer-events-none absolute w-full px-4 flex flex-col items-center">
        {isWaiting && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-3 py-1.5 px-5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md shadow-lg">
               <div className="flex items-center font-black text-lg italic tracking-tighter uppercase">
                  <span className="text-[#e51a31]">AERO</span>
                  <span className="text-white">game</span>
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
                       style={{ width: `${(countdown / WAIT_TIME) * 100}%` }}
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
          <div className="flex flex-col items-center justify-center animate-in zoom-in-90 duration-300 px-4 text-center z-40">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/90 border border-red-500/50 shadow-[0_0_25px_rgba(229,26,49,0.6)] mb-2 animate-bounce">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e51a31] animate-ping" />
              <span className="text-[#ff3850] text-xs sm:text-sm font-black uppercase tracking-widest">
                FIM DE VOO
              </span>
            </div>
            <h2 className="text-[#e51a31] text-3xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-1 drop-shadow-[0_0_50px_rgba(229,26,49,0.9)] whitespace-nowrap select-none animate-pulse">
              VOOU PARA LONGE!
            </h2>
            <div className="text-white text-6xl sm:text-8xl md:text-9xl font-black italic opacity-95 tabular-nums drop-shadow-[0_0_40px_rgba(229,26,49,0.6)] select-none">
              {finalEffectiveMult.toFixed(2)}x
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
            <stop offset="100%" stopColor={(skinConfig as any).areaColor2 || skinConfig.areaColor} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineColorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={(skinConfig as any).lineColor2 || skinConfig.areaColor} />
            <stop offset="100%" stopColor={skinConfig.areaColor} />
          </linearGradient>
        </defs>

        {/* Shockwave circle during crash flight away */}
        <circle 
          ref={shockwaveRef} 
          cx="0" 
          cy="0" 
          r="0" 
          fill="none" 
          stroke="#ff2d55" 
          strokeWidth="6" 
          filter="url(#neonGlow)" 
          opacity="0" 
        />

        {!isCrashed && (
           <ellipse 
              cx={isWaiting ? 150 : -100} cy={525} rx={50} ry={8} 
              fill="rgba(0,0,0,0.3)" filter="blur(8px)"
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
                stroke="url(#lineColorGradient)" 
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
          <g ref={customGroupRef} transform={`translate(-10, -5) scale(${customOffset.start.scale}) rotate(${customOffset.start.rotation})`}>
            <image 
              ref={customImageRef}
              href={s ? (getCustomSkinImage(activeSkin!) || `/images/skin_${activeSkin}.png`) : `/images/skin_${activeSkin || 'aerobrasil'}.png`} 
              x={customOffset.start.x} 
              y={customOffset.start.y} 
              width="180" 
              height="180" 
              style={{ 
                mixBlendMode: 'normal', 
                filter: 'drop-shadow(0px 8px 14px rgba(0,0,0,0.85))',
                transform: customOffset.flipX ? 'scaleX(-1)' : 'none',
                transformOrigin: 'center'
              }}
            />
          </g>
          
        </g>
      </svg>
    </div>
  );
};

export default GameCanvas;
