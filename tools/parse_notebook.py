from pathlib import Path
from bs4 import BeautifulSoup
import json
import re

PAIR_DISTANCE = 3

novels_dir = Path("novels")

for book_dir in novels_dir.iterdir():

    if not book_dir.is_dir():
        continue

    notebook = book_dir / "notebook.html"

    if not notebook.exists():
        continue

    soup = BeautifulSoup(
        notebook.read_text(encoding="utf-8"),
        "html.parser"
    )

    title = soup.select_one(".bookTitle").get_text(strip=True)
    author = soup.select_one(".authors").get_text(strip=True)

    sections = []

    current_section = None

    events = []

    nodes = soup.select(
        ".sectionHeading, .noteHeading, .noteText"
    )

    i = 0

    while i < len(nodes):

        node = nodes[i]

        classes = node.get("class", [])

        # -------------------------
        # Chapter
        # -------------------------

        if "sectionHeading" in classes:

            if current_section:

                current_section["entries"] = []

                # -------------------------
                # Pair highlight + note
                # -------------------------

                j = 0

                while j < len(events):

                    event = events[j]

                    # highlight

                    if event["type"] == "highlight":

                        paired = False

                        if j + 1 < len(events):

                            nxt = events[j + 1]

                            if (
                                nxt["type"] == "note"
                                and
                                0 <= nxt["location"] - event["location"] <= PAIR_DISTANCE
                            ):

                                current_section["entries"].append({

                                    "type": "pair",

                                    "highlight": event["text"],

                                    "note": nxt["text"],

                                    "color": event["color"],

                                    "location": event["location"]

                                })

                                paired = True

                                j += 2

                        if not paired:

                            current_section["entries"].append({

                                "type": "highlight",

                                "text": event["text"],

                                "color": event["color"],

                                "location": event["location"]

                            })

                            j += 1

                    else:

                        current_section["entries"].append({

                            "type": "note",

                            "text": event["text"],

                            "location": event["location"]

                        })

                        j += 1

                sections.append(current_section)

            current_section = {

                "title": node.get_text(strip=True)

            }

            events = []

            i += 1

            continue

        # -------------------------
        # Highlight / Note
        # -------------------------

        if "noteHeading" in classes:

            heading = node.get_text(" ", strip=True)

            if i + 1 >= len(nodes):

                break

            text = nodes[i + 1].get_text(" ", strip=True)

            location_match = re.search(
                r"Location\s+(\d+)",
                heading
            )

            if not location_match:

                i += 2

                continue

            location = int(location_match.group(1))

            if heading.startswith("Highlight"):

                color_match = re.search(
                    r"\((.*?)\)",
                    heading
                )

                color = (
                    color_match.group(1)
                    if color_match
                    else "yellow"
                )

                events.append({

                    "type": "highlight",

                    "text": text,

                    "color": color,

                    "location": location

                })

            else:

                events.append({

                    "type": "note",

                    "text": text,

                    "location": location

                })

            i += 2

            continue

        i += 1

    # last section

    if current_section:

        current_section["entries"] = []

        j = 0

        while j < len(events):

            event = events[j]

            if event["type"] == "highlight":

                paired = False

                if j + 1 < len(events):

                    nxt = events[j + 1]

                    if (
                        nxt["type"] == "note"
                        and
                        0 <= nxt["location"] - event["location"] <= PAIR_DISTANCE
                    ):

                        current_section["entries"].append({

                            "type": "pair",

                            "highlight": event["text"],

                            "note": nxt["text"],

                            "color": event["color"],

                            "location": event["location"]

                        })

                        paired = True

                        j += 2

                if not paired:

                    current_section["entries"].append({

                        "type": "highlight",

                        "text": event["text"],

                        "color": event["color"],

                        "location": event["location"]

                    })

                    j += 1

            else:

                current_section["entries"].append({

                    "type": "note",

                    "text": event["text"],

                    "location": event["location"]

                })

                j += 1

        sections.append(current_section)

    output = {

        "title": title,

        "author": author,

        "sections": sections

    }

    (book_dir / "notes.json").write_text(

        json.dumps(
            output,
            ensure_ascii=False,
            indent=2
        ),

        encoding="utf-8"

    )

    print(f"Parsed {book_dir.name}")