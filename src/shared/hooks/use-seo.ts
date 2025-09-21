import { useEffect } from 'react';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  canonicalUrl?: string;
}

const DEFAULT_SEO: SEOData = {
  title: 'Nuwa AI - Use All AIs with Crypto',
  description: 'Nuwa AI - Use All AIs with Crypto',
  image: '/src/assets/og-image.png',
  type: 'website',
  keywords: ['nuwa', 'ai', 'crypto', 'application'],
};

export function useSEO(seoData: Partial<SEOData> = {}) {
  useEffect(() => {
    const data = { ...DEFAULT_SEO, ...seoData };
    
    // Update document title
    if (data.title) {
      document.title = data.title;
    }
    
    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string, isProperty?: boolean) => {
      if (!content) return;
      
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };
    
    // Update basic meta tags
    updateMetaTag('description', data.description || '');
    updateMetaTag('keywords', data.keywords?.join(', ') || '');
    updateMetaTag('author', data.author || '');
    
    // Update Open Graph tags
    if (data.title) updateMetaTag('og:title', data.title, true);
    if (data.description) updateMetaTag('og:description', data.description, true);
    if (data.image) updateMetaTag('og:image', data.image, true);
    updateMetaTag('og:url', data.url || window.location.href, true);
    updateMetaTag('og:type', data.type || 'website', true);
    
    // Update Twitter Card tags
    if (data.title) updateMetaTag('twitter:title', data.title);
    if (data.description) updateMetaTag('twitter:description', data.description);
    if (data.image) updateMetaTag('twitter:image', data.image);
    updateMetaTag('twitter:card', 'summary_large_image');
    
    // Update article specific tags
    if (data.publishedTime) {
      updateMetaTag('article:published_time', data.publishedTime, true);
    }
    if (data.modifiedTime) {
      updateMetaTag('article:modified_time', data.modifiedTime, true);
    }
    if (data.tags) {
      // Remove existing article:tag meta tags
      document.querySelectorAll('meta[property="article:tag"]').forEach(tag => {
        tag.remove();
      });
      // Add new article:tag meta tags
      data.tags.forEach(tag => {
        updateMetaTag('article:tag', tag, true);
      });
    }
    
    // Update canonical URL
    if (data.canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', data.canonicalUrl);
    }
    
  }, [seoData]);
}

// Helper function to generate SEO data for Cap pages
export function generateCapSEO(cap: {
  capData: {
    metadata: {
      displayName: string;
      description: string;
      tags: string[];
      thumbnail?: { type: 'file' | 'url'; file?: string; url?: string; } | null;
      submittedAt?: number;
    };
    idName: string;
  };
  stats?: {
    downloads: number;
    favorites: number;
    averageRating: number;
    ratingCount: number;
  };
}): SEOData {
  const { capData, stats } = cap;
  const { metadata } = capData;
  
  const title = `${metadata.displayName} - AI Cap | Nuwa AI`;
  const description = `${metadata.description} - Download: ${stats?.downloads || 0}, Rating: ${stats?.averageRating || 0}/5 (${stats?.ratingCount || 0} reviews)`;
  
  // Extract thumbnail URL from the thumbnail object
  const thumbnailUrl = metadata.thumbnail?.type === 'url' 
    ? metadata.thumbnail.url 
    : metadata.thumbnail?.type === 'file' 
    ? metadata.thumbnail.file 
    : '/src/assets/og-image.png';
  
  return {
    title,
    description,
    keywords: ['nuwa ai', 'ai cap', 'crypto ai', ...metadata.tags],
    image: thumbnailUrl || '/src/assets/og-image.png',
    url: `${window.location.origin}/cap-store/${capData.idName}`,
    type: 'product',
    author: 'Nuwa AI',
    publishedTime: metadata.submittedAt ? new Date(metadata.submittedAt).toISOString() : undefined,
    tags: metadata.tags,
    canonicalUrl: `${window.location.origin}/cap-store/${capData.idName}`,
  };
}
