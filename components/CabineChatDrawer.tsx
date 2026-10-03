import React, { useState, useEffect, useRef } from 'react';
import { CabineSession, CabineMessage } from '../types';
import { sendCabineMessage, listenToCabineMessages } from '../src/utils/cabineService';

interface CabineChatDrawerProps {
  cabine: CabineSession;
  currentUsername: string;
  onClose: () => void;
}

export const CabineChatDrawer: React.FC<CabineChatDrawerProps> = ({
  cabine,
  currentUsername,
  onClose
}) => {
  const [messages, setMessages] = useState<CabineMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_CALLOUTS = [
    '🚀 Decolando juntos!',
    '💰 Saio no 2.0x!',
    '💎 Vou segurar até 5.0x!',
    '⚠️ Cuidado com vela baixa!',
    '🎯 Boa puxada, parceiro!',
    '⏸️ Vamos pular esta rodada!'
  ];

  useEffect(() => {
    const unsub = listenToCabineMessages(cabine.id, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [cabine.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    const role = cabine.userRole || 'pilot';

    const localMsg: CabineMessage = {
      id: `local-${Date.now()}`,
      cabineId: cabine.id,
      sender: currentUsername || (role === 'pilot' ? cabine.pilotName : (cabine.copilotName || 'Copiloto')),
      role,
      text: textToSend.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, localMsg]);
    setInputText('');

    try {
      await sendCabineMessage({
        cabineId: cabine.id,
        sender: localMsg.sender,
        role,
        text: textToSend.trim()
      });
    } catch (e) {
      console.warn('Error sending message:', e);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[130] w-full sm:w-96 bg-[#090f19] border-l border-cyan-500/30 shadow-2xl flex flex-col font-sans text-white animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 bg-[#060a12] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            🔒
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Chat da Cabine
              </h4>
              <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                Privado
              </span>
            </div>
            <p className="text-[10px] text-white/40 truncate max-w-[200px]">
              {cabine.name} • Apenas você e seu parceiro
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Pilots Summary Header */}
      <div className="px-4 py-2 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between text-[11px] text-white/70 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">👨‍✈️</span>
          <span><strong>Piloto:</strong> {cabine.pilotName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs">👨‍✈️</span>
          <span><strong>Copiloto:</strong> {cabine.copilotName || 'Aguardando...'}</span>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-white/40 space-y-2 text-xs">
            <span className="text-3xl block">🎧</span>
            <p className="font-bold uppercase text-[11px]">Canal de Voz & Chat Aberto</p>
            <p className="text-[10px] text-white/30 max-w-xs mx-auto">
              Comunique-se em tempo real com seu copiloto para coordenar entradas, saques e estratégias de banca.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender === currentUsername || m.role === cabine.userRole;
            const isPilotRole = m.role === 'pilot';

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span className={`font-black uppercase px-1.5 py-0.2 rounded text-[8px] ${
                    isPilotRole ? 'bg-amber-400/20 text-amber-300' : 'bg-cyan-400/20 text-cyan-300'
                  }`}>
                    {isPilotRole ? 'Piloto' : 'Copiloto'}
                  </span>
                  <span className="font-bold text-white/70">{m.sender}</span>
                </div>

                <div
                  className={`p-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-tr-none shadow-md'
                      : 'bg-white/10 text-white/90 rounded-tl-none border border-white/5'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Tactical Callout Chips */}
      <div className="p-2.5 border-t border-white/5 bg-[#070b13] shrink-0">
        <span className="text-[9px] uppercase font-bold text-white/40 block mb-1.5">
          Comandos Rápidos de Voo:
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_CALLOUTS.map((callout, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(callout)}
              className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-[10px] text-cyan-200 hover:text-white whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95"
            >
              {callout}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputText);
        }}
        className="p-3 bg-[#060a12] border-t border-white/10 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Mensagem privada para a cabine..."
          maxLength={120}
          className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="py-2 px-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 text-black font-black text-xs uppercase rounded-xl transition-all cursor-pointer shadow-md"
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default CabineChatDrawer;
