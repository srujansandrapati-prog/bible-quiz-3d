import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

// 1. Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCG_JThU0tEgfiZNm23dFOAKlZuaX9QfHc",
  authDomain: "quiz-94ebe.firebaseapp.com",
  databaseURL: "https://quiz-94ebe-default-rtdb.firebaseio.com",
  projectId: "quiz-94ebe",
  storageBucket: "quiz-94ebe.firebasestorage.app",
  messagingSenderId: "41248985742",
  appId: "1:41248985742:web:3a1e3fbaec6cb42dd06fdf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// 2. Bible "Guess Their Answer" Question Bank
const BIBLE_QUESTIONS = [
  {
    prompt: "Name a Fruit of the Spirit mentioned in Galatians 5",
    answers: [
      { label: "Love", points: 30, verse: "Gal 5:22", keys: ["love", "loving", "charity"] },
      { label: "Joy", points: 25, verse: "Gal 5:22", keys: ["joy", "joyful", "happiness"] },
      { label: "Peace", points: 20, verse: "Gal 5:22", keys: ["peace", "peaceful"] },
      { label: "Patience", points: 15, verse: "Gal 5:22", keys: ["patience", "patient", "longsuffering", "forbearance"] },
      { label: "Kindness / Goodness", points: 15, verse: "Gal 5:22", keys: ["kindness", "kind", "goodness", "good", "gentleness"] },
      { label: "Self-Control / Faithfulness", points: 10, verse: "Gal 5:23", keys: ["self control", "self-control", "faithfulness", "faithful", "faith", "meekness", "temperance"] }
    ]
  },
  {
    prompt: "Name one of the 10 Plagues of Egypt in Exodus",
    answers: [
      { label: "Water Turned to Blood", points: 30, verse: "Exod 7:20", keys: ["blood", "water to blood", "nile", "red water"] },
      { label: "Frogs", points: 25, verse: "Exod 8:6", keys: ["frog", "frogs"] },
      { label: "Locusts", points: 20, verse: "Exod 10:14", keys: ["locust", "locusts", "grasshopper", "grasshoppers"] },
      { label: "Three Days of Darkness", points: 15, verse: "Exod 10:22", keys: ["darkness", "dark", "night"] },
      { label: "Hail & Fire", points: 15, verse: "Exod 9:23", keys: ["hail", "hailstones", "storm", "fire"] },
      { label: "Boils / Gnats / Flies", points: 10, verse: "Exod 9:10", keys: ["boils", "boil", "flies", "fly", "lice", "gnats", "firstborn", "livestock"] }
    ]
  },
  {
    prompt: "Name a famous Miracle performed by Jesus",
    answers: [
      { label: "Water into Wine", points: 30, verse: "John 2:9", keys: ["wine", "water into wine", "water to wine", "cana"] },
      { label: "Walking on Water", points: 25, verse: "Matt 14:25", keys: ["walk on water", "walking on water", "water walk", "sea"] },
      { label: "Feeding the 5,000", points: 20, verse: "Matt 14:19", keys: ["5000", "5,000", "bread", "fish", "loaves", "feeding"] },
      { label: "Raising Lazarus", points: 15, verse: "John 11:43", keys: ["lazarus", "dead", "raising lazarus", "resurrection"] },
      { label: "Healing the Blind", points: 15, verse: "John 9:7", keys: ["blind", "sight", "eyes", "bartimaeus", "healing blind"] },
      { label: "Calming the Storm", points: 10, verse: "Mark 4:39", keys: ["storm", "wind", "waves", "calm", "calming"] }
    ]
  },
  {
    prompt: "Name one of the 12 Disciples of Jesus",
    answers: [
      { label: "Simon Peter", points: 30, verse: "Matt 10:2", keys: ["peter", "simon", "simon peter", "cephas"] },
      { label: "John", points: 25, verse: "Matt 10:2", keys: ["john"] },
      { label: "Matthew (Levi)", points: 20, verse: "Matt 10:3", keys: ["matthew", "levi"] },
      { label: "Thomas", points: 15, verse: "Matt 10:3", keys: ["thomas", "doubting thomas", "didymus"] },
      { label: "Andrew / James", points: 15, verse: "Matt 10:2", keys: ["andrew", "james"] },
      { label: "Philip / Bartholomew / Judas", points: 10, verse: "Matt 10:3", keys: ["philip", "bartholomew", "nathanael", "judas", "thaddaeus"] }
    ]
  },
  {
    prompt: "Name an Animal frequently mentioned in the Bible",
    answers: [
      { label: "Sheep / Lamb", points: 30, verse: "John 1:29", keys: ["sheep", "lamb", "ram", "flock"] },
      { label: "Lion", points: 25, verse: "Dan 6:16", keys: ["lion", "lions"] },
      { label: "Dove", points: 20, verse: "Gen 8:11", keys: ["dove", "pigeon", "bird"] },
      { label: "Donkey", points: 15, verse: "Num 22:28", keys: ["donkey", "colt", "mule", "balaam"] },
      { label: "Great Fish / Whale", points: 15, verse: "Jonah 1:17", keys: ["whale", "fish", "great fish", "jonah"] },
      { label: "Camel / Serpent", points: 10, verse: "Matt 19:24", keys: ["camel", "snake", "serpent", "viper"] }
    ]
  },
  {
    prompt: "Name one of the first 6 Books of the Old Testament",
    answers: [
      { label: "Genesis", points: 30, verse: "Gen 1:1", keys: ["genesis"] },
      { label: "Exodus", points: 25, verse: "Exod 1:1", keys: ["exodus"] },
      { label: "Leviticus", points: 20, verse: "Lev 1:1", keys: ["leviticus"] },
      { label: "Numbers", points: 15, verse: "Num 1:1", keys: ["numbers"] },
      { label: "Deuteronomy", points: 15, verse: "Deut 1:1", keys: ["deuteronomy"] },
      { label: "Joshua", points: 10, verse: "Josh 1:1", keys: ["joshua"] }
    ]
  }
];

