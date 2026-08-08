export type SignupValidationResult =
  | { valid: true }
  | { valid: false; message: string };

export function validateSignupForm(
  email: string,
  password: string,
  confirmPassword: string
): SignupValidationResult {
  if (!email.trim()) {
    return { valid: false, message: "Enter your school email." };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: "Use a password with at least 8 characters.",
    };
  }

  if (password !== confirmPassword) {
    return { valid: false, message: "Those passwords don't match." };
  }

  return { valid: true };
}
