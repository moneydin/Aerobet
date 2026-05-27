
import React from 'react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenWallet: () => void;
  onOpenMissions: () => void;
  onOpenEvents: () => void;
  onOpenTournaments: () => void;
  onOpenRanking: () => void;
  onOpenHistory: () => void;
  onOpenAchievements: () => void;
  onOpenAdmin: () => void;
  onOpenDailyWheel: () => void;
  onOpenFreeFlights: () => void;
  onOpenClube: () => void;
  onOpenBankrollManager: () => void; 
  onOpenSubscription: () => void;
  onOpenAlerts: () => void;
  onOpenReferral: () => void; 
  isMuted: boolean;
  onToggleMute: () => void;
  onInstallPWA?: () => void;
  showInstallButton?: boolean;
  isAdminUser: boolean;
}

const MenuItem = ({ icon, label, onClick, highlight = false, badge = null, badgeColor = 'bg-[#e51a31]' }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
      highlight 
        ? 'bg-[#e51a31] text-white shadow-[0_4px_15px_rgba(229,26,49,0.4)] hover:bg-[#ff1f3a]' 
        : 'text-white/60 hover:text-white hover:bg-white/5'
    }`}
  >
    <div className={`${highlight ? 'text-white' : 'text-white/40 group-hover:text-white'} transition-colors`}>
      {icon}
    </div>
    <span className="text-sm font-bold tracking-wide uppercase">{label}</span>
    {highlight && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />}
    {badge && (
      <span className={`ml-auto ${badgeColor} text-white text-[9px] font-black px-1.5 py-0.5 rounded-md animate-pulse shadow-lg`}>
        {badge}
      </span>
    )}
  </button>
);

const SideMenu: React.FC<SideMenuProps> = ({ 
  isOpen, 
  onClose, 
  onOpenProfile, 
  onOpenWallet,
  onOpenMissions,
  onOpenEvents,
  onOpenTournaments,
  onOpenRanking,
  onOpenHistory,
  onOpenAchievements,
  onOpenAdmin,
  onOpenDailyWheel,
  onOpenFreeFlights,
  onOpenClube,
  onOpenBankrollManager,
  onOpenSubscription,
  onOpenAlerts, 
  onOpenReferral,
  isMuted,
  onToggleMute,
  onInstallPWA,
  showInstallButton = false,
  isAdminUser
}) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-[280px] bg-[#141516] border-r border-white/10 z-[160] transform transition-transform duration-300 ease-out flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#e51a31] rounded-lg flex items-center justify-center font-black italic shadow-[0_0_10px_rgba(229,26,49,0.5)]">A</div>
            <span className="font-black italic tracking-tighter text-xl text-white">AERO<span className="text-[#e51a31]">bet</span></span>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 no-scrollbar">
          
          {/* --- BLOCO 1: FINANCEIRO & CORE (PRIORIDADE MÁXIMA) --- */}
          <MenuItem 
            highlight
            label="Carteira" 
            onClick={() => { onOpenWallet(); onClose(); }}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>} 
          />
          
          <MenuItem 
            label="Gestão & IA" 
            onClick={() => { onOpenBankrollManager(); onClose(); }}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>} 
          />

          <MenuItem 
            label="Minha Assinatura" 
            onClick={() => { onOpenSubscription(); onClose(); }}
            badge="PLANOS"
            badgeColor="bg-gradient-to-r from-[#d97d1b] to-yellow-500"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 20h14v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2h2z"/><path d="M5 14h14v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2h2z"/><path d="M5 8h14V6h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6h2z"/></svg>} 
          />

          <div className="h-px bg-white/5 my-2" />

          {/* --- BLOCO 2: ENGAJAMENTO DIÁRIO (RETENÇÃO) --- */}
          <MenuItem 
            label="Clube Aerobet" 
            onClick={() => { onOpenClube(); onClose(); }}
            badge="NOVO"
            badgeColor="bg-[#34b1e2]"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>} 
          />

          <MenuItem 
            label="Missões Diárias" 
            onClick={() => { onOpenMissions(); onClose(); }}
            badge="VOOS"
            badgeColor="bg-[#28a745]"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>} 
          />

          <MenuItem 
            label="Roleta Diária" 
            onClick={() => { onOpenDailyWheel(); onClose(); }}
            badge="GIRAR"
            badgeColor="bg-[#d97d1b]"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1-4-10z"/><path d="M2 12h20"/></svg>} 
          />

          <MenuItem 
            label="Voos Grátis" 
            onClick={() => { onOpenFreeFlights(); onClose(); }}
            badge="FREE"
            badgeColor="bg-[#913ef2]"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>} 
          />

          <div className="h-px bg-white/5 my-2" />

          {/* --- BLOCO 3: COMPETIÇÃO & EVENTOS (AEROCOINS) --- */}
          <div className="bg-[#34b1e2]/5 rounded-xl border border-[#34b1e2]/20 mb-2 overflow-hidden">
              <div className="px-4 py-2 border-b border-[#34b1e2]/10 bg-[#34b1e2]/10">
                  <span className="text-[9px] font-black text-[#34b1e2] uppercase tracking-widest block">Ligas & Torneios</span>
              </div>
              <div className="p-1 space-y-1">
                  <MenuItem 
                    label="AeroFantasy" 
                    onClick={() => { onOpenTournaments(); onClose(); }}
                    badge="LIGAS"
                    badgeColor="bg-[#34b1e2]"
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34b1e2" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="12" y1="2" x2="12" y2="6"/></svg>} 
                  />
                  <MenuItem 
                    label="Eventos Especiais" 
                    onClick={() => { onOpenEvents(); onClose(); }}
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>} 
                  />
              </div>
          </div>

          <MenuItem 
            label="Ranking Global" 
            onClick={() => { onOpenRanking(); onClose(); }}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>} 
          />

          <div className="h-px bg-white/5 my-2" />

          {/* --- BLOCO 4: PESSOAL & HISTÓRICO --- */}
          <MenuItem 
            label="Meu Perfil" 
            onClick={() => { onOpenProfile(); onClose(); }}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} 
          />

          <MenuItem 
            label="Minhas Conquistas" 
            onClick={() => { onOpenAchievements(); onClose(); }}
            badge="🏆"
            badgeColor="bg-yellow-500"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>} 
          />
          
           <MenuItem 
            label="Histórico de Jogo" 
            onClick={() => { onOpenHistory(); onClose(); }}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>} 
          />

           <div className="h-px bg-white/5 my-2" />

           {/* --- BLOCO 5: UTILITÁRIOS --- */}
           <MenuItem 
            label={isMuted ? "Ativar Som" : "Desativar Som"}
            onClick={onToggleMute}
            icon={isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            )}
          />

          <MenuItem 
            label="Alertas de Vela" 
            onClick={() => { onOpenAlerts(); onClose(); }}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
          />

          {showInstallButton && (
            <MenuItem 
              label="Instalar AeroFLA"
              onClick={() => { if (onInstallPWA) onInstallPWA(); onClose(); }}
              badge="INSTALAR"
              badgeColor="bg-gradient-to-r from-[#e51a31] to-red-600 animate-pulse border border-red-500"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e51a31" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
            />
          )}

           <MenuItem 
            label="Suporte 24/7" 
            onClick={() => { window.open('https://wa.me/5521975522492', '_blank'); onClose(); }}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>} 
          />

          <div className="h-px bg-white/5 my-2" />
          
          {isAdminUser && (
            <MenuItem 
              label="Acesso Admin" 
              onClick={() => { onOpenAdmin(); onClose(); }}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
            />
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5">
             <div className="bg-[#28a745]/10 rounded-xl p-4 border border-[#28a745]/20 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-r from-[#28a745]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="relative z-10 flex justify-between items-start mb-2">
                    <h4 className="font-black italic uppercase text-white">Indique e Ganhe</h4>
                    <div className="bg-[#28a745] text-white text-[8px] font-black px-1.5 py-0.5 rounded">R$ 10</div>
                 </div>
                 <p className="text-[10px] text-white/60 mb-3 relative z-10">Convide amigos e ganhe saldo real.</p>
                 <button 
                    onClick={() => { 
                        onOpenReferral();
                        onClose();
                    }} 
                    className="w-full py-2 bg-white text-[#28a745] font-black uppercase text-[10px] rounded-lg hover:bg-gray-100 transition-colors relative z-10 flex items-center justify-center gap-2 shadow-lg active:scale-95"
                 >
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                     Ver Painel
                 </button>
             </div>
             <div className="mt-4 flex justify-between text-[10px] text-white/30 uppercase font-bold tracking-widest">
                 <span>v2.5.0</span>
                 <span>AERObet Inc.</span>
             </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
