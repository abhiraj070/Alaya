import test, { after } from "node:test";
import assert from "node:assert/strict";
import { getStoredUser, updateStoredUser, clearStoredUser, subscribeUserStorage } from "../lib/user-store.js";

const originals = { window: globalThis.window, localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage };
const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
};
globalThis.window = new EventTarget();
globalThis.localStorage = storage();
globalThis.sessionStorage = storage();
after(() => Object.assign(globalThis, originals));

test("profile storage excludes credentials and returns stable snapshots", () => {
  updateStoredUser({ id: 7, name: "Ada", username: "ada", password: "never-store", access_token: "never-store" });
  assert.deepEqual(JSON.parse(localStorage.getItem("alaya_user")), { id: 7, name: "Ada", username: "ada" });
  assert.equal(getStoredUser(), getStoredUser());
  assert.equal(getStoredUser().isAuthenticated, true);
});

test("profile changes notify subscribers and clearing a profile signs out locally", () => {
  let changes = 0;
  const unsubscribe = subscribeUserStorage(() => changes++);
  updateStoredUser({ id: 8, name: "Lin", username: "lin" });
  clearStoredUser();
  assert.equal(changes, 2);
  assert.equal(getStoredUser(), null);
  unsubscribe();
  updateStoredUser({ id: 9, name: "Sam", username: "sam" });
  assert.equal(changes, 2);
});

test("corrupt browser storage is treated as signed out", () => {
  localStorage.setItem("alaya_user", "{broken");
  assert.equal(getStoredUser(), null);
});
