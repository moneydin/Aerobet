// Utility to manage multiple custom Game Canvas background settings with random rotation and IndexedDB persistence

export interface CanvasBackgroundConfig {
  enabled: boolean;
  images: string[]; // List of base64 compressed dataURLs or custom image URLs
  videos?: string[]; // List of base64 or custom video URLs
  bgType?: 'image' | 'video'; // Selected background type: 'image' or 'video'
  opacity: number; // 0 to 1 (how transparent the image appears)
  blur: number; // in pixels (0 to 10)
  overlayDarkness: number; // 0 to 1 (dark tint over the image for high contrast readability of multipliers)
  fit: 'cover' | 'contain';
}

export const DEFAULT_CANVAS_BG_CONFIG: CanvasBackgroundConfig = {
  enabled: false,
  images: [], // Empty by default
  videos: [],
  bgType: 'image',
  opacity: 0.35,
  blur: 0,
  overlayDarkness: 0.4,
  fit: 'cover'
};

const STORAGE_KEY = 'aerogame_canvas_background_config';
const LEGACY_STORAGE_KEY = 'aerobet_canvas_background_config';
const EVENT_KEY = 'aerogame_canvas_bg_updated';
const LEGACY_EVENT_KEY = 'aerobet_canvas_bg_updated';

const IDB_NAME = 'aerogame_storage_db';
const IDB_STORE = 'app_settings';
const IDB_KEY = 'canvas_background_config';

// Curated aesthetic presets for immediate selection & rotation
export const CANVAS_BG_PRESETS: { id: string; name: string; url: string; preview: string }[] = [
  {
    id: 'cyberpunk_hangar',
    name: 'Hangar Cyberpunk Noturno',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    preview: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'deep_space_nebula',
    name: 'Nebulosa Espacial Profunda',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
    preview: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'cockpit_hud',
    name: 'Cockpit Caça Tático',
    url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80',
    preview: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'sunset_clouds',
    name: 'Horizonte Dourado Supersônico',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    preview: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80'
  }
];

// --- INDEXEDDB STORAGE ENGINE (LIVRE DE LIMITES DO LOCALSTORAGE) ---
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB indisponível'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Erro ao abrir IndexedDB'));
  });
}

async function loadFromIDB(): Promise<CanvasBackgroundConfig | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveToIDB(config: CanvasBackgroundConfig): Promise<boolean> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(config, IDB_KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// Cache em memória para leitura síncrona ultra rápida
let memoryConfig: CanvasBackgroundConfig = (() => {
  try {
    const raw = typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY))
      : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      let images = parsed.images || [];
      if (parsed.imageUrl && images.length === 0) {
        images = [parsed.imageUrl];
      }
      return {
        ...DEFAULT_CANVAS_BG_CONFIG,
        ...parsed,
        images
      };
    }
  } catch {
    // Ignora erros de parse do localStorage
  }
  return DEFAULT_CANVAS_BG_CONFIG;
})();

// Hidratação assíncrona do IndexedDB no carregamento da aplicação
if (typeof window !== 'undefined' && window.indexedDB) {
  loadFromIDB().then((idbConfig) => {
    if (idbConfig) {
      memoryConfig = {
        ...DEFAULT_CANVAS_BG_CONFIG,
        ...idbConfig
      };
      window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: memoryConfig }));
      window.dispatchEvent(new CustomEvent(LEGACY_EVENT_KEY, { detail: memoryConfig }));
    } else if (memoryConfig.images.length > 0 || (memoryConfig.videos && memoryConfig.videos.length > 0)) {
      // Migra dados existentes para o IndexedDB
      saveToIDB(memoryConfig);
    }
  }).catch(() => {});
}

export const getCanvasBackgroundConfig = (): CanvasBackgroundConfig => {
  return memoryConfig;
};

export const saveCanvasBackgroundConfig = (config: CanvasBackgroundConfig): void => {
  // Atualiza cache em memória
  memoryConfig = config;

  // Notifica imediatamente os componentes e telas inscritas
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: config }));
    window.dispatchEvent(new CustomEvent(LEGACY_EVENT_KEY, { detail: config }));
  }

  // Grava de forma segura no IndexedDB (sem estouro de cota para vídeos/imagens pesados)
  saveToIDB(config);

  // Tentativa segura de espelhamento no localStorage (com proteção total contra QuotaExceededError)
  try {
    const json = JSON.stringify(config);
    if (json.length < 1_500_000) {
      localStorage.setItem(STORAGE_KEY, json);
    } else {
      // Salva apenas metadados e URLs externas para não estourar a cota de 5MB do localStorage
      const lightweight = {
        ...config,
        images: config.images.map(img => img.startsWith('data:') ? '[idb_stored_image]' : img),
        videos: (config.videos || []).map(v => v.startsWith('data:') ? '[idb_stored_video]' : v)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
    }
  } catch {
    // O erro de cota é suprimido com segurança, pois o IndexedDB retém a configuração autoritativa completa
  }
};

export const subscribeToCanvasBackground = (callback: (config: CanvasBackgroundConfig) => void): (() => void) => {
  // Entrega imediatamente a configuração em memória disponível
  callback(memoryConfig);

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<CanvasBackgroundConfig>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(EVENT_KEY, handler);
    window.addEventListener(LEGACY_EVENT_KEY, handler);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(EVENT_KEY, handler);
      window.removeEventListener(LEGACY_EVENT_KEY, handler);
    }
  };
};

/**
 * Redimensiona e comprime uma imagem enviada pelo usuário para garantir
 * alta performance e carregamento fluido no gráfico.
 */
export const processUploadedImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo selecionado.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao processar a imagem.'));
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Seleciona um fundo aleatório com segurança a partir da lista configurada
 */
export const getRandomBackgroundImage = (config: CanvasBackgroundConfig): string => {
  if (!config.enabled || !config.images || config.images.length === 0) {
    return '';
  }
  const randomIndex = Math.floor(Math.random() * config.images.length);
  return config.images[randomIndex];
};

/**
 * Processa e lê um arquivo de vídeo enviado pelo usuário.
 * Graças ao IndexedDB, suporta vídeos de até 35MB diretamente no navegador.
 */
export const processUploadedVideo = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > 35 * 1024 * 1024) {
      reject(new Error('O vídeo selecionado é muito grande (máximo 35MB). Para arquivos maiores, recomendamos usar um link direto de vídeo MP4/WebM.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de vídeo.'));
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Seleciona um vídeo de fundo aleatório com segurança a partir da lista configurada
 */
export const getRandomBackgroundVideo = (config: CanvasBackgroundConfig): string => {
  if (!config.enabled || !config.videos || config.videos.length === 0) {
    return '';
  }
  const randomIndex = Math.floor(Math.random() * config.videos.length);
  return config.videos[randomIndex];
};
