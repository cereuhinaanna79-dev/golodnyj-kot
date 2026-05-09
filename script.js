import { createAudioService } from "./audio.js";
import { getGameElements } from "./dom.js";
import { createGame } from "./game.js";
import { loadQuestionsFromGoogleSheets } from "./googleSheets.js";
import { ratingService } from "./rating.js";
import { requestPlayerName } from "./user.js";

const elements = getGameElements();
const audio = createAudioService();
const START_GAME_BUTTON_TEXT = "Начать игру";
const RESTART_GAME_BUTTON_TEXT = "🔁 Начать заново";

elements.resetButton.textContent = START_GAME_BUTTON_TEXT;

try {
  // Сначала загружаем вопросы из Google Таблицы, и только после этого создаем игру.
  const importedQuestions = await loadQuestionsFromGoogleSheets();

  const game = createGame({
    audio,
    elements,
    questions: importedQuestions,
    rating: ratingService,
    requestPlayerName,
  });

  elements.resetButton.addEventListener("click", () => {
    game.reset();
    elements.resetButton.textContent = RESTART_GAME_BUTTON_TEXT;
  });
  elements.toggleLeaderboardButton.addEventListener("click", () =>
    game.toggleLeaderboard(),
  );
  elements.clearRatingButton.addEventListener("click", () =>
    game.clearLeaderboard(),
  );

  game.init();
} catch (error) {
  console.error("Questions loading failed.", error);

  // Если таблица недоступна или структура неверная, игру не запускаем.
  elements.messageDiv.textContent =
    "Ошибка подключения к Google Таблице с вопросами. Проверьте доступ по ссылке и обновите страницу.";
  elements.messageDiv.style.color = "crimson";
  elements.resetButton.disabled = true;
}
