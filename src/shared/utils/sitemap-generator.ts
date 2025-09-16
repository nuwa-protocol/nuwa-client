export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemap(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => {
    return `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

export function generateBasicSitemap(baseUrl: string): string {
  const staticUrls: SitemapUrl[] = [
    {
      loc: baseUrl,
      changefreq: 'daily',
      priority: 1.0,
      lastmod: new Date().toISOString().split('T')[0],
    },
    {
      loc: `${baseUrl}/cap-store`,
      changefreq: 'hourly',
      priority: 0.9,
      lastmod: new Date().toISOString().split('T')[0],
    },
    {
      loc: `${baseUrl}/cap-studio`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date().toISOString().split('T')[0],
    },
    {
      loc: `${baseUrl}/chat`,
      changefreq: 'daily',
      priority: 0.8,
      lastmod: new Date().toISOString().split('T')[0],
    },
  ];

  return generateSitemap(staticUrls);
}

// Function to generate sitemap with cap pages
export function generateCapSitemap(
  baseUrl: string, 
  caps: Array<{
    idName: string;
    submittedAt?: number;
  }>
): string {
  const capUrls: SitemapUrl[] = caps.map(cap => ({
    loc: `${baseUrl}/cap-store/${cap.idName}`,
    changefreq: 'weekly',
    priority: 0.7,
    lastmod: cap.submittedAt 
      ? new Date(cap.submittedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  }));

  const staticUrls = generateBasicSitemap(baseUrl);
  const allUrls = [
    ...JSON.parse(staticUrls.replace(/[\s\S]*<urlset[^>]*>([\s\S]*)<\/urlset>[\s\S]*/, '$1'))
      .split('</url>')
      .filter((url: string) => url.trim())
      .map((url: string) => {
        const loc = url.match(/<loc>(.*?)<\/loc>/)?.[1] || '';
        const lastmod = url.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
        const changefreq = url.match(/<changefreq>(.*?)<\/changefreq>/)?.[1] as any;
        const priority = url.match(/<priority>(.*?)<\/priority>/)?.[1];
        
        return {
          loc,
          lastmod,
          changefreq,
          priority: priority ? parseFloat(priority) : undefined,
        };
      }),
    ...capUrls,
  ];

  return generateSitemap(allUrls);
}
