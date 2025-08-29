const domain = 'http://test-id.nuwa.dev';

export const cadopConfig = {
  appName: 'Nuwa Assistant',
  cadopDomain:
    typeof window !== 'undefined'
      ? (localStorage.getItem('cadop-domain') ?? domain)
      : domain,
  storage: 'local' as const,
  autoConnect: false,
};
