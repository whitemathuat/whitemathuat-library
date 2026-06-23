from pathlib import Path
import xml.etree.ElementTree as ET
import json

base = Path(__file__).parent

# metadata
meta = json.loads(
    (base / "metadata.json").read_text(encoding="utf-8")
)

book_title = meta["title"]
author = meta["author"]
review = meta["review"]

# đọc toc.ncx
toc_file = base / "toc.ncx"

tree = ET.parse(toc_file)
root = tree.getroot()

ns = {"ncx": "http://www.daisy.org/z3986/2005/ncx/"}

chapters = []

for nav in root.findall(".//ncx:navPoint", ns):

    chapter_title = nav.find(
        "ncx:navLabel/ncx:text",
        ns
    ).text

    chapter_file = nav.find(
        "ncx:content",
        ns
    ).attrib["src"]

    chapters.append(
        (chapter_title, chapter_file)
    )

# tạo mục lục
chapter_links = ""

for idx, (title, file) in enumerate(chapters, start=1):

    chapter_links += f"""
    <div class="chapter-item">
        <a href="{file}">
            <span class="chapter-number">
                {idx}.
            </span>
            {title}
        </a>
    </div>
    """

# tạo index.html
index_html = f"""
<!DOCTYPE html>
<html>
<head>
<title>{book_title}</title>

<link rel="stylesheet" href="../../style.css">

</head>

<body>

<a href="../../">← Về thư viện</a>

<div class="book">

<div class="book-header">

    <img src="cover.jpg" class="cover">

    <div class="book-meta">

        <h1>{book_title}</h1>

        <p class="author">
            Tác giả: {author}
        </p>

        <div class="review">
            {review}
        </div>

    </div>

</div>

<hr>

<h2>Mục lục</h2>

<div class="chapter-list">

{chapter_links}

</div>

</div>

</body>
</html>
"""

(base / "index.html").write_text(
    index_html,
    encoding="utf-8"
)

# thêm chương trước / sau
for i, (chapter_title, file) in enumerate(chapters):

    nav = ['<hr/><div style="text-align:center;margin:20px;">']

    if i > 0:
        nav.append(
            f'<a href="{chapters[i-1][1]}">← Chương trước</a>'
        )
        nav.append(" | ")

    nav.append(
        '<a href="index.html">📖 Mục lục</a>'
    )

    if i < len(chapters) - 1:
        nav.append(" | ")
        nav.append(
            f'<a href="{chapters[i+1][1]}">Chương sau →</a>'
        )

    nav.append("</div>")

    nav_html = "".join(nav)

    chapter_file = base / file

    if not chapter_file.exists():
        continue

    content = chapter_file.read_text(
        encoding="utf-8",
        errors="ignore"
    )

    content = content.replace(
        '<link rel="stylesheet" href="../../style.css">',
        '<link rel="stylesheet" href="../../style.css" />'
    )

    if "</head>" in content and "style.css" not in content:
        content = content.replace(
            "</head>",
            '\n<link rel="stylesheet" href="../../style.css" />\n</head>'
        )

    

    if nav_html not in content:
        content = content.replace(
            "</body>",
            nav_html + "\n</body>"
        )

    chapter_file.write_text(
        content,
        encoding="utf-8"
    )

print("Done")