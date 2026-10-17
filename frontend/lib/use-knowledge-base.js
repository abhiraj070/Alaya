"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { messagesApi, uploadedDataApi } from "@/lib/api";
import { filterKnowledge, formatBytes, KNOWLEDGE_TAGS, normalizeUpload, validateUpload } from "@/lib/knowledge-data";

// The file and image panels keep their original UI and share their request lifecycle.
function useUploadDraft(kind, onQueued) {
  const [draft, setDraft] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const requestRef = useRef(null);
  const previewUrl = draft?.previewUrl;

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const choose = (files) => {
    const file = files?.[0];
    if (!file || busy) return;
    const validation = validateUpload(file, kind);
    setError(validation);
    if (validation) return;
    setDraft({
      name: file.name,
      size: formatBytes(file.size),
      fileType: file.name.split(".").pop().toLowerCase(),
      fileObj: file,
      previewUrl: kind === "image" ? URL.createObjectURL(file) : null,
      dimensions: "Image preview",
    });
  };

  const submit = async () => {
    if (!draft || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setError("");
    try {
      const upload = kind === "image" ? messagesApi.uploadImage : messagesApi.uploadFile;
      await upload(draft.fileObj, { signal: controller.signal });
      if (controller.signal.aborted) return;
      onQueued(`“${draft.name}” is queued for processing.`);
      setDraft(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message);
    } finally {
      if (!controller.signal.aborted) {
        requestRef.current = null;
        setBusy(false);
      }
    }
  };

  return { draft, dragging, setDragging, busy, error, inputRef, choose, submit };
}

export function useKnowledgeBase(onUploadQueued) {
  const { user } = useAuth();
  const userId = user?.id;
  const [items, setItems] = useState([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(true);
  const [activeInputMode, setActiveInputMode] = useState("files");
  const [toast, setToast] = useState(null);
  const [textValue, setTextValue] = useState("");
  const [selectedTag, setSelectedTag] = useState("Accomplishment");
  const [isTextSubmitting, setIsTextSubmitting] = useState(false);
  const [textError, setTextError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const searchInputRef = useRef(null);
  const listRequest = useRef(null);
  const textRequest = useRef(null);

  const loadUploads = useCallback((signal) => {
    const request = userId ? uploadedDataApi.getUploads(userId, { signal }) : Promise.resolve([]);
    return request.then((uploads) => {
      if (!signal.aborted) setItems(uploads.map(normalizeUpload));
    }).catch((error) => {
      if (!signal.aborted) setToast({ type: "error", message: error.message });
    }).finally(() => {
      if (!signal.aborted) setIsLoadingUploads(false);
    });
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    listRequest.current = controller;
    loadUploads(controller.signal);
    return () => { listRequest.current?.abort(); textRequest.current?.abort(); };
  }, [loadUploads]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const onQueued = (message) => {
    onUploadQueued?.(message);
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    loadUploads(controller.signal);
  };
  const documentUpload = useUploadDraft("document", onQueued);
  const image = useUploadDraft("image", onQueued);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (itemToDelete) return;
      if (event.key === "/" && !event.target.isContentEditable && !["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("");
        searchInputRef.current.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [itemToDelete]);

  const handleTextSubmit = async () => {
    const text = textValue.trim();
    if (!text || textRequest.current) return;
    const controller = new AbortController();
    textRequest.current = controller;
    setIsTextSubmitting(true);
    setTextError("");
    try {
      await messagesApi.feedKnowledge({ textContent: text, tag: selectedTag }, { signal: controller.signal });
      if (!controller.signal.aborted) { setTextValue(""); onQueued("Your memory is queued for processing."); }
    } catch (error) {
      if (!controller.signal.aborted) setTextError(error.message);
    } finally {
      if (!controller.signal.aborted) { textRequest.current = null; setIsTextSubmitting(false); }
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || isDeletingItem) return;
    setIsDeletingItem(true);
    setDeleteError("");
    try {
      await uploadedDataApi.deleteUpload(itemToDelete.id);
      setItems((previous) => previous.filter((item) => item.id !== itemToDelete.id));
      setItemToDelete(null);
      setToast({ type: "info", message: `Removed “${itemToDelete.title}” from upload history.` });
    } catch (error) {
      setDeleteError(error.message);
      setToast({ type: "error", message: error.message });
    } finally { setIsDeletingItem(false); }
  };

  return {
    items, toast, setToast, activeInputMode, setActiveInputMode, isLoadingUploads,
    stagedFile: documentUpload.draft, isFileDragging: documentUpload.dragging, setIsFileDragging: documentUpload.setDragging,
    isFilesProcessing: documentUpload.busy, fileProcessingStep: "Uploading document...", fileError: documentUpload.error,
    fileInputRef: documentUpload.inputRef, handleFileSelected: documentUpload.choose, handleIngestFileSubmit: documentUpload.submit,
    stagedImage: image.draft, isImageDragging: image.dragging, setIsImageDragging: image.setDragging,
    isImagesProcessing: image.busy, imageProcessingStep: "Uploading image...", imageError: image.error,
    imageInputRef: image.inputRef, handleImageSelected: image.choose, handleIndexImageSubmit: image.submit,
    textValue, setTextValue, selectedTag, setSelectedTag, isTextSubmitting, textError, setTextError,
    tagsList: KNOWLEDGE_TAGS.map((id) => ({ id, label: `#${id.toLowerCase()}` })), handleTextSubmit,
    activeFilter, setActiveFilter, searchQuery, setSearchQuery, searchInputRef,
    docCount: items.filter((item) => item.type === "document").length,
    imgCount: items.filter((item) => item.type === "image").length,
    memCount: items.filter((item) => item.type === "memory").length,
    filteredItems: filterKnowledge(items, activeFilter, searchQuery),
    itemToDelete, setItemToDelete: (item) => { setDeleteError(""); setItemToDelete(item); }, isDeletingItem, deleteError, handleConfirmDelete,
  };
}
