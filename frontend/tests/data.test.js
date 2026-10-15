import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUpload, filterKnowledge, validateUpload, formatBytes } from "../lib/knowledge-data.js";
import { normalizeMessages, normalizeChat, sortChats } from "../lib/chat-data.js";

test("saved uploads retain identity without invented processing metadata", () => {
  const item = normalizeUpload({ id: 8, data_type: "docs", data_source: "https://example.com/my%20notes.pdf?v=2", tag: "pdf" });
  assert.equal(item.id, 8);
  assert.equal(item.title, "my notes.pdf");
  assert.equal(item.type, "document");
  assert.equal(item.pageCount, undefined);
  assert.equal(item.status, undefined);
});

test("notes have content rather than external links, and facets compose", () => {
  const note = normalizeUpload({ id: 1, data_type: "text", data_source: "Learned about astronomy", tag: "Learning" });
  const document = normalizeUpload({ id: 2, data_type: "docs", data_source: "https://example.com/report.pdf" });
  assert.equal(note.url, null);
  assert.equal(filterKnowledge([note, document], "memory", "astronomy").length, 1);
  assert.equal(filterKnowledge([note, document], "document", "astronomy").length, 0);
});

test("file validation reflects supported formats and image limits", () => {
  assert.equal(validateUpload({ name: "notes.md", size: 100 }, "document"), "");
  assert.notEqual(validateUpload({ name: "legacy.doc", size: 100 }, "document"), "");
  assert.notEqual(validateUpload({ name: "large.pdf", size: 25 * 1024 * 1024 + 1 }, "document"), "");
  assert.notEqual(validateUpload({ name: "photo.jpg", size: 2 * 1024 * 1024 + 1 }, "image"), "");
  assert.equal(validateUpload({ name: "photo.webp", size: 2 * 1024 * 1024 }, "image"), "");
  assert.equal(formatBytes(1024), "1 KB");
});

test("chat normalization and ordering preserve database IDs without mutating inputs", () => {
  const chats = [normalizeChat({ id: 1, chat_title: "Older", updated_at: "2026-01-01" }), normalizeChat({ id: 2, chat_title: "Newer", updated_at: "2026-02-01" })];
  assert.deepEqual(sortChats(chats).map((chat) => chat.id), [2, 1]);
  assert.equal(chats[0].id, 1);
  assert.deepEqual(normalizeMessages([{ message_id: 42, sent_by: "USER", message_content: "Hello" }]), [{ id: 42, sender: "user", text: "Hello" }]);
});
