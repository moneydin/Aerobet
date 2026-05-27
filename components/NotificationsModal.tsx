
import React, { useState } from 'react';
import { AppNotification } from '../types';

interface NotificationsModalProps {
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: AppNotification) => void; // NOVO Handler
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ 
    onClose, 
    notifications, 
    onMarkAllRead, 
    onClearAll,
    onNotificationClick 
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setExpandedId(prev => prev === id ? null : id);
  };
  
  const handleItemClick = (n: AppNotification) => {
      if (onNotificationClick && n.category) {
          onNotificationClick(n);
      } else {
          setExpandedId(prev => prev === n.id ? null : n.id);
      }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'success': return <div className="w-8 h-8 rounded-full bg-[#28a745]/20 text-[#28a745] flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>;
          case 'warning': return <div className="w-8 h-8 rounded-full bg-[#d97d1b]/20 text-[#d97d1b] flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>;
          case 'reward': return <div className="w-8 h-8 rounded-full bg-[#913ef2]/20 text-[#913ef2] flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg></div>;
          case 'info': return <div className="w-8 h-8 rounded-full bg-[#34b1e2]/20 text-[#34b1e2] flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div>;
          default: return <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div>;
      }
  };

  const formatTime = (timestamp: number) => {
      const diff = Date.now() - timestamp;
      if (diff < 60000) return 'Agora';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
      return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-start justify-end p-4 sm:p-6 pointer-events-none">
      <div className="bg-[#1b1c1d] w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden pointer-events-auto animate-in slide-in-from-right-10 duration-300">
        
        {/* Header */}
        <div className="bg-[#141516] p-4 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white italic uppercase tracking-wider">Notificações</h2>
              <span className="bg-[#e51a31] text-white text-[9px] font-bold px-1.5 rounded-md">{notifications.filter(n => !n.read).length}</span>
           </div>
           <div className="flex gap-2">
               <button onClick={onMarkAllRead} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-wider transition-colors">Ler tudo</button>
               <div className="w-px h-3 bg-white/10 self-center"></div>
               <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
               </button>
           </div>
        </div>

        {/* List */}
        <div className="p-2 overflow-y-auto no-scrollbar flex-1 bg-[#050505]">
           {notifications.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-40 text-white/20">
                   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                   <span className="text-xs font-bold uppercase tracking-widest">Tudo limpo</span>
               </div>
           ) : (
               <div className="space-y-2">
                   {notifications.map(notification => {
                       const isExpanded = expandedId === notification.id;
                       const isClickable = !!notification.category;

                       return (
                           <div 
                             key={notification.id} 
                             onClick={() => handleItemClick(notification)}
                             className={`relative p-3 rounded-xl border flex gap-3 transition-all group ${
                                 notification.read 
                                 ? 'bg-[#1b1c1d] border-white/5 opacity-70 hover:opacity-100' 
                                 : 'bg-[#141516] border-white/10 shadow-lg'
                             } ${isExpanded ? 'bg-[#1f2022] border-white/20 ring-1 ring-white/10' : ''} ${isClickable ? 'cursor-pointer hover:border-[#34b1e2]/30 hover:bg-[#34b1e2]/5' : ''}`}
                           >
                               <div className="shrink-0 pt-1">
                                   {getIcon(notification.type)}
                               </div>
                               <div className="flex-1 min-w-0">
                                   <div className="flex justify-between items-start mb-0.5">
                                       <h4 className={`text-xs font-bold ${notification.read ? 'text-white/60' : 'text-white'}`}>{notification.title}</h4>
                                       <span className="text-[9px] text-white/30 whitespace-nowrap ml-2">{formatTime(notification.timestamp)}</span>
                                   </div>
                                   
                                   {/* Message Content */}
                                   <p className={`text-[10px] text-white/50 leading-snug break-words transition-all ${isExpanded ? 'text-white/80' : 'line-clamp-1'}`}>
                                       {notification.message}
                                   </p>

                                   {/* Invitation Action */}
                                   {isClickable && (
                                       <div className="mt-2 flex items-center gap-2 text-[9px] font-black uppercase text-[#34b1e2] tracking-widest animate-pulse">
                                           <span>Participar Agora</span>
                                           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                                       </div>
                                   )}

                                   {/* Expanded Details */}
                                   {isExpanded && !isClickable && (
                                       <div className="mt-3 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
                                           <div className="flex justify-between items-center text-[8px] font-mono text-white/30 uppercase tracking-wider mb-1">
                                               <span>ID: {notification.id.substring(0, 8)}</span>
                                               <span>Tipo: {notification.type}</span>
                                           </div>
                                       </div>
                                   )}
                               </div>
                               
                               {/* Unread Indicator or Chevron */}
                               <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                                   {!notification.read && !isExpanded && (
                                       <div className="w-1.5 h-1.5 bg-[#e51a31] rounded-full shadow-[0_0_5px_#e51a31] mb-1" />
                                   )}
                                   {!isClickable && (
                                       <button 
                                            onClick={(e) => toggleExpand(e, notification.id)}
                                            className="p-1 hover:bg-white/5 rounded"
                                       >
                                           <svg 
                                             width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" 
                                             className={`text-white/20 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white/50' : ''}`}
                                           >
                                               <path d="M6 9l6 6 6-6"/>
                                           </svg>
                                       </button>
                                   )}
                               </div>
                           </div>
                       );
                   })}
               </div>
           )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
            <div className="p-3 bg-[#141516] border-t border-white/5">
                <button 
                    onClick={onClearAll}
                    className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                    Limpar Histórico
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default NotificationsModal;
