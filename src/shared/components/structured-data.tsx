import { useEffect } from 'react';

export interface StructuredDataProps {
  data: Record<string, any>;
  id?: string;
}

export function StructuredData({ data, id = 'structured-data' }: StructuredDataProps) {
  useEffect(() => {
    // Remove existing structured data script if it exists
    const existingScript = document.getElementById(id);
    if (existingScript) {
      existingScript.remove();
    }

    // Create new structured data script
    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    // Cleanup function to remove script when component unmounts
    return () => {
      const scriptToRemove = document.getElementById(id);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [data, id]);

  return null; // This component doesn't render anything
}

// Helper functions to generate structured data

export function generateSoftwareApplicationSchema(cap: {
  capData: {
    metadata: {
      displayName: string;
      description: string;
      tags: string[];
      thumbnail?: { type: 'file' | 'url'; file?: string; url?: string; } | null;
      submittedAt?: number;
      homepage?: string;
      repository?: string;
    };
    idName: string;
  };
  stats?: {
    downloads: number;
    favorites: number;
    averageRating: number;
    ratingCount: number;
  };
}) {
  const { capData, stats } = cap;
  const { metadata } = capData;
  
  // Extract thumbnail URL from the thumbnail object
  const thumbnailUrl = metadata.thumbnail?.type === 'url' 
    ? metadata.thumbnail.url 
    : metadata.thumbnail?.type === 'file' 
    ? metadata.thumbnail.file 
    : '/src/assets/og-image.png';

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: metadata.displayName,
    description: metadata.description,
    applicationCategory: 'AI Tools',
    operatingSystem: 'Web',
    url: `${window.location.origin}/cap-store/${capData.idName}`,
    image: thumbnailUrl || '/src/assets/og-image.png',
    publisher: {
      '@type': 'Organization',
      name: 'Nuwa AI',
      url: window.location.origin,
    },
    downloadUrl: `${window.location.origin}/cap-store/${capData.idName}`,
    installUrl: `${window.location.origin}/cap-store/${capData.idName}`,
    ...(metadata.homepage && { sameAs: metadata.homepage }),
    ...(metadata.repository && { codeRepository: metadata.repository }),
    ...(metadata.submittedAt && {
      datePublished: new Date(metadata.submittedAt).toISOString(),
    }),
    ...(stats && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: stats.averageRating,
        ratingCount: stats.ratingCount,
        bestRating: 5,
        worstRating: 1,
      },
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/DownloadAction',
          userInteractionCount: stats.downloads,
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: stats.favorites,
        },
      ],
    }),
    keywords: metadata.tags.join(', '),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Nuwa AI',
    description: 'Use All AIs with Crypto',
    url: window.location.origin,
    publisher: {
      '@type': 'Organization',
      name: 'Nuwa AI',
      url: window.location.origin,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${window.location.origin}/cap-store?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Nuwa AI',
    description: 'Use All AIs with Crypto',
    url: window.location.origin,
    logo: {
      '@type': 'ImageObject',
      url: `${window.location.origin}/src/assets/logo-app-brand.png`,
    },
    sameAs: [
      // Add your social media URLs here
    ],
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
