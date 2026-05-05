export function createMouseState(question, index) {
  return {
    id: index,
    question,
    answered: false,
    success: false,
    selected: false,
  };
}

export function getGoalWord(target) {
  return target === 5 ? "мышки" : "мышек";
}
