
import React, { useState, useEffect, useCallback, useMemo, useRef, Component, ReactNode, ErrorInfo } from 'react';
import { GameStatus, Bet, LiveBet, GameHistory, UserStats, Transaction, Mission, GameEvent, Achievement, AppNotification, UserProfile, FreeFlightTransaction, WheelPrize, BankrollPlan, PlanHistoryEntry, DepositConfig, ChatMessage, AlertConfig, Referral, AeroFantasyLeagueType, Banner, FreeFlightConfig, ClubeConfig } from './types';
import { useAviator } from './hooks/useAviator';
import { INITIAL_CASH } from './constants';
import GameCanvas from './components/GameCanvas';
import BetControl from './components/BetControl';
import HistoryBar from './components/HistoryBar';
import Sidebar from './components/Sidebar';
import TopBanner from './components/TopBanner';
import FairnessModal from './components/FairnessModal';
import FullHistoryModal from './components/FullHistoryModal';
import { sounds } from './utils/sounds';
import WalletModal from './components/WalletModal';
import SideMenu from './components/SideMenu';
import ProfileModal from './components/ProfileModal';
import MissionsModal from './components/MissionsModal';
import RankingsModal from './components/RankingsModal';
import EventsModal from './components/EventsModal';
import TournamentsModal from './components/TournamentsModal';
import AchievementsModal from './components/AchievementsModal';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/admin/AdminPanel';
import AeroFantasyAdmin from './components/admin/AeroFantasyAdmin';
import DailyWheelModal from './components/DailyWheelModal';
import FreeFlightsModal from './components/FreeFlightsModal';
import ClubeModal from './components/ClubeModal';
import NotificationsModal from './components/NotificationsModal';
import BankrollManagerModal from './components/BankrollManagerModal';
import SubscriptionModal from './components/SubscriptionModal';
import AlertsModal from './components/AlertsModal';
import ReferralModal from './components/ReferralModal';
import BannerCarousel from './components/BannerCarousel';
import StoreModal from './components/StoreModal';
import HangarView from './components/HangarView';
import ModeSelectionPortal from './components/ModeSelectionPortal';
import AeroFantasyHub from './components/aerofantasy/AeroFantasyHub';
import CabineLobbyModal from './components/CabineLobbyModal';
import CabineActiveBanner from './components/CabineActiveBanner';
import CabineChatDrawer from './components/CabineChatDrawer';
import CabineCloseModal from './components/CabineCloseModal';
import CabinePartnerSlot from './components/CabinePartnerSlot';
import CabineExitConfirmationModal from './components/CabineExitConfirmationModal';
import { 
  getActiveCabineFromStorage, 
  saveActiveCabineToStorage, 
  updateCabineBalance, 
  closeCabineSession,
  sendCabineMessage,
  listenToCabineMessages,
  updateCabinePresence
} from './src/utils/cabineService';
import { cabineRadio } from './src/utils/cabineRadioService';
import { CabineSession, CabineMessage } from './types';
import { getCanvasBackgroundConfig, getRandomBackgroundImage, getRandomBackgroundVideo, subscribeToCanvasBackground, CanvasBackgroundConfig, saveCanvasBackgroundConfig } from './utils/canvasBackground';

import { auth, db, signInWithGoogle, logout } from './src/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, collection, query, orderBy, limit, addDoc, serverTimestamp, getDocFromServer, increment, deleteDoc, where } from 'firebase/firestore';
import { listenToCustomSkins } from './src/utils/customSkins';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  const isPermissionDenied = errInfo.error.toLowerCase().includes("permission-denied") || 
                             errInfo.error.toLowerCase().includes("missing or insufficient permissions");
  
  if (isPermissionDenied) {
    throw new Error(JSON.stringify(errInfo));
  } else {
    if (typeof window !== 'undefined') {
      (window as any).firestoreQuotaExceeded = true;
      window.dispatchEvent(new Event('firestore-quota-exceeded'));
    }
  }
}

function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);
  return [state, setState] as const;
}

// ... Mock data e helpers permanecem os mesmos ...
const MOCK_USERS_INITIAL = [
  { id: 1, username: 'Jogador_Elite', balance: 3000.00, role: 'user', status: 'active', email: 'jogador@aerogame.com', phone: '(21) 99876-5432', cpf: '123.456.789-00', fullName: 'José da Silva' },
  { id: 2, username: 'MestreDoAero', balance: 15420.50, role: 'vip', status: 'active', email: 'mestre@trader.com', phone: '(11) 98888-7777', cpf: '987.654.321-99', fullName: 'Carlos Trader Pro' },
  { id: 3, username: 'ReiDoVoo', balance: 12100.00, role: 'user', status: 'active', email: 'rei@aerogame.com', phone: '(21) 97777-6666', cpf: '456.789.123-44', fullName: 'Roberto Silva' },
  { id: 4, username: 'Bot_Teste_01', balance: 50.00, role: 'bot', status: 'banned', email: 'bot01@system.io', phone: 'N/A', cpf: '000.000.000-00', fullName: 'System Bot 01' },
];

const INITIAL_EVENTS: GameEvent[] = [
  { 
      id: 'e1', title: 'Chuva de PIX', description: 'Acumule a maior quantia de Aerocoins começando com 1000 AC.', prizePool: 'R$ 10.000', endsIn: '2d 12h', endTime: Date.now() + (2 * 24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000), startTime: Date.now(), status: 'upcoming', bannerGradient: 'from-[#28a745] to-[#1e7e34]', participants: 5300, minEntry: 0, isPaid: false, entryFee: 0, leagueType: 'aerocoin', rankingType: 'total_wager', prizes: [{ position: 1, rewardType: 'cash', cashAmount: 2000, displayLabel: 'R$ 2000' }, { position: 2, rewardType: 'cash', cashAmount: 1000, displayLabel: 'R$ 1000' }], participantsList: [], userJoined: false,
      images: ['https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?q=80&w=2940&auto=format&fit=crop'], config: { entryDeadline: Date.now() + 86400000, frequency: 'weekly', startingAerocoins: 1000 }
  }
];

const INITIAL_TOURNAMENTS: GameEvent[] = [
  { 
      id: 't1', title: 'Liga dos Multiplicadores', description: 'Você tem 10 voos. Faça a maior pontuação acumulada!', prizePool: 'R$ 50.000', endsIn: '04h 20m', endTime: Date.now() + (4 * 60 * 60 * 1000) + (20 * 60 * 1000), startTime: Date.now(), status: 'live', bannerGradient: 'from-[#34b1e2] to-[#2096c4]', participants: 12450, minEntry: 0, isPaid: true, entryFee: 10, leagueType: 'multiplier', flightsLimit: 10, rankingType: 'highest_multiplier', prizes: [{ position: 1, rewardType: 'cash', cashAmount: 25000, displayLabel: 'R$ 25.000' }], participantsList: [{ userId: 2, username: 'MestreDoAero', score: 150.50, flightsUsed: 5 }, { userId: 3, username: 'ReiDoVoo', score: 89.20, flightsUsed: 3 }], userJoined: false,
      images: ['https://images.unsplash.com/photo-1621252179027-94459d27d3ee?q=80&w=2940&auto=format&fit=crop'], config: { entryDeadline: Date.now() + 86400000, frequency: 'daily', maxFlights: 10, allowRebuy: true, rebuyCost: 5, rebuyFlightsAmount: 5 }
  },
  { 
      id: 't2', title: 'Liga da Vela (Jackpot)', description: 'Apenas cashouts acima de 10x pontuam. Prêmio Acumulado!', prizePool: 'R$ 12.500 (Acumulado)', endsIn: '12h 00m', endTime: Date.now() + (12 * 60 * 60 * 1000), startTime: Date.now(), status: 'live', bannerGradient: 'from-[#e51a31] to-[#8b0010]', participants: 520, minEntry: 5, isPaid: true, entryFee: 20, leagueType: 'vela', initialAerocoins: 2000, isJackpot: true, jackpotAccumulated: 12500, rankingType: 'highest_multiplier', prizes: [{ position: 1, rewardType: 'cash', displayLabel: 'Jackpot Total' }], participantsList: [], userJoined: false,
      images: ['https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=2940&auto=format&fit=crop'], config: { entryDeadline: Date.now() + 86400000, frequency: 'weekly', targetMultiplier: 10.0, jackpotAccumulated: 12500 }
  }
];

const INITIAL_WHEEL_PRIZES: WheelPrize[] = [
  { id: 1, label: '1 Voo', type: 'flight', amount: 1, color: '#e51a31', text: 'white', probability: 20 },
  { id: 2, label: 'R$ 2.00', type: 'balance', amount: 2, color: '#141516', text: 'white', probability: 20 },
  { id: 3, label: '3 Voos', type: 'flight', amount: 3, color: '#e51a31', text: 'white', probability: 15 },
  { id: 4, label: 'R$ 5.00', type: 'balance', amount: 5, color: '#141516', text: 'white', probability: 10 },
  { id: 5, label: '5 Voos', type: 'flight', amount: 5, color: '#e51a31', text: 'white', probability: 5 },
  { id: 6, label: 'R$ 10.00', type: 'balance', amount: 10, color: '#d97d1b', text: 'black', probability: 5 },
  { id: 7, label: '10 Voos', type: 'flight', amount: 10, color: '#e51a31', text: 'white', probability: 2 },
  { id: 8, label: 'Tente Novamente', type: 'none', amount: 0, color: '#333333', text: 'gray', probability: 23 },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-1', title: 'Bem-vindo a Bordo', description: 'Complete seu cadastro e faça o primeiro depósito.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, unlocked: true, progress: 1, total: 1, rewardFlights: 5, claimed: false },
  { id: 'ach-2', title: 'Primeira Vitória', description: 'Faça um saque com lucro (acima de 2.00x).', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>, unlocked: false, progress: 0, total: 1, rewardFlights: 2, claimed: false },
  { id: 'ach-3', title: 'Caçador de Velas', description: 'Pegue uma vela rosa (10x ou mais).', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, unlocked: false, progress: 0, total: 1, rewardFlights: 10, claimed: false },
  { id: 'ach-4', title: 'Consistência', description: 'Jogue por 7 dias consecutivos.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, unlocked: false, progress: 1, total: 7, rewardFlights: 20, claimed: false }
];

const DEFAULT_PIX_KEY = "00020126580014br.gov.bcb.pix013625503d0e-c00c-4f88-8ce7-f8d0653545d852040000530398654040.015802BR5922AEROgamePagamentos6011RioDeJaneiro62290525WPY2d48fb50102140d493d86c63049F86";
const DEPOSIT_AMOUNTS = [20, 50, 100, 200, 500, 1000];
const INITIAL_REFERRALS: Referral[] = [
    { id: 'ref1', username: 'Amigo_Teste_1', registeredAt: Date.now() - 86400000, depositedAmount: 0, flightsCount: 0, status: 'pending' },
    { id: 'ref2', username: 'Amigo_Teste_2', registeredAt: Date.now() - 172800000, depositedAmount: 50, flightsCount: 15, status: 'qualified' },
];

const INITIAL_BANNERS: Banner[] = [
  {
    id: 'b1',
    title: "BEM-VINDO AO AEROgame",
    subtitle: "Ganhe 100% de bônus no seu primeiro depósito via PIX.",
    image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2940&auto=format&fit=crop",
    color: "from-[#e51a31] to-[#8b0010]",
    hasButton: true,
    buttonText: "DEPOSITAR AGORA",
    buttonAction: "wallet",
    active: true
  },
  {
    id: 'b2',
    title: "LIGAS AEROFANTASY",
    subtitle: "Compita contra outros pilotos e ganhe prêmios em dinheiro real.",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2942&auto=format&fit=crop",
    color: "from-[#34b1e2] to-[#2096c4]",
    hasButton: true,
    buttonText: "VER TORNEIOS",
    buttonAction: "tournaments",
    active: true
  },
  {
    id: 'b3',
    title: "ASSINATURA ELITE",
    subtitle: "Sinais de IA em tempo real e gestão de banca automatizada.",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop",
    color: "from-[#d97d1b] to-[#8b4513]",
    hasButton: true,
    buttonText: "SEJA ELITE",
    buttonAction: "subscription",
    active: true
  }
];

const INITIAL_FREE_FLIGHT_CONFIGS: FreeFlightConfig[] = [
  {
    id: 'ffc-1',
    title: "Bônus de Boas-vindas",
    description: "Ganhe 10 voos grátis ao realizar seu primeiro depósito.",
    quantity: 10,
    valuePerFlight: 1.0,
    minCashoutMultiplier: 2.0,
    active: true
  }
];

const INITIAL_CLUBE_CONFIG: ClubeConfig = {
  targetFlights: 50,
  rewardFlights: 10,
  minBetAmount: 1.0,
  active: true
};

