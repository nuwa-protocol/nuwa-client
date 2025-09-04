import type { UseIdentityKitOptions } from '@nuwa-ai/identity-kit-web';

const domain = 'http://test-id.nuwa.dev';

export const cadopConfig: UseIdentityKitOptions = {
  appName: 'Nuwa Assistant',
  cadopDomain:
    typeof window !== 'undefined'
      ? (localStorage.getItem('cadop-domain') ?? domain)
      : domain,
  storage: 'local' as const,
  autoConnect: false,
};
