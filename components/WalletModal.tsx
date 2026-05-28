
import React, { useState, useEffect } from 'react';
import { UserProfile, DepositConfig, UserStats } from '../types';

interface WalletModalProps {
  onClose: () => void;
  onDepositConfirm: (amount: number, hasOrderBump?: boolean) => void;
  onWithdrawConfirm: (amount: number, pixKey: string) => void;
  balance: number;
  userProfile: UserProfile;
  depositConfigs?: DepositConfig[];
  userStats: UserStats; // Prop adicionada para acessar bônus
}

// Fallback constant se não for passado via props
const DEFAULT_PIX_KEY = "00020126580014br.gov.bcb.pix013625503d0e-c00c-4f88-8ce7-f8d0653545d852040000530398654040.015802BR5922AERObetPagamentos6011RioDeJaneiro62290525WPY2d48fb50102140d493d86c63049F86";
const DEPOSIT_AMOUNTS = [20, 50, 100, 200, 500, 1000];
const BANKS = ["Nubank", "Inter", "Itaú", "Bradesco", "Banco do Brasil", "Caixa", "Santander", "C6 Bank", "PicPay", "Original"];

// Componente de Chip de Valor
const AmountChip: React.FC<{ value: number, selected: boolean, onClick: () => void }> = ({ value, selected, onClick }) => (
    <button
        onClick={onClick}
        className={`relative overflow-hidden py-3 px-2 rounded-xl font-black text-sm transition-all duration-200 border group ${
            selected 
            ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] transform scale-[1.02]' 
            : 'bg-[#141516] text-white/60 border-white/5 hover:border-white/20 hover:text-white hover:bg-[#1f2022]'
        }`}
    >
        <span className="relative z-10">R$ {value}</span>
        {selected && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />}
    </button>
);

