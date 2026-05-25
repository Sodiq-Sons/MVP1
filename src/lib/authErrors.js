export function authErrorMessage(code) {
    switch (code) {
        case "auth/user-not-found":
            return {
                title: "Name not found",
                message: "No camper found with that name. Double-check your name or sign up.",
            };
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return {
                title: "Wrong password",
                message: "Incorrect password. Try again or reset your password.",
            };
        case "auth/email-already-in-use":
            return {
                title: "Name already taken",
                message: "This name is already registered. Try adding a number (e.g. Chidi2).",
            };
        case "auth/weak-password":
            return {
                title: "Weak password",
                message: "Use at least 6 characters for your password.",
            };
        case "auth/invalid-email":
            return {
                title: "Invalid input",
                message: "Please check your details and try again.",
            };
        case "auth/too-many-requests":
            return {
                title: "Too many attempts",
                message: "Account temporarily locked. Wait a few minutes and try again.",
            };
        case "auth/network-request-failed":
            return {
                title: "No connection",
                message: "Check your internet connection and try again.",
            };
        case "auth/user-disabled":
            return {
                title: "Account disabled",
                message: "This account has been disabled. Contact support.",
            };
        case "auth/expired-action-code":
            return {
                title: "Link expired",
                message: "This reset link has expired. Please request a new one.",
            };
        case "auth/invalid-action-code":
            return {
                title: "Invalid link",
                message: "This link is invalid or already used. Please request a new one.",
            };
        default:
            return {
                title: "Something went wrong",
                message: "An unexpected error occurred. Please try again.",
            };
    }
}
