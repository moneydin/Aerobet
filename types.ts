
import React from 'react';

export enum GameStatus {
  WAITING = 'WAITING',
  FLYING = 'FLYING',
  CRASHED = 'CRASHED'
}

export interface Bet {
  id: string;
  amount: number;
  cashoutAt?: number;
  status: 'active' | 'cashed' | 'lost';
  payout?: number;
  multiplier?: number;
  isFreeFlight?: boolean;
  source?: 'real' | 'bonus' | 'aerocoin';
  firestoreId?: string;
}

export interface GameHistory {
  multiplier: number;
  color: string;
  hash: string;
  serverSeed: string;
  clientSeed: string;
  roundId: string;
}

export interface LiveBet {
  id: string;
  username: string;
  amount: number;
  multiplier?: number;
  payout?: number;
  isMe?: boolean;
  cashedOut?: boolean;
  profit?: number;
  timestamp?: number;
  roundId?: string;
}

export interface PlanHistoryEntry {
  id: string;
  timestamp: number;
  amount: number;
  multiplier: number;
  profit: number;
  result: 'win' | 'loss';
}

export interface BankrollPlan {
  id: string;
  name: string;
  timeframe: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  goalType: 'conservative' | 'moderate' | 'aggressive';
  operationMode: 'manual' | 'auto';
  totalGoal: number;
  dailyGoal: number;
  entryPercentage: number;
  entryAmount: number;
  targetMultiplier: number;
  winsNeeded: number;
  stopLoss: number;
  currentDayProfit: number;
  active: boolean;
  history: PlanHistoryEntry[];
  createdAt: number;
}

export interface UserStats {
  totalWagered: number;
  maxMult: number;
  totalRounds: number;
  totalWins: number;
  freeFlights: number;
  lastSpinTime: number;
  lastDepositTime: number;
  clubeMember: boolean;
  clubeFlightsCount: number;
  clubeCycleStartDate: number;
  subscriptionExpiresAt?: number;
  autoRenewSubscription?: boolean;
  bankrollPlans: BankrollPlan[];
  activePlanIds: {
      slot1: string | null;
      slot2: string | null;
  };
  firstDepositDone: boolean;
  bonusBalance: number;
  rolloverTarget: number;
  rolloverCurrent: number;
  rolloverBetsTarget: number;
  rolloverBetsCount: number;
  unlockedSkins?: string[];
  activeSkin?: string;
}

export interface UserProfile {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  withdrawalPin: string | null;
  bankName: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'cashout' | 'bet' | 'reward' | 'subscription' | 'bonus_unlock';
  amount: number;
  date: number;
  description: string;
}

export interface FreeFlightTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  source: string;
  date: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardFlights: number;
  rewardBalance: number;
  entryCost?: number;
  minMultiplier?: number;
  type: 'bets_count' | 'total_wager' | 'multiplier_hit' | 'win_streak';
  tier: 'free' | 'premium';
  completed: boolean;
  rewardClaimed: boolean;
  accepted: boolean;
}

// --- NOVOS TIPOS AEROFANTASY AVANÇADO ---

export interface EventPrize {
  position: number; // 1 para 1º lugar, etc.
  rewardType: 'cash' | 'flight' | 'physical' | 'mixed';
  cashAmount?: number;
  flightAmount?: number;
  physicalItemName?: string; // Ex: "iPhone 15", "Camisa do Time"
  displayLabel: string; // O que aparece na UI. Ex: "R$ 1000 + iPhone"
}

export interface EventParticipant {
  userId: number;
  username: string;
  score: number;
  flightsUsed?: number;
  eventBalance?: number;
  avatar?: string;
  rebuyCount?: number; // Quantas vezes fez recompra
}

export type AeroFantasyLeagueType = 'aerocoin' | 'multiplier' | 'vela';

export interface AeroFantasyConfig {
    // Geral
    entryDeadline: number; // Timestamp limite para entrar
    frequency: 'daily' | 'weekly' | 'specific_date';
    
    // Regras de Aerocoins
    startingAerocoins?: number;
    eliminateOnZeroBalance?: boolean; // Modo Morte Súbita
    
    // Regras de Voos (Comum a Multiplier e Aerocoins Limited)
    maxFlights?: number; // Limite de voos/tentativas
    
    // Regras de Multiplicador / Rebuy
    allowRebuy?: boolean;
    rebuyCost?: number; // Custo em R$
    rebuyFlightsAmount?: number; // Quantos voos ganha no rebuy
    maxRebuys?: number;

    // Regras de Vela
    targetMultiplier?: number; // Ex: 10.00x
    jackpotAccumulated?: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  prizePool: string; // Texto de exibição geral (ex: "R$ 10k + Prêmios")
  endsIn: string; // Mantido para fallback UI
  endTime: number; // Timestamp fim do evento
  startTime: number; // Timestamp inicio do evento
  status: 'live' | 'upcoming' | 'ended';
  bannerGradient: string;
  participants: number;
  minEntry: number; // Aposta mínima na rodada
  
  image?: string;
  images?: string[];
  
  isPaid: boolean; 
  entryFee: number;
  
  leagueType: AeroFantasyLeagueType;
  
  rankingType?: 'total_wager' | 'highest_multiplier' | 'accumulated_multiplier' | 'balance';

  // Configuração Avançada
  config: AeroFantasyConfig;

  // Propriedades Legadas (Mantidas para compatibilidade temporária, mas a lógica deve usar config)
  initialAerocoins?: number;
  flightsLimit?: number;
  isJackpot?: boolean;
  jackpotAccumulated?: number;

  prizes: EventPrize[]; 
  participantsList: EventParticipant[]; 
  userJoined: boolean; 
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  total: number;
  rewardFlights?: number;
  rewardBalance?: number;
  claimed: boolean; 
  secret?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'success' | 'warning' | 'info' | 'reward';
  timestamp: number;
  read: boolean;
  category?: 'mission' | 'event' | 'tournament'; 
}

export interface WheelPrize {
  id: number;
  label: string;
  type: 'balance' | 'flight' | 'none';
  amount: number;
  color: string;
  text: string; 
  probability: number; 
}

export interface DepositConfig {
  amount: number;
  pixKey: string; 
  qrCodeImage?: string; 
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: number;
  role: 'user' | 'admin' | 'bot';
}

export interface AlertConfig {
  target: number;
  sound: boolean;
  visual: boolean;
  enabled: boolean;
}

export interface Referral {
    id: string;
    username: string;
    registeredAt: number;
    depositedAmount: number;
    flightsCount: number;
    status: 'pending' | 'qualified' | 'claimed';
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  color: string;
  hasButton: boolean;
  buttonText?: string;
  buttonAction?: string; // Link ou identificador de ação
  active: boolean;
}

export interface FreeFlightConfig {
  id: string;
  title: string;
  description: string; // O que deve ser feito pra ganhar
  quantity: number; // Quantidade de voos
  valuePerFlight: number; // Valor de cada voo grátis
  minCashoutMultiplier: number; // Multiplicador mínimo para retirada
  active: boolean;
}

export interface ClubeConfig {
  targetFlights: number; // Quantos voos precisa fazer
  rewardFlights: number; // Quantos voos ganha
  minBetAmount: number; // Valor mínimo da aposta para contar no clube
  active: boolean;
}
