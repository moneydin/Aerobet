export interface CustomSkin {
  id: string;
  name: string;
  category: 'skin';
  description: string;
  priceType: 'rc' | 'co';
  price: number;
  previewColorGradient: string;
  bgColor: string;
  rating: number;
  reviewsCount: number;
  specs: string[];
  imageBase64: string;
  smokeColor?: string;
  lineColor?: string;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  rotation?: number;
}

export const getCustomSkins = (): CustomSkin[] => {
  try {
    const data = localStorage.getItem('custom_store_skins');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCustomSkin = (skin: CustomSkin) => {
  const skins = getCustomSkins();
  skins.push(skin);
  localStorage.setItem('custom_store_skins', JSON.stringify(skins));
  return skins;
};

export const getCustomSkinImage = (skinId: string) => {
  const skins = getCustomSkins();
  const skin = skins.find((s) => s.id === skinId);
  return skin ? skin.imageBase64 : null;
};