const generateNewMission = (level: number, existingIds: string[]): Mission => {
    const types = ['bets_count', 'total_wager', 'multiplier_hit'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    const difficulty = 1 + (level * 0.05); 
    const rewardType = Math.floor(Math.random() * 3);
    const hasMinMultiplier = Math.random() < 0.2;
    const minMultiplierVal = hasMinMultiplier ? parseFloat((1.5 + Math.random()).toFixed(2)) : 0;
    const tier = (level > 5 && Math.random() > 0.7) ? 'premium' : 'free';
    let mission: Mission = { id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, title: '', description: '', target: 0, current: 0, rewardFlights: 0, rewardBalance: 0, minMultiplier: minMultiplierVal, type: type, tier: tier, completed: false, rewardClaimed: false, accepted: false };
    const multiplierReward = tier === 'premium' ? 2 : 1; 
    if (rewardType === 0 || rewardType === 2) mission.rewardFlights = Math.max(1, Math.floor(5 * difficulty * multiplierReward));
    if (rewardType === 1 || rewardType === 2) mission.rewardBalance = Math.floor(10 * difficulty * multiplierReward);
    switch (type) {
        case 'bets_count':
            mission.target = Math.floor(10 * difficulty); mission.title = tier === 'premium' ? 'Piloto de Elite' : 'Piloto Dedicado'; mission.description = minMultiplierVal > 0 ? `Faça ${mission.target} apostas com saque acima de ${minMultiplierVal}x.` : `Faça ${mission.target} apostas.`; break;
        case 'total_wager':
            mission.target = Math.floor(100 * difficulty); mission.title = tier === 'premium' ? 'Investidor VIP' : 'Investidor de Elite'; mission.description = minMultiplierVal > 0 ? `Aposte R$ ${mission.target} total (saques > ${minMultiplierVal}x contam).` : `Aposte um total de R$ ${mission.target}.`; break;
        case 'multiplier_hit':
            const multTarget = Math.min(20, 2 + Math.floor(Math.random() * 5) + Math.floor(level / 50)); mission.target = multTarget; mission.title = tier === 'premium' ? 'Caçador de Lendas' : 'Caçador de Velas'; mission.description = `Saque com multiplicador acima de ${multTarget.toFixed(2)}x.`; mission.minMultiplier = 0; break;
    }
    return mission;
};

const getFlightsForLevel = (lvl: number) => {
    if (lvl <= 100) return 5 + (lvl * 2);
    return 205 + ((lvl - 100) * 5);
};

const BannedScreen = () => (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="absolute inset-0 bg-[#e51a31]/5 pointer-events-none" /><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
        <div className="w-24 h-24 bg-[#e51a31] rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(229,26,49,0.5)] animate-pulse">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
        <h1 className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-tighter mb-4 drop-shadow-xl">CONTA <span className="text-[#e51a31]">SUSPENSA</span></h1>
        <div className="bg-[#141516] border border-white/10 p-6 rounded-2xl max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#e51a31] to-transparent" /><p className="text-white/80 font-bold uppercase tracking-widest text-sm mb-4">Acesso Bloqueado Permanentemente</p>
            <p className="text-white/40 text-xs leading-relaxed mb-6">Detectamos atividades suspeitas ou violação dos termos de serviço em sua conta. Seu acesso à plataforma, carteira e histórico foi revogado.</p>
            <div className="flex flex-col gap-2"><button onClick={() => window.location.reload()} className="w-full bg-[#e51a31] hover:bg-[#ff1f3a] text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all">Tentar Novamente</button><button onClick={() => window.open('https://wa.me/5521975522492', '_blank')} className="w-full bg-white/5 hover:bg-white/10 text-white/60 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all">Contestar no Suporte</button></div>
        </div>
        <div className="mt-8 text-[10px] text-white/20 font-mono uppercase">ID de Referência: #BAN-{Math.floor(Math.random() * 999999)}</div>
    </div>
);

const App: React.FC = () => {
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(false);
  const [rtp, setRtp] = usePersistentState<number>('aerobet_rtp', 97); 
  const [banners, setBanners] = usePersistentState<Banner[]>('aerobet_banners', INITIAL_BANNERS);
  const [freeFlightConfigs, setFreeFlightConfigs] = usePersistentState<FreeFlightConfig[]>('aerobet_ff_configs', INITIAL_FREE_FLIGHT_CONFIGS);
  const [clubeConfig, setClubeConfig] = usePersistentState<ClubeConfig>('aerobet_clube_config', INITIAL_CLUBE_CONFIG);
  const [freeFlightHistory, setFreeFlightHistory] = usePersistentState<FreeFlightTransaction[]>('aerobet_ff_history', []);
  const [claimedAchievements, setClaimedAchievements] = usePersistentState<string[]>('aerobet_claimed_achievements', []);
  const [houseBankroll, setHouseBankroll] = usePersistentState<number>('aerobet_houseBankroll', 15420000.00); 
  const [revenueStats, setRevenueStats] = usePersistentState<{ subscriptions: number; missions: number }>('aerobet_revenue', { subscriptions: 0, missions: 0 });
  
  const { status, multiplier, countdown, nextRoundServerSeedHash, history: socketHistory, forceCrashNow, setNextRoundResult, updateRtp, requestCashout } = useAviator(rtp);
  
  useEffect(() => {
    const handleQuota = () => {
      setIsOfflineFallback(true);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('firestore-quota-exceeded', handleQuota);
      if ((window as any).firestoreQuotaExceeded) {
        setIsOfflineFallback(true);
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('firestore-quota-exceeded', handleQuota);
      }
    };
  }, []);

  useEffect(() => {
    if (isOfflineFallback && socketHistory && socketHistory.length > 0) {
      setHistory(socketHistory);
    }
  }, [isOfflineFallback, socketHistory]);

  // Engine sound effect is configured after activeCategory definition below

  const [history, setHistory] = useState<GameHistory[]>([]);
  const [myHistory, setMyHistory] = useState<LiveBet[]>([]);
  const multiplierRef = useRef(multiplier);
  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);
  const lastStatusRef = useRef<GameStatus>(status);

  // --- FIREBASE STATE ---
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const isGuest = useMemo(() => !user || (user.uid && user.uid.startsWith('guest-')), [user]);

  // --- PERSISTENT STATE ---
  const [balance, setBalance] = useState<number>(0);
  const [userStats, setUserStats] = useState<UserStats & { status?: string }>({ totalWagered: 0, maxMult: 0, totalRounds: 0, totalWins: 0, freeFlights: 0, lastSpinTime: 0, lastDepositTime: Date.now() - (8 * 24 * 60 * 60 * 1000), clubeMember: false, clubeFlightsCount: 0, clubeCycleStartDate: Date.now(), subscriptionExpiresAt: 0, autoRenewSubscription: true, bankrollPlans: [], activePlanIds: { slot1: null, slot2: null }, firstDepositDone: false, bonusBalance: 0, rolloverTarget: 0, rolloverCurrent: 0, rolloverBetsTarget: 0, rolloverBetsCount: 0, status: 'active' });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ fullName: '', cpf: '', email: '', phone: '', withdrawalPin: null, bankName: '' });
  const [alertConfig, setAlertConfig] = usePersistentState<AlertConfig>('aerobet_alerts', { target: 10.00, sound: true, visual: true, enabled: false });
  const [referrals, setReferrals] = usePersistentState<Referral[]>('aerobet_referrals', INITIAL_REFERRALS);
  const [missions, setMissions] = usePersistentState<Mission[]>('aerobet_missions', [generateNewMission(1, []), generateNewMission(1, ['skip']), generateNewMission(1, ['skip', 'skip'])]);
  const [events, setEvents] = usePersistentState<GameEvent[]>('aerobet_events', INITIAL_EVENTS);
  const [tournaments, setTournaments] = usePersistentState<GameEvent[]>('aerobet_tournaments', INITIAL_TOURNAMENTS);
  const [wheelPrizes, setWheelPrizes] = usePersistentState<WheelPrize[]>('aerobet_wheel', INITIAL_WHEEL_PRIZES); 
  const [depositConfigs, setDepositConfigs] = usePersistentState<DepositConfig[]>('aerobet_depositConfigs', DEPOSIT_AMOUNTS.map(amt => ({ amount: amt, pixKey: DEFAULT_PIX_KEY, qrCodeImage: undefined })));
  const [achievements, setAchievements] = usePersistentState<Achievement[]>('aerobet_achievements_list', INITIAL_ACHIEVEMENTS);

  // --- LOCAL STATE (NON-PERSISTENT SESSION) ---
  const [isAuthenticated, setIsAuthenticated] = usePersistentState<boolean>('aerobet_auth', true);
  const [showLanding, setShowLanding] = useState(false);
  const [isInInitialLanding, setIsInInitialLanding] = useState(true);

  // --- CABINE (CO-OP PILOTO & COPILOTO) STATE ---
  const [activeCabine, setActiveCabine] = useState<CabineSession | null>(() => getActiveCabineFromStorage());
  const [isCabineLobbyOpen, setIsCabineLobbyOpen] = useState(false);
  const [isCabineChatOpen, setIsCabineChatOpen] = useState(false);
  const [isCabineCloseModalOpen, setIsCabineCloseModalOpen] = useState(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);
  const [simulatedPartnerBet, setSimulatedPartnerBet] = useState<{
    amount: number;
    targetMult?: number;
    cashedOut?: boolean;
    cashoutAt?: number;
    profit?: number;
  } | null>(null);

  // --- CABINE CHAT & RADIO INTERCOM STATE ---
  const [cabineMessages, setCabineMessages] = useState<CabineMessage[]>([]);
  const [isRadioOn, setIsRadioOn] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isPartnerTalking, setIsPartnerTalking] = useState(false);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [radioVolume, setRadioVolume] = useState(0);
  
  // --- BETTING STATE ---
  const [bet1, setBet1] = useState<Bet | null>(null);
  const [nextRoundBet1, setNextRoundBet1] = useState<{ amount: number; autoCashOut?: number; source?: 'real' | 'bonus' | 'aerocoin'; isFreeFlight?: boolean; firestoreId?: string } | null>(null);
  const [bet2, setBet2] = useState<Bet | null>(null);
  const [nextRoundBet2, setNextRoundBet2] = useState<{ amount: number; autoCashOut?: number; source?: 'real' | 'bonus' | 'aerocoin'; isFreeFlight?: boolean; firestoreId?: string } | null>(null);
  const bettingLockRef = useRef<Set<string>>(new Set());
  const activeBetsRef = useRef({ bet1: false, bet2: false });
  const [betMode1, setBetMode1] = useState<'manual' | 'auto' | 'manager'>('manual');
  const [betMode2, setBetMode2] = useState<'manual' | 'auto' | 'manager'>('manual');
  
  // Live bets and stats
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [roundStats, setRoundStats] = useState({ count: 0, amount: 0, wins: 0, winnersCount: 0 });

  // Contagem autoritativa em tempo real de participantes e saques na rodada
  const effectiveRoundStats = useMemo(() => {
    let userActiveBetsCount = 0;
    let userWinnersCount = 0;

    if (status === GameStatus.WAITING) {
      if (nextRoundBet1) userActiveBetsCount++;
      if (nextRoundBet2) userActiveBetsCount++;
    } else if (status === GameStatus.FLYING || status === GameStatus.CRASHED) {
      if (bet1) {
        userActiveBetsCount++;
        if (bet1.status === 'cashed' || bet1.cashoutAt) userWinnersCount++;
      }
      if (bet2) {
        userActiveBetsCount++;
        if (bet2.status === 'cashed' || bet2.cashoutAt) userWinnersCount++;
      }
    }

    // Combina com outros participantes da lista de apostas da rodada
    const otherBets = liveBets.filter(b => !b.isMe);
    const otherCount = otherBets.length;
    const otherWinners = otherBets.filter(b => b.cashedOut || (b.payout && b.payout > 0)).length;

    const totalCount = userActiveBetsCount + otherCount;
    const totalWinners = userWinnersCount + otherWinners;
    const totalAmount = (nextRoundBet1?.amount || 0) + (nextRoundBet2?.amount || 0) + 
      (bet1?.amount || 0) + (bet2?.amount || 0) + otherBets.reduce((acc, b) => acc + (b.amount || 0), 0);

    return {
      count: totalCount,
      amount: totalAmount,
      wins: totalWinners,
      winnersCount: totalWinners
    };
  }, [status, nextRoundBet1, nextRoundBet2, bet1, bet2, liveBets]);

  // --- OTHER LOCAL STATE ---
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeLeagueType, setActiveLeagueType] = useState<AeroFantasyLeagueType | null>(null);
  const [aerocoinBalance, setAerocoinBalance] = useState<number>(0);
  const [fantasyFlightsLeft, setFantasyFlightsLeft] = useState<number | null>(null);
  const [userFantasyScore, setUserFantasyScore] = useState<number>(0);
  const [userFantasyFlightsUsed, setUserFantasyFlightsUsed] = useState<number>(0);
  const [userFantasyMaxMult, setUserFantasyMaxMult] = useState<number>(0);
  const [fantasyTargetView, setFantasyTargetView] = useState<'room' | 'hall'>('room');
  const [currentUsername, setCurrentUsername] = usePersistentState<string>('aerobet_username', "Visitante");

  // Real-time calculation of Rank and Points needed to climb in current AeroFantasy room
  const { myFantasyRank, pointsToClimb, aheadCompetitor } = useMemo(() => {
    if (!activeEventId) return { myFantasyRank: 1, pointsToClimb: 0, aheadCompetitor: null };
    const baseCompetitors = [
      { id: 'p1', name: 'PLAYER_07', score: 984.2 },
      { id: 'p2', name: 'ACE_TOPGUN', score: 941.0 },
      { id: 'p3', name: 'FLYER99', score: 915.0 },
      { id: 'p4', name: 'STEALTH_BR', score: 874.0 },
      { id: 'p5', name: 'TURBO_JET', score: 820.0 },
      { id: 'p6', name: 'FALCON_ACE', score: 765.5 },
      { id: 'p7', name: 'SKY_KING', score: 680.0 },
      { id: 'p8', name: 'SONIC_V', score: 540.0 },
      { id: 'p9', name: 'DELTA_9', score: 410.2 },
    ];
    const me = { id: 'me', name: currentUsername, score: userFantasyScore, isMe: true };
    const all = [...baseCompetitors, me].sort((a, b) => b.score - a.score);
    const rank = all.findIndex(p => p.id === 'me') + 1;
    const ahead = rank > 1 ? all[rank - 2] : null;
    const toClimb = ahead ? Math.max(0.1, Math.round((ahead.score - userFantasyScore + 0.1) * 10) / 10) : 0;
    return { myFantasyRank: rank, pointsToClimb: toClimb, aheadCompetitor: ahead };
  }, [activeEventId, currentUsername, userFantasyScore]);

  const [isMuted, setIsMuted] = useState(false);
  useEffect(() => {
    sounds.setMute(isMuted);
  }, [isMuted]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userAvatar, setUserAvatar] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Visitante&backgroundColor=b6e3f4");
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAeroFantasyAdminOpen, setIsAeroFantasyAdminOpen] = useState(false);
  
  // --- PWA INSTALLATION STATE ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSInstructionsOpen, setIsIOSInstructionsOpen] = useState(false);
  
  // Modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMissionsModalOpen, setIsMissionsModalOpen] = useState(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [isTournamentsModalOpen, setIsTournamentsModalOpen] = useState(false);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [isFullHistoryOpen, setIsFullHistoryOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [isDailyWheelOpen, setIsDailyWheelOpen] = useState(false);
  const [isFreeFlightsModalOpen, setIsFreeFlightsModalOpen] = useState(false);
  const [isClubeModalOpen, setIsClubeModalOpen] = useState(false);
  const [isBankrollModalOpen, setIsBankrollModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<GameHistory | null>(null);

  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'aerobet' | 'aerofantasy' | 'store' | 'hangar'>('aerobet');

  // Canvas custom background rotation state
  const [canvasBgConfig, setCanvasBgConfig] = useState<CanvasBackgroundConfig>(getCanvasBackgroundConfig());
  const [activeCanvasBgImage, setActiveCanvasBgImage] = useState<string>('');
  const [activeCanvasBgVideo, setActiveCanvasBgVideo] = useState<string>('');

  // Gerenciamento estrito de áudio: o som do jogo NUNCA toca na fanpage de introdução/escolha
  useEffect(() => {
    if (!isInInitialLanding && activeCategory === 'aerobet' && status === GameStatus.FLYING) {
      sounds.startEngine(multiplier);
    } else {
      sounds.stopEngine();
    }
  }, [status, multiplier, isInInitialLanding, activeCategory]);

  useEffect(() => {
    if (isInInitialLanding) {
      sounds.stopEngine();
      sounds.stopTakeoffSequence();
    }
  }, [isInInitialLanding]);

  // Subscribe to changes in canvas background settings from admin
  useEffect(() => {
    const unsubscribe = subscribeToCanvasBackground((newConfig) => {
      setCanvasBgConfig(newConfig);
      // Immediately pick a background when saved/applied
      if (newConfig.enabled) {
        const isVideo = newConfig.bgType === 'video';
        if (isVideo && newConfig.videos && newConfig.videos.length > 0) {
          setActiveCanvasBgVideo(getRandomBackgroundVideo(newConfig));
          setActiveCanvasBgImage('');
        } else if (!isVideo && newConfig.images && newConfig.images.length > 0) {
          setActiveCanvasBgImage(getRandomBackgroundImage(newConfig));
          setActiveCanvasBgVideo('');
        } else {
          setActiveCanvasBgImage('');
          setActiveCanvasBgVideo('');
        }
      } else {
        setActiveCanvasBgImage('');
        setActiveCanvasBgVideo('');
      }
    });
    return () => unsubscribe();
  }, []);

  // Randomize background image/video at the start of each round (when status changes to WAITING)
  useEffect(() => {
    if (canvasBgConfig.enabled) {
      const isVideo = canvasBgConfig.bgType === 'video';
      if (status === GameStatus.WAITING || (!activeCanvasBgImage && !activeCanvasBgVideo)) {
        if (isVideo && canvasBgConfig.videos && canvasBgConfig.videos.length > 0) {
          setActiveCanvasBgVideo(getRandomBackgroundVideo(canvasBgConfig));
          setActiveCanvasBgImage('');
        } else if (!isVideo && canvasBgConfig.images && canvasBgConfig.images.length > 0) {
          setActiveCanvasBgImage(getRandomBackgroundImage(canvasBgConfig));
          setActiveCanvasBgVideo('');
        }
      }
    } else {
      setActiveCanvasBgImage('');
      setActiveCanvasBgVideo('');
    }
  }, [status, canvasBgConfig]);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const saved = localStorage.getItem('unlocked_skins_aerofla');
    const parsedSkins = saved ? JSON.parse(saved) : ['aerobrasil'];
    if (!parsedSkins.includes('aerobrasil')) {
      parsedSkins.push('aerobrasil');
    }
    return parsedSkins;
  });
  const [selectedSkin, setSelectedSkin] = useState<string>(() => {
    const saved = localStorage.getItem('active_skin_aerofla');
    if (saved === 'fenix' && !localStorage.getItem('migrated_to_aerobrasil')) {
      localStorage.setItem('migrated_to_aerobrasil', 'true');
      return 'aerobrasil';
    }
    return saved || 'aerobrasil';
  });

  const [activeSkin, setActiveSkin] = useState<string>(() => {
    const saved = localStorage.getItem('active_skin_aerofla');
    if (saved === 'fenix' && !localStorage.getItem('migrated_to_aerobrasil_active')) {
      localStorage.setItem('migrated_to_aerobrasil_active', 'true');
      return 'aerobrasil';
    }
    return saved || 'aerobrasil';
  });

  useEffect(() => {
    localStorage.setItem('unlocked_skins_aerofla', JSON.stringify(unlockedSkins));
  }, [unlockedSkins]);

  useEffect(() => {
    localStorage.setItem('active_skin_aerofla', selectedSkin);
  }, [selectedSkin]);

  // Sync activeSkin with selectedSkin only during the WAITING state (between rounds)
  useEffect(() => {
    if (status === GameStatus.WAITING) {
      setActiveSkin(selectedSkin);
    }
  }, [status, selectedSkin]);

  // Synchronize guest balance in Guest mode
  useEffect(() => {
    if (isGuest && user) {
      localStorage.setItem('guest_balance', balance.toString());
    }
  }, [balance, isGuest, user]);

  useEffect(() => {
    const unsub = listenToCustomSkins();
    return () => unsub && unsub();
  }, []);

  // --- FIREBASE SYNC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Clear guest profile when signing in with a real Google or email user
        localStorage.removeItem('guest_user');
        localStorage.removeItem('guest_balance');

        setUser(firebaseUser);
        setIsAuthReady(true);
        setIsAuthenticated(true);
        setCurrentUsername(firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Jogador');
        setUserAvatar(firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`);
        
        // Sync user data
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            const initialData = {
              uid: firebaseUser.uid,
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Jogador',
              balance: 1000.00, // Initial bonus
              role: 'user',
              freeFlights: 0,
              totalRounds: 0,
              maxMult: 0,
              totalWins: 0,
              clubeMember: false,
              clubeFlightsCount: 0,
              avatar: firebaseUser.photoURL || ''
            };
            await setDoc(userDocRef, initialData);
          }

          // Real-time sync
          const snapUnsubscribe = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              setBalance(data.balance);
              setIsAdminUser(data.role === 'admin' || firebaseUser.email?.toLowerCase() === 'douglasborges223@gmail.com');
              setUserStats(prev => ({
                ...prev,
                freeFlights: data.freeFlights,
                totalRounds: data.totalRounds,
                maxMult: data.maxMult,
                clubeMember: data.clubeMember,
                clubeFlightsCount: data.clubeFlightsCount,
                status: data.status || 'active'
              }));
            }
          }, (error) => {
            console.warn("Firestore user sync warning, fallback active:", error);
          });

          return () => {
            snapUnsubscribe();
          };
        } catch (dbErr) {
          console.error("Firestore user setup failed, transitioning to offline fallback:", dbErr);
          setIsOfflineFallback(true);
          setBalance(1000.00);
        }
      } else {
        const guestRaw = localStorage.getItem('guest_user');
        if (guestRaw) {
          const guestUser = JSON.parse(guestRaw);
          setUser(guestUser);
          setCurrentUsername(guestUser.displayName);
          setIsAuthenticated(true);
          const savedGuestBal = localStorage.getItem('guest_balance');
          setBalance(savedGuestBal ? parseFloat(savedGuestBal) : 1000.00);
        } else {
          setIsAuthenticated(false);
          setShowAuthModal(true);
        }
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- PWA LISTENERS & COMPULSIVE INSTALL ACTION ---
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    if (isStandalone) {
      setIsInstallable(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      handleAddNotification("App Instalado!", "Muito obrigado por instalar o aplicativo Aerofantasy!", "success");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (ios && !isStandalone) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (isIOS) {
      setIsIOSInstructionsOpen(true);
      return;
    }
    if (!deferredPrompt) {
      handleAddNotification("Aguarde", "O módulo PWA está se preparando. Adicione diretamente através do menu do navegador caso demore.", "info");
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error("Erro ao abrir instalador do app:", err);
    }
  };

  // Sync Live Bets from Firestore
  useEffect(() => {
    // Aumentamos o limite para capturar todas as apostas dos usuários concorrentes na rodada ativa
    const q = query(collection(db, 'bets'), orderBy('timestamp', 'desc'), limit(150));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bets: LiveBet[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.username,
          amount: data.amount,
          multiplier: data.multiplier,
          payout: data.payout,
          isMe: !isGuest && !!user?.uid && data.uid === user?.uid,
          cashedOut: data.cashedOut,
          profit: data.profit,
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now(),
          roundId: data.roundId
        };
      });
      
      // Filtra para exibir APENAS os participantes que de fato entraram na rodada atual e seus saques de resultado ao vivo
      const filteredBets = nextRoundServerSeedHash 
        ? bets.filter(b => b.roundId === nextRoundServerSeedHash) 
        : bets;

      setLiveBets(filteredBets);
      
      // Atualiza estatísticas precisas com dados da rodada ativa atual 
      const count = filteredBets.length;
      const amount = filteredBets.reduce((acc, b) => acc + b.amount, 0);
      const wins = filteredBets.filter(b => b.payout && b.payout > 0).length;
      setRoundStats({ count, amount, wins, winnersCount: wins });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bets');
    });
    return () => unsubscribe();
  }, [user, isGuest, nextRoundServerSeedHash]);

  // Sync historical bets for logged-in user (index-free safe version)
  useEffect(() => {
    if (user && user.uid && !isGuest) {
      const q = query(
        collection(db, 'bets'),
        where('uid', '==', user.uid),
        limit(50)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loaded: LiveBet[] = snapshot.docs.map(doc => {
          const data = doc.data();
          const p = data.payout || 0;
          return {
            id: doc.id,
            username: data.username || currentUsername,
            amount: data.amount,
            multiplier: data.multiplier || 0,
            payout: p,
            isMe: true,
            cashedOut: !!data.cashedOut || p > 0,
            timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now(),
            roundId: data.roundId
          };
        });
        
        // Sort descending by timestamp locally to avoid requiring composite indexes
        loaded.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        setMyHistory(prev => {
          // Keep local temporary active/result bets until synced from remote DB
          const localOnly = prev.filter(item => item.id.startsWith('bet-') && !loaded.some(rem => rem.amount === item.amount && Math.abs((rem.timestamp || 0) - Date.now()) < 10000));
          const merged = [...localOnly, ...loaded];
          merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          return merged.slice(0, 50);
        });
      }, (error) => {
        console.error("Erro ao carregar histórico pessoal:", error);
      });
      return () => unsubscribe();
    } else {
      setMyHistory([]);
    }
  }, [user, isGuest, currentUsername]);

  // Sync Rounds History from Firestore
  useEffect(() => {
    const q = query(collection(db, 'rounds'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rounds: GameHistory[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          multiplier: data.multiplier,
          color: data.color,
          hash: data.hash,
          serverSeed: data.serverSeed,
          clientSeed: data.clientSeed,
          roundId: data.roundId
        };
      });
      setHistory(rounds);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rounds');
    });
    return () => unsubscribe();
  }, []);

  // Watch Users if Admin
  useEffect(() => {
    if (isAdminUser) {
      const q = query(collection(db, 'users'), limit(500));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => {
           const d = doc.data();
           return {
             id: doc.id,
             uid: doc.id,
             username: d.username,
             balance: d.balance || 0,
             role: d.role || 'user',
             status: d.status || 'active',
             email: d.email || 'N/A',
             phone: d.phone || 'N/A',
             cpf: d.cpf || 'N/A',
             fullName: d.fullName || 'N/A'
           };
        });
        setUsersDb(users as any);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });
      return () => unsubscribe();
    }
  }, [isAdminUser]);

  // Other
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([{ id: 'n1', title: 'Bem-vindo ao AEROgame!', message: 'Complete missões diárias para ganhar voos grátis.', type: 'system', timestamp: Date.now(), read: false }]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [trackedMissionId, setTrackedMissionId] = useState<string | null>(null);
interface CashoutNotificationItem {
  id: string;
  amount: number;
  betAmount: number;
  multiplier: number;
  profit: number;
  isFreeFlight?: boolean;
  isAerocoin?: boolean;
  slot?: 1 | 2;
}

  const [usersDb, setUsersDb] = useState(MOCK_USERS_INITIAL);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]); 
  const [isUserBusy, setIsUserBusy] = useState(false);
  const [cashoutNotifications, setCashoutNotifications] = useState<CashoutNotificationItem[]>([]);
  const [depositNotifications, setDepositNotifications] = useState<{id: string, amount: number}[]>([]);

  // Derived
  const isSubscribed = (userStats.subscriptionExpiresAt || 0) > Date.now();
  const isCurrentUserBanned = userStats.status === 'banned';
  const trackedMission = missions.find(m => m.id === trackedMissionId) || null;
  const activePlanSlot1 = userStats.bankrollPlans.find(p => p.id === userStats.activePlanIds.slot1);
  const activePlanSlot2 = userStats.bankrollPlans.find(p => p.id === userStats.activePlanIds.slot2);

  // --- NOTIFICATION HELPERS ---
  const handleAddNotification = (title: string, message: string, type: 'system' | 'success' | 'warning' | 'info' | 'reward' = 'system', category?: 'mission' | 'event' | 'tournament') => {
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
      category
    };
    setAppNotifications(prev => [newNotif, ...prev]);
  };

  const handleMarkAllRead = () => {
      setAppNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
      setAppNotifications([]);
  };

  const handleNotificationClick = (notification: AppNotification) => {
      setIsNotificationsOpen(false);
      if (notification.category === 'mission') setIsMissionsModalOpen(true);
      else if (notification.category === 'event') setIsEventsModalOpen(true);
      else if (notification.category === 'tournament') setActiveCategory('aerofantasy');
  };

  const handleLoginSuccess = (userName: string) => {
      setCurrentUsername(userName);
      setIsAuthenticated(true);
      setShowLanding(false);
      setShowAuthModal(false);
      setIsInInitialLanding(true); // Exibe o portal oficial de seleção de modo logo após o login!
      handleAddNotification("Login", `Bem-vindo a bordo, ${userName}! Escolha seu modo de voo no portal.`, "success");
      
      const guestRaw = localStorage.getItem('guest_user');
      if (guestRaw && !user) {
          setUser(JSON.parse(guestRaw));
          const savedGuestBal = localStorage.getItem('guest_balance');
          setBalance(savedGuestBal ? parseFloat(savedGuestBal) : 1000.00);
      }
  };

  const handleLogout = async () => {
      try {
          await logout();
      } catch (e) {
          console.error("Logout error", e);
      }
      localStorage.removeItem('guest_user');
      localStorage.removeItem('guest_balance');
      localStorage.removeItem('aerobet_auth');
      setUser(null);
      setIsAuthenticated(false);
      setShowAuthModal(true);
      setIsInInitialLanding(true);
      handleAddNotification("Sessão Encerrada", "Você saiu da sua conta com sucesso.", "info");
  };

  const handleSwitchMode = (targetMode?: string) => {
      setIsProfileModalOpen(false);
      setIsMenuOpen(false);
      
      const executeSwitch = () => {
          let nextCategory: string;
          if (targetMode) {
              nextCategory = targetMode === 'aerogame' ? 'aerobet' : targetMode;
          } else if (activeEventId || activeCategory === 'aerofantasy') {
              nextCategory = 'aerobet';
          } else {
              nextCategory = 'aerofantasy';
          }

          if (nextCategory === 'aerobet') {
              setActiveEventId(null);
              setActiveLeagueType(null);
              setAerocoinBalance(0);
              setFantasyFlightsLeft(null);
              setUserFantasyScore(0);
              setUserFantasyFlightsUsed(0);
              setUserFantasyMaxMult(0);
          } else if (nextCategory === 'aerofantasy') {
              // Garante navegação direta para a tela de INÍCIO do AeroFantasy
              setFantasyTargetView('overview');
          }

          setActiveCategory(nextCategory as any);
          setIsInInitialLanding(false);
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const rootEl = document.getElementById('root');
          if (rootEl) rootEl.scrollTop = 0;
          handleAddNotification(
            nextCategory === 'aerofantasy' ? 'Modo AeroFantasy' : 'Modo AeroGame',
            nextCategory === 'aerofantasy' ? 'Você alternou para o modo de Torneios e Ligas AeroFantasy.' : 'Você alternou para a Sala de Voo Clássico com Dinheiro Real.',
            'info'
          );
      };

      if (activeCabine) {
          setPendingNavigationAction(() => executeSwitch);
          return;
      }
      executeSwitch();
  };

  const handleSwitchProfile = async () => {
      setIsProfileModalOpen(false);
      setIsMenuOpen(false);
      try {
          await logout();
      } catch (e) {
          console.error("Switch profile error", e);
      }
      localStorage.removeItem('guest_user');
      localStorage.removeItem('guest_balance');
      localStorage.removeItem('aerobet_auth');
      setUser(null);
      setIsAuthenticated(false);
      setShowAuthModal(true);
  };

  // --- ADMIN HANDLERS ---
  const handleAdminApproveWithdrawal = (id: string) => {
      setPendingWithdrawals(prev => prev.filter(w => w.id !== id));
      handleAddNotification("Saque Aprovado", `O saque ${id.slice(0,8)} foi processado.`, "success");
  };
  const handleAdminRejectWithdrawal = (id: string) => {
      const withdrawal = pendingWithdrawals.find(w => w.id === id);
      if (withdrawal) {
          setBalance(prev => prev + withdrawal.amount); // Refund
      }
      setPendingWithdrawals(prev => prev.filter(w => w.id !== id));
      handleAddNotification("Saque Rejeitado", `O saque ${id.slice(0,8)} foi estornado.`, "warning");
  };
  const handleAdminUpdateUserBalance = async (userId: string, newBalance: number) => {
      if (!isOfflineFallback) {
        try {
          await updateDoc(doc(db, 'users', userId), { balance: newBalance });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
        }
      }
      setUsersDb(prev => prev.map(u => u.uid === userId ? { ...u, balance: newBalance } : u));
  };
  const handleAdminToggleBan = async (userId: string) => {
      const user = usersDb.find(u => u.uid === userId);
      if (!user) return;
      const newStatus = user.status === 'active' ? 'banned' : 'active';
      if (!isOfflineFallback) {
        try {
          await updateDoc(doc(db, 'users', userId), { status: newStatus });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
        }
      }
      setUsersDb(prev => prev.map(u => u.uid === userId ? { ...u, status: newStatus } : u));
  };
  const handleAdminSendNotification = (userId: string, message: string, type: any) => {
      // In a real app, write to a notifications collection
      handleAddNotification("Mensagem Admin", message, type);
  };
  const handleUpdateWheelPrize = (prize: WheelPrize) => {
      setWheelPrizes(prev => prev.map(p => p.id === prize.id ? prize : p));
  };
  const handleUpdateDepositConfig = (config: DepositConfig) => {
      setDepositConfigs(prev => prev.map(c => c.amount === config.amount ? config : c));
  };
  const handleUpdateEvent = (updatedEvent: GameEvent, isTournament: boolean) => {
      if (isTournament) setTournaments(prev => prev.map(t => t.id === updatedEvent.id ? updatedEvent : t));
      else setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
      handleAddNotification("Admin", `Evento ${updatedEvent.title} atualizado.`, "system");
  };

  const handleJoinClube = () => {
      setUserStats(prev => ({ ...prev, clubeMember: true, clubeFlightsCount: 0, clubeCycleStartDate: Date.now() }));
      handleAddNotification("Clube AeroGame", "Bem-vindo ao Clube! Comece a voar para ganhar prêmios.", "success");
  };

  const handlePlaceBet = async (slot: 1 | 2, amount: number, useFreeBet: boolean) => {
      if (!user) {
          setShowAuthModal(true);
          return;
      }
      
      if (!activeEventId && amount > 500) {
          handleAddNotification("Limite Excedido", "O valor máximo por aposta é de R$ 500,00.", "warning");
          return;
      }

      let currentAvailableBalance = activeCabine ? activeCabine.currentBalance : balance;
      if (!useFreeBet && !activeEventId) {
          if (activeCabine) {
              if (activeCabine.userRole === 'pilot' && slot !== 1) {
                  handleAddNotification("Slot Reservado", "No Modo Cabine, você opera exclusivamente no Slot 1 como Piloto.", "warning");
                  return;
              }
              if (activeCabine.userRole === 'copilot' && slot !== 2) {
                  handleAddNotification("Slot Reservado", "No Modo Cabine, você opera exclusivamente no Slot 2 como Copiloto.", "warning");
                  return;
              }
              if (slot === 1 && nextRoundBet1) currentAvailableBalance -= nextRoundBet1.amount;
              if (slot === 2 && nextRoundBet2) currentAvailableBalance -= nextRoundBet2.amount;
          } else {
              if (slot !== 1 && nextRoundBet1 && !nextRoundBet1.isFreeFlight) currentAvailableBalance -= nextRoundBet1.amount;
              if (slot !== 2 && nextRoundBet2 && !nextRoundBet2.isFreeFlight) currentAvailableBalance -= nextRoundBet2.amount;
          }
      }

      if (activeEventId) {
          if (activeLeagueType === 'multiplier') {
              if (fantasyFlightsLeft !== null && fantasyFlightsLeft <= 0) {
                  handleAddNotification("Cota Esgotada", "Você já utilizou sua cota de voos nesta sala.", "warning");
                  return;
              }
          } else if (activeLeagueType === 'aerocoin') {
              if (aerocoinBalance < amount) {
                  handleAddNotification("Aerocoins Insuficientes", "Você não tem moedas suficientes para esta aposta.", "warning");
                  return;
              }
          }
      } else if (activeCabine) {
          if (currentAvailableBalance < amount) {
              handleAddNotification("Banca da Cabine Insuficiente", `A banca compartilhada da cabine não possui R$ ${amount.toFixed(2)} disponíveis para esta aposta.`, "warning");
              return;
          }
      } else {
          if (useFreeBet && userStats.freeFlights <= 0) return;
          if (!useFreeBet && currentAvailableBalance < amount) {
               handleAddNotification("Saldo Insuficiente", "Você não tem saldo disponível para esta aposta.", "warning");
               return;
          }
      }

      const tempId = `temp-${Date.now()}`;
      const betInfo = { 
          amount, 
          source: activeEventId ? 'aerocoin' : useFreeBet ? 'bonus' : 'real',
          isFreeFlight: useFreeBet,
          firestoreId: tempId
      };

      // --- OPTIMISTIC UPDATE ---
      if (slot === 1) setNextRoundBet1(betInfo as any);
      else setNextRoundBet2(betInfo as any);

      // --- FIRESTORE PERSISTENCE ---
      if (!isGuest && !isOfflineFallback) {
        try {
          const betDoc = await addDoc(collection(db, 'bets'), {
            uid: user.uid,
            username: currentUsername,
            amount,
            multiplier: 0,
            cashedOut: false,
            profit: 0,
            timestamp: serverTimestamp(),
            roundId: nextRoundServerSeedHash 
          });

          // Update state with REAL firestoreId
          const updateId = (prev: any) => (prev && prev.firestoreId === tempId ? { ...prev, firestoreId: betDoc.id } : prev);
          if (slot === 1) setNextRoundBet1(updateId);
          else setNextRoundBet2(updateId);

        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'bets');
          // Rollback on error
          const rollback = () => {
              if (slot === 1) setNextRoundBet1(prev => prev?.firestoreId === tempId ? null : prev);
              else setNextRoundBet2(prev => prev?.firestoreId === tempId ? null : prev);
          };
          rollback();
        }
      }

      // Lógica do Clube AeroGame
      if (userStats.clubeMember && !useFreeBet && !activeEventId && amount >= clubeConfig.minBetAmount) {
          const newCount = userStats.clubeFlightsCount + 1;
          if (newCount >= clubeConfig.targetFlights) {
              setUserStats(prev => ({ 
                  ...prev, 
                  clubeFlightsCount: 0, 
                  freeFlights: prev.freeFlights + clubeConfig.rewardFlights 
              }));
              handleAddNotification("Clube AeroGame", `Parabéns! Você completou o ciclo e ganhou ${clubeConfig.rewardFlights} voos grátis!`, "reward");
              setFreeFlightHistory(prev => [{ id: `ff-${Date.now()}`, type: 'credit', amount: clubeConfig.rewardFlights, source: 'Clube AeroGame', date: Date.now() }, ...prev]);
          } else {
              setUserStats(prev => ({ ...prev, clubeFlightsCount: newCount }));
          }
      }
  };

  const handleCancelBet = async (slot: 1 | 2) => {
      const bet = slot === 1 ? nextRoundBet1 : nextRoundBet2;
      if (!bet) return;

      if (slot === 1) setNextRoundBet1(null);
      else setNextRoundBet2(null);

      // Firestore cleanup
      if (user && !isGuest && !isOfflineFallback) {
          try {
              // Delete bet doc
              if (bet.firestoreId && !bet.firestoreId.startsWith('temp-')) {
                  await deleteDoc(doc(db, 'bets', bet.firestoreId));
              }
          } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, 'bets/cancel');
          }
      }
  };

  const handleCashout = async (slot: 1 | 2, specificMult?: number) => {
      const lockKey = `cashout-${slot}`;
      // Usar a Ref para garantir precisão instantânea do status do botão, prevenindo corrida do React
      if (bettingLockRef.current.has(lockKey)) return;
      if (slot === 1 && !activeBetsRef.current.bet1) return;
      if (slot === 2 && !activeBetsRef.current.bet2) return;
      
      const bet = slot === 1 ? bet1 : bet2;
      if (!bet || bet.status !== 'active') return;

      bettingLockRef.current.add(lockKey);
      if (slot === 1) activeBetsRef.current.bet1 = false;
      if (slot === 2) activeBetsRef.current.bet2 = false;
      
      // Multiplicador no instante milimétrico do clique para resposta imediata
      const clickMult = specificMult || multiplierRef.current;
      const optimisticPayout = bet.amount * clickMult;

      // ---- ATUALIZAÇÃO VISUAL OTIMISTA E INSTANTÂNEA ----
      const optimisticBet = { 
        ...bet, 
        status: 'cashed', 
        cashoutAt: clickMult, 
        payout: optimisticPayout, 
        multiplier: clickMult 
      };
      
      if (slot === 1) setBet1(optimisticBet as Bet);
      else setBet2(optimisticBet as Bet);

      // Atualiza o histórico local instantaneamente para feedback visual supersônico
      setMyHistory(prev => prev.map(item => {
        if (item.id === bet.id || item.id === bet.firestoreId || (bet.firestoreId && item.id === bet.firestoreId)) {
          return {
            ...item,
            multiplier: clickMult,
            payout: optimisticPayout,
            cashedOut: true,
            profit: optimisticPayout - bet.amount
          };
        }
        return item;
      }));

      // Também sincroniza a aposta do jogador na lista global de apostas ativa
      setLiveBets(prev => prev.map(item => {
        if (item.id === bet.id || item.id === bet.firestoreId || (bet.firestoreId && item.id === bet.firestoreId)) {
          return {
            ...item,
            multiplier: clickMult,
            payout: optimisticPayout,
            cashedOut: true,
            profit: optimisticPayout - bet.amount
          };
        }
        return item;
      }));

      // Tocar som de cashout no exato momento do clique
      sounds.playCashout();

      // Atualizar o saldo local de forma ágil e sem latência perceptível
      if (activeCabine) {
          const nextCabBal = Math.round((activeCabine.currentBalance + optimisticPayout) * 100) / 100;
          setActiveCabine(prev => prev ? { 
            ...prev, 
            currentBalance: nextCabBal, 
            profit: Math.round((nextCabBal - prev.initialBalance) * 100) / 100 
          } : null);
          updateCabineBalance(activeCabine.id, nextCabBal, optimisticPayout - bet.amount);
      } else if (activeEventId) {
          if (activeLeagueType !== 'multiplier') {
              setAerocoinBalance(prev => prev + optimisticPayout);
          }
      } else {
          setBalance(prev => prev + optimisticPayout);
      }
      
      // Expor informativo rico e profissional de saque instantaneamente
      const notifId = 'opt-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7);
      const newCashoutNotif: CashoutNotificationItem = {
        id: notifId,
        amount: optimisticPayout,
        betAmount: bet.amount,
        multiplier: clickMult,
        profit: optimisticPayout - (bet.isFreeFlight ? 0 : bet.amount),
        isFreeFlight: !!bet.isFreeFlight,
        isAerocoin: !!activeEventId && activeLeagueType !== 'multiplier',
        slot
      };
      setCashoutNotifications(prev => [...prev, newCashoutNotif]);
      setTimeout(() => setCashoutNotifications(prev => prev.filter(n => n.id !== notifId)), 4000);

      try {
        // --- VALIDAÇÃO DE CORRIDA E CRASH AUTORITATIVA NO SERVIDOR (RODA EM PARALELO) ---
        const validation = await requestCashout(slot, clickMult);

        // Se o servidor desautorizou a ação de saque (quando o avião já deu crash no mesmo instante)
        if (!validation.success) {
            // Remove a notificação se o servidor recusar
            setCashoutNotifications(prev => prev.filter(n => n.id !== notifId));
            // Reverter saldo adicionado otimisticamente
            if (activeEventId) {
                if (activeLeagueType !== 'multiplier') {
                    setAerocoinBalance(prev => Math.max(0, prev - optimisticPayout));
                }
            } else {
                setBalance(prev => Math.max(0, prev - optimisticPayout));
            }

            // Mudar status para perdido
            const lostBet = { ...bet, status: 'lost', multiplier: clickMult, profit: -bet.amount };
            if (slot === 1) setBet1(lostBet as Bet);
            else setBet2(lostBet as Bet);

            setMyHistory(prev => prev.map(item => {
              if (item.id === bet.id || item.id === bet.firestoreId) {
                return {
                  ...item,
                  multiplier: clickMult,
                  payout: 0,
                  cashedOut: false,
                  profit: -bet.amount
                };
              }
              return item;
            }));

            setLiveBets(prev => prev.map(item => {
              if (item.id === bet.id || item.id === bet.firestoreId) {
                return {
                  ...item,
                  multiplier: clickMult,
                  payout: 0,
                  cashedOut: false,
                  profit: -bet.amount
                };
              }
              return item;
            }));

            if (user && bet.firestoreId && !bet.firestoreId.startsWith('temp-') && !isGuest && !isOfflineFallback) {
                try {
                    await updateDoc(doc(db, 'bets', bet.firestoreId), {
                        status: 'lost',
                        multiplier: clickMult,
                        profit: -bet.amount
                    });
                } catch (dbErr) {
                    console.error("Erro ao registrar perda no Firestore:", dbErr);
                }
            }

            const errorMsg = validation.reason === "timeout"
              ? "Tempo limite de conexão esgotado! Seu saque não pôde ser confirmado no servidor."
              : validation.reason === "offline"
              ? "Você parece estar offline! Verifique sua conexão com a internet."
              : "O avião decolou antes de processar o seu saque! Tente novamente na próxima rodada.";

            handleAddNotification(
                validation.reason === "timeout" || validation.reason === "offline" ? "Erro de Conexão" : "Voo Encerrado", 
                errorMsg, 
                "warning"
            );
            return;
        }

        // Se o servidor validou com sucesso, pegamos o multiplicador final real homologado pelo servidor
        const confirmedMult = validation.multiplier || clickMult;
        const finalPayout = bet.amount * confirmedMult;

        // Se estiver em liga AeroFantasy de multiplicador, soma pontos e atualiza o melhor saque
        if (activeEventId && activeLeagueType === 'multiplier') {
            const pts = Math.round(confirmedMult * 10) / 10;
            setUserFantasyScore(prev => Math.round((prev + pts) * 10) / 10);
            setUserFantasyMaxMult(prev => Math.max(prev, confirmedMult));
        }

        // Atualiza o histórico local com o valor final confirmado pelo servidor
        setMyHistory(prev => prev.map(item => {
          if (item.id === bet.id || item.id === bet.firestoreId) {
            return {
              ...item,
              multiplier: confirmedMult,
              payout: finalPayout,
              cashedOut: true,
              profit: finalPayout - bet.amount
            };
          }
          return item;
        }));

        setLiveBets(prev => prev.map(item => {
          if (item.id === bet.id || item.id === bet.firestoreId) {
            return {
              ...item,
              multiplier: confirmedMult,
              payout: finalPayout,
              cashedOut: true,
              profit: finalPayout - bet.amount
            };
          }
          return item;
        }));

        // Se houver pequena discrepância pelo ping, ajustamos suavemente o balanço do usuário
        const diff = finalPayout - optimisticPayout;
        if (Math.abs(diff) > 0.01) {
            if (activeEventId) {
                if (activeLeagueType !== 'multiplier') {
                    setAerocoinBalance(prev => prev + diff);
                }
            } else {
                setBalance(prev => prev + diff);
            }

            // Atualiza para o valor preciso homologado pelo servidor
            const confirmedBet = { 
              ...bet, 
              status: 'cashed', 
              cashoutAt: confirmedMult, 
              payout: finalPayout, 
              multiplier: confirmedMult 
            };
            if (slot === 1) setBet1(confirmedBet as Bet);
            else setBet2(confirmedBet as Bet);
        }

        // Validação de multiplicador mínimo para promoções e voos grátis
        if (bet.isFreeFlight) {
            const activeConfig = freeFlightConfigs.find(c => c.active);
            const minMult = activeConfig?.minCashoutMultiplier || 1.5;
            if (confirmedMult < minMult) {
                // Remove o saldo adicionado
                if (activeEventId) {
                    if (activeLeagueType !== 'multiplier') {
                        setAerocoinBalance(prev => Math.max(0, prev - (optimisticPayout + diff)));
                    }
                } else {
                    setBalance(prev => Math.max(0, prev - (optimisticPayout + diff)));
                }

                // Devolve o controle ao usuário e restaura a aposta ativa
                if (slot === 1) activeBetsRef.current.bet1 = true;
                if (slot === 2) activeBetsRef.current.bet2 = true;
                
                if (slot === 1) setBet1(bet);
                else setBet2(bet);

                setMyHistory(prev => prev.map(item => {
                  if (item.id === bet.id || item.id === bet.firestoreId) {
                    return {
                      ...item,
                      multiplier: 1.00,
                      payout: 0,
                      cashedOut: false,
                      profit: 0
                    };
                  }
                  return item;
                }));

                setLiveBets(prev => prev.map(item => {
                  if (item.id === bet.id || item.id === bet.firestoreId) {
                    return {
                      ...item,
                      multiplier: 1.00,
                      payout: 0,
                      cashedOut: false,
                      profit: 0
                    };
                  }
                  return item;
                }));

                handleAddNotification("Saque Bloqueado", `O multiplicador mínimo para voos grátis é ${minMult.toFixed(2)}x.`, "warning");
                return;
            }
        }

        // Sincronização definitiva com banco de dados remoto
        if (user && !isGuest && !isOfflineFallback) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const updates: any = {
                balance: increment(finalPayout),
                totalWins: increment(1)
            };
            
            if (confirmedMult > userStats.maxMult) {
                updates.maxMult = confirmedMult;
            }

            await updateDoc(userDocRef, updates);

            // Gravação segura no histórico de apostas
            if (bet.firestoreId && !bet.firestoreId.startsWith('temp-')) {
                await updateDoc(doc(db, 'bets', bet.firestoreId), {
                    multiplier: confirmedMult,
                    payout: finalPayout,
                    cashedOut: true,
                    profit: finalPayout - bet.amount
                });
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }
        } else if (isGuest || isOfflineFallback) {
            setUserStats(prev => ({
                ...prev,
                totalWins: (prev.totalWins || 0) + 1,
                maxMult: Math.max(prev.maxMult || 0, confirmedMult)
            }));
        }

      } catch (err) {
         console.error("Erro inesperado durante o cashout:", err);
         
         // Se estourar qualquer exceção, desfazemos o saldo otimista por segurança total
         if (activeEventId) {
             if (activeLeagueType !== 'multiplier') {
                 setAerocoinBalance(prev => Math.max(0, prev - optimisticPayout));
             }
         } else {
             setBalance(prev => Math.max(0, prev - optimisticPayout));
         }

         const lostBet = { ...bet, status: 'lost', multiplier: clickMult, profit: -bet.amount };
         if (slot === 1) setBet1(lostBet as Bet);
         else setBet2(lostBet as Bet);

         setMyHistory(prev => prev.map(item => {
           if (item.id === bet.id || item.id === bet.firestoreId) {
             return {
               ...item,
               multiplier: clickMult,
               payout: 0,
               cashedOut: false,
               profit: -bet.amount
             };
           }
           return item;
         }));

         setLiveBets(prev => prev.map(item => {
           if (item.id === bet.id || item.id === bet.firestoreId) {
             return {
               ...item,
               multiplier: clickMult,
               payout: 0,
               cashedOut: false,
               profit: -bet.amount
             };
           }
           return item;
         }));

         handleAddNotification(
             "Erro de Comunicação", 
             "Falha de rede ao se comunicar com o servidor. O saque foi cancelado por segurança.", 
             "warning"
         );
      } finally {
        bettingLockRef.current.delete(lockKey);
      }
  };

  const claimMissionReward = (missionId: string) => {
      const mission = missions.find(m => m.id === missionId);
      if (!mission || mission.rewardClaimed) return;
      setMissions(prev => prev.map(m => m.id === missionId ? { ...m, rewardClaimed: true } : m));
      if (mission.rewardBalance > 0) {
          setBalance(b => b + mission.rewardBalance);
          setTransactions(prev => [...prev, { id: `rw-${Date.now()}`, type: 'reward', amount: mission.rewardBalance, date: Date.now(), description: `Recompensa: ${mission.title}` }]);
      }
      if (mission.rewardFlights > 0) {
          setUserStats(prev => ({ ...prev, freeFlights: prev.freeFlights + mission.rewardFlights }));
      }
      sounds.playFanfare();
      handleAddNotification("Missão Completa!", `Você recebeu seus prêmios.`, "reward");
  };

  const handleStartMission = (missionId: string) => {
      setMissions(prev => prev.map(m => m.id === missionId ? { ...m, accepted: true } : m));
      setTrackedMissionId(missionId);
      handleAddNotification("Missão Aceita", "Objetivo fixado no HUD.", "info", "mission");
  };

  const handleTrackMission = (missionId: string) => {
      setTrackedMissionId(missionId);
  };

  const handleJoinEvent = (eventId: string, cost: number) => {
      if (!isAuthenticated) {
          setShowAuthModal(true);
          return;
      }
      if (balance < cost) {
          handleAddNotification("Saldo Insuficiente", "Faça um depósito para participar.", "warning");
          return;
      }
      if (cost > 0) {
          setBalance(b => b - cost);
          setTransactions(prev => [...prev, { id: `ev-${Date.now()}`, type: 'bet', amount: cost, date: Date.now(), description: 'Entrada Evento' }]);
      }
      setIsUserBusy(true);
      setTimeout(() => {
          setIsUserBusy(false);
          setActiveEventId(eventId);
          const event = events.find(e => e.id === eventId) || tournaments.find(t => t.id === eventId);
          if (event) {
              setActiveLeagueType(event.leagueType);
              if (event.leagueType === 'aerocoin') {
                  setAerocoinBalance(event.initialAerocoins || 1000);
                  setFantasyFlightsLeft(null);
              } else if (event.leagueType === 'multiplier') {
                  setFantasyFlightsLeft(event.flightsLimit || 10);
                  setAerocoinBalance(0);
              }
              if (tournaments.some(t => t.id === eventId)) {
                  setTournaments(prev => prev.map(t => t.id === eventId ? { ...t, userJoined: true } : t));
              } else {
                  setEvents(prev => prev.map(e => e.id === eventId ? { ...e, userJoined: true } : e));
              }
          }
          handleAddNotification("Bem-vindo!", "Modo Evento Ativado.", "info");
      }, 1000);
  };

  const handleExitEventMode = () => {
      setActiveEventId(null);
      setActiveLeagueType(null);
      setAerocoinBalance(0);
      setFantasyFlightsLeft(null);
      setUserFantasyScore(0);
      setUserFantasyFlightsUsed(0);
      setUserFantasyMaxMult(0);
      setActiveCategory('aerobet');
      handleAddNotification("AeroGame Clássico", "Você saiu da competição e voltou para o modo de voo normal com saldo real.", "info");
  };

  const handleWheelPrize = (type: 'balance' | 'flight', amount: number) => {
      if (type === 'balance') {
          setUserStats(prev => ({ ...prev, bonusBalance: prev.bonusBalance + amount }));
          handleAddNotification("Roleta", `Ganhou R$ ${amount} de bônus!`, "reward");
      } else {
          setUserStats(prev => ({ ...prev, freeFlights: prev.freeFlights + amount }));
          handleAddNotification("Roleta", `Ganhou ${amount} Voos Grátis!`, "reward");
      }
      setUserStats(prev => ({ ...prev, lastSpinTime: Date.now() }));
  };

  const handleSubscriptionPurchase = (renew: boolean) => {
      if (!isAuthenticated) {
          setShowAuthModal(true);
          return;
      }
      const cost = 47.90;
      if (balance < cost) return;
      setBalance(b => b - cost);
      setTransactions(prev => [...prev, { id: `sub-${Date.now()}`, type: 'subscription', amount: cost, date: Date.now(), description: 'Assinatura Elite' }]);
      setUserStats(prev => ({ ...prev, subscriptionExpiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), autoRenewSubscription: renew }));
      setRevenueStats(prev => ({ ...prev, subscriptions: prev.subscriptions + cost }));
      handleAddNotification("Elite Member", "Assinatura ativada com sucesso!", "success");
  };

  const handleToggleAutoRenew = () => {
      setUserStats(prev => ({ ...prev, autoRenewSubscription: !prev.autoRenewSubscription }));
  };

  const handleUpdateBankrollPlan = (plan: BankrollPlan) => {
      setUserStats(prev => {
          const exists = prev.bankrollPlans.find(p => p.id === plan.id);
          let newPlans;
          if (exists) newPlans = prev.bankrollPlans.map(p => p.id === plan.id ? plan : p);
          else newPlans = [...prev.bankrollPlans, plan];
          return { ...prev, bankrollPlans: newPlans };
      });
  };

  const handleActivatePlan = (planId: string, slot: 1 | 2 | 'disable') => {
      setUserStats(prev => {
          const newActive = { ...prev.activePlanIds };
          if (slot === 'disable') {
              if (newActive.slot1 === planId) newActive.slot1 = null;
              if (newActive.slot2 === planId) newActive.slot2 = null;
          } else if (slot === 1) newActive.slot1 = planId; else newActive.slot2 = planId;
          return { ...prev, activePlanIds: newActive };
      });
  };

  const handleDeletePlan = (planId: string) => {
      setUserStats(prev => ({ ...prev, bankrollPlans: prev.bankrollPlans.filter(p => p.id !== planId), activePlanIds: { slot1: prev.activePlanIds.slot1 === planId ? null : prev.activePlanIds.slot1, slot2: prev.activePlanIds.slot2 === planId ? null : prev.activePlanIds.slot2 } }));
  };

  const handleResetPlan = (planId: string) => {
      setUserStats(prev => ({ ...prev, bankrollPlans: prev.bankrollPlans.map(p => p.id === planId ? { ...p, currentDayProfit: 0 } : p) }));
  };

  const handleDepositConfirm = async (amount: number, hasOrderBump?: boolean) => {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          balance: increment(amount),
          lastDepositTime: Date.now(),
          firstDepositDone: true
        });
      }
      setTransactions(prev => [...prev, { id: `dep-${Date.now()}`, type: 'deposit', amount, date: Date.now(), description: 'Depósito PIX' }]);
      setDepositNotifications(prev => [...prev, { id: Date.now().toString(), amount }]);
      setTimeout(() => setDepositNotifications(prev => prev.slice(1)), 3000);
      sounds.playCashout();
      handleAddNotification("Depósito", `R$ ${amount.toFixed(2)} adicionado!`, "success");
      if (hasOrderBump) handleSubscriptionPurchase(true);
  };

  const handleWithdrawConfirm = async (amount: number, pixKey: string) => {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          balance: increment(-amount)
        });
      }
      setTransactions(prev => [...prev, { id: `wd-${Date.now()}`, type: 'cashout', amount, date: Date.now(), description: 'Saque PIX' }]);
      setPendingWithdrawals(prev => [...prev, { id: `wd-${Date.now()}`, type: 'cashout', amount, date: Date.now(), description: `Saque para ${pixKey}` }]);
      handleAddNotification("Saque Solicitado", "Aguardando processamento.", "info");
  };

  const handleUpdateAvatar = (newUrl: string) => setUserAvatar(newUrl);
  const handleUpdateProfile = (newProfile: Partial<UserProfile>) => setUserProfile(prev => ({ ...prev, ...newProfile }));

  const handleClaimReferral = (refId: string) => {
      setReferrals(prev => prev.map(r => r.id === refId ? { ...r, status: 'claimed' } : r));
      setBalance(b => b + 10);
      setTransactions(prev => [...prev, { id: `ref-${Date.now()}`, type: 'reward', amount: 10, date: Date.now(), description: 'Bônus Indicação' }]);
      handleAddNotification("Indicação", "Recebeu R$ 10,00!", "reward");
  };

  const handleClaimAchievement = (id: string) => {
      if (claimedAchievements.includes(id)) return;
      const ach = achievements.find(a => a.id === id);
      if (!ach) return;
      setClaimedAchievements(prev => [...prev, id]);
      
      if (ach.rewardFlights) {
          setUserStats(prev => ({ ...prev, freeFlights: prev.freeFlights + ach.rewardFlights! }));
          handleAddNotification("Conquista", `Recebeu ${ach.rewardFlights} Voos Grátis!`, "reward");
      }
      if (ach.rewardBalance) {
          setBalance(prev => prev + ach.rewardBalance!);
          handleAddNotification("Conquista", `Recebeu R$ ${ach.rewardBalance.toFixed(2)}!`, "reward");
      }
  };

  const handleShowFairness = () => {
      const latest = history.length > 0 ? history[0] : { multiplier: 1.00, color: '#34b1e2', hash: nextRoundServerSeedHash, serverSeed: 'HIDDEN', clientSeed: 'CLIENT', roundId: 'NEXT' };
      setSelectedHistory(latest);
  };

  // Sync Chat Messages from Firestore
  useEffect(() => {
    const q = query(collection(db, 'chat'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          user: data.user,
          message: data.message,
          timestamp: data.timestamp?.toMillis() || Date.now(),
          role: data.role
        };
      }).reverse();
      setChatMessages(messages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chat');
    });
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (text: string) => {
      if (!user) {
          setShowAuthModal(true);
          return;
      }
      try {
        if (!isGuest) {
          await addDoc(collection(db, 'chat'), {
            user: currentUsername,
            message: text,
            timestamp: serverTimestamp(),
            role: 'user',
            uid: user.uid
          });
        } else {
          const mockMsg = {
            id: `msg-guest-${Date.now()}`,
            user: currentUsername,
            message: text,
            timestamp: Date.now(),
            role: 'user'
          };
          setChatMessages(prev => [...prev, mockMsg]);
        }
      } catch (err) {
        console.error("Error sending message", err);
      }
  };

  // --- GAME LOGIC EFFECT ---
  useEffect(() => {
      const isSoundAllowed = !isInInitialLanding && activeCategory === 'aerobet';
      if (status === GameStatus.WAITING && lastStatusRef.current !== GameStatus.WAITING) {
          // Reset current round bets when waiting for next round
          setBet1(null);
          setBet2(null);
          sounds.stopEngine();
          sounds.stopTakeoffSequence();
      } else if (status === GameStatus.FLYING && lastStatusRef.current !== GameStatus.FLYING) {
          if (isSoundAllowed) {
            sounds.stopTakeoffSequence();
            sounds.playTakeoff();
          } else {
            sounds.stopTakeoffSequence();
          }
          const processBet = async (bet: any, setter: any, slot: number) => {
              if (bet) {
                  const newBet: Bet = {
                      id: `bet-${Date.now()}-${slot}`,
                      amount: bet.amount,
                      status: 'active',
                      isFreeFlight: bet.isFreeFlight,
                      source: bet.source,
                      firestoreId: bet.firestoreId
                  };
                  setter(newBet);
                  if (slot === 1) activeBetsRef.current.bet1 = true;
                  else if (slot === 2) activeBetsRef.current.bet2 = true;
                  
                  // Deduct flight when round starts for either Slot 1 or Slot 2 in AeroFantasy
                  if (activeEventId && activeLeagueType === 'multiplier' && fantasyFlightsLeft !== null) {
                      setFantasyFlightsLeft(prev => {
                          const next = prev !== null ? Math.max(0, prev - 1) : 0;
                          if (next === 0) {
                              handleAddNotification("Competição Concluída!", "Você utilizou sua cota de voos na sala. Confira sua posição no ranking!", "reward");
                          }
                          return next;
                      });
                      setUserFantasyFlightsUsed(prev => prev + 1);
                  }

                  if (activeCabine) {
                      const nextCabBal = Math.max(0, Math.round((activeCabine.currentBalance - bet.amount) * 100) / 100);
                      setActiveCabine(prev => prev ? { ...prev, currentBalance: nextCabBal } : null);
                      updateCabineBalance(activeCabine.id, nextCabBal);
                  } else if (user && !activeEventId) {
                      const userDocRef = doc(db, 'users', user.uid);
                      const deduction = bet.isFreeFlight ? { freeFlights: increment(-1) } : { balance: increment(-bet.amount) };
                      
                      // DEDUCT LOCALLY IMMEDIATELY to prevent race conditions and visual ghosting
                      if (bet.isFreeFlight) {
                          setUserStats(prev => ({ ...prev, freeFlights: prev.freeFlights - 1 }));
                      } else {
                          setBalance(prev => prev - bet.amount);
                      }
                      
                      try {
                          // Update Firestore in background
                          if (!isGuest) {
                              await updateDoc(userDocRef, deduction);
                          }
                      } catch (err) {
                          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/deduct`);
                          // If deduction fails (e.g. insufficient funds), cancel the bet locally and refund
                          setter(null);
                          setLiveBets(prev => prev.filter(b => b.id !== newBet.id));
                          if (bet.isFreeFlight) {
                              setUserStats(prev => ({ ...prev, freeFlights: prev.freeFlights + 1 }));
                          } else {
                              setBalance(prev => prev + bet.amount);
                          }
                      }
                  }

                  setLiveBets(prev => [{ 
                      id: newBet.id, 
                      username: currentUsername, 
                      amount: bet.amount, 
                      isMe: true,
                      multiplier: 1.00,
                      payout: 0,
                      cashedOut: false,
                      timestamp: Date.now(),
                      roundId: nextRoundServerSeedHash
                  }, ...prev]);
                  setMyHistory(prev => [
                    {
                      id: newBet.id,
                      username: currentUsername,
                      amount: bet.amount,
                      multiplier: 1.00,
                      payout: 0,
                      isMe: true,
                      cashedOut: false,
                      timestamp: Date.now(),
                      roundId: nextRoundServerSeedHash
                    },
                    ...prev
                  ].slice(0, 50));
                  setRoundStats(prev => ({ ...prev, count: prev.count + 1, amount: prev.amount + bet.amount }));
              }
          };
          if (nextRoundBet1) { 
              processBet(nextRoundBet1, setBet1, 1); 
              setNextRoundBet1(null); 
          }
          if (nextRoundBet2) { 
              processBet(nextRoundBet2, setBet2, 2); 
              setNextRoundBet2(null); 
          }

          // Aposta cooperativa do parceiro de cabine
          if (activeCabine && (activeCabine.copilotName || activeCabine.userRole === 'copilot')) {
              const currentCabBal = activeCabine.currentBalance;
              if (currentCabBal >= 10) {
                  const partnerAmt = Math.min(Math.max(5, Math.round(currentCabBal * 0.08)), 50);
                  const targetMult = parseFloat((1.35 + Math.random() * 1.8).toFixed(2));
                  setSimulatedPartnerBet({
                      amount: partnerAmt,
                      targetMult,
                      cashedOut: false
                  });
                  const nextCabBal = Math.max(0, Math.round((currentCabBal - partnerAmt) * 100) / 100);
                  setActiveCabine(prev => prev ? { ...prev, currentBalance: nextCabBal } : null);
                  updateCabineBalance(activeCabine.id, nextCabBal);
              }
          }
          
          // Increment total rounds played in Firestore
          if (user && (nextRoundBet1 || nextRoundBet2) && !activeEventId) {
              if (!isGuest) {
                  const userDocRef = doc(db, 'users', user.uid);
                  updateDoc(userDocRef, { totalRounds: increment(1) }).catch(err => {
                      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/totalRounds`);
                  });
              } else {
                  setUserStats(prev => ({ ...prev, totalRounds: (prev.totalRounds || 0) + 1 }));
              }
          }
      } else if (status === GameStatus.CRASHED && lastStatusRef.current !== GameStatus.CRASHED) {
          sounds.stopEngine();
          sounds.stopTakeoffSequence();
          sounds.playCrash();
          const handleResult = async (bet: Bet | null, setter: any, slotIndicator: 1|2) => { 
              if (bet && bet.status === 'active' && activeBetsRef.current[`bet${slotIndicator}` as 'bet1'|'bet2']) {
                  activeBetsRef.current[`bet${slotIndicator}` as 'bet1'|'bet2'] = false;
                  setter({ ...bet, status: 'lost' }); 
                  setLiveBets(prev => prev.map(item => {
                    if (item && (item.id === bet.id || item.id === bet.firestoreId)) {
                      return {
                        ...item,
                        multiplier: multiplierRef.current,
                        payout: 0,
                        cashedOut: false,
                        profit: -bet.amount
                      };
                    }
                    return item;
                  }));
                  
                  setMyHistory(prev => prev.map(item => {
                    if (item.id === bet.id || item.id === bet.firestoreId) {
                      return {
                        ...item,
                        multiplier: multiplierRef.current,
                        payout: 0,
                        cashedOut: false,
                        profit: -bet.amount
                      };
                    }
                    return item;
                  }));

                  if (bet.firestoreId && !bet.firestoreId.startsWith('temp-') && !isGuest) {
                      try {
                          await updateDoc(doc(db, 'bets', bet.firestoreId), {
                              status: 'lost',
                              multiplier: multiplierRef.current,
                              profit: -bet.amount
                          });
                      } catch (err) {
                          console.error("Error updating lost bet", err);
                      }
                  }
              }
          };
          handleResult(bet1, setBet1, 1); 
          handleResult(bet2, setBet2, 2);
      }

      lastStatusRef.current = status;
  }, [status, nextRoundBet1, nextRoundBet2, currentUsername, isInInitialLanding, activeCategory]);

  // Garante que ao entrar em qualquer modo (AeroGame, AeroFantasy, etc.) a tela inicie no topo (no gráfico do jogo)
  useEffect(() => {
    if (!isInInitialLanding) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const rootEl = document.getElementById('root');
      if (rootEl) rootEl.scrollTop = 0;
    }
  }, [isInInitialLanding, activeCategory]);

  // Lógica de Saque e Finalização da aposta cooperativa do parceiro de cabine
  useEffect(() => {
    if (status === GameStatus.FLYING && simulatedPartnerBet && !simulatedPartnerBet.cashedOut) {
      const target = simulatedPartnerBet.targetMult || 2.0;
      if (multiplier >= target) {
        const winAmt = Math.round((simulatedPartnerBet.amount * target) * 100) / 100;
        const profit = Math.round((winAmt - simulatedPartnerBet.amount) * 100) / 100;
        setSimulatedPartnerBet(prev => prev ? {
          ...prev,
          cashedOut: true,
          cashoutAt: target,
          profit
        } : null);

        if (activeCabine) {
          const nextBal = Math.round((activeCabine.currentBalance + winAmt) * 100) / 100;
          setActiveCabine(prev => prev ? { 
            ...prev, 
            currentBalance: nextBal, 
            profit: Math.round((nextBal - prev.initialBalance) * 100) / 100 
          } : null);
          updateCabineBalance(activeCabine.id, nextBal, profit);
        }
      }
    } else if (status === GameStatus.WAITING) {
      setSimulatedPartnerBet(null);
    }
  }, [status, multiplier, simulatedPartnerBet, activeCabine]);

  const handleCabineStarted = async (newCabine: CabineSession) => {
    const share = newCabine.totalBankroll / 2;
    // Deduct 50% from user's personal wallet
    setBalance(prev => Math.max(0, Math.round((prev - share) * 100) / 100));
    if (user && !isGuest) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          balance: increment(-share)
        });
      } catch (e) {
        console.warn('Error deducting cabine share:', e);
      }
    }
    setActiveCabine(newCabine);
    saveActiveCabineToStorage(newCabine);
    setIsInInitialLanding(false);
    setActiveCategory('aerobet');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    handleAddNotification(
      "Cabine Ativada!",
      `Você entrou na ${newCabine.name}! Aporte de R$ ${share.toFixed(2)} (50%) realizado da sua carteira para a banca de R$ ${newCabine.totalBankroll.toFixed(2)}. Bom voo!`,
      "success"
    );
  };

  const handleConfirmCloseCabine = async () => {
    if (!activeCabine) return;
    const finalBal = activeCabine.currentBalance;
    const sharePerPilot = Math.max(0, Math.round((finalBal / 2) * 100) / 100);

    // Credit 50% of the final balance back to user's wallet
    setBalance(prev => Math.round((prev + sharePerPilot) * 100) / 100);
    if (user && !isGuest) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          balance: increment(sharePerPilot)
        });
      } catch (e) {
        console.warn('Error crediting cabine share back:', e);
      }
    }

    await closeCabineSession(activeCabine.id);
    setActiveCabine(null);
    saveActiveCabineToStorage(null);
    setIsCabineCloseModalOpen(false);

    handleAddNotification(
      "Cabine Finalizada (50/50)",
      `Operação encerrada! Da banca final de R$ ${finalBal.toFixed(2)}, 50% (R$ ${sharePerPilot.toFixed(2)}) foram creditados na sua carteira.`,
      "reward"
    );
  };

  const handleConnectSimulatedCopilot = () => {
    if (!activeCabine) return;
    const updated: CabineSession = {
      ...activeCabine,
      copilotId: 'sim-copilot-fox',
      copilotName: 'Copiloto Fox-01 (IA)',
      status: 'active'
    };
    setActiveCabine(updated);
    saveActiveCabineToStorage(updated);
    handleAddNotification("Copiloto Conectado!", "Copiloto Fox-01 assumiu o Slot 2 da cabine! Operação conjunta iniciada com sucesso.", "success");
  };

  // Sincroniza configurações globais do gráfico (fundo compartilhado)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'gameCanvas'), (snap) => {
      if (snap.exists()) {
        const remoteConfig = snap.data() as CanvasBackgroundConfig;
        setCanvasBgConfig(remoteConfig);
        saveCanvasBackgroundConfig(remoteConfig);
      }
    });
    return () => unsub();
  }, []);

  // Sincroniza mensagens do chat privado e rádio da cabine ativa
  useEffect(() => {
    if (!activeCabine) {
      setCabineMessages([]);
      cabineRadio.destroy();
      setIsRadioOn(false);
      setIsTalking(false);
      setIsPartnerTalking(false);
      setIsHandsFree(false);
      return;
    }

    const cabineId = activeCabine.id;
    const role = activeCabine.userRole || 'pilot';

    // Escuta a cabine específica em tempo real (saldo, parceiro entrando, etc)
    const unsubCabineDoc = onSnapshot(doc(db, 'cabines', cabineId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as CabineSession;
        setActiveCabine(prev => prev ? { ...data, userRole: prev.userRole } : data);
        saveActiveCabineToStorage({ ...data, userRole: role });
      } else {
        // Cabine foi excluída ou encerrada
        setActiveCabine(null);
        saveActiveCabineToStorage(null);
        handleAddNotification("Cabine Encerrada", "Esta cabine não está mais disponível ou foi fechada.", "info");
      }
    });

    const unsubMessages = listenToCabineMessages(cabineId, (msgs) => {
      setCabineMessages(msgs);
    });

    cabineRadio.initRadio(cabineId, role, {
      onVolume: (vol) => setRadioVolume(vol),
      onPartnerTalking: (talking) => setIsPartnerTalking(talking)
    });

    // Marca presença online
    updateCabinePresence(cabineId, role, true);

    return () => {
      unsubMessages();
      unsubCabineDoc();
      cabineRadio.destroy();
      // Marca saída e tenta cleanup
      updateCabinePresence(cabineId, role, false);
    };
  }, [activeCabine?.id]);

  const handleToggleRadio = async () => {
    if (isRadioOn) {
      cabineRadio.destroy();
      setIsRadioOn(false);
      setIsTalking(false);
      setIsPartnerTalking(false);
      setIsHandsFree(false);
      handleAddNotification("Rádio Intercom", "Rádio da cabine desconectado.", "info");
    } else {
      const ok = await cabineRadio.enableMicrophone();
      if (ok) {
        setIsRadioOn(true);
        handleAddNotification("Rádio VHF 121.5 MHz", "Microfone ligado no intercom da cabine! Fale ao vivo com seu copiloto.", "success");
      } else {
        handleAddNotification("Acesso ao Microfone", "Por favor, autorize o microfone no navegador para falar no rádio da cabine.", "warning");
      }
    }
  };

  const handleToggleMicMute = () => {
    const muted = cabineRadio.toggleMute();
    setIsMicMuted(muted);
  };

  const handleToggleHandsFree = () => {
    if (isHandsFree) {
      cabineRadio.setTransmitting(false);
      setIsTalking(false);
      setIsHandsFree(false);
    } else {
      cabineRadio.setTransmitting(true);
      setIsTalking(true);
      setIsHandsFree(true);
    }
  };

  const handleStartTalking = () => {
    if (isHandsFree) return; // Se em mãos livres, já está transmitindo continuamente
    try {
      window.getSelection()?.removeAllRanges();
    } catch (e) {}
    cabineRadio.setTransmitting(true);
    setIsTalking(true);
  };

  const handleStopTalking = () => {
    if (isHandsFree) return; // Não silenciar no mouseUp se estiver em mãos livres
    cabineRadio.setTransmitting(false);
    setIsTalking(false);
  };

  const handleSendCabineMessage = async (text: string) => {
    if (!activeCabine || !text.trim()) return;
    const role = activeCabine.userRole || 'pilot';
    const senderName = currentUsername || (role === 'pilot' ? activeCabine.pilotName : (activeCabine.copilotName || 'Copiloto'));

    const localMsg: CabineMessage = {
      id: `local-${Date.now()}`,
      cabineId: activeCabine.id,
      sender: senderName,
      role,
      text: text.trim(),
      timestamp: Date.now()
    };
    setCabineMessages(prev => [...prev, localMsg]);

    await sendCabineMessage({
      cabineId: activeCabine.id,
      sender: senderName,
      role,
      text: text.trim()
    });

    if (activeCabine.copilotId?.startsWith('sim-')) {
      setTimeout(() => {
        const responses = [
          "Copiado Comandante! Monitorando radar e velocidade de subida.",
          "Roger Piloto! Pronto para ejetar na hora certa.",
          "Perfeito parceiro, vamos buscar o multiplicador alto juntos!",
          "Afirmativo! Banca compartilhada alinhada."
        ];
        const resp = responses[Math.floor(Math.random() * responses.length)];
        cabineRadio.triggerSimulatedCopilotResponse(resp);
        const copilotMsg: CabineMessage = {
          id: `sim-${Date.now()}`,
          cabineId: activeCabine.id,
          sender: activeCabine.copilotName || 'Copiloto Fox-01 (IA)',
          role: 'copilot',
          text: resp,
          timestamp: Date.now()
        };
        setCabineMessages(p => [...p, copilotMsg]);
      }, 1100);
    }
  };

  if (isAeroFantasyAdminOpen) {
      return <AeroFantasyAdmin 
          onClose={() => setIsAeroFantasyAdminOpen(false)} 
          events={events} 
          tournaments={tournaments} 
          onCreateEvent={(e, isT) => { 
              if(isT) { setTournaments(p => [...p, e]); handleAddNotification("Nova Liga!", `Liga ${e.title} criada.`, "info", "tournament"); } 
              else { setEvents(p => [...p, e]); handleAddNotification("Novo Evento!", `${e.title} disponível.`, "info", "event"); }
          }}
          onDeleteEvent={(id, isT) => {
              if(isT) setTournaments(p => p.filter(x => x.id !== id));
              else setEvents(p => p.filter(x => x.id !== id));
          }}
          onUpdateEvent={handleUpdateEvent}
      />;
  }

  if (isAdminOpen) return <AdminPanel 
      onClose={() => setIsAdminOpen(false)} 
      gameStatus={status} currentMultiplier={multiplier} onForceCrash={forceCrashNow} onSetNextResult={setNextRoundResult} rtp={rtp} onUpdateRtp={(val) => { setRtp(val); updateRtp(val); }} houseBankroll={houseBankroll} onUpdateHouseBankroll={setHouseBankroll} subscriptionRevenue={revenueStats.subscriptions} missionRevenue={revenueStats.missions} users={usersDb} withdrawals={pendingWithdrawals} missions={missions} events={events} tournaments={tournaments} onApproveWithdrawal={handleAdminApproveWithdrawal} onRejectWithdrawal={handleAdminRejectWithdrawal} onUpdateUserBalance={handleAdminUpdateUserBalance} onToggleUserBan={handleAdminToggleBan} onCreateMission={(m) => { setMissions(p => [...p, m]); handleAddNotification("Novo Desafio!", `Convite: ${m.title} disponível.`, "info", "mission"); }} onDeleteMission={(id) => setMissions(p => p.filter(x => x.id !== id))} onCreateEvent={(e, isTourney) => { if (isTourney) { setTournaments(p => [...p, e]); handleAddNotification("Torneio Iniciado!", `Participe do ${e.title} agora!`, "info", "tournament"); } else { setEvents(p => [...p, e]); handleAddNotification("Novo Evento!", `${e.title}: Confira as regras.`, "info", "event"); } }} onDeleteEvent={(id, isTourney) => isTourney ? setTournaments(p => p.filter(x => x.id !== id)) : setEvents(p => p.filter(x => x.id !== id))} onUpdateEvent={handleUpdateEvent} onSendNotification={handleAdminSendNotification} wheelPrizes={wheelPrizes} onUpdateWheelPrize={handleUpdateWheelPrize} depositConfigs={depositConfigs} onUpdateDepositConfig={handleUpdateDepositConfig} 
      banners={banners}
      onUpdateBanners={setBanners}
      freeFlightConfigs={freeFlightConfigs}
      onUpdateFreeFlightConfigs={setFreeFlightConfigs}
      clubeConfig={clubeConfig}
      onUpdateClubeConfig={setClubeConfig}
      onOpenAeroFantasyAdmin={() => { setIsAdminOpen(false); setIsAeroFantasyAdminOpen(true); }}
      onPreviewLanding={() => { setIsAdminOpen(false); setIsInInitialLanding(true); }}
      canvasBgConfig={canvasBgConfig}
      onUpdateCanvasBgConfig={(newConfig) => {
        setCanvasBgConfig(newConfig);
        saveCanvasBackgroundConfig(newConfig);
        // Salva no banco de dados para todos verem
        setDoc(doc(db, 'settings', 'gameCanvas'), newConfig).catch(err => {
          console.warn('Erro ao sincronizar fundo compartilhado:', err);
        });
      }}
      />;
  
  if (isCurrentUserBanned) return <BannedScreen />;

  if (!isAuthReady) {
      return (
          <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
              <div className="w-16 h-16 border-4 border-[#e51a31] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white font-bold animate-pulse">Conectando aos servidores...</p>
          </div>
      );
  }

  // --- RENDER AUTH SE NÃO LOGADO ---
  if (!isAuthenticated) {
      return (
          <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
            <AuthModal onClose={() => {}} onLoginSuccess={handleLoginSuccess} />
          </div>
      );
  }

  const currentAvailableBalance = activeCabine
    ? Math.max(0, activeCabine.currentBalance - (activeCabine.userRole === 'pilot' 
        ? (nextRoundBet1 && !nextRoundBet1.isFreeFlight ? nextRoundBet1.amount : 0) 
        : (nextRoundBet2 && !nextRoundBet2.isFreeFlight ? nextRoundBet2.amount : 0)))
    : balance - 
        (nextRoundBet1 && !nextRoundBet1.isFreeFlight ? nextRoundBet1.amount : 0) - 
        (nextRoundBet2 && !nextRoundBet2.isFreeFlight ? nextRoundBet2.amount : 0);

  return (
    <div className="min-h-screen lg:h-screen bg-black text-white p-1 md:p-1.5 flex flex-col gap-1 max-w-[1600px] mx-auto overflow-x-hidden lg:overflow-hidden font-sans relative">
      {isOfflineFallback && (
        <div className="bg-red-950/90 border border-red-500/50 p-3 mx-2 mt-2 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-white text-xs z-50 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <div className="text-left">
              <p className="font-bold uppercase tracking-wider text-red-400 text-[11px]">Modo de Simulação Ativo (Limite Firebase Excedido)</p>
              <p className="text-white/70 text-[11px] lg:text-xs">O limite de consultas diárias gratuitas do banco de dados excedeu. Você pode continuar jogando normalmente; o progresso será mantido off-line no navegador.</p>
            </div>
          </div>
          <a
            href="https://console.firebase.google.com/project/gen-lang-client-0814907760/firestore/databases/ai-studio-4e74ddd1-e192-457f-9aa0-db6efc77c25c/data?openUpgradeDialog=true"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded-xl uppercase tracking-wider text-[10px] transition-colors shadow-lg"
          >
            Acessar Console & Fazer Upgrade
          </a>
        </div>
      )}
      {isNotificationsOpen && <NotificationsModal onClose={() => setIsNotificationsOpen(false)} notifications={appNotifications} onMarkAllRead={handleMarkAllRead} onClearAll={handleClearNotifications} onNotificationClick={handleNotificationClick} />}
      
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onOpenProfile={() => setIsProfileModalOpen(true)} 
        onOpenWallet={() => setIsWalletModalOpen(true)} 
        onOpenMissions={() => setIsMissionsModalOpen(true)} 
        onOpenEvents={() => setIsEventsModalOpen(true)} 
        onOpenTournaments={() => {
          const act = () => { setIsMenuOpen(false); setActiveCategory('aerofantasy'); setIsInInitialLanding(false); };
          if (activeCabine) setPendingNavigationAction(() => act);
          else act();
        }} 
        onOpenRanking={() => setIsRankingModalOpen(true)} 
        onOpenHistory={() => setIsFullHistoryOpen(true)} 
        onOpenAchievements={() => setIsAchievementsModalOpen(true)} 
        onOpenAdmin={() => setIsAdminOpen(true)} 
        onOpenDailyWheel={() => setIsDailyWheelOpen(true)} 
        onOpenFreeFlights={() => setIsFreeFlightsModalOpen(true)} 
        onOpenClube={() => setIsClubeModalOpen(true)} 
        onOpenBankrollManager={() => setIsBankrollModalOpen(true)} 
        onOpenSubscription={() => setIsSubscriptionModalOpen(true)} 
        onOpenAlerts={() => setIsAlertsModalOpen(true)} 
        onOpenReferral={() => setIsReferralModalOpen(true)} 
        isMuted={isMuted} 
        onToggleMute={() => setIsMuted(!isMuted)}
        onInstallPWA={handleInstallApp}
        showInstallButton={isInstallable}
        isAdminUser={isAdminUser}
        onOpenPortal={() => {
          const act = () => { setIsInInitialLanding(true); setIsMenuOpen(false); };
          if (activeCabine) setPendingNavigationAction(() => act);
          else act();
        }}
        onOpenStore={() => {
          const act = () => { setActiveCategory('store'); setIsInInitialLanding(false); setIsMenuOpen(false); };
          if (activeCabine) setPendingNavigationAction(() => act);
          else act();
        }}
        onLogout={() => {
          if (activeCabine) setPendingNavigationAction(() => handleLogout);
          else handleLogout();
        }}
        onSwitchMode={handleSwitchMode}
        onSwitchProfile={handleSwitchProfile}
        currentMode={activeEventId || activeCategory === 'aerofantasy' ? 'aerofantasy' : 'aerogame'}
        activeEventId={activeEventId}
        onOpenCabine={() => { setIsMenuOpen(false); setIsCabineLobbyOpen(true); }}
      />
      
      {/* --- MODAIS DO MODO CABINE (CO-OP) --- */}
      {isCabineLobbyOpen && (
        <CabineLobbyModal
          onClose={() => setIsCabineLobbyOpen(false)}
          userBalance={balance}
          currentUsername={currentUsername}
          onCabineStarted={handleCabineStarted}
          onOpenDeposit={() => {
            setIsCabineLobbyOpen(false);
            setIsWalletModalOpen(true);
          }}
          activeCabine={activeCabine}
          onExitCabine={handleConfirmCloseCabine}
        />
      )}

      {isCabineChatOpen && activeCabine && (
        <CabineChatDrawer
          cabine={activeCabine}
          currentUsername={currentUsername}
          onClose={() => setIsCabineChatOpen(false)}
        />
      )}

      {isCabineCloseModalOpen && activeCabine && (
        <CabineCloseModal
          cabine={activeCabine}
          onClose={() => setIsCabineCloseModalOpen(false)}
          onConfirmClose={handleConfirmCloseCabine}
        />
      )}

      {pendingNavigationAction && activeCabine && (
        <CabineExitConfirmationModal
          cabine={activeCabine}
          onCancel={() => setPendingNavigationAction(null)}
          onConfirm={async () => {
            await handleConfirmCloseCabine();
            if (pendingNavigationAction) {
              pendingNavigationAction();
            }
            setPendingNavigationAction(null);
          }}
        />
      )}
      
      {isNotificationsOpen && (
        <NotificationsModal 
          onClose={() => setIsNotificationsOpen(false)} 
          notifications={appNotifications} 
          onMarkAllRead={handleMarkAllRead} 
          onClearAll={handleClearNotifications} 
          onNotificationClick={handleNotificationClick} 
        />
      )}
      {isMissionsModalOpen && <MissionsModal onClose={() => setIsMissionsModalOpen(false)} missions={missions} onClaim={claimMissionReward} onStart={handleStartMission} onTrack={handleTrackMission} lastDepositTime={userStats.lastDepositTime} isSubscribed={isSubscribed} onOpenDeposit={() => { setIsMissionsModalOpen(false); setIsWalletModalOpen(true); }} onOpenSubscription={() => { setIsMissionsModalOpen(false); setIsBankrollModalOpen(true); }} />}
      {isEventsModalOpen && <EventsModal onClose={() => setIsEventsModalOpen(false)} events={events} onJoinEvent={handleJoinEvent} />}
      {isRankingModalOpen && <RankingsModal onClose={() => setIsRankingModalOpen(false)} />}
      {isAchievementsModalOpen && <AchievementsModal onClose={() => setIsAchievementsModalOpen(false)} achievements={achievements} missions={missions} events={events} tournaments={tournaments} onClaim={handleClaimAchievement} />}
      {isDailyWheelOpen && <DailyWheelModal onClose={() => setIsDailyWheelOpen(false)} onClaimPrize={handleWheelPrize} lastDepositTime={userStats.lastDepositTime} lastSpinTime={userStats.lastSpinTime} onOpenWallet={() => { setIsDailyWheelOpen(false); setIsWalletModalOpen(true); }} prizes={wheelPrizes} />}
      {isFreeFlightsModalOpen && <FreeFlightsModal onClose={() => setIsFreeFlightsModalOpen(false)} freeFlights={userStats.freeFlights} history={freeFlightHistory} />}
      {isClubeModalOpen && <ClubeModal onClose={() => setIsClubeModalOpen(false)} stats={userStats} config={clubeConfig} onJoin={handleJoinClube} />}
      {isBankrollModalOpen && <BankrollManagerModal onClose={() => setIsBankrollModalOpen(false)} isSubscribed={isSubscribed} onSubscribe={(autoRenew) => handleSubscriptionPurchase(autoRenew)} balance={balance} stats={userStats} onUpdatePlan={handleUpdateBankrollPlan} onActivatePlan={handleActivatePlan} onDeletePlan={handleDeletePlan} onResetPlan={handleResetPlan} />}
      {isSubscriptionModalOpen && <SubscriptionModal onClose={() => setIsSubscriptionModalOpen(false)} stats={userStats} balance={balance} onSubscribe={(autoRenew) => handleSubscriptionPurchase(autoRenew)} onToggleAutoRenew={handleToggleAutoRenew} />}
      {isProfileModalOpen && <ProfileModal onClose={() => setIsProfileModalOpen(false)} balance={balance} stats={userStats} transactions={transactions} username={currentUsername} userAvatar={userAvatar} onUpdateAvatar={handleUpdateAvatar} profile={userProfile} onUpdateProfile={handleUpdateProfile} isSubscribed={isSubscribed} onOpenSubscription={() => { setIsProfileModalOpen(false); setIsSubscriptionModalOpen(true); }} onOpenClube={() => { setIsProfileModalOpen(false); setIsClubeModalOpen(true); }} onLogout={handleLogout} onSwitchMode={handleSwitchMode} onSwitchProfile={handleSwitchProfile} />}
      {isWalletModalOpen && <WalletModal onClose={() => setIsWalletModalOpen(false)} onDepositConfirm={handleDepositConfirm} onWithdrawConfirm={handleWithdrawConfirm} balance={balance} userProfile={userProfile} depositConfigs={depositConfigs} userStats={userStats} />}
      {selectedHistory && <FairnessModal history={selectedHistory} onClose={() => setSelectedHistory(null)} />}
      {isFullHistoryOpen && <FullHistoryModal history={history} onClose={() => setIsFullHistoryOpen(false)} />}
      {isAlertsModalOpen && <AlertsModal onClose={() => setIsAlertsModalOpen(false)} config={alertConfig} onSave={setAlertConfig} />}
      {isReferralModalOpen && <ReferralModal onClose={() => setIsReferralModalOpen(false)} referralCode={currentUsername} referrals={referrals} onClaim={handleClaimReferral} />}

      {isIOSInstructionsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0e0f10] w-full max-w-md rounded-3xl border border-white/10 shadow-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e51a31]/10 rounded-full blur-[80px] pointer-events-none" />
            
            <button 
              onClick={() => setIsIOSInstructionsOpen(false)}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 18l12 12"/></svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#e51a31] to-red-600 rounded-2xl flex items-center justify-center font-black italic shadow-[0_0_20px_rgba(229,26,49,0.4)] text-3xl text-white mx-auto mb-3">A</div>
              <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">Aerofantasy no iOS</h3>
              <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mt-1">Siga os passos fáceis para instalar</p>
            </div>

            <div className="space-y-4 font-sans mb-6">
              
              <div className="flex gap-4 items-start bg-white/5 rounded-2xl p-3 border border-white/5">
                <div className="w-7 h-7 rounded-xl bg-[#e51a31] flex flex-shrink-0 items-center justify-center font-bold text-xs text-white">1</div>
                <div className="text-left w-full">
                  <p className="text-xs font-black uppercase text-white tracking-wide">Abra no Navegador Safari</p>
                  <p className="text-[11px] text-white/60 font-semibold mt-0.5">Certifique-se de que está usando o Safari oficial no seu iPhone.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white/5 rounded-2xl p-3 border border-white/5">
                <div className="w-7 h-7 rounded-xl bg-[#e51a31] flex flex-shrink-0 items-center justify-center font-bold text-xs text-white">2</div>
                <div className="text-left w-full">
                  <p className="text-xs font-black uppercase text-white tracking-wide flex items-center gap-1">
                    Toque no botão de Compartilhar
                    <span className="inline-flex p-1 bg-white/10 rounded-md text-white">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    </span>
                  </p>
                  <p className="text-[11px] text-white/60 font-semibold mt-0.5">Clique no ícone de compartilhamento na barra inferior do Safari.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white/5 rounded-2xl p-3 border border-white/5">
                <div className="w-7 h-7 rounded-xl bg-[#e51a31] flex flex-shrink-0 items-center justify-center font-bold text-xs text-white">3</div>
                <div className="text-left w-full">
                  <p className="text-xs font-black uppercase text-white tracking-wide flex items-center gap-1">
                    Adicionar à Tela de Início
                    <span className="inline-flex p-1 bg-white/10 rounded-md text-white">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </span>
                  </p>
                  <p className="text-[11px] text-white/60 font-semibold mt-0.5">Role a lista para baixo e toque em "Adicionar à Tela de Início" para finalizar!</p>
                </div>
              </div>

            </div>

            <button 
              onClick={() => setIsIOSInstructionsOpen(false)}
              className="w-full bg-[#1b1c1d] hover:bg-white/10 border border-white/10 py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg"
            >
              Fechar Instruções
            </button>
          </div>
        </div>
      )}

      {!isInInitialLanding && (
        <>
          <div className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[94%] max-w-[390px] sm:max-w-[440px] z-[120] pointer-events-none flex flex-col items-center gap-2.5">
            {cashoutNotifications.map((notification) => {
              const formattedAmount = notification.isAerocoin || notification.amount >= 100000 
                ? `${Math.round(notification.amount)} pts` 
                : `R$ ${notification.amount.toFixed(2).replace('.', ',')}`;
              
              const formattedProfit = notification.isAerocoin || notification.profit >= 100000
                ? `+${Math.round(notification.profit)} pts`
                : `+R$ ${notification.profit.toFixed(2).replace('.', ',')}`;

              const formattedBet = notification.isAerocoin 
                ? `${Math.round(notification.betAmount)} pts` 
                : `R$ ${notification.betAmount.toFixed(2).replace('.', ',')}`;

              const altitudeAtCashout = Math.round(notification.multiplier * 1000);

              return (
                <div 
                  key={notification.id} 
                  className="animate-in zoom-in-95 slide-in-from-top-4 fade-in duration-300 w-full pointer-events-auto relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#050c18]/95 via-[#02060e]/95 to-[#000000]/98 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_12px_45px_rgba(6,182,212,0.35)] border-l-4 border-l-cyan-400 p-3 sm:p-3.5 flex flex-col gap-2"
                >
                  {/* Glowing Top Shimmer Line */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

                  {/* Top Row: Icon, Status Tag & Multiplier */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 flex items-center justify-center text-black shadow-[0_0_15px_rgba(6,182,212,0.8)] shrink-0 font-black">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 leading-tight font-mono">
                            SAQUE HOMOLOGADO!
                          </span>
                        </div>
                        <span className="text-[8px] sm:text-[9px] text-white/60 font-bold uppercase tracking-wider leading-none font-mono">
                          {notification.slot ? `Painel ${notification.slot}` : 'Aposta Realizada'} • Altitude: {altitudeAtCashout >= 100000 ? `${(altitudeAtCashout/1000).toFixed(1)} km` : `${altitudeAtCashout.toLocaleString('pt-BR')} m`}
                        </span>
                      </div>
                    </div>

                    {/* Multiplier Badge & Close */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-950/60 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
                        <span className="text-[8px] sm:text-[9px] font-bold text-cyan-400/80 uppercase font-mono">EM</span>
                        <span className="text-sm sm:text-base font-black italic text-cyan-300 font-mono tabular-nums leading-none">
                          {notification.multiplier.toFixed(2)}x
                        </span>
                      </div>
                      <button 
                        onClick={() => setCashoutNotifications(prev => prev.filter(n => n.id !== notification.id))}
                        className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        title="Fechar"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Center Row: Big Cashout Value + Profit Pill */}
                  <div className="flex items-baseline justify-between gap-2 pt-0.5 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[7.5px] sm:text-[8px] font-bold text-cyan-400/70 uppercase tracking-widest font-mono">VALOR RECEBIDO</span>
                      <span className="text-2xl sm:text-3xl font-black italic tracking-tight text-white font-mono leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] tabular-nums">
                        {formattedAmount}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[7.5px] sm:text-[8px] font-bold text-emerald-400/80 uppercase tracking-widest font-mono">LUCRO LÍQUIDO</span>
                      <div className="flex items-center gap-1 bg-emerald-950/60 border border-emerald-400/60 px-2 py-0.5 rounded-lg mt-0.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                        <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono tabular-nums leading-none">
                          {formattedProfit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Micro Breakdown Row */}
                  <div className="flex items-center justify-between text-[8px] sm:text-[8.5px] text-white/50 pt-1 border-t border-white/5 font-mono">
                    <span>Aposta Inicial: <strong className="text-white/80">{formattedBet}</strong></span>
                    <span className="text-emerald-400 font-bold">✓ Saldo Atualizado</span>
                  </div>
                </div>
              );
            })}
            {depositNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className="animate-in zoom-in-95 slide-in-from-top-4 fade-in duration-300 w-full pointer-events-auto relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#04121a]/95 via-[#020a10]/95 to-[#000000]/98 backdrop-blur-2xl border border-cyan-500/50 shadow-[0_12px_45px_rgba(6,182,212,0.35)] border-l-4 border-l-emerald-400 p-3 sm:p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-black shadow-[0_0_12px_rgba(16,185,129,0.7)] shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 font-mono">
                      DEPÓSITO APROVADO
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-white/50 font-bold uppercase tracking-wider font-mono">
                      PIX Instantâneo
                    </span>
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-black italic text-emerald-400 font-mono tabular-nums leading-none drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  +R$ {notification.amount.toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>

          <TopBanner 
            balance={balance} 
            aerocoinBalance={aerocoinBalance} 
            activeEventId={activeEventId} 
            activeLeagueType={activeLeagueType} 
            fantasyFlightsLeft={fantasyFlightsLeft} 
            onExitEvent={handleExitEventMode} 
            isMuted={isMuted} 
            onToggleMute={() => setIsMuted(!isMuted)} 
            nextRoundHash={nextRoundServerSeedHash} 
            onShowFairness={handleShowFairness} 
            onWalletClick={() => setIsWalletModalOpen(true)} 
            onMenuClick={() => setIsMenuOpen(true)} 
            onProfileClick={() => setIsProfileModalOpen(true)} 
            onNotificationsClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
            unreadNotifications={appNotifications.filter(n => !n.read).length} 
            userAvatar={userAvatar} 
            onOpenPortal={() => {
              const act = () => setIsInInitialLanding(true);
              if (activeCabine) setPendingNavigationAction(() => act);
              else act();
            }} 
            onSwitchMode={handleSwitchMode}
            currentMode={activeEventId || activeCategory === 'aerofantasy' ? 'aerofantasy' : 'aerogame'}
            onLogout={handleLogout}
            onSwitchProfile={handleSwitchProfile}
            username={currentUsername}
            activeCabine={activeCabine}
            onOpenCabineLobby={() => setIsCabineLobbyOpen(true)}
            onOpenCabineChat={() => setIsCabineChatOpen(true)}
          />

          {/* O Banner Rotativo aparece no modo AeroGame e no Portal Inicial, ficando oculto apenas no modo AeroFantasy e no Modo Cabine */}
          {(!activeEventId && activeCategory !== 'aerofantasy' && !activeCabine) && (
            <div className="px-1 md:px-2 py-1">
              <BannerCarousel 
                banners={banners}
                onOpenWallet={() => setIsWalletModalOpen(true)}
                onOpenTournaments={() => { setActiveCategory('aerofantasy'); setIsInInitialLanding(false); }}
                onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
              />
            </div>
          )}

          {(!activeEventId && activeCategory !== 'aerofantasy') && isInstallable && showInstallBanner && (
            <div className="mx-1 md:mx-2 mb-2 p-3 md:p-4 rounded-2xl bg-gradient-to-r from-[#e51a31]/20 via-[#101010]/95 to-[#e51a31]/10 border border-[#e51a31]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_4px_25px_rgba(229,26,49,0.15)] animate-in slide-in-from-top-4 duration-300 relative overflow-hidden group shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#e51a31]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e51a31] to-red-600 flex flex-shrink-0 items-center justify-center font-black italic shadow-[0_0_15px_rgba(229,26,49,0.5)] text-white text-lg animate-bounce">
                  A
                </div>
                <div className="text-left font-sans">
                  <h3 className="text-xs font-black italic uppercase tracking-tight text-white flex flex-wrap items-center gap-1.5 leading-none">
                    Aerofantasy como Aplicativo!
                    <span className="bg-[#e51a31] text-white text-[8px] font-black italic px-1.5 py-0.5 rounded uppercase animate-pulse shrink-0">MELHOR JOGABILIDADE</span>
                  </h3>
                  <p className="text-[10px] text-white/70 font-bold mt-1.5">
                    Instale agora para ter acesso instantâneo na tela inicial, desempenho máximo e jogar com 1-toque!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 relative z-10 w-full sm:w-auto shrink-0 justify-end">
                <button 
                  onClick={handleInstallApp}
                  className="px-4 py-2 bg-[#e51a31] hover:bg-[#ff1f3a] text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(229,26,49,0.4)] active:scale-95 duration-100 cursor-pointer"
                >
                  Instalar App
                </button>
                <button 
                  onClick={() => setShowInstallBanner(false)}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-100 cursor-pointer"
                >
                  Mais Tarde
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-1">
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={handleLoginSuccess} />}
        
        {isInInitialLanding ? (
          <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-2 py-3 animate-in fade-in duration-300">
            <ModeSelectionPortal
              onSelectMode={(mode) => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                setIsInInitialLanding(false);
                if (mode === 'aerobet' || mode === 'aerogame') {
                  handleExitEventMode();
                } else {
                  setActiveCategory('aerofantasy');
                }
              }}
              onSelectCabineMode={() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                setIsInInitialLanding(false);
                handleExitEventMode();
                setIsCabineLobbyOpen(true);
              }}
              onOpenStore={() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                setIsInInitialLanding(false);
                setActiveCategory('store');
              }}
              onOpenHangar={() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                setIsInInitialLanding(false);
                setActiveCategory('hangar');
              }}
            />
          </div>
        ) : (
          <>
            <div className="order-1 lg:order-1 flex-1 flex flex-col gap-1 min-w-0">
              {/* AEROgame View - Always Mounted to maintain seamless online flight chart in background! */}
              <div 
                className="flex-1 flex flex-col gap-1 min-w-0" 
                style={{ display: activeCategory === 'aerobet' ? 'flex' : 'none' }}
              >
                {/* HUD DA CABINE ATIVA: POSICIONADO NO TOPO, ACIMA DO GRÁFICO */}
                {activeCabine && (
                  <CabineActiveBanner
                    cabine={activeCabine}
                    onOpenChat={() => setIsCabineChatOpen(true)}
                    onCloseCabine={() => setIsCabineCloseModalOpen(true)}
                    unreadCount={0}
                    isRadioOn={isRadioOn}
                    onToggleRadio={handleToggleRadio}
                    isMicMuted={isMicMuted}
                    onToggleMicMute={handleToggleMicMute}
                    isTalking={isTalking}
                    isPartnerTalking={isPartnerTalking}
                    onStartTalking={handleStartTalking}
                    onStopTalking={handleStopTalking}
                    radioVolume={radioVolume}
                    isHandsFree={isHandsFree}
                    onToggleHandsFree={handleToggleHandsFree}
                  />
                )}

                <div className="h-[440px] sm:h-[500px] md:h-[550px] lg:h-auto lg:flex-1 flex-shrink-0 flex flex-col bg-[#141517] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
                    {activeEventId && (
                      <div className="bg-gradient-to-r from-[#030d1e]/95 via-[#071d3a]/95 to-[#030d1e]/95 text-white px-3 sm:px-4 py-1 flex flex-wrap items-center justify-between gap-1.5 z-20 shadow-md border-b border-cyan-400/30 backdrop-blur-md animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-wrap">
                          <div className="flex items-center gap-1 bg-cyan-950/70 border border-cyan-400/40 px-2 py-0.5 rounded-lg text-cyan-300 font-mono text-[10px] font-black shrink-0 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span>SALA #{activeEventId.replace('sala-', '')}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 bg-amber-400/15 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0">
                            <span>🏆 {myFantasyRank}º LUGAR</span>
                            <span className="text-white/30">•</span>
                            <span className="font-mono text-amber-200">{userFantasyScore.toFixed(1)} pts</span>
                          </div>

                          <div className="flex items-center gap-1 bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0">
                            <span>{myFantasyRank === 1 ? '👑 LÍDER' : `🎯 +${pointsToClimb.toFixed(1)} pts p/ ${myFantasyRank - 1}º`}</span>
                          </div>

                          <div className="text-[10px] text-sky-200/80 font-medium shrink-0 hidden md:inline-flex items-center gap-1">
                            <span>✈️ Cota:</span>
                            <strong className="text-cyan-300 font-mono font-bold">{fantasyFlightsLeft ?? 100}/100</strong>
                            {userFantasyFlightsUsed > 0 && <span className="text-white/40">({userFantasyFlightsUsed} realizados)</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setFantasyTargetView('room');
                              setActiveCategory('aerofantasy');
                              window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                            }}
                            className="text-[10px] font-black uppercase bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white px-2 py-0.5 rounded-lg border border-cyan-400/40 transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(0,180,216,0.3)] active:scale-95"
                          >
                            <span>📊 Ver Sala & Ranking</span>
                          </button>
                          <button
                            onClick={() => {
                              setFantasyTargetView('hall');
                              setActiveCategory('aerofantasy');
                              window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                            }}
                            className="text-[10px] font-bold uppercase bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-2 py-0.5 rounded-lg border border-white/10 transition-all cursor-pointer active:scale-95"
                          >
                            <span>🏛️ Hall</span>
                          </button>
                          <button
                            onClick={handleExitEventMode}
                            className="text-[10px] font-black uppercase bg-red-600/20 hover:bg-red-600/40 text-red-300 hover:text-white px-2 py-0.5 rounded-lg border border-red-500/30 transition-all cursor-pointer active:scale-95"
                            title="Sair da Sala de Competição"
                          >
                            ✕ Sair
                          </button>
                        </div>
                      </div>
                    )}
                    <HistoryBar history={history} onShowFullHistory={() => setIsFullHistoryOpen(true)} />
                   <div className="flex-1 relative w-full h-full min-h-[340px]">
                      <GameCanvas status={status} multiplier={multiplier} countdown={countdown} stats={effectiveRoundStats} history={history} isSubscribed={isSubscribed} onOpenUpgrade={() => setIsBankrollModalOpen(true)} userStats={userStats} trackedMission={trackedMission} activeSkin={activeSkin} canvasBgConfig={canvasBgConfig} activeCanvasBgImage={activeCanvasBgImage} activeCanvasBgVideo={activeCanvasBgVideo} />
                   </div>
                </div>
                <div className="order-2 relative flex-shrink-0 pt-2 pb-1 mb-2 lg:mb-0">
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 transition-all duration-500 items-stretch`}>
                    {!activeCabine ? (
                      <>
                        <div className="min-h-[160px] sm:min-h-[175px]">
                          <BetControl mode={betMode1} setMode={setBetMode1} status={status} currentMultiplier={multiplier} balance={currentAvailableBalance} freeFlights={userStats.freeFlights} freeFlightConfigs={freeFlightConfigs} activeEventId={activeEventId} activeLeagueType={activeLeagueType} fantasyFlightsLeft={fantasyFlightsLeft} aerocoinBalance={aerocoinBalance} onPlaceBet={(amt, useFreeBet) => handlePlaceBet(1, amt, useFreeBet)} onCancelBet={() => handleCancelBet(1)} onCashout={(val) => handleCashout(1, val)} activeBet={bet1} nextRoundBet={nextRoundBet1 ? nextRoundBet1.amount : null} isSubscribed={isSubscribed} bankrollPlan={activePlanSlot1} onOpenManager={() => setIsBankrollModalOpen(true)} history={history} />
                        </div>
                        <div className="min-h-[160px] sm:min-h-[175px]">
                          <BetControl mode={betMode2} setMode={setBetMode2} status={status} currentMultiplier={multiplier} balance={currentAvailableBalance} freeFlights={userStats.freeFlights} freeFlightConfigs={freeFlightConfigs} activeEventId={activeEventId} activeLeagueType={activeLeagueType} fantasyFlightsLeft={fantasyFlightsLeft} aerocoinBalance={aerocoinBalance} onPlaceBet={(amt, useFreeBet) => handlePlaceBet(2, amt, useFreeBet)} onCancelBet={() => handleCancelBet(2)} onCashout={(val) => handleCashout(2, val)} activeBet={bet2} nextRoundBet={nextRoundBet2 ? nextRoundBet2.amount : null} isSubscribed={isSubscribed} bankrollPlan={activePlanSlot2} onOpenManager={() => setIsBankrollModalOpen(true)} history={history} />
                        </div>
                      </>
                    ) : activeCabine.userRole === 'pilot' ? (
                      <>
                        {/* Slot 1: Piloto (Você opera exclusivamente este slot) */}
                        <div className="min-h-[160px] sm:min-h-[175px] flex flex-col justify-between select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                          <div className="flex items-center justify-between px-3 py-1.5 mb-1 rounded-xl bg-[#1f2937] border border-[#374151] text-xs font-bold text-slate-200 shrink-0">
                            <span className="flex items-center gap-1.5">
                              <span>👨‍✈️</span>
                              <span>Slot 1 • Piloto (Você)</span>
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">
                              Banca: R$ {activeCabine.currentBalance.toFixed(2)}
                            </span>
                          </div>

                          {/* Faixa de Rádio Intercom do Piloto */}
                          <div className="flex items-center justify-between px-3 py-1.5 mb-1.5 rounded-xl bg-[#111827] border border-[#1f2937] text-xs font-bold text-slate-200 shrink-0 gap-2">
                            <div className="flex flex-col text-left">
                              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">🎙️ Intercom Cabine</span>
                              <span className="text-[9px] font-semibold text-slate-400">
                                {isRadioOn ? "Aperte e segure para falar por voz" : "O rádio está desligado"}
                              </span>
                            </div>
                            
                            {!isRadioOn ? (
                              <button
                                type="button"
                                onClick={handleToggleRadio}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors border border-emerald-500"
                              >
                                Ligar Rádio
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {/* Botão PTT (Push-To-Talk) */}
                                <button
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); handleStartTalking(); }}
                                  onMouseUp={(e) => { e.preventDefault(); handleStopTalking(); }}
                                  onMouseLeave={(e) => { e.preventDefault(); handleStopTalking(); }}
                                  onTouchStart={(e) => { e.preventDefault(); handleStartTalking(); }}
                                  onTouchEnd={(e) => { e.preventDefault(); handleStopTalking(); }}
                                  onContextMenu={(e) => e.preventDefault()}
                                  style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
                                  disabled={isHandsFree}
                                  className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest select-none transition-all border ${
                                    isHandsFree 
                                      ? 'bg-red-600 border-red-500 text-white animate-pulse opacity-80 cursor-not-allowed'
                                      : isTalking
                                        ? 'bg-red-600 border-red-500 text-white animate-pulse cursor-pointer'
                                        : isPartnerTalking
                                          ? 'bg-sky-600 border-sky-500 text-white cursor-pointer'
                                          : 'bg-[#1f2937] border-[#374151] text-slate-200 hover:bg-slate-700 cursor-pointer'
                                  }`}
                                  title={isHandsFree ? "Automação Hands-Free Ativa" : "Mantenha pressionado para falar"}
                                >
                                  {isHandsFree ? '🎙️ TRANSMITINDO' : isTalking ? '🎙️ FALANDO...' : isPartnerTalking ? '🎧 OUVINDO...' : '🎙️ PRESS PTT'}
                                </button>

                                {/* Botão Automação (Hands-Free) */}
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); handleToggleHandsFree(); }}
                                  onContextMenu={(e) => e.preventDefault()}
                                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                                    isHandsFree
                                      ? 'bg-red-600 border-red-500 text-white animate-pulse'
                                      : 'bg-[#1f2937] border-[#374151] text-slate-300 hover:bg-slate-700'
                                  }`}
                                  title="Automação do Rádio: Mãos Livres (VOX)"
                                >
                                  {isHandsFree ? 'VOX: ON' : 'VOX: OFF'}
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <BetControl mode={betMode1} setMode={setBetMode1} status={status} currentMultiplier={multiplier} balance={currentAvailableBalance} freeFlights={0} freeFlightConfigs={freeFlightConfigs} activeEventId={null} activeLeagueType={null} fantasyFlightsLeft={null} aerocoinBalance={0} onPlaceBet={(amt, useFreeBet) => handlePlaceBet(1, amt, false)} onCancelBet={() => handleCancelBet(1)} onCashout={(val) => handleCashout(1, val)} activeBet={bet1} nextRoundBet={nextRoundBet1 ? nextRoundBet1.amount : null} isSubscribed={isSubscribed} bankrollPlan={activePlanSlot1} onOpenManager={() => setIsBankrollModalOpen(true)} history={history} />
                          </div>
                        </div>
                        {/* Slot 2: Copiloto (Parceiro de Cabine) */}
                        <div className="min-h-[160px] sm:min-h-[175px]">
                          <CabinePartnerSlot 
                            cabine={activeCabine}
                            status={status}
                            multiplier={multiplier}
                            partnerBet={simulatedPartnerBet}
                            onOpenChat={() => setIsCabineChatOpen(true)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Slot 1: Piloto (Parceiro de Cabine) */}
                        <div className="min-h-[160px] sm:min-h-[175px]">
                          <CabinePartnerSlot 
                            cabine={activeCabine}
                            status={status}
                            multiplier={multiplier}
                            partnerBet={simulatedPartnerBet}
                            onOpenChat={() => setIsCabineChatOpen(true)}
                          />
                        </div>
                        {/* Slot 2: Copiloto (Você opera exclusivamente este slot) */}
                        <div className="min-h-[160px] sm:min-h-[175px] flex flex-col justify-between select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                          <div className="flex items-center justify-between px-3 py-1.5 mb-1 rounded-xl bg-[#1f2937] border border-[#374151] text-xs font-bold text-slate-200 shrink-0">
                            <span className="flex items-center gap-1.5">
                              <span>👨‍✈️</span>
                              <span>Slot 2 • Copiloto (Você)</span>
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">
                              Banca: R$ {activeCabine.currentBalance.toFixed(2)}
                            </span>
                          </div>

                          {/* Faixa de Rádio Intercom do Copiloto */}
                          <div className="flex items-center justify-between px-3 py-1.5 mb-1.5 rounded-xl bg-[#111827] border border-[#1f2937] text-xs font-bold text-slate-200 shrink-0 gap-2">
                            <div className="flex flex-col text-left">
                              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">🎙️ Intercom Cabine</span>
                              <span className="text-[9px] font-semibold text-slate-400">
                                {isRadioOn ? "Aperte e segure para falar por voz" : "O rádio está desligado"}
                              </span>
                            </div>
                            
                            {!isRadioOn ? (
                              <button
                                type="button"
                                onClick={handleToggleRadio}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors border border-emerald-500"
                              >
                                Ligar Rádio
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {/* Botão PTT (Push-To-Talk) */}
                                <button
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); handleStartTalking(); }}
                                  onMouseUp={(e) => { e.preventDefault(); handleStopTalking(); }}
                                  onMouseLeave={(e) => { e.preventDefault(); handleStopTalking(); }}
                                  onTouchStart={(e) => { e.preventDefault(); handleStartTalking(); }}
                                  onTouchEnd={(e) => { e.preventDefault(); handleStopTalking(); }}
                                  onContextMenu={(e) => e.preventDefault()}
                                  style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
                                  disabled={isHandsFree}
                                  className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest select-none transition-all border ${
                                    isHandsFree 
                                      ? 'bg-red-600 border-red-500 text-white animate-pulse opacity-80 cursor-not-allowed'
                                      : isTalking
                                        ? 'bg-red-600 border-red-500 text-white animate-pulse cursor-pointer'
                                        : isPartnerTalking
                                          ? 'bg-sky-600 border-sky-500 text-white cursor-pointer'
                                          : 'bg-[#1f2937] border-[#374151] text-slate-200 hover:bg-slate-700 cursor-pointer'
                                  }`}
                                  title={isHandsFree ? "Automação Hands-Free Ativa" : "Mantenha pressionado para falar"}
                                >
                                  {isHandsFree ? '🎙️ TRANSMITINDO' : isTalking ? '🎙️ FALANDO...' : isPartnerTalking ? '🎧 OUVINDO...' : '🎙️ PRESS PTT'}
                                </button>

                                {/* Botão Automação (Hands-Free) */}
                                <button
                                  type="button"
                                  onClick={handleToggleHandsFree}
                                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                                    isHandsFree
                                      ? 'bg-red-600 border-red-500 text-white animate-pulse'
                                      : 'bg-[#1f2937] border-[#374151] text-slate-300 hover:bg-slate-700'
                                  }`}
                                  title="Automação do Rádio: Mãos Livres (VOX)"
                                >
                                  {isHandsFree ? 'VOX: ON' : 'VOX: OFF'}
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <BetControl mode={betMode2} setMode={setBetMode2} status={status} currentMultiplier={multiplier} balance={currentAvailableBalance} freeFlights={0} freeFlightConfigs={freeFlightConfigs} activeEventId={null} activeLeagueType={null} fantasyFlightsLeft={null} aerocoinBalance={0} onPlaceBet={(amt, useFreeBet) => handlePlaceBet(2, amt, false)} onCancelBet={() => handleCancelBet(2)} onCashout={(val) => handleCashout(2, val)} activeBet={bet2} nextRoundBet={nextRoundBet2 ? nextRoundBet2.amount : null} isSubscribed={isSubscribed} bankrollPlan={activePlanSlot2} onOpenManager={() => setIsBankrollModalOpen(true)} history={history} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Other Views - Rendered conditionally */}
              {activeCategory === 'aerofantasy' ? (
                <div className="flex-1 flex flex-col bg-[#030811] rounded-2xl border border-[#1b3658] overflow-hidden shadow-2xl relative">
                  <AeroFantasyHub 
                    onSelectMode={(mode) => {
                      if (mode === 'aerobet' || mode === 'aerogame') {
                        setActiveCategory('aerobet');
                      } else {
                        setActiveCategory(mode as any);
                      }
                    }}
                    onOpenPortal={() => setIsInInitialLanding(true)}
                    activeEventId={activeEventId}
                    fantasyFlightsLeft={fantasyFlightsLeft}
                    userFantasyScore={userFantasyScore}
                    userFantasyFlightsUsed={userFantasyFlightsUsed}
                    userFantasyMaxMult={userFantasyMaxMult}
                    myFantasyRank={myFantasyRank}
                    pointsToClimb={pointsToClimb}
                    aheadCompetitorName={aheadCompetitor?.name}
                    targetView={fantasyTargetView}
                    onOpenDeposit={() => setIsWalletModalOpen(true)}
                    onJoinCompetition={(roomId, cost, flights) => {
                      handleJoinEvent(roomId, cost);
                      setUserFantasyScore(0);
                      setUserFantasyFlightsUsed(0);
                      setUserFantasyMaxMult(0);
                      setFantasyFlightsLeft(flights || 100);
                      setActiveLeagueType('multiplier');
                      handleAddNotification("AeroFantasy Ativado!", `Você entrou na sala com ${flights || 100} voos competitivos!`, "reward");
                    }}
                    onExitCompetition={handleExitEventMode}
                    userBalance={balance}
                    currentMultiplier={multiplier}
                    gameStatus={status}
                    currentUsername={currentUsername}
                  />
                </div>
              ) : activeCategory === 'store' ? (
                <div className="flex-1 flex flex-col bg-[#1b1c1d] rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
                  <StoreModal
                    onClose={() => setActiveCategory('aerobet')}
                    balance={balance}
                    onUpdateBalance={setBalance}
                    aerocoinBalance={aerocoinBalance}
                    onUpdateAerocoinBalance={setAerocoinBalance}
                    freeFlights={userStats.freeFlights}
                    onUpdateFreeFlights={(newFlights) => {
                      const flightsVal = typeof newFlights === 'function' ? newFlights(userStats.freeFlights) : newFlights;
                      setUserStats(prev => ({ ...prev, freeFlights: flightsVal }));
                    }}
                    activeSkin={selectedSkin}
                    onChangeSkin={setSelectedSkin}
                    unlockedSkins={unlockedSkins}
                    onUnlockSkin={(skinId) => setUnlockedSkins(prev => [...prev, skinId])}
                    handleAddNotification={handleAddNotification}
                    isInline={true}
                  />
                </div>
              ) : activeCategory === 'hangar' ? (
                <div className="flex-1 flex flex-col bg-[#1b1c1d] rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
                  <HangarView
                    unlockedSkins={unlockedSkins}
                    activeSkin={selectedSkin}
                    onChangeSkin={setSelectedSkin}
                    onNavigateToStore={() => setActiveCategory('store')}
                    onClose={() => setActiveCategory('aerobet')}
                  />
                </div>
              ) : null}
            </div>
            {activeCategory === 'aerobet' && (
              <div className="order-3 lg:order-2 lg:w-64 xl:w-72 flex-shrink-0 h-[400px] lg:h-full">
                  <Sidebar 
                    allBets={liveBets} 
                    gameStatus={status} 
                    currentMultiplier={multiplier} 
                    stats={effectiveRoundStats} 
                    chatMessages={chatMessages} 
                    onSendMessage={handleSendMessage} 
                    myHistory={myHistory}
                    activeCabine={activeCabine}
                    cabineMessages={cabineMessages}
                    onSendCabineMessage={handleSendCabineMessage}
                    currentUsername={currentUsername}
                    isRadioOn={isRadioOn}
                    onToggleRadio={handleToggleRadio}
                    isMicMuted={isMicMuted}
                    onToggleMicMute={handleToggleMicMute}
                    isTalking={isTalking}
                    isPartnerTalking={isPartnerTalking}
                    onStartTalking={handleStartTalking}
                    onStopTalking={handleStopTalking}
                    radioVolume={radioVolume}
                  />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
