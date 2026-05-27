import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import { readFileSync } from "fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const WAIT_TIME = 5000;
const LOGIC_TICK_RATE = 50;

enum GameStatus {
  WAITING = "WAITING",
  FLYING = "FLYING",
  CRASHED = "CRASHED",
}

interface GameHistory {
  multiplier: number;
  color: string;
  hash: string;
  serverSeed: string;
  clientSeed: string;
  roundId: string;
}

async function startServer() {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  let firebaseConfig;
  try {
    firebaseConfig = JSON.parse(readFileSync(firebaseConfigPath, "utf8"));
  } catch (err) {
    console.error("Failed to read firebase config:", err);
    process.exit(1);
  }
  const fbApp = initializeApp(firebaseConfig);
  const db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  let status = GameStatus.WAITING;
  let multiplier = 1.0;
  let history: GameHistory[] = [];
  let countdown = WAIT_TIME;
  let rtp = 97;
  let crashPoint = 1.0;
  let startTime = 0;
  let currentSeeds = { server: "", client: "AERObet-Client-Seed-1", round: 0, hash: "" };
  let nextServerSeed = "";
  let nextRoundServerSeedHash = "";
  let forcedCrashPoint: number | null = null;

  // Initial rtp sync from Firestore
  getDoc(doc(db, "settings", "game_config")).then(rtpDoc => {
    if (rtpDoc.exists()) {
      rtp = rtpDoc.data().rtp || 97;
      console.log(`Loaded RTP: ${rtp}% from Firestore.`);
    } else {
      setDoc(doc(db, "settings", "game_config"), { rtp: 97 }).catch(err => console.error("Error setting RTP", err));
    }
  }).catch(err => {
    console.error("Error loading RTP from Firestore:", err);
  });

  // Initial history sync from Firestore
  const q = query(collection(db, "rounds"), orderBy("timestamp", "desc"), limit(100));
  getDocs(q).then(querySnapshot => {
    history = querySnapshot.docs.map((documentSnapshot) => {
      const data = documentSnapshot.data();
      return {
        multiplier: data.multiplier,
        color: data.color,
        hash: data.hash,
        serverSeed: data.serverSeed,
        clientSeed: data.clientSeed,
        roundId: data.roundId
      };
    });
    console.log(`Loaded ${history.length} rounds from history.`);
  }).catch(error => {
    console.error("Error loading history from Firestore:", error);
  });

  function sha256(message: string) {
    return crypto.createHash("sha256").update(message).digest("hex");
  }

  function prepareNextRound() {
    const serverSeed = crypto.randomBytes(16).toString("hex");
    nextServerSeed = serverSeed;
    nextRoundServerSeedHash = sha256(serverSeed);
  }

  function generateCrashPoint() {
    if (forcedCrashPoint !== null) {
      const val = forcedCrashPoint;
      forcedCrashPoint = null;
      currentSeeds = { server: "ADMIN_FORCED", client: "ADMIN", round: Date.now(), hash: "forced_result_hash" };
      return val;
    }

    const serverSeed = nextServerSeed;
    const clientSeed = "AERObet-JS-Demo";
    const roundId = Date.now().toString();
    const combined = `${serverSeed}-${clientSeed}-${roundId}`;
    const hash = sha256(combined);
    const hex = hash.substring(0, 8);
    const intValue = parseInt(hex, 16);
    const maxInt = 0xffffffff;
    const floatValue = intValue / maxInt;
    const houseEdge = (100 - rtp) / 100;

    if (floatValue < houseEdge) {
      currentSeeds = { server: serverSeed, client: clientSeed, round: parseInt(roundId), hash: hash };
      return 1.0;
    }

    const rtpModifier = rtp / 100;
    let cp = Math.max(1.0, rtpModifier / (1 - floatValue));
    cp = Math.min(cp, 1000000);
    currentSeeds = { server: serverSeed, client: clientSeed, round: parseInt(roundId), hash: hash };
    return cp;
  }

  function startNewGame() {
    crashPoint = generateCrashPoint();
    prepareNextRound();
    multiplier = 1.0;
    status = GameStatus.FLYING;
    startTime = Date.now();
    io.emit("game_start", { nextRoundServerSeedHash });
  }

  function resetGame() {
    status = GameStatus.WAITING;
    countdown = WAIT_TIME;
    io.emit("game_waiting", { countdown });
  }

  prepareNextRound();

  setInterval(() => {
    if (status === GameStatus.FLYING) {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const nextMultiplier = Math.pow(1.12, elapsed);

      if (nextMultiplier >= crashPoint) {
        multiplier = crashPoint;
        status = GameStatus.CRASHED;
        const newEntry: GameHistory = {
          multiplier: crashPoint,
          color: crashPoint < 2 ? "#34b1e2" : crashPoint < 10 ? "#913ef2" : "#c111d7",
          hash: currentSeeds.hash,
          serverSeed: currentSeeds.server,
          clientSeed: currentSeeds.client,
          roundId: currentSeeds.round.toString(),
        };
        history = [newEntry, ...history].slice(0, 100);
        io.emit("game_crashed", { multiplier, history });

        // Save to Firestore
        addDoc(collection(db, "rounds"), {
          ...newEntry,
          timestamp: Date.now()
        }).catch(err => console.error("Error saving round to Firestore:", err));

        setTimeout(resetGame, 3000);
      } else {
        multiplier = nextMultiplier;
        // Emit tick state updates every 100ms instead of 50ms to dramatically improve performance and prevent rendering stalls
        const elapsedMs = now - startTime;
        if (Math.floor(elapsedMs / 100) !== Math.floor((now - startTime - LOGIC_TICK_RATE) / 100)) {
          io.emit("game_tick", { multiplier });
        }
      }
    } else if (status === GameStatus.WAITING) {
      countdown -= LOGIC_TICK_RATE;
      if (countdown <= 0) {
        startNewGame();
      } else {
        // Only emit countdown to clients every 200ms to avoid network congestion and React rendering stalls
        if (countdown % 200 === 0 || countdown === WAIT_TIME || countdown <= LOGIC_TICK_RATE) {
          io.emit("game_countdown", { countdown });
        }
      }
    }
  }, LOGIC_TICK_RATE);

  io.on("connection", (socket) => {
    socket.emit("init", {
      status,
      multiplier,
      history,
      countdown,
      nextRoundServerSeedHash,
    });

    socket.on("admin_force_crash", () => {
      if (status === GameStatus.FLYING) {
        crashPoint = multiplier;
      }
    });

    socket.on("request_cashout", ({ slot, requestedMultiplier }, callback) => {
      if (typeof callback !== "function") return;

      if (status !== GameStatus.FLYING) {
        return callback({ success: false, reason: "game_not_running" });
      }

      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const currentServerMultiplier = Math.pow(1.12, elapsed);

      // If mathematically we have already crashed or exceeded crash point
      if (currentServerMultiplier >= crashPoint) {
        return callback({ success: false, reason: "game_already_crashed" });
      }

      // Safeguard against client injecting extreme values or exploiting delay
      // The requested multiplier must not exceed the actual server multiplier + small tolerance (0.1)
      if (requestedMultiplier > currentServerMultiplier + 0.1) {
        return callback({ success: false, reason: "multiplier_too_high" });
      }

      // Capped at the actual current multiplier or the client's requested multiplier
      const finalMultiplier = Math.min(requestedMultiplier, currentServerMultiplier);

      return callback({ 
        success: true, 
        multiplier: Number(finalMultiplier.toFixed(2)) 
      });
    });

    socket.on("admin_set_next_result", (val: number) => {
      forcedCrashPoint = val;
    });

    socket.on("admin_set_rtp", (val: number) => {
      rtp = val;
      setDoc(doc(db, "settings", "game_config"), { rtp: val }, { merge: true })
        .catch(err => console.error("Error saving RTP to Firestore:", err));
    });
  });

  const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT != null || __dirname.includes("dist") || process.argv[1]?.includes('dist');
  
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
