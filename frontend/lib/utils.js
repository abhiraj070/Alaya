/**
 * Conditionally joins CSS class names together.
 * @param {...(string|boolean|null|undefined)} classes - CSS class names to join
 * @returns {string} Combined class names string
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
