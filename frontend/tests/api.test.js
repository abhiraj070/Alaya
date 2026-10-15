import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { authApi, messagesApi, ApiError } from "../lib/api.js";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("login normalizes usernames and relies on cookies", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/user/login");
    assert.equal(options.credentials, "include");
    assert.equal(options.headers.has("Authorization"), false);
    assert.deepEqual(JSON.parse(options.body), { username: "ada", password: "secret" });
    return Response.json({ id: 7, name: "Ada", username: "ada" });
  };
  assert.equal((await authApi.login({ username: " @ada ", password: "secret" })).id, 7);
});

test("uploads let the browser set multipart boundaries", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/messages/file_upload");
    assert.equal(options.headers.has("Content-Type"), false);
    assert.ok(options.body instanceof FormData);
    assert.equal(await options.body.get("file").text(), "document content");
    return Response.json({ message: "Queued" });
  };
  await messagesApi.uploadFile(new File(["document content"], "notes.txt"));
});

test("streaming preserves multibyte characters split across network chunks", async () => {
  const bytes = new TextEncoder().encode("A memory 🌌");
  globalThis.fetch = async () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.slice(0, -2));
      controller.enqueue(bytes.slice(-2));
      controller.close();
    },
  }));
  const received = [];
  const result = await messagesApi.sendNewMessage(3, "Hello", 7, (text) => received.push(text));
  assert.equal(result, "A memory 🌌");
  assert.equal(received.at(-1), result);
});

test("edits use the same streaming transport", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/messages/update_message/3/42");
    assert.equal(options.method, "PUT");
    assert.deepEqual(JSON.parse(options.body), { message_content: "Updated" });
    return new Response("Updated answer");
  };
  assert.equal(await messagesApi.updateMessage(3, 42, "Updated"), "Updated answer");
});

test("HTTP failures retain server status and detail", async () => {
  globalThis.fetch = async () => Response.json({ detail: "Session expired" }, { status: 401 });
  await assert.rejects(authApi.getUser(7), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.message, "Session expired");
    return true;
  });
});

test("cancellation stays distinct from network errors", async () => {
  const controller = new AbortController();
  controller.abort();
  globalThis.fetch = async () => { throw controller.signal.reason; };
  await assert.rejects(messagesApi.sendNewMessage(3, "Hello", 7, null, controller.signal), { name: "AbortError" });
});
