import bcrypt from "bcrypt";

export const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function validatePassword(password) {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: "La contraseña debe tener al menos 8 caracteres",
    };
  }

  if (password.length > 100) {
    return {
      valid: false,
      message: "La contraseña no puede tener más de 100 caracteres",
    };
  }

  return { valid: true };
}
