const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Simple SVG icon with "eW" text
const generateSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#2563eb"/>
  <text 
    x="50%" 
    y="55%" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.4}px" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="middle"
  >eW</text>
</svg>
`.trim();

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons (can be converted to PNG later)
sizes.forEach(size => {
  const svg = generateSVG(size);
  const filename = `icon-${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Generated ${filename}`);
});

// Also create a simple favicon
const favicon = generateSVG(32);
fs.writeFileSync(path.join(__dirname, '../public/favicon.svg'), favicon);
console.log('Generated favicon.svg');

console.log('\\nNote: For production, convert SVGs to PNGs using:');
console.log('npx sharp-cli --input public/icons/*.svg --output public/icons/ --format png');
