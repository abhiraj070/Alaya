from pathlib import Path
from .pdf import extract_text as extract_pdf
from .docx_ext import extract_text as extract_docx
from .text import extract_text as extract_txt
from .csv import extract_text as extract_csv
from .xlsx import extract_text as extract_xlsx
from .pptx_ext import extract_text as extract_pptx

EXTRACTORS = {
    ".pdf": extract_pdf,
    ".docx": extract_docx,
    ".txt": extract_txt,
    ".md": extract_txt,
    ".csv": extract_csv,
    ".xlsx": extract_xlsx,
    ".pptx": extract_pptx,
}

def extract_text(file_path: str) -> str:
    extension = Path(file_path).suffix.lower()
    extractor = EXTRACTORS.get(extension)
    if extractor is None:
        raise ValueError(
            f"Unsupported file type: {extension}"
        )
    text = extractor(file_path)
    if not text.strip():
        raise ValueError(
            "No text could be extracted from the file"
        )
    return text