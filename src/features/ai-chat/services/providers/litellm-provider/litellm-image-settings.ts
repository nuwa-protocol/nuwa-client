export type LitellmImageModelId = string;

export interface LitellmImageSettings {
  /**
A unique identifier representing your end-user, which can help the provider to
monitor and detect abuse.
  */
  user?: string;

  /**
   * The maximum number of images to generate.
   */
  maxImagesPerCall?: number;
}
