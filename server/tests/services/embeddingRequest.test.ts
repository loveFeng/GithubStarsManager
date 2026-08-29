import { describe, expect, it } from 'vitest';
import { buildEmbeddingRequest, parseEmbeddingResponse } from '../../src/services/embeddingRequest.js';

describe('buildEmbeddingRequest', () => {
  it('builds openai url and marks public hosts as non-private', () => {
    const built = buildEmbeddingRequest(
      { apiType: 'openai', baseUrl: 'https://api.openai.com', apiKey: 'sk', model: 'text-embedding-3-small' },
      ['hello'],
    );
    expect(built.url).toBe('https://api.openai.com/v1/embeddings');
    expect(built.allowPrivate).toBe(false);
    expect(built.headers.Authorization).toBe('Bearer sk');
  });

  it('allows private ollama http targets for https UI proxying', () => {
    const built = buildEmbeddingRequest(
      { apiType: 'ollama', baseUrl: 'http://127.0.0.1:11434', apiKey: '', model: 'nomic-embed-text' },
      ['hello'],
    );
    expect(built.url).toBe('http://127.0.0.1:11434/api/embed');
    expect(built.allowPrivate).toBe(true);
  });
});

describe('parseEmbeddingResponse', () => {
  it('parses openai-compatible payload', () => {
    const vectors = parseEmbeddingResponse('openai', {
      data: [
        { index: 1, embedding: [0, 1] },
        { index: 0, embedding: [2, 3] },
      ],
    });
    expect(vectors).toEqual([[2, 3], [0, 1]]);
  });
});
