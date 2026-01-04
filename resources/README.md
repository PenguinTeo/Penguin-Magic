# 图标生成说明

当前 `resources/` 目录包含：
- icon.svg - SVG 格式的应用图标

## 生成所需格式的图标

为了完整的 Electron 打包，你需要以下格式的图标：

### Windows
- icon.ico (256x256 或多尺寸)

### macOS  
- icon.icns (包含多个尺寸)

### Linux / 通用
- icon.png (512x512 推荐)

## 如何生成

### 方法 1：使用在线工具
1. 访问 https://www.icoconverter.com/ 或 https://convertio.co/zh/
2. 上传 icon.svg
3. 转换为需要的格式（.ico, .icns, .png）
4. 下载并放入 resources/ 目录

### 方法 2：使用命令行工具

**安装 electron-icon-builder：**
```bash
npm install -g electron-icon-builder
```

**生成图标：**
```bash
electron-icon-builder --input=resources/icon.svg --output=resources
```

### 方法 3：使用现有 PNG
如果你已经有 PNG 图标：
```bash
# 复制到 resources 目录
cp your-icon.png resources/icon.png
```

## 临时方案

当前配置使用 PNG 格式作为所有平台的图标。对于开发和测试，这已经足够。
如果需要更专业的图标格式，请按照上述方法生成。
