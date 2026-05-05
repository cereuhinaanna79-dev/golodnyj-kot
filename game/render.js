//Отрисовка мышек
function getMouseSymbol(mouse) {
  if (!mouse.answered) {
    return "🐭";
  }

  return mouse.success ? "🐾" : "💨";
}

function applyMouseMotion(mouseElement, mouse) {
  mouseElement.style.setProperty("--mouse-delay", `-${mouse.id * 0.18}s`);
  mouseElement.style.setProperty("--twitch-delay", `${mouse.id * 0.35}s`);
  mouseElement.style.setProperty(
    "--run-x",
    mouse.id % 2 === 0 ? "150px" : "-150px",
  );
  mouseElement.style.setProperty("--run-y", `${-36 - mouse.id * 10}px`);
  mouseElement.style.setProperty(
    "--run-rotate",
    mouse.id % 2 === 0 ? "18deg" : "-18deg",
  );
}

function createMouseElement(
  mouse,
  isGameActive,
  onMouseClick,
  //Функция-колбэк, которая будет вызвана при клике на мышку
) {
  const mouseDiv = document.createElement("div");
  const mouseSprite = document.createElement("span");

  mouseDiv.className = "mouse";
  mouseSprite.className = "mouse__sprite";
  mouseSprite.textContent = getMouseSymbol(mouse);

  applyMouseMotion(mouseDiv, mouse);
  mouseDiv.appendChild(mouseSprite);
  //appendChild Добавляет элемент внутрь другого элемента.

  if (mouse.answered) {
    mouseDiv.classList.add(mouse.success ? "caught" : "missed");
  } else if (mouse.selected) {
    mouseDiv.classList.add("is-pressed"); //Добавляет анимацию нажатия
  }

  if (!mouse.answered && isGameActive) {
    //При клике на мышку будет вызвана функция
    mouseDiv.addEventListener("click", () => onMouseClick(mouse, mouseDiv));
    //Когда произойдёт клик, вызовется onMouseClick с параметрами mouse и mouseDiv
  } else {
    mouseDiv.style.cursor = "default";
    //Если нельзя кликнуть — курсор остаётся обычной стрелкой, а не рукой
  }

  return mouseDiv;
}

export function renderMice({ mice, isGameActive, container, onMouseClick }) {
  container.innerHTML = "";

  mice.forEach((mouse) => {
    container.appendChild(
      createMouseElement(mouse, isGameActive, onMouseClick),
    );
  });
}