const WalletModal: React.FC<WalletModalProps> = ({ onClose, onDepositConfirm, onWithdrawConfirm, balance, userProfile, depositConfigs, userStats }) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  
  // --- DEPOSIT STATES ---
  const [depositStep, setDepositStep] = useState<'amount' | 'payment'>('amount');
  const [selectedDepositAmount, setSelectedDepositAmount] = useState<number>(50);
  const [addOrderBump, setAddOrderBump] = useState(false); // NOVO STATE PARA ORDER BUMP
  const [isCopied, setIsCopied] = useState(false);
  const [paymentTimer, setPaymentTimer] = useState(600); // 10 minutos em segundos
  const [qrState, setQrState] = useState<'generating' | 'ready'>('ready'); // Estado da animação do QR

  // --- WITHDRAW STATES ---
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [pixKey, setPixKey] = useState(userProfile.cpf || '');
  const [withdrawalPin, setWithdrawalPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Timer para o QR Code
  useEffect(() => {
      let interval: any;
      if (depositStep === 'payment' && paymentTimer > 0) {
          interval = setInterval(() => setPaymentTimer(p => p - 1), 1000);
      }
      return () => clearInterval(interval);
  }, [depositStep, paymentTimer]);

  // Timer de Geração do QR Code
  useEffect(() => {
      if (depositStep === 'payment' && qrState === 'generating') {
          const timer = setTimeout(() => {
              setQrState('ready');
          }, 2000); // 2 segundos de animação
          return () => clearTimeout(timer);
      }
  }, [depositStep, qrState]);

  // Reset order bump se valor >= 50 (pois ganha grátis)
  useEffect(() => {
      if (selectedDepositAmount >= 50) {
          setAddOrderBump(false);
      }
  }, [selectedDepositAmount]);

  const formatTimer = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Helper para obter configuração atual
  // Se houver order bump, o valor total do PIX aumenta
  const getTotalToPay = () => {
      const baseAmount = selectedDepositAmount;
      return addOrderBump ? baseAmount + 47.90 : baseAmount;
  };

  const getCurrentDepositConfig = () => {
      const amount = selectedDepositAmount; // Usa o amount base para encontrar a config
      const config = depositConfigs?.find(c => c.amount === amount);
      // Se não achar, usa default. O valor no QR Code será o Total
      return config || { amount: amount, pixKey: DEFAULT_PIX_KEY, qrCodeImage: undefined };
  };

  const activeConfig = getCurrentDepositConfig();
  const totalToPay = getTotalToPay();

  const handleCopyPix = () => {
    navigator.clipboard.writeText(activeConfig.pixKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGeneratePix = () => {
      if (!selectedDepositAmount) return;
      setIsProcessing(true);
      setTimeout(() => {
          setIsProcessing(false);
          setDepositStep('payment');
          setQrState('generating'); // Inicia a animação
          setPaymentTimer(600);
      }, 600); // Pequeno delay no botão antes de trocar a tela
  };

  const handleSimulatePayment = () => {
      setIsProcessing(true);
      setTimeout(() => {
          // Passamos o valor TOTAL pago e flag do order bump
          onDepositConfirm(totalToPay, addOrderBump);
          onClose();
      }, 2000);
  };

  const handleConfirmWithdraw = () => {
    if (!userProfile.withdrawalPin) {
        setWithdrawError("Configure sua senha de saque no Perfil antes de sacar.");
        return;
    }
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 20) {
        setWithdrawError("Mínimo para saque: R$ 20,00");
        return;
    }
    if (amount > balance) {
        setWithdrawError("Saldo insuficiente (Bônus não pode ser sacado antes do rollover).");
        return;
    }
    if (withdrawalPin !== userProfile.withdrawalPin) {
        setWithdrawError("Senha de segurança incorreta.");
        return;
    }

    setIsProcessing(true);
    setWithdrawError(null);
    
    setTimeout(() => {
        onWithdrawConfirm(amount, pixKey);
        onClose();
    }, 2500);
  };

  const bonusBalance = userStats.bonusBalance;
  const realBalance = balance;
  const rolloverProgress = userStats.rolloverTarget > 0 ? (userStats.rolloverCurrent / userStats.rolloverTarget) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 font-sans">
      <div className="bg-[#09090b] w-full max-w-md rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[95dvh] sm:max-h-[92vh] overflow-hidden relative">
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#141516] to-transparent pointer-events-none" />
        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none transition-colors duration-500 ${activeTab === 'deposit' ? 'bg-[#28a745]/10' : 'bg-[#e51a31]/10'}`} />

        {/* Header Compacto & Saldo */}
        <div className="relative z-10 px-6 pt-6 pb-2">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b1c1d] to-black border border-white/10 flex items-center justify-center shadow-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">Minha Carteira</h2>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#28a745] animate-pulse"/>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Conexão Segura SSL</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            {/* Cartão de Saldo Pro */}
            <div className="bg-[#141516] rounded-2xl p-4 border border-white/5 flex flex-col gap-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Saldo Total</span>
                        <span className="text-3xl font-black text-white italic tracking-tighter">R$ {(realBalance + bonusBalance).toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-bold text-[#28a745] uppercase tracking-widest block bg-[#28a745]/10 px-2 py-0.5 rounded-md border border-[#28a745]/20">Disponível</span>
                    </div>
                </div>

                <div className="w-full h-px bg-white/5" />

                <div className="flex justify-between text-[10px]">
                    <div className="flex flex-col">
                        <span className="text-white/30 font-bold uppercase">Real (Sacável)</span>
                        <span className="text-white font-bold">R$ {realBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-white/30 font-bold uppercase">Bônus (Bloqueado)</span>
                        <span className="text-[#913ef2] font-bold">R$ {bonusBalance.toFixed(2)}</span>
                    </div>
                </div>

                {/* Rollover Progress */}
                {userStats.rolloverTarget > 0 && (
                    <div className="mt-2 bg-black/40 p-2 rounded-lg border border-white/5">
                        <div className="flex justify-between items-center text-[9px] mb-1">
                            <span className="text-white/50 font-bold uppercase">Meta Rollover (R$)</span>
                            <span className="text-white font-bold">{Math.floor(rolloverProgress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5 relative mb-2">
                            <div 
                                className="h-full bg-gradient-to-r from-[#913ef2] to-[#c111d7]" 
                                style={{ width: `${rolloverProgress}%` }} 
                            />
                        </div>
                        
                        <div className="flex justify-between items-center text-[9px]">
                            <span className="text-white/50 font-bold uppercase">Apostas Válidas (min 2.0x)</span>
                            <span className={`font-bold ${userStats.rolloverBetsCount >= 10 ? 'text-[#28a745]' : 'text-white'}`}>
                                {userStats.rolloverBetsCount} / {userStats.rolloverBetsTarget}
                            </span>
                        </div>
                        
                        <p className="text-[8px] text-white/30 mt-2 italic border-t border-white/5 pt-1">
                            Regra: Apenas saques acima de 2.00x contabilizam.
                        </p>
                    </div>
                )}
            </div>
        </div>

        {/* Tabs Switcher */}
        <div className="px-6 mt-4 mb-2">
            <div className="bg-[#141516] p-1 rounded-xl flex border border-white/5 relative">
                <button 
                    onClick={() => setActiveTab('deposit')}
                    className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all z-10 ${activeTab === 'deposit' ? 'text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                >
                    Depositar
                </button>
                <button 
                    onClick={() => setActiveTab('withdraw')}
                    className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all z-10 ${activeTab === 'withdraw' ? 'text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                >
                    Sacar
                </button>
                
                {/* Sliding Background */}
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg transition-all duration-300 ease-spring ${activeTab === 'deposit' ? 'left-1' : 'left-[calc(50%+2px)]'}`} />
            </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 relative z-10">
            
            {/* --- DEPOSIT VIEW --- */}
            {activeTab === 'deposit' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                    {depositStep === 'amount' ? (
                        <>
                            {/* Promo Banner 1st Deposit + Cross-Sell > 50 */}
                            {!userStats.firstDepositDone ? (
                                <div className="bg-gradient-to-r from-[#e51a31] to-[#8b0010] p-3 rounded-xl mb-4 border border-[#e51a31]/50 shadow-lg animate-pulse">
                                    <h4 className="text-white font-black uppercase text-xs flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                        Bônus de 1º Depósito
                                    </h4>
                                    <p className="text-[10px] text-white/80 leading-tight mt-1">
                                        Dobramos seu depósito até <strong>R$ 500</strong>! (Rollover 3x + 10 bets acima de 2.0x)
                                    </p>
                                </div>
                            ) : (selectedDepositAmount >= 50) && (
                                <div className="bg-gradient-to-r from-[#34b1e2] to-[#2096c4] p-3 rounded-xl mb-4 border border-[#34b1e2]/50 shadow-lg animate-in fade-in slide-in-from-top-2">
                                    <h4 className="text-white font-black uppercase text-xs flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                        OFERTA EXCLUSIVA
                                    </h4>
                                    <p className="text-[10px] text-white/90 leading-tight mt-1 font-bold">
                                        Deposite R$ 50+ e ganhe 30 dias de IA TRADER & GESTÃO grátis!
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mb-4 mt-2">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Valor do Aporte</span>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {DEPOSIT_AMOUNTS.map(amt => (
                                    <AmountChip 
                                        key={amt} 
                                        value={amt} 
                                        selected={selectedDepositAmount === amt} 
                                        onClick={() => setSelectedDepositAmount(amt)}
                                    />
                                ))}
                            </div>

                            {/* --- ORDER BUMP --- */}
                            {selectedDepositAmount < 50 && (
                                <div className={`relative mb-6 p-4 rounded-xl border-2 cursor-pointer transition-all ${addOrderBump ? 'bg-[#34b1e2]/10 border-[#34b1e2]' : 'bg-[#141516] border-white/10 hover:border-white/20'}`} onClick={() => setAddOrderBump(!addOrderBump)}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${addOrderBump ? 'bg-[#34b1e2] border-[#34b1e2]' : 'border-white/30'}`}>
                                                {addOrderBump && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-tight">IA Trader & Gestão VIP</h4>
                                                <p className="text-[10px] text-white/50">Acesso completo ao robô que opera sozinho.</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[9px] text-[#e51a31] line-through font-bold">R$ 97,90</span>
                                            <span className="block text-sm font-black text-[#28a745]">+ R$ 47,90</span>
                                        </div>
                                    </div>
                                    {addOrderBump && <div className="absolute -top-2 -right-2 bg-[#e51a31] text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase">Adicionado</div>}
                                </div>
                            )}

                            <div className="bg-[#28a745]/5 border border-[#28a745]/20 rounded-xl p-3 flex gap-3 items-center mb-auto">
                                <div className="w-8 h-8 rounded-full bg-[#28a745]/20 flex items-center justify-center text-[#28a745] shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                </div>
                                <p className="text-[10px] text-white/60 leading-tight">
                                    Depósitos via PIX são processados instantaneamente 24/7.
                                </p>
                            </div>

                            <button 
                                onClick={handleGeneratePix}
                                disabled={isProcessing}
                                className="w-full bg-[#28a745] hover:bg-[#218838] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(40,167,69,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait mt-4 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Iniciando...
                                    </>
                                ) : (
                                    <>
                                    Gerar PIX
                                    <span className="bg-black/20 px-2 py-0.5 rounded text-[10px]">R$ {totalToPay.toFixed(2)}</span>
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-center h-full animate-in zoom-in-95 duration-300">
                            <div className="mb-4 w-full flex justify-between items-center">
                                <button onClick={() => setDepositStep('amount')} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6"/></svg>
                                    Voltar
                                </button>
                                <div className="text-[10px] font-mono text-[#e51a31] bg-[#e51a31]/10 px-2 py-1 rounded border border-[#e51a31]/20 animate-pulse">
                                    Expira em: {formatTimer(paymentTimer)}
                                </div>
                            </div>

                            <div className="bg-white p-2 rounded-2xl shadow-2xl mb-4 relative group overflow-hidden w-48 h-48 flex items-center justify-center">
                                {qrState === 'generating' ? (
                                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
                                        <div className="w-full h-1 bg-[#28a745] shadow-[0_0_15px_#28a745] absolute top-0 animate-scan-line z-30" />
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#28a745]/10 to-transparent animate-scan-line" />
                                        
                                        <div className="flex items-center gap-2 mb-2 animate-pulse">
                                            <div className="w-2 h-2 bg-[#28a745] rounded-full" />
                                            <span className="text-[#28a745] text-[10px] font-mono uppercase tracking-widest">Criptografando</span>
                                        </div>
                                        <div className="text-white/40 text-[8px] font-mono uppercase">Gerando Chave Única...</div>
                                        
                                        {/* Matrix-like background effect */}
                                        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(40, 167, 69, .3) 25%, rgba(40, 167, 69, .3) 26%, transparent 27%, transparent 74%, rgba(40, 167, 69, .3) 75%, rgba(40, 167, 69, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(40, 167, 69, .3) 25%, rgba(40, 167, 69, .3) 26%, transparent 27%, transparent 74%, rgba(40, 167, 69, .3) 75%, rgba(40, 167, 69, .3) 76%, transparent 77%, transparent)', backgroundSize: '30px 30px'}} />
                                    </div>
                                ) : (
                                    <>
                                        <img 
                                            src={activeConfig.qrCodeImage || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeConfig.pixKey)}`}
                                            alt="QR Code"
                                            className="w-full h-full rounded-xl object-contain animate-in fade-in zoom-in duration-500"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/90 transition-opacity rounded-xl backdrop-blur-sm">
                                            <span className="text-black font-bold text-xs uppercase">Scan Me</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="w-full mb-6">
                                <p className="text-xs text-white/50 font-bold mb-2">Valor a pagar</p>
                                <h3 className="text-3xl font-black text-white italic tracking-tighter mb-4">
                                    R$ {totalToPay.toFixed(2)}
                                </h3>

                                <div className="bg-[#141516] p-1 rounded-xl border border-white/10 flex items-center">
                                    <div className="flex-1 px-3 overflow-hidden">
                                        <p className="text-[10px] text-white/40 font-mono truncate">{qrState === 'generating' ? 'Gerando chave segura...' : activeConfig.pixKey}</p>
                                    </div>
                                    <button 
                                        onClick={handleCopyPix}
                                        disabled={qrState === 'generating'}
                                        className={`px-4 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-lg ${isCopied ? 'bg-[#28a745] text-white' : 'bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                                    >
                                        {isCopied ? 'Copiado!' : 'Copiar'}
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={handleSimulatePayment}
                                disabled={isProcessing || qrState === 'generating'}
                                className="w-full mt-auto bg-[#e51a31] hover:bg-[#ff1f3a] disabled:bg-[#141516] disabled:text-white/20 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold uppercase tracking-widest transition-all text-xs"
                            >
                                {isProcessing ? 'Verificando...' : 'Já fiz o pagamento'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- WITHDRAW VIEW --- */}
            {activeTab === 'withdraw' && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300 h-full flex flex-col gap-4">
                    
                    <div className="bg-[#d97d1b]/5 border border-[#d97d1b]/20 p-4 rounded-xl flex gap-3 items-start">
                        <svg className="text-[#d97d1b] shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-[#d97d1b] uppercase tracking-widest">Titularidade Obrigatória</span>
                            <p className="text-[10px] text-white/60 leading-relaxed">
                                O CPF da chave PIX deve ser idêntico ao cadastrado: <strong className="text-white">{userProfile.cpf || "Não informado"}</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest pl-1">Valor do Saque</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold text-sm group-focus-within:text-[#e51a31] transition-colors">R$</span>
                            <input 
                                type="number" 
                                placeholder="0.00"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full bg-[#141516] border border-white/10 rounded-xl py-4 pl-10 pr-16 text-white font-bold outline-none focus:border-[#e51a31] transition-colors placeholder:text-white/20"
                            />
                            <button 
                                onClick={() => setWithdrawAmount(realBalance.toFixed(2))}
                                className="absolute right-2 top-2 bottom-2 px-3 bg-[#1b1c1d] hover:bg-white/10 rounded-lg text-[9px] font-black text-[#e51a31] uppercase tracking-wider transition-colors"
                            >
                                Máx
                            </button>
                        </div>
                    </div>

                    {/* PIX Key Type Selector */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest pl-1">Tipo de Chave</label>
                        <div className="flex bg-[#141516] rounded-xl p-1 border border-white/5">
                            {['cpf', 'email', 'phone', 'random'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setPixKeyType(type)}
                                    className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${
                                        pixKeyType === type 
                                        ? 'bg-[#1b1c1d] text-white shadow border border-white/10' 
                                        : 'text-white/30 hover:text-white'
                                    }`}
                                >
                                    {type === 'random' ? 'Aleatória' : type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PIX Key Input */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest pl-1">Chave PIX</label>
                        <input 
                            type="text" 
                            placeholder={pixKeyType === 'cpf' ? '000.000.000-00' : 'Informe sua chave'}
                            value={pixKey}
                            onChange={(e) => setPixKey(e.target.value)}
                            className="w-full bg-[#141516] border border-white/10 rounded-xl py-3 px-4 text-sm text-white font-medium outline-none focus:border-[#e51a31] transition-colors placeholder:text-white/20"
                        />
                    </div>

                    {/* Security PIN */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest pl-1 flex justify-between">
                            <span>Senha de Saque (6 Dígitos)</span>
                            <span className="text-white/20 text-[8px] flex items-center gap-1"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Protegido</span>
                        </label>
                        <input 
                            type="password" 
                            maxLength={6}
                            placeholder="******"
                            value={withdrawalPin}
                            onChange={(e) => setWithdrawalPin(e.target.value.replace(/\D/g,''))}
                            className="w-full bg-[#141516] border border-white/10 rounded-xl py-3 px-4 text-center text-white font-bold tracking-[0.5em] outline-none focus:border-[#e51a31] transition-colors placeholder:text-white/10 placeholder:tracking-normal"
                        />
                    </div>

                    {withdrawError && (
                        <div className="text-[10px] text-[#e51a31] font-bold text-center bg-[#e51a31]/5 py-2 rounded-lg border border-[#e51a31]/20 animate-pulse">
                            {withdrawError}
                        </div>
                    )}

                    <button 
                        onClick={handleConfirmWithdraw}
                        disabled={isProcessing}
                        className="w-full mt-auto bg-[#e51a31] hover:bg-[#ff1f3a] disabled:bg-gray-800 disabled:opacity-50 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(229,26,49,0.3)] active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Validando...
                            </>
                        ) : 'Confirmar Saque'}
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default WalletModal;
