from typing import List

SEPARATORS = [
    "\n\n",
    "\n",
    ". ",
    "? ",
    "! ",
    "; ",
    ", ",
    " ",
    "",
]


def recursive_chunk(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> List[str]:

    if not text:
        return []

    if len(text) <= chunk_size:
        return [text]

    chunks = _split_recursive(
        text=text,
        chunk_size=chunk_size,
        separators=SEPARATORS,
    )

    return _add_overlap(
        chunks=chunks,
        overlap=chunk_overlap,
    )


def _split_recursive(
    text: str,
    chunk_size: int,
    separators: List[str],
) -> List[str]:

    if len(text) <= chunk_size:
        return [text]

    separator = separators[0]

    if separator == "":
        return [
            text[i:i + chunk_size]
            for i in range(0, len(text), chunk_size)
        ]

    parts = text.split(separator)

    if len(parts) == 1:
        return _split_recursive(
            text=text,
            chunk_size=chunk_size,
            separators=separators[1:],
        )

    chunks = []
    current = ""

    for part in parts:

        if not current:
            candidate = part
        else:
            candidate = current + separator + part

        if len(candidate) <= chunk_size:
            current = candidate
            continue

        if current:
            chunks.extend(
                _split_recursive(
                    text=current,
                    chunk_size=chunk_size,
                    separators=separators[1:],
                )
            )

        current = part

    if current:
        chunks.extend(
            _split_recursive(
                text=current,
                chunk_size=chunk_size,
                separators=separators[1:],
            )
        )

    return chunks


def _add_overlap(
    chunks: List[str],
    overlap: int,
) -> List[str]:

    result = []

    for i, chunk in enumerate(chunks):
        if i > 0 and overlap > 0:
            previous = chunks[i - 1]
            overlap_text = previous[-overlap:]
            chunk = overlap_text + chunk

        result.append(chunk)

    return result
