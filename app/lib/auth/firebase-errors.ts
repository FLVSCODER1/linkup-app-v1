type FirebaseErrorLike = {
  code?: unknown;
};

export function getFirebaseAuthErrorMessage(
  error: unknown,
  fallback = "We couldn't complete that request."
): string {
  const code =
    typeof error === "object" && error !== null
      ? (error as FirebaseErrorLike).code
      : null;

  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists for that email. Try logging in instead.";
    case "auth/invalid-email":
      return "Enter a valid school email address.";
    case "auth/weak-password":
      return "Use a password with at least 8 characters.";
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The email or password is incorrect.";
    case "auth/operation-not-allowed":
      return "Email and password login is not enabled for this environment.";
    case "auth/app-not-authorized":
    case "auth/unauthorized-domain":
      return "This preview address is not authorized in Firebase yet.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact LinkUp support.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Check your connection and try again.";
    default:
      return fallback;
  }
}
