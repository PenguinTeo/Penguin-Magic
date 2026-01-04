const fs = require('fs');
const path = require('path');

// 创建一个简单的 SVG 图标
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad1)"/>
  <text x="256" y="340" font-family="Arial" font-size="320" font-weight="bold" fill="white" text-anchor="middle">P</text>
  <circle cx="380" cy="150" r="20" fill="white" opacity="0.8"/>
  <circle cx="420" cy="200" r="15" fill="white" opacity="0.6"/>
  <circle cx="360" cy="220" r="12" fill="white" opacity="0.7"/>
</svg>`;

const resourcesDir = path.join(__dirname, '..', 'resources');
const electronDir = path.join(__dirname);

fs.mkdirSync(resourcesDir, { recursive: true });
fs.writeFileSync(path.join(resourcesDir, 'icon.svg'), svgIcon);
fs.writeFileSync(path.join(electronDir, 'icon.svg'), svgIcon);

console.log('✓ 已创建 resources/icon.svg');
console.log('✓ 已创建 electron/icon.svg');
console.log('\n提示: 建议使用在线工具将 SVG 转换为 PNG 格式');
