export type LitellmEmbeddingModelId = string;

export interface LitellmEmbeddingSettings {
  /**
The number of dimensions the resulting output embeddings should have.
Only supported in text-embedding-3 and later models.
   */
  dimensions?: number;

  /**
A unique identifier representing your end-user, which can help Litellm to
monitor and detect abuse. Learn more.
*/
  user?: string;
}
