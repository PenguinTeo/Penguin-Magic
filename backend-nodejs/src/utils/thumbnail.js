// Sharp 模块在打包后无法使用，暂时禁用缩略图功能
// 后续可以考虑使用其他方案（如 jimp）或在运行时动态加载

const path = require('path');
const fs = require('fs');
const config = require('../config');

// 缩略图功能暂时禁用
const sharpAvailable = false;

console.log('⚠ 缩略图功能暂时禁用（Sharp 模块不可用）');

/**
 * 缩略图生成工具
 * 当前版本：缩略图功能已禁用
 */
class ThumbnailGenerator {
  /**
   * 检查 sharp 是否可用
   */
  static isAvailable() {
    return sharpAvailable;
  }

  /**
   * 生成缩略图（当前禁用）
   */
  static async generate(sourcePath, sourceDir) {
    return {
      success: false,
      error: 'Thumbnail generation disabled',
      thumbnailUrl: null
    };
  }

  /**
   * 批量生成缩略图（当前禁用）
   */
  static async generateBatch(sourceDir, dirName) {
    return { success: false, count: 0, error: 'Thumbnail generation disabled' };
  }

  /**
   * 删除缩略图
   */
  static delete(originalFilename, sourceDir) {
    try {
      const nameWithoutExt = path.parse(originalFilename).name;
      const thumbnailFilename = `${sourceDir}_${nameWithoutExt}_thumb.jpg`;
      const thumbnailPath = path.join(config.THUMBNAILS_DIR, thumbnailFilename);

      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取缩略图URL（返回原图URL，因为缩略图功能禁用）
   */
  static getThumbnailUrl(originalUrl) {
    // 缩略图功能禁用，直接返回原图URL
    return originalUrl;
  }
}

module.exports = ThumbnailGenerator;
