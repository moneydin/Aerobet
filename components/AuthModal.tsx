
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { signInWithGoogle, auth } from '../src/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (username: string, profileData?: Partial<UserProfile>) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register Fields
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState(''); // NOVO

  const [error, setError] = useState<string | null>(null);

  // Máscaras de Input
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      setCpf(v);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
      v = v.replace(/(\d)(\d{4})$/, '$1-$2');
      setPhone(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError("E-mail e senha são obrigatórios.");
        setIsLoading(false);
        return;
      }

      if (isRegister) {
        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            setIsLoading(false);
            return;
        }
        
        if (!fullName || !cpf || !phone) {
            setError("Preencha todos os dados pessoais obrigatórios.");
            setIsLoading(false);
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const finalUsername = username || email.split('@')[0];
        await updateProfile(userCredential.user, { displayName: finalUsername });
        
        onLoginSuccess(finalUsername, {
          fullName,
          cpf,
          phone,
          email
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess(userCredential.user.displayName || email.split('@')[0]);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("O login por E-mail/Senha não está ativado no seu projeto Firebase. Por favor, ative o provedor 'E-mail/Senha' em seu painel do Firebase Console (Authentication > Sign-in method) ou utilize o 'Modo de Convidado' abaixo.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Conexão falhou (Erro de Rede ou CORS). Por favor, use o 'Modo de Convidado' para jogar offline localmente sem autenticar.");
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("E-mail ou senha incorretos.");
      } else {
        setError(err.message || "Erro ao processar autenticação.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onLoginSuccess(user.displayName || user.email?.split('@')[0] || 'Jogador');
        onClose();
      }
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request') {
        setError("Uma solicitação de login já está em andamento. Verifique se há janelas de login abertas.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("A janela de login com Google foi fechada antes de concluir.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("O login com Google não está ativo. Ative na seção Authentication no Console do Firebase ou entre como Convidado!");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Erro de Rede (CORS/Bloqueio). Por favor, utilize o 'Modo de Convidado' para jogar localmente.");
      } else {
        setError(err.message || "Erro ao entrar com Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser = {
      uid: `guest-${Math.floor(Math.random() * 1000000)}`,
      displayName: `Convidado_${Math.floor(Math.random() * 8999 + 1000)}`,
      email: 'guest@aerofla.com',
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=guest-${Math.floor(Math.random() * 1000)}`
    };
    localStorage.setItem('guest_user', JSON.stringify(guestUser));
    onLoginSuccess(guestUser.displayName, {
      fullName: 'Jogador Convidado',
      cpf: '000.000.000-00',
      phone: '(11) 99999-9999',
      email: guestUser.email
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-[#09090b] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative max-h-[90vh]">
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#e51a31]/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* Header */}
        <div className="pt-8 px-8 pb-4 text-center relative z-10 shrink-0">
             <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-12 h-12 bg-[#e51a31] rounded-xl flex items-center justify-center font-black italic shadow-[0_0_20px_rgba(229,26,49,0.5)] text-2xl text-white">A</div>
             </div>
             <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-1">
                 {isRegister ? 'Criar Conta' : 'Acessar Conta'}
             </h2>
             <p className="text-xs text-white/50 font-bold uppercase tracking-widest">{isRegister ? 'Junte-se à Elite' : 'Bem-vindo de volta'}</p>
        </div>

        {/* Form Scrollable Area */}
        <div className="px-8 pb-8 flex-1 overflow-y-auto no-scrollbar relative z-10">
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-[#e51a31]/10 border border-[#e51a31]/30 text-[#e51a31] text-xs font-bold text-center animate-in slide-in-from-top-2">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                
                {isRegister && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Nome Completo *</label>
                            <input 
                                type="text" 
                                placeholder="Titular da Conta"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-[#141516] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#e51a31] focus:outline-none transition-colors placeholder:text-white/20 font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">CPF *</label>
                                <input 
                                    type="text" 
                                    placeholder="000.000.000-00"
                                    value={cpf}
                                    onChange={handleCpfChange}
                                    maxLength={14}
                                    className="w-full bg-[#141516] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#e51a31] focus:outline-none transition-colors placeholder:text-white/20 font-bold"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Celular *</label>
                                <input 
                                    type="text" 
                                    placeholder="(00) 00000-0000"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    maxLength={15}
                                    className="w-full bg-[#141516] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#e51a31] focus:outline-none transition-colors placeholder:text-white/20 font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Apelido (Opcional)</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Apelido no jogo"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[#141516] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#e51a31] focus:outline-none transition-colors placeholder:text-white/20 font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-[#28a745] uppercase tracking-widest pl-1">Código de Indicação (Opcional)</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Ex: AMIGO10"
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value)}
                                    className="w-full bg-[#28a745]/5 border border-[#28a745]/30 rounded-xl px-4 py-3 text-sm text-white focus:border-[#28a745] focus:outline-none transition-colors placeholder:text-white/20 font-bold"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">E-mail *</label>
                    <div className="relative">
                        <input 
                            type="email" 
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#141516] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#e51a31] focus:outline-none transition-colors placeholder:text-white/20 font-bold"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Senha *</label>
                    <div className="relative">
                        <input 
                            type="password" 
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#141516] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#e51a31] focus:outline-none transition-colors placeholder:text-white/20 font-bold"
                        />
                    </div>
                </div>

                {isRegister && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Confirmar Senha *</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-[#141516] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#e51a31] focus:outline-none transition-colors placeholder:text-white/20 font-bold"
                            />
                        </div>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="mt-4 w-full bg-[#e51a31] hover:bg-[#ff1f3a] text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(229,26,49,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
                >
                    {isLoading && <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                    {isLoading ? 'Aguarde...' : (isRegister ? 'Finalizar Cadastro' : 'Acessar Plataforma')}
                </button>

                {!isRegister && (
                    <div className="space-y-4 mt-4">
                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink-0 mx-4 text-white/30 text-[9px] uppercase font-bold">Ou acesse com</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button" 
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="bg-[#141516] hover:bg-[#1f2022] border border-white/10 rounded-xl py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading && <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                                <span className="text-[10px] font-bold text-white/80 uppercase">Google</span>
                            </button>
                            <button type="button" disabled className="bg-[#141516] opacity-50 border border-white/10 rounded-xl py-3 flex items-center justify-center gap-2 transition-colors">
                                <span className="text-[10px] font-bold text-white/80 uppercase">Apple</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="relative flex py-1 items-center mt-4">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-white/30 text-[9px] uppercase font-bold">Modo de Teste</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button 
                    type="button" 
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:text-[#e51a31] py-3.5 rounded-xl font-black uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-2 active:scale-95 duration-200 cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Entrar como Convidado
                </button>

            </form>

            <div className="mt-6 text-center">
                <p className="text-xs text-white/50">
                    {isRegister ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                    <button 
                        onClick={() => setIsRegister(!isRegister)}
                        className="ml-1 text-[#e51a31] font-black hover:underline uppercase tracking-wide"
                    >
                        {isRegister ? 'Entrar' : 'Cadastre-se'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
