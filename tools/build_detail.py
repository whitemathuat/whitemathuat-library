from pathlib import Path
import json
from collections import defaultdict

novels_dir = Path("novels")

for book_dir in novels_dir.iterdir():

    if not book_dir.is_dir():
        continue

    notes_file = book_dir / "notes.json"

    if not notes_file.exists():
        continue

    data = json.loads(
        notes_file.read_text(
            encoding="utf-8"
        )
    )

    title = data["title"]
    author = data["author"]

    html = []

    total_highlights = 0
    total_notes = 0

    for section in data["sections"]:

        for entry in section["entries"]:

            if entry["type"] == "highlight":
                total_highlights += 1

            elif entry["type"] == "note":
                total_notes += 1

    # =========================
    # HEADER
    # =========================

    html.append(
        f"""
        <div class="book-header">

            <div class="book-cover-wrap">
                <img
                    src="cover.jpg"
                    class="book-cover"
                >
            </div>

            <div class="book-meta">

                <h1>{title}</h1>

                <p>{author}</p>

                <div class="stats">

                    <div class="stat-card">
                        <div class="stat-number">
                            {total_highlights}
                        </div>

                        <div class="stat-label">
                            Highlights
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-number">
                            {total_notes}
                        </div>

                        <div class="stat-label">
                            Ghi chú
                        </div>
                    </div>

                </div>

            </div>

        </div>
        """
    )

    # =========================
    # LAYOUT START
    # =========================

    html.append(
        f"""
        <div class="tabs">

            <button class="tab">
                Thông tin
            </button>

            <button class="tab active">
                Ghi chú
            </button>

        </div>

        <div class="content">

            <aside class="sidebar">

                <div class="sidebar-card">

                    <h3>Tổng quan</h3>

                    <div class="sidebar-row">
                        <span>Highlights</span>
                        <span>{total_highlights}</span>
                    </div>

                    <div class="sidebar-row">
                        <span>Ghi chú</span>
                        <span>{total_notes}</span>
                    </div>

                </div>

                <div class="sidebar-card chapter-list">

                    <h3>Theo chương</h3>
        """
    )

    # =========================
    # SIDEBAR CHAPTERS
    # =========================

    for section in data["sections"]:

        section_id = (
            section["title"]
            .lower()
            .replace("–", "-")
            .replace(" ", "-")
            .replace(":", "")
            .replace(",", "")
            .replace(".", "")
        )

        locations = {
            entry["location"]
            for entry in section["entries"]
        }

        count = len(locations)

        html.append(
            f"""
            <a
                href="#{section_id}"
                class="sidebar-row chapter-link"
            >
                <span>
                    {section['title']}
                </span>

                <span>
                    {count}
                </span>
            </a>
            """
        )

    html.append(
        """
                </div>

            </aside>

            <main class="notes-area">
        """
    )

    # =========================
    # CHAPTERS
    # =========================

    for section in data["sections"]:

        section_id = (
            section["title"]
            .lower()
            .replace("–", "-")
            .replace(" ", "-")
            .replace(":", "")
            .replace(",", "")
            .replace(".", "")
        )

        html.append(
            f"""
            <details
                class="section"
                id="{section_id}"
                open
            >

                <summary>
                    {section['title']}
                </summary>
            """
        )

        grouped = defaultdict(list)

        for entry in section["entries"]:

            grouped[
                entry["location"]
            ].append(entry)

        for location in sorted(grouped):

            entries = grouped[location]

            highlight = None
            note = None

            for entry in entries:

                if entry["type"] == "highlight":
                    highlight = entry["text"]

                elif entry["type"] == "note":
                    note = entry["text"]

            html.append(
                '<div class="note-card">'
            )

            if highlight:

                html.append(
                    f"""
                    <div class="highlight">
                        {highlight}
                    </div>
                    """
                )

            if note:

                html.append(
                    f"""
                    <div class="annotation">
                        🗨️ {note}
                    </div>
                    """
                )

            html.append(
                f"""
                <div class="location">
                    Loc {location}
                </div>
                """
            )

            html.append(
                "</div>"
            )

        html.append(
            "</details>"
        )

    # =========================
    # LAYOUT END
    # =========================

    html.append(
        """
            </main>

        </div>
        """
    )

    output = f"""
<!doctype html>
<html>

<head>

<meta charset="utf-8">

<link
    rel="stylesheet"
    href="../../detail.css">

</head>

<body>

<div class="page">

{''.join(html)}

</div>

</body>

</html>
"""

    output_file = book_dir / "index.html"

    output_file.write_text(
        output,
        encoding="utf-8"
    )

    print(
        f"Created {output_file}"
    )