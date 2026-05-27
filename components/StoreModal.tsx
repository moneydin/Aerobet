import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getCustomSkins, saveCustomSkin, getCustomSkinImage, CustomSkin } from '../src/utils/customSkins';

interface SkinItem {
  id: string;
  name: string;
  category: 'skin';
  description: string;
  priceType: 'rc' | 'co'; // rc = Real Cash (R$), co = Aerocoins
  price: number;
  originalPrice?: number;
  previewColorGradient: string; // Tailwind class for visual preview
  bgColor: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  specs: string[];
}

interface FlightPackItem {
  id: string;
  name: string;
  category: 'flight';
  description: string;
  priceType: 'rc';
  price: number;
  originalPrice?: number;
  quantity: number;
  valueInfo: string;
  bgColor: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  specs: string[];
}

interface CoinsPackItem {
  id: string;
  name: string;
  category: 'coin';
  description: string;
  priceType: 'rc';
  price: number;
  originalPrice?: number;
  coinsCount: number;
  bgColor: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  specs: string[];
}

type StoreProduct = SkinItem | FlightPackItem | CoinsPackItem;

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

interface StoreModalProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (newBalance: number | ((prev: number) => number)) => void;
  aerocoinBalance: number;
  onUpdateAerocoinBalance: (newCoins: number | ((prev: number) => number)) => void;
  freeFlights: number;
  onUpdateFreeFlights: (newFlights: number | ((prev: number) => number)) => void;
  activeSkin: string;
  onChangeSkin: (skinId: string) => void;
  unlockedSkins: string[];
  onUnlockSkin: (skinId: string) => void;
  handleAddNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
  isInline?: boolean;
}

const PRODUCTS_LIST: StoreProduct[] = [
  // --- SKINS ---
  {
    id: 'fenix',
    name: 'Fênix Rubra',
    category: 'skin',
    description: 'O caça lendário padrão, forjado com titânio aeroespacial e neon vermelho flamejante.',
    priceType: 'co',
    price: 0,
    previewColorGradient: 'from-[#ff2d55] to-[#8b0010]',
    bgColor: 'bg-red-500/10 border-red-500/20',
    rating: 4.5,
    reviewsCount: 312,
    specs: ['Chassis Titânio', 'Neon Turbilhonante', 'Clássico Flamengo']
  },
  {
    id: 'silver',
    name: 'Tempestade de Prata',
    category: 'skin',
    description: 'Chassi polido em cromo glacial com propulsores de plasma e neon azul criogênico de alta altitude.',
    priceType: 'rc',
    price: 5.00,
    originalPrice: 7.50,
    previewColorGradient: 'from-[#00f2fe] to-[#4facfe]',
    bgColor: 'bg-sky-500/10 border-sky-500/20',
    badge: '15% OFF',
    rating: 4.8,
    reviewsCount: 184,
    specs: ['Cromo Glacial', 'Plasma Azul', 'Propulsão Ionizada']
  },
  {
    id: 'purple',
    name: 'Nebulosa Roxa',
    category: 'skin',
    description: 'Visual cósmico ionizado de alta frequência com rastro gravitacional em violeta profundo galáctico.',
    priceType: 'co',
    price: 250,
    previewColorGradient: 'from-[#f107a3] to-[#7b2ff7]',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    badge: 'Popular',
    rating: 4.9,
    reviewsCount: 420,
    specs: ['Matriz Cósmica', 'Anti-G Violeta', 'Sombra de Nebulosa']
  },
  {
    id: 'gold',
    name: 'Áureo Imperial',
    category: 'skin',
    description: 'Fuselagem exclusiva de gala revestida a ouro 24 quilates polido com acabamento interno em fibra de carbono.',
    priceType: 'rc',
    price: 15.00,
    originalPrice: 20.00,
    previewColorGradient: 'from-[#ffe259] to-[#ffa751]',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    badge: 'Edição Exclusiva',
    rating: 5.0,
    reviewsCount: 96,
    specs: ['Banho Ouro 24K', 'Fibra Carbono', 'Realeza Aero']
  },
  {
    id: 'green',
    name: 'Quasar Ácido',
    category: 'skin',
    description: 'Camuflagem militar de alta visibilidade tática carregada de energia radioativa pulsante.',
    priceType: 'co',
    price: 150,
    previewColorGradient: 'from-[#00ff87] to-[#60efff]',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    rating: 4.6,
    reviewsCount: 78,
    specs: ['Tático Radioativo', 'Neon Fluorescente', 'Blindagem Reforçada']
  },
  {
    id: 'dark',
    name: 'Sombra de Elite',
    category: 'skin',
    description: 'Chassi invisível em fibra de carbono fosca preta com frisos fluorescentes vermelhos de combate esportivo.',
    priceType: 'rc',
    price: 12.00,
    originalPrice: 15.00,
    previewColorGradient: 'from-[#141416] to-[#ff2d55]',
    bgColor: 'bg-zinc-800/20 border-zinc-700/30',
    badge: 'Best Seller',
    rating: 4.9,
    reviewsCount: 562,
    specs: ['Ocultação Stealth', 'Preto Fosco Carbono', 'Chassis Ultraleve']
  },
  {
    id: 'soberano',
    name: 'Soberano Dourado',
    category: 'skin',
    description: 'O caça lendário mais cobiçado da galáxia. Fuselagem de titânio negro realçado com rastro de poeira estelar de ouro puro e brasão de realeza aeroespacial.',
    priceType: 'rc',
    price: 25.00,
    originalPrice: 35.00,
    previewColorGradient: 'from-[#ffe45c] via-[#dca817] to-[#111018]',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    badge: 'Lendário',
    rating: 5.0,
    reviewsCount: 120,
    specs: ['Banhado a Ouro Real', 'Propulsão Stardust', 'Cristais de Energia']
  },
  {
    id: 'aerobrasil',
    name: 'AeroBrasil',
    category: 'skin',
    description: 'Chassi do patriota espacial. Aerodinâmica pintada com as cores nacionais, rastro tático de propulsão solar brilhante e o tradicional brasão de estrelas do Brasil.',
    priceType: 'co',
    price: 350,
    previewColorGradient: 'from-[#009b3a] via-[#fdf11e] to-[#002776]',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    badge: 'Exclusivo BR',
    rating: 4.9,
    reviewsCount: 247,
    specs: ['Pintura Brasílis', 'Poeira de Estrelas BR', 'Turbo Canarinho']
  },

  // --- FLOATS ---
  {
    id: 'pack_start',
    name: 'Pacote Piloto Iniciante',
    category: 'flight',
    description: 'Ideal para turbinar seus primeiros voos sem pôr suas economias diretas na pista.',
    priceType: 'rc',
    price: 10.00,
    quantity: 10,
    valueInfo: 'Receba R$ 10,00 de bônus em formato de 10 rodadas seguras',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    badge: 'Iniciante',
    rating: 4.4,
    reviewsCount: 145,
    specs: ['10 Voos Qualificados', 'Excelente para Testes', 'Retorno de Alta Chance']
  },
  {
    id: 'pack_pro',
    name: 'Pacote Piloto Profissional',
    category: 'flight',
    description: 'O preferido dos estrategistas. Desbloqueie vantagens táticas e voe como um pro.',
    priceType: 'rc',
    price: 22.50,
    originalPrice: 25.00,
    quantity: 25,
    valueInfo: 'Receba R$ 25,00 em voos (10% de economia direta!).',
    bgColor: 'bg-[#e51a31]/10 border-[#e51a31]/20',
    badge: 'Mais Vendido',
    rating: 4.8,
    reviewsCount: 389,
    specs: ['25 Voos Qualificados', '10% OFF Economia', 'Ideal para Estratégia']
  },
  {
    id: 'pack_captain',
    name: 'Pacote Comandante VIP',
    category: 'flight',
    description: 'Máximo poder de decolagem. Indicado para quem busca multiplicar alto de forma segura.',
    priceType: 'rc',
    price: 40.00,
    originalPrice: 50.00,
    quantity: 50,
    valueInfo: 'Receba R$ 50,00 em voos (Incríveis 20% de desconto!).',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    badge: 'Melhor Custo x Benefício',
    rating: 4.9,
    reviewsCount: 212,
    specs: ['50 Voos Qualificados', '20% OFF Economia', 'Selo VIP Aerocafé']
  },

  // --- COINS ---
  {
    id: 'coin_bronze',
    name: 'Câmbio Bronze (200 Aerocoins)',
    category: 'coin',
    description: 'Economia pequena rápida para entrar nas primeiras ligas de AeroFantasy.',
    priceType: 'rc',
    price: 2.00,
    coinsCount: 200,
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    rating: 4.2,
    reviewsCount: 88,
    specs: ['🪙 200 Moedas', 'Ativação Instantânea', 'Fácil Acesso']
  },
  {
    id: 'coin_silver',
    name: 'Câmbio Prata (550 Aerocoins)',
    category: 'coin',
    description: 'Câmbio intermediário com incentivo de bônus promocional para voar alto.',
    priceType: 'rc',
    price: 5.00,
    originalPrice: 5.50,
    coinsCount: 550,
    badge: '10% Bônus',
    bgColor: 'bg-slate-300/10 border-slate-300/20',
    rating: 4.7,
    reviewsCount: 194,
    specs: ['🪙 550 Moedas', '10% Bônus Embutido', 'Mais Popular para Torneios']
  },
  {
    id: 'coin_gold',
    name: 'Câmbio Ouro (1200 Aerocoins)',
    category: 'coin',
    description: 'Excelente volume de Aerocoins para assinar multi-times e comprar skins cosméticas.',
    priceType: 'rc',
    price: 10.00,
    originalPrice: 12.00,
    coinsCount: 1200,
    badge: '20% Bônus',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    rating: 4.9,
    reviewsCount: 301,
    specs: ['🪙 1200 Moedas', '20% Bônus Embutido', 'Melhor Valor Torneios']
  },
  {
    id: 'coin_vessel',
    name: 'Câmbio Tesouro Especial (2600 Aerocoins)',
    category: 'coin',
    description: 'O maior cofre de moedas para quem quer dominar os rankings semanais do AeroFantasy.',
    priceType: 'rc',
    price: 20.00,
    originalPrice: 26.00,
    coinsCount: 2600,
    badge: '30% Especial',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    rating: 5.0,
    reviewsCount: 154,
    specs: ['🪙 2600 Moedas', '30% Super Bônus', 'Suporte Prioritário VIP']
  }
];

