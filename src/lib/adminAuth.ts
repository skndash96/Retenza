// Client-side admin authentication utilities
// Note: Actual credentials are validated on the server side

// Validate admin session (client-side)
export function validateAdminSession(): boolean {
    if (typeof window === "undefined") return false;

    const isAuthenticated = localStorage.getItem("adminAuthenticated");
    const adminUsername = localStorage.getItem("adminUsername");

    return isAuthenticated === "true" && adminUsername === "admin";
}

// Check if user is authenticated as admin (client-side)
export function isAdminAuthenticated(): boolean {
    return validateAdminSession();
} 