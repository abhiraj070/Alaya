/**
 * Alaya Memory Universe — Deterministic Curated Demo Dataset
 *
 * Provides a populated, realistic knowledge universe (84 chunks across 3 subject sectors):
 * - Sector 0: Artificial Intelligence & Neural Systems (Cluster ID: 0)
 * - Sector 1: Software Engineering & Distributed Architecture (Cluster ID: 1)
 * - Sector 2: Cognitive Science, Mental Models & Learning (Cluster ID: 2)
 *
 * Coordinates are precomputed and deterministic.
 * Demo IDs use the 90000+ range and are strictly isolated from production database IDs.
 */

// Simple deterministic pseudorandom number generator (LCG) with fixed seed
function createDeterministicRandom(seed = 42) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rng = createDeterministicRandom(1337);

function generateClusterCoords(centerX, centerY, centerZ, spreadRadius = 14) {
  const u = rng();
  const v = rng();
  const theta = u * 2.0 * Math.PI;
  const phi = Math.acos(2.0 * v - 1.0);
  const r = Math.cbrt(rng()) * spreadRadius;

  const sinPhi = Math.sin(phi);
  return {
    x: Number((centerX + r * sinPhi * Math.cos(theta)).toFixed(2)),
    y: Number((centerY + r * sinPhi * Math.sin(theta)).toFixed(2)),
    z: Number((centerZ + r * Math.cos(phi)).toFixed(2)),
  };
}

