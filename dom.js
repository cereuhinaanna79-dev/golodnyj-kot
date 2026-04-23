//Поиск элементов на странице
function getElement(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Не найден элемент с id "${id}".`);
  }

  return element;
}

export function getGameElements() {
  return {
    miceGrid: getElement("miceGrid"),
    caughtCountSpan: getElement("caughtCount"),
    targetCountSpan: getElement("targetCount"),
    scoreCountSpan: getElement("scoreCount"),
    levelCountSpan: getElement("levelCount"),
    goalText: getElement("goalText"),
    messageDiv: getElement("message"),
    resetButton: getElement("resetButton"),
    toggleLeaderboardButton: getElement("toggleLeaderboardButton"),
    leaderboardSection: getElement("leaderboardSection"),
    leaderboardBody: getElement("leaderboardBody"),
    leaderboardEmpty: getElement("leaderboardEmpty"),
    clearRatingButton: getElement("clearRatingButton"),
  };
}
