import fitz

def extract_text(file_path: str) -> str:
    document = fitz.open(file_path)
    pages = []
    try:
        for page_number, page in enumerate(document, start=1):
            text = page.get_text("text").strip()

            if not text:
                continue

            pages.append(
                f"[Page {page_number}]\n{text}"
            )

    finally:
        document.close()

    return "\n\n".join(pages)