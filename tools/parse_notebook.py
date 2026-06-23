from pathlib import Path
from bs4 import BeautifulSoup
import json
import re


def extract_location(text):
    m = re.search(r"Location\s+(\d+)", text)

    if m:
        return int(m.group(1))

    return None


def extract_color(element):
    span = element.find("span")

    if span:
        return span.get_text(strip=True)

    return None


novels_dir = Path("novels")

for book_dir in novels_dir.iterdir():

    if not book_dir.is_dir():
        continue

    notebook_file = book_dir / "notebook.html"

    if not notebook_file.exists():
        continue

    print(f"Processing {book_dir.name}")

    soup = BeautifulSoup(
        notebook_file.read_text(
            encoding="utf-8"
        ),
        "html.parser"
    )

    title = soup.select_one(
        ".bookTitle"
    ).get_text(strip=True)

    author = soup.select_one(
        ".authors"
    ).get_text(strip=True)

    sections = []
    current_section = None

    elements = soup.select(
        ".bodyContainer > div"
    )

    i = 0

    while i < len(elements):

        element = elements[i]
        classes = element.get("class", [])

        if "sectionHeading" in classes:

            current_section = {
                "title": element.get_text(strip=True),
                "entries": []
            }

            sections.append(current_section)

        elif "noteHeading" in classes:

            heading_text = element.get_text(
                " ",
                strip=True
            )

            entry_type = None

            if heading_text.startswith("Highlight"):
                entry_type = "highlight"

            elif heading_text.startswith("Note"):
                entry_type = "note"

            if (
                entry_type
                and current_section
                and i + 1 < len(elements)
            ):

                next_element = elements[i + 1]

                if (
                    "noteText"
                    in next_element.get("class", [])
                ):

                    current_section[
                        "entries"
                    ].append(
                        {
                            "type": entry_type,
                            "text": next_element.get_text(
                                strip=True
                            ),
                            "location": extract_location(
                                heading_text
                            ),
                            "color": extract_color(
                                element
                            )
                        }
                    )

                    i += 1

        i += 1

    data = {
        "title": title,
        "author": author,
        "sections": sections
    }

    output_file = book_dir / "notes.json"

    output_file.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ),
        encoding="utf-8"
    )

    print(f"Created {output_file}")