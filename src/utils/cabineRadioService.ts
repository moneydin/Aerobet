import { db } from '../firebase';
import { doc, setDoc, onSnapshot, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export interface RadioState {
  frequency: string;
  pilotOnline: boolean;
  copilotOnline: boolean;
  pilotTalking: boolean;
  copilotTalking: boolean;
  updatedAt?: number;
}

class CabineRadioManager {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private isRadioOn: boolean = false;
  private isMuted: boolean = false;
  private isTalking: boolean = false;
  private peerConn: RTCPeerConnection | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private unsubRadioDoc: (() => void) | null = null;
  private unsubSignaling: (() => void) | null = null;
  private cabineId: string | null = null;
  private role: 'pilot' | 'copilot' = 'pilot';
  private partnerTalkingCallback: ((isTalking: boolean) => void) | null = null;
  private volumeCallback: ((volume: number) => void) | null = null;
  private stateChangeCallback: ((state: RadioState) => void) | null = null;
  private radioFilter: BiquadFilterNode | null = null;

  // WebRTC configuration
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Som de rádio squelch / ruído de estática (tchhhhhh)
   */
  public playSquelchSfx(duration: number = 0.15, volume: number = 0.15, frequency: number = 1500) {
    try {
      const ctx = this.getAudioContext();
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * volume;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = frequency;
      filter.Q.value = 3.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {}
  }

  /**
   * PTT beep / Talk beep — Clássico chirp ascendente de 4 tons (Nextel/iDEN)
   */
  public playPTTBeepSfx() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      
      const playPulse = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.002);
        gain.gain.setValueAtTime(0.15, startTime + duration - 0.002);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
      };
      
      // Chirp Nextel: 4 pulsos rápidos ascendentes
      const p = 0.025; // duração do pulso
      const s = 0.026; // espaçamento
      playPulse(1395, now, p);
      playPulse(1450, now + s, p);
      playPulse(1550, now + s * 2, p);
      playPulse(1650, now + s * 3, 0.035);

      // Pequena estática após o chirp
      setTimeout(() => {
        this.playSquelchSfx(0.1, 0.05, 1600);
      }, 120);
      
    } catch (e) {}
  }

  /**
   * Roger beep — Sinal de fim de transmissão limpo e profissional
   */
  public playRogerBeepSfx() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      
      // Estática curta de fechamento
      this.playSquelchSfx(0.06, 0.12, 1000);

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.005);
        gain.gain.setValueAtTime(0.12, startTime + duration - 0.005);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
      };

      // Roger Beep Clássico: Duas notas curtas (aguda -> grave)
      playTone(1520, now + 0.07, 0.06);
      playTone(1180, now + 0.13, 0.06);

    } catch (e) {}
  }

  /**
   * Inicializa o canal de rádio da cabine conectando Firestore state, áudio e WebRTC
   */
  public async initRadio(
    cabineId: string, 
    role: 'pilot' | 'copilot',
    callbacks: {
      onVolume?: (vol: number) => void;
      onPartnerTalking?: (isTalking: boolean) => void;
      onStateChange?: (state: RadioState) => void;
    }
  ) {
    this.cabineId = cabineId;
    this.role = role;
    this.volumeCallback = callbacks.onVolume || null;
    this.partnerTalkingCallback = callbacks.onPartnerTalking || null;
    this.stateChangeCallback = callbacks.onStateChange || null;

    // Elemento de áudio remoto para reproduzir a voz do parceiro
    if (!this.remoteAudio) {
      this.remoteAudio = new Audio();
      this.remoteAudio.autoplay = true;
      (this.remoteAudio as any).playsInline = true;
    }

    // Inicializa BroadcastChannel para comunicação de voz instantânea entre abas
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        if (this.broadcastChannel) this.broadcastChannel.close();
        this.broadcastChannel = new BroadcastChannel(`aerogame-cabine-audio-${cabineId}`);
        this.broadcastChannel.onmessage = async (event) => {
          const { senderRole, audioBlob, isTalking } = event.data || {};
          if (senderRole && senderRole !== this.role) {
            if (typeof isTalking === 'boolean') {
              if (this.partnerTalkingCallback) this.partnerTalkingCallback(isTalking);
              if (isTalking) {
                this.playPTTBeepSfx();
                this.playSquelchSfx();
              } else {
                this.playRogerBeepSfx();
                this.playSquelchSfx();
              }
            }
            if (audioBlob && audioBlob instanceof Blob) {
              this.playReceivedAudioBlob(audioBlob);
            }
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel audio init fallback:', e);
    }

    // Escuta estado do rádio no Firestore
    try {
      const docRef = doc(db, 'cabines', cabineId, 'radio', 'state');
      this.unsubRadioDoc = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as RadioState;
          if (this.stateChangeCallback) this.stateChangeCallback(data);
          
          const partnerTalking = this.role === 'pilot' ? data.copilotTalking : data.pilotTalking;
          if (this.partnerTalkingCallback) {
            this.partnerTalkingCallback(Boolean(partnerTalking));
          }
        }
      }, (err) => {
        console.warn('Radio state listener fallback:', err);
      });

      // Registra presença no rádio
      await setDoc(docRef, {
        frequency: '121.500 MHz (VHF)',
        [this.role === 'pilot' ? 'pilotOnline' : 'copilotOnline']: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Radio firestore init error:', e);
    }
  }

  /**
   * WebRTC Signaling para troca de áudio de alta fidelidade
   */
  private async initWebRTCSignaling(cabineId: string, role: 'pilot' | 'copilot') {
    try {
      this.peerConn = new RTCPeerConnection(this.rtcConfig);

      this.peerConn.ontrack = (event) => {
        if (event.streams && event.streams[0] && this.remoteAudio) {
          this.remoteAudio.srcObject = event.streams[0];
          this.remoteAudio.play().catch(() => {});
        }
      };

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => {
          if (this.peerConn && this.mediaStream) {
            this.peerConn.addTrack(track, this.mediaStream);
          }
        });
      }

      const signalingDocRef = doc(db, 'cabines', cabineId, 'radio', 'webrtc');

      if (role === 'pilot') {
        try {
          await setDoc(signalingDocRef, {
            offer: null,
            answer: null,
            pilotCandidate: null,
            copilotCandidate: null,
            timestamp: Date.now()
          });
        } catch (e) {
          console.warn('Failed to clear old WebRTC signaling document:', e);
        }
      }

      this.peerConn.onicecandidate = async (event) => {
        if (event.candidate) {
          const candidateData = event.candidate.toJSON();
          const field = role === 'pilot' ? 'pilotCandidate' : 'copilotCandidate';
          try {
            await setDoc(signalingDocRef, {
              [field]: candidateData,
              timestamp: Date.now()
            }, { merge: true });
          } catch (e) {}
        }
      };

      this.unsubSignaling = onSnapshot(signalingDocRef, async (snapshot) => {
        if (!snapshot.exists() || !this.peerConn) return;
        const data = snapshot.data();

        if (role === 'copilot' && data.offer && !this.peerConn.currentRemoteDescription) {
          await this.peerConn.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await this.peerConn.createAnswer();
          await this.peerConn.setLocalDescription(answer);
          await setDoc(signalingDocRef, { answer: { type: answer.type, sdp: answer.sdp } }, { merge: true });
        }

        if (role === 'pilot' && data.answer && this.peerConn.signalingState === 'have-local-offer') {
          await this.peerConn.setRemoteDescription(new RTCSessionDescription(data.answer));
        }

        const remoteCandidate = role === 'pilot' ? data.copilotCandidate : data.pilotCandidate;
        if (remoteCandidate && this.peerConn.remoteDescription) {
          try {
            await this.peerConn.addIceCandidate(new RTCIceCandidate(remoteCandidate));
          } catch (e) {}
        }
      });

      if (role === 'pilot') {
        const offer = await this.peerConn.createOffer();
        await this.peerConn.setLocalDescription(offer);
        await setDoc(signalingDocRef, { offer: { type: offer.type, sdp: offer.sdp } }, { merge: true });
      }
    } catch (e) {
      console.warn('WebRTC audio signaling setup error:', e);
    }
  }

  /**
   * Cria um filtro de banda de rádio compartilhado
   */
  private getRadioFilterNode(): BiquadFilterNode {
    const ctx = this.getAudioContext();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 1.5; // Filtro mais suave para voz
    return filter;
  }

  /**
   * Reproduz um buffer ou blob de áudio recebido pelo rádio com filtro de aviação
   */
  private async playReceivedAudioBlob(blob: Blob) {
    try {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = 1.0;

      const ctx = this.getAudioContext();
      const source = ctx.createMediaElementSource(audio);
      const radioFilter = this.getRadioFilterNode();
      
      source.connect(radioFilter);
      radioFilter.connect(ctx.destination);
      
      await audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(url);
        source.disconnect();
        radioFilter.disconnect();
      };
    } catch (e) {
      // Ignora erro de reprodução de áudio
    }
  }

  /**
   * Liga a captura de microfone para transmissão por voz com cancelamento de ruído
   */
  public async enableMicrophone(): Promise<boolean> {
    try {
      this.getAudioContext();
      
      let obtainedStream: MediaStream;
      try {
        obtainedStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (micErr) {
        console.warn('Microphone access denied or unavailable, using virtual silence fallback:', micErr);
        // Fallback: create a virtual silence stream
        const ctx = this.getAudioContext();
        const dest = ctx.createMediaStreamDestination();
        obtainedStream = dest.stream;
      }

      this.mediaStream = obtainedStream;

      const ctx = this.getAudioContext();
      const source = ctx.createMediaStreamSource(this.mediaStream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 64;

      source.connect(this.analyser);

      // Adiciona tracks ao WebRTC se estiver conectado
      if (this.peerConn) {
        this.mediaStream.getTracks().forEach(track => {
          if (this.peerConn && this.mediaStream) {
            this.peerConn.addTrack(track, this.mediaStream);
          }
        });
      }

      // Configura MediaRecorder para envio de áudio em tempo real pelo canal local
      try {
        if (typeof MediaRecorder !== 'undefined') {
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
              ? 'audio/ogg;codecs=opus'
              : '';
          
          this.mediaRecorder = mimeType ? new MediaRecorder(this.mediaStream, { mimeType }) : new MediaRecorder(this.mediaStream);
          this.mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0 && this.isTalking && this.broadcastChannel) {
              this.broadcastChannel.postMessage({
                senderRole: this.role,
                audioBlob: e.data
              });
            }
          };
        }
      } catch (e) {
        console.warn('MediaRecorder audio setup:', e);
      }

      // Inicia loop de volume
      this.startVolumeMeter();
      this.isRadioOn = true;
      this.playSquelchSfx();

      // Inicia sinalização WebRTC para áudio ponto a ponto de forma fresca, agora que as tracks estão disponíveis
      if (this.cabineId) {
        this.initWebRTCSignaling(this.cabineId, this.role);
      }

      return true;
    } catch (err) {
      console.warn('Microphone initialization fallback error:', err);
      return false;
    }
  }

  /**
   * Monitora o volume em tempo real para exibir no equalizador visual
   */
  private startVolumeMeter() {
    const dataArray = new Uint8Array(32);
    const checkVol = () => {
      if (this.analyser && this.isRadioOn) {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        
        if (this.volumeCallback) {
          this.volumeCallback(this.isMuted ? 0 : normalized);
        }
      } else if (this.volumeCallback) {
        this.volumeCallback(0);
      }
      this.animFrameId = requestAnimationFrame(checkVol);
    };
    checkVol();
  }

  /**
   * Aciona Push-To-Talk (PTT) ou transmissão de áudio em tempo real
   */
  public async setTransmitting(transmitting: boolean) {
    if (this.isTalking === transmitting) return;
    this.isTalking = transmitting;

    if (transmitting) {
      this.playPTTBeepSfx();
      this.playSquelchSfx();
      if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
        try {
          this.mediaRecorder.start(100); // Envia pacotes a cada 100ms
        } catch (e) {}
      }
    } else {
      this.playRogerBeepSfx();
      this.playSquelchSfx();
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        try {
          this.mediaRecorder.stop();
        } catch (e) {}
      }
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        senderRole: this.role,
        isTalking: transmitting
      });
    }

    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = transmitting;
      });
    }

    if (this.cabineId) {
      try {
        const docRef = doc(db, 'cabines', this.cabineId, 'radio', 'state');
        await updateDoc(docRef, {
          [this.role === 'pilot' ? 'pilotTalking' : 'copilotTalking']: transmitting,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        // Silent
      }
    }
  }

  /**
   * Alterna mudo do microfone
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMuted;
      });
    }
    return this.isMuted;
  }

  /**
   * Resposta do Copiloto Virtual / IA via sintetizador de rádio (se jogando com IA)
   */
  public triggerSimulatedCopilotResponse(contextText?: string) {
    if (!('speechSynthesis' in window)) return;

    const phrases = [
      "Copiado Comandante! Sistemas e telemetria da cabine 100%.",
      "Roger Piloto! Monitorando multiplicador ao vivo.",
      "Afirmativo Comandante! Banca da cabine protegida para a subida.",
      "Copiado! Olho no radar e dedo no cashout quando passar de 2x.",
      "Roger, Comandante Silva! Decolagem autorizada no gráfico."
    ];

    const text = contextText || phrases[Math.floor(Math.random() * phrases.length)];

    setTimeout(() => {
      this.playSquelchSfx();
      if (this.partnerTalkingCallback) this.partnerTalkingCallback(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      utterance.pitch = 0.95;

      utterance.onend = () => {
        if (this.partnerTalkingCallback) this.partnerTalkingCallback(false);
      };

      utterance.onerror = () => {
        if (this.partnerTalkingCallback) this.partnerTalkingCallback(false);
      };

      window.speechSynthesis.speak(utterance);
    }, 600);
  }

  /**
   * Desliga e libera recursos de rádio
   */
  public destroy() {
    this.isRadioOn = false;
    this.isTalking = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch (e) {}
      this.mediaRecorder = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.unsubSignaling) {
      this.unsubSignaling();
      this.unsubSignaling = null;
    }
    if (this.peerConn) {
      this.peerConn.close();
      this.peerConn = null;
    }
    if (this.unsubRadioDoc) {
      this.unsubRadioDoc();
      this.unsubRadioDoc = null;
    }
    if (this.cabineId) {
      try {
        const docRef = doc(db, 'cabines', this.cabineId, 'radio', 'state');
        updateDoc(docRef, {
          [this.role === 'pilot' ? 'pilotOnline' : 'copilotOnline']: false,
          [this.role === 'pilot' ? 'pilotTalking' : 'copilotTalking']: false,
          updatedAt: serverTimestamp()
        }).catch(() => {});
      } catch (e) {}
    }
  }
}

export const cabineRadio = new CabineRadioManager();
