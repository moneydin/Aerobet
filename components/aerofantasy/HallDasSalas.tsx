import React, { useState, useEffect, useMemo } from 'react';

export interface HallRoom {
  id: string;
  roomNumber: string;
  name: string;
  category: 'free' | 'turbo' | 'classic' | 'vip' | 'community';
  categoryLabel: string;
  currentPlayers: number;
  maxPlayers: number;
  totalFlights: number;
  countdownSeconds: number;
  status: 'forming' | 'open' | 'live';
  duration: string;
  entryFee: number;
  prizePool: string;
  prizeFirst: string;
  prizeSecond: string;
  prizeThird: string;
  topScore?: number;
  leaderName?: string;
  isPrivate?: boolean;
  pinCode?: string;
  description?: string;
}

interface HallDasSalasProps {
  onSelectMode: (mode: 'aerogame' | 'aerobet' | 'aerofantasy' | 'store' | 'hangar') => void;
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
  currentUsername?: string;
  onBackToHub?: () => void;
}

export const HallDasSalas: React.FC<HallDasSalasProps> = ({
  onSelectMode,
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
  currentUsername = 'Piloto',
  onBackToHub
}) => {
  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'turbo' | 'classic' | 'vip' | 'community'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'occupancy' | 'time' | 'prize' | 'fee'>('recommended');
  
  // Modals & Active Room Navigation
  const [checkoutRoom, setCheckoutRoom] = useState<HallRoom | null>(null);
  const [viewingRoomId, setViewingRoomId] = useState<string | null>(activeEventId);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<HallRoom | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joinSuccessMessage, setJoinSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pinPromptRoom, setPinPromptRoom] = useState<HallRoom | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Custom room creation form state
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomFee, setNewRoomFee] = useState<number>(0);
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState<number>(50);
  const [newRoomDuration, setNewRoomDuration] = useState<string>('1 hora');
  const [newRoomFlights, setNewRoomFlights] = useState<number>(100);
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState<boolean>(false);
  const [newRoomPin, setNewRoomPin] = useState<string>('');

  // Initial Rooms List
  const [rooms, setRooms] = useState<HallRoom[]>([
    {
      id: 'sala-1024',
      roomNumber: '#1024',
      name: 'Arena Relâmpago Alpha',
      category: 'free',
      categoryLabel: 'GRÁTIS • 100 VAGAS',
      currentPlayers: 84,
      maxPlayers: 100,
      totalFlights: 100,
      countdownSeconds: 134,
      status: 'open',
      duration: '1 hora',
      entryFee: 0,
      prizePool: 'R$ 2.500',
      prizeFirst: 'R$ 1.250',
      prizeSecond: 'R$ 750',
      prizeThird: 'R$ 500',
      topScore: 984.2,
      leaderName: 'PLAYER_07',
      description: 'Sala pública gratuita com premiação garantida. Todos os pilotos entram com 100 voos competitivos.'
    },
    {
      id: 'sala-1025',
      roomNumber: '#1025',
      name: 'Copa Supersônica Beta',
      category: 'classic',
      categoryLabel: 'CLÁSSICA • R$ 10',
      currentPlayers: 42,
      maxPlayers: 50,
      totalFlights: 100,
      countdownSeconds: 332,
      status: 'open',
      duration: '1 hora',
      entryFee: 10,
      prizePool: 'R$ 5.000',
      prizeFirst: 'R$ 2.500',
      prizeSecond: 'R$ 1.500',
      prizeThird: 'R$ 1.000',
      topScore: 961.5,
      leaderName: 'FLYER99',
      description: 'Competição com taxa de entrada moderada e prêmio turbinado de R$ 5.000 via PIX.'
    },
    {
      id: 'sala-1026',
      roomNumber: '#1026',
      name: 'Duelo de Ases VIP',
      category: 'vip',
      categoryLabel: 'VIP • 10 PILOTOS',
      currentPlayers: 8,
      maxPlayers: 10,
      totalFlights: 100,
      countdownSeconds: 68,
      status: 'live',
      duration: '1 hora',
      entryFee: 25,
      prizePool: 'R$ 10.000',
      prizeFirst: 'R$ 6.000',
      prizeSecond: 'R$ 2.500',
      prizeThird: 'R$ 1.500',
      topScore: 940.1,
      leaderName: 'AVIATORX',
      description: 'Mesa de elite para apenas 10 ases do ar. Alta premiação e disputa acirrada.'
    },
    {
      id: 'sala-1027',
      roomNumber: '#1027',
      name: 'Batalha dos Céus High Roller',
      category: 'vip',
      categoryLabel: 'HIGH ROLLER • R$ 50',
      currentPlayers: 19,
      maxPlayers: 25,
      totalFlights: 100,
      countdownSeconds: 495,
      status: 'forming',
      duration: '2 horas',
      entryFee: 50,
      prizePool: 'R$ 25.000',
      prizeFirst: 'R$ 14.000',
      prizeSecond: 'R$ 7.000',
      prizeThird: 'R$ 4.000',
      topScore: 1012.0,
      leaderName: 'SKY_KING',
      description: 'Maior premiação do dia. Para comandantes experientes que buscam o jackpot.'
    },
    {
      id: 'sala-1028',
      roomNumber: '#1028',
      name: 'Esquadrão Stealth Noturno',
      category: 'free',
      categoryLabel: 'GRÁTIS • ÚLTIMAS VAGAS',
      currentPlayers: 96,
      maxPlayers: 100,
      totalFlights: 100,
      countdownSeconds: 42,
      status: 'live',
      duration: '45 min',
      entryFee: 0,
      prizePool: 'R$ 1.500',
      prizeFirst: 'R$ 800',
      prizeSecond: 'R$ 450',
      prizeThird: 'R$ 250',
      topScore: 898.0,
      leaderName: 'FALCON_BR',
      description: 'Partida relâmpago gratuita noturna com encerramento rápido.'
    },
    {
      id: 'sala-1029',
      roomNumber: '#1029',
      name: 'Torneio Falcon Turbo (15 min)',
      category: 'turbo',
      categoryLabel: 'TURBO • 15 MIN',
      currentPlayers: 31,
      maxPlayers: 40,
      totalFlights: 50,
      countdownSeconds: 190,
      status: 'open',
      duration: '15 min',
      entryFee: 5,
      prizePool: 'R$ 3.000',
      prizeFirst: 'R$ 1.600',
      prizeSecond: 'R$ 900',
      prizeThird: 'R$ 500',
      topScore: 924.0,
      leaderName: 'TURBO_ACE',
      description: 'Rodada tiro curto! 50 voos velozes para quem quer emoção e resultado imediato.'
    },
    {
      id: 'sala-1030',
      roomNumber: '#1030',
      name: 'Grand Prix AeroFantasy Brasil',
      category: 'vip',
      categoryLabel: 'CAMPEONATO OFICIAL',
      currentPlayers: 36,
      maxPlayers: 50,
      totalFlights: 100,
      countdownSeconds: 840,
      status: 'forming',
      duration: '2 horas',
      entryFee: 100,
      prizePool: 'R$ 50.000',
      prizeFirst: 'R$ 27.500',
      prizeSecond: 'R$ 15.000',
      prizeThird: 'R$ 7.500',
      topScore: 1045.0,
      leaderName: 'SONIC_BOOM',
      description: 'O maior torneio da temporada. Premiação em dinheiro real creditada via PIX no cashout.'
    },
    {
      id: 'sala-1031',
      roomNumber: '#1031',
      name: 'Hangar dos Amigos VIP #1',
      category: 'community',
      categoryLabel: 'SALA PRIVADA',
      currentPlayers: 7,
      maxPlayers: 10,
      totalFlights: 100,
      countdownSeconds: 610,
      status: 'open',
      duration: '1 hora',
      entryFee: 10,
      prizePool: 'R$ 1.000',
      prizeFirst: 'R$ 600',
      prizeSecond: 'R$ 300',
      prizeThird: 'R$ 100',
      topScore: 789.0,
      leaderName: 'COMANDANTE_X',
      isPrivate: true,
      description: 'Sala fechada com senha criada pela comunidade de pilotos.'
    }
  ]);

  // Keep viewing room in sync if activeEventId or targetView changes
  useEffect(() => {
    if (targetView === 'hall') {
      setViewingRoomId(null);
    } else if (targetView === 'room' && activeEventId) {
      setViewingRoomId(activeEventId);
    } else if (activeEventId) {
      setViewingRoomId(activeEventId);
    }
  }, [activeEventId, targetView]);

  // Live countdown timer effect for rooms
  useEffect(() => {
    const timer = setInterval(() => {
      setRooms(prev => prev.map(room => {
        if (room.countdownSeconds <= 1) {
          return {
            ...room,
            countdownSeconds: Math.floor(Math.random() * 240) + 90,
            currentPlayers: Math.min(room.maxPlayers, room.currentPlayers + (Math.random() > 0.4 ? 1 : 0))
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

  // Find active room object
  const activeRoomObj = useMemo(() => {
    return rooms.find(r => r.id === viewingRoomId) || rooms.find(r => r.id === activeEventId) || null;
  }, [rooms, viewingRoomId, activeEventId]);

  // Filtered & Sorted Rooms List
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      if (activeFilter !== 'all' && room.category !== activeFilter) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          room.name.toLowerCase().includes(query) ||
          room.roomNumber.toLowerCase().includes(query) ||
          room.categoryLabel.toLowerCase().includes(query)
        );
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'occupancy') {
        return (b.currentPlayers / b.maxPlayers) - (a.currentPlayers / a.maxPlayers);
      }
      if (sortBy === 'time') {
        return a.countdownSeconds - b.countdownSeconds;
      }
      if (sortBy === 'prize') {
        const prizeA = parseInt(a.prizePool.replace(/\D/g, '')) || 0;
        const prizeB = parseInt(b.prizePool.replace(/\D/g, '')) || 0;
        return prizeB - prizeA;
      }
      if (sortBy === 'fee') {
        return a.entryFee - b.entryFee;
      }
      return 0; // Default recommended
    });
  }, [rooms, activeFilter, searchQuery, sortBy]);

  // Live Simulated Room Competitors Leaderboard
  const currentRoomLeaderboard = useMemo(() => {
    if (!activeRoomObj) return [];
    const baseCompetitors = [
      { rank: 1, name: activeRoomObj.leaderName || 'PLAYER_07', score: activeRoomObj.topScore || 984.2, flightsLeft: 14, status: 'Liderando' },
      { rank: 2, name: 'ACE_TOPGUN', score: 941.0, flightsLeft: 22, status: 'Em Voo' },
      { rank: 3, name: 'FLYER99', score: 915.0, flightsLeft: 8, status: 'Concluído' },
      { rank: 4, name: 'STEALTH_BR', score: 874.0, flightsLeft: 45, status: 'Em Voo' },
      { rank: 5, name: 'TURBO_JET', score: 820.0, flightsLeft: 60, status: 'Em Espera' },
      { rank: 6, name: 'FALCON_ACE', score: 765.5, flightsLeft: 71, status: 'Em Voo' },
      { rank: 7, name: 'SKY_KING', score: 680.0, flightsLeft: 84, status: 'Em Espera' },
      { rank: 8, name: 'SONIC_V', score: 540.0, flightsLeft: 90, status: 'Em Voo' },
    ];

    const isCurrentlyInThisRoom = activeEventId === activeRoomObj.id;
    const myScore = isCurrentlyInThisRoom ? userFantasyScore : 0;
    const myFlights = isCurrentlyInThisRoom ? (fantasyFlightsLeft ?? activeRoomObj.totalFlights) : activeRoomObj.totalFlights;

    const meEntry = {
      rank: 999,
      name: `${currentUsername} (Você)`,
      score: myScore,
      flightsLeft: myFlights,
      status: isCurrentlyInThisRoom ? 'Ativo na Sala' : 'Não Inscrito',
      isMe: true
    };

    const combined = [...baseCompetitors, meEntry].sort((a, b) => b.score - a.score);
    return combined.map((pilot, idx) => ({
      ...pilot,
      rank: idx + 1
    }));
  }, [activeRoomObj, activeEventId, userFantasyScore, fantasyFlightsLeft, currentUsername]);

  // Click on "Entrar na Sala" / Room card
  const handleOpenRoomCheckoutOrDashboard = (room: HallRoom) => {
    // If the user is already in this room, open the In-Room Dashboard directly!
    if (activeEventId === room.id) {
      setViewingRoomId(room.id);
      return;
    }

    if (room.isPrivate) {
      setPinPromptRoom(room);
      setEnteredPin('');
      setPinError(null);
      return;
    }

    // Open Payment / Entry Confirmation Checkout modal
    setCheckoutRoom(room);
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinPromptRoom) return;

    if (enteredPin !== '1234' && enteredPin !== pinPromptRoom.pinCode) {
      setPinError('PIN incorreto ou não autorizado! (Dica: tente 1234)');
      return;
    }

    const targetRoom = pinPromptRoom;
    setPinPromptRoom(null);
    setPinError(null);
    setCheckoutRoom(targetRoom);
  };

  // Confirm Checkout & Enter Room
  const handleConfirmCheckoutPayment = () => {
    if (!checkoutRoom) return;

    if (checkoutRoom.entryFee > 0 && userBalance < checkoutRoom.entryFee) {
      setErrorMessage(`Saldo insuficiente (R$ ${userBalance.toFixed(2)}). Deposite via PIX para entrar na sala.`);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    const target = checkoutRoom;
    setCheckoutRoom(null);
    setSelectedRoomDetails(null);

    // Call join competition handler
    onJoinCompetition(target.id, target.entryFee, target.totalFlights);
    setViewingRoomId(target.id);
    setJoinSuccessMessage(`Inscrição confirmada na ${target.roomNumber} - ${target.name}! Você já está na sala com ${target.totalFlights} voos.`);
    setTimeout(() => setJoinSuccessMessage(null), 4000);
  };

  // Create Room Handler
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const newNumber = `#${Math.floor(1032 + Math.random() * 900)}`;
    const calcPrize = newRoomFee === 0 ? 'R$ 1.000' : `R$ ${(newRoomFee * newRoomMaxPlayers * 0.9).toLocaleString('pt-BR')}`;
    const firstPrize = newRoomFee === 0 ? 'R$ 600' : `R$ ${(newRoomFee * newRoomMaxPlayers * 0.5).toLocaleString('pt-BR')}`;
    const secondPrize = newRoomFee === 0 ? 'R$ 300' : `R$ ${(newRoomFee * newRoomMaxPlayers * 0.25).toLocaleString('pt-BR')}`;
    const thirdPrize = newRoomFee === 0 ? 'R$ 100' : `R$ ${(newRoomFee * newRoomMaxPlayers * 0.15).toLocaleString('pt-BR')}`;

    const created: HallRoom = {
      id: `sala-${Date.now()}`,
      roomNumber: newNumber,
      name: newRoomName.trim(),
      category: newRoomIsPrivate ? 'community' : (newRoomFee === 0 ? 'free' : (newRoomFee >= 25 ? 'vip' : 'classic')),
      categoryLabel: newRoomIsPrivate ? 'SALA PRIVADA' : (newRoomFee === 0 ? 'GRÁTIS' : `ENTRADA R$ ${newRoomFee}`),
      currentPlayers: 1,
      maxPlayers: newRoomMaxPlayers,
      totalFlights: newRoomFlights,
      countdownSeconds: 180,
      status: 'forming',
      duration: newRoomDuration,
      entryFee: newRoomFee,
      prizePool: calcPrize,
      prizeFirst: firstPrize,
      prizeSecond: secondPrize,
      prizeThird: thirdPrize,
      topScore: 0,
      leaderName: currentUsername,
      isPrivate: newRoomIsPrivate,
      pinCode: newRoomPin || undefined,
      description: `Sala criada por ${currentUsername}. Preparem seus caças!`
    };

    setRooms([created, ...rooms]);
    setIsCreateModalOpen(false);
    setNewRoomName('');
    setNewRoomPin('');

    // Open checkout for created room
    setCheckoutRoom(created);
  };

  return (
    <div className="w-full flex-1 flex flex-col font-sans text-white select-none bg-[#030811] overflow-y-auto min-h-screen">
      
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full px-3 sm:px-5 py-4 space-y-4">

        {/* ============================================================== */}
        {/* NOTIFICATION TOASTS */}
        {/* ============================================================== */}
        {joinSuccessMessage && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 text-white font-black text-sm flex items-center justify-between gap-3 shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-emerald-400 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-bounce">🚀</span>
              <span>{joinSuccessMessage}</span>
            </div>
            <button 
              onClick={() => setJoinSuccessMessage(null)}
              className="px-2.5 py-1 rounded bg-black/20 text-white/70 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-sm flex items-center justify-between gap-3 shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-red-400 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            {onOpenDeposit && (
              <button 
                onClick={onOpenDeposit}
                className="px-3 py-1 rounded-xl bg-white text-red-600 hover:bg-white/90 text-xs font-black uppercase shadow cursor-pointer"
              >
                Depositar PIX
              </button>
            )}
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-white/70 hover:text-white px-2 py-1 rounded bg-black/20"
            >
              ✕
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TOP NAV & BACK BUTTON */}
        {/* ============================================================== */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-3">
            {viewingRoomId ? (
              <button
                onClick={() => setViewingRoomId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 hover:text-white rounded-xl border border-white/10 text-xs font-bold transition-all cursor-pointer shadow"
              >
                <span>🏛️</span>
                <span>Voltar ao Hall</span>
              </button>
            ) : onBackToHub ? (
              <button
                onClick={onBackToHub}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 hover:text-white rounded-xl border border-white/10 text-xs font-bold transition-all cursor-pointer shadow"
              >
                <span>←</span>
                <span>Hub Principal</span>
              </button>
            ) : null}

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00b4d8] animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                {viewingRoomId ? `Painel da ${activeRoomObj?.roomNumber || 'Sala'}` : 'AeroFantasy Hall'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-[10px] text-white/50 block font-semibold uppercase">Saldo na Carteira</span>
              <span className="text-xs font-black text-emerald-400 font-mono">
                R$ {userBalance.toFixed(2)}
              </span>
            </div>
            {!viewingRoomId && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,180,216,0.4)] cursor-pointer transition-all active:scale-95"
              >
                <span>➕</span>
                <span className="hidden sm:inline">Criar Sala</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* VIEW MODE 1: IN-ROOM DASHBOARD & LIVE RANKING */}
        {/* ============================================================== */}
        {viewingRoomId && activeRoomObj ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* Header da Sala Ativa */}
            <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-[#07172e] via-[#0b2447] to-[#040e1d] border border-cyan-400/40 shadow-[0_0_35px_rgba(0,180,216,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono font-black text-xs">
                    {activeRoomObj.roomNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    EM DISPUTA
                  </span>
                  <span className="text-xs text-white/50 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10 font-bold uppercase">
                    {activeRoomObj.categoryLabel}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>{activeRoomObj.name}</span>
                </h2>

                <p className="text-xs text-sky-200/80">
                  {activeRoomObj.description || 'Disputa aérea em tempo real. Cada ponto é calculado pelo multiplicador dos seus saques!'}
                </p>
              </div>

              {/* Botões de Ação na Sala */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <button
                  onClick={() => onSelectMode('aerogame')}
                  className="py-3 px-6 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <span className="text-base">🚀</span>
                  <span>IR PRO JOGO / DECOLAR AGORA</span>
                </button>
                <button
                  onClick={() => setViewingRoomId(null)}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🏛️</span>
                  <span>Voltar pro Hall</span>
                </button>
              </div>
            </div>

            {/* MINHA POSIÇÃO & PONTUAÇÃO CARD */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#091a33]/90 border border-sky-400/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
                    Sua Posição & Desempenho na Sala
                  </span>
                </div>
                <span className="text-[11px] font-mono text-cyan-300">
                  Cota de Voos: <strong>{fantasyFlightsLeft ?? activeRoomObj.totalFlights} / {activeRoomObj.totalFlights}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30">
                  <span className="text-[10px] text-amber-300/80 font-bold uppercase block">Posição Atual</span>
                  <strong className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                    {myFantasyRank}º Lugar
                  </strong>
                </div>

                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30">
                  <span className="text-[10px] text-cyan-300/80 font-bold uppercase block">Seus Pontos</span>
                  <strong className="text-lg sm:text-xl font-black text-cyan-300 font-mono">
                    {userFantasyScore.toFixed(1)} pts
                  </strong>
                </div>

                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-400/30">
                  <span className="text-[10px] text-purple-300/80 font-bold uppercase block">Voos Realizados</span>
                  <strong className="text-lg sm:text-xl font-black text-purple-200 font-mono">
                    {userFantasyFlightsUsed} voos
                  </strong>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/30">
                  <span className="text-[10px] text-emerald-300/80 font-bold uppercase block">Melhor Saque</span>
                  <strong className="text-lg sm:text-xl font-black text-emerald-300 font-mono">
                    {userFantasyMaxMult > 0 ? `${userFantasyMaxMult.toFixed(2)}x` : '0.00x'}
                  </strong>
                </div>
              </div>

              {/* Dica para subir no Ranking */}
              <div className="p-3 rounded-2xl bg-sky-950/60 border border-sky-400/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎯</span>
                  <span className="text-sky-200">
                    {myFantasyRank === 1 ? (
                      <strong className="text-amber-300">👑 VOCÊ ESTÁ LIDERANDO A SALA! Mantenha a média para faturar {activeRoomObj.prizeFirst}!</strong>
                    ) : (
                      <>
                        Faltam <strong className="text-cyan-300 font-mono">+{pointsToClimb.toFixed(1)} pts</strong> para ultrapassar {aheadCompetitorName || 'o próximo piloto'} e assumir o <strong className="text-amber-300">{myFantasyRank - 1}º lugar</strong>!
                      </>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => onSelectMode('aerogame')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-[11px] uppercase tracking-wider shrink-0 cursor-pointer shadow"
                >
                  Decolar Agora →
                </button>
              </div>
            </div>

            {/* TABELA DE CLASSIFICAÇÃO EM TEMPO REAL */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#061224] border border-[#173359] shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-sm font-black uppercase text-white tracking-wider">
                    Placar Ao Vivo da Sala (Tempo Real)
                  </h3>
                </div>
                <span className="text-xs text-cyan-300 font-mono">
                  Encerramento em {formatCountdown(activeRoomObj.countdownSeconds)}
                </span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {currentRoomLeaderboard.map((pilot) => {
                  const isUser = pilot.name.includes('(Você)');
                  return (
                    <div
                      key={pilot.rank}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                        isUser
                          ? 'bg-gradient-to-r from-cyan-950/80 via-blue-900/60 to-cyan-950/80 border-cyan-400 shadow-[0_0_20px_rgba(0,180,216,0.3)]'
                          : pilot.rank === 1
                          ? 'bg-amber-400/10 border-amber-400/40'
                          : pilot.rank === 2
                          ? 'bg-slate-300/10 border-slate-300/40'
                          : pilot.rank === 3
                          ? 'bg-amber-600/10 border-amber-600/40'
                          : 'bg-white/5 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                          pilot.rank === 1 ? 'bg-amber-400 text-black shadow-md' :
                          pilot.rank === 2 ? 'bg-slate-300 text-black shadow-md' :
                          pilot.rank === 3 ? 'bg-amber-600 text-white shadow-md' :
                          'bg-white/10 text-white/70'
                        }`}>
                          {pilot.rank === 1 ? '🥇' : pilot.rank === 2 ? '🥈' : pilot.rank === 3 ? '🥉' : `#${pilot.rank}`}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <strong className={`font-black ${isUser ? 'text-cyan-300' : 'text-white'}`}>
                              {pilot.name}
                            </strong>
                            {isUser && (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-400 text-black text-[9px] font-black uppercase">
                                VOCÊ
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/40 block">
                            {pilot.flightsLeft} voos restantes • {pilot.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <strong className="font-mono font-black text-amber-300 text-sm block">
                          {typeof pilot.score === 'number' ? pilot.score.toFixed(1) : pilot.score} pts
                        </strong>
                        <span className="text-[10px] text-emerald-400 font-bold">
                          {pilot.rank === 1 ? activeRoomObj.prizeFirst :
                           pilot.rank === 2 ? activeRoomObj.prizeSecond :
                           pilot.rank === 3 ? activeRoomObj.prizeThird : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão Inferior de Decolagem */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  onClick={() => setViewingRoomId(null)}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  ← Ver Todas as Salas do Hall
                </button>
                <button
                  onClick={() => onSelectMode('aerogame')}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer active:scale-95"
                >
                  🚀 Decolar Nessa Sala ({fantasyFlightsLeft ?? activeRoomObj.totalFlights} Voos) →
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* ============================================================== */
          /* VIEW MODE 2: HALL LISTING (TODAS AS SALAS) */
          /* ============================================================== */
          <>
            {/* ============================================================== */}
            {/* CONDITIONAL TOP SECTION: ORGANIZED ROOM INFO (IF IN ROOM) OR BANNER (IF NOT) */}
            {/* ============================================================== */}
            {activeEventId && activeRoomObj ? (
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#07172e] via-[#092244] to-[#040e1d] border border-cyan-400/40 shadow-[0_0_35px_rgba(0,180,216,0.25)] space-y-3.5">
                {/* Header da Sala Organizado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono font-black text-xs">
                        {activeRoomObj.roomNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>EM DISPUTA (AO VIVO)</span>
                      </span>
                      <span className="text-xs text-white/60 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 font-bold uppercase">
                        {activeRoomObj.categoryLabel}
                      </span>
                      <span className="text-xs text-amber-300/80 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20 font-mono font-bold">
                        ⏱️ Restam {formatCountdown(activeRoomObj.countdownSeconds)}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <span>{activeRoomObj.name}</span>
                    </h2>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setViewingRoomId(activeEventId)}
                      className="py-2.5 px-3.5 bg-sky-500/20 hover:bg-sky-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>📊</span>
                      <span>Ver Placar da Sala</span>
                    </button>
                    <button
                      onClick={() => onSelectMode('aerogame')}
                      className="py-2.5 px-5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <span>🚀</span>
                      <span>Decolar Agora</span>
                    </button>
                    {onExitCompetition && (
                      <button
                        onClick={onExitCompetition}
                        className="py-2.5 px-3 bg-red-600/20 hover:bg-red-600/40 text-red-300 hover:text-white text-xs font-bold uppercase rounded-xl border border-red-500/30 cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                        title="Sair da Sala e voltar ao AeroGame Clássico"
                      >
                        <span>✕</span>
                        <span className="hidden xs:inline">Sair da Sala</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid Organizado de Telemetria e Desempenho do Piloto */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30">
                    <span className="text-[10px] text-amber-300/80 font-bold uppercase block">Sua Posição</span>
                    <strong className="text-base sm:text-lg font-black text-amber-300 font-mono">
                      {myFantasyRank}º Lugar
                    </strong>
                    <span className="text-[10px] text-white/40 block">de {activeRoomObj.currentPlayers} pilotos</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30">
                    <span className="text-[10px] text-cyan-300/80 font-bold uppercase block">Seus Pontos</span>
                    <strong className="text-base sm:text-lg font-black text-cyan-300 font-mono">
                      {userFantasyScore.toFixed(1)} pts
                    </strong>
                    <span className="text-[10px] text-white/40 block">{userFantasyFlightsUsed} voos feitos</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-400/30">
                    <span className="text-[10px] text-purple-300/80 font-bold uppercase block">Voos Restantes</span>
                    <strong className="text-base sm:text-lg font-black text-purple-200 font-mono">
                      {fantasyFlightsLeft ?? activeRoomObj.totalFlights} / {activeRoomObj.totalFlights}
                    </strong>
                    <span className="text-[10px] text-white/40 block">Cota da sala</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/30">
                    <span className="text-[10px] text-emerald-300/80 font-bold uppercase block">Prêmio Total</span>
                    <strong className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                      {activeRoomObj.prizePool}
                    </strong>
                    <span className="text-[10px] text-white/40 block">1º: {activeRoomObj.prizeFirst}</span>
                  </div>
                </div>

                {/* Radar de Subida de Posição Alinhado */}
                <div className="p-2.5 rounded-2xl bg-[#040d1a] border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎯</span>
                    <span className="text-sky-200 font-medium">
                      {myFantasyRank === 1 ? (
                        <strong className="text-amber-300">👑 VOCÊ ESTÁ LIDERANDO A SALA! Mantendo a posição você fatura {activeRoomObj.prizeFirst}!</strong>
                      ) : (
                        <>
                          Faltam <strong className="text-cyan-300 font-mono font-bold">+{pointsToClimb.toFixed(1)} pts</strong> para ultrapassar {aheadCompetitorName || 'o próximo piloto'} e assumir o <strong className="text-amber-300 font-bold">{myFantasyRank - 1}º lugar</strong>!
                        </>
                      )}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/50 shrink-0 font-mono">
                    1º: {activeRoomObj.prizeFirst} • 2º: {activeRoomObj.prizeSecond} • 3º: {activeRoomObj.prizeThird}
                  </div>
                </div>
              </div>
            ) : (
              /* HERO BANNER: ONLY SHOWN WHEN USER HAS NOT ENTERED ANY ROOM */
              <div className="relative rounded-3xl overflow-hidden border border-[#1b3658] shadow-[0_0_40px_rgba(0,180,216,0.15)] bg-[#071324]">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-screen scale-105 transition-transform duration-1000"
                  style={{ backgroundImage: `url('/src/assets/images/aerofantasy_hall_lobby_1790484775126.jpg')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#030811] via-[#051122]/90 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030811] via-transparent to-transparent" />

                <div className="relative z-10 p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold tracking-widest uppercase">
                      <span>⚡ RADAR DE COMBATE ATIVO</span>
                      <span>•</span>
                      <span>{rooms.length} ARENAS DISPONÍVEIS</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-cyan-400">
                      HALL DAS SALAS
                    </h1>

                    <p className="text-xs sm:text-sm text-sky-100/70 font-medium leading-relaxed">
                      Escolha sua sala de combate aéreo tático. Cada piloto começa com cota de voos idêntica para pontuar nos multiplicadores mais altos e conquistar os prêmios da mesa!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
                    <div className="p-3 rounded-2xl bg-[#091a33]/80 border border-white/10 backdrop-blur-md">
                      <span className="text-[10px] text-sky-300 font-bold uppercase block">Total em Prêmios</span>
                      <span className="text-base sm:text-lg font-black text-amber-400 font-mono">R$ 97.000</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#091a33]/80 border border-white/10 backdrop-blur-md">
                      <span className="text-[10px] text-sky-300 font-bold uppercase block">Pilotos Online</span>
                      <span className="text-base sm:text-lg font-black text-sky-300 font-mono">1.348</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#091a33]/80 border border-white/10 backdrop-blur-md">
                      <span className="text-[10px] text-sky-300 font-bold uppercase block">Cota Padrão</span>
                      <span className="text-base sm:text-lg font-black text-white font-mono">100 Voos</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#091a33]/80 border border-white/10 backdrop-blur-md">
                      <span className="text-[10px] text-sky-300 font-bold uppercase block">Fair Play</span>
                      <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">100% Provably</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FILTER PILLS, SEARCH & SORT */}
            <div className="space-y-3 bg-[#061122]/90 border border-[#173359] rounded-2xl p-3 sm:p-4 backdrop-blur-md">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: 'Todas as Salas', icon: '🌐' },
                  { id: 'free', label: 'Grátis (Free)', icon: '🆓' },
                  { id: 'turbo', label: 'Tiro Curto (15m)', icon: '⚡' },
                  { id: 'classic', label: 'Clássicas', icon: '🛡️' },
                  { id: 'vip', label: 'VIP / High Roller', icon: '💎' },
                  { id: 'community', label: 'Comunidade / Amigos', icon: '👥' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeFilter === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(0,180,216,0.5)] font-black'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-xs">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar sala por nome, número ou categoria..."
                    className="w-full bg-[#030914] border border-[#1b3658] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/50 whitespace-nowrap">Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="bg-[#030914] border border-[#1b3658] rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="recommended">⭐ Recomendadas</option>
                    <option value="prize">💰 Maior Premiação</option>
                    <option value="time">⏱️ Tempo Restante</option>
                    <option value="occupancy">👥 Mais Cheias</option>
                    <option value="fee">🎟️ Menor Taxa</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ROOMS GRID */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase text-white/60 tracking-wider">
                  Salas Disponíveis ({filteredRooms.length})
                </span>
                <span className="text-[11px] text-cyan-300 font-mono">
                  ● Atualização Automática
                </span>
              </div>

              {filteredRooms.length === 0 ? (
                <div className="p-8 rounded-3xl bg-[#071324] border border-white/5 text-center space-y-3">
                  <span className="text-4xl block">🔍</span>
                  <h3 className="text-base font-bold text-white">Nenhuma sala encontrada</h3>
                  <p className="text-xs text-white/50">Tente ajustar seus filtros ou crie uma nova sala para amigos!</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase"
                  >
                    Criar Sala Personalizada
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {filteredRooms.map(room => {
                    const isFull = room.currentPlayers >= room.maxPlayers;
                    const isUserInRoom = activeEventId === room.id;
                    const occupancyPercent = Math.round((room.currentPlayers / room.maxPlayers) * 100);

                    return (
                      <div
                        key={room.id}
                        className={`rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-4 border transition-all duration-300 relative overflow-hidden group hover:border-cyan-400/50 ${
                          isUserInRoom
                            ? 'bg-gradient-to-b from-[#08203f] to-[#041122] border-cyan-400 shadow-[0_0_30px_rgba(0,180,216,0.3)]'
                            : 'bg-[#071324]/90 hover:bg-[#091a33]/90 border-[#152e4e] shadow-xl'
                        }`}
                      >
                        {/* Header do Card */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-black text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-400/30">
                                {room.roomNumber}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                room.category === 'free' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                                room.category === 'vip' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' :
                                room.category === 'turbo' ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30' :
                                'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                              }`}>
                                {room.categoryLabel}
                              </span>
                              {room.isPrivate && (
                                <span className="text-[10px] bg-white/10 text-white/80 px-1.5 py-0.5 rounded">🔒 Privada</span>
                              )}
                            </div>

                            <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                              {room.name}
                            </h3>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-white/40 block font-bold uppercase">Entrada</span>
                            <span className="text-sm font-black text-emerald-400 font-mono">
                              {room.entryFee === 0 ? 'GRÁTIS' : `R$ ${room.entryFee.toFixed(2)}`}
                            </span>
                          </div>
                        </div>

                        {/* Informações da Sala */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[10px] text-white/40 block font-bold uppercase">Prêmio Total</span>
                            <strong className="text-amber-400 font-mono font-black">{room.prizePool}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[10px] text-white/40 block font-bold uppercase">Cota de Voos</span>
                            <strong className="text-cyan-300 font-mono font-black">{room.totalFlights} Voos</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[10px] text-white/40 block font-bold uppercase">Tempo</span>
                            <strong className="text-white font-mono font-black">{formatCountdown(room.countdownSeconds)}</strong>
                          </div>
                        </div>

                        {/* Barra de Ocupação */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-white/60 font-mono">
                            <span>Ocupação: {room.currentPlayers}/{room.maxPlayers} pilotos</span>
                            <span className={occupancyPercent > 85 ? 'text-amber-400 font-bold' : 'text-cyan-300'}>
                              {occupancyPercent}% preenchido
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={`h-full transition-all duration-500 rounded-full ${
                                occupancyPercent > 85 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                              }`}
                              style={{ width: `${occupancyPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Botões do Card */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => setSelectedRoomDetails(room)}
                            className="py-3 px-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/5"
                            title="Ver detalhes da sala"
                          >
                            👁️ Detalhes
                          </button>

                          <button
                            onClick={() => handleOpenRoomCheckoutOrDashboard(room)}
                            disabled={isFull && !isUserInRoom}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              isUserInRoom
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                                : isFull
                                ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white shadow-[0_0_25px_rgba(0,180,216,0.5)] active:scale-95'
                            }`}
                          >
                            <span>
                              {isUserInRoom
                                ? `VER SALA & RANKING (${fantasyFlightsLeft ?? 100} VOOS) →`
                                : isFull
                                ? 'SALA LOTADA'
                                : room.entryFee === 0
                                ? 'ENTRAR NA SALA (GRÁTIS) →'
                                : `ENTRAR POR R$ ${room.entryFee.toFixed(2)} →`}
                            </span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>

      {/* ============================================================== */}
      {/* MODAL 1: CHECKOUT DE INSCRIÇÃO & CARTEIRA DE PAGAMENTO */}
      {/* ============================================================== */}
      {checkoutRoom && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#071324] border border-cyan-500/40 rounded-3xl max-w-lg w-full flex flex-col shadow-[0_0_50px_rgba(0,180,216,0.35)] overflow-hidden">
            
            {/* Header do Checkout */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#050e1a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-xl shrink-0 text-cyan-300">
                  💳
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-white tracking-wider">
                    Confirmação de Inscrição
                  </h3>
                  <p className="text-[11px] text-cyan-300">
                    Checkout de Entrada da Sala {checkoutRoom.roomNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutRoom(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Corpo do Checkout */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
              
              {/* Detalhes da Sala */}
              <div className="p-4 rounded-2xl bg-[#091a33] border border-sky-400/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-400/30">
                    {checkoutRoom.roomNumber}
                  </span>
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/80 font-bold uppercase">
                    {checkoutRoom.categoryLabel}
                  </span>
                </div>
                <h4 className="text-base font-black text-white">{checkoutRoom.name}</h4>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                  <div className="p-2 rounded-xl bg-black/30">
                    <span className="text-[10px] text-white/40 block uppercase">Prêmio Total</span>
                    <strong className="text-amber-400 font-mono">{checkoutRoom.prizePool}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-black/30">
                    <span className="text-[10px] text-white/40 block uppercase">Cota</span>
                    <strong className="text-cyan-300 font-mono">{checkoutRoom.totalFlights} Voos</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-black/30">
                    <span className="text-[10px] text-white/40 block uppercase">Duração</span>
                    <strong className="text-white font-mono">{checkoutRoom.duration}</strong>
                  </div>
                </div>
              </div>

              {/* Extrato Financeiro da Carteira */}
              <div className="p-4 rounded-2xl bg-[#040e1b] border border-white/10 space-y-3">
                <span className="text-xs font-black uppercase text-white/70 block tracking-wider">
                  Resumo da Carteira & Pagamento
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-white/70">
                    <span>Saldo Atual Disponível:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      R$ {userBalance.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-white/70">
                    <span>Taxa de Entrada da Sala:</span>
                    <span className={`font-mono font-bold text-sm ${checkoutRoom.entryFee === 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {checkoutRoom.entryFee === 0 ? 'GRÁTIS (R$ 0,00)' : `- R$ ${checkoutRoom.entryFee.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                    <span className="font-bold text-white">Saldo Restante na Carteira:</span>
                    <span className={`font-mono font-black text-base ${userBalance >= checkoutRoom.entryFee ? 'text-emerald-400' : 'text-red-400'}`}>
                      R$ {Math.max(0, userBalance - checkoutRoom.entryFee).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Alerta de saldo insuficiente */}
                {checkoutRoom.entryFee > 0 && userBalance < checkoutRoom.entryFee && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-2">
                    <span>⚠️ Saldo insuficiente! Faltam R$ {(checkoutRoom.entryFee - userBalance).toFixed(2)}.</span>
                    {onOpenDeposit && (
                      <button
                        onClick={onOpenDeposit}
                        className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-[11px] uppercase shrink-0 shadow cursor-pointer"
                      >
                        Recarregar PIX
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Regras e Garantia */}
              <div className="p-3 rounded-xl bg-white/5 text-[11px] text-white/60 space-y-1">
                <strong className="text-white block">Como funciona o torneio:</strong>
                <p>Ao confirmar a entrada, você receberá a cota de {checkoutRoom.totalFlights} voos. Você poderá voar nessa sala, pontuar no ranking em tempo real e acompanhar sua posição a qualquer momento.</p>
              </div>

            </div>

            {/* Footer do Checkout */}
            <div className="p-4 border-t border-white/10 bg-[#050e1a] flex gap-2">
              <button
                onClick={() => setCheckoutRoom(null)}
                className="py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmCheckoutPayment}
                disabled={checkoutRoom.entryFee > 0 && userBalance < checkoutRoom.entryFee}
                className={`flex-1 py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  checkoutRoom.entryFee > 0 && userBalance < checkoutRoom.entryFee
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95'
                }`}
              >
                <span>💳</span>
                <span>
                  {checkoutRoom.entryFee === 0
                    ? 'Confirmar Entrada Gratuita →'
                    : `Pagar R$ ${checkoutRoom.entryFee.toFixed(2)} e Entrar na Sala →`}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: DETALHES DA SALA */}
      {/* ============================================================== */}
      {selectedRoomDetails && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#071324] border border-cyan-500/40 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,180,216,0.3)] overflow-hidden">
            
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#050e1a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-xl shrink-0">
                  🎯
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-300">{selectedRoomDetails.roomNumber}</span>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/80 font-bold uppercase">
                      {selectedRoomDetails.categoryLabel}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">{selectedRoomDetails.name}</h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedRoomDetails(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Prize Division Card */}
              <div className="p-4 rounded-2xl bg-[#091a33] border border-sky-400/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                    <span>🏆</span>
                    <span>Divisão de Prêmios ({selectedRoomDetails.prizePool})</span>
                  </span>
                  <span className="text-[10px] text-white/50 font-mono">100% Automático via PIX</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30">
                    <span className="text-[10px] font-bold text-amber-300 block">1º Lugar (50%)</span>
                    <strong className="text-sm font-black text-amber-400 font-mono">{selectedRoomDetails.prizeFirst}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-300/10 border border-slate-300/30">
                    <span className="text-[10px] font-bold text-slate-300 block">2º Lugar (30%)</span>
                    <strong className="text-sm font-black text-slate-200 font-mono">{selectedRoomDetails.prizeSecond}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-600/10 border border-amber-600/30">
                    <span className="text-[10px] font-bold text-amber-500 block">3º Lugar (20%)</span>
                    <strong className="text-sm font-black text-amber-500 font-mono">{selectedRoomDetails.prizeThird}</strong>
                  </div>
                </div>
              </div>

              {/* Room Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-white/50 block font-bold uppercase">Cota</span>
                  <strong className="text-cyan-300 font-mono">{selectedRoomDetails.totalFlights} Voos</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-white/50 block font-bold uppercase">Duração</span>
                  <strong className="text-white font-mono">{selectedRoomDetails.duration}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-white/50 block font-bold uppercase">Pilotos</span>
                  <strong className="text-white font-mono">{selectedRoomDetails.currentPlayers}/{selectedRoomDetails.maxPlayers}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-white/50 block font-bold uppercase">Entrada</span>
                  <strong className="text-emerald-400 font-mono">{selectedRoomDetails.entryFee === 0 ? 'GRÁTIS' : `R$ ${selectedRoomDetails.entryFee.toFixed(2)}`}</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 text-[11px] text-white/60 space-y-1">
                <strong className="text-white block">Regras da Sala:</strong>
                <p>Todos os participantes realizam seus voos individualmente dentro do tempo limite. A pontuação é calculada proporcionalmente ao multiplicador de cada cashout.</p>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#050e1a] flex gap-2">
              <button
                onClick={() => setSelectedRoomDetails(null)}
                className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Voltar
              </button>

              <button
                onClick={() => {
                  const target = selectedRoomDetails;
                  setSelectedRoomDetails(null);
                  handleOpenRoomCheckoutOrDashboard(target);
                }}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,180,216,0.5)] cursor-pointer active:scale-95"
              >
                {activeEventId === selectedRoomDetails.id
                  ? `Ver Sala & Decolar (${fantasyFlightsLeft ?? 100} Voos) →`
                  : selectedRoomDetails.entryFee === 0
                  ? 'Entrar Gratuitamente →'
                  : `Avançar para Checkout (R$ ${selectedRoomDetails.entryFee.toFixed(2)}) →`}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: CRIAR SALA */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#071324] border border-cyan-500/40 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,180,216,0.3)] overflow-hidden">
            
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#050e1a]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">➕</span>
                <div>
                  <h3 className="text-base font-black uppercase text-white tracking-wider">Criar Sala de Competição</h3>
                  <p className="text-[11px] text-cyan-300">Crie uma arena pública ou privada para amigos</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="space-y-1.5">
                <label className="text-white/80 font-bold uppercase text-[11px]">Nome da Sala</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  placeholder="Ex: Arena dos Campeões, Duelo dos Falcões..."
                  className="w-full bg-[#030914] border border-[#1b3658] rounded-xl px-3.5 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-white/80 font-bold uppercase text-[11px]">Taxa de Entrada</label>
                  <select
                    value={newRoomFee}
                    onChange={e => setNewRoomFee(Number(e.target.value))}
                    className="w-full bg-[#030914] border border-[#1b3658] rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value={0}>R$ 0,00 (Grátis)</option>
                    <option value={5}>R$ 5,00</option>
                    <option value={10}>R$ 10,00</option>
                    <option value={20}>R$ 20,00</option>
                    <option value={50}>R$ 50,00</option>
                    <option value={100}>R$ 100,00</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/80 font-bold uppercase text-[11px]">Máximo de Pilotos</label>
                  <select
                    value={newRoomMaxPlayers}
                    onChange={e => setNewRoomMaxPlayers(Number(e.target.value))}
                    className="w-full bg-[#030914] border border-[#1b3658] rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value={10}>10 pilotos (Duelo rápido)</option>
                    <option value={25}>25 pilotos</option>
                    <option value={50}>50 pilotos</option>
                    <option value={100}>100 pilotos (Arena cheia)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-white/80 font-bold uppercase text-[11px]">Cota de Voos</label>
                  <select
                    value={newRoomFlights}
                    onChange={e => setNewRoomFlights(Number(e.target.value))}
                    className="w-full bg-[#030914] border border-[#1b3658] rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value={50}>50 voos (Tiro curto)</option>
                    <option value={100}>100 voos (Oficial)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/80 font-bold uppercase text-[11px]">Duração</label>
                  <select
                    value={newRoomDuration}
                    onChange={e => setNewRoomDuration(e.target.value)}
                    className="w-full bg-[#030914] border border-[#1b3658] rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="15 min">15 minutos</option>
                    <option value="30 min">30 minutos</option>
                    <option value="1 hora">1 hora</option>
                    <option value="2 horas">2 horas</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setNewRoomIsPrivate(!newRoomIsPrivate)}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{newRoomIsPrivate ? '🔒' : '🌐'}</span>
                    <div>
                      <span className="font-bold text-white block">Sala Privada com Senha (PIN)</span>
                      <span className="text-[10px] text-white/50">Apenas quem tiver o PIN poderá entrar</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newRoomIsPrivate}
                    onChange={e => setNewRoomIsPrivate(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 cursor-pointer"
                  />
                </div>

                {newRoomIsPrivate && (
                  <div className="pt-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={newRoomPin}
                      onChange={e => setNewRoomPin(e.target.value)}
                      placeholder="Defina um PIN (ex: 1234)"
                      className="w-full bg-[#030914] border border-[#1b3658] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(0,180,216,0.5)] cursor-pointer active:scale-95 transition-all mt-2"
              >
                Criar Sala e Ir para Inscrição
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: PIN DA SALA PRIVADA */}
      {/* ============================================================== */}
      {pinPromptRoom && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#071324] border border-cyan-500/40 rounded-3xl max-w-sm w-full shadow-[0_0_50px_rgba(0,180,216,0.3)] overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#050e1a]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider">Sala Privada</h3>
                  <p className="text-[11px] text-cyan-300">{pinPromptRoom.roomNumber} - {pinPromptRoom.name}</p>
                </div>
              </div>
              <button
                onClick={() => { setPinPromptRoom(null); setPinError(null); }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPin} className="p-5 space-y-4">
              <div className="space-y-1.5 text-center">
                <label className="text-white/80 font-bold uppercase text-xs block">Digite o PIN de Acesso</label>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={enteredPin}
                  onChange={e => { setEnteredPin(e.target.value); setPinError(null); }}
                  placeholder="••••"
                  className="w-full text-center bg-[#030914] border border-[#1b3658] rounded-2xl px-4 py-3 text-2xl tracking-[0.5em] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400 font-mono font-bold"
                />
                {pinError && (
                  <p className="text-xs text-red-400 font-bold mt-2 animate-bounce">{pinError}</p>
                )}
                <p className="text-[10px] text-white/40 pt-1">
                  Solicite o código de acesso com o criador da sala.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setPinPromptRoom(null); setPinError(null); }}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-3 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex-1"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HallDasSalas;
