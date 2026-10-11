/**
 * Mock user data and demo credentials for frontend-only demonstration in Phase 3.
 *
 * Limitations & Security notes:
 * - No backend or database is connected; mock authentication state is simulated in-memory and sessionStorage.
 * - Real password authentication is intentionally NOT implemented in this frontend prototype.
 * - Passwords are never transmitted over the network or stored in plaintext in persistent storage.
 */

export const mockUser = {
  id: "usr_mock_01",
  name: "Alex Mercer",
  username: "alexmercer",
  email: "alex.mercer@example.com",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

export const MOCK_DEMO_CREDENTIALS = {
  email: "alex.mercer@example.com",
  password: "password123",
  user: mockUser,
};

export const mockUsers = [mockUser];

// In-memory registry for users registered during the current browser session
const sessionRegisteredUsers = new Map();

/**
 * Register a simulated user in session memory for mock sign-in verification.
 */
export function registerMockUser({ name, username, email, password }) {
  const newUser = {
    id: `usr_mock_${Date.now()}`,
    name,
    username,
    email: email.toLowerCase(),
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };
  sessionRegisteredUsers.set(email.toLowerCase(), {
    user: newUser,
    password,
  });
  return newUser;
}

/**
 * Verify mock credentials against the demo account and session-registered users.
 */
export function authenticateMockUser(email, password) {
  const normalizedEmail = (email || "").trim().toLowerCase();

  // 1. Check default demo credentials
  if (
    normalizedEmail === MOCK_DEMO_CREDENTIALS.email &&
    password === MOCK_DEMO_CREDENTIALS.password
  ) {
    return { success: true, user: MOCK_DEMO_CREDENTIALS.user };
  }

  // 2. Check session-registered users
  if (sessionRegisteredUsers.has(normalizedEmail)) {
    const record = sessionRegisteredUsers.get(normalizedEmail);
    if (record.password === password) {
      return { success: true, user: record.user };
    }
  }

  return { success: false, error: "Invalid credentials" };
}
