import React, { useState } from 'react';
import { CabineSession } from '../types';

interface CabineExitConfirmationModalProps {
  cabine: CabineSession;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CabineExitConfirmationModal: React.FC<CabineExitConfirmationModalProps> = ({
  cabine,
  onCancel,
  onConfirm
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Financial calculations (50% share for each pilot)
  const initialShare = Math.round((cabine.initialBalance / 2) * 100) / 100;
  const currentShare = Math.round((cabine.currentBalance / 2) * 100) / 100;
  
  const netResult = Math.round((currentShare - initialShare) * 100) / 100;
  const isProfit = netResult >= 0;

  const handleConfirmAction = () => {
    setIsProcessing(true);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#111827] border-2 border-[#1f2937] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans text-white">
        
        {/* HEADER SÓLIDO */}
        <div className="p-4 border-b border-[#1f2937] flex items-center justify-between bg-[#1f2937]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚠️</span>
            <div className="text-left">
              <h3 className="text-sm font-black uppercase text-white tracking-wider">
                Atenção • Saindo da Cabine
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Sua banca compartilhada será liquidada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-7 h-7 rounded-lg bg-[#111827] hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border border-[#374151]"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed text-left">
            Ao trocar de modo ou sair do jogo, você será **removido da cabine** <strong className="text-white uppercase">{cabine.name}</strong>. 
            Isso irá resgatar a sua cota de **50% da banca atual** e creditá-la de volta na sua carteira de saldo real.
          </p>

          {/* PAINEL FINANCEIRO DE LIQUIDAÇÃO CO-OP */}
          <div className="space-y-2 bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937] text-left">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#1f2937]">
              <span className="text-[10px] uppercase font-black text-slate-400">Detalhamento Financeiro (Seu 50%)</span>
              <span className="text-[8px] bg-sky-950 border border-sky-800 text-sky-400 px-1.5 py-0.2 rounded font-mono font-bold">50% SHARE</span>
            </div>

            {/* Aporte de Entrada */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">Aporte Realizado na Entrada:</span>
              <span className="font-mono font-bold text-white">R$ {initialShare.toFixed(2)}</span>
            </div>

            {/* Cota Atual */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Sua Cota Atual na Cabine (50%):</span>
              <span className="font-mono font-bold text-emerald-400">R$ {currentShare.toFixed(2)}</span>
            </div>

            {/* Resultado Líquido */}
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#1f2937]">
              <span className="text-slate-400">Resultado da Operação:</span>
              <span className={`font-mono font-black ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                {isProfit ? `▲ +R$ ${netResult.toFixed(2)} Lucro` : `▼ -R$ ${Math.abs(netResult).toFixed(2)} Prejuízo`}
              </span>
            </div>
          </div>

          {/* CARD DE RETORNO DO INVESTIMENTO */}
          <div className="p-3.5 bg-[#1f2937] border border-[#374151] rounded-xl text-left">
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block leading-none">
              Valor Creditado na Carteira:
            </span>
            <span className="text-2xl font-black font-mono text-sky-400 block mt-1">
              R$ {currentShare.toFixed(2)}
            </span>
            <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
              O mesmo valor correspondente aos outros 50% será devolvido à carteira do seu parceiro de cabine.
            </p>
          </div>

          {/* ACTIONS */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#374151] font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
            >
              Cancelar & Voltar
            </button>
            <button
              type="button"
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 border border-red-600 text-white font-black text-xs uppercase rounded-xl transition-colors cursor-pointer active:scale-95 shadow-md"
            >
              {isProcessing ? 'Saindo...' : 'Confirmar & Sair'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CabineExitConfirmationModal;
