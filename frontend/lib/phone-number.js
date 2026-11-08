export function normalizePhoneNumber(value) {
  const phone = value.trim();
  if (!/^\+?[0-9(). -]+$/.test(phone)) {
    throw new Error("Enter a valid phone number; use a country code for non-Indian numbers.");
  }
  const digits = phone.replace(/[^0-9]/g, "");
  let international;
  if (phone.startsWith("+")) international = digits;
  else if (digits.startsWith("00")) international = digits.slice(2);
  else if (digits.length === 10) international = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith("0")) international = `91${digits.slice(1)}`;
  else if (digits.length === 12 && digits.startsWith("91")) international = digits;
  else throw new Error("Enter a 10-digit Indian number or include the international country code.");

  if (!/^[1-9][0-9]{6,14}$/.test(international)) {
    throw new Error("International phone numbers must contain 7 to 15 digits and a country code.");
  }
  if (international.startsWith("91") && international.length !== 12) {
    throw new Error("Indian phone numbers must have 10 digits after +91.");
  }
  return `+${international}`;
}
