# Nuwa AI - SEO Implementation Guide

## 🎯 Current SEO Implementation

### ✅ Completed Optimizations

#### 1. Dynamic Meta Tags
- **Location**: `src/shared/hooks/use-seo.ts`
- **Features**: Dynamically sets title, description, keywords for each page
- **Usage**:
```tsx
import { useSEO } from '@/shared/hooks/use-seo';

// Use in components
useSEO({
  title: 'Cap Store - Discover AI Caps | Nuwa AI',
  description: 'Discover and download AI Caps...',
  keywords: ['ai caps', 'nuwa ai', 'crypto ai'],
  url: `${window.location.origin}/cap-store`,
  type: 'website',
});
```

#### 2. Structured Data (JSON-LD)
- **Location**: `src/shared/components/structured-data.tsx`
- **Features**: Provides structured information for search engines
- **Supported Schema Types**:
  - `SoftwareApplication` - Cap detail pages
  - `WebSite` - Website information
  - `Organization` - Organization information
  - `BreadcrumbList` - Breadcrumb navigation

#### 3. Open Graph & Twitter Cards
- **Auto-generated**: Automatically generated via `useSEO` hook
- **Supported Fields**: title, description, image, url, type

#### 4. Cap Detail Page SEO Optimization
- **Location**: `src/features/cap-store/components/cap-details.tsx`
- **Features**: 
  - Dynamically generates cap-related meta tags
  - Includes download counts, ratings, and other statistics
  - Generates software application structured data

#### 5. robots.txt
- **Location**: `public/robots.txt`
- **Features**: Guides search engine crawler behavior

#### 6. Sitemap Generator
- **Location**: `src/shared/utils/sitemap-generator.ts`
- **Features**: Generates XML sitemap (requires server-side integration)

## 🚀 Next Step: Static Pre-rendering Implementation

### Static Generation with Vite Pre-rendering

Pre-rendering generates static HTML files at build time, providing SEO benefits while maintaining the SPA architecture.

#### Implementation Plan:

1. **Install Pre-rendering Plugin**:
```bash
npm install vite-plugin-prerender-spa
```

2. **Configure Vite Pre-rendering**:
```ts
// vite.config.ts
import { defineConfig } from 'vite';
import prerenderSPA from 'vite-plugin-prerender-spa';

export default defineConfig({
  plugins: [
    react(),
    prerenderSPA({
      staticDir: path.join(__dirname, 'dist'),
      routes: [
        '/',
        '/cap-store',
        '/cap-studio',
        '/chat',
        '/settings',
        // Cap detail pages will be generated dynamically
      ],
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        headless: true,
        renderAfterDocumentEvent: 'render-event'
      }
    })
  ]
});
```

3. **Dynamic Route Generation**:
```ts
// scripts/generate-routes.ts
import { generateCapSitemap } from './src/shared/utils/sitemap-generator';

async function generatePreRenderRoutes() {
  const caps = await fetchAllCaps(); // Fetch cap data
  
  const capRoutes = caps.map(cap => `/cap-store/${cap.idName}`);
  
  return [
    '/',
    '/cap-store',
    '/cap-studio',
    '/chat',
    ...capRoutes
  ];
}
```

4. **Build Script Enhancement**:
```json
// package.json
{
  "scripts": {
    "build": "npm run generate:routes && NODE_OPTIONS='--max-old-space-size=8192' tsc -b && NODE_OPTIONS='--max-old-space-size=8192' vite build",
    "generate:routes": "tsx scripts/generate-routes.ts"
  }
}
```

#### Benefits of Pre-rendering:
- ✅ SEO-friendly static HTML for all pages
- ✅ Fast initial page loads
- ✅ Maintains SPA functionality after hydration
- ✅ Compatible with current architecture
- ✅ Works with existing dynamic meta tags and structured data

## 📈 SEO Performance Monitoring

### Recommended Tools:
1. **Google Search Console** - Monitor search performance
2. **Google Analytics** - Track traffic sources
3. **Schema Markup Validator** - Validate structured data
4. **Lighthouse** - Performance and SEO scoring

### Key Metrics:
- Page loading speed (Core Web Vitals)
- Mobile-friendliness
- Structured data coverage
- Number of indexed pages
- Keyword rankings

## 🛠 Technical Implementation Details

### Recommended Cap Page URL Structure:
- **Current**: `/cap-store` (modal window shows details)
- **Recommended**: `/cap-store/[capId]` (dedicated pages)

### Meta Tag Optimization Templates:
```html
<!-- Cap Detail Page -->
<title>{capName} - AI Cap | Nuwa AI</title>
<meta name="description" content="{capDescription} - Downloads: {downloads}, Rating: {rating}/5" />

<!-- Cap Store -->
<title>Cap Store - Discover AI Caps | Nuwa AI</title>
<meta name="description" content="Discover and download AI Caps on Nuwa AI. Browse hundreds of AI capabilities powered by crypto." />
```

### Image SEO Optimization:
1. Add alt text for cap thumbnails
2. Use WebP format for improved loading speed
3. Implement lazy loading

### Pre-rendering Route Configuration:
```ts
// Additional routes for pre-rendering
const dynamicRoutes = [
  // Static pages
  '/',
  '/cap-store',
  '/cap-studio',
  '/chat',
  
  // Dynamic cap pages (generated from API)
  ...capRoutes.map(cap => `/cap-store/${cap.idName}`)
];
```

## 🌐 Future Internationalization SEO

### Multi-language Support:
```tsx
// hreflang tags example
<link rel="alternate" hreflang="en" href="https://nuwa.ai/en/cap-store" />
<link rel="alternate" hreflang="zh" href="https://nuwa.ai/zh/cap-store" />
```

## 📊 Implementation Status

### ✅ Completed:
- [x] Dynamic Meta Tags System
- [x] Structured Data Implementation
- [x] Cap Detail Page SEO Optimization
- [x] robots.txt Configuration
- [x] Sitemap Generator

### 📋 Next Steps (Pre-rendering Implementation):
- [ ] Install pre-rendering plugin
- [ ] Configure Vite pre-rendering
- [ ] Create dynamic route generation script
- [ ] Update build process
- [ ] Test pre-rendered pages
- [ ] Deploy and monitor

### 🔄 Future Enhancements:
- [ ] Performance optimization (image compression, lazy loading)
- [ ] Internal linking optimization
- [ ] Breadcrumb navigation
- [ ] Extended Schema markup
- [ ] Automatic sitemap updates

## 🚨 Important Notes

1. **Routing Structure**: Current modal window approach is not SEO-friendly; recommend switching to dedicated page routes
2. **Image Optimization**: Cap thumbnails need optimized alt text and loading performance
3. **Content Updates**: Regular updates to sitemap and structured data are needed
4. **Mobile Compatibility**: Ensure all SEO features work properly on mobile devices
5. **Pre-rendering Considerations**: Ensure all dynamic content is properly hydrated after pre-rendering

## 📚 Additional Resources

- [Google SEO Guide](https://developers.google.com/search/docs)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [React SEO Best Practices](https://nextjs.org/learn/seo/introduction-to-seo)
- [Vite Pre-rendering Guide](https://vitejs.dev/guide/static-deploy.html)
