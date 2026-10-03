import React, { useState } from 'react';
import { CabineSession, GameStatus } from '../types';

interface CabinePartnerSlotProps {
  cabine: CabineSession;
  status: GameStatus;
  multiplier: number;
  onOpenChat: () => void;
  partnerBet?: {
    amount: number;
    targetMult?: number;
    cashedOut?: boolean;
    cashoutAt?: number;
    profit?: number;
  } | null;
}

export const CabinePartnerSlot: React.FC<CabinePartnerSlotProps> = ({
  cabine,
  status,
  multiplier,
  onOpenChat,
  partnerBet
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const isPilot = cabine.userRole === 'pilot';
  const partnerRoleLabel = isPilot ? 'Copiloto' : 'Piloto';
  const partnerName = isPilot ? (cabine.copilotName || 'Aguardando Copiloto...') : cabine.pilotName;
  const isPartnerConnected = isPilot ? Boolean(cabine.copilotName) : true;
  const copilotEntryShare = cabine.totalBankroll / 2;

  const handleCopyPassword = () => {
    if (cabine.password) {
      navigator.clipboard?.writeText(cabine.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyAllCredentials = () => {
    const inviteText = `🚀 Convite para o Modo Cabine do AeroGame!\nNome da Cabine: ${cabine.name}\nSenha: ${cabine.password || 'Sem senha'}\nAporte de Entrada (50%): R$ ${copilotEntryShare.toFixed(2)}\nEntre no AeroGame > Modo Cabine > Inserir Nome e Senha para jogarmos juntos!`;
    navigator.clipboard?.writeText(inviteText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="h-full flex flex-col justify-between bg-[#1e293b] rounded-2xl border border-[#334155] p-3 shadow-md relative text-white font-sans">
      {/* Header Sólido e Limpo */}
      <div className="flex items-center justify-between pb-2 border-b border-[#334155] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#0f172a] border border-[#334155] flex items-center justify-center text-sky-400 text-sm shrink-0">
            👨‍✈️
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                Slot {isPilot ? '2' : '1'} • {partnerRoleLabel}
              </span>
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                isPartnerConnected 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                  : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}>
                {isPartnerConnected ? 'Conectado' : 'Aguardando'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold truncate max-w-[160px]">
              {partnerName}
            </p>
          </div>
        </div>

        {/* Quick Chat Shortcut */}
        <button
          type="button"
          onClick={onOpenChat}
          className="px-2 py-1 rounded-lg bg-[#0f172a] hover:bg-slate-700 border border-[#334155] text-[10px] font-bold uppercase tracking-wider text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
          title="Abrir Chat Privado"
        >
          <span>💬</span>
          <span>Chat</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="my-auto py-2">
        {!isPartnerConnected ? (
          /* WAITING FOR COPILOT TO CONNECT */
          <div className="space-y-2 text-center">
            <div className="p-2 rounded-xl bg-[#0f172a] border border-[#334155] text-left space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Cabine:</span>
                <span className="text-white font-mono font-bold">{cabine.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Senha:</span>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="font-mono text-amber-300 bg-amber-950/80 hover:bg-amber-900 px-2 py-0.5 rounded border border-amber-800 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{cabine.password || 'Sem senha'}</span>
                  <span>{copied ? '✓' : '📋'}</span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Aporte 50%:</span>
                <span className="text-emerald-400 font-mono font-bold">R$ {copilotEntryShare.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyAllCredentials}
                className="w-full py-2.5 px-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-100 rounded-xl text-xs font-black uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>{copiedAll ? '✓ Dados Copiados!' : '📋 Copiar Convite para Copiloto'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* PARTNER CONNECTED: LIVE FLIGHT TELEMETRY */
          <div className="space-y-1.5">
            {status === GameStatus.WAITING && (
              <div className="p-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-300 tracking-wider block">
                  {partnerRoleLabel} Preparando Voo
                </span>
                <p className="text-xs text-slate-400">
                  {partnerBet 
                    ? `Aposta programada: R$ ${partnerBet.amount.toFixed(2)}` 
                    : `Sincronizando banca da cabine...`}
                </p>
                <div className="text-[9px] text-slate-500 font-mono">
                  Banca disponível: R$ {cabine.currentBalance.toFixed(2)}
                </div>
              </div>
            )}

            {status === GameStatus.FLYING && (
              <div className="p-2.5 rounded-xl bg-[#0f172a] border border-[#334155] space-y-1.5 text-left">
                {partnerBet ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Aposta do Parceiro:</span>
                      <span className="font-bold font-mono text-white">
                        R$ {partnerBet.amount.toFixed(2)}
                      </span>
                    </div>

                    {partnerBet.cashedOut ? (
                      <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-700 text-center">
                        <span className="text-xs font-black text-emerald-300 font-mono block">
                          ✓ SACOU EM {partnerBet.cashoutAt?.toFixed(2)}x
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">
                          +R$ {(partnerBet.profit || 0).toFixed(2)} para a banca!
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[10px]">Retorno em Voo:</span>
                          <span className="font-mono text-emerald-400 font-black text-sm tabular-nums">
                            R$ {(partnerBet.amount * multiplier).toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-100"
                            style={{ width: `${Math.min(100, (multiplier / (partnerBet.targetMult || 2.5)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-xs text-slate-400 italic block">
                      {partnerRoleLabel} não apostou nesta rodada.
                    </span>
                    <span className="text-[9px] text-slate-500">
                      Preservando a banca da cabine
                    </span>
                  </div>
                )}
              </div>
            )}

            {status === GameStatus.CRASHED && (
              <div className="p-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-red-400 tracking-wider block">
                  Fim do Voo
                </span>
                <p className="text-xs text-slate-400">
                  {partnerBet?.cashedOut 
                    ? `Lucro garantido de +R$ ${(partnerBet.profit || 0).toFixed(2)}!`
                    : partnerBet 
                      ? `Ejetou tarde (-R$ ${partnerBet.amount.toFixed(2)})`
                      : `Banca preservada nesta rodada.`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Sólido */}
      <div className="pt-2 border-t border-[#334155] flex items-center justify-between text-[10px] text-slate-400 shrink-0">
        <span>Banca 50/50</span>
        <span className="font-mono text-emerald-400 font-bold">R$ {cabine.currentBalance.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default CabinePartnerSlot;
