/**
 * 创意库数据提取器
 * 移植自 D:\CreativeLibrary 项目
 * 用于从opennana.com网站提取创意数据
 */

const https = require('https');
const http = require('http');

class CreativeExtractor {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.imageTimeout = options.imageTimeout || 15000;
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }

  /**
   * 从URL获取JSON数据
   * @param {string} url - 数据源URL
   * @returns {Promise<Array>} 数据数组
   */
  fetchData(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: this.timeout
      }, (res) => {
        let data = '';

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            let parsed = JSON.parse(data);

            // 如果是字典，提取列表
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              for (const key of Object.keys(parsed)) {
                if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
                  parsed = parsed[key];
                  break;
                }
              }
            }

            if (!Array.isArray(parsed)) {
              reject(new Error('数据格式错误：期望数组'));
              return;
            }

            resolve(parsed);
          } catch (e) {
            reject(new Error(`JSON解析失败: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
    });
  }

  /**
   * 下载图片并转换为Base64
   * @param {string} imageUrl - 图片URL（可能是相对路径）
   * @param {string} baseUrl - 基础URL
   * @returns {Promise<string>} Base64编码的图片数据
   */
  downloadImageAsBase64(imageUrl, baseUrl) {
    return new Promise((resolve) => {
      if (!imageUrl) {
        resolve('');
        return;
      }

      // 处理相对路径
      let fullUrl = imageUrl;
      if (!imageUrl.startsWith('http')) {
        // 移除开头的 ./
        const cleanPath = imageUrl.replace(/^\.\//, '');
        fullUrl = baseUrl + cleanPath;
      }

      const client = fullUrl.startsWith('https') ? https : http;

      const req = client.get(fullUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: this.imageTimeout
      }, (res) => {
        // 处理重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          this.downloadImageAsBase64(res.headers.location, baseUrl).then(resolve);
          return;
        }

        if (res.statusCode !== 200) {
          console.warn(`图片下载失败 (${res.statusCode}): ${fullUrl}`);
          resolve('');
          return;
        }

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            const contentType = res.headers['content-type'] || 'image/jpeg';
            const base64 = buffer.toString('base64');
            resolve(`data:${contentType};base64,${base64}`);
          } catch (e) {
            console.warn(`图片转换失败: ${e.message}`);
            resolve('');
          }
        });
      });

      req.on('error', (e) => {
        console.warn(`图片请求失败: ${e.message}`);
        resolve('');
      });

      req.on('timeout', () => {
        req.destroy();
        console.warn(`图片请求超时: ${fullUrl}`);
        resolve('');
      });
    });
  }

  /**
   * 解析ID范围
   * @param {string} idInput - ID输入 (如 "791-785" 或 "id791-785")
   * @returns {{ start: number, end: number } | null}
   */
  parseIdRange(idInput) {
    if (!idInput) return null;

    // 去除空格和 "id" 前缀
    let cleaned = idInput.toString().trim().toLowerCase().replace(/id/g, '');

    if (cleaned.includes('-')) {
      const [a, b] = cleaned.split('-').map(s => parseInt(s.trim(), 10));
      if (isNaN(a) || isNaN(b)) return null;
      return { start: Math.max(a, b), end: Math.min(a, b) };
    } else {
      const id = parseInt(cleaned, 10);
      if (isNaN(id)) return null;
      return { start: id, end: id };
    }
  }

  /**
   * 从JSON URL提取base URL
   * 例如: https://opennana.com/awesome-prompt-gallery/data/prompts.json
   * 返回: https://opennana.com/awesome-prompt-gallery/
   * @param {string} jsonUrl
   * @returns {string}
   */
  extractBaseUrl(jsonUrl) {
    if (!jsonUrl) return '';
    const parts = jsonUrl.split('/');
    // 去掉最后两段 (data/prompts.json)
    if (parts.length >= 3) {
      parts.pop(); // 移除文件名
      parts.pop(); // 移除 data 目录
      return parts.join('/') + '/';
    }
    return '';
  }

  /**
   * 转换记录为标准格式
   * @param {Object} record - 原始记录
   * @param {string} base64Image - Base64图片数据
   * @returns {Object} 标准格式记录
   */
  formatRecord(record, base64Image) {
    const now = new Date().toISOString();

    // 处理 prompts 字段
    let prompt = '';
    if (Array.isArray(record.prompts) && record.prompts.length > 0) {
      prompt = String(record.prompts[0]);
    } else if (record.prompt) {
      prompt = record.prompt;
    }

    // 处理作者字段：优先从 source.name 获取，否则使用 author
    let author = '';
    if (record.source && record.source.name) {
      author = record.source.name;
    } else if (record.author) {
      author = record.author;
    }

    // 处理来源URL：从source.url获取
    let sourceUrl = '';
    if (record.source && record.source.url) {
      sourceUrl = record.source.url;
    }

    return {
      order: record.order ?? record.id,
      title: record.title || '',
      author: author,
      sourceUrl: sourceUrl,
      prompt: prompt,
      imageUrl: base64Image,
      cost: record.cost ?? 0,
      isSmart: record.isSmart ?? false,
      isSmartPlus: record.isSmartPlus ?? false,
      isBP: record.isBP ?? false,
      allowViewPrompt: record.allowViewPrompt ?? true,
      allowEditPrompt: record.allowEditPrompt ?? true,
      id: record.id,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * 主提取方法
   * @param {Object} options - 提取选项
   * @param {string} options.url - JSON数据URL
   * @param {string} options.idRange - ID范围 (如 "791-785")
   * @param {Function} [options.onProgress] - 进度回调 (current, total, record)
   * @returns {Promise<Array>} 提取并格式化后的记录数组
   */
  async extract(options) {
    const { url, idRange, onProgress } = options;

    if (!url) throw new Error('请提供数据URL');
    if (!idRange) throw new Error('请提供ID范围');

    // 解析ID范围
    const range = this.parseIdRange(idRange);
    if (!range) throw new Error('ID范围格式错误');

    // 获取数据
    console.log(`正在从 ${url} 获取数据...`);
    const data = await this.fetchData(url);
    console.log(`✓ 成功获取 ${data.length} 条记录`);

    // 筛选ID范围内的记录
    const filtered = data.filter(record => {
      const id = record.id;
      return id !== undefined && id >= range.end && id <= range.start;
    });

    // 按ID降序排序
    filtered.sort((a, b) => b.id - a.id);
    console.log(`🔍 筛选出 ${filtered.length} 条记录 (ID ${range.start} 到 ${range.end})`);

    if (filtered.length === 0) {
      return [];
    }

    // 提取base URL
    const baseUrl = this.extractBaseUrl(url);
    console.log(`基础URL: ${baseUrl}`);

    // 处理每条记录
    const results = [];
    for (let i = 0; i < filtered.length; i++) {
      const record = filtered[i];

      if (onProgress) {
        onProgress(i + 1, filtered.length, record);
      }

      // 获取图片URL
      let imageUrl = '';
      if (Array.isArray(record.images) && record.images.length > 0) {
        imageUrl = record.images[0];
      } else if (record.imageUrl) {
        imageUrl = record.imageUrl;
      }

      // 下载图片并转换为Base64
      console.log(`📸 处理第 ${i + 1}/${filtered.length} 条 (ID: ${record.id})`);
      const base64Image = await this.downloadImageAsBase64(imageUrl, baseUrl);

      // 格式化记录
      const formatted = this.formatRecord(record, base64Image);
      results.push(formatted);
    }

    console.log(`✓ 完成！共处理 ${results.length} 条记录`);
    return results;
  }
}

/**
 * 快捷提取方法
 * @param {Object} options - 提取选项
 * @returns {Promise<Array>}
 */
async function extract(options) {
  const extractor = new CreativeExtractor();
  return extractor.extract(options);
}

module.exports = { CreativeExtractor, extract };
