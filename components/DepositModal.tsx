
import React, { useState } from 'react';

interface DepositModalProps {
  onClose: () => void;
  onDepositConfirm: (amount: number) => void;
}

const PIX_KEY = "00020126580014br.gov.bcb.pix013625503d0e-c00c-4f88-8ce7-f8d0653545d852040000530398654040.015802BR5922Dorvalina F D S Borges6011Sao Goncalo62290525WPY2d48fb50102140d493d86c63049F86";
const DEPOSIT_AMOUNTS = [10, 20, 30, 40, 50, 100, 200, 500, 1000];

const DepositModal: React.FC<DepositModalProps> = ({ onClose, onDepositConfirm }) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirm = () => {
      if (!selectedAmount) return;
      setIsProcessing(true);
      // Simulate API call and confirmation
      setTimeout(() => {
          onDepositConfirm(selectedAmount);
          onClose();
      }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1b1c1d] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="font-black italic uppercase tracking-tighter text-lg text-white">Fazer um Depósito</h3>
          <button onClick={onClose} disabled={isProcessing} className="text-white/40 hover:text-white transition-colors disabled:opacity-50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto no-scrollbar">
          {selectedAmount === null ? (
             <div>
                <span className="text-sm font-bold text-white/50 text-center block mb-4">Selecione um valor para depositar:</span>
                <div className="grid grid-cols-3 gap-3">
                    {DEPOSIT_AMOUNTS.map(amount => (
                        <button 
                            key={amount}
                            onClick={() => setSelectedAmount(amount)}
                            className="bg-[#2c2d30] hover:bg-[#3d3f44] text-white py-4 rounded-xl font-black text-lg transition-all active:scale-95 shadow-lg"
                        >
                            R$ {amount}
                        </button>
                    ))}
                </div>
             </div>
          ) : (
             <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95 duration-300">
                <span className="text-sm font-bold text-white/50">
                    Pague R$ <span className="text-white text-base">{selectedAmount.toFixed(2)}</span> para continuar
                </span>
                
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(PIX_KEY)}`}
                    alt="QR Code PIX"
                    width="180"
                    height="180"
                    className="bg-white p-2 rounded-lg shadow-inner"
                />

                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">PIX Copia e Cola</span>
                <div className="w-full bg-black/40 p-2 rounded-lg border border-white/10 flex items-center">
                    <p className="text-[10px] font-mono text-white/60 overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left px-2">
                        {PIX_KEY}
                    </p>
                    <button 
                        onClick={handleCopy}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-colors w-28 shrink-0 ${isCopied ? 'bg-[#28a745]' : 'bg-[#e51a31] hover:bg-[#ff1f3a]'}`}
                    >
                        {isCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                </div>

                <div className="mt-4 w-full">
                  <button 
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className="w-full bg-[#28a745] hover:bg-[#218838] disabled:bg-gray-600 disabled:cursor-wait text-white font-bold py-4 rounded-xl transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {isProcessing && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                    {isProcessing ? 'Confirmando Pagamento...' : 'Pagamento Confirmado'}
                  </button>
                  <button 
                    onClick={() => setSelectedAmount(null)}
                    disabled={isProcessing}
                    className="w-full text-white/40 hover:text-white mt-3 text-xs font-bold transition-colors"
                  >
                    Escolher outro valor
                  </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
