
import React, { useState, useEffect } from 'react';
import { GameEvent } from '../types';
import AeroFantasyBanners from './AeroFantasyBanners';

interface TournamentsModalProps {
  onClose: () => void;
  tournaments: GameEvent[];
  onJoinTournament?: (tournamentId: string, cost: number) => void;
  isInline?: boolean;
}

// Reusable Countdown Hook
const useCountdown = (targetDate?: number) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!targetDate) return;

        const update = () => {
            const now = Date.now();
            const diff = targetDate - now;

            if (diff <= 0) {
                setTimeLeft('Encerrado');
                return;
            }

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return timeLeft;
};

// --- HELPER: Banner Component ---
const TournamentBanner = ({ tournament }: { tournament: GameEvent }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = tournament.images && tournament.images.length > 0 ? tournament.images : (tournament.image ? [tournament.image] : []);

    useEffect(() => {
        if (images.length > 1) {
            const interval = setInterval(() => {
                setCurrentImageIndex(prev => (prev + 1) % images.length);
            }, 4000); // 4 seconds rotation
            return () => clearInterval(interval);
        }
    }, [images]);

    return (
        <div className="absolute inset-0 bg-black -z-10 overflow-hidden">
            {images.length > 0 ? (
                images.map((img, idx) => (
                    <div 
                        key={idx}
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                        style={{backgroundImage: `url(${img})`}}
                    />
                ))
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-r ${tournament.bannerGradient}`} />
            )}
            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141516]/90 via-[#141516]/40 to-transparent" />
        </div>
    );
};

// --- SUB-COMPONENT: Tournament Card (List Item) ---
const TournamentCard: React.FC<{ tournament: GameEvent, onClick: () => void }> = ({ tournament, onClick }) => {
    const timeLeft = useCountdown(tournament.endTime);

    const getLeagueIcon = (type: string) => {
        switch(type) {
            case 'vela': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
            case 'multiplier': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
            default: return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="12" y1="2" x2="12" y2="6"/></svg>;
        }
    };

    return (
        <div 
            onClick={onClick}
            className="relative rounded-2xl overflow-hidden group border border-white/10 hover:border-[#e51a31]/50 transition-all cursor-pointer bg-[#141516]"
        >
            <TournamentBanner tournament={tournament} />
            
            <div className="relative p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                            {tournament.status === 'live' && (
                                <span className="bg-[#e51a31] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded w-fit animate-pulse">
                                    Ao Vivo
                                </span>
                            )}
                            <span className="bg-[#34b1e2] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded w-fit flex items-center gap-1">
                                {getLeagueIcon(tournament.leagueType)}
                                {tournament.leagueType === 'vela' ? 'Liga Jackpot' : tournament.leagueType === 'multiplier' ? 'Liga dos Multiplicadores' : 'Liga Aerocoins'}
                            </span>
                        </div>
                        <h3 className="text-xl font-black italic text-white uppercase tracking-tight shadow-black drop-shadow-md">{tournament.title}</h3>
                    </div>
                    <div className="text-right">
                        <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest block drop-shadow-md">Prêmio</span>
                        <span className="text-lg font-black text-[#d97d1b] italic shadow-orange-glow drop-shadow-md">{tournament.prizePool}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 text-[10px] text-white/80 bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/10">
                    <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Fim: <b className="text-white tabular-nums">{timeLeft || tournament.endsIn}</b></span>
                    </div>
                    <div className="w-px h-3 bg-white/20" />
                    <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>{tournament.participants.toLocaleString()} Competidores</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4 bg-[#34b1e2]/10 backdrop-blur-sm px-2 py-1 rounded border border-[#34b1e2]/20 w-fit">
                    <span className="text-[9px] font-bold text-[#34b1e2] uppercase">
                        {tournament.leagueType === 'multiplier' 
                            ? `${tournament.flightsLimit} Voos Disponíveis` 
                            : tournament.leagueType === 'vela' 
                                ? 'Somente Velas > 10x'
                                : `Saldo Inicial: ${tournament.initialAerocoins} AC`
                        }
                    </span>
                </div>

                <button className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
                    tournament.userJoined
                    ? 'bg-[#e51a31] text-white shadow-lg shadow-[#e51a31]/20'
                    : 'bg-white/10 backdrop-blur-md text-white/80 hover:bg-white/20 hover:text-white border border-white/10'
                }`}>
                    {tournament.userJoined ? 'Entrar na Sala' : 'Ver Detalhes'}
                </button>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Tournament Detail View (Drill Down) ---
const TournamentDetail: React.FC<{ 
    tournament: GameEvent, 
    onBack: () => void,
    onJoin: () => void
}> = ({ tournament, onBack, onJoin }) => {
    const [activeTab, setActiveTab] = useState<'ranking' | 'rules' | 'prizes'>('ranking');
    const [isProcessing, setIsProcessing] = useState(false);
    const timeLeft = useCountdown(tournament.endTime);

    const handleJoinClick = () => {
        setIsProcessing(true);
        onJoin();
        setTimeout(() => setIsProcessing(false), 2000); 
    };

    // Filter & Sort Participants
    const sortedParticipants = [...(tournament.participantsList || [])].sort((a, b) => b.score - a.score);
    const myStats = sortedParticipants.find(p => p.userId === 1); 
    const myRank = myStats ? sortedParticipants.indexOf(myStats) + 1 : '-';
    
    // Calculate Distance to leader
    const leaderScore = sortedParticipants[0]?.score || 0;
    const myScore = myStats?.score || 0;
    const distance = leaderScore - myScore;

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300 bg-[#09090b]">
            {/* Detail Header */}
            <div className="relative p-6 border-b border-white/5 overflow-hidden shrink-0 min-h-[180px] flex flex-col justify-between">
                <TournamentBanner tournament={tournament} />
                
                <div className="relative z-10">
                    <button onClick={onBack} className="absolute top-0 left-0 p-2 -ml-2 bg-black/30 backdrop-blur-md rounded-full text-white/80 hover:text-white transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                    </button>
                    
                    <div className="mt-8">
                        <div className="flex justify-between items-end mb-2">
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter drop-shadow-md">{tournament.title}</h2>
                            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                                <span className="text-[9px] font-bold text-white/50 uppercase block">Prêmio Total</span>
                                <span className="text-xl font-black text-[#d97d1b]">{tournament.prizePool}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-white/80 font-bold uppercase tracking-wider drop-shadow-md">
                            <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {timeLeft || tournament.endsIn}</span>
                            <span>•</span>
                            <span>{tournament.participants} Participantes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Status Card */}
            {tournament.userJoined && (
                <div className="p-4 bg-[#141516] border-b border-white/5 shrink-0">
                    <div className="bg-gradient-to-br from-[#1b1c1d] to-[#0f0f10] p-4 rounded-xl border border-white/5 flex justify-between items-center shadow-inner">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Sua Posição</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white italic">#{myRank}</span>
                                <span className="text-[10px] font-bold text-white/30 uppercase">Ranking</span>
                            </div>
                        </div>
                        
                        <div className="h-8 w-px bg-white/10" />

                        <div className="flex flex-col text-right">
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Sua Pontuação</span>
                            <div className="flex items-baseline gap-1 justify-end">
                                <span className={`text-xl font-black italic ${tournament.rankingType === 'highest_multiplier' ? 'text-[#913ef2]' : 'text-[#28a745]'}`}>
                                    {tournament.rankingType === 'highest_multiplier' ? `${myScore.toFixed(2)}x` : `${myScore.toFixed(0)} Pts`}
                                </span>
                            </div>
                            {distance > 0 && <span className="text-[8px] text-[#e51a31] font-bold">-{distance.toFixed(0)} do líder</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex bg-[#141516] border-b border-white/5 shrink-0">
                {(['ranking', 'rules', 'prizes'] as const).map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                    >
                        {tab === 'ranking' ? 'Classificação' : tab === 'rules' ? 'Regras' : 'Prêmios'}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#e51a31] shadow-[0_0_10px_#e51a31]" />}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-[#050505]">
                
                {/* RANKING TAB */}
                {activeTab === 'ranking' && (
                    <div className="space-y-1">
                        <div className="flex justify-between px-4 mb-2 text-[8px] font-black uppercase text-white/20 tracking-widest">
                            <span>Pos / Jogador</span>
                            <span>Pontuação</span>
                        </div>
                        {sortedParticipants.length === 0 ? (
                            <div className="text-center py-10 text-white/20 text-xs font-bold uppercase">Ranking vazio. Jogue para entrar!</div>
                        ) : (
                            sortedParticipants.map((p, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${p.userId === 1 ? 'bg-[#e51a31]/10 border-[#e51a31]/30' : 'bg-[#1b1c1d] border-white/5'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-amber-700 text-black' : 'bg-white/10 text-white/50'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold ${p.userId === 1 ? 'text-[#e51a31]' : 'text-white'}`}>{p.username}</span>
                                            {tournament.leagueType === 'multiplier' && <span className="text-[8px] text-white/40">{p.flightsUsed}/{tournament.flightsLimit} voos</span>}
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-white">
                                        {tournament.rankingType === 'highest_multiplier' ? `${p.score.toFixed(2)}x` : `${p.score.toFixed(0)}`}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* RULES TAB */}
                {activeTab === 'rules' && (
                    <div className="space-y-6">
                        <div className="bg-[#1b1c1d] p-5 rounded-2xl border border-white/5">
                            <h4 className="text-sm font-bold text-white uppercase mb-4">Regulamento AeroFantasy</h4>
                            
                            <div className="bg-[#34b1e2]/10 border border-[#34b1e2]/20 p-4 rounded-xl mb-4">
                                <h5 className="text-[10px] font-black text-[#34b1e2] uppercase mb-1">
                                    {tournament.leagueType === 'aerocoin' && "Liga de Aerocoins"}
                                    {tournament.leagueType === 'multiplier' && "Liga dos Multiplicadores"}
                                    {tournament.leagueType === 'vela' && "Liga em Busca da Vela"}
                                </h5>
                                <p className="text-[10px] text-white/70">
                                    {tournament.leagueType === 'aerocoin' && `Você recebe ${tournament.initialAerocoins} Aerocoins. Aumente seu saldo para subir no ranking.`}
                                    {tournament.leagueType === 'multiplier' && `Você tem ${tournament.flightsLimit} voos para marcar a maior pontuação possível.`}
                                    {tournament.leagueType === 'vela' && "Apenas cashouts acima de 10.00x contam. O prêmio acumula se ninguém vencer!"}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                    <span className="text-[9px] font-bold text-white/40 uppercase block mb-1">Critério</span>
                                    <span className="text-xs font-bold text-[#34b1e2]">
                                        {tournament.rankingType === 'highest_multiplier' ? 'Maior Multiplicador' : 'Saldo Acumulado'}
                                    </span>
                                </div>
                                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                    <span className="text-[9px] font-bold text-white/40 uppercase block mb-1">Taxa de Entrada</span>
                                    <span className="text-xs font-bold text-white">R$ {tournament.entryFee.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRIZES TAB */}
                {activeTab === 'prizes' && (
                    <div className="space-y-3">
                        {tournament.prizes?.map((prize, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-[#1b1c1d] border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${prize.position === 1 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-white/10 text-white'}`}>
                                        #{prize.position}
                                    </div>
                                    <span className="text-sm font-bold text-white">Posição {prize.position}</span>
                                </div>
                                <span className="text-sm font-black text-[#d97d1b]">{prize.reward}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Action */}
            {!tournament.userJoined && (
                <div className="p-4 bg-[#141516] border-t border-white/5 shrink-0">
                    <button 
                        onClick={handleJoinClick}
                        disabled={isProcessing}
                        className="w-full bg-[#e51a31] hover:bg-[#ff1f3a] disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-wait text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processando...
                            </>
                        ) : (
                            tournament.entryFee > 0 ? `Entrar na Liga (R$ ${tournament.entryFee})` : 'Entrar Gratuitamente'
                        )}
                    </button>
                </div>
            )}

            {tournament.userJoined && (
                <div className="p-4 bg-[#141516] border-t border-white/5 shrink-0">
                    <button 
                        onClick={handleJoinClick}
                        disabled={isProcessing}
                        className="w-full bg-[#28a745] hover:bg-[#218838] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
                    >
                        {isProcessing ? 'Carregando...' : 'Acessar Sala da Liga'}
                    </button>
                </div>
            )}
        </div>
    );
}

const TournamentsModal: React.FC<TournamentsModalProps> = ({ onClose, tournaments, onJoinTournament, isInline = false }) => {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId) || null;

  const handleJoin = () => {
      if (selectedTournament && onJoinTournament) {
          onJoinTournament(selectedTournament.id, selectedTournament.entryFee);
      }
  };

  const renderContent = () => {
    return (
      <div className={isInline 
        ? "bg-[#1b1c1d] w-full rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl flex flex-col min-h-[500px] max-h-[95dvh] sm:max-h-[90vh] overflow-hidden"
        : "bg-[#1b1c1d] w-full max-w-lg rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden"
      }>
        
        {selectedTournament ? (
            <TournamentDetail 
                tournament={selectedTournament} 
                onBack={() => setSelectedTournamentId(null)}
                onJoin={handleJoin}
            />
        ) : (
            <>
                {/* List Header */}
                <div className="bg-[#141516] p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                   <div>
                      <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">
                        Aero<span className="text-[#34b1e2]">Fantasy</span> Ligas
                      </h2>
                      <p className="text-xs text-white/60 font-medium">Competições estilo Cartola com prêmios reais.</p>
                   </div>
                   {!isInline && (
                     <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-white transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                     </button>
                   )}
                </div>

                {/* List Content */}
                <div className="p-6 overflow-y-auto no-scrollbar flex-1 bg-[#050505]">
                   <AeroFantasyBanners />
                   <div className="space-y-4">
                      {tournaments.length === 0 ? (
                          <div className="text-center py-10 text-white/20 font-bold uppercase tracking-widest">
                              Nenhuma liga ativa no momento.
                          </div>
                      ) : (
                          tournaments.map(tournament => (
                              <TournamentCard 
                                key={tournament.id} 
                                tournament={tournament} 
                                onClick={() => setSelectedTournamentId(tournament.id)}
                              />
                          ))
                      )}
                   </div>
                </div>
            </>
        )}
      </div>
    );
  };

  if (isInline) {
    return renderContent();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      {renderContent()}
    </div>
  );
};

export default TournamentsModal;
