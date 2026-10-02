import pandas as pd

def extract_text(file_path: str) -> str:
    df = pd.read_csv(file_path)
    rows = []
    for _, row in df.iterrows():
        fields = []
        for column, value in row.items():
            if pd.notna(value):
                fields.append(f"{column}: {value}")
        rows.append("\n".join(fields))
    return "\n\n".join(rows)