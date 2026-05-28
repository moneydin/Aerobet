export interface CustomSkin {
  id: string;
  name: string;
  category: 'skin';
  description: string;
  badge?: string;
  priceType: 'rc' | 'co';
  price: number;
  previewColorGradient: string;
  bgColor: string;
  rating: number;
  reviewsCount: number;
  specs: string[];
  imageBase64: string;
  coverImageBase64?: string;
  smokeColor?: string;
  smokeColor2?: string;
  lineColor?: string;
  lineColor2?: string;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  rotation?: number;
  offsetXStart?: number;
  offsetYStart?: number;
  scaleStart?: number;
  rotationStart?: number;
  flipX?: boolean;
  isActive?: boolean;
}

import { db } from '../firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';

export const getCustomSkins = (): CustomSkin[] => {
  try {
    const data = localStorage.getItem('custom_store_skins');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const useCustomSkins = () => {
  const [skins, setSkins] = useState<CustomSkin[]>(getCustomSkins());
  useEffect(() => {
    const handler = () => setSkins(getCustomSkins());
    window.addEventListener('custom-skins-updated', handler);
    return () => window.removeEventListener('custom-skins-updated', handler);
  }, []);
  return skins;
};

export const saveCustomSkin = (skin: CustomSkin) => {
  const skins = getCustomSkins();
  const index = skins.findIndex(s => s.id === skin.id);
  if (index !== -1) {
     skins[index] = skin;
  } else {
     skins.push(skin);
  }
  localStorage.setItem('custom_store_skins', JSON.stringify(skins));
  
  // Background sync to Firebase
  const sanitizedSkin = JSON.parse(JSON.stringify(skin));
  setDoc(doc(db, 'custom_skins', skin.id), sanitizedSkin).catch(e => console.error('Error syncing skin', e));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('custom-skins-updated'));
  
  return skins;
};

export const toggleCustomSkinActive = (skinId: string, fullSkinData?: any) => {
  const skins = getCustomSkins();
  let updatedSkin = null;
  const index = skins.findIndex(s => s.id === skinId);
  
  if (index !== -1) {
    if (skins[index].isActive === undefined) {
       skins[index].isActive = false; // Toggle to false if undefined
    } else {
       skins[index].isActive = !skins[index].isActive;
    }
    updatedSkin = skins[index];
    localStorage.setItem('custom_store_skins', JSON.stringify(skins));
  } else if (fullSkinData) {
    // If not found, it's a default skin modifying its state, we save it as a custom
    const skinData = { ...fullSkinData, isActive: false };
    skins.push(skinData);
    updatedSkin = skinData;
    localStorage.setItem('custom_store_skins', JSON.stringify(skins));
  }

  if (updatedSkin) {
      const sanitizedUpdatedSkin = JSON.parse(JSON.stringify(updatedSkin));
      setDoc(doc(db, 'custom_skins', updatedSkin.id), sanitizedUpdatedSkin).catch(e => console.error('Error syncing skin', e));
  }
  
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('custom-skins-updated'));
  
  return skins;
};

export const getCustomSkinImage = (skinId: string) => {
  const skins = getCustomSkins();
  const skin = skins.find((s) => s.id === skinId);
  return skin ? skin.imageBase64 : null;
};

export const listenToCustomSkins = (callback?: (skins: CustomSkin[]) => void) => {
  const q = collection(db, 'custom_skins');
  return onSnapshot(q, (snapshot) => {
    const dbSkins: CustomSkin[] = [];
    snapshot.forEach(d => dbSkins.push(d.data() as CustomSkin));
    if (dbSkins.length > 0) {
       localStorage.setItem('custom_store_skins', JSON.stringify(dbSkins));
       if (typeof window !== 'undefined') window.dispatchEvent(new Event('custom-skins-updated'));
       if (callback) callback(dbSkins);
    }
  }, (err) => console.log('Err syncing skins', err));
};

