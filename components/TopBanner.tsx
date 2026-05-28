
import React, { useState } from 'react';
import { AeroFantasyLeagueType } from '../types';

interface TopBannerProps {
  balance: number;
  aerocoinBalance?: number; 
  activeEventId?: string | null; 
  activeLeagueType?: AeroFantasyLeagueType | null; // NOVO
  fantasyFlightsLeft?: number | null; 
  onExitEvent?: () => void; 
  isMuted: boolean;
  onToggleMute: () => void;
  nextRoundHash: string;
  onShowFairness: () => void;
  onWalletClick: () => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onNotificationsClick: () => void;
  unreadNotifications: number;
  userAvatar: string;
}

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const TopBanner: React.FC<TopBannerProps> = ({
  balance,
  aerocoinBalance,
  activeEventId,
  activeLeagueType,
  fantasyFlightsLeft,
  onExitEvent,
  isMuted,
  onToggleMute,
  nextRoundHash,
  onShowFairness,
  onWalletClick,
  onMenuClick,
  onProfileClick,
  onNotificationsClick,
  unreadNotifications,
  userAvatar
}) => {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <nav className={`flex items-center justify-between px-2 sm:px-3 py-1.5 rounded-xl border flex-shrink-0 z-[60] shadow-lg sticky top-1.5 transition-colors duration-500 w-full overflow-x-auto no-scrollbar ${activeEventId ? 'bg-[#0f1922] border-[#34b1e2]/30' : 'bg-[#1b1c1d] border-white/5'}`}>
      <div className="flex items-center gap-1 sm:gap-3 md:gap-4 shrink-0">
        {/* Menu Hamburguer */}
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-1 text-white/50 hover:text-white transition-colors hover:bg-white/5 rounded-lg active:scale-95"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="flex items-center font-black text-base sm:text-lg italic tracking-tighter uppercase select-none">
          <span className="text-[#e51a31]">AERO</span>
          <span className="text-white">bet</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2 min-w-0 justify-end">
        <button
          onClick={onShowFairness}
          title="Provavelmente Justo"
          className="hidden lg:flex items-center gap-2 bg-black/40 px-2 py-1 rounded-full border border-white/10 hover:border-white/20 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#e51a31"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
          <div className="flex flex-col items-start">
             <span className="text-[7px] font-bold text-[#e51a31] uppercase leading-none">Hash da Próxima Rodada</span>
             <span className="text-[9px] font-mono text-white/50 leading-none truncate max-w-[100px]">
               {nextRoundHash}
             </span>
          </div>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          <button 
            onClick={onToggleMute}
            className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all active:scale-90"
          >
            {isMuted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            )}
          </button>
        </div>

        {/* Saldo, Notificações e Avatar */}
        <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-white/5 ml-1 sm:ml-2">
           
           <button 
             onClick={onNotificationsClick}
             className="relative p-1.5 sm:p-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white transition-all active:scale-95 shrink-0"
           >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#e51a31] rounded-full shadow-[0_0_5px_#e51a31] animate-pulse"></span>
              )}
           </button>

           {activeEventId ? (
                // --- MOSTRADOR DE AEROCOINS/FANTASY (MODO EVENTO) ---
                <div className="flex items-center gap-1 sm:gap-2 animate-in slide-in-from-top-2 duration-300 shrink-0">
                    <div className="bg-[#34b1e2]/10 px-2 sm:px-3 py-1.5 rounded-full border border-[#34b1e2]/30 flex items-center gap-1 sm:gap-2 shadow-[0_0_15px_rgba(52,177,226,0.2)] min-w-0">
                        {activeLeagueType === 'multiplier' ? (
                            <>
                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#34b1e2] flex items-center justify-center text-black font-black text-[8px] sm:text-[9px] shrink-0">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="sm:w-[10px] sm:h-[10px]"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                                </div>
                                <div className="flex flex-col items-end min-w-0">
                                    <span className="text-[#34b1e2] font-black text-[10px] sm:text-xs leading-none truncate max-w-[60px] sm:max-w-none">
                                        {fantasyFlightsLeft} Voos
                                    </span>
                                    <span className="text-[6px] sm:text-[7px] text-white/50 uppercase font-bold leading-none hidden sm:block">Restantes</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#34b1e2] flex items-center justify-center text-black font-black text-[8px] sm:text-[9px] shrink-0">A</div>
                                <div className="flex flex-col items-end min-w-0">
                                    <span className="text-[#34b1e2] font-black text-[10px] sm:text-xs leading-none truncate max-w-[60px] sm:max-w-none">
                                        {Math.floor(aerocoinBalance || 0)} AC
                                    </span>
                                    <span className="text-[6px] sm:text-[7px] text-white/50 uppercase font-bold leading-none hidden sm:block">Saldo Fantasy</span>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* BOTÃO DE SAIR DO EVENTO */}
                    <button 
                        onClick={onExitEvent}
                        className="bg-[#e51a31] hover:bg-[#ff1f3a] text-white p-1.5 sm:p-2 rounded-full shadow-lg active:scale-95 transition-all border border-white/10 shrink-0"
                        title="Sair do Modo Evento"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sm:w-[16px] sm:h-[16px]"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </button>
                </div>
           ) : (
                // --- MOSTRADOR DE SALDO REAL ---
                <div className="bg-[#141516] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/10 flex items-center gap-1 sm:gap-2 shadow-inner hover:bg-[#1f2022] transition-colors cursor-pointer shrink-0 min-w-0" onClick={onWalletClick}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowBalance(!showBalance); }}
                        className="text-white/40 hover:text-white transition-colors p-0.5 sm:p-1 shrink-0"
                        title={showBalance ? "Ocultar Saldo" : "Mostrar Saldo"}
                    >
                        {showBalance ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                    <span className="text-[#28a745] font-black text-[10px] sm:text-xs min-w-[40px] sm:min-w-[60px] text-right truncate max-w-[60px] sm:max-w-none">
                        {showBalance ? `R$ ${balance.toFixed(2)}` : 'R$ ****'}
                    </span>
                    <button 
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#28a745] rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold cursor-pointer hover:bg-[#218838] transition-all text-white shadow-lg ml-0.5 shrink-0"
                    title="Abrir Carteira"
                    >
                    +
                    </button>
                </div>
           )}
          
          <button 
            onClick={onProfileClick}
            className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden hover:border-[#e51a31] transition-all active:scale-95 shadow-lg group"
          >
             <img 
               src={userAvatar} 
               alt="User" 
               className="w-full h-full object-cover transition-transform group-hover:scale-110"
             />
          </button>
        </div>

      </div>
    </nav>
  );
};

export default TopBanner;
