import React, { useState, useRef, useEffect } from 'react';
import { LiveBet, GameStatus, ChatMessage, CabineSession, CabineMessage } from '../types';
import Chat from './Chat';

interface SidebarProps {
  allBets?: LiveBet[];
  gameStatus?: GameStatus;
  currentMultiplier?: number;
  stats?: {
    count: number;
    amount: number;
    wins: number;
  };
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  myHistory?: LiveBet[];
  activeCabine?: CabineSession | null;
  cabineMessages?: CabineMessage[];
  onSendCabineMessage?: (text: string) => void;
  currentUsername?: string;
  isRadioOn?: boolean;
  onToggleRadio?: () => void;
  isMicMuted?: boolean;
  onToggleMicMute?: () => void;
  isTalking?: boolean;
  isPartnerTalking?: boolean;
  onStartTalking?: () => void;
  onStopTalking?: () => void;
  radioVolume?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  chatMessages, 
  onSendMessage,
  activeCabine,
  cabineMessages = [],
  onSendCabineMessage,
  currentUsername = 'Piloto',
  isRadioOn = false,
  onToggleRadio,
  isMicMuted = false,
  onToggleMicMute,
  isTalking = false,
  isPartnerTalking = false,
  onStartTalking,
  onStopTalking,
  radioVolume = 0
}) => {
  const [cabineInputText, setCabineInputText] = useState('');
  const cabineScrollRef = useRef<HTMLDivElement>(null);

  const QUICK_CALLOUTS = [
    '🚀 Decolando juntos!',
    '💰 Saio no 2.0x!',
    '💎 Vou segurar até 5.0x!',
    '⚠️ Cuidado vela baixa!',
    '🎯 Boa puxada parceiro!',
    '⏸️ Pular esta rodada'
  ];

  // Auto scroll do chat da cabine
  useEffect(() => {
    if (cabineScrollRef.current) {
      cabineScrollRef.current.scrollTop = cabineScrollRef.current.scrollHeight;
    }
  }, [cabineMessages, isPartnerTalking, isTalking]);

  const handleSendCabine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabineInputText.trim() || !onSendCabineMessage) return;
    onSendCabineMessage(cabineInputText.trim());
    setCabineInputText('');
  };

  const handleQuickCallout = (text: string) => {
    if (onSendCabineMessage) {
      onSendCabineMessage(text);
    }
  };

  // ==============================================================
  // MODO CABINE ATIVO: RENDERIZA O BATE-PAPO EXCLUSIVO DA CABINE
  // ==============================================================
  if (activeCabine) {
    const isPilot = activeCabine.userRole === 'pilot';

    return (
      <div className="flex flex-col h-full bg-[#111827] rounded-[24px] overflow-hidden border-2 border-[#1f2937] shadow-xl transition-all font-sans relative">
        {/* Header do Bate-Papo da Cabine */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#1f2937] border-b border-[#374151] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#111827] border border-[#374151] flex items-center justify-center text-sky-400 shrink-0">
              🎧
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-white truncate max-w-[130px]">
                Chat da Cabine
              </span>
              <span className="text-[10px] font-semibold text-slate-300 font-mono truncate max-w-[140px]">
                {activeCabine.name}
              </span>
            </div>
          </div>

          {/* Badge Privado */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#111827] border border-[#374151] text-slate-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              Privado
            </span>
          </div>
        </div>

        {/* Barra de Rádio Intercom Compacta na Sidebar */}
        <div className="px-3 py-2 bg-[#111827] border-b border-[#374151] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs">📻</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black uppercase text-slate-200">
                Intercom VHF
              </span>
              <span className="text-[8px] text-slate-400 font-mono">
                {isRadioOn ? '121.500 MHz (Ligado)' : 'Desconectado'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* VU Meter Visualizer */}
            {isRadioOn && (
              <div className="flex items-center gap-0.5 h-3.5 px-1 bg-[#111827] rounded border border-[#374151]">
                <span className={`w-0.5 rounded-sm transition-all duration-75 ${radioVolume > 5 ? 'h-3 bg-emerald-400' : 'h-1 bg-slate-700'}`} />
                <span className={`w-0.5 rounded-sm transition-all duration-75 ${radioVolume > 25 ? 'h-3 bg-cyan-400' : 'h-1 bg-slate-700'}`} />
                <span className={`w-0.5 rounded-sm transition-all duration-75 ${radioVolume > 60 ? 'h-3 bg-amber-400' : 'h-1 bg-slate-700'}`} />
                <span className={`w-0.5 rounded-sm transition-all duration-75 ${radioVolume > 85 ? 'h-3 bg-red-400' : 'h-1 bg-slate-700'}`} />
              </div>
            )}

            {isRadioOn && onToggleMicMute && (
              <button
                onClick={onToggleMicMute}
                className={`p-1 rounded text-[10px] border transition-colors cursor-pointer ${
                  isMicMuted ? 'bg-red-800 text-white border-red-700' : 'bg-[#111827] text-slate-300 hover:text-white border-[#374151]'
                }`}
                title={isMicMuted ? "Ativar microfone" : "Mutar microfone"}
              >
                {isMicMuted ? '🔇' : '🎙️'}
              </button>
            )}

            {onToggleRadio && (
              <button
                onClick={onToggleRadio}
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-colors cursor-pointer border ${
                  isRadioOn
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-500'
                    : 'bg-[#111827] text-slate-300 hover:text-white border-[#374151]'
                }`}
              >
                {isRadioOn ? 'Ligado' : 'Ligar'}
              </button>
            )}

            {isRadioOn && onStartTalking && onStopTalking && (
              <button
                onMouseDown={(e) => { e.preventDefault(); onStartTalking(); }}
                onMouseUp={(e) => { e.preventDefault(); onStopTalking(); }}
                onTouchStart={(e) => { e.preventDefault(); onStartTalking(); }}
                onTouchEnd={(e) => { e.preventDefault(); onStopTalking(); }}
                onContextMenu={(e) => e.preventDefault()}
                style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider select-none cursor-pointer transition-colors border ${
                  isTalking 
                    ? 'bg-red-600 text-white border-red-500 animate-pulse' 
                    : isPartnerTalking
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'
                }`}
                title="Pressione e segure para falar no rádio da cabine"
              >
                {isTalking ? '🔴 Falando' : isPartnerTalking ? '🎧 Ouvindo' : '🗣️ PTT'}
              </button>
            )}
          </div>
        </div>

        {/* Indicador de Transmissão ao Vivo */}
        {isPartnerTalking && (
          <div className="px-3 py-1 bg-sky-950 border-b border-sky-800 flex items-center justify-between text-[10px] text-sky-200 shrink-0">
            <span className="flex items-center gap-1">
              <span>🎧</span>
              <span>Parceiro falando no rádio...</span>
            </span>
            <span className="font-mono text-[8px] bg-sky-900 px-1.5 py-0.2 rounded text-sky-200">
              AUDIO ON
            </span>
          </div>
        )}

        {/* Lista de Mensagens Privadas da Cabine */}
        <div 
          ref={cabineScrollRef} 
          className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2.5 bg-[#0b1120]"
        >
          {cabineMessages.length === 0 ? (
            <div className="text-center py-8 opacity-50 space-y-1 text-slate-300">
              <span className="text-2xl block">🎧</span>
              <p className="text-[10px] font-bold uppercase tracking-widest">Canal Exclusivo da Cabine</p>
              <p className="text-[9px] text-slate-400">Apenas você e seu parceiro têm acesso a estas mensagens.</p>
            </div>
          ) : (
            cabineMessages.map((msg) => {
              const isMe = msg.sender === currentUsername || msg.role === activeCabine.userRole;
              const isPilotMsg = msg.role === 'pilot';

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded ${
                      isPilotMsg 
                        ? 'bg-blue-950 text-blue-300 border border-blue-800' 
                        : 'bg-teal-950 text-teal-300 border border-teal-800'
                    }`}>
                      {isPilotMsg ? 'PILOTO' : 'COPILOTO'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">
                      {msg.sender}
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-2xl max-w-[90%] text-xs leading-relaxed break-words shadow-sm ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-[#1e293b] text-slate-100 rounded-tl-none border border-[#334155]'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Callouts Rápidos da Cabine */}
        <div className="px-2 pt-1 pb-1.5 bg-[#0f172a] border-t border-[#334155] shrink-0">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {QUICK_CALLOUTS.map((callout) => (
              <button
                key={callout}
                onClick={() => handleQuickCallout(callout)}
                className="whitespace-nowrap px-2 py-0.5 rounded bg-[#1e293b] hover:bg-slate-700 text-slate-300 hover:text-white border border-[#334155] text-[9px] font-bold transition-colors cursor-pointer shrink-0"
              >
                {callout}
              </button>
            ))}
          </div>
        </div>

        {/* Input da Cabine */}
        <div className="p-2.5 bg-[#0f172a] border-t border-[#334155] shrink-0">
          <form onSubmit={handleSendCabine} className="relative">
            <input 
              type="text" 
              value={cabineInputText}
              onChange={(e) => setCabineInputText(e.target.value)}
              placeholder="Mensagem para a cabine..."
              maxLength={120}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-3 pr-9 py-2 text-xs text-white focus:border-blue-500 outline-none transition-colors placeholder:text-slate-500"
            />
            <button 
              type="submit"
              disabled={!cabineInputText.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==============================================================
  // MODO SOLO / COMUNIDADE PADRÃO: RENDERIZA O BATE-PAPO GLOBAL
  // ==============================================================
  return (
    <div className="flex flex-col h-full bg-[#1b1c1d] rounded-[24px] overflow-hidden border border-white/5 shadow-2xl transition-all font-sans relative">
      {/* Header do Bate-Papo da Comunidade */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#141516] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#e51a31]/15 border border-[#e51a31]/30 flex items-center justify-center text-[#e51a31]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Bate-Papo
            </span>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
              Comunidade AeroGame
            </span>
          </div>
        </div>

        {/* Indicador de Status Online */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
          <span className="text-[9px] font-black uppercase tracking-wider">
            Ao Vivo
          </span>
        </div>
      </div>

      {/* Componente de Chat em Tela Cheia */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Chat 
          messages={chatMessages} 
          onSendMessage={onSendMessage} 
        />
      </div>
    </div>
  );
};

export default Sidebar;
