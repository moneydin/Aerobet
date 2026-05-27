
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameStatus, GameHistory } from '../types';

export const useAviator = (rtp: number = 97) => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.WAITING);
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(5000);
  const [nextRoundServerSeedHash, setNextRoundServerSeedHash] = useState('');
  
  const socketRef = useRef<Socket | null>(null);
  
  // Refs para cálculo local suave e preciso, minimizando dessincronia do React
  const flightStartTimeRef = useRef<number | null>(null);
  const countdownTargetRef = useRef<number | null>(null);

  useEffect(() => {
    const socketUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      path: '/socket.io'
    });
    socketRef.current = socket;

    socket.on('init', (data) => {
      setStatus(data.status);
      setMultiplier(data.multiplier);
      setCountdown(data.countdown);
      setNextRoundServerSeedHash(data.nextRoundServerSeedHash);

      if (data.status === GameStatus.FLYING && data.multiplier > 1.0) {
        // Alinhamento matemático perfeito usando o inverso da fórmula exponencial
        const calculatedElapsedMs = (1000 * Math.log(data.multiplier)) / Math.log(1.12);
        flightStartTimeRef.current = Date.now() - calculatedElapsedMs;
      } else if (data.status === GameStatus.WAITING) {
        countdownTargetRef.current = Date.now() + data.countdown;
      }
    });

    socket.on('game_tick', (data) => {
      // Sincronização suave contínua com compensação de jitter e latência (lerp suave do relógio)
      if (data.multiplier > 1.0) {
        const calculatedElapsedMs = (1000 * Math.log(data.multiplier)) / Math.log(1.12);
        const targetStartTime = Date.now() - calculatedElapsedMs;
        if (flightStartTimeRef.current === null) {
          flightStartTimeRef.current = targetStartTime;
        } else {
          const diff = Math.abs(flightStartTimeRef.current - targetStartTime);
          if (diff > 50) { // Evita pequenas oscilações de micro-jitter
            flightStartTimeRef.current = flightStartTimeRef.current * 0.90 + targetStartTime * 0.10;
          }
        }
      }
    });

    socket.on('game_countdown', (data) => {
      countdownTargetRef.current = Date.now() + data.countdown;
    });

    socket.on('game_waiting', (data) => {
      setStatus(GameStatus.WAITING);
      countdownTargetRef.current = Date.now() + data.countdown;
      flightStartTimeRef.current = null;
    });

    socket.on('game_start', (data) => {
      setStatus(GameStatus.FLYING);
      setMultiplier(1.00);
      flightStartTimeRef.current = Date.now();
      countdownTargetRef.current = null;
      setNextRoundServerSeedHash(data.nextRoundServerSeedHash);
    });

    socket.on('game_crashed', (data) => {
      setStatus(GameStatus.CRASHED);
      setMultiplier(data.multiplier);
      flightStartTimeRef.current = null;
      countdownTargetRef.current = null;
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Loop de renderização fluida em 60 FPS (requestAnimationFrame) para evitar travamentos
  useEffect(() => {
    let active = true;

    const frame = () => {
      if (!active) return;

      if (status === GameStatus.FLYING && flightStartTimeRef.current !== null) {
        const elapsed = (Date.now() - flightStartTimeRef.current) / 1000;
        const currentMultiplier = Math.pow(1.12, elapsed);
        setMultiplier(prev => {
          const nextVal = parseFloat(currentMultiplier.toFixed(2));
          // Impede estritamente regressão no multiplicador visual durante o voo
          return Math.max(prev, nextVal);
        });
      } else if (status === GameStatus.WAITING && countdownTargetRef.current !== null) {
        const remaining = Math.max(0, countdownTargetRef.current - Date.now());
        setCountdown(remaining);
      }

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);

    return () => {
      active = false;
    };
  }, [status]);

  const setNextRoundResult = useCallback((val: number) => {
    socketRef.current?.emit('admin_set_next_result', val);
  }, []);

  const forceCrashNow = useCallback(() => {
    socketRef.current?.emit('admin_force_crash');
  }, []);

  const updateRtp = useCallback((val: number) => {
    socketRef.current?.emit('admin_set_rtp', val);
  }, []);

  // Mecanismo de timeout rígido de segurança para o saque autoritativo, prevenindo abusos em caso de lag no servidor
  const requestCashout = useCallback((slot: 1 | 2, requestedMultiplier: number): Promise<{ success: boolean; multiplier?: number; reason?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current || !socketRef.current.connected) {
        resolve({ success: false, reason: "offline" });
        return;
      }

      let answered = false;
      const timeoutTimer = setTimeout(() => {
        if (!answered) {
          answered = true;
          resolve({ success: false, reason: "timeout" });
        }
      }, 700); // 700ms de tolerância é o ideal para rede móvel de má qualidade

      socketRef.current.emit("request_cashout", { slot, requestedMultiplier }, (response: any) => {
        if (!answered) {
          answered = true;
          clearTimeout(timeoutTimer);
          resolve(response);
        }
      });
    });
  }, []);

  return { 
    status, 
    multiplier, 
    countdown, 
    nextRoundServerSeedHash,
    setNextRoundResult, 
    forceCrashNow,
    updateRtp,
    requestCashout
  };
};
