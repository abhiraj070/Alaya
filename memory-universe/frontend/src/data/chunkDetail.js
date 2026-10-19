import { demoUniverse } from './demoUniverse.js';

export async function getNodeDetail(id, isDemo, node) {
  if (isDemo) return demoUniverse.getChunk(id);
  if (node?.id === id && node.record_type === 'upload') {
    return {
      id,
      text_content: node.text_content,
      knowledge_type: node.knowledge_type,
      metadata: node.metadata,
      chunk_index: null,
      page_number: null,
      created_at: node.created_at,
      source: node.source,
    };
  }
  throw new Error('Upload details are unavailable. Refresh the universe and try again.');
}
