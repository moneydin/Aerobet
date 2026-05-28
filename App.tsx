
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
  throw new Error(JSON.stringify(errInfo));
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
  { id: 1, username: 'Jogador_Elite', balance: 3000.00, role: 'user', status: 'active', email: 'jogador@aerobet.com', phone: '(21) 99876-5432', cpf: '123.456.789-00', fullName: 'José da Silva' },
  { id: 2, username: 'MestreDoAero', balance: 15420.50, role: 'vip', status: 'active', email: 'mestre@trader.com', phone: '(11) 98888-7777', cpf: '987.654.321-99', fullName: 'Carlos Trader Pro' },
  { id: 3, username: 'ReiDoVoo', balance: 12100.00, role: 'user', status: 'active', email: 'rei@aerobet.com', phone: '(21) 97777-6666', cpf: '456.789.123-44', fullName: 'Roberto Silva' },
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

const DEFAULT_PIX_KEY = "00020126580014br.gov.bcb.pix013625503d0e-c00c-4f88-8ce7-f8d0653545d852040000530398654040.015802BR5922AERObetPagamentos6011RioDeJaneiro62290525WPY2d48fb50102140d493d86c63049F86";
const DEPOSIT_AMOUNTS = [20, 50, 100, 200, 500, 1000];
const INITIAL_REFERRALS: Referral[] = [
    { id: 'ref1', username: 'Amigo_Teste_1', registeredAt: Date.now() - 86400000, depositedAmount: 0, flightsCount: 0, status: 'pending' },
    { id: 'ref2', username: 'Amigo_Teste_2', registeredAt: Date.now() - 172800000, depositedAmount: 50, flightsCount: 15, status: 'qualified' },
];

