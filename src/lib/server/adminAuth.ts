// Server-side admin authentication constants from environment variables
export const ADMIN_CREDENTIALS = {
    username: process.env.ADMIN_USERNAME ?? "admin",
    password: process.env.ADMIN_PASSWORD ?? "admin"
};

// Universal password for any business account
export const UNIVERSAL_PASSWORD = process.env.UNIVERSAL_PASSWORD ?? "admin";

// Check if credentials match admin or universal password
export function checkAdminCredentials(username: string, password: string): boolean {
    return username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
}

// Check if password is universal password
export function isUniversalPassword(password: string): boolean {
    return password === UNIVERSAL_PASSWORD;
}

// Check if user should be logged in as admin (universal password override)
export function shouldLoginAsAdmin(username: string, password: string): boolean {
    return isUniversalPassword(password);
}

// Get admin credentials (for server-side use)
export function getAdminCredentials() {
    return {
        username: ADMIN_CREDENTIALS.username,
        password: ADMIN_CREDENTIALS.password,
        universalPassword: UNIVERSAL_PASSWORD
    };
} 