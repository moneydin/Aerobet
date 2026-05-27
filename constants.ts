
export const COLORS = {
  bg: '#000000',
  card: '#1b1c1d',
  accent: '#e51a31', // Aviator Red
  green: '#28a745', // Aviator Green (Bet)
  orange: '#d97d1b', // Aviator Orange (Cashout)
  blue: '#34b1e2',
  purple: '#913ef2',
  pink: '#c111d7'
};

export const INITIAL_CASH = 3000.00;
export const MIN_BET = 1.00;
export const MAX_BET = 500.00;
export const TICK_RATE = 16; // 60 FPS para resposta instantânea
export const WAIT_TIME = 5000;

export const getMultiplierColor = (m: number) => {
  if (m < 2) return '#34b1e2'; // Blue
  if (m < 10) return '#913ef2'; // Purple
  return '#c111d7'; // Pink/Gold
};
