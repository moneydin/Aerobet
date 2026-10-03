import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface LandingConfig {
  backgroundImage: string;
  backgroundOpacity: number; // 0.1 to 1.0 (overlay darkness)
  backgroundBlur: number; // 0 to 20 px
  backgroundColor: string;

  aerobetImage: string;
  aerobetTitle?: string;
  aerobetSubtitle?: string;
  aerogameImage?: string;
  aerogameTitle?: string;
  aerogameSubtitle?: string;

  aerofantasyImage: string;
  aerofantasyTitle?: string;
  aerofantasySubtitle?: string;

  heroBannerImage?: string;
  hangarBannerImage?: string;
}

export const DEFAULT_LANDING_CONFIG: LandingConfig = {
  backgroundImage: '',
  backgroundOpacity: 0.5,
  backgroundBlur: 0,
  backgroundColor: '#09090b',

  aerobetImage: '/src/assets/images/mode_aerobet_crash_1790467069234.jpg',
  aerobetTitle: 'AEROGAME CRASH',
  aerobetSubtitle: 'Crash Multiplayer ao Vivo',

  aerofantasyImage: '/src/assets/images/mode_aerofantasy_trophy_1790467079662.jpg',
  aerofantasyTitle: 'AEROFANTASY LIGAS',
  aerofantasySubtitle: 'Arena Esports de Torneios',

  heroBannerImage: '',
  hangarBannerImage: ''
};

export const getLandingConfig = (): LandingConfig => {
  try {
    const raw = localStorage.getItem('landing_portal_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_LANDING_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Error reading landing config from localStorage', e);
  }
  return { ...DEFAULT_LANDING_CONFIG };
};

export const saveLandingConfig = async (newConfig: LandingConfig): Promise<boolean> => {
  try {
    const cleaned = { ...DEFAULT_LANDING_CONFIG, ...newConfig };
    localStorage.setItem('landing_portal_config', JSON.stringify(cleaned));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('landing-config-updated'));
    }

    // Persist to Firestore /settings/landing_config
    const docRef = doc(db, 'settings', 'landing_config');
    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving landing config to Firestore', err);
    return false;
  }
};

export const useLandingConfig = () => {
  const [config, setConfig] = useState<LandingConfig>(() => getLandingConfig());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Initial local load
    setConfig(getLandingConfig());

    // 2. Custom local window event listener
    const handleLocalUpdate = () => {
      setConfig(getLandingConfig());
    };
    window.addEventListener('landing-config-updated', handleLocalUpdate);

    // 3. Firestore realtime snapshot
    let unsub = () => {};
    try {
      const docRef = doc(db, 'settings', 'landing_config');
      unsub = onSnapshot(docRef, (snapshot) => {
        setIsLoading(false);
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as Partial<LandingConfig>;
          const merged = { ...DEFAULT_LANDING_CONFIG, ...remoteData };
          setConfig(merged);
          localStorage.setItem('landing_portal_config', JSON.stringify(merged));
        }
      }, (err) => {
        console.warn('Firestore snapshot error for landing_config', err);
        setIsLoading(false);
      });
    } catch (e) {
      console.warn('Firestore onSnapshot setup failed', e);
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener('landing-config-updated', handleLocalUpdate);
      unsub();
    };
  }, []);

  return { config, setConfig, isLoading };
};
