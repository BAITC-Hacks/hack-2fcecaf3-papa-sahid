"""Терминальный FAQ-бот без сторонних зависимостей."""

import re
from pathlib import Path


def normalize(text):
    return text.lower().replace("ё", "е")


def load_faq(path):
    entries = []
    for block in re.split(r"\n\s*\n", path.read_text(encoding="utf-8-sig").strip()):
        fields = dict(line.split(":", 1) for line in block.splitlines() if line.strip())
        entries.append({
            "question": fields["Вопрос"].strip(),
            "keywords": [normalize(key.strip()) for key in fields["Ключи"].split(",")],
            "answer": fields["Ответ"].strip(),
        })
    return entries


def find_answer(question, entries):
    tokens = set(re.findall(r"[а-яa-z0-9]+", normalize(question)))
    scores = []
    for entry in entries:
        # '*' в конце ключа означает совпадение по началу слова.
        score = sum(
            any(token.startswith(key[:-1]) if key.endswith("*") else token == key
                for key in entry["keywords"])
            for token in tokens
        )
        scores.append(score)
    best = max(scores, default=0)
    if best == 0 or scores.count(best) > 1:
        return "не знаю"
    return entries[scores.index(best)]["answer"]


def main():
    try:
        entries = load_faq(Path(__file__).with_name("faq.txt"))
    except (OSError, ValueError, KeyError) as error:
        print(f"Не удалось прочитать faq.txt: {error}")
        return 1

    print("FAQ-бот: время, команда, трек, сдача, призы.")
    print("Данные демонстрационные. Для завершения введите «выход».")
    while True:
        try:
            question = input("Вы: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nДо встречи!")
            break
        if normalize(question) in {"выход", "exit", "quit"}:
            print("До встречи!")
            break
        print(f"Бот: {find_answer(question, entries)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
