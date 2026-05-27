
import React, { useState, useRef, useMemo } from 'react';
import { Transaction, Mission, GameEvent, GameStatus, WheelPrize, DepositConfig, EventPrize, AeroFantasyLeagueType, Banner, FreeFlightConfig, ClubeConfig } from '../../types';
import BannerAdmin from './BannerAdmin';
import FreeFlightAdmin from './FreeFlightAdmin';
import ClubeAdmin from './ClubeAdmin';
import SkinsAdmin from './SkinsAdmin';

interface AdminPanelProps {
  onClose: () => void;
  // Game Control
  gameStatus: GameStatus;
  currentMultiplier: number;
  onForceCrash: () => void;
  onSetNextResult: (val: number) => void;
  // RTP Control
  rtp?: number;
  onUpdateRtp?: (val: number) => void;
  // Bankroll Control
  houseBankroll?: number;
  onUpdateHouseBankroll?: (val: number) => void;
  // Revenue Stats
  subscriptionRevenue?: number;
  missionRevenue?: number;
  // Data
  users: any[];
  withdrawals: Transaction[]; // Pending withdrawals
  missions: Mission[];
  events: GameEvent[];
  tournaments: GameEvent[];
  // Wheel Data
  wheelPrizes?: WheelPrize[];
  onUpdateWheelPrize?: (prize: WheelPrize) => void;
  // Deposit Config Data
  depositConfigs?: DepositConfig[];
  onUpdateDepositConfig?: (config: DepositConfig) => void;
  // Handlers
  onApproveWithdrawal: (id: string) => void;
  onRejectWithdrawal: (id: string) => void;
  onUpdateUserBalance: (userId: number, newBalance: number) => void;
  onToggleUserBan: (userId: number) => void;
  onCreateMission: (mission: Mission) => void;
  onDeleteMission: (id: string) => void;
  onCreateEvent: (event: GameEvent, isTournament: boolean) => void;
  onDeleteEvent: (id: string, isTournament: boolean) => void;
  onUpdateEvent?: (event: GameEvent, isTournament: boolean) => void;
  onSendNotification?: (userId: number, message: string, type: 'info' | 'warning' | 'success' | 'reward') => void;
  // Banners
  banners: Banner[];
  onUpdateBanners: (banners: Banner[]) => void;
  // Free Flights
  freeFlightConfigs: FreeFlightConfig[];
  onUpdateFreeFlightConfigs: (configs: FreeFlightConfig[]) => void;
  // Clube Aerobet
  clubeConfig: ClubeConfig;
  onUpdateClubeConfig: (config: ClubeConfig) => void;
  // NOVO: Link para o novo admin
  onOpenAeroFantasyAdmin?: () => void;
}

