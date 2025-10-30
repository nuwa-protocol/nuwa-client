import { CapKitMcp, CapKitRestful } from '@nuwa-ai/cap-kit';
import { capKitConfig } from '../config/capkit';
import { NuwaIdentityKit } from './identity-kit';

class CapKitService {
  private static instance: CapKitService;
  private capKitMcp: CapKitMcp | null = null;
  private capKitRestful: CapKitRestful | null = null;
  private initializationPromise: Promise<CapKitMcp> | null = null;
  private isInitializing = false;

  private constructor() {}

  static getInstance(): CapKitService {
    if (!CapKitService.instance) {
      CapKitService.instance = new CapKitService();
    }
    return CapKitService.instance;
  }

  async getCapKitRestful(): Promise<CapKitRestful> {
    if (this.capKitRestful) {
      return this.capKitRestful;
    }
    this.capKitRestful = new CapKitRestful(`${capKitConfig.appUrl}/api`);
    return this.capKitRestful;
  }

  async getCapKit(): Promise<CapKitMcp> {
    // If already initialized, return the instance
    if (this.capKitMcp) {
      return this.capKitMcp;
    }

    // If currently initializing, wait for the existing initialization
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this.initializeCapKit();
    return this.initializationPromise;
  }

  private async initializeCapKit(): Promise<CapKitMcp> {
    try {
      this.isInitializing = true;

      const identityEnv = await NuwaIdentityKit().getIdentityEnv();

      this.capKitMcp = new CapKitMcp({
        mcpUrl: `${capKitConfig.appUrl}/mcp`,
        roochUrl: capKitConfig.roochUrl,
        contractAddress: capKitConfig.contractAddress,
        env: identityEnv,
      });

      return this.capKitMcp;
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
    this.capKitMcp?.mcpClose();
    this.capKitMcp = null;
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
    return this.capKitMcp !== null;
  }
}

// Export singleton instance
export const capKitService = CapKitService.getInstance();

// Export convenience function for getting CapKit
export const getCapKit = () => capKitService.getCapKit();
