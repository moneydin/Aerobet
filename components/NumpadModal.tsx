import React, { useState, useEffect } from 'react';

interface NumpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (val: number) => void;
  currentValue: number;
  min: number;
  max: number;
  title: string;
  currencyPrefix?: string;
  suffix?: string;
  balance?: number;
  quickPresets?: number[];
}

const NumpadModal: React.FC<NumpadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentValue,
  min,
  max,
  title,
  currencyPrefix = "R$ ",
  suffix = "",
  balance,
  quickPresets = [5, 10, 20, 50, 100]
}) => {
  const [valString, setValString] = useState<string>(currentValue.toString());

  useEffect(() => {
    if (isOpen) {
      setValString(currentValue.toString());
    }
  }, [isOpen, currentValue]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (digit === '.') {
      if (valString.includes('.')) return;
      setValString(prev => (prev === '' ? '0.' : prev + '.'));
      return;
    }

    if (valString === '0' || valString === '') {
      setValString(digit);
    } else {
      // Limite de 2 casas decimais se houver ponto
      if (valString.includes('.')) {
        const parts = valString.split('.');
        if (parts[1] && parts[1].length >= 2) return;
      }
      // Limite de valor máximo
      const nextNum = parseFloat(valString + digit);
      if (nextNum > max) return;
      setValString(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (valString.length <= 1) {
      setValString('0');
    } else {
      setValString(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setValString('0');
  };

  const handlePreset = (preset: number) => {
    const safeVal = Math.min(max, Math.max(min, preset));
    setValString(safeVal.toString());
  };

  const handleMultiply = (factor: number) => {
    let num = parseFloat(valString) || min;
    let next = num * factor;
    next = Math.round(next * 100) / 100;
    next = Math.min(max, Math.max(min, next));
    setValString(next.toString());
  };

  const handleMax = () => {
    const maxPossible = balance ? Math.min(max, balance) : max;
    setValString(Math.max(min, Math.floor(maxPossible)).toString());
  };

  const handleConfirm = () => {
    let num = parseFloat(valString);
    if (isNaN(num) || num < min) num = min;
    if (num > max) num = max;
    onConfirm(num);
    onClose();
  };

  const currentNumeric = parseFloat(valString) || 0;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#121418] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-4 sm:p-5 flex flex-col gap-3 shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#e51a31]">{title}</span>
            <span className="text-xs text-white/50 font-bold">
              Min: {currencyPrefix}{min}{suffix} | Max: {currencyPrefix}{max.toLocaleString('pt-BR')}{suffix}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center font-bold text-lg active:scale-90 transition-transform"
          >
            ✕
          </button>
        </div>

        {/* Display do Valor */}
        <div className="bg-black/70 border-2 border-[#e51a31]/40 rounded-xl p-3 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          <span className="text-[9px] uppercase font-black tracking-widest text-white/40 mb-0.5">Valor Selecionado</span>
          <div className="text-3xl sm:text-4xl font-black italic text-white tracking-tight tabular-nums flex items-center gap-1 drop-shadow-md">
            <span className="text-[#e51a31] text-2xl sm:text-3xl">{currencyPrefix}</span>
            <span>{valString || '0'}</span>
            {suffix && <span className="text-[#e51a31] text-2xl">{suffix}</span>}
          </div>
          {balance !== undefined && (
            <span className="text-[10px] font-bold text-white/50 mt-1">
              Saldo: R$ {balance.toFixed(2)}
            </span>
          )}
        </div>

        {/* Presets e Multiplicadores Rápidos */}
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-5 gap-1.5 w-full">
            {quickPresets.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePreset(preset)}
                className="py-1.5 bg-[#1f2228] hover:bg-[#2c3038] text-white font-black text-xs rounded-lg active:scale-95 transition-all border border-white/5 hover:border-white/20 shadow-sm"
              >
                +{preset}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1.5 w-full">
            <button
              type="button"
              onClick={() => handlePreset(min)}
              className="py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-black text-[10px] uppercase rounded-md active:scale-95 transition-all"
            >
              Min
            </button>
            <button
              type="button"
              onClick={() => handleMultiply(0.5)}
              className="py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-black text-[10px] uppercase rounded-md active:scale-95 transition-all"
            >
              ½ Metade
            </button>
            <button
              type="button"
              onClick={() => handleMultiply(2)}
              className="py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-black text-[10px] uppercase rounded-md active:scale-95 transition-all"
            >
              2x Dobro
            </button>
            <button
              type="button"
              onClick={handleMax}
              className="py-1 bg-[#e51a31]/20 hover:bg-[#e51a31]/30 text-[#ff4458] font-black text-[10px] uppercase rounded-md active:scale-95 transition-all border border-[#e51a31]/30"
            >
              Max
            </button>
          </div>
        </div>

        {/* Teclado Numérico Touch Integrado (Sem abrir teclado nativo do celular) */}
        <div className="grid grid-cols-3 gap-2 w-full pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
            <button
              key={key}
              type="button"
              onClick={() => handleDigit(key)}
              className="h-12 bg-[#22262d] hover:bg-[#313640] active:bg-[#e51a31] text-white font-black text-xl rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center border border-white/5 select-none"
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-black text-sm uppercase rounded-xl active:scale-95 transition-all flex items-center justify-center border border-red-500/20 select-none"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 bg-[#22262d] hover:bg-[#313640] active:bg-[#e51a31] text-white font-black text-xl rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center border border-white/5 select-none"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 bg-[#22262d] hover:bg-[#313640] text-white/80 font-black text-lg rounded-xl active:scale-95 transition-all flex items-center justify-center border border-white/5 select-none"
          >
            ⌫
          </button>
        </div>

        {/* Botão de Confirmação */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-3.5 bg-gradient-to-r from-[#28a745] to-[#208a38] hover:from-[#2ecc71] hover:to-[#27ae60] text-white font-black text-sm sm:text-base uppercase tracking-wider rounded-xl shadow-[0_4px_16px_rgba(40,167,69,0.35)] active:scale-98 transition-all flex items-center justify-center gap-2 mt-1 cursor-pointer"
        >
          <span>Confirmar {currencyPrefix}{currentNumeric.toFixed(2)}{suffix}</span>
        </button>
      </div>
    </div>
  );
};

export default NumpadModal;
