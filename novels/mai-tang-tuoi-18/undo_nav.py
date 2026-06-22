from pathlib import Path
import re

files = list(Path(__file__).parent.glob("file*.xhtml"))

title_page = Path(__file__).parent / "title_page.xhtml"
if title_page.exists():
    files.append(title_page)

pattern = r'<hr/>\s*<div style="text-align:center;margin:20px;">.*?</div>\s*'

for file in files:
    content = file.read_text(encoding="utf-8")

    content = re.sub(
        pattern,
        "",
        content,
        flags=re.DOTALL
    )

    file.write_text(content, encoding="utf-8")

print("Done")