/* ===================================================================
   MISSÃO INGLÊS BRASIL — APP / UI (camada de apresentação)
   Consome window.MIB_DATA e window.MIB_ENGINE (já carregados antes
   deste arquivo — ver ordem dos <script> em index.html).
   SPA em JavaScript puro: nenhuma dependência externa, nenhum reload
   de página. Todo o estado da tela vive no objeto `state` abaixo.
   =================================================================== */

(function () {
  "use strict";

  const root = document.getElementById("root");

  /* -------------------- VERIFICAÇÃO DE DEPENDÊNCIAS -------------------- */
  if (!window.MIB_DATA || !window.MIB_ENGINE) {
    const faltando = [];
    if (!window.MIB_DATA) faltando.push("js/data.js");
    if (!window.MIB_ENGINE) faltando.push("js/engine.js");
    const detalhes = (window.__MIB_LOAD_ERRORS || []);
    const detalhesHtml = detalhes.length
      ? '<p style="margin-top:14px;font-size:12px;color:var(--ink-soft);text-align:left;background:var(--bg);border-radius:10px;padding:12px;word-break:break-word;"><strong>Motivo detectado:</strong><br>' +
        detalhes.map(function (d) { return d.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }).join("<br>") +
        "</p>"
      : '<p style="margin-top:14px;font-size:12px;color:var(--ink-soft);">Abra o Console do navegador (F12 → aba Console) para ver o motivo exato.</p>';
    root.innerHTML =
      '<div class="app-shell"><div class="error-screen">' +
      '<div class="emoji">⚠️</div>' +
      "<h3>Não foi possível carregar o aplicativo</h3>" +
      "<p>Não carregou: <strong>" + faltando.join(", ") + "</strong>. Verifique se esse(s) arquivo(s) está(ão) na pasta certa e se a ordem dos scripts em index.html está correta.</p>" +
      detalhesHtml +
      "</div></div>";
    console.error("MIB_DATA ou MIB_ENGINE não encontrados em window.", detalhes);
    return;
  }

  const DATA = window.MIB_DATA;
  const ENGINE = window.MIB_ENGINE;

  const NAV_SCREENS = ["home", "map", "vocabulary", "achievements", "profile"];

  /* -------------------- ESTADO GLOBAL DA UI -------------------- */
  const state = {
    screen: "splash",
    user: null,
    onboarding: { name: "", interests: [], time: null },
    test: { questions: [], index: 0, answers: {} },
    testResultData: null,
    currentLevelId: null,
    lesson: { levelId: null, index: 0, correct: 0, missed: [], answered: false, selected: null, sentence: [], bank: [] },
    boss: { levelId: null, step: 0, correct: 0, total: 0, chosen: {}, answered: false, selected: null },
    result: null,
    resultLevel: null,
    mapWorldId: "world1",
    vocab: { query: "", category: "all" },
    modal: null,
    toast: null,
  };

  /* -------------------- HELPERS -------------------- */
  function esc(str) {
    if (str === undefined || str === null) return "";
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function skillLabel(skill) {
    const map = {
      vocabulary: "📖 Vocabulário",
      grammar: "✏️ Gramática",
      listening: "🎧 Listening",
      speaking: "🗣️ Speaking",
      reading: "📰 Reading",
      writing: "✍️ Writing",
    };
    return map[skill] || esc(skill);
  }

  function translateDifficulty(d) {
    const map = { easy: "Fácil", medium: "Médio", hard: "Difícil" };
    return map[d] || esc(d);
  }

  function go(screen, extra) {
    state.screen = screen;
    if (extra) Object.assign(state, extra);
    render();
    window.scrollTo(0, 0);
  }

  function showToast(msg) {
    state.toast = msg;
    render();
    setTimeout(() => {
      state.toast = null;
      render();
    }, 2200);
  }

  function speakWord(word) {
    if (!("speechSynthesis" in window)) {
      showToast("Áudio não suportado neste navegador");
      return;
    }
    try {
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.error("Erro ao falar palavra:", e);
    }
  }

  /* -------------------- INICIALIZAÇÃO -------------------- */
  function init() {
    render(); // mostra splash
    setTimeout(() => {
      try {
        state.user = ENGINE.loadUser();
      } catch (e) {
        console.error("Erro ao carregar usuário:", e);
        state.user = ENGINE.createNewUser();
      }
      if (!state.user || !state.user.onboardingDone) {
        go("onboarding-welcome");
      } else {
        go("home");
      }
    }, 900);
  }

  /* -------------------- RENDER PRINCIPAL -------------------- */
  function render() {
    // preserva foco/cursor de um input controlado (ex: busca de vocabulário)
    const active = document.activeElement;
    const activeBind = active && active.getAttribute && active.getAttribute("data-bind");
    const selStart = active && typeof active.selectionStart === "number" ? active.selectionStart : null;

    try {
      let html = renderScreen();
      if (NAV_SCREENS.indexOf(state.screen) !== -1) {
        html = wrapWithNav(html, state.screen);
      } else {
        html = `<div class="screen no-nav">${html}</div>`;
      }
      root.innerHTML =
        `<div class="app-shell">${html}` +
        `${state.modal ? state.modal : ""}` +
        `${state.toast ? `<div class="toast">${esc(state.toast)}</div>` : ""}` +
        `</div>`;
    } catch (err) {
      console.error("Erro ao renderizar tela:", err);
      root.innerHTML =
        '<div class="app-shell"><div class="error-screen">' +
        '<div class="emoji">😕</div>' +
        "<h3>Ops! Algo deu errado.</h3>" +
        "<p>Ocorreu um erro inesperado nesta tela. Você pode voltar para a Home e tentar novamente.</p>" +
        '<button class="btn btn-primary" data-action="go-home" style="margin-top:18px;">VOLTAR PARA HOME</button>' +
        "</div></div>";
    }

    if (activeBind) {
      const el2 = root.querySelector(`[data-bind="${activeBind}"]`);
      if (el2) {
        el2.focus();
        if (selStart !== null && el2.setSelectionRange) {
          try { el2.setSelectionRange(selStart, selStart); } catch (e) { /* ignora */ }
        }
      }
    }
  }

  function renderScreen() {
    switch (state.screen) {
      case "splash": return screenSplash();
      case "onboarding-welcome": return screenWelcome();
      case "onboarding-interests": return screenInterests();
      case "onboarding-time": return screenTime();
      case "onboarding-test-intro": return screenTestIntro();
      case "placement-test": return screenPlacementTest();
      case "test-result": return screenTestResult();
      case "home": return screenHome();
      case "map": return screenMap();
      case "level-detail": return screenLevelDetail();
      case "lesson": return screenLesson();
      case "lesson-result": return screenLessonResult();
      case "boss": return screenBoss();
      case "boss-result": return screenBossResult();
      case "vocabulary": return screenVocabulary();
      case "achievements": return screenAchievements();
      case "profile": return screenProfile();
      default: return screenHome();
    }
  }

  function topHeader() {
    const u = state.user;
    return `<div class="top-header">
      <div class="brand"><span class="brand-badge">🇬🇧</span> Missão Inglês</div>
      <div class="header-stats">
        <div class="stat-pill">🪙 ${u.coins}</div>
        <div class="stat-pill">🔥 ${u.streak}</div>
      </div>
    </div>`;
  }

  function wrapWithNav(content, active) {
    const items = [
      { id: "home", icon: "🏠", label: "Home" },
      { id: "map", icon: "🗺️", label: "Mapa" },
      { id: "vocabulary", icon: "📚", label: "Vocab." },
      { id: "achievements", icon: "🏆", label: "Conquistas" },
      { id: "profile", icon: "👤", label: "Perfil" },
    ];
    const nav = `<div class="bottom-nav">${items
      .map(
        (i) =>
          `<button class="nav-item ${i.id === active ? "active" : ""}" data-action="nav" data-screen="${i.id}" aria-label="${i.label}">` +
          `<span class="nav-icon">${i.icon}</span>${i.label}</button>`
      )
      .join("")}</div>`;
    return `${topHeader()}<div class="screen">${content}</div>${nav}`;
  }

  /* ==================== SPLASH ==================== */
  function screenSplash() {
    return `<div class="welcome-screen">
      <div class="welcome-logo">🇬🇧</div>
      <h1 class="welcome-title">MISSÃO INGLÊS BRASIL</h1>
      <p class="welcome-sub">Preparando sua jornada de aprendizado...</p>
    </div>`;
  }

  /* ==================== ONBOARDING ==================== */
  function screenWelcome() {
    return `<div class="welcome-screen">
      <div class="welcome-logo">🇬🇧</div>
      <h1 class="welcome-title">MISSÃO INGLÊS BRASIL</h1>
      <p class="welcome-sub">Aprenda inglês de verdade através de uma jornada gamificada, com mundos, fases, exercícios e desafios.</p>
      <div style="width:100%; margin-bottom:20px;">
        <input class="search-input" type="text" maxlength="24" placeholder="Como podemos te chamar?" value="${esc(state.onboarding.name)}" data-bind="name" aria-label="Seu nome" />
      </div>
      <button class="btn btn-primary btn-block btn-lg" data-action="onboarding-start">COMEÇAR</button>
    </div>`;
  }

  function onboardingProgress(step) {
    let dots = "";
    for (let i = 1; i <= 3; i++) dots += `<span class="${i <= step ? "done" : ""}"></span>`;
    return `<div class="onboarding-progress">${dots}</div>`;
  }

  function screenInterests() {
    const sel = state.onboarding.interests;
    return `
      <div class="onboarding-header"><h2>Por que você quer aprender inglês?</h2><p style="color:var(--ink-soft);margin-top:6px;">Escolha uma ou mais opções.</p></div>
      ${onboardingProgress(1)}
      <div class="onboarding-body">
        <div class="option-list">${DATA.INTEREST_OPTIONS.map(
          (o) =>
            `<button class="option-chip ${sel.indexOf(o.id) !== -1 ? "selected" : ""}" data-action="toggle-interest" data-id="${o.id}">` +
            `<span class="chip-icon">${o.icon}</span>${esc(o.label)}</button>`
        ).join("")}</div>
      </div>
      <div class="onboarding-footer"><button class="btn btn-primary btn-block btn-lg" data-action="interests-continue" ${sel.length === 0 ? "disabled" : ""}>CONTINUAR</button></div>`;
  }

  function screenTime() {
    const sel = state.onboarding.time;
    return `
      <div class="onboarding-header"><h2>Quanto tempo você quer estudar por dia?</h2></div>
      ${onboardingProgress(2)}
      <div class="onboarding-body">
        <div class="option-list">${DATA.TIME_OPTIONS.map(
          (o) => `<button class="option-chip ${sel === o.id ? "selected" : ""}" data-action="select-time" data-id="${o.id}">⏱️ ${esc(o.label)}</button>`
        ).join("")}</div>
      </div>
      <div class="onboarding-footer"><button class="btn btn-primary btn-block btn-lg" data-action="time-continue" ${sel ? "" : "disabled"}>CONTINUAR</button></div>`;
  }

  function screenTestIntro() {
    return `
      <div class="onboarding-header"><h2>Descubra seu nível de inglês</h2></div>
      ${onboardingProgress(3)}
      <div class="onboarding-body center-col">
        <div style="font-size:56px; margin:10px 0 6px;">🎯</div>
        <p style="color:var(--ink-soft); line-height:1.6;">Vamos fazer um teste rápido com perguntas de diferentes níveis para montar sua jornada personalizada. Responda com calma — não existe resposta certa ou errada, apenas o seu ponto de partida.</p>
      </div>
      <div class="onboarding-footer"><button class="btn btn-primary btn-block btn-lg" data-action="start-test">COMEÇAR TESTE</button></div>`;
  }

  /* ==================== TESTE DE NÍVEL ==================== */
  function screenPlacementTest() {
    const { questions, index, answers } = state.test;
    const q = questions[index];
    const pct = Math.round((index / questions.length) * 100);
    const selected = answers[q.id];
    const isLast = index + 1 === questions.length;
    return `
      <div class="lesson-header"><div style="font-weight:800;">Teste de Nível</div></div>
      <div style="padding:0 20px;">
        <div class="progress-row"><span>Questão ${index + 1} de ${questions.length}</span><span>${pct}%</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="exercise-body">
        ${q.emoji ? `<div class="image-hero">${q.emoji}</div>` : ""}
        <div class="exercise-question">${esc(q.q)}</div>
        <div class="answer-grid">${q.options
          .map((opt) => `<button class="answer-option ${opt === selected ? "selected" : ""}" data-action="select-test-answer" data-answer="${esc(opt)}">${esc(opt)}</button>`)
          .join("")}</div>
      </div>
      <div style="padding:16px 20px 26px;">
        <button class="btn btn-primary btn-block btn-lg" data-action="test-continue" ${selected ? "" : "disabled"}>${isLast ? "FINALIZAR TESTE" : "CONTINUAR"}</button>
      </div>`;
  }

  function finishTest() {
    const results = ENGINE.scorePlacementTest(state.test.answers, state.test.questions);
    const level = ENGINE.estimateLevelFromScore(results.correct);
    const message = ENGINE.getLevelMessage(level.code);

    state.user.name = state.onboarding.name || "Guest";
    state.user.interests = state.onboarding.interests.slice();
    state.user.studyTimeGoal = state.onboarding.time;
    state.user.testCompleted = true;
    state.user.testStats = results;
    state.user.estimatedEnglishLevel = level.code;
    state.user.onboardingDone = true;
    ENGINE.saveUser(state.user);

    go("test-result", { testResultData: { level, results, message } });
  }

  function screenTestResult() {
    const { level, results, message } = state.testResultData;
    const accuracy = results.total ? Math.round((results.correct / results.total) * 100) : 0;
    return `<div class="result-screen">
      <div style="font-size:52px;">🎯</div>
      <h2 style="margin-top:10px;">Seu nível é ${esc(level.code)}</h2>
      <p style="color:var(--primary-dark); font-weight:800; margin-top:2px;">${esc(level.title)}</p>
      <p style="color:var(--ink-soft); margin-top:14px; line-height:1.55;">${esc(message)}</p>
      <div class="result-stats-row">
        <div class="result-stat"><div class="num">${results.correct}</div><div class="lbl">ACERTOS</div></div>
        <div class="result-stat"><div class="num">${results.total}</div><div class="lbl">QUESTÕES</div></div>
        <div class="result-stat"><div class="num">${accuracy}%</div><div class="lbl">PRECISÃO</div></div>
      </div>
      <div class="result-actions"><button class="btn btn-primary btn-block btn-lg" data-action="finish-onboarding">COMEÇAR MINHA JORNADA</button></div>
    </div>`;
  }

  /* ==================== HOME ==================== */
  function screenHome() {
    const u = state.user;
    const lvlInfo = ENGINE.getUserLevelInfo(u.xp);
    const current = ENGINE.getCurrentLevel(u);
    const pct = lvlInfo.next ? Math.round(lvlInfo.progressToNext * 100) : 100;
    return `
      <div class="home-greeting">
        <h2>Olá, ${esc(u.name)}! 👋</h2>
        <p style="color:var(--ink-soft); margin-top:4px;">${esc(lvlInfo.title)} · Nível ${lvlInfo.level}</p>
        <div class="progress-row" style="margin-top:14px;"><span>XP para o próximo nível</span><span>${lvlInfo.next ? pct + "%" : "MÁXIMO"}</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="streak-row">
          <div class="mini-stat"><div class="val">${u.xp}</div><div class="lbl">XP</div></div>
          <div class="mini-stat"><div class="val">${u.coins}</div><div class="lbl">MOEDAS</div></div>
          <div class="mini-stat"><div class="val">${u.streak}🔥</div><div class="lbl">STREAK</div></div>
        </div>
      </div>
      <div class="section">
        <div class="continue-card">
          <div class="tag">CONTINUAR APRENDENDO</div>
          <h3>${current ? esc(current.title) : "Você completou tudo disponível!"}</h3>
          ${
            current
              ? `<button class="btn btn-secondary btn-block" data-action="open-level" data-level-id="${current.id}">${current.isBoss ? "ENFRENTAR O BOSS" : "COMEÇAR FASE"}</button>`
              : `<button class="btn btn-secondary btn-block" data-action="nav" data-screen="map">VER MAPA</button>`
          }
        </div>
      </div>
      <div class="section">
        <div class="section-title">Missões diárias</div>
        ${u.dailyQuests
          .map(
            (q) => `<div class="quest-item">
              <div class="quest-check ${q.progress >= q.target ? "done" : ""}">${q.progress >= q.target ? "✓" : ""}</div>
              <div class="quest-text"><div class="title">${esc(q.title)}</div><div class="sub">${Math.min(q.progress, q.target)}/${q.target} · +${q.rewardXP} XP</div></div>
            </div>`
          )
          .join("")}
      </div>
      <div class="section">
        <div class="section-title">Suas habilidades</div>
        ${Object.entries(u.skillProgress)
          .map(([skill, val]) => `<div class="skill-row"><span class="label">${skillLabel(skill)}</span><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, val)}%"></div></div></div>`)
          .join("")}
      </div>`;
  }

  /* ==================== MAPA ==================== */
  function screenMap() {
    const user = state.user;
    const worldId = state.mapWorldId;
    const world = ENGINE.getWorldById(worldId) || DATA.WORLDS[0];
    const worldTabs = DATA.WORLDS.map(
      (w) => `<button class="filter-chip ${w.id === worldId ? "active" : ""}" data-action="open-world" data-world-id="${w.id}">${esc(w.title)}</button>`
    ).join("");

    let body = "";
    if (world.locked) {
      body = `<div class="world-locked-card"><div class="lock-icon">🔒</div><h3>${esc(world.title)}</h3><p style="margin-top:8px;">${esc(world.unlockMessage || "Continue avançando para desbloquear.")}</p></div>`;
    } else {
      const progress = ENGINE.getWorldProgress(user, world.id);
      body += `<div style="padding:0 20px;">
        <div class="progress-row"><span>PROGRESSO DO MUNDO</span><span>${progress.completed}/${progress.total}</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${progress.percent}%"></div></div>
      </div>`;
      (world.chapters || []).forEach((chapter) => {
        body += `<div class="map-world-header"><div class="section-title">${esc(chapter.title)}</div></div><div class="map-path">`;
        chapter.levels.forEach((level, li) => {
          const st = ENGINE.getLevelState(user, level);
          const offset = li % 3 === 1 ? "level-node-offset-r" : li % 3 === 2 ? "level-node-offset-l" : "";
          if (li > 0) body += `<div class="map-connector ${st !== "locked" ? "done" : ""}"></div>`;
          const icon = level.isBoss ? "👑" : st === "locked" ? "🔒" : st === "perfect" ? "⭐" : st === "completed" ? "✅" : "📘";
          body += `<div class="level-node-wrap ${offset}">
            <button class="level-node ${st}" data-action="open-level" data-level-id="${level.id}" aria-label="${esc(level.title)}">${icon}</button>
            <div class="level-node-label">${esc(level.title)}</div>
          </div>`;
        });
        body += `</div>`;
      });
    }

    return `<div class="map-world-header">
      <div class="filter-row">${worldTabs}</div>
      <div class="map-world-title" style="margin-top:12px;">${esc(world.title)}</div>
      <div class="map-world-sub">${esc(world.description || "")}</div>
    </div>${body}`;
  }

  function showLockedModal(level) {
    state.modal = `<div class="locked-modal-backdrop" data-action="close-modal" role="presentation">
      <div class="locked-modal" data-action="noop" role="dialog" aria-modal="true" aria-labelledby="locked-modal-title">
        <div class="lock-icon" style="font-size:34px;">🔒</div>
        <h3 id="locked-modal-title">Fase bloqueada</h3>
        <p style="color:var(--ink-soft); margin:10px 0 18px;">Complete a fase anterior para desbloquear "${esc(level.title)}".</p>
        <button class="btn btn-primary btn-block" data-action="close-modal">ENTENDI</button>
      </div>
    </div>`;
    render();
  }

  /* ==================== DETALHE DA FASE ==================== */
  function screenLevelDetail() {
    const level = ENGINE.getLevelById(state.currentLevelId);
    if (!level) return screenNotFound();
    const isBoss = level.isBoss;
    return `
      <div class="lesson-header"><button class="lesson-close" data-action="go-map" aria-label="Voltar ao mapa">✕</button><div style="font-weight:800;">Detalhes da fase</div></div>
      <div class="level-detail-header">
        <div class="level-detail-icon">${isBoss ? "👑" : "📘"}</div>
        <h2>${esc(level.title)}</h2>
        <p style="color:var(--ink-soft); margin-top:6px;">${esc(level.objective)}</p>
      </div>
      <div class="section">
        <div class="chip-row">
          <span class="exercise-meta">Dificuldade: ${translateDifficulty(level.difficulty)}</span>
          ${(level.skills || []).map((s) => `<span class="exercise-meta">${skillLabel(s)}</span>`).join("")}
        </div>
        ${
          level.vocabulary && level.vocabulary.length
            ? `<div><div class="section-title">Vocabulário desta fase</div><div class="word-bank">${level.vocabulary.map((w) => `<span class="word-chip">${esc(w)}</span>`).join("")}</div></div>`
            : ""
        }
        <div class="reward-row">
          <div class="reward-pill">✨ ${level.rewardXP}<div class="lbl">XP</div></div>
          <div class="reward-pill">🪙 ${level.rewardCoins}<div class="lbl">MOEDAS</div></div>
        </div>
      </div>
      <div style="padding:18px 22px 30px;">
        <button class="btn btn-primary btn-block btn-lg" data-action="begin-level" data-level-id="${level.id}">${isBoss ? "ENFRENTAR O BOSS" : "COMEÇAR"}</button>
      </div>`;
  }

  function screenNotFound() {
    return `<div class="error-screen"><div class="emoji">🔍</div><h3>Fase não encontrada</h3><button class="btn btn-primary" data-action="go-map" style="margin-top:16px;">VOLTAR AO MAPA</button></div>`;
  }

  /* ==================== LIÇÃO / EXERCÍCIOS ==================== */
  function initExerciseState(ex) {
    state.lesson.selected = null;
    state.lesson.answered = false;
    if (ex.type === "sentence_building") {
      state.lesson.sentence = [];
      state.lesson.bank = shuffle(ex.words.slice());
    } else {
      state.lesson.sentence = [];
      state.lesson.bank = [];
    }
  }

  function initLesson(level) {
    state.lesson.levelId = level.id;
    state.lesson.index = 0;
    state.lesson.correct = 0;
    state.lesson.missed = [];
    initExerciseState(level.exercises[0]);
    go("lesson");
  }

  function isExerciseCorrect(ex) {
    if (ex.type === "sentence_building") return state.lesson.sentence.join(" ") === ex.correctAnswer;
    return state.lesson.selected === ex.correctAnswer;
  }

  function renderAnswerArea(ex) {
    if (ex.type === "sentence_building") return renderSentenceBuilder(ex);
    const selected = state.lesson.selected;
    const answered = state.lesson.answered;
    return `<div class="answer-grid">${ex.options
      .map((opt) => {
        let cls = "answer-option";
        if (answered) {
          if (opt === ex.correctAnswer) cls += " correct";
          else if (opt === selected) cls += " incorrect";
        } else if (opt === selected) {
          cls += " selected";
        }
        return `<button class="${cls}" data-action="select-exercise-answer" data-answer="${esc(opt)}" ${answered ? "disabled" : ""}>${esc(opt)}</button>`;
      })
      .join("")}</div>`;
  }

  function renderSentenceBuilder(ex) {
    const answered = state.lesson.answered;
    const chosen = state.lesson.sentence;
    const bank = state.lesson.bank;
    return `
      <div class="sentence-slot">${
        chosen.length
          ? chosen
              .map(
                (w, i) =>
                  `<span class="word-chip" ${answered ? "" : `data-action="sentence-remove" data-index="${i}"`} style="${answered ? "cursor:default;" : ""}">${esc(w)}</span>`
              )
              .join("")
          : '<span style="color:var(--ink-soft); font-size:13px;">Toque nas palavras abaixo para montar a frase</span>'
      }</div>
      <div class="word-bank">${bank.map((w, i) => `<span class="word-chip" data-action="sentence-pick" data-index="${i}">${esc(w)}</span>`).join("")}</div>
      ${!answered ? `<button class="btn btn-primary btn-block" data-action="sentence-check" ${chosen.length === 0 ? "disabled" : ""}>VERIFICAR</button>` : ""}`;
  }

  function renderFeedbackBar(level, ex) {
    if (!state.lesson.answered) return "";
    const correct = isExerciseCorrect(ex);
    const isLast = state.lesson.index + 1 >= level.exercises.length;
    return `<div class="feedback-bar ${correct ? "correct" : "incorrect"}">
      <div class="feedback-title ${correct ? "correct" : "incorrect"}">${correct ? "✅ Correto!" : "❌ Não foi dessa vez"}</div>
      ${!correct && ex.correctAnswer ? `<div class="feedback-explain"><strong>Resposta correta:</strong> ${esc(ex.correctAnswer)}</div>` : ""}
      ${ex.explanation ? `<div class="feedback-explain">${esc(ex.explanation)}</div>` : ""}
      <button class="btn btn-primary btn-block" data-action="lesson-continue">${isLast ? "FINALIZAR" : "CONTINUAR"}</button>
    </div>`;
  }

  function screenLesson() {
    const level = ENGINE.getLevelById(state.lesson.levelId);
    const ex = level.exercises[state.lesson.index];
    const pct = Math.round((state.lesson.index / level.exercises.length) * 100);
    return `
      <div class="lesson-header">
        <button class="lesson-close" data-action="exit-lesson" aria-label="Sair da aula">✕</button>
        <div class="lesson-progress-track"><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div>
      </div>
      <div class="exercise-body">
        <div class="exercise-meta">${skillLabel(ex.skill)} · Questão ${state.lesson.index + 1} de ${level.exercises.length}</div>
        ${ex.type === "reading" ? `<div class="passage-box">${esc(ex.passage)}</div>` : ""}
        ${ex.type === "image_choice" ? `<div class="image-hero">${ex.emoji}</div>` : ""}
        <div class="exercise-question">${esc(ex.question)}</div>
        ${renderAnswerArea(ex)}
      </div>
      ${renderFeedbackBar(level, ex)}`;
  }

  function finalizeLesson() {
    const level = ENGINE.getLevelById(state.lesson.levelId);
    const res = ENGINE.completeLevel(state.user, level.id, {
      correctCount: state.lesson.correct,
      totalCount: level.exercises.length,
      missedVocabulary: state.lesson.missed,
    });
    state.user = res.user;
    ENGINE.saveUser(state.user);
    go("lesson-result", { result: res, resultLevel: level });
  }

  function screenLessonResult() {
    const r = state.result;
    const level = state.resultLevel;
    const stars = "★".repeat(r.stars) + "☆".repeat(3 - r.stars);
    return `<div class="result-screen">
      <div style="font-size:52px;">🎉</div>
      <h2 style="margin-top:10px;">MISSÃO CONCLUÍDA!</h2>
      <p style="color:var(--ink-soft); margin-top:4px;">${esc(level.title)}</p>
      <div class="result-stars">${stars}</div>
      <div class="result-stats-row">
        <div class="result-stat"><div class="num">${r.accuracy}%</div><div class="lbl">ACERTOS</div></div>
        <div class="result-stat"><div class="num">+${r.xpGain}</div><div class="lbl">XP</div></div>
        <div class="result-stat"><div class="num">+${r.coinGain}</div><div class="lbl">MOEDAS</div></div>
      </div>
      <div class="result-actions">
        <button class="btn btn-primary btn-block btn-lg" data-action="go-map">CONTINUAR</button>
        <button class="btn btn-ghost btn-block" data-action="redo-level" data-level-id="${level.id}">REFAZER FASE</button>
      </div>
    </div>`;
  }

  /* ==================== BOSS ==================== */
  function initBoss(level) {
    state.boss = {
      levelId: level.id,
      step: 0,
      correct: 0,
      total: level.dialogue.filter((d) => d.speaker === "user").length,
      chosen: {},
      answered: false,
      selected: null,
    };
    go("boss");
  }

  function bossAdvance() {
    const level = ENGINE.getLevelById(state.boss.levelId);
    state.boss.step++;
    state.boss.answered = false;
    state.boss.selected = null;
    if (state.boss.step >= level.dialogue.length) {
      finishBoss();
    } else {
      render();
    }
  }

  function finishBoss() {
    const level = ENGINE.getLevelById(state.boss.levelId);
    const res = ENGINE.completeLevel(state.user, level.id, {
      correctCount: state.boss.correct,
      totalCount: state.boss.total,
      missedVocabulary: [],
    });
    state.user = res.user;
    ENGINE.saveUser(state.user);
    go("boss-result", { result: res, resultLevel: level });
  }

  function screenBoss() {
    const level = ENGINE.getLevelById(state.boss.levelId);
    const dialogue = level.dialogue;
    const step = state.boss.step;

    let html = `<div class="boss-header"><div class="boss-avatar">🤖</div><h3>${esc(level.title)}</h3></div><div class="chat-log">`;
    for (let i = 0; i < step; i++) {
      const d = dialogue[i];
      if (d.speaker === "npc") html += `<div class="chat-bubble npc">${esc(d.line)}</div>`;
      else html += `<div class="chat-bubble user">${esc(state.boss.chosen[i])}</div>`;
    }
    html += `</div>`;

    const current = dialogue[step];
    if (!current) {
      html += `<div style="padding:20px;"><button class="btn btn-primary btn-block" data-action="boss-advance">CONTINUAR</button></div>`;
    } else if (current.speaker === "npc") {
      html += `<div class="feedback-bar"><div class="chat-bubble npc" style="align-self:flex-start; margin-bottom:12px;">${esc(current.line)}</div><button class="btn btn-primary btn-block" data-action="boss-advance">CONTINUAR</button></div>`;
    } else {
      const answered = state.boss.answered;
      html += `<div class="exercise-body" style="padding-top:6px;">
        <div class="answer-grid">${current.options
          .map((opt) => {
            let cls = "answer-option";
            if (answered) {
              if (opt === current.correctAnswer) cls += " correct";
              else if (opt === state.boss.selected) cls += " incorrect";
            } else if (opt === state.boss.selected) cls += " selected";
            return `<button class="${cls}" data-action="boss-pick" data-answer="${esc(opt)}" ${answered ? "disabled" : ""}>${esc(opt)}</button>`;
          })
          .join("")}</div>
      </div>`;
      if (answered) {
        const correct = state.boss.selected === current.correctAnswer;
        html += `<div class="feedback-bar ${correct ? "correct" : "incorrect"}">
          <div class="feedback-title ${correct ? "correct" : "incorrect"}">${correct ? "✅ Ótima resposta!" : "❌ Vamos tentar lembrar na próxima"}</div>
          ${current.explanation ? `<div class="feedback-explain">${esc(current.explanation)}</div>` : ""}
          <button class="btn btn-primary btn-block" data-action="boss-advance">CONTINUAR</button>
        </div>`;
      }
    }
    return html;
  }

  function screenBossResult() {
    const r = state.result;
    const level = state.resultLevel;
    return `<div class="result-screen" style="background: linear-gradient(180deg, #EDE7FF, var(--paper) 55%);">
      <div class="boss-avatar" style="width:80px;height:80px;font-size:38px;">🏆</div>
      <h2 style="margin-top:14px;">BOSS DERROTADO!</h2>
      <p style="color:var(--ink-soft); margin-top:4px;">${esc(level.title)}</p>
      <div class="result-stars">${"★".repeat(r.stars)}${"☆".repeat(3 - r.stars)}</div>
      <div class="result-stats-row">
        <div class="result-stat"><div class="num">${r.accuracy}%</div><div class="lbl">ACERTOS</div></div>
        <div class="result-stat"><div class="num">+${r.xpGain}</div><div class="lbl">XP</div></div>
        <div class="result-stat"><div class="num">+${r.coinGain}</div><div class="lbl">MOEDAS</div></div>
      </div>
      <div class="result-actions">
        <button class="btn btn-primary btn-block btn-lg" data-action="go-map">CONTINUAR</button>
      </div>
    </div>`;
  }

  /* ==================== CONQUISTAS ==================== */
  function screenAchievements() {
    const u = state.user;
    return `<div class="section">
      <div class="section-title">Conquistas (${u.achievements.length}/${DATA.ACHIEVEMENTS.length})</div>
      ${DATA.ACHIEVEMENTS.map((a) => {
        const unlocked = u.achievements.indexOf(a.id) !== -1;
        return `<div class="achievement-item ${unlocked ? "" : "locked"}">
          <div style="font-size:28px;">${a.icon}</div>
          <div><div style="font-weight:800;">${esc(a.title)}</div><div style="font-size:12.5px; color:var(--ink-soft);">${esc(a.description)}</div></div>
        </div>`;
      }).join("")}
    </div>`;
  }

  /* ==================== PERFIL ==================== */
  function screenProfile() {
    const u = state.user;
    const lvlInfo = ENGINE.getUserLevelInfo(u.xp);
    const totalStars = Object.values(u.stars || {}).reduce((a, b) => a + b, 0);
    return `
      <div class="profile-header">
        <div class="avatar">${esc((u.name || "G")[0].toUpperCase())}</div>
        <h2>${esc(u.name)}</h2>
        <p style="color:var(--ink-soft);">${esc(lvlInfo.title)} · Nível ${lvlInfo.level}</p>
        ${u.estimatedEnglishLevel ? `<div class="exercise-meta" style="margin-top:8px;">Nível de inglês: ${esc(u.estimatedEnglishLevel)}</div>` : ""}
      </div>
      <div class="section">
        <div class="result-stats-row">
          <div class="result-stat"><div class="num">${u.xp}</div><div class="lbl">XP</div></div>
          <div class="result-stat"><div class="num">${u.coins}</div><div class="lbl">MOEDAS</div></div>
          <div class="result-stat"><div class="num">${u.streak}</div><div class="lbl">STREAK</div></div>
        </div>
        <div class="result-stats-row">
          <div class="result-stat"><div class="num">${u.completedLevels.length}</div><div class="lbl">FASES</div></div>
          <div class="result-stat"><div class="num">${totalStars}</div><div class="lbl">ESTRELAS</div></div>
          <div class="result-stat"><div class="num">${u.achievements.length}</div><div class="lbl">CONQUISTAS</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Sobre sua conta</div>
        <button class="btn btn-ghost btn-block" data-action="reset-progress">REINICIAR PROGRESSO</button>
      </div>`;
  }

  /* ==================== VOCABULÁRIO ==================== */
  function screenVocabulary() {
    const u = state.user;
    const q = state.vocab.query.trim().toLowerCase();
    const cat = state.vocab.category;
    const words = Object.values(DATA.VOCABULARY);
    const categories = ["all"].concat(Array.from(new Set(words.map((w) => w.category))));
    const filtered = words.filter((w) => {
      const matchesQuery = !q || w.word.toLowerCase().indexOf(q) !== -1 || w.translation.toLowerCase().indexOf(q) !== -1;
      const matchesCat = cat === "all" || w.category === cat;
      return matchesQuery && matchesCat;
    });

    return `
      <div class="section">
        <input class="search-input" type="text" placeholder="Buscar palavra..." value="${esc(state.vocab.query)}" data-bind="vocab-query" aria-label="Buscar palavra" />
        <div class="filter-row">${categories
          .map((c) => `<button class="filter-chip ${c === cat ? "active" : ""}" data-action="vocab-filter" data-cat="${esc(c)}">${c === "all" ? "Todas" : esc(c)}</button>`)
          .join("")}</div>
      </div>
      <div class="section" style="gap:8px;">
        ${
          filtered.length === 0
            ? `<div class="empty-state"><div class="emoji">🔍</div><p>Nenhuma palavra encontrada.</p></div>`
            : filtered
                .map((w) => {
                  const mastery = (u.vocabularyMastery[w.word] && u.vocabularyMastery[w.word].mastery) || 0;
                  return `<div class="word-card">
                    <button class="speak-btn" data-action="speak-word" data-word="${esc(w.word)}" aria-label="Ouvir pronúncia de ${esc(w.word)}">🔊</button>
                    <div style="flex:1; min-width:0;">
                      <div class="word-en">${esc(w.word)}</div>
                      <div class="word-pt">${esc(w.translation)}${w.pronunciation ? " · " + esc(w.pronunciation) : ""}</div>
                    </div>
                    <div class="mastery-bar"><div class="progress-track"><div class="progress-fill" style="width:${mastery}%"></div></div></div>
                  </div>`;
                })
                .join("")
        }
      </div>`;
  }

  /* -------------------- EVENTOS -------------------- */
  function onClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    try {
      handleAction(action, btn);
    } catch (err) {
      console.error("Erro ao processar ação '" + action + "':", err);
      state.screen = state.user ? "home" : "onboarding-welcome";
      render();
    }
  }

  function handleAction(action, btn) {
    switch (action) {
      case "onboarding-start": {
        const input = document.querySelector('[data-bind="name"]');
        state.onboarding.name = (input && input.value.trim()) || "Guest";
        go("onboarding-interests");
        break;
      }
      case "toggle-interest": {
        const id = btn.getAttribute("data-id");
        const idx = state.onboarding.interests.indexOf(id);
        if (idx === -1) state.onboarding.interests.push(id);
        else state.onboarding.interests.splice(idx, 1);
        render();
        break;
      }
      case "interests-continue":
        if (state.onboarding.interests.length) go("onboarding-time");
        break;
      case "select-time":
        state.onboarding.time = Number(btn.getAttribute("data-id"));
        render();
        break;
      case "time-continue":
        if (state.onboarding.time) go("onboarding-test-intro");
        break;
      case "start-test":
        state.test = { questions: DATA.getAllPlacementQuestions(), index: 0, answers: {} };
        go("placement-test");
        break;
      case "select-test-answer": {
        const q = state.test.questions[state.test.index];
        state.test.answers[q.id] = btn.getAttribute("data-answer");
        render();
        break;
      }
      case "test-continue":
        if (state.test.index + 1 >= state.test.questions.length) finishTest();
        else {
          state.test.index++;
          render();
        }
        break;
      case "finish-onboarding":
        go("home");
        break;
      case "nav":
        go(btn.getAttribute("data-screen"));
        break;
      case "go-home":
        go("home");
        break;
      case "go-map":
        go("map");
        break;
      case "open-world":
        state.mapWorldId = btn.getAttribute("data-world-id");
        render();
        break;
      case "open-level": {
        const level = ENGINE.getLevelById(btn.getAttribute("data-level-id"));
        if (!level) break;
        const st = ENGINE.getLevelState(state.user, level);
        if (st === "locked") showLockedModal(level);
        else {
          state.currentLevelId = level.id;
          go("level-detail");
        }
        break;
      }
      case "close-modal":
        state.modal = null;
        render();
        break;
      case "noop":
        // usado para interceptar cliques dentro do conteúdo do modal e
        // impedir que borbulhem até o backdrop (que fecharia o modal)
        break;
      case "begin-level": {
        const level = ENGINE.getLevelById(btn.getAttribute("data-level-id"));
        if (!level) break;
        if (level.isBoss) initBoss(level);
        else initLesson(level);
        break;
      }
      case "exit-lesson":
        if (window.confirm("Sair da aula? Seu progresso nesta fase não será salvo.")) go("map");
        break;
      case "select-exercise-answer": {
        if (state.lesson.answered) break;
        const level = ENGINE.getLevelById(state.lesson.levelId);
        const ex = level.exercises[state.lesson.index];
        const answer = btn.getAttribute("data-answer");
        state.lesson.selected = answer;
        state.lesson.answered = true;
        if (answer === ex.correctAnswer) state.lesson.correct++;
        else state.lesson.missed.push(...(ex.vocabulary || []));
        render();
        break;
      }
      case "sentence-pick": {
        if (state.lesson.answered) break;
        const i = Number(btn.getAttribute("data-index"));
        const word = state.lesson.bank[i];
        state.lesson.bank.splice(i, 1);
        state.lesson.sentence.push(word);
        render();
        break;
      }
      case "sentence-remove": {
        if (state.lesson.answered) break;
        const i = Number(btn.getAttribute("data-index"));
        const word = state.lesson.sentence[i];
        state.lesson.sentence.splice(i, 1);
        state.lesson.bank.push(word);
        render();
        break;
      }
      case "sentence-check": {
        const level = ENGINE.getLevelById(state.lesson.levelId);
        const ex = level.exercises[state.lesson.index];
        state.lesson.answered = true;
        if (state.lesson.sentence.join(" ") === ex.correctAnswer) state.lesson.correct++;
        else state.lesson.missed.push(...(ex.vocabulary || []));
        render();
        break;
      }
      case "lesson-continue": {
        const level = ENGINE.getLevelById(state.lesson.levelId);
        const nextIndex = state.lesson.index + 1;
        if (nextIndex >= level.exercises.length) finalizeLesson();
        else {
          state.lesson.index = nextIndex;
          initExerciseState(level.exercises[nextIndex]);
          render();
        }
        break;
      }
      case "redo-level": {
        const level = ENGINE.getLevelById(btn.getAttribute("data-level-id"));
        if (level) initLesson(level);
        break;
      }
      case "boss-advance":
        bossAdvance();
        break;
      case "boss-pick": {
        const level = ENGINE.getLevelById(state.boss.levelId);
        const current = level.dialogue[state.boss.step];
        const answer = btn.getAttribute("data-answer");
        state.boss.selected = answer;
        state.boss.answered = true;
        state.boss.chosen[state.boss.step] = answer;
        if (answer === current.correctAnswer) state.boss.correct++;
        render();
        break;
      }
      case "vocab-filter":
        state.vocab.category = btn.getAttribute("data-cat");
        render();
        break;
      case "speak-word":
        speakWord(btn.getAttribute("data-word"));
        break;
      case "reset-progress":
        if (window.confirm("Tem certeza que deseja reiniciar todo o seu progresso? Essa ação não pode ser desfeita.")) {
          ENGINE.resetProgress();
          state.user = ENGINE.createNewUser();
          state.onboarding = { name: "", interests: [], time: null };
          go("onboarding-welcome");
        }
        break;
      default:
        break;
    }
  }

  function onInput(e) {
    if (e.target.matches && e.target.matches('[data-bind="vocab-query"]')) {
      state.vocab.query = e.target.value;
      render();
    }
  }

  document.addEventListener("click", onClick);
  document.addEventListener("input", onInput);

  window.addEventListener("error", function (event) {
    console.error("Erro não tratado:", event.error || event.message);
  });

  /* -------------------- START -------------------- */
  init();
})();
