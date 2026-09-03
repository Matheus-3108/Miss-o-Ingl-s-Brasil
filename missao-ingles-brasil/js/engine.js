/* ===================================================================
   MISSÃO INGLÊS BRASIL — ENGINE (LÓGICA DE PROGRESSÃO)
   Funções puras e centralizadas. Não conhecem React nem localStorage
   diretamente (exceto load/save, isolados no fim do arquivo).
   =================================================================== */

(function () {
  "use strict";
  /* Isolado num escopo próprio (IIFE) pelo mesmo motivo do data.js:
   evita colisão de 'const' de mesmo nome entre arquivos <script>
   carregados na mesma página (ex.: CONFIG, WORLDS, VOCABULARY). */


  const { CONFIG, WORLDS, USER_LEVELS, VOCABULARY, ACHIEVEMENTS } = window.MIB_DATA;

  function createNewUser() {
    return {
      id: "guest-" + Date.now(),
      name: "Guest",
      xp: 0,
      coins: 0,
      streak: 0,
      lastStudyDate: null,
      onboardingDone: false,
      interests: [],
      studyTimeGoal: 10,
      estimatedEnglishLevel: null,
      testCompleted: false,
      testStats: null,
      completedLevels: [],
      stars: {}, // levelId -> 1..3
      bestAccuracy: {}, // levelId -> percent
      achievements: [],
      dailyQuests: window.MIB_DATA.generateDailyQuests(),
      dailyQuestDate: todayStr(),
      errorHistory: [], // [{levelId, vocabulary:[], date}]
      vocabularyMastery: {}, // word -> {mastery, errorCount}
      skillProgress: { vocabulary: 10, grammar: 10, listening: 5, speaking: 5, reading: 10, writing: 5 },
    };
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  /* -------------------- FLATTEN HELPERS -------------------- */
  function getAllLevels() {
    const levels = [];
    WORLDS.forEach((w) => {
      (w.chapters || []).forEach((c) => {
        (c.levels || []).forEach((l) => levels.push(l));
      });
    });
    return levels;
  }

  function getLevelById(levelId) {
    return getAllLevels().find((l) => l.id === levelId);
  }

  function getWorldById(worldId) {
    return WORLDS.find((w) => w.id === worldId);
  }

  /* -------------------- DESBLOQUEIO -------------------- */
  function isLevelUnlocked(user, level) {
    if (!level.unlockRequirements || level.unlockRequirements.length === 0) return true;
    return level.unlockRequirements.every((reqId) => user.completedLevels.includes(reqId));
  }

  function getLevelState(user, level) {
    if (user.completedLevels.includes(level.id)) {
      const s = user.stars[level.id] || 1;
      return s >= 3 ? "perfect" : "completed";
    }
    if (level.isBoss) return isLevelUnlocked(user, level) ? "boss-available" : "locked";
    return isLevelUnlocked(user, level) ? "available" : "locked";
  }

  /* -------------------- RECOMPENSAS -------------------- */
  function awardXP(user, amount) {
    return { ...user, xp: user.xp + amount };
  }

  function awardCoins(user, amount) {
    return { ...user, coins: user.coins + amount };
  }

  function calculateStars(correctCount, totalCount) {
    if (totalCount === 0) return 1;
    const ratio = correctCount / totalCount;
    if (ratio >= CONFIG.stars.three) return 3;
    if (ratio >= CONFIG.stars.two) return 2;
    return 1;
  }

  function getUserLevelInfo(xp) {
    let current = USER_LEVELS[0];
    for (const lvl of USER_LEVELS) {
      if (xp >= lvl.minXP) current = lvl;
    }
    const next = USER_LEVELS.find((l) => l.minXP > xp);
    return { ...current, next, progressToNext: next ? (xp - current.minXP) / (next.minXP - current.minXP) : 1 };
  }

  /* -------------------- CONCLUSÃO DE FASE -------------------- */
  function completeLevel(user, levelId, { correctCount, totalCount, missedVocabulary = [] }) {
    let u = { ...user };
    const level = getLevelById(levelId);
    const alreadyCompleted = u.completedLevels.includes(levelId);
    const stars = calculateStars(correctCount, totalCount);
    const accuracy = totalCount === 0 ? 100 : Math.round((correctCount / totalCount) * 100);

    const prevStars = u.stars[levelId] || 0;
    u.stars = { ...u.stars, [levelId]: Math.max(prevStars, stars) };
    u.bestAccuracy = { ...u.bestAccuracy, [levelId]: Math.max(u.bestAccuracy[levelId] || 0, accuracy) };

    let xpGain = correctCount * CONFIG.xp.correctAnswer;
    let coinGain = 0;
    if (!alreadyCompleted) {
      u.completedLevels = [...u.completedLevels, levelId];
      xpGain += level && level.isBoss ? CONFIG.xp.boss : CONFIG.xp.levelComplete;
      coinGain += level && level.isBoss ? CONFIG.coins.bossComplete : CONFIG.coins.levelComplete;
    } else {
      // pequeno bônus por refazer e melhorar
      if (stars > prevStars) {
        xpGain += 5;
      }
    }

    u = awardXP(u, xpGain);
    u = awardCoins(u, coinGain);

    // streak
    const today = todayStr();
    if (u.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      u.streak = u.lastStudyDate === yesterday ? u.streak + 1 : 1;
      u.lastStudyDate = today;
    }

    // vocabulário / mastery
    if (level && level.vocabulary) {
      level.vocabulary.forEach((word) => {
        const prev = u.vocabularyMastery[word] || { mastery: 0, errorCount: 0 };
        const missed = missedVocabulary.includes(word);
        u.vocabularyMastery = {
          ...u.vocabularyMastery,
          [word]: {
            mastery: Math.max(0, Math.min(100, prev.mastery + (missed ? -10 : 20))),
            errorCount: prev.errorCount + (missed ? 1 : 0),
          },
        };
      });
    }

    // registrar erros para revisão
    if (missedVocabulary.length > 0) {
      u.errorHistory = [...u.errorHistory, { levelId, vocabulary: missedVocabulary, date: today }];
    }

    // skill progress (simplificado)
    if (level && level.skills) {
      const skillUpdate = { ...u.skillProgress };
      level.skills.forEach((s) => {
        skillUpdate[s] = Math.min(100, (skillUpdate[s] || 0) + Math.round((correctCount / Math.max(1, totalCount)) * 8));
      });
      u.skillProgress = skillUpdate;
    }

    // daily quests
    u = updateDailyQuests(u, { lessons: 1, xp: xpGain, questions: totalCount });

    // achievements
    u = checkAchievements(u);

    return { user: u, stars, accuracy, xpGain, coinGain, newlyCompleted: !alreadyCompleted };
  }

  function updateDailyQuests(user, deltas) {
    const today = todayStr();
    // BUGFIX: antes, `dailyQuestDate` nunca era persistido de volta no usuário
    // aqui, então essa comparação nunca "grudava" no dia atual — a partir do
    // segundo dia de uso, TODA chamada gerava missões novas (zerando o
    // progresso do dia a cada fase concluída). Agora gravamos `dailyQuestDate`
    // no objeto retornado sempre que missões novas são geradas.
    const isFreshToday = user.dailyQuestDate === today;
    let quests = isFreshToday && Array.isArray(user.dailyQuests) && user.dailyQuests.length
      ? user.dailyQuests
      : window.MIB_DATA.generateDailyQuests();

    quests = quests.map((q) => {
      if (q.progress >= q.target) return q;
      const delta = deltas[q.type] || 0;
      return { ...q, progress: Math.min(q.target, q.progress + delta) };
    });

    let u = { ...user, dailyQuests: quests, dailyQuestDate: today };
    quests.forEach((q, idx) => {
      if (q.progress >= q.target && !q.rewarded) {
        u = awardXP(u, q.rewardXP);
        u = awardCoins(u, q.rewardCoins);
        u.dailyQuests = u.dailyQuests.map((qq, i) => (i === idx ? { ...qq, rewarded: true } : qq));
      }
    });
    return u;
  }

  function checkAchievements(user) {
    const unlocked = new Set(user.achievements);
    ACHIEVEMENTS.forEach((a) => {
      if (!unlocked.has(a.id) && a.check(user)) unlocked.add(a.id);
    });
    return { ...user, achievements: Array.from(unlocked) };
  }

  /* -------------------- PROGRESSO -------------------- */
  function getWorldProgress(user, worldId) {
    const world = getWorldById(worldId);
    if (!world) return { completed: 0, total: 0, percent: 0 };
    const levels = (world.chapters || []).flatMap((c) => c.levels || []);
    const completed = levels.filter((l) => user.completedLevels.includes(l.id)).length;
    return { completed, total: levels.length, percent: levels.length ? Math.round((completed / levels.length) * 100) : 0 };
  }

  function getCurrentLevel(user) {
    const levels = getAllLevels();
    const next = levels.find((l) => !user.completedLevels.includes(l.id) && isLevelUnlocked(user, l));
    return next || levels[levels.length - 1];
  }

  /* -------------------- REVISÃO -------------------- */
  function getReviewQueue(user) {
    return Object.entries(user.vocabularyMastery || {})
      .filter(([word, v]) => v.mastery < 80)
      .sort((a, b) => a[1].mastery - b[1].mastery)
      .slice(0, 8)
      .map(([word, v]) => ({ word, ...v, ...VOCABULARY[word] }));
  }

  function getRecommendedPractice(user) {
    const weakest = Object.entries(user.skillProgress || {}).sort((a, b) => a[1] - b[1])[0];
    return weakest ? weakest[0] : "vocabulary";
  }

  /* -------------------- TESTE DE NÍVEL -------------------- */
  function scorePlacementTest(answers /* {questionId: chosenOption} */, questions) {
    let correct = 0;
    const bandStats = { easy: { correct: 0, total: 0 }, intermediate: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
    questions.forEach((q) => {
      bandStats[q.band].total++;
      if (answers[q.id] === q.answer) {
        correct++;
        bandStats[q.band].correct++;
      }
    });
    return { correct, total: questions.length, bandStats };
  }

  function estimateLevelFromScore(correct) {
    if (correct <= 15) return { code: "A1", title: "Beginner" };
    if (correct <= 25) return { code: "A2", title: "Explorer" };
    if (correct <= 35) return { code: "B1", title: "Communicator" };
    if (correct <= 41) return { code: "B2", title: "Independent Speaker" };
    return { code: "C1", title: "Advanced Speaker" };
  }

  function getLevelMessage(code) {
    const messages = {
      A1: "Você está no começo da sua jornada. Vamos construir seu vocabulário e sua confiança, um passo de cada vez.",
      A2: "Você já reconhece o básico do inglês. Agora vamos fortalecer gramática e vocabulário do dia a dia.",
      B1: "Você já possui uma boa base. Agora vamos desenvolver ainda mais seu vocabulário, gramática, listening e conversação.",
      B2: "Você se comunica bem em inglês. Vamos refinar fluência, listening e situações mais complexas.",
      C1: "Seu inglês está avançado. Vamos manter a prática com conteúdos mais desafiadores.",
    };
    return messages[code] || messages.A1;
  }

  /* -------------------- PERSISTÊNCIA (LOCALSTORAGE) -------------------- */
  const STORAGE_KEY = "mib_user_v1";

  function loadUser() {
    const fresh = createNewUser();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fresh;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return fresh;

      // BUGFIX: o merge raso anterior (`{...fresh, ...parsed}`) confiava
      // cegamente no formato salvo. Se o localStorage estivesse corrompido,
      // vazio em algum campo, ou de uma versão anterior do app sem algum
      // campo novo, isso podia gerar telas quebradas (ex: .map em undefined).
      // Agora cada campo estruturado é validado individualmente e cai no
      // valor padrão de `fresh` quando o formato salvo é inválido.
      const isArr = (v) => Array.isArray(v);
      const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
      return {
        ...fresh,
        ...parsed,
        interests: isArr(parsed.interests) ? parsed.interests : fresh.interests,
        completedLevels: isArr(parsed.completedLevels) ? parsed.completedLevels : fresh.completedLevels,
        achievements: isArr(parsed.achievements) ? parsed.achievements : fresh.achievements,
        errorHistory: isArr(parsed.errorHistory) ? parsed.errorHistory : fresh.errorHistory,
        dailyQuests: isArr(parsed.dailyQuests) && parsed.dailyQuests.length ? parsed.dailyQuests : fresh.dailyQuests,
        stars: isObj(parsed.stars) ? parsed.stars : fresh.stars,
        bestAccuracy: isObj(parsed.bestAccuracy) ? parsed.bestAccuracy : fresh.bestAccuracy,
        vocabularyMastery: isObj(parsed.vocabularyMastery) ? parsed.vocabularyMastery : fresh.vocabularyMastery,
        // skillProgress recebe merge profundo: se uma habilidade nova for
        // adicionada no futuro, contas antigas não perdem as existentes
        // nem ficam sem a nova (que viria com o valor padrão de `fresh`).
        skillProgress: { ...fresh.skillProgress, ...(isObj(parsed.skillProgress) ? parsed.skillProgress : {}) },
      };
    } catch (e) {
      console.error("Failed to load user", e);
      return fresh;
    }
  }

  function saveUser(user) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save user", e);
    }
  }

  function resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
  }

  window.MIB_ENGINE = {
    createNewUser, getAllLevels, getLevelById, getWorldById,
    isLevelUnlocked, getLevelState, awardXP, awardCoins, calculateStars,
    getUserLevelInfo, completeLevel, getWorldProgress, getCurrentLevel,
    getReviewQueue, getRecommendedPractice, scorePlacementTest,
    estimateLevelFromScore, getLevelMessage, loadUser, saveUser, resetProgress,
    checkAchievements,
  };

})();