// 3. Player & Match State
let currentUser = null;
let myProfile = { name: "Player", photo: "", avatar: "david", wins: 0, points: 0 };
let activeRoomCode = null;
let myRole = "p1";
let isBotMatch = false;
let isLocalOfflineBot = false;
let roomUnsubscribe = null;
let roundTimerInterval = null;
let botGuessTimeout = null;

let matchQuestions = [];
let currentRound = 1;
let timeLeft = 25;
let p1Score = 0;
let p2Score = 0;
let unlockedSlots = {};

// 4. DOM Helpers
const screens = {
  auth: document.getElementById("auth-screen"),
  lobby: document.getElementById("lobby-screen"),
  game: document.getElementById("game-screen"),
  result: document.getElementById("result-screen")
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function setStatus(msg) {
  document.getElementById("status-text").textContent = msg;
}

// 5. Authentication & Immediate Lobby Entry
document.getElementById("google-login-btn").addEventListener("click", async () => {
  const btn = document.getElementById("google-login-btn");
  try {
    btn.textContent = "Signing in...";
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (result && result.user) {
      await handleUserLogin(result.user);
    }
  } catch (err) {
    btn.textContent = "Sign in with Google";
    alert("Google Sign-In Error: " + err.message);
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null;
    const btn = document.getElementById("google-login-btn");
    if (btn) btn.textContent = "Sign in with Google";
    showScreen("auth");
    return;
  }
  await handleUserLogin(user);
});

async function handleUserLogin(user) {
  currentUser = user;

  // Set default profile and enter Lobby IMMEDIATELY so the screen never gets stuck
  myProfile = {
    name: user.displayName || "Bible Scholar",
    photo: user.photoURL || "https://ui-avatars.com/api/?name=Player&background=f59e0b&color=0f172a",
    avatar: myProfile.avatar || "david",
    wins: myProfile.wins || 0,
    points: myProfile.points || 0
  };

  updateLobbyUI();
  showScreen("lobby");

  if (window.Arena3D) {
    window.Arena3D.resetMatch();
    window.Arena3D.setAvatars(myProfile.avatar, "moses");
  }

  // Sync saved stats from Realtime Database in the background
  try {
    const userRef = ref(db, `users/${user.uid}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      myProfile = { ...myProfile, ...snap.val() };
      updateLobbyUI();
      if (window.Arena3D) {
        window.Arena3D.setAvatars(myProfile.avatar, "moses");
      }
    } else {
      await set(userRef, myProfile);
    }
  } catch (dbErr) {
    console.warn("Database sync note:", dbErr.message);
  }
}

function updateLobbyUI() {
  document.getElementById("user-name").textContent = myProfile.name;
  document.getElementById("user-photo").src =
    myProfile.photo || "https://ui-avatars.com/api/?name=P&background=f59e0b&color=0f172a";
  document.getElementById("user-wins").textContent = myProfile.wins || 0;
  document.getElementById("user-points").textContent = myProfile.points || 0;

  document.querySelectorAll(".avatar-btn").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.avatar === myProfile.avatar);
  });
}

// 6. 3D Character Picker in Lobby
document.querySelectorAll(".avatar-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const chosen = btn.dataset.avatar;
    myProfile.avatar = chosen;
    updateLobbyUI();
    if (window.Arena3D) {
      window.Arena3D.setAvatars(chosen, "moses");
    }
    if (currentUser) {
      try {
        await update(ref(db, `users/${currentUser.uid}`), { avatar: chosen });
      } catch (_) {}
    }
  });
});

// 7. Matchmaking: Quick 1v1 Match & Friend Room Codes
document.getElementById("create-room-btn").addEventListener("click", async () => {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  await createFirebaseRoom(code, false);
});

document.getElementById("join-room-btn").addEventListener("click", async () => {
  const code = document.getElementById("room-code-input").value.trim();
  if (code.length !== 4) {
    setStatus("Please enter a valid 4-digit room code.");
    return;
  }
  await joinFirebaseRoom(code);
});

document.getElementById("quick-match-btn").addEventListener("click", async () => {
  setStatus("Searching for an online opponent...");
  try {
    const roomsSnap = await get(ref(db, "rooms"));
    let foundRoomCode = null;

    if (roomsSnap.exists()) {
      const rooms = roomsSnap.val();
      for (const [code, data] of Object.entries(rooms)) {
        if (data.status === "waiting" && data.p1?.uid !== currentUser.uid) {
          foundRoomCode = code;
          break;
        }
      }
    }

    if (foundRoomCode) {
      await joinFirebaseRoom(foundRoomCode);
    } else {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      await createFirebaseRoom(code, true);
    }
  } catch (err) {
    // Fallback to immediate Bot Match if database rules are still being set up
    startOfflineBotMatch();
  }
});

function startOfflineBotMatch() {
  cleanupListeners();
  isBotMatch = true;
  isLocalOfflineBot = true;
  myRole = "p1";
  p1Score = 0;
  p2Score = 0;
  const qIndices = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 3);
  startMatchUI({
    round: 1,
    qIndices,
    p1: { name: myProfile.name, avatar: myProfile.avatar, score: 0 },
    p2: { name: "Scholar Ezra (Bot)", avatar: "paul", score: 0 },
    unlocked: {}
  });
}

async function createFirebaseRoom(code, allowBotFallback) {
  cleanupListeners();
  activeRoomCode = code;
  myRole = "p1";
  isBotMatch = false;
  isLocalOfflineBot = false;

  const qIndices = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 3);
  const roomData = {
    status: "waiting",
    round: 1,
    qIndices,
    p1: { uid: currentUser.uid, name: myProfile.name, avatar: myProfile.avatar, score: 0 },
    p2: null,
    unlocked: {}
  };

  try {
    await set(ref(db, `rooms/${code}`), roomData);
    if (!allowBotFallback) {
      setStatus(`Room Created! Share 4-Digit Code: ${code} (Waiting for friend...)`);
    }
    listenToRoom(code);

    if (allowBotFallback) {
      setTimeout(async () => {
        try {
          const snap = await get(ref(db, `rooms/${code}`));
          if (snap.exists() && snap.val().status === "waiting") {
            isBotMatch = true;
            await update(ref(db, `rooms/${code}`), {
              status: "playing",
              p2: { uid: "bot", name: "Scholar Ezra (Bot)", avatar: "paul", score: 0 }
            });
          }
        } catch (_) {
          startOfflineBotMatch();
        }
      }, 5000);
    }
  } catch (err) {
    if (allowBotFallback) {
      startOfflineBotMatch();
    } else {
      setStatus("Publish Realtime Database Rules in Firebase Console to use Friend Rooms!");
    }
  }
}

async function joinFirebaseRoom(code) {
  try {
    const roomRef = ref(db, `rooms/${code}`);
    const snap = await get(roomRef);

    if (!snap.exists()) {
      setStatus("Room not found. Check the 4-digit code!");
      return;
    }

    const data = snap.val();
    if (data.status !== "waiting") {
      setStatus("That room is already full!");
      return;
    }

    cleanupListeners();
    activeRoomCode = code;
    myRole = "p2";
    isBotMatch = false;
    isLocalOfflineBot = false;

    await update(roomRef, {
      status: "playing",
      p2: { uid: currentUser.uid, name: myProfile.name, avatar: myProfile.avatar, score: 0 }
    });

    listenToRoom(code);
  } catch (err) {
    setStatus("Database permission error: check Firebase Realtime Database Rules.");
  }
}

function listenToRoom(code) {
  const roomRef = ref(db, `rooms/${code}`);
  roomUnsubscribe = onValue(roomRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.val();

    if (data.status === "playing") {
      if (!screens.game.classList.contains("active")) {
        startMatchUI(data);
      } else {
        syncLiveGameState(data);
      }
    }
  });
}

// 8. Live 3-Round Match Execution
function startMatchUI(data) {
  setStatus("");
  matchQuestions = (data.qIndices || [0, 1, 2]).map(i => BIBLE_QUESTIONS[i]);
  currentRound = data.round || 1;
  unlockedSlots = data.unlocked || {};
  p1Score = data.p1?.score || 0;
  p2Score = data.p2?.score || 0;

  document.getElementById("p1-name").textContent = data.p1.name;
  document.getElementById("p2-name").textContent = data.p2 ? data.p2.name : "Opponent";
  document.getElementById("p1-score").textContent = p1Score;
  document.getElementById("p2-score").textContent = p2Score;

  if (window.Arena3D) {
    window.Arena3D.resetMatch();
    window.Arena3D.setAvatars(data.p1.avatar, data.p2 ? data.p2.avatar : "moses");
  }

  showScreen("game");
  loadRound(currentRound);
}

function loadRound(roundNum) {
  currentRound = roundNum;
  unlockedSlots = {};
  timeLeft = 25;

  const isFinale = roundNum === 3;
  document.getElementById("round-label").textContent =
    isFinale ? "ROUND 3 OF 3 (2X DOUBLE POINTS!)" : `ROUND ${roundNum} OF 3`;

  const qObj = matchQuestions[roundNum - 1] || BIBLE_QUESTIONS[0];
  document.getElementById("question-banner").textContent = qObj.prompt;

  renderAnswerBoard(qObj, isFinale);
  document.getElementById("guess-input").value = "";

  clearInterval(roundTimerInterval);
  roundTimerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer-display").textContent = Math.max(0, timeLeft);

    if (timeLeft <= 0) {
      clearInterval(roundTimerInterval);
      advanceNextRoundOrFinish();
    }
  }, 1000);

  if (isBotMatch) {
    scheduleBotGuess();
  }
}

function renderAnswerBoard(qObj, isFinale) {
  const grid = document.getElementById("answers-grid");
  grid.innerHTML = "";

  qObj.answers.forEach((ans, idx) => {
    const slotKey = `r${currentRound}_s${idx}`;
    const isRevealed = Boolean(unlockedSlots[slotKey]);
    const pts = isFinale ? ans.points * 2 : ans.points;

    const div = document.createElement("div");
    div.className = `answer-slot ${isRevealed ? "revealed" : ""}`;
    div.innerHTML = `
      <span class="answer-rank">#${idx + 1}</span>
      <span class="answer-text">
        ${isRevealed ? ans.label : "???"}
        ${isRevealed ? `<small class="answer-verse">${ans.verse}</small>` : ""}
      </span>
      <span class="answer-pts">${isRevealed ? `+${pts}` : `${pts} pts`}</span>
    `;
    grid.appendChild(div);
  });
}

function syncLiveGameState(data) {
  p1Score = data.p1?.score || 0;
  p2Score = data.p2?.score || 0;

  document.getElementById("p1-score").textContent = p1Score;
  document.getElementById("p2-score").textContent = p2Score;

  if (window.Arena3D) {
    window.Arena3D.updateScores(p1Score, p2Score);
  }

  if (data.unlocked) {
    unlockedSlots = data.unlocked;
    const qObj = matchQuestions[currentRound - 1] || BIBLE_QUESTIONS[0];
    renderAnswerBoard(qObj, currentRound === 3);
  }
}

// 9. Smart Answer Matching when Player Submits a Guess
document.getElementById("guess-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("guess-input");
  const rawGuess = input.value.trim().toLowerCase();
  input.value = "";
  if (!rawGuess) return;

  const qObj = matchQuestions[currentRound - 1] || BIBLE_QUESTIONS[0];
  const isFinale = currentRound === 3;

  let matchedIndex = -1;
  qObj.answers.forEach((ans, idx) => {
    const slotKey = `r${currentRound}_s${idx}`;
    if (unlockedSlots[slotKey]) return;

    const hit = ans.keys.some(k => rawGuess.includes(k) || (k.includes(rawGuess) && rawGuess.length >= 3));
    if (hit && matchedIndex === -1) {
      matchedIndex = idx;
    }
  });

  if (matchedIndex !== -1) {
    const slotKey = `r${currentRound}_s${matchedIndex}`;
    const earned = isFinale ? qObj.answers[matchedIndex].points * 2 : qObj.answers[matchedIndex].points;

    unlockedSlots[slotKey] = myRole;
    if (myRole === "p1") p1Score += earned;
    else p2Score += earned;

    syncLiveGameState({
      p1: { score: p1Score },
      p2: { score: p2Score },
      unlocked: unlockedSlots
    });

    if (!isLocalOfflineBot && activeRoomCode) {
      try {
        const updates = {};
        updates[`${myRole}/score`] = myRole === "p1" ? p1Score : p2Score;
        updates[`unlocked/${slotKey}`] = myRole;
        await update(ref(db, `rooms/${activeRoomCode}`), updates);
      } catch (_) {}
    }
  }
});

// 10. Bot Opponent Guessing Logic
function scheduleBotGuess() {
  clearTimeout(botGuessTimeout);
  if (!isBotMatch || timeLeft <= 2) return;

  const delay = 4500 + Math.random() * 4000;
  botGuessTimeout = setTimeout(async () => {
    if (timeLeft <= 1 || !screens.game.classList.contains("active")) return;

    const qObj = matchQuestions[currentRound - 1] || BIBLE_QUESTIONS[0];
    const available = [];
    qObj.answers.forEach((ans, idx) => {
      if (!unlockedSlots[`r${currentRound}_s${idx}`]) available.push({ ans, idx });
    });

    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      const slotKey = `r${currentRound}_s${pick.idx}`;
      const pts = currentRound === 3 ? pick.ans.points * 2 : pick.ans.points;

      unlockedSlots[slotKey] = "p2";
      p2Score += pts;

      syncLiveGameState({
        p1: { score: p1Score },
        p2: { score: p2Score },
        unlocked: unlockedSlots
      });

      if (!isLocalOfflineBot && activeRoomCode) {
        try {
          const updates = {};
          updates["p2/score"] = p2Score;
          updates[`unlocked/${slotKey}`] = "p2";
          await update(ref(db, `rooms/${activeRoomCode}`), updates);
        } catch (_) {}
      }
    }

    scheduleBotGuess();
  }, delay);
}

// 11. Round Transition & Match Ending
async function advanceNextRoundOrFinish() {
  clearTimeout(botGuessTimeout);

  if (currentRound < 3) {
    const nextRound = currentRound + 1;
    if (!isLocalOfflineBot && myRole === "p1" && activeRoomCode) {
      try {
        await update(ref(db, `rooms/${activeRoomCode}`), { round: nextRound, unlocked: {} });
      } catch (_) {}
    }
    loadRound(nextRound);
  } else {
    finishMatch();
  }
}

async function finishMatch() {
  cleanupListeners();

  let winnerSide = "tie";
  if (p1Score > p2Score) winnerSide = "p1";
  else if (p2Score > p1Score) winnerSide = "p2";

  if (window.Arena3D) {
    window.Arena3D.showMatchResult(winnerSide);
  }

  const myFinalScore = myRole === "p1" ? p1Score : p2Score;
  const oppFinalScore = myRole === "p1" ? p2Score : p1Score;
  const didIWin = winnerSide === myRole;

  const titleEl = document.getElementById("result-title");
  const subEl = document.getElementById("result-subtitle");

  if (winnerSide === "tie") {
    titleEl.textContent = "It's a Tie!";
    subEl.textContent = `Both players scored ${myFinalScore} points!`;
  } else if (didIWin) {
    titleEl.textContent = "Victory! Well Done!";
    subEl.textContent = `You won ${myFinalScore} to ${oppFinalScore} pts!`;
  } else {
    titleEl.textContent = "Good Effort!";
    subEl.textContent = `Final Score: ${myFinalScore} to ${oppFinalScore} pts. Try another match!`;
  }

  myProfile.points = (myProfile.points || 0) + myFinalScore;
  if (didIWin) myProfile.wins = (myProfile.wins || 0) + 1;
  updateLobbyUI();

  if (currentUser) {
    try {
      await update(ref(db, `users/${currentUser.uid}`), {
        points: myProfile.points,
        wins: myProfile.wins
      });
    } catch (_) {}
  }

  setTimeout(() => {
    showScreen("result");
  }, 2500);
}

document.getElementById("back-lobby-btn").addEventListener("click", () => {
  if (window.Arena3D) {
    window.Arena3D.resetMatch();
    window.Arena3D.setAvatars(myProfile.avatar, "moses");
  }
  showScreen("lobby");
});

function cleanupListeners() {
  clearInterval(roundTimerInterval);
  clearTimeout(botGuessTimeout);
  if (roomUnsubscribe) {
    roomUnsubscribe();
    roomUnsubscribe = null;
  }
}
