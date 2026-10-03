import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { CabineSession, CabineMessage } from '../../types';

const LOCAL_STORAGE_KEY = 'aerogame_cabines_cache';
const LOCAL_ACTIVE_CABINE_KEY = 'aerogame_active_cabine';

// Default initial demo cabines waiting for co-pilot if empty
export const DEFAULT_DEMO_CABINES: Omit<CabineSession, 'userRole'>[] = [
  {
    id: 'cabine-falcon-01',
    name: 'Cabine Falcão Relâmpago #01',
    password: '123',
    totalBankroll: 100,
    pilotShare: 50,
    copilotShare: 50,
    currentBalance: 100,
    initialBalance: 100,
    pilotId: 'pilot-demo-1',
    pilotName: 'Comandante Silva',
    copilotId: null,
    copilotName: null,
    status: 'waiting',
    createdAt: Date.now() - 1000 * 60 * 12,
    totalRounds: 0,
    profit: 0
  },
  {
    id: 'cabine-fenix-02',
    name: 'Cabine Fênix Dourada #02',
    password: '777',
    totalBankroll: 200,
    pilotShare: 100,
    copilotShare: 100,
    currentBalance: 200,
    initialBalance: 200,
    pilotId: 'pilot-demo-2',
    pilotName: 'Capitão Maverick',
    copilotId: null,
    copilotName: null,
    status: 'waiting',
    createdAt: Date.now() - 1000 * 60 * 5,
    totalRounds: 0,
    profit: 0
  },
  {
    id: 'cabine-turbo-03',
    name: 'Cabine Turbo Alfas #03',
    password: '999',
    totalBankroll: 50,
    pilotShare: 25,
    copilotShare: 25,
    currentBalance: 50,
    initialBalance: 50,
    pilotId: 'pilot-demo-3',
    pilotName: 'Piloto Ás Santos',
    copilotId: null,
    copilotName: null,
    status: 'waiting',
    createdAt: Date.now() - 1000 * 60 * 2,
    totalRounds: 0,
    profit: 0
  }
];

export const getCachedCabines = (): CabineSession[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading cached cabines', e);
  }
  return DEFAULT_DEMO_CABINES.map(c => ({ ...c, userRole: 'pilot' as const }));
};

export const saveCachedCabines = (cabines: CabineSession[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cabines));
  } catch (e) {
    console.error('Error saving cached cabines', e);
  }
};

export const getActiveCabineFromStorage = (): CabineSession | null => {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVE_CABINE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading active cabine', e);
  }
  return null;
};

export const saveActiveCabineToStorage = (cabine: CabineSession | null) => {
  try {
    if (cabine) {
      localStorage.setItem(LOCAL_ACTIVE_CABINE_KEY, JSON.stringify(cabine));
    } else {
      localStorage.removeItem(LOCAL_ACTIVE_CABINE_KEY);
    }
  } catch (e) {
    console.error('Error saving active cabine', e);
  }
};

/**
 * Escuta todas as cabines ativas e em espera em tempo real via Firestore
 */
export const listenToCabines = (callback: (cabines: CabineSession[]) => void) => {
  try {
    const colRef = collection(db, 'cabines');
    return onSnapshot(colRef, (snapshot) => {
      const items: CabineSession[] = [];
      snapshot.forEach(d => {
        items.push({ id: d.id, ...d.data() } as CabineSession);
      });

      if (items.length > 0) {
        saveCachedCabines(items);
        callback(items);
      } else {
        const cached = getCachedCabines();
        callback(cached);
      }
    }, (err) => {
      console.warn('Firestore cabines listener fallback to cache:', err);
      callback(getCachedCabines());
    });
  } catch (e) {
    console.warn('Error setting up firestore cabine listener:', e);
    callback(getCachedCabines());
    return () => {};
  }
};

/**
 * Cria uma nova cabine para operação em dupla (Piloto e Copiloto)
 */