const CUSTOMER_REVIEWS = [
  {
    name: 'Rodrigo M.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    rating: 5,
    date: 'Ontem',
    comment: 'Comprei a skin Sombra de Elite e o Pacote Pro de Voos. A camuflagem é incrivelmente linda na decolagem, e os 25 voos me renderam mais de R$ 80 em cashouts na hora certa!'
  },
  {
    name: 'Juliana P.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    rating: 5,
    date: '3 dias atrás',
    comment: 'O câmbio de 2600 moedas foi super rápido. Já usei para escalar meu time no AeroFantasy da rodada da Libertadores e estou em segundo no ranking. Recomendo muito a loja!'
  },
  {
    name: 'Leandro F.',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
    rating: 4.8,
    date: '1 semana atrás',
    comment: 'Design e checkout estilo e-commerce ficaram fantásticos! Saldo real desconta na hora e as skins ficam liberadas imediatamente para jogar. Parabéns pela facilidade!'
  }
];

const FAQS = [
  {
    question: 'Como as skins/camuflagens afetam meu caça no jogo?',
    answer: 'As camuflagens alteram o visual estético e o rastro luminoso em tempo real no painel de decolagem. Elas não alteram a física ou os algoritmos do jogo, garantindo total justiça e fair-play a todos os jogadores.'
  },
  {
    question: 'O que são e como uso os Pacotes de Voos Grátis?',
    answer: 'Os Voos Grátis agem como bônus protegidos. Cada Voo permite decolar um valor pre-estipulado de aposta real. Se você fizer o cashout de sucesso, o lucro é seu em saldo real líquido! Se o avião voar longe sem cashout, você não perde seu saldo principal.'
  },
  {
    question: 'Como posso obter Aerocoins?',
    answer: 'Você pode ganhar Aerocoins subindo de nível, completando missões em tempo real, conquistando conquistas especiais ou utilizando a aba "Câmbio de Moedas" para trocar saldo real por fichas instantaneamente.'
  }
];

