import { CapKit } from '@nuwa-ai/cap-kit';
import { capKitConfig } from '../config/capkit';
import { NuwaIdentityKit } from './identity-kit';

class CapKitService {
  private static instance: CapKitService;
  private capKit: CapKit | null = null;
  private initializationPromise: Promise<CapKit> | null = null;
  private isInitializing = false;

  private constructor() {}

  static getInstance(): CapKitService {
    if (!CapKitService.instance) {
      CapKitService.instance = new CapKitService();
    }
    return CapKitService.instance;
  }

  async getCapKit(): Promise<CapKit> {
    // If already initialized, return the instance
    if (this.capKit) {
      return this.capKit;
    }

    // If currently initializing, wait for the existing initialization
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this.initializeCapKit();
    return this.initializationPromise;
  }

  private async initializeCapKit(): Promise<CapKit> {
    try {
      this.isInitializing = true;

      const identityEnv = await NuwaIdentityKit().getIdentityEnv();

      this.capKit = new CapKit({
        ...capKitConfig,
        env: identityEnv,
      });

      return this.capKit;
    } catch (error) {
      // Reset initialization state on error
      this.initializationPromise = null;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Reset the CapKit instance (useful for logout/login scenarios)
   */
  reset(): void {
    this.capKit?.mcpClose();
    this.capKit = null;
    this.initializationPromise = null;
    this.isInitializing = false;
  }

  /**
   * Check if CapKit is currently being initialized
   */
  isInitializingCapKit(): boolean {
    return this.isInitializing;
  }

  /**
   * Check if CapKit is already initialized
   */
  isInitialized(): boolean {
    return this.capKit !== null;
  }
}

// Export singleton instance
export const capKitService = CapKitService.getInstance();

// Export convenience function for getting CapKit
export const getCapKit = () => capKitService.getCapKit();
