
import React, { useState } from 'react';
import { GameEvent, AeroFantasyLeagueType, EventPrize, AeroFantasyConfig } from '../../types';

interface AeroFantasyAdminProps {
  onClose: () => void;
  events: GameEvent[];
  tournaments: GameEvent[];
  onCreateEvent: (event: GameEvent, isTournament: boolean) => void;
  onDeleteEvent: (id: string, isTournament: boolean) => void;
  onUpdateEvent: (event: GameEvent, isTournament: boolean) => void;
}

const AeroFantasyAdmin: React.FC<AeroFantasyAdminProps> = ({ 
    onClose, 
    events, 
    tournaments, 
    onCreateEvent, 
    onDeleteEvent,
    onUpdateEvent
}) => {
  const [activeTab, setActiveTab] = useState<'active_leagues' | 'create_league' | 'manage_scores'>('active_leagues');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // --- FORM STATES ---
  const [leagueType, setLeagueType] = useState<AeroFantasyLeagueType>('aerocoin');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // const [imagesInput, setImagesInput] = useState(''); // REMOVED
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  // Timing
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [entryDeadlineDate, setEntryDeadlineDate] = useState('');
  const [entryDeadlineTime, setEntryDeadlineTime] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'specific_date'>('specific_date');

  // Entry & Cost
  const [isPaid, setIsPaid] = useState(false);
  const [entryFee, setEntryFee] = useState(0);

  // Rules Specifics
  const [startingAerocoins, setStartingAerocoins] = useState(1000);
  const [eliminateOnZero, setEliminateOnZero] = useState(false);
  const [maxFlights, setMaxFlights] = useState(0); // 0 = Unlimited
  
  const [allowRebuy, setAllowRebuy] = useState(false);
  const [rebuyCost, setRebuyCost] = useState(0);
  const [rebuyFlightsAmount, setRebuyFlightsAmount] = useState(10);
  
  const [targetMultiplier, setTargetMultiplier] = useState(10.0);
  const [jackpotAccumulated, setJackpotAccumulated] = useState(0);

  // Prizes
  const [prizes, setPrizes] = useState<EventPrize[]>([{ position: 1, rewardType: 'cash', cashAmount: 100, displayLabel: 'R$ 100' }]);

  // SCORE MANAGEMENT STATES
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [newScore, setNewScore] = useState('');

  // --- HANDLERS ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setUploadedImages(prev => [...prev, ev.target!.result as string]);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const removeUploadedImage = (index: number) => {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPrize = () => {
      const nextPos = prizes.length + 1;
      setPrizes([...prizes, { position: nextPos, rewardType: 'cash', cashAmount: 50, displayLabel: 'R$ 50' }]);
  };

  const handleUpdatePrize = (index: number, field: keyof EventPrize, value: any) => {
      const newPrizes = [...prizes];
      newPrizes[index] = { ...newPrizes[index], [field]: value };
      
      // Auto update display label if not customized
      const p = newPrizes[index];
      let label = '';
      if (p.rewardType === 'cash') label = `R$ ${p.cashAmount}`;
      else if (p.rewardType === 'flight') label = `${p.flightAmount} Voos`;
      else if (p.rewardType === 'physical') label = p.physicalItemName || 'Prêmio Físico';
      else if (p.rewardType === 'mixed') label = `R$ ${p.cashAmount} + ${p.physicalItemName}`;
      
      newPrizes[index].displayLabel = label;
      setPrizes(newPrizes);
  };

  const handleCreate = () => {
      if (!title || !startDate || !endDate) {
          alert("Preencha os campos obrigatórios (Título, Datas).");
          return;
      }

      const startTimestamp = new Date(`${startDate}T${startTime || '00:00'}`).getTime();
      const endTimestamp = new Date(`${endDate}T${endTime || '23:59'}`).getTime();
      const deadlineTimestamp = entryDeadlineDate ? new Date(`${entryDeadlineDate}T${entryDeadlineTime || '23:59'}`).getTime() : endTimestamp;

      const config: AeroFantasyConfig = {
          entryDeadline: deadlineTimestamp,
          frequency,
          startingAerocoins: leagueType === 'aerocoin' ? startingAerocoins : undefined,
          eliminateOnZeroBalance: leagueType === 'aerocoin' ? eliminateOnZero : undefined,
          maxFlights: maxFlights > 0 ? maxFlights : undefined,
          allowRebuy: leagueType === 'multiplier' ? allowRebuy : undefined,
          rebuyCost: allowRebuy ? rebuyCost : undefined,
          rebuyFlightsAmount: allowRebuy ? rebuyFlightsAmount : undefined,
          targetMultiplier: leagueType === 'vela' ? targetMultiplier : undefined,
          jackpotAccumulated: leagueType === 'vela' ? jackpotAccumulated : undefined,
      };

      const totalPrizePoolValue = prizes.reduce((acc, p) => acc + (p.cashAmount || 0), 0) + (leagueType === 'vela' ? jackpotAccumulated : 0);
      const prizePoolLabel = leagueType === 'vela' && jackpotAccumulated > 0 
          ? `Jackpot R$ ${jackpotAccumulated}` 
          : `R$ ${totalPrizePoolValue} + Prêmios`;

      const newEvent: GameEvent = {
          id: `t-${Date.now()}`,
          title,
          description,
          prizePool: prizePoolLabel,
          endsIn: 'Calculando...',
          endTime: endTimestamp,
          startTime: startTimestamp,
          status: startTimestamp > Date.now() ? 'upcoming' : 'live',
          bannerGradient: leagueType === 'vela' ? 'from-[#e51a31] to-[#8b0010]' : leagueType === 'multiplier' ? 'from-[#913ef2] to-[#5b0ca8]' : 'from-[#34b1e2] to-[#2096c4]',
          participants: 0,
          minEntry: 0,
          isPaid,
          entryFee: isPaid ? entryFee : 0,
          leagueType,
          rankingType: leagueType === 'aerocoin' ? 'balance' : leagueType === 'multiplier' ? 'highest_multiplier' : 'highest_multiplier',
          images: uploadedImages,
          config,
          prizes,
          participantsList: [],
          userJoined: false,
          initialAerocoins: startingAerocoins,
          flightsLimit: maxFlights,
          isJackpot: leagueType === 'vela',
          jackpotAccumulated: jackpotAccumulated
      };

      onCreateEvent(newEvent, true); 
      setUploadedImages([]);
      setActiveTab('active_leagues');
      alert("Liga criada com sucesso!");
  };

  const handleUpdateParticipantScore = () => {
      if (!selectedTournamentId || editingUserId === null) return;
      const tournament = tournaments.find(t => t.id === selectedTournamentId);
      if (!tournament) return;

      const scoreVal = parseFloat(newScore);
      if (isNaN(scoreVal)) {
          alert("Valor inválido");
          return;
      }

      const updatedParticipants = tournament.participantsList?.map(p => {
          if (p.userId === editingUserId) {
              return { ...p, score: scoreVal };
          }
          return p;
      }) || [];

      // Se o usuário não estiver na lista (admin adicionando manualmente), poderia criar, 
      // mas vamos assumir que só edita quem já entrou.
      
      const updatedTournament = {
          ...tournament,
          participantsList: updatedParticipants
      };

      onUpdateEvent(updatedTournament, true);
      setEditingUserId(null);
      setNewScore('');
  };

  const getLeagueIcon = (type: string) => {
      switch(type) {
          case 'vela': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
          case 'multiplier': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
          default: return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="12" y1="2" x2="12" y2="6"/></svg>;
      }
  };

  const selectedTournamentForScores = tournaments.find(t => t.id === selectedTournamentId);

  return (
    <div className="fixed inset-0 z-[200] bg-[#09090b] text-white flex flex-col font-sans overflow-hidden">
        
        {/* Header Desktop */}
        <div className="hidden lg:flex p-6 border-b border-white/5 bg-[#141516] justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#34b1e2] rounded-xl flex items-center justify-center text-black font-black shadow-[0_0_15px_rgba(52,177,226,0.4)]">
                    F
                </div>
                <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Aero<span className="text-[#34b1e2]">Fantasy</span> Admin</h2>
                    <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Gestor de Ligas e Torneios</p>
                </div>
            </div>
            <button onClick={onClose} className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
                Voltar ao Menu
            </button>
        </div>

        {/* Header Mobile */}
        <div className="lg:hidden p-4 border-b border-white/5 bg-[#141516] flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
                <span className="font-black italic text-white uppercase tracking-tighter">Admin Fantasy</span>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white/5 rounded-lg text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-lg text-white/50">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
            
            {/* Sidebar Navigation */}
            {/* Overlay Mobile */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
            
            <aside className={`absolute lg:relative inset-y-0 left-0 w-64 bg-[#121214] border-r border-white/5 p-4 flex flex-col gap-2 shrink-0 z-40 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <button 
                    onClick={() => { setActiveTab('active_leagues'); setIsSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'active_leagues' ? 'bg-[#34b1e2] text-black shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                >
                    Ligas Ativas
                </button>
                <button 
                    onClick={() => { setActiveTab('create_league'); setIsSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'create_league' ? 'bg-[#34b1e2] text-black shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                >
                    Criar Nova Liga
                </button>
                <button 
                    onClick={() => { setActiveTab('manage_scores'); setIsSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'manage_scores' ? 'bg-[#34b1e2] text-black shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                >
                    Gestão de Pontos
                </button>
            </aside>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#050505]">
                
                {/* --- LISTAGEM DE LIGAS --- */}
                {activeTab === 'active_leagues' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">Gerenciar Ligas Existentes</h3>
                        
                        {tournaments.length === 0 ? (
                            <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center text-white/30 font-bold uppercase text-xs">
                                Nenhuma liga criada.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {tournaments.map(t => (
                                    <div key={t.id} className="bg-[#1b1c1d] border border-white/5 rounded-2xl p-4 lg:p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                        <div className="flex items-center gap-4 w-full lg:w-auto">
                                            <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center bg-black/40 border border-white/10 text-white/50`}>
                                                {getLeagueIcon(t.leagueType)}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-white uppercase text-sm truncate">{t.title}</h4>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${t.leagueType === 'vela' ? 'bg-[#e51a31]/20 text-[#e51a31]' : 'bg-[#34b1e2]/20 text-[#34b1e2]'}`}>
                                                        {t.leagueType}
                                                    </span>
                                                    <span className="text-[9px] text-white/40 font-bold uppercase">
                                                        {new Date(t.endTime).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-white/5 pt-3 lg:pt-0">
                                            <div className="text-left lg:text-right mr-4">
                                                <span className="block text-[9px] text-white/30 uppercase font-bold">Participantes</span>
                                                <span className="block text-sm font-black text-white">{t.participants}</span>
                                            </div>
                                            <button 
                                                onClick={() => onDeleteEvent(t.id, true)}
                                                className="bg-[#e51a31]/10 text-[#e51a31] hover:bg-[#e51a31] hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all"
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- GESTÃO DE PONTOS (RANKING) --- */}
                {activeTab === 'manage_scores' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Gestão de Ranking</h3>
                        
                        <div className="bg-[#1b1c1d] p-6 rounded-2xl border border-white/5">
                            <label className="text-[10px] font-bold text-white/40 uppercase block mb-2">Selecione a Liga para editar</label>
                            <select 
                                onChange={(e) => setSelectedTournamentId(e.target.value)}
                                value={selectedTournamentId || ''}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#34b1e2]"
                            >
                                <option value="">-- Selecione --</option>
                                {tournaments.map(t => (
                                    <option key={t.id} value={t.id}>{t.title} ({t.participants} players)</option>
                                ))}
                            </select>
                        </div>

                        {selectedTournamentForScores && (
                            <div className="bg-[#1b1c1d] rounded-2xl border border-white/5 overflow-hidden">
                                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between">
                                    <span className="text-xs font-black uppercase text-white/60">Participante</span>
                                    <span className="text-xs font-black uppercase text-white/60">Pontuação</span>
                                </div>
                                
                                {(!selectedTournamentForScores.participantsList || selectedTournamentForScores.participantsList.length === 0) ? (
                                    <div className="p-8 text-center text-white/20 text-xs font-bold uppercase">Nenhum participante nesta liga ainda.</div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {selectedTournamentForScores.participantsList.map(p => (
                                            <div key={p.userId} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#34b1e2]/20 flex items-center justify-center text-[#34b1e2] font-bold text-xs">
                                                        {p.username[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{p.username}</div>
                                                        <div className="text-[9px] text-white/40">ID: {p.userId}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {editingUserId === p.userId ? (
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="number" 
                                                                value={newScore} 
                                                                onChange={(e) => setNewScore(e.target.value)} 
                                                                className="bg-black border border-[#34b1e2] rounded-lg px-2 py-1 text-sm text-white w-24 font-bold"
                                                                autoFocus
                                                            />
                                                            <button onClick={handleUpdateParticipantScore} className="bg-[#28a745] text-white px-3 py-1 rounded-lg text-xs font-bold">OK</button>
                                                            <button onClick={() => setEditingUserId(null)} className="bg-white/10 text-white px-2 py-1 rounded-lg text-xs">X</button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-sm font-mono font-bold text-[#34b1e2]">{p.score}</span>
                                                            <button 
                                                                onClick={() => { setEditingUserId(p.userId); setNewScore(p.score.toString()); }}
                                                                className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- CRIAÇÃO DE LIGA --- */}
                {activeTab === 'create_league' && (
                    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        
                        {/* 1. Tipo de Liga */}
                        <div className="bg-[#1b1c1d] p-4 lg:p-6 rounded-2xl border border-white/5">
                            <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">1. Selecione o Modo de Jogo</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <button 
                                    onClick={() => setLeagueType('aerocoin')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${leagueType === 'aerocoin' ? 'bg-[#34b1e2]/20 border-[#34b1e2] text-[#34b1e2]' : 'bg-black border-white/10 text-white/40 hover:text-white'}`}
                                >
                                    <span className="text-2xl">🏆</span>
                                    <span className="font-bold text-xs uppercase">Pontos Acumulados</span>
                                    <span className="text-[9px] opacity-60 text-center">Ranking por saldo de Aerocoins</span>
                                </button>
                                <button 
                                    onClick={() => setLeagueType('multiplier')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${leagueType === 'multiplier' ? 'bg-[#913ef2]/20 border-[#913ef2] text-[#913ef2]' : 'bg-black border-white/10 text-white/40 hover:text-white'}`}
                                >
                                    <span className="text-2xl">🚀</span>
                                    <span className="font-bold text-xs uppercase">Multiplicadores</span>
                                    <span className="text-[9px] opacity-60 text-center">Ranking por maior Odd (X)</span>
                                </button>
                                <button 
                                    onClick={() => setLeagueType('vela')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${leagueType === 'vela' ? 'bg-[#e51a31]/20 border-[#e51a31] text-[#e51a31]' : 'bg-black border-white/10 text-white/40 hover:text-white'}`}
                                >
                                    <span className="text-2xl">🕯️</span>
                                    <span className="font-bold text-xs uppercase">Caçador de Velas</span>
                                    <span className="text-[9px] opacity-60 text-center">Quem pegar a vela alvo ganha</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. Informações Básicas */}
                        <div className="bg-[#1b1c1d] p-4 lg:p-6 rounded-2xl border border-white/5 space-y-4">
                            <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-2">2. Informações Básicas</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input type="text" placeholder="Nome da Liga" value={title} onChange={e => setTitle(e.target.value)} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#34b1e2]" />
                                <input type="text" placeholder="Descrição Curta" value={description} onChange={e => setDescription(e.target.value)} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#34b1e2]" />
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Upload do Banner</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#34b1e2] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-[#34b1e2]/20 file:text-[#34b1e2] hover:file:bg-[#34b1e2]/30"
                                />
                                {uploadedImages.length > 0 && (
                                    <div className="flex gap-2 mt-2 overflow-x-auto">
                                        {uploadedImages.map((img, idx) => (
                                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20 group">
                                                <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                                <button onClick={() => removeUploadedImage(idx)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[#e51a31] font-bold text-xs">X</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Regras Específicas */}
                        <div className="bg-[#1b1c1d] p-4 lg:p-6 rounded-2xl border border-white/5 space-y-4">
                            <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-2">3. Regras da Liga ({leagueType})</h4>
                            
                            {/* Regras Aerocoin */}
                            {leagueType === 'aerocoin' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">Saldo Inicial (Aerocoins)</label>
                                        <input type="number" value={startingAerocoins} onChange={e => setStartingAerocoins(parseInt(e.target.value))} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white" />
                                    </div>
                                    <div className="flex items-center gap-3 mt-4">
                                        <input type="checkbox" checked={eliminateOnZero} onChange={e => setEliminateOnZero(e.target.checked)} className="w-5 h-5 accent-[#34b1e2]" />
                                        <span className="text-xs font-bold text-white">Eliminar se zerar o saldo?</span>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">Limite de Voos (0 = Livre)</label>
                                        <input type="number" value={maxFlights} onChange={e => setMaxFlights(parseInt(e.target.value))} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white" />
                                    </div>
                                </div>
                            )}

                            {/* Regras Multiplier */}
                            {leagueType === 'multiplier' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">Voos Iniciais</label>
                                            <input type="number" value={maxFlights} onChange={e => setMaxFlights(parseInt(e.target.value))} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white" />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <input type="checkbox" checked={allowRebuy} onChange={e => setAllowRebuy(e.target.checked)} className="w-5 h-5 accent-[#913ef2]" />
                                            <span className="text-xs font-bold text-white">Permitir Rebuy (Recarga)?</span>
                                        </div>
                                        {allowRebuy && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0 lg:pl-8">
                                                <div>
                                                    <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">Custo Rebuy (R$)</label>
                                                    <input type="number" value={rebuyCost} onChange={e => setRebuyCost(parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">Voos no Rebuy</label>
                                                    <input type="number" value={rebuyFlightsAmount} onChange={e => setRebuyFlightsAmount(parseInt(e.target.value))} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Regras Vela */}
                            {leagueType === 'vela' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">Vela Alvo (Ex: 10.00)</label>
                                        <input type="number" step="0.1" value={targetMultiplier} onChange={e => setTargetMultiplier(parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-[#e51a31] font-black" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">Jackpot Acumulado (R$)</label>
                                        <input type="number" value={jackpotAccumulated} onChange={e => setJackpotAccumulated(parseFloat(e.target.value))} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-[#28a745] font-black" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Agendamento e Entrada */}
                        <div className="bg-[#1b1c1d] p-4 lg:p-6 rounded-2xl border border-white/5 space-y-4">
                            <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-2">4. Cronograma & Entrada</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[9px] font-bold text-white/50 uppercase block mb-1">Início</label>
                                    <div className="flex gap-2">
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white w-full" />
                                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white w-24" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-white/50 uppercase block mb-1">Fim</label>
                                    <div className="flex gap-2">
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white w-full" />
                                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white w-24" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <label className="text-[9px] font-bold text-[#e51a31] uppercase block mb-1">Data Limite de Entrada (Opcional)</label>
                                <div className="flex gap-2 w-full sm:w-1/2">
                                    <input type="date" value={entryDeadlineDate} onChange={e => setEntryDeadlineDate(e.target.value)} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white w-full" />
                                    <input type="time" value={entryDeadlineTime} onChange={e => setEntryDeadlineTime(e.target.value)} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white w-24" />
                                </div>
                                <p className="text-[9px] text-white/30 mt-1">Se vazio, as inscrições fecham no fim do evento.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="w-4 h-4 accent-[#28a745]" />
                                        <span className="text-xs font-bold text-white">Liga Paga?</span>
                                    </div>
                                    {isPaid && (
                                        <input type="number" placeholder="Valor R$" value={entryFee} onChange={e => setEntryFee(parseFloat(e.target.value))} className="w-full bg-[#1b1c1d] border border-white/10 rounded-lg p-2 text-sm text-[#28a745] font-black" />
                                    )}
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-white/50 uppercase block mb-1">Frequência</label>
                                    <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white">
                                        <option value="specific_date">Data Específica</option>
                                        <option value="daily">Repetir Diariamente</option>
                                        <option value="weekly">Repetir Semanalmente</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 5. Prêmios */}
                        <div className="bg-[#1b1c1d] p-4 lg:p-6 rounded-2xl border border-white/5 space-y-4">
                            <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-2">5. Estrutura de Prêmios</h4>
                            
                            {prizes.map((prize, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center bg-black/40 p-2 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded font-bold text-xs">#{prize.position}</div>
                                        <select 
                                            value={prize.rewardType} 
                                            onChange={e => handleUpdatePrize(idx, 'rewardType', e.target.value)}
                                            className="bg-[#1b1c1d] text-white text-xs p-2 rounded border border-white/10 w-24"
                                        >
                                            <option value="cash">Dinheiro</option>
                                            <option value="flight">Voos</option>
                                            <option value="physical">Físico</option>
                                            <option value="mixed">Misto</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex-1 flex gap-2 w-full sm:w-auto">
                                        {(prize.rewardType === 'cash' || prize.rewardType === 'mixed') && (
                                            <input type="number" placeholder="R$" value={prize.cashAmount} onChange={e => handleUpdatePrize(idx, 'cashAmount', parseFloat(e.target.value))} className="bg-[#1b1c1d] text-[#28a745] font-bold text-xs p-2 rounded border border-white/10 w-20" />
                                        )}
                                        
                                        {prize.rewardType === 'flight' && (
                                            <input type="number" placeholder="Qtd" value={prize.flightAmount} onChange={e => handleUpdatePrize(idx, 'flightAmount', parseFloat(e.target.value))} className="bg-[#1b1c1d] text-[#913ef2] font-bold text-xs p-2 rounded border border-white/10 w-20" />
                                        )}

                                        {(prize.rewardType === 'physical' || prize.rewardType === 'mixed') && (
                                            <input type="text" placeholder="Nome do Item" value={prize.physicalItemName} onChange={e => handleUpdatePrize(idx, 'physicalItemName', e.target.value)} className="bg-[#1b1c1d] text-white text-xs p-2 rounded border border-white/10 flex-1" />
                                        )}
                                        
                                        <button onClick={() => {
                                            const newPrizes = prizes.filter((_, i) => i !== idx);
                                            setPrizes(newPrizes);
                                        }} className="text-[#e51a31] hover:text-white px-2">x</button>
                                    </div>
                                </div>
                            ))}

                            <button onClick={handleAddPrize} className="w-full py-2 border border-dashed border-white/20 text-white/40 hover:text-white hover:border-white/40 rounded-xl text-xs font-bold uppercase transition-all">
                                + Adicionar Posição
                            </button>
                        </div>

                        {/* FINAL ACTION */}
                        <div className="pb-10">
                            <button 
                                onClick={handleCreate}
                                className="w-full py-4 bg-[#34b1e2] hover:bg-[#2096c4] text-black font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all text-sm"
                            >
                                Publicar Liga
                            </button>
                        </div>

                    </div>
                )}

            </main>
        </div>
    </div>
  );
};

export default AeroFantasyAdmin;
