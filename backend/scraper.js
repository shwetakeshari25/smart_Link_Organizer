import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

// Helper to detect platform based on URL
export function detectPlatform(urlString) {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();
    
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
    if (host.includes('instagram.com')) return 'Instagram';
    if (host.includes('linkedin.com')) return 'LinkedIn';
    if (host.includes('github.com')) return 'GitHub';
    if (host.includes('twitter.com') || host.includes('x.com')) return 'Twitter/X';
    if (host.includes('facebook.com') || host.includes('fb.com')) return 'Facebook';
    if (host.includes('reddit.com')) return 'Reddit';
    if (host.includes('medium.com')) return 'Medium';
    if (host.includes('dev.to')) return 'Dev.to';
    
    // Check if it looks like a personal blog/portfolio or general site
    if (host.startsWith('www.fit') || host.includes('portfolio') || host.includes('blog') || host.includes('personal')) {
      return 'Personal Website';
    }
    
    return 'Other';
  } catch (error) {
    return 'Other';
  }
}

// Generate beautiful placeholder thumbnails based on platform / category
function getPlaceholderThumbnail(platform, domain) {
  const gradients = {
    'YouTube': 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
    'Instagram': 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)',
    'LinkedIn': 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)',
    'GitHub': 'linear-gradient(135deg, #24292E 0%, #444D56 100%)',
    'Twitter/X': 'linear-gradient(135deg, #1DA1F2 0%, #0F1419 100%)',
    'Facebook': 'linear-gradient(135deg, #1877F2 0%, #0F51A4 100%)',
    'Reddit': 'linear-gradient(135deg, #FF4500 0%, #FF5700 100%)',
    'Medium': 'linear-gradient(135deg, #000000 0%, #292929 100%)',
    'Dev.to': 'linear-gradient(135deg, #0A0A0A 0%, #3B3B3B 100%)',
    'Personal Website': 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
    'Other': 'linear-gradient(135deg, #2563EB 0%, #8B5CF6 100%)'
  };

  const gradient = gradients[platform] || gradients['Other'];
  
  // Return an SVG data URL for a gorgeous modern placeholder
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${gradient.match(/#[0-9A-Fa-f]{6}/g)?.[0] || '#2563EB'}"/>
        <stop offset="100%" stop-color="${gradient.match(/#[0-9A-Fa-f]{6}/g)?.[1] || '#8B5CF6'}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="400" cy="225" r="100" fill="white" fill-opacity="0.1" stroke="white" stroke-opacity="0.2" stroke-width="2"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="'Outfit', 'Inter', sans-serif" font-size="48" font-weight="bold" letter-spacing="2">${platform}</text>
    <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" fill="white" fill-opacity="0.7" font-family="'Inter', sans-serif" font-size="20">${domain}</text>
  </svg>`;
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function scrapeMetadata(url) {
  let domain = '';
  try {
    const parsedUrl = new URL(url);
    domain = parsedUrl.hostname.replace('www.', '');
  } catch (e) {
    domain = 'link';
  }

  const platform = detectPlatform(url);
  const fallbackFavicon = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;

  // Special scraper for YouTube using oEmbed (bypasses any user-agent blocking)
  if (platform === 'YouTube') {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await axios.get(oembedUrl, { timeout: 4000 });
      if (response.data) {
        return {
          url,
          title: response.data.title || 'YouTube Video',
          description: `Video by ${response.data.author_name || 'YouTube Creator'}.`,
          thumbnail: response.data.thumbnail_url || getPlaceholderThumbnail(platform, domain),
          favicon: 'https://www.youtube.com/favicon.ico',
          domain,
          platform
        };
      }
    } catch (error) {
      console.warn('YouTube oEmbed lookup failed, falling back to scrapers', error.message);
    }
  }

  // GitHub Special API Scraper
  if (platform === 'GitHub') {
    try {
      const parts = url.split('github.com/');
      if (parts.length > 1) {
        const pathParts = parts[1].split('/');
        if (pathParts.length >= 2) {
          const owner = pathParts[0];
          const repo = pathParts[1].split('?')[0].split('#')[0];
          const githubApi = `https://api.github.com/repos/${owner}/${repo}`;
          const response = await axios.get(githubApi, {
            timeout: 3000,
            headers: { 'User-Agent': 'SmartLinkOrganizer' }
          });
          if (response.data) {
            return {
              url,
              title: response.data.full_name || response.data.name,
              description: response.data.description || 'GitHub repository',
              thumbnail: response.data.owner?.avatar_url || getPlaceholderThumbnail(platform, domain),
              favicon: 'https://github.githubassets.com/favicons/favicon.svg',
              domain,
              platform
            };
          }
        }
      }
    } catch (e) {
      console.warn('GitHub API lookup failed, falling back to scraper', e.message);
    }
  }

  // Default Scraper using Cheerio
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract Open Graph / HTML Metadata
    const title = 
      $('meta[property="og:title"]').attr('content') || 
      $('meta[name="twitter:title"]').attr('content') || 
      $('title').text() || 
      domain;

    const description = 
      $('meta[property="og:description"]').attr('content') || 
      $('meta[name="twitter:description"]').attr('content') || 
      $('meta[name="description"]').attr('content') || 
      'No description available.';

    let thumbnail = 
      $('meta[property="og:image"]').attr('content') || 
      $('meta[name="twitter:image"]').attr('content') || 
      '';

    // Handle relative thumbnail URLs
    if (thumbnail && thumbnail.startsWith('/')) {
      const parsedUrl = new URL(url);
      thumbnail = `${parsedUrl.protocol}//${parsedUrl.host}${thumbnail}`;
    }

    let favicon = 
      $('link[rel="apple-touch-icon"]').attr('href') ||
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      '';

    if (favicon && favicon.startsWith('/')) {
      const parsedUrl = new URL(url);
      favicon = `${parsedUrl.protocol}//${parsedUrl.host}${favicon}`;
    }

    return {
      url,
      title: title.trim().substring(0, 100) || domain,
      description: description.trim().substring(0, 200),
      thumbnail: thumbnail || getPlaceholderThumbnail(platform, domain),
      favicon: favicon || fallbackFavicon,
      domain,
      platform
    };
  } catch (error) {
    console.error(`Metadata scraping failed for ${url}: ${error.message}`);
    // Graceful fallback response
    return {
      url,
      title: domain.charAt(0).toUpperCase() + domain.slice(1) || 'Saved Web Link',
      description: 'Web Link. Saved to organizer. No description was scraped.',
      thumbnail: getPlaceholderThumbnail(platform, domain),
      favicon: fallbackFavicon,
      domain,
      platform
    };
  }
}
