import { isPrivateOrLoopback } from './proxyService.js';

export type EmbeddingApiType =
  | 'openai'
  | 'openai-compatible'
  | 'siliconflow'
  | 'gemini'
  | 'cohere'
  | 'ollama';

export interface EmbeddingRequestConfig {
  apiType: EmbeddingApiType | string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface BuiltEmbeddingRequest {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  allowPrivate: boolean;
}

/** Build upstream embedding request; mirrors client EmbeddingClient URL rules. */
export function buildEmbeddingRequest(
  config: EmbeddingRequestConfig,
  texts: string[],
  purpose: 'document' | 'query' = 'document',
): BuiltEmbeddingRequest {
  const apiType = config.apiType || 'openai';
  const model = config.model || '';
  const apiKey = config.apiKey || '';
  const baseUrl = (config.baseUrl || '').replace(/\/+$/, '');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let url: string;
  let body: Record<string, unknown>;

  if (apiType === 'ollama') {
    url = `${baseUrl || 'http://127.0.0.1:11434'}/api/embed`;
    body = { model, input: texts };
  } else if (apiType === 'gemini') {
    const root = baseUrl || 'https://generativelanguage.googleapis.com';
    const taskType = purpose === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT';
    url = `${root}/v1beta/models/${encodeURIComponent(model)}:batchEmbedContents?key=${encodeURIComponent(apiKey)}`;
    body = {
      requests: texts.map((t) => ({
        model: `models/${model}`,
        content: { parts: [{ text: t }] },
        taskType,
      })),
    };
  } else if (apiType === 'cohere') {
    url = `${baseUrl || 'https://api.cohere.com'}/v1/embed`;
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    body = {
      model,
      texts,
      input_type: purpose === 'query' ? 'search_query' : 'search_document',
    };
  } else if (apiType === 'openai-compatible') {
    if (!baseUrl) {
      throw new Error('openai-compatible base_url is required (full embeddings endpoint)');
    }
    url = baseUrl;
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    body = { model, input: texts };
  } else {
    const root =
      baseUrl
      || (apiType === 'siliconflow' ? 'https://api.siliconflow.cn' : 'https://api.openai.com');
    url = /\/v1$/i.test(root) ? `${root}/embeddings` : `${root}/v1/embeddings`;
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    body = { model, input: texts };
  }

  let allowPrivate = false;
  try {
    allowPrivate = isPrivateOrLoopback(new URL(url).hostname);
  } catch {
    allowPrivate = false;
  }

  return { url, headers, body, allowPrivate };
}

export function parseEmbeddingResponse(apiType: string, data: Record<string, unknown>): number[][] {
  if (apiType === 'ollama') {
    const embeddings = data.embeddings as number[][] | undefined;
    if (embeddings?.length) return embeddings;
    const embVec = data.embedding as number[] | undefined;
    if (embVec) return [embVec];
    throw new Error('Ollama embedding missing');
  }
  if (apiType === 'gemini') {
    const batch = data.embeddings as Array<{ values?: number[] }> | undefined;
    if (batch?.length) {
      return batch.map((item) => {
        if (!item.values?.length) throw new Error('Gemini embedding missing');
        return item.values;
      });
    }
    const embObj = data.embedding as { values?: number[] } | undefined;
    if (embObj?.values?.length) return [embObj.values];
    throw new Error('Gemini embedding missing');
  }
  if (apiType === 'cohere') {
    const embeddings = data.embeddings as number[][] | undefined;
    if (!embeddings?.length) throw new Error('Cohere embedding missing');
    return embeddings;
  }
  const list = data.data as Array<{ embedding: number[]; index?: number }> | undefined;
  if (!list?.length) throw new Error('OpenAI-compatible embedding missing');
  return [...list]
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((item) => {
      if (!item.embedding?.length) throw new Error('OpenAI-compatible embedding missing');
      return item.embedding;
    });
}
