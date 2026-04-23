//Запрос имени игрока
const DEFAULT_PLAYER_NAME = "Игрок";

export function requestPlayerName() {
  alert("Перед началом игры введи имя игрока.");

  const enteredName = prompt("Введите имя игрока:");
  const normalizedName = enteredName ? enteredName.trim() : "";

  return normalizedName || DEFAULT_PLAYER_NAME;
}
