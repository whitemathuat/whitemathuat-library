from pathlib import Path

base = Path(__file__).parent

files = sorted(base.glob("file*.xhtml"))

# xử lý title_page.xhtml
title_page = base / "title_page.xhtml"

if title_page.exists():
    content = title_page.read_text(encoding="utf-8")

    nav = """
<hr/>
<div style="text-align:center;margin:20px;">
<a href="index.html">📖 Mục lục</a> |
<a href="file0001.xhtml">Chương 1 →</a>
</div>
"""

    if nav not in content:
        content = content.replace("</body>", nav + "\n</body>")

    title_page.write_text(content, encoding="utf-8")

# xử lý các chương
for i, file in enumerate(files):
    links = []

    if i == 0:
        links.append('<a href="title_page.xhtml">← Giới thiệu</a>')
    else:
        links.append(f'<a href="{files[i-1].name}">← Chương trước</a>')

    links.append('<a href="index.html">📖 Mục lục</a>')

    if i < len(files) - 1:
        links.append(f'<a href="{files[i+1].name}">Chương sau →</a>')

    nav = (
        '\n<hr/>\n'
        '<div style="text-align:center;margin:20px;">\n'
        + ' | '.join(links) +
        '\n</div>\n'
    )

    content = file.read_text(encoding="utf-8")

    if nav not in content:
        content = content.replace("</body>", nav + "</body>")

    file.write_text(content, encoding="utf-8")

print("Done")