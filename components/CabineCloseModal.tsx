import React, { useState } from 'react';
import { CabineSession } from '../types';

interface CabineCloseModalProps {
  cabine: CabineSession;
  onClose: () => void;
  onConfirmClose: () => void;
}

export const CabineCloseModal: React.FC<CabineCloseModalProps> = ({
  cabine,
  onClose,
  onConfirmClose
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const initial = cabine.initialBalance;
  const current = cabine.currentBalance;
  const profit = Math.round((current - initial) * 100) / 100;
  const isProfit = profit >= 0;
  const sharePerPilot = Math.max(0, Math.round((current / 2) * 100) / 100);

  const handleConfirm = () => {
    setIsProcessing(true);
    onConfirmClose();
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header Sólido */}
        <div className="p-4 border-b border-[#334155] flex items-center justify-between bg-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🚪</span>
            <div className="text-left">
              <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                Encerrar Operação da Cabine
              </h3>
              <p className="text-[10px] text-slate-300">
                Divisão igualitária dos fundos (50% / 50%)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#0f172a] hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-center">
          <p className="text-xs text-slate-300 leading-relaxed text-left">
            Ao encerrar a cabine <strong className="text-white">{cabine.name}</strong>, a banca final acumulada será distribuída igualmente entre o Piloto e o Copiloto.
          </p>

          {/* Cards de Resumo Financeiro */}
          <div className="grid grid-cols-2 gap-2 text-left text-xs">
            <div className="p-3 rounded-xl bg-[#1e293b] border border-[#334155] space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Banca Inicial</span>
              <span className="text-base font-black font-mono text-white">R$ {initial.toFixed(2)}</span>
              <span className="text-[9px] text-slate-500 block">(R$ {(initial/2).toFixed(2)} cada)</span>
            </div>

            <div className="p-3 rounded-xl bg-[#1e293b] border border-[#334155] space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Banca Final</span>
              <span className="text-base font-black font-mono text-emerald-400">R$ {current.toFixed(2)}</span>
              <span className={`text-[9px] font-bold block ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                {isProfit ? `+R$ ${profit.toFixed(2)} Lucro` : `-R$ ${Math.abs(profit).toFixed(2)} Prejuízo`}
              </span>
            </div>
          </div>

          {/* Destaque do Retorno para a Carteira */}
          <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155] text-left space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Seu Crédito Imediato na Carteira:
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-emerald-400">
                R$ {sharePerPilot.toFixed(2)}
              </span>
              <span className="text-[10px] font-bold uppercase text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                50% da Banca Final
              </span>
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              O mesmo valor de R$ {sharePerPilot.toFixed(2)} será creditado para o seu parceiro de cabine.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
            >
              Continuar Voando
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer active:scale-95 shadow-md"
            >
              {isProcessing ? 'Finalizando...' : 'Encerrar & Resgatar 50%'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CabineCloseModal;
