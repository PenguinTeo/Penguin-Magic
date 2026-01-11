/**
 * ComfyUI-Easy-Use: 可视化调节视角功能 - Node.js/JavaScript 版本
 * ============================================================
 * 
 * 纯 JavaScript 实现，可直接在 Node.js 或浏览器中运行
 * 不依赖任何框架
 */

/**
 * 获取水平方向描述
 * @param {number} angle - 水平角度 (0-360)
 * @param {boolean} addAnglePrompt - 是否使用详细模式
 * @returns {string}
 */
function getHorizontalDirection(angle, addAnglePrompt = true) {
  const hAngle = angle % 360;
  const suffix = addAnglePrompt ? "" : " quarter";
  
  if (hAngle < 22.5 || hAngle >= 337.5) return "front view";
  if (hAngle < 67.5) return `front-right${suffix} view`;
  if (hAngle < 112.5) return "right side view";
  if (hAngle < 157.5) return `back-right${suffix} view`;
  if (hAngle < 202.5) return "back view";
  if (hAngle < 247.5) return `back-left${suffix} view`;
  if (hAngle < 292.5) return "left side view";
  return `front-left${suffix} view`;
}

/**
 * 获取垂直方向描述
 * @param {number} vertical - 垂直角度 (-30 到 90)
 * @param {boolean} addAnglePrompt - 是否使用详细模式
 * @returns {string}
 */
function getVerticalDirection(vertical, addAnglePrompt = true) {
  if (addAnglePrompt) {
    if (vertical < -15) return "low angle";
    if (vertical < 15) return "eye level";
    if (vertical < 45) return "high angle";
    if (vertical < 75) return "bird's eye view";
    return "top-down view";
  } else {
    if (vertical < -15) return "low-angle shot";
    if (vertical < 15) return "eye-level shot";
    if (vertical < 75) return "elevated shot";
    return "high-angle shot";
  }
}

/**
 * 获取距离/缩放描述
 * @param {number} zoom - 缩放值 (0-10)
 * @param {boolean} addAnglePrompt - 是否使用详细模式
 * @returns {string}
 */
function getDistanceDescription(zoom, addAnglePrompt = true) {
  if (addAnglePrompt) {
    if (zoom < 2) return "wide shot";
    if (zoom < 4) return "medium-wide shot";
    if (zoom < 6) return "medium shot";
    if (zoom < 8) return "medium close-up";
    return "close-up";
  } else {
    if (zoom < 2) return "wide shot";
    if (zoom < 6) return "medium shot";
    return "close-up";
  }
}

/**
 * 主转换函数 - 将角度参数转换为提示词
 * @param {Object} params - 角度参数
 * @param {number} params.rotate - 水平角度 (0-360)
 * @param {number} params.vertical - 垂直角度 (-30 到 90)
 * @param {number} params.zoom - 缩放距离 (0-10)
 * @param {boolean} [params.addAnglePrompt=true] - 是否添加详细角度信息
 * @returns {Object} - { prompt, hDirection, vDirection, distance }
 */
function convertAngleToPrompt(params) {
  const { 
    rotate: rawRotate = 0, 
    vertical: rawVertical = 0, 
    zoom: rawZoom = 5, 
    addAnglePrompt = true 
  } = params;
  
  // 限制输入范围
  const rotate = Math.max(0, Math.min(360, Math.round(rawRotate)));
  const vertical = Math.max(-30, Math.min(90, Math.round(rawVertical)));
  const zoom = Math.max(0, Math.min(10, rawZoom));
  
  const hDirection = getHorizontalDirection(rotate, addAnglePrompt);
  const vDirection = getVerticalDirection(vertical, addAnglePrompt);
  const distance = getDistanceDescription(zoom, addAnglePrompt);
  
  let prompt;
  if (addAnglePrompt) {
    prompt = `${hDirection}, ${vDirection}, ${distance} (horizontal: ${rotate}, vertical: ${vertical}, zoom: ${zoom.toFixed(1)})`;
  } else {
    prompt = `${hDirection} ${vDirection} ${distance}`;
  }
  
  return { prompt, hDirection, vDirection, distance };
}

/**
 * 批量转换多个角度
 * @param {Array} angleList - 角度参数数组
 * @returns {Array} - 结果数组
 */
function convertMultipleAngles(angleList) {
  return angleList.map(params => convertAngleToPrompt(params));
}

/**
 * 角度映射参考表
 */
const ANGLE_REFERENCE = {
  horizontal: {
    0: 'front view (正面)',
    45: 'front-right view (正面右侧)',
    90: 'right side view (右侧)',
    135: 'back-right view (背面右侧)',
    180: 'back view (背面)',
    225: 'back-left view (背面左侧)',
    270: 'left side view (左侧)',
    315: 'front-left view (正面左侧)',
  },
  vertical: {
    '-30 to -15': 'low angle (仰视)',
    '-15 to 15': 'eye level (平视)',
    '15 to 45': 'high angle (高角度)',
    '45 to 75': "bird's eye view (鸟瞰)",
    '75 to 90': 'top-down view (俯视)',
  },
  zoom: {
    '0-2': 'wide shot (远景)',
    '2-4': 'medium-wide shot (中远景)',
    '4-6': 'medium shot (中景)',
    '6-8': 'medium close-up (中近景)',
    '8-10': 'close-up (特写)',
  },
};

// ============================================
// 模块导出 (CommonJS & ES Module 兼容)
// ============================================

// CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    convertAngleToPrompt,
    convertMultipleAngles,
    getHorizontalDirection,
    getVerticalDirection,
    getDistanceDescription,
    ANGLE_REFERENCE,
  };
}

// ES Module 导出 (在支持的环境中)
// export { convertAngleToPrompt, convertMultipleAngles, ANGLE_REFERENCE };

// ============================================
// 测试代码 (Node.js 直接运行)
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  console.log('=' .repeat(60));
  console.log('可视化视角调节功能测试 (Node.js 版本)');
  console.log('='.repeat(60));
  
  const testCases = [
    { rotate: 0, vertical: 0, zoom: 5, addAnglePrompt: true },
    { rotate: 90, vertical: 30, zoom: 8, addAnglePrompt: true },
    { rotate: 180, vertical: -20, zoom: 2, addAnglePrompt: true },
    { rotate: 270, vertical: 60, zoom: 4, addAnglePrompt: false },
    { rotate: 45, vertical: 80, zoom: 9, addAnglePrompt: true },
  ];
  
  testCases.forEach((params, i) => {
    const result = convertAngleToPrompt(params);
    console.log(`\n测试 ${i + 1}:`);
    console.log(`  输入: rotate=${params.rotate}°, vertical=${params.vertical}°, zoom=${params.zoom}`);
    console.log(`  详细模式: ${params.addAnglePrompt}`);
    console.log(`  输出: ${result.prompt}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('Express/Koa API 使用示例:');
  console.log('='.repeat(60));
  console.log(`
// Express 示例
const express = require('express');
const { convertAngleToPrompt } = require('./multiAngle_nodejs');

const app = express();
app.use(express.json());

app.post('/api/angle-to-prompt', (req, res) => {
  const { rotate, vertical, zoom, addAnglePrompt } = req.body;
  const result = convertAngleToPrompt({ rotate, vertical, zoom, addAnglePrompt });
  res.json(result);
});

app.listen(3000);
`);
  console.log('='.repeat(60));
}
