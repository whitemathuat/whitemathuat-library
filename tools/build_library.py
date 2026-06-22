from pathlib import Path
import json

root = Path(__file__).parent.parent
novels_dir = root / "novels"

cards = []

for book_dir in novels_dir.iterdir():

    if not book_dir.is_dir():
        continue

    meta_file = book_dir / "metadata.json"

    if not meta_file.exists():
        continue

    meta = json.loads(
        meta_file.read_text(encoding="utf-8")
    )

    slug = book_dir.name

    cards.append(f"""
    <div class="book-card">

        <img src="novels/{slug}/cover.jpg">

        <div class="book-info">

            <h2>{meta["title"]}</h2>

            <p>Tác giả: {meta["author"]}</p>

            <a class="read-btn"
               href="novels/{slug}/">
               Đọc truyện
            </a>

        </div>

    </div>
    """)

html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>white đọc gây</title>

<link rel="stylesheet" href="style.css">

</head>
<body>

<h1>📚 white đọc gây</h1>

{''.join(cards)}

</body>
</html>
"""

(root / "index.html").write_text(
    html,
    encoding="utf-8"
)

print("Done")