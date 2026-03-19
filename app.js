const STORAGE_KEY = "push-me-up-static";

const XP_PER_REP = 2;
const XP_PER_LEVEL = 120;
const BOX_DROP_CHANCE = 0.25;
const ENERGY_MAX = 100;

const QUEST_POOL = [
  { id: "q1", text: "Complete 3 sets today", target: 3, type: "sets" },
  { id: "q2", text: "Do 40 total reps today", target: 40, type: "reps" },
  { id: "q3", text: "Hit a 10-rep set", target: 10, type: "single" },
  { id: "q4", text: "Train before noon (use Morning boost)", target: 1, type: "morning" },
  { id: "q5", text: "Log 2 sets with Beast intensity", target: 2, type: "beast" }
];

const ACHIEVEMENTS = [
  { id: "a1", title: "First Blood", desc: "Log your first set", check: (s) => s.totalSets >= 1 },
  { id: "a2", title: "Rep River", desc: "500 total reps", check: (s) => s.totalReps >= 500 },
  { id: "a3", title: "Streak 7", desc: "7-day streak", check: (s) => s.streak >= 7 },
  { id: "a4", title: "Level 5", desc: "Reach level 5", check: (s) => levelFromXp(s.xp) >= 5 },
  { id: "a5", title: "Box Hunter", desc: "Open 10 boxes", check: (s) => s.boxesOpened >= 10 },
  { id: "a6", title: "Legend", desc: "Get 1 legendary drop", check: (s) => s.legendaryDrops >= 1 }
];

const BADGE_POOL = [
  "Iron Fists",
  "Steel Core",
  "Tempo King",
  "Grounded",
  "Skyline",
  "Repetition Master",
  "Clean Form",
  "Phoenix",
  "Gravity Defier"
];

const TITLE_POOL = [
  { title: "Rookie", minLevel: 1 },
  { title: "Grinder", minLevel: 3 },
  { title: "Vanguard", minLevel: 6 },
  { title: "Captain", minLevel: 9 },
  { title: "Warlord", minLevel: 12 }
];

const SHOP_ITEMS = [
  { id: "s1", name: "Streak Shield", cost: 60, effect: "Prevents one streak break", apply: (s) => ({ ...s, shields: s.shields + 1 }) },
  { id: "s2", name: "XP Boost", cost: 40, effect: "+50 XP", apply: (s) => ({ ...s, xp: s.xp + 50 }) },
  { id: "s3", name: "Combo Fuel", cost: 30, effect: "+10 combo", apply: (s) => ({ ...s, comboBoost: s.comboBoost + 10 }) },
  { id: "s4", name: "Energy Pack", cost: 25, effect: "+20 energy", apply: (s) => ({ ...s, energy: Math.min(ENERGY_MAX, s.energy + 20) }) }
];