const StoreModal: React.FC<StoreModalProps> = ({
  onClose,
  balance,
  onUpdateBalance,
  aerocoinBalance,
  onUpdateAerocoinBalance,
  freeFlights,
  onUpdateFreeFlights,
  activeSkin,
  onChangeSkin,
  unlockedSkins,
  onUnlockSkin,
  handleAddNotification,
  isInline = false
}) => {
  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'all' | 'skins' | 'flights' | 'coins' | 'inventory'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc' | 'rating'>('default');

  // Hero Carousel State
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout Processing Dialog
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'pix' | 'card'>('balance');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'summary' | 'processing' | 'done'>('summary');
  const [pixQRCodeVisible, setPixQRCodeVisible] = useState(false);

  // FAQ Accordions State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Promos
  const HERO_PROMOS = [
    {
      title: 'PROMOÇÃO DE ELITE',
      headline: 'Liberte a Sombra de Elite',
      desc: 'Blindagem de carbono fosca premium e rastro de plasma pulsante por apenas R$ 12,00.',
      buttonText: 'Garantir Agora',
      targetId: 'dark',
      colorTheme: 'from-zinc-900 to-red-950',
      badgeColor: 'bg-red-500'
    },
    {
      title: 'CÂMBIO ACELERADO',
      headline: 'Super Bônus de +30% Aerocoins',
      desc: 'Pacote Especial de 2600 moedas para investir em escalações do AeroFantasy.',
      buttonText: 'Adquira Já',
      targetId: 'coin_vessel',
      colorTheme: 'from-amber-950 to-[#27160c]',
      badgeColor: 'bg-amber-500'
    },
    {
      title: 'VOOS DE GRAÇA',
      headline: 'VIP Comandante 20% OFF',
      desc: 'Adquira 50 decolagens seguras por apenas R$ 40,00 e amplie seu plano de voo!',
      buttonText: 'Conquistar VIP',
      targetId: 'pack_captain',
      colorTheme: 'from-[#0b1a28] to-[#12283e]',
      badgeColor: 'bg-[#34b1e2]'
    }
  ];

  const [customSkinsList, setCustomSkinsList] = useState<CustomSkin[]>([]);

  React.useEffect(() => {
    setCustomSkinsList(getCustomSkins());
  }, []);

  const allProducts = useMemo(() => [...PRODUCTS_LIST, ...customSkinsList], [customSkinsList]);

  // Filter & Search & Sort logic
  const filteredProducts = useMemo(() => {
    let list = [...allProducts];

    // Filter by Tab
    if (activeTab === 'skins') {
      list = list.filter(p => p.category === 'skin');
    } else if (activeTab === 'flights') {
      list = list.filter(p => p.category === 'flight');
    } else if (activeTab === 'coins') {
      list = list.filter(p => p.category === 'coin');
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    // Sort order
    if (sortBy === 'priceAsc') {
      list.sort((a, b) => {
        // Equalize Real cash with arbitrary skin conversion for simple sort
        const ap = a.priceType === 'co' ? a.price / 15 : a.price;
        const bp = b.priceType === 'co' ? b.price / 15 : b.price;
        return ap - bp;
      });
    } else if (sortBy === 'priceDesc') {
      list.sort((a, b) => {
        const ap = a.priceType === 'co' ? a.price / 15 : a.price;
        const bp = b.priceType === 'co' ? b.price / 15 : b.price;
        return bp - ap;
      });
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [activeTab, searchQuery, sortBy]);

  // Purchase Actions
  const startPurchase = (product: StoreProduct) => {
    // If it is skin and already unlocked, warn and equip instead
    if (product.category === 'skin' && unlockedSkins.includes(product.id)) {
      onChangeSkin(product.id);
      handleAddNotification('Skin Equipada', `${product.name} está ativa na pista de decolagem!`, 'success');
      return;
    }

    setCart([{ product, quantity: 1 }]);
    setIsCheckoutOpen(true);
    setCheckoutStep('summary');
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          // Skin is max 1
          if (item.product.category === 'skin' && newQty > 1) {
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
    });
  };

  const cartTotal = useMemo(() => {
    let rcTotal = 0;
    let coTotal = 0;

    cart.forEach(item => {
      const p = item.product;
      if (p.priceType === 'rc') {
        rcTotal += p.price * item.quantity;
      } else {
        coTotal += p.price * item.quantity;
      }
    });

    return { rcTotal, coTotal };
  }, [cart]);

  // Execute actual transactions on checkout
  const handleFinalizeCheckout = () => {
    if (cart.length === 0) return;

    const { rcTotal, coTotal } = cartTotal;

    // Check constraints before processing
    if (paymentMethod === 'balance') {
      if (balance < rcTotal) {
        handleAddNotification('Saldo de Conta Insuficiente', `Seu saldo real de R$ ${balance.toFixed(2)} é inferior ao total necessário de R$ ${rcTotal.toFixed(2)}. Escolha PIX ou mude de método.`, 'warning');
        return;
      }
    }

    if (aerocoinBalance < coTotal) {
      handleAddNotification('Aerocoins Insuficientes', `Você possui 🪙 ${aerocoinBalance} que é menor que as moedas necessárias (🪙 ${coTotal}).`, 'warning');
      return;
    }

    // Switch to step processing
    setCheckoutStep('processing');
    setIsProcessingCheckout(true);

    setTimeout(() => {
      // Execute the real state manipulations
      if (paymentMethod === 'balance') {
        onUpdateBalance(prev => prev - rcTotal);
      }
      
      onUpdateAerocoinBalance(prev => prev - coTotal);

      // Distribute bought items
      cart.forEach(item => {
        const p = item.product;
        const qty = item.quantity;

        if (p.category === 'skin') {
          onUnlockSkin(p.id);
          onChangeSkin(p.id);
        } else if (p.category === 'flight') {
          const packItem = p as FlightPackItem;
          onUpdateFreeFlights(prev => prev + (packItem.quantity * qty));
        } else if (p.category === 'coin') {
          const coinItem = p as CoinsPackItem;
          onUpdateAerocoinBalance(prev => prev + (coinItem.coinsCount * qty));
        }
      });

      // Show success
      setIsProcessingCheckout(false);
      setCheckoutStep('done');
      handleAddNotification('Compra Aprovada!', 'E-commerce do AeroFLA concluiu seu pedido com sucesso! Seus itens foram entregues.', 'success');
    }, 2500);
  };

  const clearPurchaseSuccess = () => {
    setCart([]);
    setIsCheckoutOpen(false);
    setCheckoutStep('summary');
  };

  const handleHeroAction = (targetId: string) => {
    const targetProduct = allProducts.find(p => p.id === targetId);
    if (targetProduct) {
      startPurchase(targetProduct);
    }
  };

  const renderStoreBody = () => {
    return (
      <div className={isInline 
        ? "relative w-full bg-[#0b0c0d] rounded-2xl border border-white/5 overflow-hidden shadow-2xl flex flex-col min-h-[600px] text-white"
        : "relative w-full max-w-5xl bg-[#0b0c0d] rounded-[32px] border border-white/10 overflow-hidden shadow-[2xl] flex flex-col max-h-[95vh] text-white"
      }>
        {/* Glow Header */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#e51a31]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[20%] left-[-100px] w-96 h-96 bg-[#34b1e2]/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* TOP COMPACT BRAND HEADER */}
        <div className="p-4 md:p-6 flex flex-wrap items-center justify-between border-b border-white/5 gap-4 relative z-10 bg-black/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#e51a31] to-red-600 flex items-center justify-center font-black text-xl italic text-white shadow-lg shadow-red-600/20 select-none">
              A
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black italic bg-red-600 text-white px-2 py-0.5 rounded leading-none uppercase tracking-wider">MERCADO</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold text-[#e51a31] uppercase tracking-widest leading-none">LOJA ORIGINAL</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black italic tracking-tighter leading-none text-white">
                AEROFLA <span className="text-[#e51a31] font-extrabold text-lg">E-COMMERCE</span>
              </h2>
            </div>
          </div>

          {/* Floaters of user assets */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs">
            <div className="px-3.5 py-2 bg-gradient-to-r from-emerald-950/40 to-emerald-900/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
              <span className="text-[9px] font-black text-emerald-500 font-mono uppercase">Carteira</span>
              <span className="font-mono font-black text-emerald-400">R$ {balance.toFixed(2)}</span>
            </div>
            <div className="px-3.5 py-2 bg-gradient-to-r from-orange-950/40 to-orange-950/10 border border-orange-500/20 rounded-xl flex items-center gap-2">
              <span className="text-[9px] font-black text-amber-500 font-mono uppercase">Aerocoins</span>
              <span className="font-mono font-black text-amber-400">🪙 {aerocoinBalance}</span>
            </div>
            <div className="px-3.5 py-2 bg-gradient-to-r from-sky-950/40 to-sky-950/10 border border-sky-500/20 rounded-xl flex items-center gap-2">
              <span className="text-[9px] font-black text-sky-500 font-mono uppercase">Voos</span>
              <span className="font-mono font-black text-sky-400">🎟️ {freeFlights}</span>
            </div>

            {!isInline && (
              <button onClick={onClose} className="p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* MAIN CONTAINER */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6 relative z-10">
          
          {/* HERO BANNER SLIDER */}
          {activeTab !== 'inventory' && (
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/5">
              <div className={`p-6 md:p-10 bg-gradient-to-r ${HERO_PROMOS[currentPromoIndex].colorTheme} text-left flex flex-col justify-between md:h-52 min-h-[160px] relative transition-all duration-700`}>
                <div className="absolute top-0 right-0 w-80 h-full opacity-25 flex items-center justify-center">
                  <svg width="240" height="240" viewBox="0 0 100 100" className="text-white transform rotate-12">
                    <path d="M50,15 L62,45 L90,45 L65,60 L75,90 L50,70 L25,90 L35,60 L10,45 L38,45 Z" fill="currentColor" />
                  </svg>
                </div>

                <div className="max-w-lg space-y-2 relative z-10">
                  <span className={`text-[8px] font-black tracking-widest ${HERO_PROMOS[currentPromoIndex].badgeColor} text-white px-2 py-0.5 rounded uppercase font-mono`}>
                    {HERO_PROMOS[currentPromoIndex].title}
                  </span>
                  <h3 className="text-2xl md:text-3.5xl font-black italic uppercase leading-none tracking-tight text-white drop-shadow">
                    {HERO_PROMOS[currentPromoIndex].headline}
                  </h3>
                  <p className="text-xs text-white/70 max-w-md font-semibold leading-relaxed">
                    {HERO_PROMOS[currentPromoIndex].desc}
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-4 md:mt-0 relative z-10">
                  <button 
                    onClick={() => handleHeroAction(HERO_PROMOS[currentPromoIndex].targetId)}
                    className="px-5 py-2.5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    {HERO_PROMOS[currentPromoIndex].buttonText}
                  </button>
                  <div className="flex gap-1.5">
                    {HERO_PROMOS.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setCurrentPromoIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentPromoIndex ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/50'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STORE CONTROLS: TABS, SEARCH & FILTER */}
          <div className="bg-[#101113]/80 p-4 rounded-2xl border border-white/5 relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${activeTab === 'all' ? 'bg-[#e51a31] text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              >
                🌍 Ver Tudo
              </button>
              <button 
                onClick={() => {
                  setActiveTab('skins');
                  setSearchQuery('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${activeTab === 'skins' ? 'bg-[#e51a31] text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              >
                ✈️ Skins
              </button>
              <button 
                onClick={() => {
                  setActiveTab('flights');
                  setSearchQuery('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${activeTab === 'flights' ? 'bg-[#e51a31] text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              >
                🎟️ Voos Grátis
              </button>
              <button 
                onClick={() => {
                  setActiveTab('coins');
                  setSearchQuery('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${activeTab === 'coins' ? 'bg-[#e51a31] text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              >
                🪙 Aerocoins
              </button>
              <button 
                onClick={() => {
                  setActiveTab('inventory');
                  setSearchQuery('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${activeTab === 'inventory' ? 'bg-amber-500 text-black font-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              >
                📦 Meus Itens
              </button>
            </div>

            {/* Global Search and Select sorting */}
            {activeTab !== 'inventory' ? (
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                
                <div className="relative flex-1 md:w-56">
                  <input 
                    type="text" 
                    placeholder="Pesquisar produto..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#17181c] border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#e51a31] pl-9 tracking-tight"
                  />
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-3.5 top-3.5 text-white/40"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>

                <select 
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-[#17181c] border border-white/5 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#e51a31] tracking-tight shrink-0"
                >
                  <option value="default">Relevância</option>
                  <option value="priceAsc">Menor Preço</option>
                  <option value="priceDesc">Maior Preço</option>
                  <option value="rating">Classificação ⭐</option>
                </select>
              </div>
            ) : (
              <div className="text-right text-[10px] text-amber-500 font-black uppercase tracking-widest font-mono shrink-0 py-1 border-b border-amber-500/10">
                🛡️ HANGAR DE OPERAÇÕES DO PILOTO
              </div>
            )}

          </div>

          {/* PRODUCTS E-COMMERCE GRID OR INVENTORY SCREEN */}
          {activeTab === 'inventory' ? (
            <div className="space-y-6 relative z-10 w-full text-left">
              
              {/* Pilot Stat Cards Board */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Stat 1: Skins Counter */}
                <div className="bg-[#121315] rounded-2xl border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
                  <div className="absolute -right-3 -bottom-3 text-white/[0.02] text-7xl font-sans font-black select-none pointer-events-none group-hover:text-white/[0.03] transition-colors leading-none">
                    ✈️
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest block mb-1">Camuflagens Unificadas</span>
                    <h3 className="text-2xl font-black font-mono text-white leading-none">
                      {unlockedSkins.length} <span className="text-xs text-white/40 font-semibold font-sans">/ {allProducts.filter(p => p.category === 'skin').length}</span>
                    </h3>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${(unlockedSkins.length / Math.max(1, allProducts.filter(p => p.category === 'skin').length)) * 100}%` }}
                      />
                    </div>
                    <span className="text-[8px] font-bold text-amber-500/80 uppercase tracking-widest mt-1 block">
                      {Math.round((unlockedSkins.length / Math.max(1, allProducts.filter(p => p.category === 'skin').length)) * 100)}% Desbloqueado
                    </span>
                  </div>
                </div>

                {/* Stat 2: Free Flights */}
                <div className="bg-[#121315] rounded-2xl border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden group hover:border-[#e51a31]/20 transition-all duration-300">
                  <div className="absolute -right-2 -bottom-2 text-white/[0.02] text-7xl font-sans font-black select-none pointer-events-none group-hover:text-white/[0.03] transition-colors leading-none">
                    🎟️
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest block mb-1">Passagens de Voo Ativas</span>
                    <h3 className="text-2xl font-black font-mono text-sky-400 leading-none">
                      {freeFlights} <span className="text-xs text-white/40 font-semibold font-sans">vouchers</span>
                    </h3>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[8px] font-bold text-sky-400/80 uppercase tracking-widest block leading-none">Voe com segurança</span>
                    <button 
                      onClick={() => {
                        if (freeFlights > 0) {
                          onClose();
                          handleAddNotification('Dica de Pilotagem', 'Escolha a opção Rodada de Voo Grátis para usar seu saldo!', 'info');
                        } else {
                          setActiveTab('flights');
                        }
                      }}
                      className="px-2 py-1 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 text-[8px] font-black uppercase tracking-wider rounded-lg transition-colors select-none cursor-pointer"
                    >
                      {freeFlights > 0 ? "Usar Agora 🚀" : "Obter Mais"}
                    </button>
                  </div>
                </div>

                {/* Stat 3: Aerocoins Balance */}
                <div className="bg-[#121315] rounded-2xl border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/20 transition-all duration-300">
                  <div className="absolute -right-3 -bottom-3 text-white/[0.02] text-7xl font-sans font-black select-none pointer-events-none group-hover:text-white/[0.03] transition-colors leading-none">
                    🪙
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest block mb-1">Caixa de Aerocoins</span>
                    <h3 className="text-2xl font-black font-mono text-orange-400 leading-none">
                      {aerocoinBalance} <span className="text-xs text-white/40 font-semibold font-sans font-mono">INS</span>
                    </h3>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[8px] font-bold text-orange-400/80 uppercase tracking-widest block leading-none">Fórmula Fantasy ativa</span>
                    <button 
                      onClick={() => setActiveTab('skins')}
                      className="px-2 py-1 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 text-[8px] font-black uppercase tracking-wider rounded-lg transition-colors select-none cursor-pointer"
                    >
                      Trocar por Skins
                    </button>
                  </div>
                </div>

                {/* Stat 4: Account Cash Balance */}
                <div className="bg-[#121315] rounded-2xl border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
                  <div className="absolute -right-3 -bottom-3 text-white/[0.02] text-7xl font-sans font-black select-none pointer-events-none group-hover:text-white/[0.03] transition-colors leading-none">
                    💰
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest block mb-1">Saldo Real de Depósito</span>
                    <h3 className="text-2xl font-black font-mono text-emerald-400 leading-none">
                      R$ {balance.toFixed(2)}
                    </h3>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[8px] font-bold text-emerald-400/80 uppercase tracking-widest block leading-none">PIX Instantâneo</span>
                    <button 
                      onClick={() => setActiveTab('coins')}
                      className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[8px] font-black uppercase tracking-wider rounded-lg transition-colors select-none cursor-pointer"
                    >
                      Adicionar Saldo
                    </button>
                  </div>
                </div>

              </div>

              {/* Title Section for Skins Collection */}
              <div className="pt-2 border-b border-white/5 pb-2 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase italic text-white tracking-widest">
                    🎨 Minhas Skins e Personalização de Caça
                  </h4>
                  <p className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">Selecione e mude o design do seu jato instantaneamente para o jogo.</p>
                </div>
                <span className="text-[9px] font-black uppercase font-mono text-amber-500">
                  TOTAL: {allProducts.filter(p => p.category === 'skin').length} DESIGN(S)
                </span>
              </div>

              {/* Grid lists of Skins */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allProducts.filter(p => p.category === 'skin').map((skin) => {
                  const isOwned = unlockedSkins.includes(skin.id);
                  const isActive = activeSkin === skin.id;

                  return (
                    <div 
                      key={skin.id}
                      className={`bg-[#121315] rounded-3xl border ${
                        isActive
                          ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/[0.03]'
                          : isOwned
                          ? 'border-white/5 hover:border-white/15'
                          : 'border-white/5 opacity-60'
                      } p-4.5 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 relative group`}
                    >
                      {/* Active glowing border indicator */}
                      {isActive && (
                        <div className="absolute -inset-px border border-emerald-500/30 rounded-3xl pointer-events-none animate-pulse" />
                      )}

                      {/* Header badge */}
                      {!isOwned && (
                        <span className="absolute top-3.5 right-3.5 bg-zinc-850 border border-white/5 text-white/40 text-[8px] font-black tracking-widest px-2 py-0.5 rounded leading-none uppercase select-none z-20 font-mono">
                          🔒 BLOQUEADO
                        </span>
                      )}
                      {isOwned && isActive && (
                        <span className="absolute top-3.5 right-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[8px] font-black tracking-widest px-2 py-0.5 rounded leading-none uppercase shadow shadow-emerald-500/20 select-none z-20 font-mono">
                          ● EQUIPADO
                        </span>
                      )}
                      {isOwned && !isActive && (
                        <span className="absolute top-3.5 right-3.5 bg-indigo-950 border border-indigo-500/30 text-indigo-300 text-[8px] font-black tracking-widest px-2 py-0.5 rounded leading-none uppercase select-none z-20 font-mono">
                          Disponível
                        </span>
                      )}

                      <div className="space-y-4">
                        {/* 3D Visual container (Exclusividade de Avião Premium) */}
                        <div className="w-full h-52 bg-gradient-to-b from-[#0e1014] to-[#050608] rounded-2xl relative overflow-hidden flex items-center justify-center border border-amber-500/10 group-hover:border-amber-500/30 transition-all duration-500 shadow-2xl group shadow-black/80">
                          {/* Rich background details */}
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px] opacity-40" />
                          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 to-transparent z-10" />
                          <div className="absolute top-2 left-3 text-[7px] font-mono text-white/15 uppercase tracking-[0.2em] select-none pointer-events-none">Série Aerofla Pro</div>
                          
                          <div className="w-full h-full flex items-center justify-center relative p-2 overflow-hidden bg-transparent">
                            {/* Massive background glow */}
                            <div className={`absolute w-44 h-44 rounded-full bg-gradient-to-br ${skin.previewColorGradient} opacity-40 filter blur-3xl ${isOwned ? 'animate-pulse' : 'brightness-50'}`} />
                            
                            <img
                              src={skin.id.startsWith('custom_') ? (getCustomSkinImage(skin.id) || '/images/skin_aerobrasil.png') : `/images/skin_${skin.id}.png`}
                              alt={skin.name}
                              referrerPolicy="no-referrer"
                              className={`w-40 h-40 object-contain mix-blend-screen filter drop-shadow-[0_12px_24px_rgba(0,0,0,1)] group-hover:scale-125 transition-transform duration-500 select-none pointer-events-none z-20 ${
                                isOwned ? '' : 'grayscale contrast-125 brightness-40'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Title and Specs */}
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-white hover:text-emerald-400 transition-colors uppercase italic flex items-center gap-1.5">
                            {skin.name}
                          </h4>
                          <p className="text-[10px] text-white/50 leading-relaxed font-semibold h-9 overflow-hidden">
                            {skin.description}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {skin.specs.slice(0, 2).map((sp, idx) => (
                              <span key={idx} className="bg-white/[0.04] text-white/40 text-[8px] px-1.5 py-0.5 rounded">
                                {sp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action trigger button */}
                      <div className="mt-4 border-t border-white/5 pt-3">
                        {isActive ? (
                          <button 
                            disabled 
                            className="w-full py-2 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 cursor-not-allowed text-center select-none"
                          >
                            Ativo no Hangar
                          </button>
                        ) : isOwned ? (
                          <button 
                            onClick={() => {
                              onChangeSkin(skin.id);
                              handleAddNotification('Skin Selecionada', `A blindagem ${skin.name} foi devidamente equipada!`, 'success');
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-emerald-500/10 text-center"
                          >
                            Equipar Visual ⚡
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setActiveTab('skins');
                              handleAddNotification('Redirecionado', `Adquira a skin ${skin.name} na loja principal!`, 'info');
                            }}
                            className="w-full py-2 bg-gradient-to-r from-red-600 to-[#e51a31] hover:brightness-110 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-[0.98] cursor-pointer text-center"
                          >
                            Comprar na Loja ({skin.priceType === 'co' ? `🪙 ${skin.price}` : `R$ ${skin.price.toFixed(2)}`})
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <>
              {/* PRODUCTS E-COMMERCE GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const isSkinUnlocked = p.category === 'skin' && unlockedSkins.includes(p.id);
                    const isSkinActive = p.category === 'skin' && activeSkin === p.id;
                    
                    return (
                      <div 
                        key={p.id}
                        className="bg-[#121315] rounded-3xl border border-white/5 p-4.5 flex flex-col justify-between hover:border-white/15 transition-all duration-300 relative group"
                      >
                        
                        {/* Badge alert / original price badge */}
                        {p.badge && (
                          <span className="absolute top-3.5 right-3.5 bg-gradient-to-r from-red-600 to-[#e51a31] text-[8px] font-black tracking-widest text-white px-2 py-0.5 rounded leading-none uppercase shadow-md select-none z-20">
                            {p.badge}
                          </span>
                        )}

                        <div className="space-y-4">
                          {/* Product Visual Container (Exclusividade de Avião Premium) */}
                          <div className="w-full h-56 bg-gradient-to-b from-[#0e1014] to-[#050608] rounded-2xl relative overflow-hidden flex items-center justify-center border border-amber-500/10 group-hover:border-amber-500/30 transition-all duration-500 shadow-2xl group shadow-black/80">
                            
                            {/* Rich background details */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px] opacity-40" />
                            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 to-transparent z-10" />
                            <div className="absolute top-2 left-3 text-[7px] font-mono text-white/15 uppercase tracking-[0.2em] select-none pointer-events-none">Aeronave Exclusiva</div>
                            
                            {p.category === 'skin' ? (
                              <div className="w-full h-full flex items-center justify-center relative p-2 overflow-hidden bg-transparent">
                                {/* Massive background glow */}
                                <div className={`absolute w-48 h-48 rounded-full bg-gradient-to-br ${(p as SkinItem).previewColorGradient} opacity-40 filter blur-3xl animate-pulse`} />
                                
                                <img
                                  src={p.id.startsWith('custom_') ? (getCustomSkinImage(p.id) || '/images/skin_aerobrasil.png') : `/images/skin_${p.id}.png`}
                                  alt={p.name}
                                  referrerPolicy="no-referrer"
                                  className="w-44 h-44 object-contain mix-blend-screen filter drop-shadow-[0_12px_24px_rgba(0,0,0,1)] group-hover:scale-125 transition-transform duration-500 select-none pointer-events-none z-20"
                                />
                              </div>
                            ) : p.category === 'flight' ? (
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-sky-600/30 border border-sky-500/20 flex flex-col items-center justify-center shadow-lg relative gap-1">
                                <span className="text-3xl">🎟️</span>
                                <span className="text-[9px] font-black text-sky-400 font-mono tracking-tighter">{(p as FlightPackItem).quantity} VOOS</span>
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-600/20 to-orange-600/30 border border-amber-500/20 flex flex-col items-center justify-center shadow-lg relative gap-1 animate-pulse">
                                <span className="text-3xl">🪙</span>
                                <span className="text-[9px] font-black text-orange-400 font-mono tracking-tighter">+{(p as CoinsPackItem).coinsCount} INS</span>
                              </div>
                            )}

                            {/* Equip Badge Overlay for active skins */}
                            {isSkinActive && (
                              <div className="absolute bottom-2 left-2 bg-[#e51a31] text-white text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded leading-none shadow">
                                Equipado Ativo
                              </div>
                            )}
                            {isSkinUnlocked && !isSkinActive && (
                              <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded leading-none shadow">
                                Adquirido
                              </div>
                            )}
                          </div>

                          {/* E-Commerce Product Metadata */}
                          <div className="space-y-1 text-left">
                            
                            {/* Categories and stars */}
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] uppercase tracking-widest font-black text-white/40">
                                {p.category === 'skin' ? '🌌 Cosméticos / Skins' : p.category === 'flight' ? '✈️ Combustível de Voo' : '💰 Câmbio Fichas'}
                              </span>
                              <div className="flex items-center gap-1 font-mono text-[9px] text-yellow-500">
                                <span>★</span>
                                <strong className="text-white/70">{p.rating.toFixed(1)}</strong>
                                <span className="text-white/30">({p.reviewsCount})</span>
                              </div>
                            </div>

                            <h4 className="text-sm font-black text-white group-hover:text-[#e51a31] transition-colors leading-tight tracking-tight uppercase italic flex items-center gap-1.5">
                              {p.name}
                            </h4>

                            <p className="text-[10px] text-white/50 leading-relaxed font-semibold h-9 overflow-hidden">
                              {p.description}
                            </p>

                            {/* Specs badges layout */}
                            <div className="flex flex-wrap gap-1 pt-1.5">
                              {p.specs.slice(0, 2).map((sp, idx) => (
                                <span key={idx} className="bg-white/[0.04] text-white/50 text-[8px] px-1.5 py-0.5 rounded">
                                  {sp}
                                </span>
                              ))}
                            </div>

                          </div>
                        </div>

                        {/* Price and Cart controls card foot */}
                        <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-between">
                          <div>
                            {p.originalPrice && (
                              <span className="block text-[9px] text-white/30 line-through leading-none font-mono">
                                {p.priceType === 'rc' ? `R$ ${p.originalPrice.toFixed(2)}` : `${p.originalPrice} Aerocoins`}
                              </span>
                            )}
                            <span className="text-sm font-bold font-mono text-white tracking-tight flex items-center gap-1">
                              {p.priceType === 'co' ? (
                                <>
                                  <span className="text-orange-400">🪙</span>
                                  <span className="text-orange-400 font-black">{p.price}</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-white">R$</span>
                                  <span className="text-white font-black">{p.price.toFixed(2)}</span>
                                </>
                              )}
                            </span>
                          </div>

                          {p.category === 'skin' && isSkinActive ? (
                            <button 
                              disabled 
                              className="px-3 py-1.5 bg-white/5 text-white/30 text-[9px] font-black uppercase tracking-wider rounded-lg cursor-not-allowed border border-white/5"
                            >
                              Ativo nos Voos
                            </button>
                          ) : p.category === 'skin' && isSkinUnlocked ? (
                            <button 
                              onClick={() => {
                                onChangeSkin(p.id);
                                handleAddNotification('Skin Selecionada', `A blindagem ${p.name} foi devidamente equipada!`, 'success');
                              }}
                              className="px-4.5 py-1.5 bg-[#e51a31] hover:bg-[#ff1f3a] text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer shadow-md shadow-[#e51a31]/20 border border-white/5"
                            >
                              Equipar Chassi
                            </button>
                          ) : (
                            <button 
                              onClick={() => startPurchase(p)}
                              className="px-4.5 py-1.5 bg-gradient-to-r from-red-600 to-[#e51a31] hover:brightness-110 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border border-white/5"
                            >
                              <span>🛒 Comprar</span>
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 py-12 text-center bg-[#131416]/50 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">🧩</span>
                    <h4 className="text-sm font-black text-white uppercase italic">Nenhum produto encontrado</h4>
                    <p className="text-[10px] text-white/50 max-w-xs font-semibold">Remova termos de busca ou mude a aba de categoria do mercado acima.</p>
                  </div>
                )}
              </div>

              {/* TWO PANEL SECTION: DEALS & CUSTOMER REVIEWS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10 font-sans text-white">
                
                {/* Reviews Side Carousel */}
                <div className="bg-[#101112] p-5 rounded-3xl border border-white/5 text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h4 className="text-xs font-black uppercase italic text-white tracking-widest flex items-center gap-1.5">
                      💬 Avaliações e Depoimentos Recentes
                    </h4>
                    <span className="text-[9px] text-emerald-400 font-black">• Certificadas de Clientes</span>
                  </div>

                  <div className="space-y-3.5">
                    {CUSTOMER_REVIEWS.map((rev, index) => (
                      <div key={index} className="bg-white/[0.02] p-3 rounded-xl border border-white/5 flex gap-3 text-xs">
                        <img src={rev.avatar} alt="User Avatar" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10" />
                        <div className="space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-bold text-white/80">{rev.name}</span>
                            <div className="flex gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={`text-[10px] ${i < Math.floor(rev.rating) ? 'text-yellow-500' : 'text-white/10'}`}>★</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-white/60 leading-normal font-semibold italic">
                            "{rev.comment}"
                          </p>
                          <div className="text-[8px] font-mono text-white/30 tracking-widest uppercase">{rev.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQs Accordion */}
                <div className="bg-[#101112] p-5 rounded-3xl border border-white/5 text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h4 className="text-xs font-black uppercase italic text-white tracking-widest">
                      💡 Central de Suporte e Perguntas Frequentes
                    </h4>
                    <span className="text-[9px] text-[#e51a31] font-black uppercase font-mono">Suporte 24/7</span>
                  </div>

                  <div className="space-y-2">
                    {FAQS.map((faq, index) => {
                      const isOpen = openFaqIndex === index;
                      return (
                        <div 
                          key={index} 
                          className="border border-white/5 rounded-xl overflow-hidden transition-colors"
                        >
                          <button 
                            onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                            className="w-full p-3.5 bg-white/[0.01] hover:bg-white/[0.04] transition-colors text-left font-bold text-[11px] text-white flex items-center justify-between gap-4"
                          >
                            <span className="uppercase tracking-tight leading-snug">{faq.question}</span>
                            <span className="text-[#e51a31] font-bold shrink-0">{isOpen ? '▼' : '▶'}</span>
                          </button>
                          
                          {isOpen && (
                            <div className="p-3.5 bg-black/40 border-t border-white/5 text-[10px] text-white/60 leading-relaxed font-semibold">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </>
          )}

        </div>

        {/* COMPACT FOOTER MARGIN WARNING */}
        <div className="p-4 bg-black/60 border-t border-white/5 text-center text-[9px] text-white/30 uppercase tracking-widest relative z-10 shrink-0 select-none">
          MERCADO AEROFLA • GARANTIA DE TRANSPARÊNCIA E DECOLARES PROTEGIDAS • ATIVAÇÃO DIRETA DO SALDO REAL E AEROCOIN.
        </div>



        {/* REALISTIC CHECKOUT SIMULATOR DIALOG */}
        <AnimatePresence>
          {isCheckoutOpen && (
            <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
              
              {/* Black backdrop block code */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (checkoutStep !== 'processing') setIsCheckoutOpen(false);
                }}
                className="absolute inset-0 bg-black/95 backdrop-blur-md"
              />

              {/* Checkout content card body */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-[#0e0f11] rounded-[24px] border border-white/10 overflow-hidden shadow-2xl flex flex-col text-left text-white z-[190]"
              >
                
                {/* Glowing alert headers */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#e51a31]/10 rounded-full blur-3xl pointer-events-none" />

                {/* Dynamic Content depending on steps */}
                {checkoutStep === 'summary' && (
                  <div className="p-6 md:p-8 space-y-6">
                    
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div>
                        <h4 className="text-base font-black uppercase italic tracking-wider text-white">CHECKOUT INTERATIVO</h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Selecione seu método de decolagem</p>
                      </div>
                      <button 
                        onClick={() => setIsCheckoutOpen(false)}
                        className="text-white/40 hover:text-white font-[9px] font-black uppercase cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    {/* Order summary list */}
                    <div className="space-y-2 bg-white/[0.01] border border-white/5 p-3.5 rounded-xl text-xs">
                      <span className="text-[9px] font-black text-white/40 uppercase font-mono block mb-1">Resumo das Aquisições</span>
                      {cart.map(item => {
                        const p = item.product;
                        return (
                          <div key={p.id} className="flex justify-between items-center text-white/80 gap-4">
                            <div className="flex flex-col">
                              <span className="font-semibold">{p.name}</span>
                              {p.category !== 'skin' && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <button
                                    onClick={() => updateCartQty(p.id, -1)}
                                    className="w-4.5 h-4.5 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-[10px] font-extrabold text-white cursor-pointer select-none"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono text-[10px] font-bold text-white min-w-4 text-center">{item.quantity}</span>
                                  <button
                                    onClick={() => updateCartQty(p.id, 1)}
                                    className="w-4.5 h-4.5 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-[10px] font-extrabold text-white cursor-pointer select-none"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                            <span className="font-mono text-white/80 text-[11px] shrink-0 font-bold">
                              {p.priceType === 'rc' ? `R$ ${(p.price * item.quantity).toFixed(2)}` : `🪙 ${p.price * item.quantity}`}
                            </span>
                          </div>
                        );
                      })}
                      
                      <div className="border-t border-white/5 mt-3 pt-2 flex justify-between items-center text-white text-xs font-black">
                        <span>SOMA DO PEDIDO</span>
                        <div className="text-right font-mono">
                          {cartTotal.coTotal > 0 && <span className="text-orange-400 block font-bold">🪙 {cartTotal.coTotal}</span>}
                          {cartTotal.rcTotal > 0 && <span className="text-emerald-400 block font-bold">R$ {cartTotal.rcTotal.toFixed(2)}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Choose Payment Method */}
                    <div className="space-y-2.5">
                      <span className="text-[9px] font-black text-white/40 uppercase font-mono block">Escolha o Meio de Pagamento</span>
                      
                      <div className="grid grid-cols-1 gap-2">
                        
                        {/* Option 1: Contas saldo */}
                        <button 
                          onClick={() => { setPaymentMethod('balance'); setPixQRCodeVisible(false); }}
                          className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                            paymentMethod === 'balance' 
                              ? 'bg-[#e51a31]/10 border-[#e51a31] text-white shadow-lg shadow-[#e51a31]/5' 
                              : 'bg-white/[0.01] border-white/5 text-white/60 hover:bg-white/[0.03] hover:text-white'
                          }`}
                        >
                          <div>
                            <h5 className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                              💳 Saldo Real da Conta
                            </h5>
                            <p className="text-[9px] text-white/40 font-semibold mt-1">
                              Descontar direto da sua carteira (Saldo Real: R$ {balance.toFixed(2)})
                            </p>
                          </div>
                          <span className="text-xs font-mono font-black text-emerald-400">Padrão</span>
                        </button>

                        {/* Option 2: PIX */}
                        <button 
                          onClick={() => { setPaymentMethod('pix'); setPixQRCodeVisible(true); }}
                          className={`p-3.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                            paymentMethod === 'pix' 
                              ? 'bg-[#34b1e2]/10 border-[#34b1e2] text-white shadow-lg shadow-[#34b1e2]/5' 
                              : 'bg-white/[0.01] border-white/5 text-white/60 hover:bg-white/[0.03] hover:text-white'
                          }`}
                        >
                          <div>
                            <h5 className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                              ⚡ PIX Instantâneo (Simulado)
                            </h5>
                            <p className="text-[9px] text-white/40 font-semibold mt-1">
                              Gerar QR Code PIX realista para aprovação simulada sem custos
                            </p>
                          </div>
                          <span className="text-[8px] bg-sky-500 text-white px-1.5 py-0.5 rounded font-black uppercase font-mono leading-none">Rápido</span>
                        </button>

                      </div>

                    </div>

                    {/* QR Code box when PIX selected */}
                    {pixQRCodeVisible && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 text-center space-y-3.5 flex flex-col items-center">
                        <div className="w-32 h-32 bg-white rounded-lg p-2.5 flex items-center justify-center relative shadow-xl">
                          {/* Simulated QR Code via SVG */}
                          <svg width="100%" height="100%" viewBox="0 0 100 100" className="text-black">
                            <rect x="0" y="0" width="100" height="100" fill="none" />
                            <rect x="5" y="5" width="25" height="25" fill="black" />
                            <rect x="10" y="10" width="15" height="15" fill="white" />
                            <rect x="70" y="5" width="25" height="25" fill="black" />
                            <rect x="75" y="10" width="15" height="15" fill="white" />
                            <rect x="5" y="70" width="25" height="25" fill="black" />
                            <rect x="10" y="75" width="15" height="15" fill="white" />
                            {/* Grid markers */}
                            <path d="M 40,10 H 60 M 45,15 H 55 M 40,20 H 60 M 10,40 V 60 M 20,45 V 55 M 40,40 H 90 M 40,50 H 70 M 50,60 H 90" fill="none" stroke="currentColor" strokeWidth="4" />
                            <path d="M 75,75 H 90 V 90 H 75 Z" fill="black" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-[#e51a31] uppercase tracking-widest block animate-pulse">Código Gerado Realista</span>
                          <button 
                            onClick={() => handleAddNotification('PIX Copiado', 'Link PIX realista copiado para sua área de transferência!', 'success')}
                            className="text-[9px] text-[#34b1e2] hover:underline font-bold uppercase tracking-widest block bg-[#34b1e2]/15 px-3 py-1 rounded-lg"
                          >
                            Copiar código copia-e-cola 📋
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Footer buttons pay */}
                    <button 
                      onClick={handleFinalizeCheckout}
                      className="w-full py-4 text-center text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-600/10 hover:shadow-emerald-600/30 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Confirmar e Finalizar Pedido 🚀</span>
                    </button>

                  </div>
                )}

                {checkoutStep === 'processing' && (
                  <div className="p-8 text-center space-y-6 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-4 border-[#e51a31]/20 border-t-[#e51a31] animate-spin flex items-center justify-center text-xl select-none">
                      🛸
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-base font-black uppercase italic tracking-wider text-white">Processando Aquisição...</h4>
                      <p className="text-[10px] text-white/50 max-w-xs mx-auto font-semibold leading-relaxed">
                        Estamos validando seus saldos seguros da carteira e transferindo camuflagens/bilhetes para seu cockpit.
                      </p>
                    </div>

                    {/* Linear progress bar */}
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.2, ease: 'easeInOut' }}
                        className="h-full bg-[#e51a31]"
                      />
                    </div>
                    
                    <span className="text-[8px] text-white/30 tracking-widest uppercase font-mono">Selo de Proteção Banco AeroFLA</span>
                  </div>
                )}

                {checkoutStep === 'done' && (
                  <div className="p-8 text-center space-y-6 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-3xl">
                      ✓
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-lg font-black uppercase italic tracking-wider text-emerald-400">COMPRA CONCLUÍDA!</h4>
                      <p className="text-[11px] text-white/50 max-w-xs mx-auto font-semibold leading-relaxed">
                        Parabéns! Seus novos cosméticos de caça, voos de rodadas grátis ou créditos foram depositados instantaneamente em seu perfil.
                      </p>
                    </div>

                    <button 
                      onClick={clearPurchaseSuccess}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-[#e51a31] hover:brightness-110 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                      Excelente, Retornar ao Hangar
                    </button>
                  </div>
                )}

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    );
  };

  if (isInline) {
    return renderStoreBody();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/92 backdrop-blur-md"
      />
      {renderStoreBody()}
    </div>
  );
};

export default StoreModal;
