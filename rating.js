//Рейтинг (localStorage)
const RESULTS_STORAGE_KEY = "catGameResults";

function getSavedResults() {
  try {
    const rawResults = localStorage.getItem(RESULTS_STORAGE_KEY);
    const parsedResults = rawResults ? JSON.parse(rawResults) : [];
    return Array.isArray(parsedResults) ? parsedResults : [];
  } catch (error) {
    console.error("Не удалось прочитать результаты из localStorage:", error);
    return [];
  }
}

function getSortedResults() {
  return getSavedResults().sort((firstResult, secondResult) => {
    if (secondResult.score !== firstResult.score) {
      return secondResult.score - firstResult.score;
    }

    return new Date(secondResult.date) - new Date(firstResult.date);
  });
}

function saveWinResult(name, score) {
  const savedResults = getSavedResults();

  savedResults.push({
    name,
    score,
    date: new Date().toISOString(),
  });

  localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(savedResults));
}

function clearLeaderboard() {
  localStorage.removeItem(RESULTS_STORAGE_KEY);
}

function renderLeaderboard(elements) {
  const results = getSortedResults();

  elements.leaderboardBody.innerHTML = "";
  elements.leaderboardEmpty.style.display =
    results.length === 0 ? "block" : "none";

  results.forEach((result, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${result.name}</td>
      <td>${result.score}</td>
    `;
    elements.leaderboardBody.appendChild(row);
  });
}

function showLeaderboard(elements) {
  renderLeaderboard(elements);
  elements.leaderboardSection.classList.remove("hidden");
  elements.toggleLeaderboardButton.textContent = "Скрыть рейтинг";
}

function hideLeaderboard(elements) {
  elements.leaderboardSection.classList.add("hidden");
  elements.toggleLeaderboardButton.textContent = "Показать рейтинг";
}

function toggleLeaderboard(elements) {
  if (elements.leaderboardSection.classList.contains("hidden")) {
    showLeaderboard(elements);
    return;
  }

  hideLeaderboard(elements);
}

export const ratingService = {
  clearLeaderboard,
  hideLeaderboard,
  renderLeaderboard,
  saveWinResult,
  showLeaderboard,
  toggleLeaderboard,
};