const INITIAL_BANNERS: Banner[] = [
  {
    id: 'b1',
    title: "BEM-VINDO AO AERObet",
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
  const [rtp, setRtp] = usePersistentState<number>('aerobet_rtp', 97); 
  const [banners, setBanners] = usePersistentState<Banner[]>('aerobet_banners', INITIAL_BANNERS);
  const [freeFlightConfigs, setFreeFlightConfigs] = usePersistentState<FreeFlightConfig[]>('aerobet_ff_configs', INITIAL_FREE_FLIGHT_CONFIGS);
  const [clubeConfig, setClubeConfig] = usePersistentState<ClubeConfig>('aerobet_clube_config', INITIAL_CLUBE_CONFIG);
  const [freeFlightHistory, setFreeFlightHistory] = usePersistentState<FreeFlightTransaction[]>('aerobet_ff_history', []);
  const [claimedAchievements, setClaimedAchievements] = usePersistentState<string[]>('aerobet_claimed_achievements', []);
  const [houseBankroll, setHouseBankroll] = usePersistentState<number>('aerobet_houseBankroll', 15420000.00); 
  const [revenueStats, setRevenueStats] = usePersistentState<{ subscriptions: number; missions: number }>('aerobet_revenue', { subscriptions: 0, missions: 0 });
  
  const { status, multiplier, countdown, nextRoundServerSeedHash, forceCrashNow, setNextRoundResult, updateRtp, requestCashout } = useAviator(rtp);
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

  // --- OTHER LOCAL STATE ---
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeLeagueType, setActiveLeagueType] = useState<AeroFantasyLeagueType | null>(null);
  const [aerocoinBalance, setAerocoinBalance] = useState<number>(0);
  const [fantasyFlightsLeft, setFantasyFlightsLeft] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUsername, setCurrentUsername] = usePersistentState<string>('aerobet_username', "Visitante");
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
      handleAddNotification("App Instalado!", "Muito obrigado por instalar o aplicativo AeroFLA!", "success");
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
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([{ id: 'n1', title: 'Bem-vindo ao AERObet!', message: 'Complete missões diárias para ganhar voos grátis.', type: 'system', timestamp: Date.now(), read: false }]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [trackedMissionId, setTrackedMissionId] = useState<string | null>(null);
  const [usersDb, setUsersDb] = useState(MOCK_USERS_INITIAL);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]); 
  const [isUserBusy, setIsUserBusy] = useState(false);
  const [cashoutNotifications, setCashoutNotifications] = useState<{id: string, amount: number}[]>([]);
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
      setShowLanding(false); // Esconde a landing
      setShowAuthModal(false);
      handleAddNotification("Login", `Bem-vindo de volta, ${userName}!`, "success");
      
      const guestRaw = localStorage.getItem('guest_user');
      if (guestRaw && !user) {
          setUser(JSON.parse(guestRaw));
          const savedGuestBal = localStorage.getItem('guest_balance');
          setBalance(savedGuestBal ? parseFloat(savedGuestBal) : 1000.00);
      }
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
      try {
        await updateDoc(doc(db, 'users', userId), { balance: newBalance });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
      }
      setUsersDb(prev => prev.map(u => u.uid === userId ? { ...u, balance: newBalance } : u));
  };
  const handleAdminToggleBan = async (userId: string) => {
      const user = usersDb.find(u => u.uid === userId);
      if (!user) return;
      const newStatus = user.status === 'active' ? 'banned' : 'active';
      try {
        await updateDoc(doc(db, 'users', userId), { status: newStatus });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
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
      handleAddNotification("Clube Aerobet", "Bem-vindo ao Clube! Comece a voar para ganhar prêmios.", "success");
  };

  const handlePlaceBet = async (slot: 1 | 2, amount: number, useFreeBet: boolean) => {
      if (!user) {
          setShowAuthModal(true);
          return;
      }
      
      let currentAvailableBalance = balance;
      if (!useFreeBet && !activeEventId) {
          if (slot !== 1 && nextRoundBet1 && !nextRoundBet1.isFreeFlight) currentAvailableBalance -= nextRoundBet1.amount;
          if (slot !== 2 && nextRoundBet2 && !nextRoundBet2.isFreeFlight) currentAvailableBalance -= nextRoundBet2.amount;
      }

      if (activeEventId) {
          // ... AeroFantasy logic
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
      if (!isGuest) {
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

      // Lógica do Clube Aerobet
      if (userStats.clubeMember && !useFreeBet && !activeEventId && amount >= clubeConfig.minBetAmount) {
          const newCount = userStats.clubeFlightsCount + 1;
          if (newCount >= clubeConfig.targetFlights) {
              setUserStats(prev => ({ 
                  ...prev, 
                  clubeFlightsCount: 0, 
                  freeFlights: prev.freeFlights + clubeConfig.rewardFlights 
              }));
              handleAddNotification("Clube Aerobet", `Parabéns! Você completou o ciclo e ganhou ${clubeConfig.rewardFlights} voos grátis!`, "reward");
              setFreeFlightHistory(prev => [{ id: `ff-${Date.now()}`, type: 'credit', amount: clubeConfig.rewardFlights, source: 'Clube Aerobet', date: Date.now() }, ...prev]);
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
      if (user && !isGuest) {
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
      if (activeEventId) {
          if (activeLeagueType !== 'multiplier') {
              setAerocoinBalance(prev => prev + optimisticPayout);
          }
      } else {
          setBalance(prev => prev + optimisticPayout);
      }
      
      // Expor balão de feedback flutuante instantaneamente
      setCashoutNotifications(prev => [...prev, { id: 'opt-' + Date.now().toString() + Math.random(), amount: optimisticPayout }]);
      setTimeout(() => setCashoutNotifications(prev => prev.slice(1)), 3000);

      try {
        // --- VALIDAÇÃO DE CORRIDA E CRASH AUTORITATIVA NO SERVIDOR (RODA EM PARALELO) ---
        const validation = await requestCashout(slot, clickMult);

        // Se o servidor desautorizou a ação de saque (quando o avião já deu crash no mesmo instante)
        if (!validation.success) {
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

            if (user && bet.firestoreId && !bet.firestoreId.startsWith('temp-') && !isGuest) {
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
        if (user && !isGuest) {
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
        } else if (isGuest) {
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
      handleAddNotification("Modo Real", "Você voltou para o jogo principal.", "info");
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
      if (status === GameStatus.WAITING && lastStatusRef.current !== GameStatus.WAITING) {
          // Reset current round bets when waiting for next round
          setBet1(null);
          setBet2(null);
      } else if (status === GameStatus.FLYING && lastStatusRef.current !== GameStatus.FLYING) {
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
                  
                  // Deduct balance ONLY when round starts
                  if (user && !activeEventId) {
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
  }, [status, nextRoundBet1, nextRoundBet2, currentUsername]);

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

  const currentAvailableBalance = balance - 
      (nextRoundBet1 && !nextRoundBet1.isFreeFlight ? nextRoundBet1.amount : 0) - 
      (nextRoundBet2 && !nextRoundBet2.isFreeFlight ? nextRoundBet2.amount : 0);

  return (
    <div className="min-h-screen lg:h-screen bg-black text-white p-1 md:p-1.5 flex flex-col gap-1 max-w-[1600px] mx-auto overflow-x-hidden lg:overflow-hidden font-sans relative">
      {isNotificationsOpen && <NotificationsModal onClose={() => setIsNotificationsOpen(false)} notifications={appNotifications} onMarkAllRead={handleMarkAllRead} onClearAll={handleClearNotifications} onNotificationClick={handleNotificationClick} />}
      
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onOpenProfile={() => setIsProfileModalOpen(true)} 
        onOpenWallet={() => setIsWalletModalOpen(true)} 
        onOpenMissions={() => setIsMissionsModalOpen(true)} 
        onOpenEvents={() => setIsEventsModalOpen(true)} 
        onOpenTournaments={() => { setIsMenuOpen(false); setActiveCategory('aerofantasy'); }} 
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
      />
      
      {isMissionsModalOpen && <MissionsModal onClose={() => setIsMissionsModalOpen(false)} missions={missions} onClaim={claimMissionReward} onStart={handleStartMission} onTrack={handleTrackMission} lastDepositTime={userStats.lastDepositTime} isSubscribed={isSubscribed} onOpenDeposit={() => { setIsMissionsModalOpen(false); setIsWalletModalOpen(true); }} onOpenSubscription={() => { setIsMissionsModalOpen(false); setIsBankrollModalOpen(true); }} />}
      {isEventsModalOpen && <EventsModal onClose={() => setIsEventsModalOpen(false)} events={events} onJoinEvent={handleJoinEvent} />}
      {isRankingModalOpen && <RankingsModal onClose={() => setIsRankingModalOpen(false)} />}
      {isAchievementsModalOpen && <AchievementsModal onClose={() => setIsAchievementsModalOpen(false)} achievements={achievements} missions={missions} events={events} tournaments={tournaments} onClaim={handleClaimAchievement} />}
      {isDailyWheelOpen && <DailyWheelModal onClose={() => setIsDailyWheelOpen(false)} onClaimPrize={handleWheelPrize} lastDepositTime={userStats.lastDepositTime} lastSpinTime={userStats.lastSpinTime} onOpenWallet={() => { setIsDailyWheelOpen(false); setIsWalletModalOpen(true); }} prizes={wheelPrizes} />}
      {isFreeFlightsModalOpen && <FreeFlightsModal onClose={() => setIsFreeFlightsModalOpen(false)} freeFlights={userStats.freeFlights} history={freeFlightHistory} />}
      {isClubeModalOpen && <ClubeModal onClose={() => setIsClubeModalOpen(false)} stats={userStats} config={clubeConfig} onJoin={handleJoinClube} />}
      {isBankrollModalOpen && <BankrollManagerModal onClose={() => setIsBankrollModalOpen(false)} isSubscribed={isSubscribed} onSubscribe={(autoRenew) => handleSubscriptionPurchase(autoRenew)} balance={balance} stats={userStats} onUpdatePlan={handleUpdateBankrollPlan} onActivatePlan={handleActivatePlan} onDeletePlan={handleDeletePlan} onResetPlan={handleResetPlan} />}
      {isSubscriptionModalOpen && <SubscriptionModal onClose={() => setIsSubscriptionModalOpen(false)} stats={userStats} balance={balance} onSubscribe={(autoRenew) => handleSubscriptionPurchase(autoRenew)} onToggleAutoRenew={handleToggleAutoRenew} />}
      {isProfileModalOpen && <ProfileModal onClose={() => setIsProfileModalOpen(false)} balance={balance} stats={userStats} transactions={transactions} username={currentUsername} userAvatar={userAvatar} onUpdateAvatar={handleUpdateAvatar} profile={userProfile} onUpdateProfile={handleUpdateProfile} isSubscribed={isSubscribed} onOpenSubscription={() => { setIsProfileModalOpen(false); setIsSubscriptionModalOpen(true); }} onOpenClube={() => { setIsProfileModalOpen(false); setIsClubeModalOpen(true); }} />}
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
              <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">AeroFLA no iOS</h3>
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

      <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-sm z-[100] pointer-events-none flex flex-col items-center gap-2">
        {cashoutNotifications.map((notification) => (
          <div key={notification.id} className="animate-cashout-toast bg-black/60 backdrop-blur-lg rounded-xl px-5 py-2.5 border border-[#d97d1b]/50 shadow-[0_0_20px_rgba(217,125,27,0.4)] flex items-center justify-between gap-6 pointer-events-auto min-w-[280px]">
            <div className="flex flex-col"><span className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none mb-1">Você Ganhou</span><span className="text-xl font-black italic text-[#d97d1b] leading-none">{notification.amount >= 1000 ? (notification.amount.toFixed(0) + ' pts') : ('R$ ' + notification.amount.toFixed(2))}</span></div>
          </div>
        ))}
        {depositNotifications.map((notification) => (
          <div key={notification.id} className="animate-cashout-toast bg-black/60 backdrop-blur-lg rounded-xl px-5 py-2.5 border border-[#28a745]/50 shadow-[0_0_20px_rgba(40,167,69,0.4)] flex items-center gap-4 pointer-events-auto">
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Depósito Recebido</span><span className="text-xl font-black italic text-[#28a745]">R$ {notification.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <TopBanner balance={balance} aerocoinBalance={aerocoinBalance} activeEventId={activeEventId} activeLeagueType={activeLeagueType} fantasyFlightsLeft={fantasyFlightsLeft} onExitEvent={handleExitEventMode} isMuted={isMuted} onToggleMute={() => setIsMuted(!isMuted)} nextRoundHash={nextRoundServerSeedHash} onShowFairness={handleShowFairness} onWalletClick={() => setIsWalletModalOpen(true)} onMenuClick={() => setIsMenuOpen(true)} onProfileClick={() => setIsProfileModalOpen(true)} onNotificationsClick={() => setIsNotificationsOpen(!isNotificationsOpen)} unreadNotifications={appNotifications.filter(n => !n.read).length} userAvatar={userAvatar} />

      <div className="px-1 md:px-2 py-1">
        <BannerCarousel 
          banners={banners}
          onOpenWallet={() => setIsWalletModalOpen(true)}
          onOpenTournaments={() => setActiveCategory('aerofantasy')}
          onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
        />
      </div>

      {isInstallable && showInstallBanner && (
        <div className="mx-1 md:mx-2 mb-2 p-3 md:p-4 rounded-2xl bg-gradient-to-r from-[#e51a31]/20 via-[#101010]/95 to-[#e51a31]/10 border border-[#e51a31]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_4px_25px_rgba(229,26,49,0.15)] animate-in slide-in-from-top-4 duration-300 relative overflow-hidden group shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#e51a31]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e51a31] to-red-600 flex flex-shrink-0 items-center justify-center font-black italic shadow-[0_0_15px_rgba(229,26,49,0.5)] text-white text-lg animate-bounce">
              A
            </div>
            <div className="text-left font-sans">
              <h3 className="text-xs font-black italic uppercase tracking-tight text-white flex flex-wrap items-center gap-1.5 leading-none">
                AeroFLA como Aplicativo!
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

      {/* Category Navigation Bar */}
      {!isInInitialLanding && (
        <div className="flex justify-center py-2 bg-black shrink-0 z-20 px-1 md:px-2">
            <div className="bg-[#141516] p-1 rounded-2xl border border-white/5 flex gap-1 w-full max-w-xl shadow-2xl relative">
                <button 
                    disabled={isUserBusy} 
                    onClick={() => {
                        setActiveCategory('aerobet');
                    }} 
                    className={`flex-1 py-3 px-1 sm:px-3 rounded-xl text-center text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeCategory === 'aerobet' 
                          ? 'bg-[#e51a31] text-white shadow-lg shadow-[#e51a31]/20' 
                          : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                >
                    🚀 AERObet {activeEventId && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </button>
                
                <button 
                    disabled={isUserBusy} 
                    onClick={() => setActiveCategory('aerofantasy')} 
                    className={`flex-1 py-3 px-1 sm:px-3 rounded-xl text-center text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeCategory === 'aerofantasy' 
                          ? 'bg-[#34b1e2] text-white shadow-lg shadow-[#34b1e2]/20' 
                          : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                >
                    🏆 AeroFantasy
                </button>
                
                <button 
                    disabled={isUserBusy} 
                    onClick={() => setActiveCategory('store')} 
                    className={`flex-1 py-3 px-1 sm:px-3 rounded-xl text-center text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeCategory === 'store' 
                          ? 'bg-[#f59e0b] text-white shadow-lg shadow-[#f59e0b]/20' 
                          : 'text-white/40 hover:text-white hover:bg-[#f59e0b]/5'
                    }`}
                >
                    🛒 Loja
                </button>

                <button 
                    disabled={isUserBusy} 
                    onClick={() => setActiveCategory('hangar')} 
                    className={`flex-1 py-3 px-1 sm:px-3 rounded-xl text-center text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeCategory === 'hangar' 
                          ? 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20' 
                          : 'text-white/40 hover:text-white hover:bg-[#10b981]/5'
                    }`}
                >
                    🛸 Hangar
                </button>
            </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-1">
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={handleLoginSuccess} />}
        
        {isInInitialLanding ? (
          <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto w-full px-2 py-4">
            
            {/* 1. Gráfico Atual do Jogo */}
            <div className="flex-shrink-0 h-[280px] sm:h-[320px] md:h-[350px] flex flex-col bg-[#1b1c1d] rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
               <HistoryBar history={history} onShowFullHistory={() => setIsFullHistoryOpen(true)} />
               <div className="flex-1 relative">
                  <GameCanvas status={status} multiplier={multiplier} countdown={countdown} stats={roundStats} history={history} isSubscribed={isSubscribed} onOpenUpgrade={() => setIsBankrollModalOpen(true)} userStats={userStats} trackedMission={trackedMission} activeSkin={activeSkin} />
               </div>
            </div>

            {/* 2. Botão Jogar Agora - Green Pulsating */}
            <div className="flex flex-col items-center justify-center my-3 relative">
              <button
                onClick={() => {
                  setIsInInitialLanding(false);
                  setActiveCategory('aerobet');
                }}
                className="w-full max-w-sm py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 hover:scale-105 active:scale-95 transition-all text-white font-black italic text-base sm:text-lg uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(40,167,105,0.45)] animate-pulse relative overflow-hidden cursor-pointer flex items-center justify-center gap-2"
              >
                🚀 JOGAR AGORA 🚀
              </button>
            </div>

            {/* 3. Tutorial AeroFantasy */}
            <div className="bg-[#141516] rounded-3xl border border-white/5 p-6 shadow-2xl relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#34b1e2]/5 rounded-full blur-[40px] pointer-events-none" />
              <h3 className="text-xs sm:text-sm font-black italic uppercase text-white tracking-widest mb-3 flex items-center gap-2">
                🏆 O QUE É O AEROFANTASY E COMO PARTICIPAR?
              </h3>
              
              <p className="text-[11px] sm:text-xs text-white/70 leading-relaxed font-semibold mb-6">
                O AeroFantasy é a arena competitiva de simulações de voo do AeroFLA! Aqui, você participa de campeonatos diários e semanais em tempo real contra outros pilotos, utiliza créditos virtuais dedicados (Aerocoins) ou créditos da carteira, e busca craquear os maiores multiplicadores possíveis. Os melhores pilotos do placar dividem prêmios reais acumulativos diretamente na conta!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
                  <div className="text-[10px] font-black text-[#34b1e2] uppercase tracking-wider">1. Escolha Ligas</div>
                  <h4 className="text-xs font-black text-white/90 uppercase tracking-tight">Ingresse nas Arenas</h4>
                  <p className="text-[10.5px] text-white/50 leading-relaxed">
                    Navegue pelas ligas ativas de AeroFantasy, como a Liga dos Multiplicadores ou a Liga da Vela. Algumas são gratuitas e outras exigem taxas pequenas.
                  </p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
                  <div className="text-[10px] font-black text-[#10b981] uppercase tracking-wider">2. Pilote e Pontue</div>
                  <h4 className="text-xs font-black text-white/90 uppercase tracking-tight">Decole no Momento Certo</h4>
                  <p className="text-[10.5px] text-white/50 leading-relaxed">
                    Para cada liga, você recebe voos limitados. Jogue de forma tática para decolar, decolando no multiplicador ideal e acumulando a maior pontuação.
                  </p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
                  <div className="text-[10px] font-black text-[#f59e0b] uppercase tracking-wider">3. Fature Prêmios</div>
                  <h4 className="text-xs font-black text-white/90 uppercase tracking-tight">Conquiste o Topo do Placar</h4>
                  <p className="text-[10.5px] text-white/50 leading-relaxed">
                    Ao término da rodada da liga, os prêmios da piscina acumulada em dinheiro real são divididos e pagos integralmente na sua carteira.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Destaques das Skins da Loja */}
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs sm:text-sm font-black italic uppercase text-white tracking-widest">
                  🎨 AERONAVES PREMIUM EM DESTAQUE
                </h3>
                <button
                  onClick={() => {
                    setIsInInitialLanding(false);
                    setActiveCategory('store');
                  }}
                  className="text-[10px] sm:text-xs font-black text-[#f59e0b] hover:underline uppercase tracking-wider"
                >
                  Ver Loja Completa →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => {
                    setIsInInitialLanding(false);
                    setActiveCategory('store');
                  }}
                  className="bg-[#18191c] rounded-3xl p-4 border border-white/5 flex flex-col gap-3 group hover:border-white/10 hover:translate-y-[-2px] transition-all duration-300 cursor-pointer text-left"
                >
                  <div className="h-28 rounded-2xl bg-gradient-to-br from-[#ffe45c] via-[#dca817] to-[#111018] flex items-center justify-center relative overflow-hidden shadow-lg border border-white/5">
                    <img
                      src="/images/skin_soberano.png"
                      alt="Soberano Dourado"
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 object-contain mix-blend-screen drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transform group-hover:scale-110 duration-500 z-10 select-none pointer-events-none"
                    />
                    <span className="absolute top-2 right-2 bg-amber-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded uppercase">
                      Lendária
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Soberano Dourado</h4>
                    <p className="text-[10px] text-white/40 mt-1 line-clamp-2">
                      Fuselagem banhada a ouro stardust refinada, o ápice da realeza e estilo espacial.
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => {
                    setIsInInitialLanding(false);
                    setActiveCategory('store');
                  }}
                  className="bg-[#18191c] rounded-3xl p-4 border border-white/5 flex flex-col gap-3 group hover:border-white/10 hover:translate-y-[-2px] transition-all duration-300 cursor-pointer text-left"
                >
                  <div className="h-28 rounded-2xl bg-gradient-to-br from-[#141416] to-[#ff2d55] flex items-center justify-center relative overflow-hidden shadow-lg border border-white/5">
                    <img
                      src="/images/skin_dark.png"
                      alt="Sombra de Elite"
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 object-contain mix-blend-screen drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transform group-hover:scale-110 duration-500 z-10 select-none pointer-events-none"
                    />
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase font-sans">
                      Stealth Elite
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Sombra de Elite</h4>
                    <p className="text-[10px] text-white/40 mt-1 line-clamp-2">
                      Ocultação avançada com chassis de fibra de carbono fosca preta e neon ativo vermelho.
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => {
                    setIsInInitialLanding(false);
                    setActiveCategory('store');
                  }}
                  className="bg-[#18191c] rounded-3xl p-4 border border-white/5 flex flex-col gap-3 group hover:border-[#34b1e2]/20 hover:translate-y-[-2px] transition-all duration-300 cursor-pointer text-left sm:col-span-2 md:col-span-1"
                >
                  <div className="h-28 rounded-2xl bg-gradient-to-br from-[#00f2fe] to-[#4facfe] flex items-center justify-center relative overflow-hidden shadow-lg border border-white/5">
                    <img
                      src="/images/skin_silver.png"
                      alt="Tempestade de Prata"
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 object-contain mix-blend-screen drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transform group-hover:scale-110 duration-500 z-10 select-none pointer-events-none"
                    />
                    <span className="absolute top-2 right-2 bg-sky-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded uppercase font-sans">
                      Comanda
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Tempestade de Prata</h4>
                    <p className="text-[10px] text-white/40 mt-1 line-clamp-2">
                      Chassis de cromo glacial reluzente com rastro e neon de plasma azul criogênico.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <>
            <div className="order-1 lg:order-1 flex-1 flex flex-col gap-1 min-w-0">
              {/* AERObet View - Always Mounted to maintain seamless online flight chart in background! */}
              <div 
                className="flex-1 flex flex-col gap-1 min-w-0" 
                style={{ display: activeCategory === 'aerobet' ? 'flex' : 'none' }}
              >
                <div className="flex-shrink-0 h-[300px] sm:h-[350px] lg:h-auto lg:flex-1 flex flex-col bg-[#1b1c1d] rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
                   <HistoryBar history={history} onShowFullHistory={() => setIsFullHistoryOpen(true)} />
                   <div className="flex-1 relative">
                      <GameCanvas status={status} multiplier={multiplier} countdown={countdown} stats={roundStats} history={history} isSubscribed={isSubscribed} onOpenUpgrade={() => setIsBankrollModalOpen(true)} userStats={userStats} trackedMission={trackedMission} activeSkin={activeSkin} />
                   </div>
                </div>
                <div className="order-2 relative flex-shrink-0 py-1 mb-1.5 lg:mb-0">
                  <div className={`grid grid-cols-2 gap-1.5 sm:gap-2 transition-all duration-500 items-start`}>
                    <div className="min-h-[145px] sm:min-h-[160px]">
                      <BetControl mode={betMode1} setMode={setBetMode1} status={status} currentMultiplier={multiplier} balance={currentAvailableBalance} freeFlights={userStats.freeFlights} freeFlightConfigs={freeFlightConfigs} activeEventId={activeEventId} activeLeagueType={activeLeagueType} aerocoinBalance={aerocoinBalance} onPlaceBet={(amt, useFreeBet) => handlePlaceBet(1, amt, useFreeBet)} onCancelBet={() => handleCancelBet(1)} onCashout={(val) => handleCashout(1, val)} activeBet={bet1} nextRoundBet={nextRoundBet1 ? nextRoundBet1.amount : null} isSubscribed={isSubscribed} bankrollPlan={activePlanSlot1} onOpenManager={() => setIsBankrollModalOpen(true)} history={history} />
                    </div>
                    <div className="min-h-[145px] sm:min-h-[160px]">
                      <BetControl mode={betMode2} setMode={setBetMode2} status={status} currentMultiplier={multiplier} balance={currentAvailableBalance} freeFlights={userStats.freeFlights} freeFlightConfigs={freeFlightConfigs} activeEventId={activeEventId} activeLeagueType={activeLeagueType} aerocoinBalance={aerocoinBalance} onPlaceBet={(amt, useFreeBet) => handlePlaceBet(2, amt, useFreeBet)} onCancelBet={() => handleCancelBet(2)} onCashout={(val) => handleCashout(2, val)} activeBet={bet2} nextRoundBet={nextRoundBet2 ? nextRoundBet2.amount : null} isSubscribed={isSubscribed} bankrollPlan={activePlanSlot2} onOpenManager={() => setIsBankrollModalOpen(true)} history={history} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Views - Rendered conditionally */}
              {activeCategory === 'aerofantasy' ? (
                <div className="flex-1 flex flex-col bg-[#1b1c1d] rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
                  <TournamentsModal 
                    onClose={() => setActiveCategory('aerobet')} 
                    tournaments={tournaments} 
                    onJoinTournament={(tid, cost) => {
                      handleJoinEvent(tid, cost);
                      setActiveCategory('aerobet'); 
                    }}
                    isInline={true}
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
            <div className="order-3 lg:order-2 lg:w-64 xl:w-72 flex-shrink-0 h-[400px] lg:h-full">
                <Sidebar allBets={liveBets} gameStatus={status} currentMultiplier={multiplier} stats={roundStats} chatMessages={chatMessages} onSendMessage={handleSendMessage} myHistory={myHistory} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
