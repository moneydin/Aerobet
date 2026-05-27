
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isSubscribed?: boolean;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isSubscribed }) => {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const quickEmojis = ["🚀", "🔥", "💸", "🔴", "⚫", "⚽"];

  return (
    <div className="flex flex-col h-full bg-[#1b1c1d] relative">
        
        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 bg-[#09090b]/50">
            {messages.length === 0 ? (
                <div className="text-center py-10 opacity-30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white">Chat Iniciado</p>
                    <p className="text-[9px] text-white/50 mt-1">Diga olá para a comunidade!</p>
                </div>
            ) : (
                messages.map((msg) => {
                    return (
                        <div key={msg.id} className="flex items-start gap-2 animate-in slide-in-from-left-2 duration-300">
                            {/* Avatar/Badge */}
                            <div className={`h-5 min-w-[32px] px-1 rounded flex items-center justify-center text-[7px] font-black uppercase text-white shadow-sm mt-0.5 ${msg.role === 'admin' ? 'bg-[#e51a31]' : 'bg-white/10'}`}>
                                {msg.role === 'admin' ? 'MOD' : 'USER'}
                            </div>
                            
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-[10px] font-bold truncate ${msg.role === 'admin' ? 'text-[#e51a31]' : 'text-white/60'}`}>
                                        {msg.user}
                                    </span>
                                    <span className="text-[8px] text-white/20">
                                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className={`text-[11px] leading-tight break-words ${msg.role === 'admin' ? 'text-white font-bold' : 'text-white/90'}`}>
                                    {msg.message}
                                </p>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[#141516] border-t border-white/5 shrink-0">
            {/* Quick Emojis */}
            <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
                {quickEmojis.map(emoji => (
                    <button 
                        key={emoji}
                        onClick={() => setInputValue(prev => prev + emoji)}
                        className="bg-white/5 hover:bg-white/10 rounded px-2 py-1 text-sm transition-colors active:scale-90"
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    maxLength={100}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-3 pr-10 py-3 text-xs text-white focus:border-[#e51a31] outline-none transition-colors placeholder:text-white/20"
                />
                <button 
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#e51a31] hover:bg-[#ff1f3a] text-white rounded-lg disabled:opacity-50 disabled:bg-transparent disabled:text-white/20 transition-all active:scale-95"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
                </button>
            </form>
        </div>
    </div>
  );
};

export default Chat;
