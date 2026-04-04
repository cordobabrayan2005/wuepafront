export type PasswordValidationResult = {
  valid: boolean;
  message?: string;
};

const LETTER_REGEX = /[A-Za-z]/g;
const DIGIT_REGEX = /\d/g;
const SPECIAL_REGEX = /[^A-Za-z0-9\s]/g;

/**
 * Valida la contraseña según requisitos personalizados.
 * Requiere al menos cinco letras, tres dígitos y un símbolo especial.
 */
export function validatePasswordRules(password: string): PasswordValidationResult {
  const letters = password.match(LETTER_REGEX)?.length ?? 0;
  if (letters < 5) {
    return { valid: false, message: "La contraseña debe incluir al menos 5 letras." };
  }

  const digits = password.match(DIGIT_REGEX)?.length ?? 0;
  if (digits < 3) {
    return { valid: false, message: "La contraseña debe incluir al menos 3 números." };
  }

  const symbols = password.match(SPECIAL_REGEX)?.length ?? 0;
  if (symbols < 1) {
    return { valid: false, message: "La contraseña debe incluir al menos un símbolo especial." };
  }

  return { valid: true };
}