// ----------------------------------------------------------------------------
// RAW DEMO ENTRIES DEFINITIONS
// ----------------------------------------------------------------------------
const DEMO_ENTRIES_CONFIG = [
  // ==========================================
  // SECTOR 0: AI & Neural Systems (28 items)
  // Center: (-18, 12, -10)
  // ==========================================
  {
    clusterId: 0,
    clusterName: 'Sector 0: Neural Systems',
    centerX: -18,
    centerY: 12,
    centerZ: -10,
    entries: [
      {
        title: 'Transformer Attention Mechanism',
        preview: 'Scaled dot-product attention computes query-key similarity matrices divided by the square root of dimension dk.',
        fullText: 'Scaled dot-product attention calculates query-key compatibility divided by the square root of dimension dk to prevent softmax gradients from vanishing into small regions. The formula is Attention(Q, K, V) = softmax(QK^T / sqrt(dk))V. Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.',
        knowledgeType: 'deep_learning',
        metadata: { paper: 'Attention Is All You Need', year: 2017, author: 'Vaswani et al.', complexity: 'O(N^2)' },
        sourceType: 'docs',
        sourceName: 'transformer_architectures.pdf',
        chunkIndex: 0,
        pageNumber: 3,
      },
      {
        title: 'Positional Encodings in LLMs',
        preview: 'Since self-attention contains no recurrent or convolutional bias, positional encodings must inject sequence ordering.',
        fullText: 'Transformers rely on positional representations because self-attention is permutation-invariant. Classical architectures utilize sinusoidal encodings across dimensions, while modern large language models favor Rotary Position Embeddings (RoPE) or ALiBi, enabling extrapolation to sequences beyond the training context length.',
        knowledgeType: 'deep_learning',
        metadata: { topic: 'positional_encoding', variant: 'RoPE', sequence_length: 32768 },
        sourceType: 'docs',
        sourceName: 'transformer_architectures.pdf',
        chunkIndex: 1,
        pageNumber: 5,
      },
      {
        title: 'Vector Embeddings & Cosine Metric',
        preview: 'Embeddings map high-dimensional semantic spaces into dense continuous vector representations.',
        fullText: 'Embeddings convert discrete tokens or knowledge chunks into 1,536-dimensional continuous vectors where semantic similarity corresponds to geometric proximity. Cosine distance (1 - cosine_similarity) normalizes vector lengths, measuring angular separation regardless of document word count.',
        knowledgeType: 'vector_indexing',
        metadata: { model: 'text-embedding-3-small', dimensions: 1536, metric: 'cosine_distance' },
        sourceType: 'docs',
        sourceName: 'vector_retrieval_systems.pdf',
        chunkIndex: 0,
        pageNumber: 2,
      },
      {
        title: 'Hierarchical Navigable Small Worlds',
        preview: 'HNSW graphs provide sub-linear approximate nearest neighbor search over millions of high-dimensional vectors.',
        fullText: 'HNSW constructs multi-layer proximity graphs where upper layers maintain long-range skip connections and lower layers offer granular local clustering. Graph traversal operates greedily, achieving logarithmic query time complexity O(log N) compared to exhaustive exact Euclidean scanning.',
        knowledgeType: 'vector_indexing',
        metadata: { algorithm: 'HNSW', m_parameter: 16, ef_construction: 200 },
        sourceType: 'docs',
        sourceName: 'vector_retrieval_systems.pdf',
        chunkIndex: 1,
        pageNumber: 8,
      },
      {
        title: 'Retrieval-Augmented Generation (RAG)',
        preview: 'RAG combines vector database retrieval with generative LLMs to ground generation on private knowledge bases.',
        fullText: 'Retrieval-Augmented Generation extracts relevant context chunks from pgvector using hybrid semantic and BM25 ranking, synthesizing them into the system prompt. This eliminates model hallucination for domain-specific documentation while guaranteeing auditability.',
        knowledgeType: 'architecture',
        metadata: { paradigm: 'RAG', chunk_size: 1000, overlap: 150 },
        sourceType: 'docs',
        sourceName: 'vector_retrieval_systems.pdf',
        chunkIndex: 2,
        pageNumber: 14,
      },
      {
        title: 'Quantization & Low-Rank Adaptation',
        preview: 'LoRA freezes pre-trained weights and injects trainable rank decomposition matrices into attention projections.',
        fullText: 'Parameter-Efficient Fine-Tuning (PEFT) through LoRA reduces trainable parameters by 99% by decomposing weight updates into W + B*A where rank r << d. Paired with 4-bit NormalFloat (QLoRA), 70B parameter models can be fine-tuned on single consumer GPUs.',
        knowledgeType: 'deep_learning',
        metadata: { technique: 'LoRA', precision: '4-bit QLoRA', target_modules: ['q_proj', 'v_proj'] },
        sourceType: 'docs',
        sourceName: 'model_optimization.pdf',
        chunkIndex: 0,
        pageNumber: 4,
      },
      {
        title: 'KV Cache Memory Scaling',
        preview: 'Key-value caching stores historical attention projections to accelerate auto-regressive decoding.',
        fullText: 'During autoregressive generation, computing attention against past tokens consumes significant memory if not cached. KV caching stores K and V projections in VRAM, eliminating duplicate matrix multiplication at the cost of O(batch * seq_len * layers * dim) memory footprint.',
        knowledgeType: 'systems',
        metadata: { cache_type: 'paged_kv_cache', memory_impact: 'high', optimization: 'vLLM' },
        sourceType: 'docs',
        sourceName: 'model_optimization.pdf',
        chunkIndex: 1,
        pageNumber: 7,
      },
      {
        title: 'Direct Feedback: Neural Scaling Laws',
        preview: 'Empirical scaling laws show model cross-entropy loss drops as a power-law with parameters and compute.',
        fullText: 'Kaplan and Chinchilla scaling laws established that optimal training requires scaling model parameter count and token volume in equal proportion. Allocating 20 tokens per model parameter balances compute expenditure against loss reduction.',
        knowledgeType: 'research_note',
        metadata: { paper: 'Chinchilla', tokens_per_param: 20 },
        sourceType: 'text',
        sourceName: null,
      },
      {
        title: 'Direct Feedback: Mixture of Experts',
        preview: 'MoE architectures activate only a sparse subset of expert feed-forward networks for each incoming token.',
        fullText: 'Mixture of Experts routes tokens dynamically through top-k routing gates into specialized sub-networks, achieving the capacity of a massive model with the inference FLOPs of a much smaller parameter footprint.',
        knowledgeType: 'architecture',
        metadata: { type: 'Sparse MoE', experts: 8, active_per_token: 2 },
        sourceType: 'text',
        sourceName: null,
      },
      {
        title: 'UMAP Dimensionality Reduction',
        preview: 'UMAP preserves both local neighborhood graphs and global continuum topologies when projecting 1536D to 3D.',
        fullText: 'Uniform Manifold Approximation and Projection constructs a fuzzy simplicial set representation of high-dimensional data, minimizing cross-entropy to find an equivalent low-dimensional manifold in 3D Euclidean space.',
        knowledgeType: 'manifold_learning',
        metadata: { n_components: 3, metric: 'cosine', n_neighbors: 15 },
        sourceType: 'docs',
        sourceName: 'manifold_learning.pdf',
        chunkIndex: 0,
        pageNumber: 1,
      },
      // Chunks 11 to 28
      ...Array.from({ length: 18 }, (_, i) => ({
        title: `AI Subsystem Research #${i + 11}`,
        preview: `Analysis of specialized neural pipeline components, context window extensions, and latent space clustering in modern AI agents.`,
        fullText: `Detailed analysis of subsystem #${i + 11}: Evaluates reinforcement learning from human feedback (RLHF), constitutional AI alignments, cross-entropy loss convergence, and speculative decoding techniques to increase token throughput across distributed clusters.`,
        knowledgeType: i % 2 === 0 ? 'deep_learning' : 'agentic_systems',
        metadata: { subtopic_id: i + 11, benchmark: 'MMLU-Pro', status: 'verified' },
        sourceType: i % 3 === 0 ? 'text' : 'docs',
        sourceName: i % 3 === 0 ? null : 'deep_learning_handbook.pdf',
        chunkIndex: i % 3 === 0 ? null : i,
        pageNumber: i % 3 === 0 ? null : Math.floor(i / 2) + 1,
      })),
    ],
  },

  // ==========================================
  // SECTOR 1: Software Engineering (28 items)
  // Center: (20, 8, 12)
  // ==========================================
  {
    clusterId: 1,
    clusterName: 'Sector 1: Distributed Systems',
    centerX: 20,
    centerY: 8,
    centerZ: 12,
    entries: [
      {
        title: 'PostgreSQL Vector Extension (pgvector)',
        preview: 'pgvector provides native vector storage and exact HNSW/IVFFlat indexing inside PostgreSQL tables.',
        fullText: 'pgvector integrates 1,536-dimensional float arrays directly into relational schemas. It allows transactional consistency (ACID), foreign keys to metadata records, and hybrid SQL queries combining metadata JSONB filtering with vector cosine distance in a single planner step.',
        knowledgeType: 'database',
        metadata: { extension: 'pgvector', index: 'hnsw', operators: '<=> (cosine)' },
        sourceType: 'docs',
        sourceName: 'clean_architecture_guide.pdf',
        chunkIndex: 0,
        pageNumber: 2,
      },
      {
        title: 'Clean Architecture Dependency Rule',
        preview: 'Source code dependencies must point inwards towards high-level policy entities and business logic.',
        fullText: 'In Clean Architecture, business rules remain completely decoupled from database frameworks, web drivers, and UI widgets. Outer layers act as adapters (controllers, gateways) that implement inward interfaces defined by inner application use-cases.',
        knowledgeType: 'software_engineering',
        metadata: { author: 'Robert C. Martin', principle: 'Dependency Inversion' },
        sourceType: 'docs',
        sourceName: 'clean_architecture_guide.pdf',
        chunkIndex: 1,
        pageNumber: 6,
      },
      {
        title: 'FastAPI Async Concurrency & Event Loops',
        preview: 'FastAPI uses Starlette async/await execution with an underlying uvloop event loop for non-blocking I/O.',
        fullText: 'FastAPI routes declared with async def run directly on the main event loop, making them ideal for high-concurrency non-blocking database and redis calls. Synchronous CPU-bound tasks (such as UMAP projection) must be dispatched to threadpools using asyncio.to_thread to prevent event loop starvation.',
        knowledgeType: 'web_framework',
        metadata: { framework: 'FastAPI', engine: 'uvloop', concurrency: 'asynchronous' },
        sourceType: 'docs',
        sourceName: 'clean_architecture_guide.pdf',
        chunkIndex: 2,
        pageNumber: 11,
      },
      {
        title: 'Redis Pub/Sub & Worker Queues (ARQ)',
        preview: 'ARQ leverages Redis asynchronous operations to schedule background text extraction, embedding, and UMAP jobs.',
        fullText: 'Background ingestion offloads long-running tasks from HTTP request lifecycles. Redis acts as a fast FIFO job queue with atomic locks for task debouncing, notifying connected frontend clients over WebSocket channels upon job completion.',
        knowledgeType: 'distributed_systems',
        metadata: { queue: 'ARQ', backend: 'Redis 7', debounce_window: '15s' },
        sourceType: 'docs',
        sourceName: 'distributed_systems_patterns.docx',
        chunkIndex: 0,
        pageNumber: null,
      },
      {
        title: 'Idempotency in Distributed APIs',
        preview: 'Idempotency keys prevent duplicate transaction processing during transient network retries.',
        fullText: 'By attaching a unique client-generated UUID in the Idempotency-Key header, backend gateways store the execution result in Redis with a TTL. Subsequent retries return the cached response without re-executing state mutations.',
        knowledgeType: 'software_engineering',
        metadata: { pattern: 'Idempotency', header: 'Idempotency-Key', storage: 'Redis' },
        sourceType: 'docs',
        sourceName: 'distributed_systems_patterns.docx',
        chunkIndex: 1,
        pageNumber: null,
      },
      {
        title: 'Direct Note: ACID Isolation Levels',
        preview: 'PostgreSQL Read Committed versus Repeatable Read and Serializable transaction anomaly prevention.',
        fullText: 'Read Committed prevents dirty reads. Repeatable Read prevents non-repeatable reads and phantom reads in PostgreSQL using Multi-Version Concurrency Control (MVCC). Serializable prevents write skew using Serializable Snapshot Isolation (SSI).',
        knowledgeType: 'database',
        metadata: { engine: 'PostgreSQL', default: 'Read Committed' },
        sourceType: 'text',
        sourceName: null,
      },
      // Chunks 7 to 28
      ...Array.from({ length: 22 }, (_, i) => ({
        title: `Systems Architecture Principle #${i + 7}`,
        preview: `Best practices for fault-tolerant microservices, resilient connection pooling, circuit breakers, and zero-downtime database migrations.`,
        fullText: `Analysis of system pattern #${i + 7}: Covers distributed consensus algorithms (Raft, Paxos), connection pooling tuning with PgBouncer, exponential backoff with full jitter, and Alembic database versioning patterns for zero-downtime deployment.`,
        knowledgeType: i % 2 === 0 ? 'distributed_systems' : 'software_engineering',
        metadata: { pattern_id: i + 7, category: 'Infrastructure', level: 'Production' },
        sourceType: i % 4 === 0 ? 'text' : 'docs',
        sourceName: i % 4 === 0 ? null : 'distributed_systems_patterns.docx',
        chunkIndex: i % 4 === 0 ? null : i,
        pageNumber: null,
      })),
    ],
  },

  // ==========================================
  // SECTOR 2: Cognitive Science & Learning (28 items)
  // Center: (-4, -22, 18)
  // ==========================================
  {
    clusterId: 2,
    clusterName: 'Sector 2: Cognitive Science',
    centerX: -4,
    centerY: -22,
    centerZ: 18,
    entries: [
      {
        title: 'Spaced Repetition & Forgetting Curve',
        preview: 'Ebbinghaus forgetting curve demonstrates how memory decay decelerates with spaced active recall sessions.',
        fullText: 'Memory retention decays exponentially without reinforcement. The SuperMemo SM-2 and modern FSRS algorithms compute optimal review intervals based on difficulty and stability parameters, scheduling reviews precisely at the moment of near-forgetting to maximize synaptic consolidation.',
        knowledgeType: 'cognitive_science',
        metadata: { algorithm: 'FSRS-4', founder: 'Hermann Ebbinghaus', metric: 'retrievability' },
        sourceType: 'docs',
        sourceName: 'effective_learning_principles.pdf',
        chunkIndex: 0,
        pageNumber: 1,
      },
      {
        title: 'The Feynman Technique for Deep Understanding',
        preview: 'Teaching a complex concept in simple language immediately reveals conceptual gaps and illusions of explanatory depth.',
        fullText: 'The Feynman Technique involves four iterative steps: 1) Choose a concept, 2) Explain it to a novice using plain language and analogies, 3) Identify gaps where jargon was used as a crutch, and 4) Review original reference material to refine and simplify the explanation.',
        knowledgeType: 'learning_methodology',
        metadata: { author: 'Richard Feynman', method: 'Analogy & Simplification' },
        sourceType: 'docs',
        sourceName: 'effective_learning_principles.pdf',
        chunkIndex: 1,
        pageNumber: 4,
      },
      {
        title: 'Cognitive Load Theory: Intrinsic & Extraneous',
        preview: 'Working memory capacity is strictly bounded (Miller 7±2, Sweller 4 chunks); instructional design must reduce extraneous load.',
        fullText: 'Cognitive Load Theory distinguishes between Intrinsic Load (inherent concept difficulty), Extraneous Load (inefficient presentation or interface friction), and Germane Load (effort dedicated to schema construction). Eliminating interface distractions preserves precious working memory bandwidth for creative synthesis.',
        knowledgeType: 'cognitive_science',
        metadata: { theory: 'Sweller Cognitive Load', limit: '4 working chunks' },
        sourceType: 'docs',
        sourceName: 'effective_learning_principles.pdf',
        chunkIndex: 2,
        pageNumber: 8,
      },
      {
        title: 'Direct Note: Dual-Coding Theory',
        preview: 'Information processed simultaneously through verbal and spatial channels creates stronger associative memory traces.',
        fullText: 'Paivio Dual-Coding Theory posits that memory consists of separate verbal (textual) and non-verbal (spatial, visual) representations. Navigating knowledge in a 3D celestial universe activates spatial navigation circuits (hippocampal place cells), anchoring text memories to spatial coordinates.',
        knowledgeType: 'cognitive_science',
        metadata: { framework: 'Allan Paivio', channel: 'Spatial-Visual' },
        sourceType: 'text',
        sourceName: null,
      },
      // Chunks 5 to 28
      ...Array.from({ length: 24 }, (_, i) => ({
        title: `Learning & Thinking Model #${i + 5}`,
        preview: `Exploration of mental models, deliberate practice frameworks, interleaving effects, and metacognitive monitoring techniques.`,
        fullText: `Examination of cognitive model #${i + 5}: Covers Bloom taxonomy levels, Ericsson deliberate practice conditions (immediate feedback, target difficulty), interleaving versus blocked practice, and the generation effect in self-testing.`,
        knowledgeType: i % 2 === 0 ? 'learning_methodology' : 'cognitive_science',
        metadata: { model_id: i + 5, topic: 'Schema Construction' },
        sourceType: i % 3 === 0 ? 'text' : 'docs',
        sourceName: i % 3 === 0 ? null : 'effective_learning_principles.pdf',
        chunkIndex: i % 3 === 0 ? null : i + 3,
        pageNumber: i % 3 === 0 ? null : Math.floor(i / 3) + 9,
      })),
    ],
  },
];

