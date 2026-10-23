import { IRAGProvider } from './provider-interface';
import { DifyRAGProvider } from '../dify/dify-rag-provider';
import { LocalRAGProvider } from './local-rag-provider';

let cachedProvider: IRAGProvider | null = null;

/**
 * Returns the configured RAG provider singleton.
 * Selects DifyRAGProvider if DIFY_DATASET_API_KEY is configured in server environment;
 * otherwise gracefully falls back to LocalRAGProvider.
 */
export function getRAGProvider(): IRAGProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const difyKey = process.env.DIFY_DATASET_API_KEY;

  if (difyKey && difyKey.trim().length > 0) {
    cachedProvider = new DifyRAGProvider();
  } else {
    cachedProvider = new LocalRAGProvider();
  }

  return cachedProvider;
}

/**
 * Helper to override provider in unit tests
 */
export function setRAGProviderForTesting(provider: IRAGProvider | null) {
  cachedProvider = provider;
}
