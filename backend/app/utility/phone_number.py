import re


def normalize_phone_number(value: str) -> str:
    """Remove formatting and use +91 for local Indian numbers."""
    value = value.strip()
    if not re.fullmatch(r"\+?[0-9(). -]+", value):
        raise ValueError("Enter a valid phone number; use a country code for non-Indian numbers.")
    digits = re.sub(r"[^0-9]", "", value)
    if value.startswith("+"):
        international = digits
    elif digits.startswith("00"):
        international = digits[2:]
    elif len(digits) == 10:
        international = "91" + digits
    elif len(digits) == 11 and digits.startswith("0"):
        international = "91" + digits[1:]
    elif len(digits) == 12 and digits.startswith("91"):
        international = digits
    else:
        raise ValueError("Enter a 10-digit Indian number or include the international country code.")
    if not re.fullmatch(r"[1-9][0-9]{6,14}", international):
        raise ValueError("International phone numbers must contain 7 to 15 digits and a country code.")
    if international.startswith("91") and len(international) != 12:
        raise ValueError("Indian phone numbers must have 10 digits after +91.")
    return "+" + international
