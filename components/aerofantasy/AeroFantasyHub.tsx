import React, { useState, useEffect } from 'react';
import { GameStatus } from '../../types';
import HallDasSalas from './HallDasSalas';

interface CompetitionRoom {
  id: string;
  roomNumber: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  totalFlights: number;
  countdownSeconds: number;
  status: 'open' | 'forming' | 'live';
  duration: string;
  entryFee: number;
  prizePool: string;
  topScore?: number;
}

interface AeroFantasyHubProps {
  onSelectMode: (mode: 'aerogame' | 'aerobet' | 'aerofantasy' | 'store' | 'hangar') => void;
  onOpenPortal?: () => void;
  activeEventId: string | null;
  fantasyFlightsLeft: number | null;
  userFantasyScore?: number;
  userFantasyFlightsUsed?: number;
  userFantasyMaxMult?: number;
  myFantasyRank?: number;
  pointsToClimb?: number;
  aheadCompetitorName?: string;
  targetView?: 'room' | 'hall';
  onOpenDeposit?: () => void;
  onJoinCompetition: (roomId: string, cost: number, flights: number) => void;
  onExitCompetition?: () => void;
  userBalance: number;
  currentMultiplier?: number;
  gameStatus?: GameStatus;
  currentUsername?: string;
}

export const AeroFantasyHub: React.FC<AeroFantasyHubProps> = ({
  onSelectMode,
  onOpenPortal,
  activeEventId,
  fantasyFlightsLeft,
  userFantasyScore = 0,
  userFantasyFlightsUsed = 0,
  userFantasyMaxMult = 0,
  myFantasyRank = 1,
  pointsToClimb = 0,
  aheadCompetitorName,
  targetView,
  onOpenDeposit,
  onJoinCompetition,
  onExitCompetition,
  userBalance,
  currentMultiplier = 1.0,
  gameStatus = GameStatus.WAITING,
  currentUsername = 'Piloto'
}) => {
  // Sub-navigation view: overview vs hall das salas (Início como padrão)
  const [activeSubView, setActiveSubView] = useState<'overview' | 'hall'>('overview');

  useEffect(() => {
    if (targetView === 'room' || targetView === 'hall') {
      setActiveSubView('hall');
    } else if (!activeEventId) {
      setActiveSubView('overview');
    }
  }, [targetView, activeEventId]);

  // Modal states for shortcuts and details
  const [activeModal, setActiveModal] = useState<'ranking' | 'myCompetitions' | 'history' | 'rules' | 'allRooms' | null>(null);

  // Live competition rooms with ticking countdowns
  const [rooms, setRooms] = useState<CompetitionRoom[]>([
    {
      id: 'sala-1024',
      roomNumber: '#1024',
      name: 'Arena Relâmpago Alpha',
      currentPlayers: 82,
      maxPlayers: 100,
      totalFlights: 100,
      countdownSeconds: 134, // 02:14
      status: 'open',
      duration: '1 hora',
      entryFee: 0,
      prizePool: 'R$ 2.500',
      topScore: 9842
    },
    {
      id: 'sala-1025',
      roomNumber: '#1025',
      name: 'Copa Supersônica Beta',
      currentPlayers: 41,
      maxPlayers: 50,
      totalFlights: 100,
      countdownSeconds: 332, // 05:32
      status: 'open',
      duration: '1 hora',
      entryFee: 10,
      prizePool: 'R$ 5.000',
      topScore: 9615
    },
    {
      id: 'sala-1026',
      roomNumber: '#1026',
      name: 'Duelo de Ases VIP',
      currentPlayers: 8,
      maxPlayers: 10,
      totalFlights: 100,
      countdownSeconds: 68, // 01:08
      status: 'open',
      duration: '1 hora',
      entryFee: 25,
      prizePool: 'R$ 10.000',
      topScore: 9401
    }
  ]);

  // Featured Main Room (Sala em Formação)
  const [featuredRoom, setFeaturedRoom] = useState({
    id: 'sala-featured',
    roomNumber: '#1024',
    currentPlayers: 73,
    maxPlayers: 100,
    totalFlights: 100,
    duration: '1 hora',
    entryFee: 0,
    prizePool: 'R$ 15.000'
  });

  // Ticking countdown effect for real-time rooms
  useEffect(() => {
    const timer = setInterval(() => {
      setRooms(prev => prev.map(room => {
        if (room.countdownSeconds <= 1) {
          return {
            ...room,
            countdownSeconds: Math.floor(Math.random() * 200) + 60,
            currentPlayers: Math.min(room.maxPlayers, room.currentPlayers + 1)
          };
        }
        return {
          ...room,
          countdownSeconds: room.countdownSeconds - 1
        };
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEnterRoom = (room: { id: string; entryFee?: number; totalFlights?: number; roomNumber?: string }) => {
    onJoinCompetition(room.id, room.entryFee || 0, room.totalFlights || 100);
    onSelectMode('aerogame');
  };

  // Weekly Leaderboard Data
  const weeklyLeaders = [
    { rank: 1, name: 'PLAYER_07', score: '9.842', badge: 'bg-amber-400 text-black', border: 'border-amber-400/40', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' },
    { rank: 2, name: 'FLYER99', score: '9.615', badge: 'bg-slate-300 text-black', border: 'border-slate-300/40', glow: 'shadow-[0_0_15px_rgba(203,213,225,0.25)]' },
    { rank: 3, name: 'AVIATORX', score: '9.401', badge: 'bg-amber-600 text-white', border: 'border-amber-600/40', glow: 'shadow-[0_0_15px_rgba(217,119,6,0.25)]' }
  ];

  const fullRanking = [
    ...weeklyLeaders,
    { rank: 4, name: 'SKY_KING', score: '9.120', badge: 'bg-white/10 text-white', border: 'border-white/10', glow: '' },
    { rank: 5, name: 'JET_STREAM', score: '8.980', badge: 'bg-white/10 text-white', border: 'border-white/10', glow: '' },
    { rank: 6, name: 'FALCON_BR', score: '8.740', badge: 'bg-white/10 text-white', border: 'border-white/10', glow: '' },
    { rank: 7, name: 'TURBO_ACE', score: '8.610', badge: 'bg-white/10 text-white', border: 'border-white/10', glow: '' },
    { rank: 8, name: 'SONIC_BOOM', score: '8.450', badge: 'bg-white/10 text-white', border: 'border-white/10', glow: '' },
    { rank: 9, name: currentUsername, score: activeEventId ? '7.920' : '0', badge: 'bg-sky-400 text-black', border: 'border-sky-400', glow: 'shadow-[0_0_15px_rgba(56,189,248,0.4)]' }
  ];

  if (activeSubView === 'hall') {
    return (
      <div className="w-full flex-1 flex flex-col font-sans text-white select-none bg-[#030811] overflow-y-auto min-h-screen">
        {/* Sub-Header Navigation */}
        <div className="bg-[#050e1c] border-b border-[#1b3658] px-3 sm:px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubView('overview')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer border border-white/10 flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>Início</span>
            </button>
            <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-black shadow-[0_0_15px_rgba(0,180,216,0.5)] flex items-center gap-1.5">
              <span>🏛️</span>
              <span>Salas Ao Vivo</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold">
            {onOpenPortal && (
              <button 
                onClick={onOpenPortal}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600/30 via-white/10 to-sky-500/30 hover:from-red-600/50 hover:to-sky-500/50 text-white text-[11px] font-black uppercase tracking-wider border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 shadow"
                title="Trocar de modo de jogo"
              >
                <span>🔄</span>
                <span className="hidden xs:inline">Trocar Modo</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/10">
              <span className="text-white/50 hidden sm:inline text-[11px]">Saldo:</span>
              <span className="text-emerald-400 font-mono text-xs">R$ {userBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <HallDasSalas
          onSelectMode={onSelectMode}
          activeEventId={activeEventId}
          fantasyFlightsLeft={fantasyFlightsLeft}
          userFantasyScore={userFantasyScore}
          userFantasyFlightsUsed={userFantasyFlightsUsed}
          userFantasyMaxMult={userFantasyMaxMult}
          myFantasyRank={myFantasyRank}
          pointsToClimb={pointsToClimb}
          aheadCompetitorName={aheadCompetitorName}
          targetView={targetView}
          onOpenDeposit={onOpenDeposit}
          onJoinCompetition={onJoinCompetition}
          onExitCompetition={onExitCompetition}
          userBalance={userBalance}
          currentUsername={currentUsername}
          onBackToHub={() => setActiveSubView('overview')}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col font-sans text-white select-none bg-[#030811] overflow-y-auto min-h-screen">
      {/* Sub-Header Navigation */}
      <div className="bg-[#050e1c] border-b border-[#1b3658] px-3 sm:px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-black shadow-[0_0_15px_rgba(0,180,216,0.5)] flex items-center gap-1.5">
            <span>⚡</span>
            <span>Início</span>
          </div>
          <button
            onClick={() => setActiveSubView('hall')}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer border border-white/10 flex items-center gap-1.5"
          >
            <span>🏛️</span>
            <span>Salas Ao Vivo</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold">
          {onOpenPortal && (
            <button 
              onClick={onOpenPortal}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600/30 via-white/10 to-sky-500/30 hover:from-red-600/50 hover:to-sky-500/50 text-white text-[11px] font-black uppercase tracking-wider border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 shadow"
              title="Trocar de modo de jogo"
            >
              <span>🔄</span>
              <span className="hidden xs:inline">Trocar Modo</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/10">
            <span className="text-white/50 hidden sm:inline text-[11px]">Saldo:</span>
            <span className="text-emerald-400 font-mono text-xs">R$ {userBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full px-3 sm:px-5 py-4 space-y-4">
        
        {/* ============================================================== */}
        {/* 1. TOP CARD: AEROFANTASY */}
        {/* ============================================================== */}
        <section className="relative rounded-3xl overflow-hidden border border-[#1e3a60] bg-gradient-to-b from-[#0a182e] to-[#040913] p-5 sm:p-7 shadow-[0_0_30px_rgba(0,180,216,0.15)] group">
          {/* Background Jet Art */}
          <div className="absolute inset-0 pointer-events-none">
            <img 
              src="/src/assets/images/aerobet_hero_banner_1790484452760.jpg" 
              alt="AeroFantasy Supersonic Arena" 
              className="w-full h-full object-cover object-right-top opacity-55 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050c18] via-[#050c18]/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050c18] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 max-w-md space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                AERO<span className="text-[#38bdf8]">FANTASY</span>
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-sky-100/80 font-medium">
              Arena oficial de torneios esportivos. 100 voos por sala e disputas diárias.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={() => setActiveSubView('hall')}
                className="py-3 px-7 bg-gradient-to-r from-[#0062ff] to-[#00b4d8] hover:from-[#1a73e8] hover:to-[#38bdf8] active:scale-95 text-white font-black italic text-xs uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(0,180,216,0.5)] transition-all cursor-pointer flex items-center gap-2 group-hover:brightness-110"
              >
                <span>VER SALAS AO VIVO</span>
                <span className="text-sm">🏛️</span>
              </button>

              <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-wider text-white/80 uppercase bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
                <span className="text-cyan-300 font-black">ARENAS ATIVAS</span>
                <span className="text-white/40">•</span>
                <span>HALL DAS SALAS DISPONÍVEL</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 2. FEATURED CARD: AEROFANTASY (Sala em Formação) */}
        {/* ============================================================== */}
        <section className="relative rounded-3xl overflow-hidden border border-[#204573] bg-gradient-to-b from-[#091528] via-[#060e1b] to-[#030811] p-5 sm:p-7 shadow-[0_0_35px_rgba(30,64,175,0.25)]">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left: Branding & Futuristic Podium Graphic */}
            <div className="md:col-span-6 space-y-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-black text-sm shadow-[0_0_10px_rgba(56,189,248,0.5)]">
                    ⚡
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-white">
                    AEROFANTASY
                  </h2>
                </div>
                <p className="text-xs text-sky-300/80 font-medium">
                  100 voos. Um ranking. Um campeão.
                </p>
              </div>

              {/* Graphic Podium with 3 pilots */}
              <div className="relative rounded-2xl overflow-hidden border border-[#1f3f6b] bg-[#040a14] h-48 sm:h-52 flex items-center justify-center group">
                <img 
                  src="/src/assets/images/aerofantasy_podium_1790484467351.jpg" 
                  alt="AeroFantasy Champions Podium"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040a14] via-transparent to-transparent opacity-60" />
                
                {/* Podium Badges Overlay */}
                <div className="absolute bottom-2 inset-x-0 flex items-end justify-center gap-8 text-xs font-black">
                  <div className="flex flex-col items-center">
                    <span className="w-6 h-6 rounded-full bg-slate-400/20 border border-slate-300 text-slate-200 flex items-center justify-center text-[10px] shadow">
                      2
                    </span>
                  </div>
                  <div className="flex flex-col items-center -translate-y-2">
                    <span className="w-7 h-7 rounded-full bg-sky-500/30 border-2 border-sky-400 text-sky-300 flex items-center justify-center text-xs shadow-[0_0_12px_#38bdf8]">
                      1
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-500 text-amber-300 flex items-center justify-center text-[10px] shadow">
                      3
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Room Status, Progress & Join Button */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-4 bg-[#061224]/80 border border-[#1a385e] rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-sky-300 font-bold uppercase tracking-wider text-[11px]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>SALA EM FORMAÇÃO</span>
                  </div>
                  <div className="text-white font-mono font-bold text-xs">
                    <strong className="text-sky-400 text-sm font-black">{featuredRoom.currentPlayers}</strong> / {featuredRoom.maxPlayers} jogadores
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                    style={{ width: `${(featuredRoom.currentPlayers / featuredRoom.maxPlayers) * 100}%` }}
                  />
                </div>
                <div className="text-right text-[10px] font-mono text-sky-300 font-bold">
                  {Math.round((featuredRoom.currentPlayers / featuredRoom.maxPlayers) * 100)}%
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs text-white/80 pt-1">
                  <svg className="text-sky-400 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span><strong>{featuredRoom.totalFlights}</strong> VOOS POR JOGADOR · Duração: <strong>{featuredRoom.duration}</strong></span>
                </div>
              </div>

              {/* Action Button */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleEnterRoom(featuredRoom)}
                  className="w-full py-4 px-6 bg-gradient-to-r from-[#0062ff] to-[#00b4d8] hover:from-[#1a73e8] hover:to-[#38bdf8] active:scale-95 text-white font-black italic text-sm uppercase tracking-wider rounded-xl shadow-[0_0_30px_rgba(0,180,216,0.6)] transition-all cursor-pointer flex items-center justify-center gap-2 group-hover:brightness-110"
                >
                  <span>
                    {activeEventId ? `CONTINUAR COMPETIÇÃO (${fantasyFlightsLeft ?? 100} VOOS)` : 'ENTRAR NA COMPETIÇÃO'}
                  </span>
                  <span className="text-base font-bold">→</span>
                </button>

                <p className="text-[10px] text-center text-white/50 font-medium">
                  Todos começam com as mesmas oportunidades.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. COMPETIÇÕES AO VIVO > */}
        {/* ============================================================== */}
        <section className="space-y-3">
          <div 
            onClick={() => setActiveSubView('hall')}
            className="flex items-center justify-between cursor-pointer group select-none py-1"
          >
            <div className="flex items-center gap-2">
              <span className="text-sky-400 text-lg">⚡</span>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white group-hover:text-sky-400 transition-colors">
                COMPETIÇÕES AO VIVO
              </h3>
            </div>
            <span className="text-sky-400 font-bold text-sm group-hover:translate-x-1 transition-transform">
              ›
            </span>
          </div>

          {/* 3 Live Room Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {rooms.map((room, idx) => (
              <div 
                key={room.id}
                className="rounded-2xl border border-[#1b3658] bg-gradient-to-b from-[#091527] to-[#040a13] p-4 flex flex-col justify-between space-y-3 shadow-lg hover:border-sky-400/60 transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-white">
                      <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'} animate-pulse`} />
                      <span>Sala {room.roomNumber}</span>
                    </div>
                    {room.entryFee > 0 ? (
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        R$ {room.entryFee}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                        FREE
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-[11px] text-white/70">
                    <div className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      <span><strong>{room.currentPlayers}</strong> / {room.maxPlayers} jogadores</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/></svg>
                      <span><strong>{room.totalFlights}</strong> voos</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sky-300 font-mono">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>Começa em <strong>{formatCountdown(room.countdownSeconds)}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleEnterRoom(room)}
                  className="w-full py-2.5 border border-sky-500/50 hover:border-sky-400 bg-sky-500/10 hover:bg-sky-500/20 active:scale-95 text-sky-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                >
                  {activeEventId === room.id ? 'JOGAR AGORA' : 'ENTRAR'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. RANKING DA SEMANA */}
        {/* ============================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-lg">🏆</span>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                RANKING DA SEMANA
              </h3>
            </div>
            <button
              onClick={() => setActiveModal('ranking')}
              className="text-xs text-sky-400 hover:text-sky-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Ver ranking completo</span>
              <span>→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {weeklyLeaders.map((leader) => (
              <div
                key={leader.rank}
                onClick={() => setActiveModal('ranking')}
                className={`rounded-2xl border ${leader.border} bg-gradient-to-b from-[#0a182c] to-[#040913] p-3.5 flex items-center gap-3.5 shadow-lg ${leader.glow} cursor-pointer hover:brightness-110 transition-all`}
              >
                {/* Shield Badge */}
                <div className={`w-7 h-7 rounded-lg ${leader.badge} font-black text-xs flex items-center justify-center shadow shrink-0`}>
                  {leader.rank}
                </div>

                {/* Avatar with Helmet */}
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-sky-400/40 shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.4)]">
                  <img
                    src="/src/assets/images/pilot_helmet_avatar_1790484480480.jpg"
                    alt={leader.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black uppercase tracking-tight text-white truncate">
                    {leader.name}
                  </h4>
                  <p className="text-xs font-bold text-sky-400 font-mono">
                    {leader.score} <span className="text-[10px] text-white/50">pts</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. MEUS MODOS */}
        {/* ============================================================== */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 text-lg">📑</span>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              MEUS MODOS
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* AEROGAME */}
            <div
              onClick={() => onSelectMode('aerogame')}
              className="rounded-2xl border border-[#1b3658] bg-gradient-to-r from-[#071325] via-[#091b34] to-[#071325] p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-sky-400 shadow-lg transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-sky-400/30 bg-black/40 shrink-0 flex items-center justify-center">
                  <img 
                    src="/src/assets/images/aerobet_hero_banner_1790484452760.jpg" 
                    alt="AeroGame"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black italic uppercase tracking-tight text-white group-hover:text-sky-400 transition-colors">
                    AEROGAME
                  </h4>
                  <p className="text-xs text-sky-400 font-bold flex items-center gap-1">
                    <span>Jogar agora</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </p>
                </div>
              </div>
              <span className="text-xl text-sky-400/60 group-hover:text-sky-400 transition-colors">🚀</span>
            </div>

            {/* AEROFANTASY */}
            <div
              onClick={() => handleEnterRoom(featuredRoom)}
              className="rounded-2xl border border-sky-500/40 bg-gradient-to-r from-[#071325] via-[#092244] to-[#071325] p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)] transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-sky-400/40 bg-black/40 shrink-0 flex items-center justify-center text-2xl text-sky-400">
                  🏆
                </div>
                <div>
                  <h4 className="text-sm font-black italic uppercase tracking-tight text-white group-hover:text-sky-300 transition-colors">
                    AEROFANTASY
                  </h4>
                  <p className="text-xs text-sky-300 font-bold flex items-center gap-1">
                    <span>Competir</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </p>
                </div>
              </div>
              <span className="text-xl text-amber-400 group-hover:scale-110 transition-transform">⭐</span>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 6. ATALHOS (Bottom Shortcuts Bar) */}
        {/* ============================================================== */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 text-lg">👥</span>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              ATALHOS
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <button
              onClick={() => setActiveSubView('hall')}
              className="p-3.5 rounded-2xl border border-sky-500/40 bg-gradient-to-b from-[#0a1e38] to-[#061426] hover:bg-sky-500/20 hover:border-sky-400 flex flex-col items-center justify-center gap-2 text-sky-300 hover:text-white transition-all cursor-pointer shadow-md active:scale-95 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🏛️</span>
              <span className="text-xs font-bold uppercase tracking-wider">Hall das Salas</span>
            </button>

            <button
              onClick={() => setActiveModal('ranking')}
              className="p-3.5 rounded-2xl border border-[#1b3658] bg-[#071324] hover:bg-sky-500/10 hover:border-sky-400 flex flex-col items-center justify-center gap-2 text-white/80 hover:text-white transition-all cursor-pointer shadow-md active:scale-95 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🏆</span>
              <span className="text-xs font-bold uppercase tracking-wider">Ranking</span>
            </button>

            <button
              onClick={() => setActiveModal('myCompetitions')}
              className="p-3.5 rounded-2xl border border-[#1b3658] bg-[#071324] hover:bg-sky-500/10 hover:border-sky-400 flex flex-col items-center justify-center gap-2 text-white/80 hover:text-white transition-all cursor-pointer shadow-md active:scale-95 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">👥</span>
              <span className="text-xs font-bold uppercase tracking-wider">Minhas competições</span>
            </button>

            <button
              onClick={() => setActiveModal('history')}
              className="p-3.5 rounded-2xl border border-[#1b3658] bg-[#071324] hover:bg-sky-500/10 hover:border-sky-400 flex flex-col items-center justify-center gap-2 text-white/80 hover:text-white transition-all cursor-pointer shadow-md active:scale-95 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">⏱️</span>
              <span className="text-xs font-bold uppercase tracking-wider">Histórico</span>
            </button>

            <button
              onClick={() => setActiveModal('rules')}
              className="p-3.5 rounded-2xl border border-[#1b3658] bg-[#071324] hover:bg-sky-500/10 hover:border-sky-400 flex flex-col items-center justify-center gap-2 text-white/80 hover:text-white transition-all cursor-pointer shadow-md active:scale-95 group col-span-2 sm:col-span-1"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">📑</span>
              <span className="text-xs font-bold uppercase tracking-wider">Regras</span>
            </button>
          </div>
        </section>

      </div>

      {/* ============================================================== */}
      {/* MODAL: RANKING COMPLETO */}
      {/* ============================================================== */}
      {activeModal === 'ranking' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#071427] border border-sky-500/40 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(0,180,216,0.3)] overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="text-base font-black uppercase text-white tracking-wider">Placar Geral da Semana</h3>
                  <p className="text-[11px] text-sky-400">Prêmio Acumulado da Temporada: R$ 50.000</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {fullRanking.map((p) => (
                <div key={p.rank} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-md ${p.badge} font-black text-xs flex items-center justify-center`}>
                      {p.rank}
                    </span>
                    <span className="text-xs font-bold text-white uppercase">{p.name}</span>
                  </div>
                  <span className="text-xs font-mono font-black text-sky-400">{p.score} pts</span>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#040a13]">
              <button
                onClick={() => {
                  setActiveModal(null);
                  handleEnterRoom(featuredRoom);
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg"
              >
                Subir no Ranking (Jogar Sala Ativa)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: MINHAS COMPETIÇÕES */}
      {/* ============================================================== */}
      {activeModal === 'myCompetitions' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#071427] border border-sky-500/40 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(0,180,216,0.3)] overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <div>
                  <h3 className="text-base font-black uppercase text-white tracking-wider">Minhas Competições</h3>
                  <p className="text-[11px] text-sky-400">Acompanhe suas salas e voos restantes</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {activeEventId ? (
                <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-sky-300 uppercase">Competição Ativa</span>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded">EM PROGRESSO</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white">
                    <span>Voos Restantes:</span>
                    <strong className="text-sky-400 font-mono text-sm">{fantasyFlightsLeft ?? 100} / 100</strong>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setActiveModal(null);
                        onSelectMode('aerogame');
                      }}
                      className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-black text-xs uppercase rounded-xl"
                    >
                      Continuar Voo
                    </button>
                    {onExitCompetition && (
                      <button
                        onClick={() => {
                          onExitCompetition();
                          setActiveModal(null);
                        }}
                        className="px-3 py-2.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 font-bold text-xs uppercase rounded-xl border border-red-500/30"
                      >
                        Sair
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-white/50 space-y-3">
                  <span className="text-4xl block">🎯</span>
                  <p className="text-xs font-bold uppercase">Você não está em nenhuma competição no momento</p>
                  <p className="text-[11px] text-white/40 max-w-xs mx-auto">
                    Selecione uma das salas ao vivo ou a Sala em Formação para começar com 100 voos e concorrer a prêmios!
                  </p>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      handleEnterRoom(featuredRoom);
                    }}
                    className="py-2.5 px-6 bg-sky-500 hover:bg-sky-400 text-black font-black text-xs uppercase rounded-xl shadow-lg mt-2 cursor-pointer"
                  >
                    Entrar na Sala #1024
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: HISTÓRICO */}
      {/* ============================================================== */}
      {activeModal === 'history' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#071427] border border-sky-500/40 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(0,180,216,0.3)] overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏱️</span>
                <div>
                  <h3 className="text-base font-black uppercase text-white tracking-wider">Histórico de Competições</h3>
                  <p className="text-[11px] text-sky-400">Torneios e campeonatos encerrados recentemente</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-white/5 text-white/60 flex items-center justify-center">✕</button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {[
                { id: 'h1', room: 'Sala #1023', winner: 'ACE_TOPGUN', prize: 'R$ 2.500', score: '10.420 pts', date: 'Hoje às 18:00' },
                { id: 'h2', room: 'Sala #1022', winner: 'PLAYER_07', prize: 'R$ 5.000', score: '9.842 pts', date: 'Hoje às 17:00' },
                { id: 'h3', room: 'Sala #1021', winner: 'FLYER99', prize: 'R$ 1.500', score: '9.615 pts', date: 'Ontem às 22:00' },
                { id: 'h4', room: 'Sala #1020', winner: 'RED_BARON', prize: 'R$ 10.000', score: '11.200 pts', date: 'Ontem às 20:00' }
              ].map(h => (
                <div key={h.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-white">{h.room}</span>
                    <p className="text-[10px] text-white/50">Campeão: <strong className="text-sky-400">{h.winner}</strong> ({h.score})</p>
                    <span className="text-[9px] text-white/30">{h.date}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 font-mono">{h.prize}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REGRAS OFICIAIS */}
      {/* ============================================================== */}
      {activeModal === 'rules' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#071427] border border-sky-500/40 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(0,180,216,0.3)] overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📑</span>
                <div>
                  <h3 className="text-base font-black uppercase text-white tracking-wider">Regras do AeroFantasy</h3>
                  <p className="text-[11px] text-sky-400">Diretrizes da arena de competições por pontos</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-white/5 text-white/60 flex items-center justify-center">✕</button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-white/80 leading-relaxed flex-1">
              <div className="space-y-1">
                <h4 className="font-black text-sky-400 uppercase text-xs">1. Cota Fixa de 100 Voos</h4>
                <p>Todos os pilotos entram na sala com exatamente 100 voos táticos. Isso garante paridade absoluta: a vitória depende puramente de cálculo e precisão de saque.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-sky-400 uppercase text-xs">2. Como Pontuar</h4>
                <p>Cada cashout realizado com sucesso multiplica os pontos obtidos. Multiplicadores mais altos concedem mais pontos, mas lembre-se: se o caça voar para longe antes do saque, os pontos daquela rodada são zerados.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-sky-400 uppercase text-xs">3. Duração e Fechamento da Sala</h4>
                <p>As salas têm duração padrão de 1 hora. Ao término do cronômetro ou quando todos os participantes utilizarem seus 100 voos, a premiação é creditada automaticamente aos líderes do placar.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-sky-400 uppercase text-xs">4. Fair Play e Transparência</h4>
                <p>Todas as curvas de voo utilizam o mesmo gerador provably fair verificado via SHA-256 criptográfico.</p>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#040a13]">
              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: TODAS AS SALAS */}
      {/* ============================================================== */}
      {activeModal === 'allRooms' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#071427] border border-sky-500/40 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(0,180,216,0.3)] overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="text-base font-black uppercase text-white tracking-wider">Todas as Competições Ao Vivo</h3>
                  <p className="text-[11px] text-sky-400">Escolha uma sala e entre na disputa</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-white/5 text-white/60 flex items-center justify-center">✕</button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {rooms.map((room) => (
                <div key={room.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-white">Sala {room.roomNumber} - {room.name}</span>
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">{room.prizePool}</span>
                    </div>
                    <p className="text-xs text-white/60">{room.currentPlayers}/{room.maxPlayers} pilotos • 100 voos • Início em {formatCountdown(room.countdownSeconds)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      handleEnterRoom(room);
                    }}
                    className="py-2.5 px-6 bg-gradient-to-r from-blue-600 to-sky-400 text-white font-black text-xs uppercase rounded-xl shadow-lg shrink-0"
                  >
                    Entrar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AeroFantasyHub;
