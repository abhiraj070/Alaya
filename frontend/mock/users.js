/**
 * Mock user reference for frontend UI placeholders when needed.
 * Real authentication communicates directly with backend APIs (/api/user/login, /api/user/register).
 * No credentials or passwords are stored on the frontend.
 */

export const mockUser = {
  id: "usr_mock_01",
  name: "Alex Mercer",
  username: "alexmercer",
  email: "alex.mercer@example.com",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

export const mockUsers = [mockUser];