export const createCabineSession = async (params: {
  name: string;
  password: string;
  totalBankroll: number;
  pilotId: string;
  pilotName: string;
}): Promise<CabineSession> => {
  const share = params.totalBankroll / 2;
  const id = `cabine-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  
  const newCabine: CabineSession = {
    id,
    name: params.name.trim(),
    password: params.password.trim(),
    totalBankroll: params.totalBankroll,
    pilotShare: share,
    copilotShare: share,
    currentBalance: params.totalBankroll,
    initialBalance: params.totalBankroll,
    pilotId: params.pilotId,
    pilotName: params.pilotName,
    copilotId: null,
    copilotName: null,
    status: 'waiting',
    createdAt: Date.now(),
    userRole: 'pilot',
    totalRounds: 0,
    profit: 0
  };

  // Salva no Firestore
  try {
    await setDoc(doc(db, 'cabines', id), {
      ...newCabine,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('Error creating cabine on firestore, fallback local:', e);
  }

  // Atualiza cache local
  const cached = getCachedCabines();
  saveCachedCabines([newCabine, ...cached.filter(c => c.id !== id)]);
  saveActiveCabineToStorage(newCabine);

  return newCabine;
};

/**
 * Entra como copiloto em uma cabine existente validando a senha
 */
export const joinCabineSession = async (params: {
  cabineId: string;
  passwordAttempt: string;
  copilotId: string;
  copilotName: string;
}): Promise<{ success: boolean; cabine?: CabineSession; error?: string }> => {
  let cabineObj: CabineSession | null = null;

  try {
    const docRef = doc(db, 'cabines', params.cabineId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      cabineObj = { id: snap.id, ...snap.data() } as CabineSession;
    }
  } catch (e) {
    console.warn('Error reading cabine from firestore:', e);
  }

  if (!cabineObj) {
    const cached = getCachedCabines();
    cabineObj = cached.find(c => c.id === params.cabineId) || null;
  }

  if (!cabineObj) {
    return { success: false, error: 'Cabine não encontrada ou já expirada.' };
  }

  if (cabineObj.status === 'closed') {
    return { success: false, error: 'Esta cabine já foi encerrada.' };
  }

  if (cabineObj.password && cabineObj.password !== params.passwordAttempt.trim()) {
    return { success: false, error: 'Senha da cabine incorreta. Peça a senha ao Piloto.' };
  }

  // Atualiza status para 'active' com o copiloto conectado
  const updatedCabine: CabineSession = {
    ...cabineObj,
    copilotId: params.copilotId,
    copilotName: params.copilotName,
    status: 'active',
    userRole: 'copilot'
  };

  try {
    await updateDoc(doc(db, 'cabines', params.cabineId), {
      copilotId: params.copilotId,
      copilotName: params.copilotName,
      status: 'active',
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('Error updating cabine on firestore:', e);
  }

  // Atualiza cache
  const cached = getCachedCabines();
  saveCachedCabines(cached.map(c => c.id === updatedCabine.id ? updatedCabine : c));
  saveActiveCabineToStorage(updatedCabine);

  return { success: true, cabine: updatedCabine };
};

/**
 * Localiza uma cabine exclusivamente pelo Nome digitado e valida a senha para o Copiloto entrar
 */
export const joinCabineByNameAndPassword = async (params: {
  cabineName: string;
  passwordAttempt: string;
  copilotId: string;
  copilotName: string;
}): Promise<{ success: boolean; cabine?: CabineSession; error?: string }> => {
  const searchName = params.cabineName.trim().toLowerCase();
  if (!searchName) {
    return { success: false, error: 'Por favor, informe o nome da cabine.' };
  }

  let matchedCabine: CabineSession | null = null;

  // 1. Busca no Firestore por nome
  try {
    const colRef = collection(db, 'cabines');
    const snap = await getDocs(colRef);
    snap.forEach(d => {
      const data = d.data() as CabineSession;
      if (data.name && data.name.trim().toLowerCase() === searchName) {
        matchedCabine = { id: d.id, ...data };
      }
    });
  } catch (e) {
    console.warn('Error querying cabine by name on firestore:', e);
  }

  // 2. Fallback para cache local
  if (!matchedCabine) {
    const cached = getCachedCabines();
    matchedCabine = cached.find(c => c.name && c.name.trim().toLowerCase() === searchName) || null;
  }

  if (!matchedCabine) {
    return { 
      success: false, 
      error: `Nenhuma cabine encontrada com o nome "${params.cabineName.trim()}". Verifique o nome exato com o Piloto criador.` 
    };
  }

  return joinCabineSession({
    cabineId: (matchedCabine as CabineSession).id,
    passwordAttempt: params.passwordAttempt,
    copilotId: params.copilotId,
    copilotName: params.copilotName
  });
};

/**
 * Atualiza o saldo compartilhado da cabine após apostas e cashouts
 */
export const updateCabineBalance = async (
  cabineId: string, 
  newBalance: number,
  profitDelta: number = 0
) => {
  const current = getActiveCabineFromStorage();
  if (current && current.id === cabineId) {
    current.currentBalance = Math.max(0, Math.round(newBalance * 100) / 100);
    current.profit = Math.round((current.currentBalance - current.initialBalance) * 100) / 100;
    current.totalRounds = (current.totalRounds || 0) + 1;
    saveActiveCabineToStorage(current);
  }

  try {
    await updateDoc(doc(db, 'cabines', cabineId), {
      currentBalance: Math.max(0, Math.round(newBalance * 100) / 100),
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    // Silent catch
  }
};

/**
 * Encerra a operação da cabine e calcula a divisão 50% / 50%
 */
export const closeCabineSession = async (cabineId: string): Promise<{
  finalBalance: number;
  sharePerPilot: number;
  profit: number;
}> => {
  const current = getActiveCabineFromStorage();
  const finalBalance = current ? current.currentBalance : 0;
  const initial = current ? current.initialBalance : 0;
  const sharePerPilot = Math.max(0, Math.round((finalBalance / 2) * 100) / 100);
  const profit = Math.round((finalBalance - initial) * 100) / 100;

  try {
    await updateDoc(doc(db, 'cabines', cabineId), {
      status: 'closed',
      finalBalance,
      sharePerPilot,
      closedAt: Date.now(),
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('Error closing cabine in firestore:', e);
  }

  saveActiveCabineToStorage(null);

  return {
    finalBalance,
    sharePerPilot,
    profit
  };
};

/**
 * Envia uma mensagem para o chat privado exclusivo da cabine
 */
export const sendCabineMessage = async (params: {
  cabineId: string;
  sender: string;
  role: 'pilot' | 'copilot';
  text: string;
}) => {
  const newMsg: CabineMessage = {
    id: `cmsg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    cabineId: params.cabineId,
    sender: params.sender,
    role: params.role,
    text: params.text.trim(),
    timestamp: Date.now()
  };

  try {
    await addDoc(collection(db, `cabines/${params.cabineId}/messages`), {
      ...newMsg,
      serverTime: serverTimestamp()
    });
  } catch (e) {
    console.warn('Error sending cabine chat msg to firestore:', e);
  }

  return newMsg;
};

/**
 * Escuta as mensagens do chat privado da cabine em tempo real
 */
export const listenToCabineMessages = (
  cabineId: string, 
  callback: (messages: CabineMessage[]) => void
) => {
  try {
    const q = query(
      collection(db, `cabines/${cabineId}/messages`),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const msgs: CabineMessage[] = [];
      snapshot.forEach(d => {
        msgs.push({ id: d.id, ...d.data() } as CabineMessage);
      });
      callback(msgs);
    }, (err) => {
      console.warn('Firestore cabine messages listener error:', err);
    });
  } catch (e) {
    console.warn('Error attaching cabine messages listener:', e);
    return () => {};
  }
};
