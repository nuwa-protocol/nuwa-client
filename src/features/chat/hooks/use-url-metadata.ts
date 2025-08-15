import { createAuthorizedFetch } from '@/shared/services/authorized-fetch';

export const useUrlMetadata = () => {
  const getUrlMetadata = async (urls: string[]) => {
    try {
      const authorizedFetch = createAuthorizedFetch();
      const response = await authorizedFetch(
        'https://docs.nuwa.dev/api/url-metadata',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ urls: urls }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.error('Error fetching URL metadata:', error);
      throw error;
    }
  };

  return { getUrlMetadata };
};
