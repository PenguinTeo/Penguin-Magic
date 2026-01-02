# 构建资源目录

请将以下图标文件放置到此目录：

## Windows
- `icon.ico` - Windows 应用图标 (256x256 或更大)

## macOS
- `icon.icns` - macOS 应用图标

## Linux
- `icon.png` - Linux 应用图标 (512x512 推荐)

## 图标生成工具

可以使用以下工具生成各平台图标：

1. **electron-icon-builder** (npm 包)
   ```bash
   npm install -g electron-icon-builder
   electron-icon-builder --input=./icon.png --output=./
   ```

2. **在线工具**
   - https://www.icoconverter.com/
   - https://cloudconvert.com/png-to-ico

## 注意事项

- 建议使用 1024x1024 的 PNG 作为源图
- 确保图标背景透明（如果需要）
- Windows ICO 文件应包含多种尺寸 (16, 32, 48, 64, 128, 256)
