OUT OFFICE | Source and ready-to-host files
Latest published source: 088a7a2c2c18c320951f6f9a136c5f9fa0a98a8e

All game files are at the root of this ZIP. No build step is needed.

HOSTING
1. Extract this ZIP.
2. Upload index.html and all other game files together to your web root.
3. Use HTTPS for mobile tilt controls and orientation features.
GitHub Pages: upload these files to the root of your repository and configure
Pages to deploy from that branch/root directory.

LOCAL PREVIEW
Run python3 -m http.server 8000 in the extracted folder, then open
http://localhost:8000 . Do not launch index.html using a file:// URL because
the game uses JavaScript modules.

CUSTOM DOMAIN SEO
Update the canonical URL, Open Graph URL and structured-data URL in index.html,
plus sitemap.xml and the sitemap address in robots.txt, to your final domain.
Google Fonts requires an internet connection; fallback fonts are included in CSS.
Three.js is bundled locally and its license is in THREE-LICENSE.txt.

PROGRESS
Progress is stored in each browser's localStorage. Moving to a different domain
starts a separate save; this ZIP does not contain your personal player progress.

Includes Motor Park, Speedway racing, daily challenges, coin shop and spin wheel,
mobile landscape guard, and the latest compact mobile health HUD.