const StatCard = ({ title, value, subtext, icon, color = "text-white", trend, onEdit, alert = false, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`bg-[#1b1c1d]/80 backdrop-blur-sm p-5 rounded-2xl border flex items-start justify-between transition-all shadow-xl group relative overflow-hidden ${
            alert ? 'border-[#e51a31]/50 bg-[#e51a31]/10' : 'border-white/5'
        } ${onClick ? 'cursor-pointer hover:border-white/20 hover:bg-white/5 active:scale-[0.98]' : 'hover:border-white/10 hover:-translate-y-1'}`}
    >
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            {icon}
        </div>
        <div className="relative z-10 w-full">
            <div className="flex justify-between items-center mb-2">
                <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${alert ? 'text-[#e51a31]' : 'text-white/40 group-hover:text-white/60 transition-colors'}`}>{title}</p>
                {onClick && !onEdit && (
                    <div className="text-white/10 group-hover:text-white/40 transition-colors">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                    </div>
                )}
                {onEdit && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }} 
                        className="text-white/20 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg hover:bg-white/10 z-20 relative" 
                        title="Editar Valor"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                )}
            </div>
            <h3 className={`text-2xl md:text-3xl font-black italic tracking-tight ${color}`}>{value}</h3>
            <div className="flex items-center gap-2 mt-2">
                {trend && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${trend > 0 ? 'bg-[#28a745]/20 text-[#28a745]' : 'bg-[#e51a31]/20 text-[#e51a31]'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
                {subtext && <p className="text-[9px] md:text-[10px] text-white/30 truncate group-hover:text-white/50 transition-colors">{subtext}</p>}
            </div>
        </div>
    </div>
);

const SectionHeader = ({ title, subtitle, action }: any) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4 border-b border-white/5 pb-4 md:pb-6">
        <div>
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">{title}</h2>
            <p className="text-xs md:text-sm text-white/50 mt-1 max-w-2xl leading-relaxed">{subtitle}</p>
        </div>
        {action}
    </div>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onClose, gameStatus, currentMultiplier, onForceCrash, onSetNextResult,
  rtp, onUpdateRtp,
  houseBankroll = 0, onUpdateHouseBankroll,
  subscriptionRevenue = 0, missionRevenue = 0,
  users, withdrawals, missions, events, tournaments, wheelPrizes, onUpdateWheelPrize,
  depositConfigs, onUpdateDepositConfig,
  onApproveWithdrawal, onRejectWithdrawal, onUpdateUserBalance, onToggleUserBan,
  onCreateMission, onDeleteMission, onCreateEvent, onDeleteEvent, onUpdateEvent, onSendNotification,
  banners, onUpdateBanners,
  freeFlightConfigs, onUpdateFreeFlightConfigs,
  clubeConfig, onUpdateClubeConfig,
  onOpenAeroFantasyAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'live' | 'cms' | 'finance' | 'users' | 'settings' | 'banners' | 'freeflights' | 'clube' | 'skins'>('dashboard');
  const [cmsSection, setCmsSection] = useState<'missions' | 'events' | 'wheel'>('missions');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Dashboard & Control State
  const [nextResultInput, setNextResultInput] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'vip' | 'bot' | 'admin'>('all');
  
  // CMS State
  const [newMission, setNewMission] = useState<Partial<Mission>>({ 
      title: '', description: '', 
      rewardFlights: 0, rewardBalance: 0,
      target: 10, minMultiplier: 0, entryCost: 0,
      type: 'bets_count', tier: 'free' 
  });

  // Event State (Enhanced)
  const [newEvent, setNewEvent] = useState<Partial<GameEvent>>({ 
      title: '', description: '', prizePool: '', status: 'live',
      isPaid: false, entryFee: 0, 
      leagueType: 'aerocoin', // Default
      rankingType: 'total_wager', 
      prizes: [{ position: 1, rewardType: 'cash', displayLabel: '' }] 
  });
  // const [eventImagesInput, setEventImagesInput] = useState(''); // REMOVIDO EM FAVOR DO UPLOAD
  const [uploadedEventImages, setUploadedEventImages] = useState<string[]>([]);
  const [eventDates, setEventDates] = useState({
      startDate: '', startTime: '', endDate: '', endTime: ''
  });

  // Calculated properties
  const totalUserLiabilities = users.reduce((acc, u) => acc + u.balance, 0); 
  const netProfit = houseBankroll - totalUserLiabilities;
  const isSolvent = netProfit >= 0;

  const filteredUsers = users.filter(u => {
      const searchTerm = userSearch.toLowerCase();
      const matchesSearch = u.username.toLowerCase().includes(searchTerm) || 
                            u.id.toString().includes(searchTerm) || 
                            (u.email && u.email.toLowerCase().includes(searchTerm)); 
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
  });

  const activeCMSList = useMemo(() => {
      if (cmsSection === 'missions') return missions;
      if (cmsSection === 'events') return events;
      return [];
  }, [cmsSection, missions, events, tournaments]);

  // Handlers
  const handleSetResult = () => { onSetNextResult(parseFloat(nextResultInput)); alert(`Próximo resultado definido.`); setNextResultInput(''); };
  const handleUpdateHouseBankroll = () => { 
      const val = prompt("Novo valor da Banca da Casa:", houseBankroll.toString());
      if(val && !isNaN(parseFloat(val)) && onUpdateHouseBankroll) onUpdateHouseBankroll(parseFloat(val));
  };
  const handleUpdateRtp = () => {
      const val = prompt("Novo RTP (0-100):", rtp?.toString());
      if(val && !isNaN(parseFloat(val)) && onUpdateRtp) onUpdateRtp(parseFloat(val));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setUploadedEventImages(prev => [...prev, ev.target!.result as string]);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const removeUploadedImage = (index: number) => {
      setUploadedEventImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateMission = () => { 
      if (!newMission.title || !newMission.description) {
          alert("Preencha título e descrição.");
          return;
      }
      onCreateMission({
          ...newMission, 
          id: `m-${Date.now()}`,
          current: 0,
          completed: false,
          rewardClaimed: false,
          accepted: false,
          tier: newMission.tier || 'free',
          type: newMission.type || 'bets_count'
      } as Mission); 
      // Reset
      setNewMission({ 
        title: '', description: '', rewardFlights: 0, rewardBalance: 0, target: 10, minMultiplier: 0, entryCost: 0, type: 'bets_count', tier: 'free' 
      });
  };
  
  const handleCreateEvent = () => {
      if(!newEvent.title || !eventDates.startDate || !eventDates.endDate) {
          alert("Preencha Título e Datas.");
          return;
      }
      
      const startTimestamp = new Date(`${eventDates.startDate}T${eventDates.startTime || '00:00'}`).getTime();
      const endTimestamp = new Date(`${eventDates.endDate}T${eventDates.endTime || '23:59'}`).getTime();

      onCreateEvent({
          ...newEvent,
          id: `e-${Date.now()}`,
          bannerGradient: 'from-[#34b1e2] to-[#1e7e34]',
          participants: 0,
          minEntry: newEvent.minEntry || 0,
          participantsList: [],
          userJoined: false,
          endTime: endTimestamp,
          startTime: startTimestamp,
          endsIn: 'Calculando...',
          rankingType: 'total_wager',
          isPaid: false,
          entryFee: 0,
          images: uploadedEventImages,
          config: { 
              entryDeadline: endTimestamp,
              frequency: 'specific_date'
          }
      } as GameEvent, false);
      
      setNewEvent({ 
          title: '', description: '', prizePool: '', status: 'live',
          isPaid: false, entryFee: 0, leagueType: 'aerocoin',
          prizes: [{ position: 1, rewardType: 'cash', displayLabel: '' }], image: undefined
      });
      setUploadedEventImages([]);
      setEventDates({ startDate: '', startTime: '', endDate: '', endTime: '' });
  };

  const handleTabChange = (t: any) => { setActiveTab(t); setIsSidebarOpen(false); };
  
  const SidebarItem = ({ id, label, icon }: any) => (
      <button 
        onClick={() => handleTabChange(id)}
        className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 group ${
            activeTab === id 
            ? 'bg-[#e51a31] text-white shadow-lg shadow-[#e51a31]/20' 
            : 'text-white/40 hover:bg-white/5 hover:text-white'
        }`}
      >
          <div className={`${activeTab === id ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>
             {icon}
          </div>
          {label}
          {activeTab === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      </button>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-[#09090b] text-white flex flex-row font-sans overflow-hidden selection:bg-[#e51a31] selection:text-white">
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 w-[280px] bg-[#121214] border-r border-white/5 flex flex-col shrink-0 z-50 shadow-2xl transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
         <div className="p-6 border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#e51a31] rounded-lg flex items-center justify-center font-black italic shadow text-white">A</div>
                <span className="font-black italic text-lg tracking-tighter">ADMIN</span>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/50"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
         </div>
         <div className="p-4 space-y-1">
             <SidebarItem id="dashboard" label="Visão Geral" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>} />
             <SidebarItem id="live" label="Controle ao Vivo" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>} />
             <SidebarItem id="finance" label="Financeiro" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
             <SidebarItem id="users" label="Usuários" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
             <SidebarItem id="banners" label="Banners" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>} />
             <SidebarItem id="freeflights" label="Voos Grátis" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>} />
             <SidebarItem id="clube" label="Clube Aerobet" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>} />
             <SidebarItem id="skins" label="Loja e Aeronaves" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>} />
             <SidebarItem id="cms" label="Missões & Eventos" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} />
             <SidebarItem id="settings" label="Configurações Gerais" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>} />
             
             {/* BOTÃO ESPECIAL AEROFANTASY */}
             <button 
                onClick={() => onOpenAeroFantasyAdmin?.()}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 mt-4 bg-[#34b1e2]/10 text-[#34b1e2] border border-[#34b1e2]/30 hover:bg-[#34b1e2] hover:text-black shadow-lg"
             >
                 <div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="12" y1="2" x2="12" y2="6"/></svg>
                 </div>
                 AeroFantasy
             </button>

             <button onClick={onClose} className="mt-4 w-full py-3 text-white/20 hover:text-white uppercase text-[10px] font-bold border border-white/5 rounded-xl hover:bg-white/5 transition-all">Sair do Painel</button>
         </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b] relative w-full">
          {/* Mobile Header */}
          <div className="lg:hidden p-4 border-b border-white/5 flex items-center justify-between bg-[#141516] shrink-0">
              <span className="font-black italic text-white uppercase tracking-tighter">Painel Admin</span>
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white bg-white/5 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
          </div>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth bg-gradient-to-b from-[#09090b] to-[#050505]">
              <div className="max-w-[1600px] mx-auto pb-20">
                  
                  {/* DASHBOARD TAB */}
                  {activeTab === 'dashboard' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <SectionHeader title="Painel de Controle" subtitle="Visão geral de performance e saúde da plataforma." />
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                              <StatCard title="Banca da Casa" value={`R$ ${(houseBankroll/1000).toFixed(1)}k`} subtext={isSolvent ? "Saudável" : "Risco"} color={isSolvent ? "text-[#28a745]" : "text-[#e51a31]"} onEdit={handleUpdateHouseBankroll} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M12 11v4"/></svg>} />
                              <StatCard title="Lucro Líquido" value={`R$ ${(netProfit/1000).toFixed(1)}k`} subtext="House Edge" color={netProfit > 0 ? "text-[#34b1e2]" : "text-[#e51a31]"} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
                              <StatCard title="RTP Configurado" value={`${rtp}%`} subtext="Return to Player" color="text-[#d97d1b]" onEdit={handleUpdateRtp} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>} />
                              <StatCard title="Receita (Subs)" value={`R$ ${subscriptionRevenue.toFixed(0)}`} subtext="Mensal" color="text-[#913ef2]" icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
                          </div>
                      </div>
                  )}

                  {/* SETTINGS TAB (NEW) */}
                  {activeTab === 'settings' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <SectionHeader title="Configurações Gerais" subtitle="Controles globais da plataforma e algoritmos." />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              
                              {/* RTP Control */}
                              <div className="bg-[#1b1c1d] rounded-2xl border border-white/5 p-6">
                                  <div className="flex items-center gap-3 mb-4">
                                      <div className="p-2 bg-[#d97d1b]/10 rounded-lg text-[#d97d1b]">
                                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                                      </div>
                                      <div>
                                          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Controle de RTP</h3>
                                          <p className="text-xs text-white/40">Return to Player (Percentual de Devolução)</p>
                                      </div>
                                  </div>
                                  
                                  <div className="mb-6">
                                      <div className="flex justify-between text-xs font-bold text-white mb-2">
                                          <span>Atual</span>
                                          <span className="text-[#d97d1b]">{rtp}%</span>
                                      </div>
                                      <input 
                                          type="range" 
                                          min="0" 
                                          max="100" 
                                          step="1" 
                                          value={rtp} 
                                          onChange={(e) => onUpdateRtp?.(parseInt(e.target.value))}
                                          className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-[#d97d1b]"
                                      />
                                      <div className="flex justify-between text-[9px] font-bold text-white/30 mt-1 uppercase">
                                          <span>Lucro Máximo (0%)</span>
                                          <span>Sem Lucro (100%)</span>
                                      </div>
                                  </div>

                                  <div className="bg-[#d97d1b]/5 p-4 rounded-xl border border-[#d97d1b]/20 text-[10px] text-white/60 leading-relaxed">
                                      <strong className="text-[#d97d1b]">Atenção:</strong> Alterar o RTP afeta diretamente a probabilidade de crash do avião. 
                                      Valores abaixo de 90% podem frustrar jogadores. Valores acima de 98% reduzem drasticamente o lucro da casa.
                                  </div>
                              </div>

                              {/* House Bankroll Control */}
                              <div className="bg-[#1b1c1d] rounded-2xl border border-white/5 p-6">
                                  <div className="flex items-center gap-3 mb-4">
                                      <div className="p-2 bg-[#28a745]/10 rounded-lg text-[#28a745]">
                                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M12 11v4"/></svg>
                                      </div>
                                      <div>
                                          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Banca da Casa</h3>
                                          <p className="text-xs text-white/40">Reserva técnica para pagamentos</p>
                                      </div>
                                  </div>

                                  <div className="space-y-4">
                                      <div>
                                          <label className="text-[10px] font-bold text-white/30 uppercase block mb-1">Valor Atual (R$)</label>
                                          <div className="flex gap-2">
                                              <input 
                                                  type="number" 
                                                  value={houseBankroll} 
                                                  onChange={(e) => onUpdateHouseBankroll?.(parseFloat(e.target.value))}
                                                  className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold w-full outline-none focus:border-[#28a745]" 
                                              />
                                              <button className="bg-[#28a745] hover:bg-[#218838] text-white px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors">
                                                  Salvar
                                              </button>
                                          </div>
                                      </div>
                                      <p className="text-[10px] text-white/40">
                                          Este valor é utilizado para calcular a solvência da plataforma. Mantenha sempre acima do passivo total dos usuários para garantir pagamentos.
                                      </p>
                                  </div>
                              </div>

                          </div>
                      </div>
                  )}

                  {/* LIVE CONTROL TAB */}
                  {activeTab === 'live' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <SectionHeader title="Controle de Jogo" subtitle="Manipule o resultado da próxima rodada em tempo real." />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="bg-[#1b1c1d] rounded-2xl border border-white/5 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Status Atual</span>
                                  <div className={`text-6xl font-black italic mb-2 ${gameStatus === GameStatus.FLYING ? 'text-[#e51a31]' : gameStatus === GameStatus.CRASHED ? 'text-white/20' : 'text-[#34b1e2]'}`}>
                                      {gameStatus === GameStatus.FLYING ? 'VOANDO' : gameStatus === GameStatus.CRASHED ? 'CRASHED' : 'AGUARDANDO'}
                                  </div>
                                  <div className="text-4xl font-mono text-white tabular-nums">{currentMultiplier.toFixed(2)}x</div>
                                  {gameStatus === GameStatus.FLYING && <button onClick={onForceCrash} className="mt-8 bg-[#e51a31] hover:bg-[#ff1f3a] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-[#e51a31]/30 active:scale-95 transition-all">CRASHAR AGORA</button>}
                              </div>
                              <div className="bg-[#1b1c1d] rounded-2xl border border-white/5 p-8">
                                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Próximo Resultado</h3>
                                  <div className="flex gap-2">
                                      <input type="number" value={nextResultInput} onChange={(e) => setNextResultInput(e.target.value)} placeholder="Ex: 1.00" step="0.01" className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold w-full outline-none focus:border-[#34b1e2]" />
                                      <button onClick={handleSetResult} className="bg-[#34b1e2] text-white px-6 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#2096c4]">Definir</button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* FINANCE TAB */}
                  {activeTab === 'finance' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <SectionHeader title="Solicitações Financeiras" subtitle="Aprovação manual de saques PIX." />
                          <div className="bg-[#1b1c1d] rounded-2xl border border-white/5 overflow-hidden">
                              <div className="p-4 bg-white/5 border-b border-white/5 grid grid-cols-4 text-[10px] font-bold text-white/40 uppercase tracking-widest"><span>ID</span><span>Valor</span><span>Destino</span><span className="text-right">Ação</span></div>
                              <div className="divide-y divide-white/5">
                                  {withdrawals.length === 0 ? <div className="p-8 text-center text-white/20 text-xs font-bold uppercase">Nenhuma solicitação pendente.</div> : withdrawals.map(tx => (
                                      <div key={tx.id} className="p-4 grid grid-cols-4 items-center"><div><div className="text-white font-bold text-xs">{tx.id.slice(0,8)}</div></div><div className="text-[#d97d1b] font-black italic">R$ {tx.amount.toFixed(2)}</div><div className="text-white/60 text-[10px] truncate pr-4">{tx.description}</div><div className="flex justify-end gap-2"><button onClick={() => onRejectWithdrawal(tx.id)} className="bg-[#e51a31]/10 text-[#e51a31] hover:bg-[#e51a31] hover:text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-colors">Rejeitar</button><button onClick={() => onApproveWithdrawal(tx.id)} className="bg-[#28a745] text-white hover:bg-[#218838] px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-colors shadow-lg">Aprovar</button></div></div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  )}

                  {/* USERS TAB */}
                  {activeTab === 'users' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <SectionHeader title="Base de Usuários" subtitle="Gerencie contas, saldos e permissões." />
                          <div className="flex gap-4 mb-6"><input type="text" placeholder="Buscar usuário..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="bg-[#1b1c1d] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#34b1e2] outline-none w-full max-w-md" /></div>
                          <div className="bg-[#1b1c1d] rounded-2xl border border-white/5 overflow-hidden">
                              <table className="w-full text-left">
                                  <thead className="bg-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest"><tr><th className="p-4">Usuário</th><th className="p-4">Saldo</th><th className="p-4">Status</th><th className="p-4 text-right">Ações</th></tr></thead>
                                  <tbody className="divide-y divide-white/5">{filteredUsers.map(user => (<tr key={user.id} className="hover:bg-white/[0.02]"><td className="p-4"><div className="font-bold text-white text-xs">{user.username}</div></td><td className="p-4 font-mono text-[#28a745]">R$ {user.balance.toFixed(2)}</td><td className="p-4"><span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${user.status === 'banned' ? 'bg-[#e51a31]/20 text-[#e51a31]' : 'bg-[#34b1e2]/20 text-[#34b1e2]'}`}>{user.status}</span></td><td className="p-4 text-right"><button onClick={() => onToggleUserBan(user.id)} className="text-white/40 hover:text-white text-[10px] font-bold uppercase border border-white/10 px-3 py-1.5 rounded hover:bg-white/5 transition-all">{user.status === 'banned' ? 'Desbanir' : 'Banir'}</button></td></tr>))}</tbody>
                              </table>
                          </div>
                      </div>
                  )}

                  {/* BANNERS TAB */}
                  {activeTab === 'banners' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <SectionHeader title="Gestão de Banners" subtitle="Configure os banners rotativos da página inicial." />
                          <BannerAdmin banners={banners} onUpdateBanners={onUpdateBanners} />
                      </div>
                  )}

                  {/* FREE FLIGHTS TAB */}
                  {activeTab === 'freeflights' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <SectionHeader title="Controle de Voos Grátis" subtitle="Configure campanhas e regras para voos gratuitos." />
                          <FreeFlightAdmin configs={freeFlightConfigs} onUpdateConfigs={onUpdateFreeFlightConfigs} />
                      </div>
                  )}

                  {/* CLUBE AEROBET TAB */}
                  {activeTab === 'clube' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <SectionHeader title="Gestão do Clube Aerobet" subtitle="Controle as regras do programa de fidelidade e recompensas." />
                          <ClubeAdmin config={clubeConfig} onUpdateConfig={onUpdateClubeConfig} />
                      </div>
                  )}

                  {/* SKINS TAB */}
                  {activeTab === 'skins' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <SectionHeader title="Aeronaves Customizadas" subtitle="Adicione novos modelos no jogo ajustando parâmetros visuais avançados." />
                          <SkinsAdmin />
                      </div>
                  )}

                  {/* CMS TAB */}
                  {activeTab === 'cms' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <SectionHeader title="Gestor de Conteúdo" subtitle="Crie missões e eventos simples para engajar." />

                          <div className="flex flex-wrap gap-2 md:gap-4 mb-8">
                              <button onClick={() => setCmsSection('missions')} className={`px-4 md:px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${cmsSection === 'missions' ? 'bg-[#28a745] text-white shadow-lg' : 'bg-[#1b1c1d] border border-white/5 text-white/40 hover:text-white'}`}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                Missões
                              </button>
                              <button onClick={() => setCmsSection('events')} className={`px-4 md:px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${cmsSection === 'events' ? 'bg-[#34b1e2] text-white shadow-lg' : 'bg-[#1b1c1d] border border-white/5 text-white/40 hover:text-white'}`}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                Eventos Promocionais
                              </button>
                          </div>

                          {/* MISSIONS CREATOR */}
                          {cmsSection === 'missions' && (
                              <div className="bg-[#1b1c1d] p-6 rounded-2xl border border-white/5 mb-8">
                                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-l-2 border-[#28a745] pl-3">Nova Missão</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="space-y-4">
                                          <div>
                                              <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Título</label>
                                              <input type="text" placeholder="Ex: Caçador de Velas" value={newMission.title} onChange={e => setNewMission({...newMission, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#28a745]" />
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Descrição</label>
                                              <textarea placeholder="Ex: Pegue 5 velas acima de 2.0x" value={newMission.description} onChange={e => setNewMission({...newMission, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#28a745] h-20 resize-none" />
                                          </div>
                                      </div>
                                      <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Meta (Qtd)</label>
                                                  <input type="number" value={newMission.target} onChange={e => setNewMission({...newMission, target: parseInt(e.target.value)})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#28a745]" />
                                              </div>
                                              <div>
                                                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Min Multi</label>
                                                  <input type="number" value={newMission.minMultiplier} onChange={e => setNewMission({...newMission, minMultiplier: parseFloat(e.target.value)})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#28a745]" />
                                              </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Tipo</label>
                                                  <select value={newMission.type} onChange={e => setNewMission({...newMission, type: e.target.value as any})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-[#28a745]">
                                                      <option value="bets_count">Contagem de Apostas</option>
                                                      <option value="total_wager">Volume Apostado</option>
                                                      <option value="multiplier_hit">Atingir Multiplicador</option>
                                                  </select>
                                              </div>
                                              <div>
                                                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Tier</label>
                                                  <select value={newMission.tier} onChange={e => setNewMission({...newMission, tier: e.target.value as any})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-[#28a745]">
                                                      <option value="free">Grátis</option>
                                                      <option value="premium">Elite (VIP)</option>
                                                  </select>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div className="mt-6 pt-6 border-t border-white/5">
                                      <label className="text-[10px] font-bold text-white/40 uppercase block mb-2">Recompensas</label>
                                      <div className="grid grid-cols-3 gap-4">
                                          <div className="bg-black/40 p-2 rounded-xl border border-white/5 flex items-center gap-2">
                                              <span className="text-[#28a745] font-black text-xs">R$</span>
                                              <input type="number" placeholder="0" value={newMission.rewardBalance} onChange={e => setNewMission({...newMission, rewardBalance: parseFloat(e.target.value)})} className="bg-transparent w-full text-white text-sm outline-none font-bold" />
                                          </div>
                                          <div className="bg-black/40 p-2 rounded-xl border border-white/5 flex items-center gap-2">
                                              <span className="text-[#913ef2] font-black text-xs">VOOS</span>
                                              <input type="number" placeholder="0" value={newMission.rewardFlights} onChange={e => setNewMission({...newMission, rewardFlights: parseInt(e.target.value)})} className="bg-transparent w-full text-white text-sm outline-none font-bold" />
                                          </div>
                                      </div>
                                  </div>

                                  <button onClick={handleCreateMission} className="w-full mt-6 bg-[#28a745] text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#218838] shadow-lg active:scale-95 transition-all">
                                      Publicar Missão
                                  </button>
                              </div>
                          )}

                          {/* EVENTS CREATOR (SIMPLE) */}
                          {cmsSection === 'events' && (
                               <div className="bg-[#1b1c1d] p-6 rounded-2xl border border-white/5 mb-8">
                                   <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-l-2 border-[#34b1e2] pl-3">Novo Evento Promocional</h3>
                                   <div className="space-y-6">
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                           <div>
                                               <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Título do Evento</label>
                                               <input type="text" placeholder="Ex: Carnaval de Prêmios" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-[#34b1e2] outline-none" />
                                           </div>
                                           <div>
                                               <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Descrição Curta</label>
                                               <input type="text" placeholder="Ex: Jogue agora e concorra a prêmios" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#34b1e2] outline-none" />
                                           </div>
                                       </div>

                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Início</label>
                                                <div className="flex gap-2">
                                                    <input type="date" value={eventDates.startDate} onChange={e => setEventDates({...eventDates, startDate: e.target.value})} className="bg-black border border-white/10 rounded-xl px-3 py-3 text-xs text-white w-full" />
                                                    <input type="time" value={eventDates.startTime} onChange={e => setEventDates({...eventDates, startTime: e.target.value})} className="bg-black border border-white/10 rounded-xl px-3 py-3 text-xs text-white w-24" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Fim</label>
                                                <div className="flex gap-2">
                                                    <input type="date" value={eventDates.endDate} onChange={e => setEventDates({...eventDates, endDate: e.target.value})} className="bg-black border border-white/10 rounded-xl px-3 py-3 text-xs text-white w-full" />
                                                    <input type="time" value={eventDates.endTime} onChange={e => setEventDates({...eventDates, endTime: e.target.value})} className="bg-black border border-white/10 rounded-xl px-3 py-3 text-xs text-white w-24" />
                                                </div>
                                            </div>
                                       </div>
                                       
                                       {/* Image UPLOAD Input */}
                                       <div>
                                           <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Upload do Banner</label>
                                           <div className="flex items-center gap-2">
                                               <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#34b1e2] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-[#34b1e2]/20 file:text-[#34b1e2] hover:file:bg-[#34b1e2]/30"
                                               />
                                           </div>
                                           {uploadedEventImages.length > 0 && (
                                               <div className="flex gap-2 mt-2 overflow-x-auto">
                                                   {uploadedEventImages.map((img, idx) => (
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

                                       <button onClick={() => handleCreateEvent()} className="w-full bg-[#34b1e2] hover:bg-[#2096c4] py-4 rounded-xl font-black uppercase text-xs tracking-widest text-white mt-2 shadow-lg active:scale-95 transition-all">Publicar Evento</button>
                                   </div>
                               </div>
                          )}
                          
                          {/* LIST DISPLAY */}
                          <div className="mt-8 space-y-4">
                              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Itens Ativos: {cmsSection === 'missions' ? 'Missões' : 'Eventos'}</h3>
                              <div className="grid grid-cols-1 gap-3">
                                  {activeCMSList.length === 0 && <div className="text-white/20 text-xs italic">Nenhum item cadastrado nesta seção.</div>}
                                  {activeCMSList.map((item: any) => (
                                      <div key={item.id} className="p-4 rounded-xl bg-[#1b1c1d] border border-white/5 flex justify-between items-center group hover:border-white/10 transition-colors">
                                          <div>
                                              <div className="font-bold text-white text-xs mb-1">{item.title}</div>
                                              <div className="text-[9px] text-white/40 font-mono">{item.id} • {item.description?.slice(0, 40)}...</div>
                                          </div>
                                          <button 
                                            onClick={() => cmsSection === 'missions' ? onDeleteMission(item.id) : onDeleteEvent(item.id, false)} 
                                            className="text-[#e51a31] hover:text-white bg-[#e51a31]/10 hover:bg-[#e51a31] text-[10px] font-bold uppercase px-4 py-2 rounded-xl transition-all"
                                          >
                                              Deletar
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </main>
      </div>
    </div>
  );
};

export default AdminPanel;