const BOX_REWARDS = [
  { title: "XP Cache", rarity: "common", apply: (s) => ({ ...s, xp: s.xp + 80 }) },
  { title: "Coin Pouch", rarity: "common", apply: (s) => ({ ...s, coins: s.coins + 50 }) },
  { title: "Badge", rarity: "rare", apply: (s) => ({ ...s, badges: [...s.badges, randomFrom(BADGE_POOL)] }) },
  { title: "Streak Shield", rarity: "rare", apply: (s) => ({ ...s, shields: s.shields + 1 }) },
  { title: "Legendary Title", rarity: "legendary", apply: (s) => ({ ...s, titles: [...s.titles, "Immortal"], legendaryDrops: s.legendaryDrops + 1 }) }
];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function levelFromXp(xp) {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

function progressToNext(xp) {
  const level = levelFromXp(xp);
  const base = (level - 1) * XP_PER_LEVEL;
  return { level, progress: xp - base, needed: XP_PER_LEVEL };
}

function defaultState() {
  return {
    totalReps: 0,
    totalSets: 0,
    xp: 0,
    coins: 0,
    boxes: 0,
    boxesOpened: 0,
    streak: 0,
    lastWorkout: null,
    energy: ENERGY_MAX,
    combo: 1,
    comboBoost: 0,
    shields: 0,
    badges: [],
    titles: ["Rookie"],
    legendaryDrops: 0,
    quests: [randomFrom(QUEST_POOL)],
    dailyGoal: { date: todayKey(), target: 60, progress: 0, done: false },
    weeklyGoal: { week: weekKey(), target: 200, progress: 0, done: false },
    journal: []
  };
}

function weekKey() {
  const d = new Date();
  const first = new Date(d.getFullYear(), 0, 1);
  const day = Math.floor((d - first) / 86400000);
  return `${d.getFullYear()}-W${Math.ceil((day + first.getDay() + 1) / 7)}`;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const ui = {
  logSetBtn: document.getElementById("logSetBtn"),
  openBoxBtn: document.getElementById("openBoxBtn"),
  repsInput: document.getElementById("repsInput"),
  intensitySelect: document.getElementById("intensitySelect"),
  timeSelect: document.getElementById("timeSelect"),
  streakValue: document.getElementById("streakValue"),
  streakHint: document.getElementById("streakHint"),
  levelValue: document.getElementById("levelValue"),
  levelHint: document.getElementById("levelHint"),
  boxCount: document.getElementById("boxCount"),
  boxHint: document.getElementById("boxHint"),
  totalReps: document.getElementById("totalReps"),
  xpValue: document.getElementById("xpValue"),
  comboValue: document.getElementById("comboValue"),
  energyValue: document.getElementById("energyValue"),
  questList: document.getElementById("questList"),
  achievementList: document.getElementById("achievementList"),
  badgeList: document.getElementById("badgeList"),
  leaderboard: document.getElementById("leaderboard"),
  dailyGoal: document.getElementById("dailyGoal"),
  weeklyGoal: document.getElementById("weeklyGoal"),
  shop: document.getElementById("shop"),
  journal: document.getElementById("journal"),
  coinValue: document.getElementById("coinValue"),
  titleValue: document.getElementById("titleValue"),
  legendaryValue: document.getElementById("legendaryValue"),
  toast: document.getElementById("toast")
};

let state = loadState();

function showToast(text) {
  ui.toast.textContent = text;
  ui.toast.classList.add("show");
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 2000);
}

function maybeResetGoals() {
  const today = todayKey();
  if (state.dailyGoal.date !== today) {
    state.dailyGoal = { date: today, target: 60, progress: 0, done: false };
  }
  const wk = weekKey();
  if (state.weeklyGoal.week !== wk) {
    state.weeklyGoal = { week: wk, target: 200, progress: 0, done: false };
  }
}

function updateStreak(today) {
  const yesterday = yesterdayKey();
  if (!state.lastWorkout) {
    state.streak = 1;
  } else if (state.lastWorkout === today) {
    state.streak = state.streak;
  } else if (state.lastWorkout === yesterday) {
    state.streak += 1;
  } else if (state.shields > 0) {
    state.shields -= 1;
    showToast("Streak shield saved your streak.");
  } else {
    state.streak = 1;
  }
  state.lastWorkout = today;
}

function updateCombo() {
  const bonus = state.comboBoost > 0 ? 0.1 : 0;
  const nextCombo = Math.min(3.5, state.combo + 0.1 + bonus);
  state.combo = Math.round(nextCombo * 10) / 10;
  if (state.comboBoost > 0) state.comboBoost -= 1;
}

function spendEnergy(reps) {
  const drop = Math.min(40, Math.round(reps / 2));
  state.energy = Math.max(0, state.energy - drop);
}

function recoverEnergy() {
  state.energy = Math.min(ENERGY_MAX, state.energy + 10);
}

function logSet() {
  const reps = Math.max(1, Number(ui.repsInput.value) || 1);
  const intensity = Number(ui.intensitySelect.value);
  const timeBonus = Number(ui.timeSelect.value);
  const today = todayKey();

  maybeResetGoals();
  updateStreak(today);
  updateCombo();
  spendEnergy(reps);

  const baseXp = reps * XP_PER_REP;
  const comboBonus = state.combo;
  const gainedXp = Math.round(baseXp * intensity * timeBonus * comboBonus);
  const coinGain = Math.max(5, Math.round(gainedXp / 4));

  state.totalReps += reps;
  state.totalSets += 1;
  state.xp += gainedXp;
  state.coins += coinGain;
  state.bestSet = Math.max(state.bestSet || 0, reps);
  state.bestXp = Math.max(state.bestXp || 0, gainedXp);

  state.dailyGoal.progress += reps;
  state.weeklyGoal.progress += reps;

  if (state.dailyGoal.progress >= state.dailyGoal.target && !state.dailyGoal.done) {
    state.dailyGoal.done = true;
    state.coins += 50;
    state.boxes += 1;
    showToast("Daily goal cleared! +50 coins and a box.");
  }

  if (state.weeklyGoal.progress >= state.weeklyGoal.target && !state.weeklyGoal.done) {
    state.weeklyGoal.done = true;
    state.coins += 150;
    state.boxes += 2;
    showToast("Weekly goal cleared! +150 coins and 2 boxes.");
  }

  const drop = Math.random() < BOX_DROP_CHANCE;
  if (drop) state.boxes += 1;

  state.journal.unshift({ date: today, reps, xp: gainedXp });
  state.journal = state.journal.slice(0, 7);

  updateQuests(reps, intensity, timeBonus);
  unlockAchievements();
  updateTitles();
  recoverEnergy();

  showToast(`Logged ${reps} reps • +${gainedXp} XP • +${coinGain} coins`);
  saveState(state);
  render();
}

function updateQuests(reps, intensity, timeBonus) {
  const quest = state.quests[0];
  if (!quest) return;

  if (quest.type === "sets") quest.progress = (quest.progress || 0) + 1;
  if (quest.type === "reps") quest.progress = (quest.progress || 0) + reps;
  if (quest.type === "single") quest.progress = reps >= quest.target ? quest.target : (quest.progress || 0);
  if (quest.type === "morning" && timeBonus > 1) quest.progress = quest.target;
  if (quest.type === "beast" && intensity >= 1.5) quest.progress = (quest.progress || 0) + 1;

  if (quest.progress >= quest.target) {
    state.coins += 40;
    state.xp += 60;
    state.boxes += 1;
    showToast("Quest complete! +60 XP, +40 coins, +1 box.");
    state.quests = [randomFrom(QUEST_POOL)];
  }
}

function unlockAchievements() {
  state.achievements = state.achievements || [];
  ACHIEVEMENTS.forEach((ach) => {
    if (!state.achievements.includes(ach.id) && ach.check(state)) {
      state.achievements.push(ach.id);
      state.coins += 100;
      state.boxes += 1;
      showToast(`Achievement unlocked: ${ach.title}`);
    }
  });
}

function updateTitles() {
  const level = levelFromXp(state.xp);
  TITLE_POOL.forEach((t) => {
    if (level >= t.minLevel && !state.titles.includes(t.title)) {
      state.titles.push(t.title);
      showToast(`New title earned: ${t.title}`);
    }
  });
}

function openBox() {
  if (state.boxes <= 0) return;
  const roll = Math.random();
  let reward = BOX_REWARDS[0];
  if (roll > 0.93) reward = BOX_REWARDS[4];
  else if (roll > 0.7) reward = BOX_REWARDS[2];
  else reward = BOX_REWARDS[Math.floor(Math.random() * 2)];

  state.boxes -= 1;
  state.boxesOpened += 1;
  state = reward.apply(state);
  showToast(`Box reward: ${reward.title}`);
  saveState(state);
  render();
}

function rerollQuest() {
  if (state.coins < 20) {
    showToast("Not enough coins to reroll.");
    return;
  }
  state.coins = Math.max(0, state.coins - 20);
  state.quests = [randomFrom(QUEST_POOL)];
  showToast("Quest rerolled.");
  saveState(state);
  render();
}

function buyItem(item) {
  if (state.coins < item.cost) return;
  state.coins -= item.cost;
  state = item.apply(state);
  showToast(`${item.name} purchased.`);
  saveState(state);
  render();
}

function render() {
  maybeResetGoals();
  const progress = progressToNext(state.xp);
  const title = state.titles[state.titles.length - 1] || "Rookie";

  ui.streakValue.textContent = `${state.streak} days`;
  ui.streakHint.textContent = state.lastWorkout ? `Last workout: ${state.lastWorkout}` : "Log a set to begin.";
  ui.levelValue.textContent = progress.level;
  ui.levelHint.textContent = `${progress.progress}/${progress.needed} XP`;
  ui.boxCount.textContent = state.boxes;
  ui.totalReps.textContent = state.totalReps;
  ui.xpValue.textContent = state.xp;
  ui.comboValue.textContent = `x${state.combo.toFixed(1)}`;
  ui.energyValue.textContent = `${state.energy}%`;
  ui.coinValue.textContent = state.coins;
  ui.titleValue.textContent = title;
  ui.legendaryValue.textContent = state.legendaryDrops;
  ui.openBoxBtn.disabled = state.boxes === 0;

  ui.questList.innerHTML = "";
  state.quests.forEach((quest) => {
    const progressText = quest.progress ? `${quest.progress}/${quest.target}` : `0/${quest.target}`;
    const el = document.createElement("div");
    el.className = "quest";
    el.innerHTML = `<div><p class="quest-title">${quest.text}</p><p class="quest-sub">Progress: ${progressText}</p></div>`;
    ui.questList.appendChild(el);
  });

  ui.achievementList.innerHTML = "";
  ACHIEVEMENTS.forEach((ach) => {
    const unlocked = state.achievements && state.achievements.includes(ach.id);
    const el = document.createElement("span");
    el.className = `badge ${unlocked ? "" : "locked"}`;
    el.textContent = unlocked ? ach.title : `Locked: ${ach.title}`;
    ui.achievementList.appendChild(el);
  });

  ui.badgeList.innerHTML = "";
  if (state.badges.length === 0) {
    ui.badgeList.innerHTML = `<div class="empty">Open boxes to collect badges.</div>`;
  } else {
    state.badges.forEach((badge) => {
      const el = document.createElement("span");
      el.className = "badge";
      el.textContent = badge;
      ui.badgeList.appendChild(el);
    });
  }

  ui.leaderboard.innerHTML = `
    <div class="board-row"><span>Best Streak</span><strong>${state.bestStreak || state.streak}</strong></div>
    <div class="board-row"><span>Highest Level</span><strong>${state.bestLevel || progress.level}</strong></div>
    <div class="board-row"><span>Most Reps in a Set</span><strong>${state.bestSet || 0}</strong></div>
    <div class="board-row"><span>Fastest XP Gain</span><strong>${state.bestXp || 0}</strong></div>
  `;

  state.bestStreak = Math.max(state.bestStreak || 0, state.streak);
  state.bestLevel = Math.max(state.bestLevel || 0, progress.level);

  ui.dailyGoal.innerHTML = `
    <p class="goal-title">Daily Goal</p>
    <p>${state.dailyGoal.progress}/${state.dailyGoal.target} reps</p>
    <p class="goal-foot">${state.dailyGoal.done ? "Completed" : "In progress"}</p>
  `;

  ui.weeklyGoal.innerHTML = `
    <p class="goal-title">Weekly Goal</p>
    <p>${state.weeklyGoal.progress}/${state.weeklyGoal.target} reps</p>
    <p class="goal-foot">${state.weeklyGoal.done ? "Completed" : "In progress"}</p>
  `;

  ui.shop.innerHTML = "";
  SHOP_ITEMS.forEach((item) => {
    const card = document.createElement("div");
    card.className = "shop-card";
    card.innerHTML = `
      <div>
        <p class="quest-title">${item.name}</p>
        <p class="quest-sub">${item.effect}</p>
      </div>
      <button class="ghost" data-id="${item.id}">Buy (${item.cost})</button>
    `;
    card.querySelector("button").addEventListener("click", () => buyItem(item));
    ui.shop.appendChild(card);
  });

  ui.journal.innerHTML = "";
  state.journal.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "journal-row";
    row.innerHTML = `<span>${entry.date}</span><span>${entry.reps} reps</span><strong>${entry.xp} XP</strong>`;
    ui.journal.appendChild(row);
  });

  saveState(state);
}

ui.logSetBtn.addEventListener("click", logSet);
ui.openBoxBtn.addEventListener("click", openBox);
ui.rerollQuestBtn = document.getElementById("rerollQuestBtn");
ui.rerollQuestBtn.addEventListener("click", rerollQuest);

render();
