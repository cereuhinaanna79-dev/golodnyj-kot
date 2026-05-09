import {
  LEVEL_TARGETS,
  MAX_SCORE,
  POINTS_PER_MOUSE,
  TOTAL_LEVELS,
} from "./game/config.js";
import { createMouseState, getGoalWord } from "./game/helpers.js";
import { renderMice } from "./game/render.js";

export function createGame({
  audio,
  elements,
  questions,
  rating,
  requestPlayerName,
}) {
  const state = {
    mice: [],
    caughtCount: 0,
    score: 0,
    gameActive: false,
    interactionLocked: false,
    currentPlayerName: "",
    currentLevelIndex: 0,
    levelQuestions: [],
    pendingTimeoutIds: [],
  };

  function queueTimeout(callback, delay) {
    const timeoutId = window.setTimeout(() => {
      state.pendingTimeoutIds = state.pendingTimeoutIds.filter(
        (savedId) => savedId !== timeoutId,
      );
      callback();
    }, delay);

    state.pendingTimeoutIds.push(timeoutId);
  }

  function clearPendingTimeouts() {
    state.pendingTimeoutIds.forEach((timeoutId) =>
      window.clearTimeout(timeoutId),
    );
    state.pendingTimeoutIds = [];
  }

  function setMessage(text, color = "") {
    elements.messageDiv.textContent = text;
    elements.messageDiv.style.color = color;
  }

  function updateStats() {
    const currentTarget = LEVEL_TARGETS[state.currentLevelIndex];

    // Названия тем для каждого уровня
    const themeNames = ["🏆 HTML", "🏆 CSS", "🏆 JavaScript"];
    const currentTheme = themeNames[state.currentLevelIndex];

    elements.levelCountSpan.textContent = String(state.currentLevelIndex + 1);
    elements.caughtCountSpan.textContent = String(state.caughtCount);
    elements.targetCountSpan.textContent = String(currentTarget);
    elements.scoreCountSpan.textContent = String(state.score);
    elements.goalText.textContent = `${currentTheme} | Уровень ${state.currentLevelIndex + 1}: поймай ${currentTarget} ${getGoalWord(currentTarget)}.`;
  }

  function createMiceForCurrentLevel() {
    const selectedQuestions =
      state.levelQuestions[state.currentLevelIndex] ?? [];
    state.mice = selectedQuestions.map((q, idx) => createMouseState(q, idx));
  }

  function finishGame(isWin) {
    clearPendingTimeouts();
    state.gameActive = false;
    state.interactionLocked = false;

    if (isWin) {
      rating.saveWinResult(state.currentPlayerName, state.score);
    }

    rating.showLeaderboard(elements);

    if (audio) {
      if (isWin) {
        audio.playWin();
      } else {
        audio.playLose();
      }
    }

    if (isWin) {
      setMessage(
        `🎉 ${state.currentPlayerName} прошел все ${TOTAL_LEVELS} уровня и набрал ${state.score} очков из ${MAX_SCORE}!`,
        "orange",
      );
      return;
    }

    setMessage(
      `Игра завершена на уровне ${state.currentLevelIndex + 1}. ${state.currentPlayerName} набрал ${state.score} очков.`,
      "brown",
    );
  }

  function goToNextLevel() {
    if (state.currentLevelIndex === LEVEL_TARGETS.length - 1) {
      finishGame(true);
      return;
    }

    state.currentLevelIndex += 1;
    state.caughtCount = 0;
    state.interactionLocked = false;
    createMiceForCurrentLevel();
    updateStats();
    renderCurrentMice();
    setMessage(
      `Уровень ${state.currentLevelIndex} пройден! Переходим к уровню ${state.currentLevelIndex + 1}.`,
      "green",
    );
  }

  function askQuestion(mouse) {
    if (!state.gameActive || mouse.answered) {
      return;
    }

    const { question } = mouse;
    const answerText = prompt(
      `${question.text}\n\n0: ${question.options[0]}\n1: ${question.options[1]}\n2: ${question.options[2]}\n\nВведи номер правильного ответа (0, 1 или 2):`,
    );

    if (answerText === null) {
      mouse.selected = false;
      state.interactionLocked = false;
      renderCurrentMice();
      return;
    }

    const answerIndex = parseInt(answerText, 10);

    mouse.answered = true;
    mouse.selected = false;

    if (answerIndex === question.correct) {
      mouse.success = true;
      state.caughtCount += 1;
      state.score += POINTS_PER_MOUSE;
      updateStats();
      renderCurrentMice();

      if (audio) {
        audio.playCorrect();
      }

      queueTimeout(() => {
        if (state.caughtCount >= LEVEL_TARGETS[state.currentLevelIndex]) {
          goToNextLevel();
          return;
        }

        state.interactionLocked = false;
        setMessage(
          `✅ Правильно! ${state.currentPlayerName} получает ${POINTS_PER_MOUSE} очко.`,
          "green",
        );
      }, 420);
      return;
    }

    mouse.success = false;
    renderCurrentMice();

    if (audio) {
      audio.playWrong();
    }

    queueTimeout(() => {
      finishGame(false);
    }, 720);
  }

  function handleMouseClick(mouse, mouseElement) {
    if (!state.gameActive || mouse.answered || state.interactionLocked) {
      return;
    }

    mouse.selected = true;
    state.interactionLocked = true;
    mouseElement.classList.add("is-pressed");

    if (audio) {
      audio.unlock();
    }

    queueTimeout(() => {
      askQuestion(mouse);
    }, 150);
  }

  function renderCurrentMice() {
    renderMice({
      mice: state.mice,
      isGameActive: state.gameActive,
      container: elements.miceGrid,
      onMouseClick: handleMouseClick,
    });
  }

  function prepareGame() {
    clearPendingTimeouts();

    if (audio) {
      audio.stopAll();
    }

    state.caughtCount = 0;
    state.score = 0;
    state.gameActive = true;
    state.interactionLocked = false;
    state.currentLevelIndex = 0;

    // Группируем вопросы по темам
    const htmlQuestions = questions.filter((q) => q.topic === "html");
    const cssQuestions = questions.filter((q) => q.topic === "css");
    const jsQuestions = questions.filter((q) => q.topic === "js");

    // Функция для перемешивания и взятия нужного количества
    function getRandomQuestions(arr, count) {
      if (arr.length === 0) {
        throw new Error("Нет вопросов для одной из тем уровня.");
      }

      // Если вопросов меньше, чем нужно, повторяем их
      let source = [...arr];
      while (source.length < count) {
        source = [...source, ...arr];
      }

      // Перемешиваем
      for (let i = source.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [source[i], source[j]] = [source[j], source[i]];
      }

      return source.slice(0, count);
    }

    // Для каждого уровня берём вопросы своей темы
    // 1 уровень: HTML, 3 вопроса
    // 2 уровень: CSS, 4 вопроса
    // 3 уровень: JS, 5 вопросов
    state.levelQuestions = [
      getRandomQuestions(htmlQuestions, 3),
      getRandomQuestions(cssQuestions, 4),
      getRandomQuestions(jsQuestions, 5),
    ];

    createMiceForCurrentLevel();
    updateStats();
    renderCurrentMice();
    setMessage("");
  }

  return {
    init() {
      rating.hideLeaderboard(elements);
      rating.renderLeaderboard(elements);
    },
    reset() {
      if (!state.currentPlayerName) {
        state.currentPlayerName = requestPlayerName();
      }

      prepareGame();
      rating.hideLeaderboard(elements);
    },
    toggleLeaderboard() {
      rating.toggleLeaderboard(elements);
    },
    clearLeaderboard() {
      rating.clearLeaderboard();
      rating.renderLeaderboard(elements);
      setMessage("Рейтинг очищен.", "brown");
    },
  };
}
