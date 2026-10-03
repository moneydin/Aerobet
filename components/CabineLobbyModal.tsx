import React, { useState, useEffect } from 'react';
import { CabineSession } from '../types';
import { 
  createCabineSession, 
  joinCabineByNameAndPassword
} from '../src/utils/cabineService';

interface CabineLobbyModalProps {
  onClose: () => void;
  userBalance: number;
  currentUsername: string;
  onCabineStarted: (cabine: CabineSession) => void;
  onOpenDeposit: () => void;
  activeCabine?: CabineSession | null;
  onExitCabine?: () => void;
}

export const CabineLobbyModal: React.FC<CabineLobbyModalProps> = ({
  onClose,
  userBalance,
  currentUsername,
  onCabineStarted,
  onOpenDeposit,
  activeCabine,
  onExitCabine
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
  // Create Form State
  const [cabineName, setCabineName] = useState(`Cabine ${currentUsername} #${Math.floor(Math.random() * 900 + 100)}`);
  const [cabinePassword, setCabinePassword] = useState('');
  const [totalBankroll, setTotalBankroll] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Join State (Exclusivamente por inserção manual de Nome e Senha)
  const [joinCabineName, setJoinCabineName] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [showJoinPassword, setShowJoinPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Presets de banca
  const BANKROLL_PRESETS = [50, 100, 200, 500, 1000];
  const requiredPilotShare = totalBankroll / 2;
  const hasEnoughBalanceToCreate = userBalance >= requiredPilotShare;

  if (activeCabine) {
    const initialShare = Math.round((activeCabine.initialBalance / 2) * 100) / 100;
    const currentShare = Math.round((activeCabine.currentBalance / 2) * 100) / 100;
    const profit = Math.round((currentShare - initialShare) * 100) / 100;
    const isProfit = profit >= 0;

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-md bg-[#111827] border-2 border-[#1f2937] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans text-white">
          
          {/* HEADER SÓLIDO */}
          <div className="p-4 border-b border-[#1f2937] flex items-center justify-between bg-[#1f2937]">
            <div className="flex items-center gap-2.5 bg-transparent border-0 text-left p-0">
              <span className="text-xl">👥</span>
              <div className="text-left">
                <h3 className="text-sm font-black uppercase text-white tracking-wider leading-none">
                  Cabine Ativa Detectada
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Você já está participando de uma sessão
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[#111827] hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border border-[#374151]"
            >
              ✕
            </button>
          </div>

          {/* CONTENT */}
          <div className="p-5 space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed text-left">
              Você já possui a cabine <strong className="text-white uppercase font-black">{activeCabine.name}</strong> ativa no momento. Deseja retornar ao cockpit de voo ou encerrar a operação atual para criar ou entrar em outra cabine?
            </p>

            {/* PAINEL FINANCEIRO RESUMIDO */}
            <div className="space-y-2 bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937] text-left">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#1f2937]">
                <span className="text-[10px] uppercase font-black text-slate-400">Detalhamento Financeiro (Seu 50%)</span>
                <span className="text-[8px] bg-sky-950 border border-sky-800 text-sky-400 px-1.5 py-0.2 rounded font-mono font-bold">50% SHARE</span>
              </div>

              {/* Aporte de Entrada */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Aporte de Entrada:</span>
                <span className="font-mono font-bold text-white">R$ {initialShare.toFixed(2)}</span>
              </div>

              {/* Saldo Atual */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Seu Saldo Atual:</span>
                <span className="font-mono font-bold text-emerald-400">R$ {currentShare.toFixed(2)}</span>
              </div>

              {/* Resultado */}
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#1f2937]">
                <span className="text-slate-400">Resultado:</span>
                <span className={`font-mono font-black ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isProfit ? `▲ +R$ ${profit.toFixed(2)} Lucro` : `▼ -R$ ${Math.abs(profit).toFixed(2)} Prejuízo`}
                </span>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col gap-2 pt-1.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-xl transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-1.5"
              >
                <span>🟢 Retornar ao Cockpit</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (onExitCabine) {
                    onExitCabine();
                  }
                  onClose();
                }}
                className="w-full py-3 bg-red-700 hover:bg-red-600 border border-red-600 text-slate-100 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🔴 Encerrar & Sair da Cabine</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateCabine = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (activeCabine) {
      setErrorMessage('Você já possui uma cabine ativa e não pode criar outra no momento.');
      return;
    }

    if (!cabineName.trim()) {
      setErrorMessage('Por favor, informe o nome da cabine.');
      return;
    }

    if (!cabinePassword.trim()) {
      setErrorMessage('Defina uma senha para que o seu Copiloto possa entrar.');
      return;
    }

    if (totalBankroll < 10) {
      setErrorMessage('O valor mínimo da banca total da cabine é de R$ 10,00.');
      return;
    }

    if (!hasEnoughBalanceToCreate) {
      setErrorMessage(`Saldo insuficiente. Você precisa de R$ ${requiredPilotShare.toFixed(2)} (50% da banca de R$ ${totalBankroll.toFixed(2)}) para abrir a cabine.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const cabine = await createCabineSession({
        name: cabineName,
        password: cabinePassword,
        totalBankroll,
        pilotId: `pilot-${Date.now()}`,
        pilotName: currentUsername || 'Piloto'
      });

      onCabineStarted(cabine);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha ao criar cabine. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinByNameAndPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (activeCabine) {
      setErrorMessage('Você já possui uma cabine ativa e não pode entrar em outra no momento.');
      return;
    }

    if (!joinCabineName.trim()) {
      setErrorMessage('Por favor, digite o nome exato da cabine informado pelo Piloto.');
      return;
    }

    if (!joinPassword.trim()) {
      setErrorMessage('Por favor, digite a senha da cabine informada pelo Piloto.');
      return;
    }

    setIsJoining(true);
    try {
      const res = await joinCabineByNameAndPassword({
        cabineName: joinCabineName,
        passwordAttempt: joinPassword,
        copilotId: `copilot-${Date.now()}`,
        copilotName: currentUsername || 'Copiloto'
      });

      if (!res.success || !res.cabine) {
        setErrorMessage(res.error || 'Não foi possível entrar na cabine. Verifique os dados digitados.');
        setIsJoining(false);
        return;
      }

      // Verifica se o copiloto possui 50% da banca
      const copilotShare = res.cabine.totalBankroll / 2;
      if (userBalance < copilotShare) {
        setErrorMessage(`Saldo insuficiente na sua carteira. É necessário R$ ${copilotShare.toFixed(2)} (50% da banca de R$ ${res.cabine.totalBankroll.toFixed(2)}) para operar.`);
        setIsJoining(false);
        return;
      }

      onCabineStarted(res.cabine);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao entrar na cabine.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-sans">
        
        {/* Modal Header */}
        <div className="relative z-10 px-5 sm:px-6 py-4 border-b border-[#334155] flex items-center justify-between bg-[#1e293b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0f172a] border border-[#334155] flex items-center justify-center text-sky-400 text-lg">
              👥
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white">
                  MODO CABINE • CO-OP
                </h3>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  Piloto & Copiloto
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Banca compartilhada 50/50, cooperação no gráfico e divisão igualitária dos lucros!
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

        {/* Tabs Bar */}
        <div className="relative z-10 px-5 sm:px-6 pt-3 pb-2 flex gap-2 border-b border-[#334155] bg-[#0f172a]">
          <button
            type="button"
            onClick={() => { setActiveTab('create'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#1e293b] text-slate-300 hover:text-white hover:bg-slate-700 border border-[#334155]'
            }`}
          >
            <span>🛠️ Criar Minha Cabine</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('join'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'join'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#1e293b] text-slate-300 hover:text-white hover:bg-slate-700 border border-[#334155]'
            }`}
          >
            <span>🔑 Inserir Nome e Senha da Cabine</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="relative z-10 p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeCabine && (
            <div className="p-4 bg-amber-950/80 border-2 border-amber-800 rounded-xl text-amber-200 text-xs font-semibold flex flex-col gap-2 text-left animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span className="font-bold uppercase tracking-wider text-amber-400">Acesso Restrito • Cabine Ativa</span>
              </div>
              <p className="text-[11.5px] text-amber-300/90 leading-relaxed font-bold">
                Você já está participando de uma cabine ativa: <strong className="text-white font-black uppercase underline">{activeCabine.name}</strong>.
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Por regras de integridade operacional, você não pode criar ou conectar-se a outra cabine de voo enquanto sua sessão de dupla atual estiver em andamento. Para prosseguir, primeiro finalize a operação da sua cabine clicando em "Encerrar Cabine" no painel principal do jogo.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
              <span className="text-sm">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'create' ? (
            /* ============================================================== */
            /* TAB 1: CRIAR CABINE */
            /* ============================================================== */
            <form onSubmit={handleCreateCabine} className="space-y-4">
              {/* How it works info card */}
              <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] text-xs space-y-1.5 text-slate-200 text-left">
                <div className="flex items-center gap-2 font-bold text-sky-300 uppercase tracking-wider text-[11px]">
                  <span>📋 Regra Oficial da Cabine:</span>
                </div>
                <ul className="space-y-1 text-[11.5px] text-slate-300 list-disc list-inside">
                  <li>O criador define a <strong>Banca Total</strong> da cabine (ex: R$ {totalBankroll.toFixed(2)}).</li>
                  <li>É debitado <strong>50% (R$ {requiredPilotShare.toFixed(2)})</strong> da sua carteira e <strong>50%</strong> do copiloto ao conectar.</li>
                  <li>Ambos operam juntos usando essa banca compartilhada, cada um com 1 slot de aposta no mesmo gráfico ao vivo.</li>
                  <li>Ao encerrar a cabine, a banca final restante/acumulada é <strong>dividida 50/50</strong> e creditada na carteira de cada um.</li>
                </ul>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                    Nome da Cabine
                  </label>
                  <input
                    type="text"
                    value={cabineName}
                    onChange={(e) => setCabineName(e.target.value)}
                    placeholder="Ex: Cabine Águia #01"
                    maxLength={32}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3.5 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block flex items-center justify-between">
                    <span>Senha de Acesso</span>
                    <span className="text-[10px] text-slate-400 font-normal">(copiloto usará para entrar)</span>
                  </label>
                  <input
                    type="text"
                    value={cabinePassword}
                    onChange={(e) => setCabinePassword(e.target.value)}
                    placeholder="Ex: 1234"
                    maxLength={20}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Bankroll Selection */}
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Valor Total da Banca da Cabine
                  </label>
                  <span className="text-sm font-mono text-emerald-400 font-black">
                    R$ {totalBankroll.toFixed(2)}
                  </span>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-5 gap-2">
                  {BANKROLL_PRESETS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTotalBankroll(val)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer border ${
                        totalBankroll === val
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-[#1e293b] border-[#334155] text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      R$ {val}
                    </button>
                  ))}
                </div>

                {/* Custom Input */}
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">Valor Personalizado:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">R$</span>
                    <input
                      type="number"
                      min={10}
                      step={5}
                      value={totalBankroll || ''}
                      onChange={(e) => setTotalBankroll(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-9 pr-3 py-2 text-white font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Split Summary */}
              <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Divisão Inicial da Banca (50% Cada)
                  </span>
                  <div className="text-xs text-white">
                    Seu aporte ao criar: <strong className="text-emerald-400 font-mono">R$ {requiredPilotShare.toFixed(2)}</strong> • Aporte do Copiloto: <strong className="text-sky-300 font-mono">R$ {requiredPilotShare.toFixed(2)}</strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Seu saldo disponível: <span className="font-mono text-white">R$ {userBalance.toFixed(2)}</span>
                  </div>
                </div>

                {!hasEnoughBalanceToCreate && (
                  <button
                    type="button"
                    onClick={onOpenDeposit}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer transition-colors"
                  >
                    + Depositar
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !hasEnoughBalanceToCreate || Boolean(activeCabine)}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-md"
              >
                {isSubmitting ? (
                  <span>Criando Cabine...</span>
                ) : (
                  <span>🚀 Criar Cabine & Abrir Cockpit (Aporte R$ {requiredPilotShare.toFixed(2)})</span>
                )}
              </button>
            </form>
          ) : (
            /* ============================================================== */
            /* TAB 2: ENTRAR EM CABINE (INSERÇÃO EXCLUSIVA DE NOME E SENHA)   */
            /* ============================================================== */
            <form onSubmit={handleJoinByNameAndPass} className="space-y-4 text-left">
              <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] text-xs space-y-1.5 text-slate-200">
                <div className="flex items-center gap-2 font-bold text-sky-300 uppercase tracking-wider text-[11px]">
                  <span>🔒 Acesso Exclusivo por Inserção de Dados:</span>
                </div>
                <p className="text-[11.5px] text-slate-300 leading-relaxed">
                  Para garantir total privacidade, as cabines <strong>não são listadas publicamente</strong>. Para entrar como Copiloto, basta inserir o <strong>Nome exato da Cabine</strong> e a <strong>Senha</strong> fornecidos pelo Piloto criador.
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-[#0f172a] p-2 rounded-lg border border-slate-700">
                  <span>💡</span>
                  <span>O aporte de 50% será debitado da sua carteira para formar a banca compartilhada.</span>
                </div>
              </div>

              {/* Form de Inserção Direta */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                      Nome da Cabine
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) setJoinCabineName(text.trim());
                        } catch (e) {}
                      }}
                      className="text-[10px] text-sky-400 hover:text-white underline cursor-pointer"
                    >
                      📋 Colar Nome
                    </button>
                  </div>
                  <input
                    type="text"
                    value={joinCabineName}
                    onChange={(e) => setJoinCabineName(e.target.value)}
                    placeholder="Ex: Cabine Águia #01"
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3.5 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                      Senha de Acesso da Cabine
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowJoinPassword(!showJoinPassword)}
                      className="text-[10px] text-sky-400 hover:text-white underline cursor-pointer"
                    >
                      {showJoinPassword ? '👁️ Ocultar Senha' : '👁️ Mostrar Senha'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showJoinPassword ? "text" : "password"}
                      value={joinPassword}
                      onChange={(e) => setJoinPassword(e.target.value)}
                      placeholder="Digite a senha informada pelo Piloto"
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-3.5 pr-10 py-2.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowJoinPassword(!showJoinPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      {showJoinPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Info de Saldo Disponível */}
              <div className="p-3 rounded-xl bg-[#1e293b] border border-[#334155] flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Seu saldo atual para aporte:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  R$ {userBalance.toFixed(2)}
                </span>
              </div>

              {/* Botão de Conexão */}
              <button
                type="submit"
                disabled={isJoining || Boolean(activeCabine)}
                className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                {isJoining ? (
                  <span>Verificando Dados...</span>
                ) : (
                  <span>🚀 Conectar à Cabine como Copiloto (50%)</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CabineLobbyModal;
