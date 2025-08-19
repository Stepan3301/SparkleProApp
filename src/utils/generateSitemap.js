const fs = require('fs');
const path = require('path');

const generateSitemap = () => {
  const baseUrl = 'https://sparklepro.ae'; // Replace with your actual domain
  
  const staticRoutes = [
    '',
    '/home',
    '/services',
    '/auth'
  ];

  // Add dynamic service routes (you can fetch these from your database)
  const serviceRoutes = [
    '/services/regular-cleaning',
    '/services/deep-cleaning', 
    '/services/move-in-move-out',
    '/services/office-cleaning'
  ];

  const allRoutes = [...staticRoutes, ...serviceRoutes];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route === '' || route === '/home' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '' || route === '/home' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(__dirname, '../../public/sitemap.xml'), sitemap);
  console.log('Sitemap generated successfully!');
};

generateSitemap();