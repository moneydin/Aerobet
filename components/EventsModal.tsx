
import React, { useState, useEffect } from 'react';
import { GameEvent } from '../types';
import AeroFantasyBanners from './AeroFantasyBanners';

interface EventsModalProps {
  onClose: () => void;
  events: GameEvent[];
  onJoinEvent?: (eventId: string, cost: number) => void;
}

// Hook para Countdown
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
const EventBanner = ({ event }: { event: GameEvent }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = event.images && event.images.length > 0 ? event.images : (event.image ? [event.image] : []);

    useEffect(() => {
        if (images.length > 1) {
            const interval = setInterval(() => {
                setCurrentImageIndex(prev => (prev + 1) % images.length);
            }, 4000); // 4 seconds rotation
            return () => clearInterval(interval);
        }
    }, [images]);

    return (
        <div className="absolute inset-0 bg-black">
            {images.length > 0 ? (
                images.map((img, idx) => (
                    <div 
                        key={idx}
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                        style={{backgroundImage: `url(${img})`}}
                    />
                ))
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-r ${event.bannerGradient}`} />
            )}
            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141516] via-[#141516]/40 to-transparent" />
        </div>
    );
};

// --- SUB-COMPONENT: Event Card (List Item) ---
const EventCard: React.FC<{ event: GameEvent, onClick: () => void }> = ({ event, onClick }) => {
    const timeLeft = useCountdown(event.endTime);
    
    return (
        <div 
            onClick={onClick}
            className="relative rounded-2xl overflow-hidden group border border-white/10 hover:border-[#34b1e2]/50 transition-all cursor-pointer bg-[#141516]"
        >
            {/* Background Image / Gradient */}
            <div className="h-32 w-full relative overflow-hidden">
                <EventBanner event={event} />
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
                    <div>
                        <div className="flex gap-2 mb-1">
                            {event.status === 'live' && <span className="bg-[#28a745] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded animate-pulse">Ao Vivo</span>}
                            {event.isPaid ? (
                                <span className="bg-[#d97d1b] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded">Entrada: R$ {event.entryFee}</span>
                            ) : (
                                <span className="bg-[#34b1e2] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded">Grátis</span>
                            )}
                        </div>
                        <h3 className="text-xl font-black italic text-white uppercase tracking-tight shadow-black drop-shadow-md">{event.title}</h3>
                    </div>
                </div>
            </div>
            
            <div className="p-4">
                <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-wide">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span className="text-white tabular-nums">{timeLeft || event.endsIn}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <span className="text-white">{event.participants + (event.participantsList?.length || 0)}</span>
                        </span>
                    </div>
                    <span className="text-[#d97d1b] font-black">{event.prizePool}</span>
                </div>

                <div className="flex items-center gap-2 mt-3 bg-[#34b1e2]/10 px-2 py-1 rounded border border-[#34b1e2]/20">
                    <span className="text-[9px] font-bold text-[#34b1e2] uppercase">
                        Receba {event.initialAerocoins || 1000} Aerocoins
                    </span>
                </div>

                <button className={`w-full mt-2 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
                    event.userJoined
                    ? 'bg-[#34b1e2] text-white shadow-lg shadow-[#34b1e2]/20'
                    : 'bg-white/5 text-white/30 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                    {event.userJoined ? 'Entrar no Evento' : 'Ver Detalhes'}
                </button>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Event Detail View (Drill Down) ---
const EventDetail: React.FC<{ 
    event: GameEvent, 
    onBack: () => void,
    onJoin: () => void
}> = ({ event, onBack, onJoin }) => {
    const [activeTab, setActiveTab] = useState<'ranking' | 'rules' | 'prizes'>('ranking');
    const [isProcessing, setIsProcessing] = useState(false);
    const timeLeft = useCountdown(event.endTime);

    const handleJoinClick = () => {
        setIsProcessing(true);
        onJoin();
        setTimeout(() => setIsProcessing(false), 2000);
    }

    // Filter & Sort Participants
    const sortedParticipants = [...(event.participantsList || [])].sort((a, b) => b.score - a.score);
    const myStats = sortedParticipants.find(p => p.userId === 1); // Mock ID 1 for me
    const myRank = myStats ? sortedParticipants.indexOf(myStats) + 1 : '-';
    
    // Calculate Distance to leader
    const leaderScore = sortedParticipants[0]?.score || 0;
    const myScore = myStats?.score || 0;
    const distance = leaderScore - myScore;

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300 bg-[#09090b]">
            {/* Detail Header */}
            <div className="relative h-48 w-full shrink-0">
                <EventBanner event={event} />
                
                <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors z-20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                </button>

                <div className="absolute bottom-6 left-6 right-6 z-10">
                    <div className="flex justify-between items-end mb-2">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter drop-shadow-md">{event.title}</h2>
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="text-[8px] font-bold text-white/50 uppercase block">Prêmio Total</span>
                            <span className="text-lg font-black text-[#d97d1b]">{event.prizePool}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/80 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 
                            {timeLeft || event.endsIn}
                        </span>
                        <span className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            {event.participants + (event.participantsList?.length || 0)} Participantes
                        </span>
                    </div>
                </div>
            </div>

            {/* My Status Card */}
            {event.userJoined && (
                <div className="px-6 py-2 shrink-0">
                    <div className="bg-gradient-to-br from-[#1b1c1d] to-[#0f0f10] p-4 rounded-xl border border-white/5 flex justify-between items-center shadow-lg">
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
                                <span className={`text-xl font-black italic ${event.rankingType === 'highest_multiplier' ? 'text-[#913ef2]' : 'text-[#34b1e2]'}`}>
                                    {event.rankingType === 'highest_multiplier' ? `${myScore.toFixed(2)}x` : `${myScore.toFixed(0)} AC`}
                                </span>
                            </div>
                            {distance > 0 && <span className="text-[8px] text-[#e51a31] font-bold">-{distance.toFixed(0)} AC do líder</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex bg-[#141516] border-b border-white/5 shrink-0 mx-6 mt-2 rounded-t-xl overflow-hidden">
                {(['ranking', 'rules', 'prizes'] as const).map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-white bg-[#1b1c1d]' : 'text-white/30 hover:text-white/60 bg-[#0f0f10]'}`}
                    >
                        {tab === 'ranking' ? 'Classificação' : tab === 'rules' ? 'Regras' : 'Prêmios'}
                        {activeTab === tab && <div className="absolute top-0 left-0 w-full h-0.5 bg-[#34b1e2]" />}
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
                            <span>Pontuação (Aerocoins)</span>
                        </div>
                        {sortedParticipants.length === 0 ? (
                            <div className="text-center py-10 text-white/20 text-xs font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-xl">
                                Ranking vazio.<br/>Seja o primeiro a pontuar!
                            </div>
                        ) : (
                            sortedParticipants.map((p, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${p.userId === 1 ? 'bg-[#34b1e2]/10 border-[#34b1e2]/30' : 'bg-[#1b1c1d] border-white/5'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-amber-700 text-black' : 'bg-white/10 text-white/50'}`}>
                                            {idx + 1}
                                        </div>
                                        <span className={`text-xs font-bold ${p.userId === 1 ? 'text-[#34b1e2]' : 'text-white'}`}>{p.username}</span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-white">
                                        {event.rankingType === 'highest_multiplier' ? `${p.score.toFixed(2)}x` : `${p.score.toFixed(0)} AC`}
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
                            <h4 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                Sobre o Evento
                            </h4>
                            <p className="text-xs text-white/60 leading-relaxed mb-6">{event.description}</p>
                            
                            <div className="bg-[#34b1e2]/10 border border-[#34b1e2]/20 p-4 rounded-xl mb-4">
                                <h5 className="text-[10px] font-black text-[#34b1e2] uppercase mb-1">Como Funciona o Saldo</h5>
                                <p className="text-[10px] text-white/70">
                                    Ao entrar, seu saldo real será guardado e você receberá <strong>{event.initialAerocoins || 1000} Aerocoins</strong>. 
                                    Use essas moedas para jogar e subir no ranking. Ao sair do evento, seu saldo real volta.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                    <span className="text-[9px] font-bold text-white/40 uppercase block mb-1">Critério de Vitória</span>
                                    <span className="text-xs font-bold text-[#34b1e2]">
                                        {event.rankingType === 'highest_multiplier' ? 'Maior Multiplicador (Vela)' : 'Maior Saldo Acumulado'}
                                    </span>
                                </div>
                                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                    <span className="text-[9px] font-bold text-white/40 uppercase block mb-1">Taxa de Entrada</span>
                                    <span className={`text-xs font-bold ${event.entryFee > 0 ? 'text-[#d97d1b]' : 'text-[#28a745]'}`}>
                                        {event.entryFee > 0 ? `R$ ${event.entryFee.toFixed(2)}` : 'Grátis'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRIZES TAB */}
                {activeTab === 'prizes' && (
                    <div className="space-y-3">
                        {event.prizes?.map((prize, idx) => (
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
                        {(!event.prizes || event.prizes.length === 0) && (
                            <div className="text-center py-10 text-white/20 text-xs font-bold uppercase tracking-widest">
                                Prêmios a definir
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Action */}
            {!event.userJoined && (
                <div className="p-4 bg-[#141516] border-t border-white/5 shrink-0">
                    <button 
                        onClick={handleJoinClick}
                        disabled={isProcessing}
                        className="w-full bg-[#34b1e2] hover:bg-[#2096c4] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Entrando na Arena...
                            </>
                        ) : (
                            event.entryFee > 0 ? `Pagar Entrada (R$ ${event.entryFee})` : 'Participar Gratuitamente'
                        )}
                    </button>
                </div>
            )}
            
            {event.userJoined && (
                <div className="p-4 bg-[#141516] border-t border-white/5 shrink-0">
                    <button 
                        onClick={handleJoinClick}
                        disabled={isProcessing}
                        className="w-full bg-[#28a745] hover:bg-[#218838] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
                    >
                        {isProcessing ? 'Carregando...' : 'Acessar Modo Evento'}
                    </button>
                </div>
            )}
        </div>
    );
}

const EventsModal: React.FC<EventsModalProps> = ({ onClose, events, onJoinEvent }) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedEvent = events.find(e => e.id === selectedEventId) || null;

  const handleJoin = () => {
      if (selectedEvent && onJoinEvent) {
          if (selectedEvent.isPaid && selectedEvent.entryFee > 0) {
              onJoinEvent(selectedEvent.id, selectedEvent.entryFee);
          } else {
              onJoinEvent(selectedEvent.id, 0);
          }
      }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#1b1c1d] w-full max-w-lg rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden">
        
        {selectedEvent ? (
            <EventDetail 
                event={selectedEvent} 
                onBack={() => setSelectedEventId(null)}
                onJoin={handleJoin}
            />
        ) : (
            <>
                {/* List Header */}
                <div className="bg-[#141516] p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                   <div>
                      <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">
                        Eventos & <span className="text-[#34b1e2]">Promoções</span>
                      </h2>
                      <p className="text-xs text-white/60 font-medium">Competições exclusivas para a comunidade.</p>
                   </div>
                   <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-white transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                   </button>
                </div>

                {/* List Content */}
                <div className="p-6 overflow-y-auto no-scrollbar flex-1 bg-[#050505]">
                   <AeroFantasyBanners />
                   <div className="space-y-6">
                      {events.length === 0 ? (
                          <div className="text-center py-10 text-white/20 font-bold uppercase tracking-widest">
                              Nenhum evento ativo no momento.
                          </div>
                      ) : (
                          events.map(event => (
                              <EventCard 
                                key={event.id} 
                                event={event} 
                                onClick={() => setSelectedEventId(event.id)} 
                              />
                          ))
                      )}
                   </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default EventsModal;
