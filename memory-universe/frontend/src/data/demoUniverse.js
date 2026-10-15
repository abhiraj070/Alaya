import { demoDataset, DEMO_CHUNKS_MAP } from './demoDataset.js';

// Local fixtures only. The active mode is owned by the display store, not a second provider state.
export const demoUniverse = {
  getNodes() {
    return demoDataset;
  },

  async getChunk(id) {
    const chunk = DEMO_CHUNKS_MAP.get(id);
    if (!chunk) throw new Error(`Demo knowledge chunk #${id} not found`);
    return chunk;
  },

  getSourceDocument(sourceName, pageNumber = 1) {
    const chunks = [...DEMO_CHUNKS_MAP.values()].filter(
      (chunk) => chunk.source.data_source === `demo://${sourceName}`,
    );
    const pageChunks = chunks.filter((chunk) => chunk.page_number === pageNumber);
    return {
      docType: sourceName.endsWith('.pdf') ? 'PDF Document' : 'DOCX Document',
      totalPages: Math.max(pageNumber, ...chunks.map((chunk) => chunk.page_number || 1)),
      excerpt: pageChunks.map((chunk) => chunk.text_content).join('\n\n') || 'No sample content available for this page.',
    };
  },
};
