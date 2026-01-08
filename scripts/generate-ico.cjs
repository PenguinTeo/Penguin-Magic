const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// 读取源PNG
const srcPath = path.join(__dirname, '../resources/icon.png');
const dstPath = path.join(__dirname, '../resources/icon.ico');
const srcPng = PNG.sync.read(fs.readFileSync(srcPath));

console.log('源图片尺寸:', srcPng.width, 'x', srcPng.height);

// 简单的最近邻缩放
function resizePNG(src, newWidth, newHeight) {
  const dst = new PNG({ width: newWidth, height: newHeight });
  const xRatio = src.width / newWidth;
  const yRatio = src.height / newHeight;
  
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIdx = (srcY * src.width + srcX) * 4;
      const dstIdx = (y * newWidth + x) * 4;
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }
  return dst;
}

// 将PNG转换为ICO格式的BMP数据
function pngToBmpData(png) {
  const width = png.width;
  const height = png.height;
  
  // BMP数据：BGRA格式，从下到上存储
  const bmpData = Buffer.alloc(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = ((height - 1 - y) * width + x) * 4;
      // RGBA -> BGRA
      bmpData[dstIdx] = png.data[srcIdx + 2];     // B
      bmpData[dstIdx + 1] = png.data[srcIdx + 1]; // G
      bmpData[dstIdx + 2] = png.data[srcIdx];     // R
      bmpData[dstIdx + 3] = png.data[srcIdx + 3]; // A
    }
  }
  
  return bmpData;
}

// 创建ICO文件
function createICO(pngImages) {
  const numImages = pngImages.length;
  
  // 计算每个图像的数据
  const imageData = pngImages.map(png => {
    const bmpData = pngToBmpData(png);
    const width = png.width;
    const height = png.height;
    
    // BITMAPINFOHEADER (40 bytes)
    const header = Buffer.alloc(40);
    header.writeUInt32LE(40, 0);        // biSize
    header.writeInt32LE(width, 4);      // biWidth
    header.writeInt32LE(height * 2, 8); // biHeight (包含mask，所以*2)
    header.writeUInt16LE(1, 12);        // biPlanes
    header.writeUInt16LE(32, 14);       // biBitCount
    header.writeUInt32LE(0, 16);        // biCompression
    header.writeUInt32LE(bmpData.length, 20); // biSizeImage
    
    // AND mask (1 bit per pixel, all 0 = fully visible)
    const maskRowBytes = Math.ceil(width / 32) * 4;
    const mask = Buffer.alloc(maskRowBytes * height, 0);
    
    return {
      width,
      height,
      header,
      bmpData,
      mask,
      totalSize: header.length + bmpData.length + mask.length
    };
  });
  
  // ICO Header (6 bytes)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);        // Reserved
  icoHeader.writeUInt16LE(1, 2);        // Type (1 = ICO)
  icoHeader.writeUInt16LE(numImages, 4); // Number of images
  
  // ICONDIRENTRY for each image (16 bytes each)
  let dataOffset = 6 + numImages * 16;
  const dirEntries = imageData.map(img => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);  // Width
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1); // Height
    entry.writeUInt8(0, 2);  // Color palette
    entry.writeUInt8(0, 3);  // Reserved
    entry.writeUInt16LE(1, 4);  // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.totalSize, 8); // Size
    entry.writeUInt32LE(dataOffset, 12);   // Offset
    dataOffset += img.totalSize;
    return entry;
  });
  
  // 合并所有数据
  const parts = [icoHeader, ...dirEntries];
  imageData.forEach(img => {
    parts.push(img.header, img.bmpData, img.mask);
  });
  
  return Buffer.concat(parts);
}

// 生成多尺寸图标
const sizes = [16, 32, 48, 256];
const pngImages = sizes.map(size => {
  console.log('生成', size, 'x', size);
  return resizePNG(srcPng, size, size);
});

const icoBuffer = createICO(pngImages);
fs.writeFileSync(dstPath, icoBuffer);
console.log('ICO文件已生成:', dstPath);
console.log('文件大小:', icoBuffer.length, '字节');
