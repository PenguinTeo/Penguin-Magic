const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const config = require('../config');

/**
 * 缩略图生成工具
 * 使用 sharp 库生成高质量缩略图
 */
class ThumbnailGenerator {
  /**
   * 生成缩略图
   * @param {string} sourcePath - 原图路径
   * @param {string} sourceDir - 原图所在目录名称（output/input/creative_images）
   * @returns {Promise<{success: boolean, thumbnailUrl?: string, error?: string}>}
   */
  static async generate(sourcePath, sourceDir) {
    try {
      // 确保缩略图目录存在
      if (!fs.existsSync(config.THUMBNAILS_DIR)) {
        fs.mkdirSync(config.THUMBNAILS_DIR, { recursive: true });
      }

      // 获取文件名和扩展名
      const filename = path.basename(sourcePath);
      const nameWithoutExt = path.parse(filename).name;
      
      // 缩略图使用 jpg 格式（压缩率更高）
      const thumbnailFilename = `${sourceDir}_${nameWithoutExt}_thumb.jpg`;
      const thumbnailPath = path.join(config.THUMBNAILS_DIR, thumbnailFilename);

      // 使用 sharp 生成缩略图
      await sharp(sourcePath)
        .resize(config.THUMBNAIL_SIZE, config.THUMBNAIL_SIZE, {
          fit: 'cover',      // 裁剪以填满
          position: 'center' // 中心裁剪
        })
        .jpeg({ 
          quality: config.THUMBNAIL_QUALITY,
          progressive: true  // 渐进式加载
        })
        .toFile(thumbnailPath);

      console.log(`✓ 缩略图已生成: ${thumbnailFilename}`);

      return {
        success: true,
        thumbnailUrl: `/files/thumbnails/${thumbnailFilename}`,
        thumbnailPath: thumbnailPath
      };
    } catch (error) {
      console.error('生成缩略图失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量生成缩略图（用于历史数据迁移）
   * @param {string} sourceDir - 源目录路径
   * @param {string} dirName - 目录名称
   */
  static async generateBatch(sourceDir, dirName) {
    try {
      if (!fs.existsSync(sourceDir)) {
        console.log(`目录不存在: ${sourceDir}`);
        return { success: false, count: 0 };
      }

      const files = fs.readdirSync(sourceDir);
      const imageFiles = files.filter(f => 
        /\.(png|jpg|jpeg|webp|gif)$/i.test(f)
      );

      let successCount = 0;
      let skipCount = 0;

      for (const filename of imageFiles) {
        const sourcePath = path.join(sourceDir, filename);
        const nameWithoutExt = path.parse(filename).name;
        const thumbnailFilename = `${dirName}_${nameWithoutExt}_thumb.jpg`;
        const thumbnailPath = path.join(config.THUMBNAILS_DIR, thumbnailFilename);

        // 跳过已存在的缩略图
        if (fs.existsSync(thumbnailPath)) {
          skipCount++;
          continue;
        }

        const result = await this.generate(sourcePath, dirName);
        if (result.success) {
          successCount++;
        }
      }

      console.log(`批量生成完成: ${successCount} 成功, ${skipCount} 跳过`);
      return { success: true, count: successCount, skipped: skipCount };
    } catch (error) {
      console.error('批量生成缩略图失败:', error.message);
      return { success: false, count: 0, error: error.message };
    }
  }

  /**
   * 删除缩略图
   * @param {string} originalFilename - 原图文件名
   * @param {string} sourceDir - 原图目录名称
   */
  static delete(originalFilename, sourceDir) {
    try {
      const nameWithoutExt = path.parse(originalFilename).name;
      const thumbnailFilename = `${sourceDir}_${nameWithoutExt}_thumb.jpg`;
      const thumbnailPath = path.join(config.THUMBNAILS_DIR, thumbnailFilename);

      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
        console.log(`✓ 缩略图已删除: ${thumbnailFilename}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除缩略图失败:', error.message);
      return false;
    }
  }

  /**
   * 获取缩略图URL
   * @param {string} originalUrl - 原图URL (如 /files/output/xxx.png)
   * @returns {string} 缩略图URL
   */
  static getThumbnailUrl(originalUrl) {
    if (!originalUrl || !originalUrl.startsWith('/files/')) {
      return originalUrl;
    }

    // 解析原图路径: /files/output/filename.png
    const parts = originalUrl.split('/');
    if (parts.length < 4) return originalUrl;

    const dirName = parts[2]; // output, input, creative_images
    const filename = parts[3];
    const nameWithoutExt = path.parse(filename).name;

    return `/files/thumbnails/${dirName}_${nameWithoutExt}_thumb.jpg`;
  }
}

module.exports = ThumbnailGenerator;

