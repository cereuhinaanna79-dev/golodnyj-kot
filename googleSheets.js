// Ссылка на публичную Google Таблицу с вопросами.
// Ожидаемые столбцы: topic, text, option0, option1, option2, correct.
const GOOGLE_SHEETS_URL =
  "https://docs.google.com/spreadsheets/d/16iI6si0Fz15XQQXKpkTYGq-vzrTjNAI8KQ9w0PVa6LM/edit?usp=sharing";
const DEFAULT_SHEET_GID = "0";

// Header в таблице фиксированный, поэтому ищем только эти названия колонок.
const REQUIRED_HEADERS = ["topic", "text", "option0", "option1", "option2", "correct"];

// В коде игры тема JavaScript называется js, поэтому приводим варианты к одному виду.
const TOPIC_ALIASES = {
  html: "html",
  css: "css",
  js: "js",
};

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[\s_-]+/g, " ");
}

// Разбирает CSV с учетом кавычек, запятых внутри ячеек и переносов строк.
function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(cell.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

// Достает id таблицы из обычной ссылки вида /spreadsheets/d/{id}/edit.
function getSheetId(sheetUrl) {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([^/]+)/);

  if (!match) {
    throw new Error("Google Sheets URL should include /spreadsheets/d/{id}.");
  }

  return match[1];
}

// Если у ссылки нет gid, берем первый лист таблицы.
function getSheetGid(sheetUrl) {
  const gidMatch = sheetUrl.match(/[?&#]gid=(\d+)/);
  return gidMatch ? gidMatch[1] : DEFAULT_SHEET_GID;
}

// Google Sheets умеет отдавать публичный лист как CSV по export-ссылке.
function buildCsvUrl(sheetUrl) {
  const sheetId = getSheetId(sheetUrl);
  const gid = getSheetGid(sheetUrl);

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

// Находит индексы обязательных колонок и сразу сообщает, если header не совпал.
function getRequiredIndexes(headers) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const indexes = Object.fromEntries(
    REQUIRED_HEADERS.map((header) => [header, normalizedHeaders.indexOf(header)]),
  );

  const missingFields = Object.entries(indexes)
    .filter(([, index]) => index === -1)
    .map(([fieldName]) => fieldName);

  if (missingFields.length > 0) {
    throw new Error(`Missing columns in Google Sheet: ${missingFields.join(", ")}.`);
  }

  return indexes;
}

function normalizeTopic(topic) {
  const normalizedTopic = normalizeHeader(topic);
  return TOPIC_ALIASES[normalizedTopic] ?? normalizedTopic;
}

// correct можно указать индексом 0/1/2 или точным текстом правильного ответа.
function parseCorrectAnswer(value, options) {
  const answer = String(value ?? "").trim();
  const numericAnswer = Number.parseInt(answer, 10);

  if (Number.isInteger(numericAnswer) && numericAnswer >= 0 && numericAnswer <= 2) {
    return numericAnswer;
  }

  const optionIndex = options.findIndex(
    (option) => option.trim().toLowerCase() === answer.toLowerCase(),
  );

  if (optionIndex !== -1) {
    return optionIndex;
  }

  throw new Error(`Cannot parse correct answer "${answer}". Use 0, 1, 2, or the exact answer text.`);
}

// Превращает одну строку таблицы в объект вопроса, который уже понимает игра.
function rowToQuestion(row, indexes) {
  const options = [
    row[indexes.option0] ?? "",
    row[indexes.option1] ?? "",
    row[indexes.option2] ?? "",
  ].map((option) => option.trim());

  return {
    text: String(row[indexes.text] ?? "").trim(),
    options,
    correct: parseCorrectAnswer(row[indexes.correct], options),
    topic: normalizeTopic(row[indexes.topic]),
  };
}

function validateQuestion(question) {
  return (
    question.text &&
    question.topic &&
    question.options.length === 3 &&
    question.options.every(Boolean) &&
    Number.isInteger(question.correct)
  );
}

// Для трех уровней игры обязательно нужны вопросы по всем темам.
function ensureRequiredTopics(questions) {
  const topics = new Set(questions.map((question) => question.topic));
  const missingTopics = ["html", "css", "js"].filter((topic) => !topics.has(topic));

  if (missingTopics.length > 0) {
    throw new Error(`Google Sheet has no questions for topics: ${missingTopics.join(", ")}.`);
  }
}

// Загружает вопросы из Google Таблицы. Ошибки не скрываются, их обработает script.js.
export async function loadQuestionsFromGoogleSheets({
  sheetUrl = GOOGLE_SHEETS_URL,
} = {}) {
  if (!sheetUrl.trim()) {
    throw new Error("Google Sheets URL is empty.");
  }

  const response = await fetch(buildCsvUrl(sheetUrl));

  if (!response.ok) {
    throw new Error(`Google Sheets request failed: ${response.status}`);
  }

  const rows = parseCsv(await response.text());

  if (rows.length < 2) {
    throw new Error("Google Sheet should include a header row and at least one question.");
  }

  const [headers, ...questionRows] = rows;
  const indexes = getRequiredIndexes(headers);
  const sheetQuestions = questionRows.map((row) => rowToQuestion(row, indexes));
  const validQuestions = sheetQuestions.filter(validateQuestion);

  ensureRequiredTopics(validQuestions);

  return validQuestions;
}
