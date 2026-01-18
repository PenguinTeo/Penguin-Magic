/**
 * 图片URL处理工具函数
 * 用于统一处理各种格式的图片URL
 */

/**
 * 统一处理 imageUrl，兼容多种格式：
 * 1. 文件路径格式: /files/output/xxx.jpg
 * 2. 创意库文件路径: /files/creative_images/xxx.jpg
 * 3. 纯 base64 数据格式: /9j/4AAQ... (需要添加 data:image 前缀)
 * 4. 完整 data URL 格式: data:image/jpeg;base64,... (直接返回)
 * 5. HTTP/HTTPS URL: 直接返回
 */
export const normalizeImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  
  // 已经是完整的 data URL
  if (url.startsWith('data:')) return url;
  
  // 文件路径（以 / 开头，但不是 base64）
  if (url.startsWith('/') && !url.startsWith('/9j/') && !url.startsWith('/+')) return url;
  
  // HTTP/HTTPS URL
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // 纯 base64 数据，需要添加前缀
  // 检测常见的 base64 图片签名
  if (url.startsWith('/9j/') || url.startsWith('iVBOR')) {
    // JPEG 或 PNG
    const mimeType = url.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    return `data:${mimeType};base64,${url}`;
  }
  
  // 其他情况，假定是路径
  return url;
};

/**
 * 将 base64 数据转换为 Blob
 */
export const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * 从 data URL 中提取 base64 数据
 */
export const extractBase64FromDataUrl = (dataUrl: string): string => {
  const matches = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  return matches ? matches[1] : dataUrl;
};

/**
 * 获取图片的 MIME 类型
 */
export const getImageMimeType = (url: string): string => {
  if (url.startsWith('data:image/')) {
    const match = url.match(/^data:image\/(\w+);/);
    return match ? `image/${match[1]}` : 'image/png';
  }
  
  const ext = url.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/png';
  }
};

// 🔧 视频文件返回占位图，不尝试加载
const VIDEO_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMSI+PHBvbHlnb24gcG9pbnRzPSIyMyA3IDEyIDEyIDIzIDE3IDIzIDciLz48cmVjdCB4PSIxIiB5PSI1IiB3aWR0aD0iMTUiIGhlaWdodD0iMTQiIHJ4PSIyIiByeT0iMiIvPjwvc3ZnPg==';

/**
 * 获取缩略图URL
 * 将原图URL转换为缩略图URL
 * 支持的路径格式: /files/output/xxx.png, /files/input/xxx.jpg, /files/creative_images/xxx.png
 * 🔧 视频文件返回占位图，不尝试加载
 * @param originalUrl - 原图URL
 * @returns 缩略图URL，如果不支持则返回原图URL
 */
export const getThumbnailUrl = (originalUrl: string | undefined | null): string => {
  if (!originalUrl) return '';
  
  // 🔧 视频文件返回占位图，不要尝试加载
  if (originalUrl.includes('.mp4') || originalUrl.includes('.webm')) {
    return VIDEO_PLACEHOLDER;
  }
  
  // 只处理本地文件路径
  if (!originalUrl.startsWith('/files/')) {
    return originalUrl;
  }
  
  // 🔧 已经是缩略图目录，直接返回
  if (originalUrl.startsWith('/files/thumbnails/')) {
    return originalUrl;
  }
  
  // 解析路径: /files/output/filename.png
  const parts = originalUrl.split('/');
  if (parts.length < 4) return originalUrl;
  
  const dirName = parts[2]; // output, input, creative_images, creative
  const filename = parts[3];
  
  // 获取不带扩展名的文件名
  const lastDotIndex = filename.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  
  // 统一目录名称 (creative -> creative_images)
  const normalizedDirName = dirName === 'creative' ? 'creative_images' : dirName;
  
  return `/files/thumbnails/${normalizedDirName}_${nameWithoutExt}_thumb.jpg`;
};

/**
 * 压缩图片，将最长边限制为指定尺寸
 * @param imageUrl - 图片URL (支持 data URL, http URL, 文件路径)
 * @param maxSize - 最长边的最大尺寸，默认512px
 * @returns 压缩后的 base64 data URL
 */
export const compressImage = (imageUrl: string, maxSize: number = 512): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const { width, height } = img;
      
      // 如果图片已经小于 maxSize，直接返回原图
      if (width <= maxSize && height <= maxSize) {
        // 仍然通过 canvas 转换确保格式统一
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
        return;
      }
      
      // 计算新尺寸，保持宽高比
      let newWidth: number;
      let newHeight: number;
      
      if (width > height) {
        // 横向图片，宽度为最长边
        newWidth = maxSize;
        newHeight = Math.round((height / width) * maxSize);
      } else {
        // 纵向图片，高度为最长边
        newHeight = maxSize;
        newWidth = Math.round((width / height) * maxSize);
      }
      
      // 创建 canvas 进行缩放
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d')!;
      
      // 高质量缩放
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // 输出为 JPEG，质量 0.85 (平衡质量和大小)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      console.log(`[图片压缩] ${width}x${height} -> ${newWidth}x${newHeight}`);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('加载图片失败'));
    };
    
    // 处理不同格式的 URL
    img.src = normalizeImageUrl(imageUrl);
  });
};

/**
 * 提取错误代码
 * 从错误信息中提取 HTTP 状态码或错误代码
 */
export const extractErrorCode = (errorStr: string | undefined | null): string | null => {
  if (!errorStr) return null;
  
  // 匹配 "API 请求失败 (422):" 或 "(500)" 等格式
  const codeMatch = errorStr.match(/\((\d{3})\)/);
  if (codeMatch) {
    return codeMatch[1];
  }
  
  // 匹配 "status": 422 或 "code": 500 等 JSON 格式
  const jsonCodeMatch = errorStr.match(/["'](?:status|code)["']\s*:\s*(\d{3})/);
  if (jsonCodeMatch) {
    return jsonCodeMatch[1];
  }
  
  return null;
};

/**
 * 解析错误信息，提取核心错误描述
 * 支持多种错误格式：
 * 1. API 请求失败 (422): {"error":{"message":"..."}}
 * 2. 纯 JSON 格式: {"message":"..."}
 * 3. 普通文本错误信息
 */
export const parseErrorMessage = (errorStr: string | undefined | null): string => {
  if (!errorStr) return '未知错误';
  
  // 尝试提取 JSON 部分
  const jsonMatch = errorStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const jsonData = JSON.parse(jsonMatch[0]);
      // 尝试从常见结构中提取 message
      const message = 
        jsonData?.error?.message || 
        jsonData?.message || 
        (typeof jsonData?.error === 'string' ? jsonData.error : null);
      
      if (message && typeof message === 'string') {
        return message;
      }
    } catch {
      // JSON 解析失败，继续处理
    }
  }
  
  // 尝试提取 "API 请求失败 (xxx):" 后面的内容
  const apiErrorMatch = errorStr.match(/API\s*请求失败.*?:\s*(.+)/);
  if (apiErrorMatch && apiErrorMatch[1]) {
    // 递归解析后面的内容
    return parseErrorMessage(apiErrorMatch[1]);
  }
  
  // 如果错误信息太长，截取第一句
  if (errorStr.length > 150) {
    // 尝试找到第一个句号或句点
    const firstSentence = errorStr.match(/^[^.!?！？。]*[.!?！？。]/);
    if (firstSentence) {
      return firstSentence[0];
    }
    // 否则截取前150个字符
    return errorStr.slice(0, 150) + '...';
  }
  
  return errorStr;
};
