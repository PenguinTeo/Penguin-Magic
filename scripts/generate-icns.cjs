const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [16, 32, 64, 128, 256, 512, 1024];
const SCALE_FACTOR = 0.8; // 80% of the canvas

const projectRoot = path.join(__dirname, '..');
const resourcesDir = path.join(projectRoot, 'resources');
const iconsetDir = path.join(projectRoot, 'temp_icon.iconset');
const sourceIcon = path.join(resourcesDir, 'icon.png');
const outputIcns = path.join(resourcesDir, 'icon.icns');

// Ensure iconset directory exists
if (!fs.existsSync(iconsetDir)) {
  fs.mkdirSync(iconsetDir, { recursive: true });
}

console.log('Generating icon with 80% size...');

// For each size, create icon at 80% scale (centered)
// First create a base scaled image
const baseSize = 1024;
const scaledSize = Math.round(baseSize * SCALE_FACTOR); // 819 pixels
const tempScaled = path.join(iconsetDir, 'temp_scaled.png');
const tempBase = path.join(iconsetDir, 'temp_base.png');

// Scale the icon to 80%
execSync(`sips -z ${scaledSize} ${scaledSize} "${sourceIcon}" --out "${tempScaled}"`, { stdio: 'inherit' });

// Create a transparent base canvas and composite the scaled icon centered
// Since sips can't do compositing easily, we'll use a different approach:
// We'll pad the scaled image to create the centered effect

const padding = Math.round((baseSize - scaledSize) / 2); // ~102 pixels on each side

// Use sips to pad the image (add transparent border)
execSync(`sips -p ${baseSize} ${baseSize} "${tempScaled}" --out "${tempBase}"`, { stdio: 'inherit' });

console.log('Creating iconset...');

// Generate all required sizes for iconset
for (const size of ICON_SIZES) {
  const filename1x = `icon_${size}x${size}.png`;
  const filename2x = `icon_${size}x${size}@2x.png`;
  
  // 1x version
  execSync(`sips -z ${size} ${size} "${tempBase}" --out "${path.join(iconsetDir, filename1x)}"`, { stdio: 'inherit' });
  
  // 2x version (only for sizes up to 512)
  if (size <= 512) {
    const size2x = size * 2;
    execSync(`sips -z ${size2x} ${size2x} "${tempBase}" --out "${path.join(iconsetDir, filename2x)}"`, { stdio: 'inherit' });
  }
}

// Clean up temp files
fs.unlinkSync(tempScaled);
fs.unlinkSync(tempBase);

console.log('Converting to icns...');

// Convert iconset to icns
execSync(`iconutil -c icns "${iconsetDir}" -o "${outputIcns}"`, { stdio: 'inherit' });

// Clean up iconset directory
fs.rmSync(iconsetDir, { recursive: true, force: true });

console.log(`Successfully created ${outputIcns}`);
