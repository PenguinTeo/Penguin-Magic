const fs = require('fs');
const path = require('path');

/**
 * JSON数据存储工具类
 * 负责读写JSON文件，提供数据持久化功能
 */
class JsonStorage {
  /**
   * 加载JSON文件
   * @param {string} filePath - JSON文件路径
   * @param {any} defaultValue - 文件不存在或解析失败时的默认值
   * @returns {any} 解析后的数据
   */
  static load(filePath, defaultValue = []) {
    try {
      if (!fs.existsSync(filePath)) {
        return defaultValue;
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`读取JSON文件失败: ${filePath}`, error.message);
      return defaultValue;
    }
  }

  /**
   * 保存数据到JSON文件
   * @param {string} filePath - JSON文件路径
   * @param {any} data - 要保存的数据
   * @returns {boolean} 是否保存成功
   */
  static save(filePath, data) {
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 写入文件
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`保存JSON文件失败: ${filePath}`, error.message);
      return false;
    }
  }

  /**
   * 初始化数据文件（如果不存在则创建）
   * @param {string} filePath - JSON文件路径
   * @param {any} defaultValue - 默认值
   */
  static init(filePath, defaultValue = []) {
    if (!fs.existsSync(filePath)) {
      this.save(filePath, defaultValue);
      console.log(`✓ 创建数据文件: ${filePath}`);
    }
  }
}

module.exports = JsonStorage;
