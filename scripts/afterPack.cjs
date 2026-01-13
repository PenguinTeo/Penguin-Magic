const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

/**
 * electron-builder afterPack 钩子
 * 用于在打包后强制设置 exe 文件的图标
 */
exports.default = async function(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // 仅处理 Windows 平台
  if (electronPlatformName !== 'win32') {
    return;
  }
  
  console.log('🎨 [afterPack] 开始设置 Windows 任务栏图标...');
  
  const exeName = context.packager.appInfo.productFilename + '.exe';
  const exePath = path.join(appOutDir, exeName);
  const iconPath = path.join(context.packager.projectDir, 'resources', 'icon.ico');
  
  console.log('  - EXE 路径:', exePath);
  console.log('  - 图标路径:', iconPath);
  
  // 检查文件是否存在
  if (!fs.existsSync(exePath)) {
    console.error('  ❌ EXE 文件不存在:', exePath);
    return;
  }
  
  if (!fs.existsSync(iconPath)) {
    console.error('  ❌ 图标文件不存在:', iconPath);
    return;
  }
  
  try {
    // 使用 rcedit 设置图标
    const rceditPath = path.join(
      context.packager.projectDir,
      'node_modules',
      'rcedit',
      'bin',
      'rcedit.exe'
    );
    
    if (!fs.existsSync(rceditPath)) {
      console.error('  ❌ rcedit 工具不存在:', rceditPath);
      return;
    }
    
    console.log('  - 使用 rcedit 设置图标...');
    execSync(`"${rceditPath}" "${exePath}" --set-icon "${iconPath}"`, {
      stdio: 'inherit'
    });
    
    console.log('  ✅ Windows 任务栏图标设置成功！');
  } catch (error) {
    console.error('  ❌ 设置图标失败:', error.message);
  }
};
