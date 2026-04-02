/**
 * Capitalizes the first letter of a given string.
 * If the string is empty, it returns an empty string.
 *
 * @param str The input string.
 * @returns The string with its first letter capitalized.
 */
export function capitalize(str: string): string {
  if (str.length === 0) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Reverses a given string.
 * If the string is empty, it returns an empty string.
 *
 * @param str The input string.
 * @returns The reversed string.
 */
export function reverse(str: string): string {
  if (str.length === 0) {
    return "";
  }
  return str.split("").reverse().join("");
}
