const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 文件处理工具类
 * 负责图片保存、文件列表、文件删除等操作
 */
class FileHandler {
  /**
   * 保存base64图片到文件
   * @param {string} imageData - base64编码的图片数据
   * @param {string} targetDir - 目标目录
   * @param {string} filename - 文件名(可选)
   * @returns {object} 保存结果 {success, data: {filename, path, url}}
   */
  static saveImage(imageData, targetDir, filename = null) {
    try {
      // 确保目录存在
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // 解析图片格式
      let ext = '.png';
      let base64Data = imageData;
      
      if (imageData.startsWith('data:')) {
        const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const format = matches[1];
          base64Data = matches[2];
          
          if (format === 'jpeg' || format === 'jpg') {
            ext = '.jpg';
          } else if (format === 'png') {
            ext = '.png';
          } else if (format === 'webp') {
            ext = '.webp';
          } else if (format === 'gif') {
            ext = '.gif';
          }
        }
      }

      // 生成文件名
      if (!filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                         new Date().toTimeString().split(' ')[0].replace(/:/g, '');
        const randomStr = crypto.randomBytes(4).toString('hex');
        filename = `penguin_${timestamp}_${randomStr}${ext}`;
      }

      // 保存文件
      const filePath = path.join(targetDir, filename);
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);

      // 返回相对URL路径
      const dirName = path.basename(targetDir);
      return {
        success: true,
        data: {
          filename: filename,
          path: filePath,
          url: `/files/${dirName}/${filename}`
        }
      };
    } catch (error) {
      console.error('保存图片失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 列出目录中的文件
   * @param {string} directory - 目录路径
   * @param {array} extensions - 文件扩展名过滤(可选)
   * @returns {array} 文件列表
   */
  static listFiles(directory, extensions = null) {
    try {
      if (!fs.existsSync(directory)) {
        return [];
      }

      const files = fs.readdirSync(directory);
      const fileList = [];

      for (const filename of files) {
        const filePath = path.join(directory, filename);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
          // 检查文件扩展名
          if (extensions) {
            const ext = path.extname(filename).toLowerCase();
            if (!extensions.includes(ext)) {
              continue;
            }
          }

          fileList.push({
            name: filename,
            size: stats.size,
            created: stats.birthtimeMs,
            modified: stats.mtimeMs
          });
        }
      }

      // 按修改时间倒序排列
      fileList.sort((a, b) => b.modified - a.modified);
      return fileList;
    } catch (error) {
      console.error('列出文件失败:', error.message);
      return [];
    }
  }

  /**
   * 删除文件
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否删除成功
   */
  static deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除文件失败:', error.message);
      return false;
    }
  }

  /**
   * 确保目录存在
   * @param {string} dirPath - 目录路径
   */
  static ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✓ 目录就绪: ${dirPath}`);
    }
  }
}

module.exports = FileHandler;
