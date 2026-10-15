import { universeApi } from '../api/universeApi.js';
import { demoUniverse } from './demoUniverse.js';

export async function getNodeDetail(id, isDemo, node, options = {}) {
  if (isDemo) return demoUniverse.getChunk(id);
  // Upload and Knowledge primary keys are independent. Never query /chunks with an upload ID.
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
  return universeApi.getChunk(id, options);
}
