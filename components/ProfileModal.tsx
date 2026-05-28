
import React, { useState, useRef } from 'react';
import { UserStats, Transaction, UserProfile } from '../types';

interface ProfileModalProps {
  onClose: () => void;
  balance: number;
  stats: UserStats;
  transactions: Transaction[];
  username: string;
  userAvatar: string; 
  onUpdateAvatar: (newUrl: string) => void;
  profile: UserProfile;
  onUpdateProfile: (newProfile: Partial<UserProfile>) => void;
  isSubscribed: boolean; 
  onOpenSubscription: () => void; 
  onOpenClube: () => void;
}

const StatCard = ({ label, value, color = "text-white" }: any) => (
  <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center text-center">
    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">{label}</span>
    <span className={`text-lg font-black italic ${color}`}>{value}</span>
  </div>
);

// --- CINEMATIC BADGES (SVG COMPONENTS) ---

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  onClose, 
  balance, 
  stats, 
  transactions,
  username,
  userAvatar,
  onUpdateAvatar,
  profile,
  onUpdateProfile,
  isSubscribed,
  onOpenSubscription,
  onOpenClube
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'my_data' | 'history'>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for My Data
  const [formData, setFormData] = useState(profile);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [isPinSet, setIsPinSet] = useState(!!profile.withdrawalPin);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleAvatarClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 2 * 1024 * 1024) { 
              alert("A imagem deve ter no máximo 2MB.");
              return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  onUpdateAvatar(event.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveData = () => {
      if(!formData.fullName || !formData.cpf || !formData.phone) {
          alert("Preencha todos os campos obrigatórios.");
          return;
      }
      onUpdateProfile(formData);
  };

  const handleSetPin = () => {
      if (pinInput.length !== 6 || isNaN(Number(pinInput))) {
          alert("A senha deve ter exatamente 6 números.");
          return;
      }
      if (pinInput !== confirmPinInput) {
          alert("As senhas não coincidem.");
          return;
      }
      onUpdateProfile({ withdrawalPin: pinInput });
      setIsPinSet(true);
      alert("Senha de saque definida com sucesso! Guarde-a bem.");
  };

  // Função para abrir o modal de assinatura Elite
  const handleOpenSubscription = () => {
      onClose();
      onOpenSubscription();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#1b1c1d] w-full max-w-lg rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden">
        
        {/* Header Profile */}
        <div className="relative bg-gradient-to-b from-[#2c2d30] to-[#1b1c1d] p-4 sm:p-6 pb-6 sm:pb-8 border-b border-white/5 shrink-0">
          <button onClick={onClose} className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 text-white/40 hover:text-white transition-colors z-10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick}>
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 shadow-[0_0_20px_rgba(0,0,0,0.4)] relative overflow-hidden ${isSubscribed ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-yellow-500/20' : 'bg-[#e51a31]'}`}>
                   <img src={userAvatar} alt="Avatar" className="w-full h-full rounded-full bg-black object-cover" />
                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="sm:w-6 sm:h-6"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                   </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
            
            <div className="flex flex-col min-w-0 flex-1 pr-6 sm:pr-0">
              <div className="flex flex-wrap gap-2 mb-1">
                  {/* ELITE BADGE */}
                  {isSubscribed && (
                      <span className="bg-gradient-to-r from-yellow-500 to-amber-700 text-black text-[9px] font-black px-2 py-0.5 rounded-md w-fit shadow-lg animate-pulse whitespace-nowrap">
                          ELITE MEMBER
                      </span>
                  )}
                  {stats.clubeMember && (
                      <span className="bg-[#34b1e2] text-black text-[9px] font-black px-2 py-0.5 rounded-md w-fit shadow-lg whitespace-nowrap">
                          CLUBE AEROBET
                      </span>
                  )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tight truncate">{username}</h2>
              <div className="flex flex-wrap gap-2 sm:gap-4 mt-1">
                  <span className="text-[10px] sm:text-xs text-white/40 font-mono">ID: {849302}-BR</span>
                  <span className="text-[10px] sm:text-xs font-bold text-[#e51a31] whitespace-nowrap">Voos Grátis: {stats.freeFlights}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-[#141516] overflow-x-auto no-scrollbar shrink-0">
            {(['overview', 'my_data', 'history'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
                      activeTab === tab ? 'text-white bg-white/5' : 'text-white/30 hover:text-white/60'
                  }`}
                >
                    {tab === 'overview' ? 'Visão Geral' : tab === 'my_data' ? 'Meus Dados' : 'Transações'}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#e51a31]" />}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1 bg-[#141516]">
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {!isSubscribed && (
                        <div className="bg-gradient-to-r from-[#e51a31] to-[#b91527] border border-[#e51a31]/50 p-5 rounded-2xl flex justify-between items-center shadow-[0_0_20px_rgba(229,26,49,0.2)]">
                            <div>
                                <h4 className="text-white font-black uppercase text-sm mb-1 italic">Torne-se Elite</h4>
                                <p className="text-[10px] text-white/80 font-medium">Desbloqueie IA, Gestão e Insígnia.</p>
                            </div>
                            <button 
                                onClick={handleOpenSubscription}
                                className="bg-white text-[#e51a31] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-gray-100 transition-all active:scale-95"
                            >
                                Assinar
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Saldo Atual" value={`R$ ${balance.toFixed(2)}`} color="text-[#28a745]" />
                        <StatCard label="Voos Disponíveis" value={stats.freeFlights} color="text-[#34b1e2]" />
                        <StatCard label="Maior Multiplicador" value={`${stats.maxMult.toFixed(2)}x`} color="text-[#d97d1b]" />
                        <StatCard label="Partidas Jogadas" value={stats.totalRounds} />
                    </div>
                    
                    {stats.clubeMember ? (
                        <div className="bg-[#34b1e2]/10 p-4 rounded-xl border border-[#34b1e2]/20">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[10px] font-black text-[#34b1e2] uppercase tracking-widest">Clube Aerobet</h4>
                                <button 
                                    onClick={onOpenClube}
                                    className="text-[9px] font-black text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors"
                                >
                                    Ver Detalhes
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                                </button>
                            </div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-white">Progresso do Ciclo</span>
                                <span className="text-xs font-black text-white">{stats.clubeFlightsCount} Voos</span>
                            </div>
                            <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                                <div className="h-full bg-[#34b1e2]" style={{ width: `${(stats.clubeFlightsCount / 50) * 100}%` }} />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                            <div>
                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Clube Aerobet</h4>
                                <p className="text-[10px] text-white/60">Participe e ganhe voos grátis.</p>
                            </div>
                            <button 
                                onClick={onOpenClube}
                                className="bg-[#34b1e2] hover:bg-[#2096c4] text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                                Participar
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ... Other Tabs Content (remains same) ... */}
            {activeTab === 'my_data' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                    
                    {/* Informações Pessoais */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Informações Pessoais</h4>
                        
                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Nome Completo (Titular)</label>
                            <input 
                                type="text" 
                                value={formData.fullName} 
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                                disabled={!!profile.fullName}
                                placeholder="Seu nome completo"
                                className={`w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#e51a31] outline-none ${profile.fullName ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            {!profile.fullName && <p className="text-[9px] text-[#d97d1b] mt-1">* Atenção: Não será possível alterar depois.</p>}
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">CPF (Apenas números)</label>
                            <input 
                                type="text" 
                                value={formData.cpf} 
                                onChange={e => setFormData({...formData, cpf: e.target.value.replace(/\D/g,'')})}
                                disabled={!!profile.cpf}
                                placeholder="000.000.000-00"
                                className={`w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#e51a31] outline-none ${profile.cpf ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">Celular</label>
                                <input 
                                    type="text" 
                                    value={formData.phone} 
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    placeholder="(00) 00000-0000"
                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#e51a31] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1">E-mail</label>
                                <input 
                                    type="email" 
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#e51a31] outline-none"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveData}
                            className="w-full bg-[#e51a31] hover:bg-[#ff1f3a] py-3 rounded-xl font-black uppercase text-xs tracking-widest text-white shadow-lg active:scale-95 transition-all"
                        >
                            Salvar Dados
                        </button>
                    </div>

                    {/* Senha de Saque */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Segurança de Saque</h4>
                        
                        {isPinSet ? (
                            <div className="bg-[#28a745]/10 border border-[#28a745]/30 p-4 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#28a745]/20 flex items-center justify-center text-[#28a745]">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-white">Senha Definida</h5>
                                    <p className="text-[10px] text-white/50">Sua senha de saque de 6 dígitos está ativa e segura.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                                <p className="text-[10px] text-white/60 mb-2">Defina uma senha numérica de 6 dígitos. <span className="text-[#e51a31] font-bold">Esta senha não poderá ser alterada por você.</span></p>
                                <div className="grid grid-cols-2 gap-3">
                                    <input 
                                        type="password" 
                                        placeholder="Senha (6 dígitos)" 
                                        maxLength={6}
                                        value={pinInput}
                                        onChange={e => setPinInput(e.target.value.replace(/\D/g,''))}
                                        className="bg-[#1b1c1d] border border-white/10 rounded-lg p-3 text-sm text-white text-center tracking-widest outline-none focus:border-[#e51a31]"
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Confirmar Senha" 
                                        maxLength={6}
                                        value={confirmPinInput}
                                        onChange={e => setConfirmPinInput(e.target.value.replace(/\D/g,''))}
                                        className="bg-[#1b1c1d] border border-white/10 rounded-lg p-3 text-sm text-white text-center tracking-widest outline-none focus:border-[#e51a31]"
                                    />
                                </div>
                                <button 
                                    onClick={handleSetPin}
                                    className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors"
                                >
                                    Definir Senha Permanente
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-2">
                    {transactions.length === 0 ? (
                        <div className="text-center py-10 text-white/20 text-xs font-bold uppercase tracking-widest">
                            Nenhuma transação recente
                        </div>
                    ) : (
                        transactions.slice().reverse().map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        t.type === 'deposit' ? 'bg-[#28a745]/10 text-[#28a745]' : 
                                        t.type === 'cashout' ? 'bg-[#d97d1b]/10 text-[#d97d1b]' :
                                        t.type === 'reward' ? 'bg-[#34b1e2]/10 text-[#34b1e2]' :
                                        'bg-[#e51a31]/10 text-[#e51a31]'
                                    }`}>
                                        {t.type === 'deposit' ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                        ) : t.type === 'cashout' ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 13l5 5 5-5M12 6v12"/></svg>
                                        ) : t.type === 'reward' ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white">{t.description}</span>
                                        <span className="text-[9px] text-white/40">{formatDate(t.date)}</span>
                                    </div>
                                </div>
                                <span className={`text-sm font-black italic ${
                                    t.type === 'deposit' || t.type === 'cashout' || t.type === 'reward' ? 'text-[#28a745]' : 'text-[#e51a31]'
                                }`}>
                                    {t.type === 'bet' ? '-' : '+'} R$ {t.amount.toFixed(2)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