// ----------------------------------------------------------------------------
// BUILD CONSOLIDATED DETERMINISTIC DATASET
// ----------------------------------------------------------------------------
let currentId = 90001; // Start in 90000+ range for strict isolation

export const DEMO_NODES = [];
export const DEMO_CHUNKS_MAP = new Map();

DEMO_ENTRIES_CONFIG.forEach((clusterConfig) => {
  const { clusterId, clusterName, centerX, centerY, centerZ, entries } = clusterConfig;

  entries.forEach((entry) => {
    const id = currentId++;
    const coords = generateClusterCoords(centerX, centerY, centerZ, 13.5);

    const isDirect = entry.sourceType === 'text' || !entry.sourceName;
    const createdAt = new Date('2026-10-14T10:00:00Z').toISOString();

    // Node representation for Starfield & Search
    const node = {
      id,
      x: coords.x,
      y: coords.y,
      z: coords.z,
      title: entry.title,
      preview: entry.preview,
      knowledge_type: entry.knowledgeType,
      cluster_id: clusterId,
      cluster_name: clusterName,
      source_type: entry.sourceType,
      source_name: entry.sourceName,
      has_source: !isDirect,
      created_at: createdAt,
      is_demo: true,
    };

    DEMO_NODES.push(node);

    // Full chunk representation for ChunkDetailDrawer
    const chunkDetail = {
      id,
      text_content: entry.fullText,
      knowledge_type: entry.knowledgeType,
      metadata: entry.metadata || {},
      chunk_index: entry.chunkIndex ?? null,
      page_number: entry.pageNumber ?? null,
      created_at: createdAt,
      is_demo: true,
      source: isDirect
        ? {
            id: 99000,
            data_type: 'text',
            tag: null,
            data_source: entry.preview,
            created_at: createdAt,
          }
        : {
            id: 99000 + (clusterId + 1),
            data_type: 'docs',
            tag: entry.sourceName.endsWith('.pdf') ? 'pdf' : 'docx',
            data_source: `demo://${entry.sourceName}`,
            created_at: createdAt,
          },
    };

    DEMO_CHUNKS_MAP.set(id, chunkDetail);
  });
});

export const DEMO_TOTAL_STARS = DEMO_NODES.length; // 84 Stars
export const DEMO_ID_OFFSET = 90000;
export const DEMO_NODE_COUNT = DEMO_NODES.length;

export const demoDataset = {
  nodes: DEMO_NODES,
  total_stars: DEMO_TOTAL_STARS,
  is_projected: true,
  unprojected_count: 0,
};

/**
 * Helper to test whether an ID belongs strictly to the demo dataset
 */
export function isDemoId(id) {
  if (typeof id === 'string') {
    return id.startsWith('demo_') || id.startsWith('demo-');
  }
  return typeof id === 'number' && id >= 90000 && id < 100000;
}

export default demoDataset;
