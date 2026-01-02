const path = require('path');
const os = require('os');

/**
 * 路径处理工具类
 * 负责获取系统路径、处理路径拼接等
 */
class PathHelper {
  /**
   * 获取用户桌面路径
   * @returns {string} 桌面路径
   */
  static getDesktopPath() {
    try {
      // Windows系统
      if (os.platform() === 'win32') {
        const userProfile = process.env.USERPROFILE;
        return path.join(userProfile, 'Desktop');
      }
      // macOS系统
      else if (os.platform() === 'darwin') {
        const home = os.homedir();
        return path.join(home, 'Desktop');
      }
      // Linux系统
      else {
        const home = os.homedir();
        return path.join(home, 'Desktop');
      }
    } catch (error) {
      console.error('获取桌面路径失败:', error.message);
      return path.join(os.homedir(), 'Desktop');
    }
  }

  /**
   * 安全拼接路径(防止路径遍历攻击)
   * @param {string} baseDir - 基础目录
   * @param {string} userPath - 用户提供的路径
   * @returns {string|null} 安全的完整路径,如果不安全则返回null
   */
  static safePath(baseDir, userPath) {
    const fullPath = path.resolve(baseDir, userPath);
    
    // 检查路径是否在基础目录内
    if (!fullPath.startsWith(path.resolve(baseDir))) {
      console.warn('检测到路径遍历攻击尝试:', userPath);
      return null;
    }
    
    return fullPath;
  }

  /**
   * 规范化路径(处理反斜杠等)
   * @param {string} filePath - 文件路径
   * @returns {string} 规范化后的路径
   */
  static normalize(filePath) {
    return path.normalize(filePath);
  }

  /**
   * 获取文件扩展名
   * @param {string} filename - 文件名
   * @returns {string} 扩展名(包含点号)
   */
  static getExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  /**
   * 检查是否为图片文件
   * @param {string} filename - 文件名
   * @returns {boolean} 是否为图片
   */
  static isImageFile(filename) {
    const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'];
    const ext = this.getExtension(filename);
    return imageExts.includes(ext);
  }
}

module.exports = PathHelper;
