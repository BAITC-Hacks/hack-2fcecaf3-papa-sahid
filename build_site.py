"""Обновить данные сайта из единственного источника — faq.txt."""
import json
from pathlib import Path
from main import load_faq

root = Path(__file__).resolve().parent
entries = load_faq(root / "faq.txt")
(root / "dist" / "faq.json").write_text(
    json.dumps({"mode": "demo", "entries": entries}, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
print("Готово: dist/faq.json")
