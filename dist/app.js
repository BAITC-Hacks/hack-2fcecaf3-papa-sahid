/* Matching mirrors main.py; FAQ content is generated from faq.txt. */
const normalize = text => text.toLowerCase().replaceAll('ё', 'е');
function findAnswer(question, entries) {
  const tokens = [...new Set(normalize(question).match(/[а-яa-z0-9]+/g) || [])];
  const scores = entries.map(entry => tokens.filter(token => entry.keywords.some(key =>
    key.endsWith('*') ? token.startsWith(key.slice(0, -1)) : token === key)).length);
  const best = Math.max(0, ...scores);
  return best === 0 || scores.filter(score => score === best).length > 1
    ? 'не знаю' : entries[scores.indexOf(best)].answer;
}

const form = document.querySelector('#question-form');
const input = document.querySelector('#question');
const send = document.querySelector('#send');
const conversation = document.querySelector('#conversation');
const welcome = document.querySelector('#welcome');
const reset = document.querySelector('#reset');
const status = document.querySelector('#status');
const retry = document.querySelector('#retry');
let entries = [];

function addMessage(text, role) {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  const label = document.createElement('span');
  label.className = 'message-label';
  label.textContent = role === 'user' ? 'Вы' : 'Помощник';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  message.append(label, bubble);
  if (text === 'не знаю' && role === 'bot') {
    const hint = document.createElement('p');
    hint.className = 'unknown-help';
    hint.textContent = 'Попробуйте спросить о времени, команде, треке, сдаче или призах.';
    message.append(hint);
  }
  conversation.append(message);
}

function ask(question) {
  if (!entries.length || !question.trim()) return;
  welcome.remove();
  addMessage(question.trim(), 'user');
  addMessage(findAnswer(question, entries), 'bot');
  input.value = '';
  send.disabled = true;
  reset.disabled = false;
  conversation.scrollTop = conversation.scrollHeight;
  input.focus({ preventScroll: true });
}

form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
input.addEventListener('input', () => { send.disabled = !input.value.trim() || !entries.length; });
reset.addEventListener('click', () => {
  conversation.replaceChildren(welcome);
  input.value = '';
  reset.disabled = true;
  send.disabled = true;
  input.focus({ preventScroll: true });
});

async function load() {
  status.textContent = 'Загружаем вопросы…';
  retry.hidden = true;
  try {
    const response = await fetch('faq.json');
    if (!response.ok) throw new Error('FAQ unavailable');
    const data = await response.json();
    if (data.mode !== 'demo' || !Array.isArray(data.entries) || data.entries.length !== 5 ||
        !data.entries.every(entry => typeof entry.question === 'string' && typeof entry.answer === 'string' &&
          Array.isArray(entry.keywords) && entry.keywords.every(key => typeof key === 'string'))) {
      throw new Error('Invalid FAQ');
    }
    entries = data.entries;
    const labels = ['Время репетиции', 'Команда', 'Учебный трек', 'Сдача работы', 'Призы'];
    const topics = document.querySelector('#topics');
    topics.replaceChildren();
    entries.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'topic';
      for (const [className, text] of [['topic-number', `0${index + 1}`], ['topic-name', labels[index]], ['topic-arrow', '↗']]) {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = text;
        if (className !== 'topic-name') span.setAttribute('aria-hidden', 'true');
        button.append(span);
      }
      button.addEventListener('click', () => ask(entry.question));
      topics.append(button);
    });
    const suggestions = document.querySelector('#suggestions');
    suggestions.replaceChildren();
    ['Когда начало?', 'Как сдать работу?'].forEach(question => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = question;
      button.addEventListener('click', () => ask(question));
      suggestions.append(button);
    });
    input.disabled = false;
    status.textContent = '';
  } catch {
    entries = [];
    input.disabled = true;
    send.disabled = true;
    status.textContent = 'Не удалось загрузить вопросы. Попробуйте ещё раз.';
    retry.hidden = false;
  }
}
retry.addEventListener('click', load);
load();
