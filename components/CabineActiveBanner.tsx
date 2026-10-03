import React, { useState } from 'react';
import { CabineSession } from '../types';

interface CabineActiveBannerProps {
  cabine: CabineSession;
  onOpenChat: () => void;
  onCloseCabine: () => void;
  unreadCount?: number;
  isRadioOn?: boolean;
  onToggleRadio?: () => void;
  isMicMuted?: boolean;
  onToggleMicMute?: () => void;
  isTalking?: boolean;
  isPartnerTalking?: boolean;
  onStartTalking?: () => void;
  onStopTalking?: () => void;
  radioVolume?: number;
  isHandsFree?: boolean;
  onToggleHandsFree?: () => void;
}

export const CabineActiveBanner: React.FC<CabineActiveBannerProps> = ({
  cabine,
  onOpenChat,
  onCloseCabine,
  unreadCount = 0,
  isRadioOn = false,
  onToggleRadio,
  isMicMuted = false,
  onToggleMicMute,
  isTalking = false,
  isPartnerTalking = false,
  onStartTalking,
  onStopTalking,
  radioVolume = 0,
  isHandsFree = false,
  onToggleHandsFree
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const profit = Math.round((cabine.currentBalance - cabine.initialBalance) * 100) / 100;
  const isProfit = profit >= 0;
  const profitPercent = cabine.initialBalance > 0 
    ? ((profit / cabine.initialBalance) * 100).toFixed(1) 
    : '0.0';

  const pilotShareNow = Math.max(0, Math.round((cabine.currentBalance / 2) * 100) / 100);
  const initialPerPilot = Math.round((cabine.initialBalance / 2) * 100) / 100;
  const isPilot = cabine.userRole === 'pilot';
  const isCopilotWaiting = !cabine.copilotName;

  const handleCopyPassword = () => {
    if (cabine.password) {
      navigator.clipboard?.writeText(cabine.password);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleToggleHandsFree = () => {
    if (onToggleHandsFree) onToggleHandsFree();
  };

  return (
    <div className="w-full bg-[#111827] border-b-2 border-[#1f2937] text-white px-4 py-2.5 flex flex-col gap-2 font-sans relative z-20 shrink-0 shadow-lg">
      
      {/* SEÇÃO PRINCIPAL TELEMÉTRICA EM GRID DE INSTRUMENTOS (NUNCA EMBARALHA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
        
        {/* BLOCO 1: IDENTIFICAÇÃO E TRIPULAÇÃO (Sólido & Compacto) */}
        <div className="col-span-12 lg:col-span-4 flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-2 bg-[#1f2937] border border-[#374151] px-3 py-1.5 rounded-lg text-slate-100 font-bold text-xs shrink-0 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="truncate max-w-[150px] sm:max-w-[200px] tracking-wider uppercase">{cabine.name}</span>
          </div>

          <span className="bg-[#1e1b4b] border border-[#4338ca] text-indigo-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0">
            {isPilot ? '👨‍✈️ Piloto (Slot 1)' : '👨‍✈️ Copiloto (Slot 2)'}
          </span>

          {isCopilotWaiting ? (
            <div className="flex items-center gap-1.5 bg-amber-950/90 border border-amber-700/80 text-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span>Aguardando Copiloto</span>
              {cabine.password && (
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="ml-1.5 bg-amber-800/80 hover:bg-amber-700 text-white font-mono font-bold px-2 py-0.5 rounded text-[9px] cursor-pointer transition-colors border border-amber-600"
                  title="Copiar senha para o amigo"
                >
                  {copiedPass ? '✓ Copiado' : `Senha: ${cabine.password}`}
                </button>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 bg-[#1f2937] border border-[#374151] text-slate-300 text-[10px] px-2.5 py-1 rounded-md shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Copiloto: <strong className="text-white font-extrabold">{cabine.copilotName}</strong></span>
            </div>
          )}
        </div>

        {/* BLOCO 2: HUD DO SALDO COMPARTILHADO (Painel Central de Finanças) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 flex justify-center">
          <div className="flex items-center gap-3 bg-[#111827] border-2 border-[#374151] rounded-xl px-4 py-1.5 text-left w-full sm:w-auto shadow-md">
            
            {isCopilotWaiting ? (
              /* Apenas 1 Piloto na Cabine */
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">
                    Banca Ativa (Apenas Você):
                  </span>
                  <span className="text-[7.5px] bg-amber-950 text-amber-400 font-extrabold px-1.5 py-0.2 rounded border border-amber-800 uppercase tracking-wider">
                    Aguardando Copiloto
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-400 tabular-nums leading-none">
                    R$ {pilotShareNow.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold leading-none">
                    (Seu Aporte de 50%)
                  </span>
                </div>
                <div className="text-[9.5px] text-slate-400 mt-1 font-semibold">
                  Projeção Total se Copiloto entrar: <strong className="text-white font-mono">R$ {cabine.totalBankroll.toFixed(2)}</strong>
                </div>
              </div>
            ) : (
              /* Ambos os Pilotos na Cabine */
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">
                    Banca Compartilhada Ativa:
                  </span>
                  <span className="text-[7.5px] bg-emerald-950 text-emerald-400 font-extrabold px-1.5 py-0.2 rounded border border-emerald-800 uppercase tracking-wider">
                    ✓ Dupla Ativa (50/50)
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-400 tabular-nums leading-none">
                    R$ {cabine.currentBalance.toFixed(2)}
                  </span>
                  <span className={`text-[9.5px] font-mono font-bold leading-none ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isProfit ? `▲ +R$ ${profit.toFixed(2)}` : `▼ -R$ ${Math.abs(profit).toFixed(2)}`}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 border-t border-[#1f2937] pt-1 mt-1 text-[9px] text-left">
                  <div>
                    <span className="text-slate-400 block leading-none font-bold">Piloto ({cabine.pilotName}):</span>
                    <strong className="text-white font-mono">R$ {pilotShareNow.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block leading-none font-bold">Copiloto ({cabine.copilotName}):</span>
                    <strong className="text-sky-400 font-mono">R$ {pilotShareNow.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-1.5 rounded bg-[#1f2937] hover:bg-slate-700 transition-colors cursor-pointer border border-[#374151] self-center shrink-0 ml-1"
              title="Exibir Demonstrativo Financeiro"
            >
              {showDetails ? '▲ Ocultar' : '📊 Detalhes'}
            </button>
          </div>
        </div>

        {/* BLOCO 3: COMANDO RÁPIDO DO INTERCOM, CHAT E FECHAMENTO (Sólido & Alinhado) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
          
          {/* Caixa de Rádio Intercom VHF */}
          {onToggleRadio && (
            <div className="flex items-center gap-1.5 bg-[#1f2937] border border-[#374151] rounded-lg p-1 shrink-0 shadow-sm">
              <button
                type="button"
                onClick={onToggleRadio}
                className={`px-2.5 py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 border ${
                  isRadioOn
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                    : 'bg-[#111827] text-slate-400 hover:text-white border-[#374151]'
                }`}
                title={isRadioOn ? "Rádio Ativo • Desligar Intercom" : "Ligar Rádio VHF da Cabine"}
              >
                <span>🎙️</span>
                <span>{isRadioOn ? 'VHF Ativo' : 'Ligar Rádio'}</span>
              </button>

              {isRadioOn && (
                <div className="flex items-center gap-1.5">
                  {/* VU Meter Sólido */}
                  <div className="flex items-center gap-0.5 h-4.5 px-1 bg-[#111827] rounded border border-[#374151]" title={`Volume de Transmissão: ${radioVolume}%`}>
                    <span className={`w-0.5 rounded-sm transition-all duration-75 ${radioVolume > 5 ? 'h-3.5 bg-emerald-400' : 'h-1.5 bg-slate-700'}`} />
                    <span className={`w-0.5 rounded-sm transition-all duration-75 ${radioVolume > 30 ? 'h-3.5 bg-emerald-400' : 'h-1.5 bg-slate-700'}`} />
                    <span className={`w-0.5 rounded-sm transition-all duration-75 ${radioVolume > 65 ? 'h-3.5 bg-amber-400' : 'h-1.5 bg-slate-700'}`} />
                  </div>

                  {/* Botão Mute */}
                  {onToggleMicMute && (
                    <button
                      type="button"
                      onClick={onToggleMicMute}
                      className={`p-1.5 rounded text-[10px] cursor-pointer transition-colors border ${
                        isMicMuted 
                          ? 'bg-red-800 text-white border-red-700' 
                          : 'bg-[#111827] text-slate-300 hover:text-white border-[#374151]'
                      }`}
                      title={isMicMuted ? "Desmutar Microfone" : "Mutar Microfone"}
                    >
                      {isMicMuted ? '🔇' : '🎙️'}
                    </button>
                  )}

                  {/* PTT (Push-To-Talk) */}
                  {onStartTalking && onStopTalking && (
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); onStartTalking(); }}
                      onMouseUp={(e) => { e.preventDefault(); onStopTalking(); }}
                      onTouchStart={(e) => { e.preventDefault(); onStartTalking(); }}
                      onTouchEnd={(e) => { e.preventDefault(); onStopTalking(); }}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
                      className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider select-none cursor-pointer transition-colors border ${
                        isTalking
                          ? 'bg-red-600 text-white border-red-500 animate-pulse'
                          : isPartnerTalking
                            ? 'bg-sky-600 text-white border-sky-500'
                            : 'bg-[#111827] text-slate-200 border-[#374151] hover:bg-slate-700'
                      }`}
                    >
                      {isTalking ? 'FALANDO' : isPartnerTalking ? 'OUVINDO' : 'PTT'}
                    </button>
                  )}

                  {/* Hands-Free / Ativo */}
                  <button
                    type="button"
                    onClick={handleToggleHandsFree}
                    className={`px-1.5 py-1 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer border ${
                      isHandsFree 
                        ? 'bg-red-600 text-white border-red-500' 
                        : 'bg-[#111827] text-slate-400 hover:text-white border-[#374151]'
                    }`}
                    title="Alternar Microfone Contínuo (Sem PTT)"
                  >
                    {isHandsFree ? 'VOX ON' : 'PTT ONLY'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Botão Chat Privado */}
          <button
            type="button"
            onClick={onOpenChat}
            className="px-3 py-1.5 rounded-lg bg-[#1f2937] hover:bg-[#374151] border border-[#374151] text-slate-100 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Abrir Bate-Papo da Cabine"
          >
            <span>💬</span>
            <span>Chat</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center font-black animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Botão Encerrar Cabine e Dividir */}
          <button
            type="button"
            onClick={onCloseCabine}
            className="px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 border border-red-700 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
            title="Sair da Cabine e resgatar saldos (50/50)"
          >
            <span>🚪</span>
            <span>Encerrar (50/50)</span>
          </button>
        </div>
      </div>

      {/* POPDOWN DE INFORMAÇÕES CONTÁBEIS EXPANSÍVEL (Sólido & Alinhado) */}
      {showDetails && (
        <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-3.5 text-left space-y-2.5 text-xs animate-in fade-in slide-in-from-top-1.5 duration-200">
          <div className="flex items-center justify-between text-slate-300 font-extrabold uppercase tracking-widest text-[10px] border-b border-[#374151] pb-2">
            <span>📊 Painel de Controle de Liquidação Financeira</span>
            <span className="text-emerald-400 font-extrabold">Taxa de Divisão de Lucros: Exatamente 50% / 50%</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div className="bg-[#111827] p-2.5 rounded-lg border border-[#374151]">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Aporte Inicial Total:</span>
              <strong className="text-white font-mono text-xs">R$ {cabine.totalBankroll.toFixed(2)}</strong>
            </div>
            <div className="bg-[#111827] p-2.5 rounded-lg border border-[#374151]">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Seu Investimento (50%):</span>
              <strong className="text-white font-mono text-xs">R$ {initialPerPilot.toFixed(2)}</strong>
            </div>
            <div className="bg-[#111827] p-2.5 rounded-lg border border-[#374151]">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Desempenho da Cabine:</span>
              <strong className={`font-mono text-xs ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                {isProfit ? `+R$ ${profit.toFixed(2)}` : `-R$ ${Math.abs(profit).toFixed(2)}`} ({profitPercent}%)
              </strong>
            </div>
            <div className="bg-[#111827] p-2.5 rounded-lg border border-[#374151]">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Seu Resgate Projetado:</span>
              <strong className="text-sky-400 font-mono text-xs">R$ {pilotShareNow.toFixed(2)}</strong>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
            Ao encerrar a cabine, o saldo final acumulado de <strong>R$ {cabine.currentBalance.toFixed(2)}</strong> será dividido de forma automatizada e instantânea, creditando <strong>R$ {pilotShareNow.toFixed(2)}</strong> diretamente na carteira de cada piloto.
          </p>
        </div>
      )}
    </div>
  );
};

export default CabineActiveBanner;
