const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

/**
 * electron-builder afterPack 钩子
 * 用于在打包后处理平台特定的原生模块和图标
 */
exports.default = async function(context) {
  const { electronPlatformName, appOutDir, arch } = context;
  
  // 处理 sharp 原生模块 - 需要为目标平台重新安装
  console.log('📦 [afterPack] 处理原生模块 sharp...');
  console.log('  - 目标平台:', electronPlatformName);
  console.log('  - 目标架构:', arch === 1 ? 'x64' : 'arm64');
  
  const backendNodeModulesPath = path.join(
    appOutDir, 
    'resources', 
    'app.asar.unpacked', 
    'backend-nodejs', 
    'node_modules'
  );
  
  // 检查路径是否存在
  if (fs.existsSync(backendNodeModulesPath)) {
    try {
      const archName = arch === 1 ? 'x64' : 'arm64';
      let osName;
      
      if (electronPlatformName === 'darwin') {
        osName = 'darwin';
      } else if (electronPlatformName === 'win32') {
        osName = 'win32';
      } else if (electronPlatformName === 'linux') {
        osName = 'linux';
      }
      
      if (osName) {
        console.log(`  - 为 ${osName}-${archName} 重新安装 sharp...`);
        
        const backendPath = path.join(appOutDir, 'resources', 'app.asar.unpacked', 'backend-nodejs');
        
        // 删除现有的 sharp
        const sharpPath = path.join(backendNodeModulesPath, 'sharp');
        if (fs.existsSync(sharpPath)) {
          fs.rmSync(sharpPath, { recursive: true, force: true });
        }
        
        // 删除 @img 目录下的 sharp 平台包
        const imgPath = path.join(backendNodeModulesPath, '@img');
        if (fs.existsSync(imgPath)) {
          fs.rmSync(imgPath, { recursive: true, force: true });
        }
        
        // 重新安装目标平台的 sharp
        execSync(
          `npm install --os=${osName} --cpu=${archName} sharp@0.34.5`,
          { stdio: 'inherit', cwd: backendPath }
        );
        
        console.log('  ✅ sharp 原生模块处理完成！');
      }
    } catch (error) {
      console.error('  ❌ sharp 处理失败:', error.message);
    }
  } else {
    console.log('  ⚠️ 未找到 backend-nodejs/node_modules 目录:', backendNodeModulesPath);
  }
  
  // 仅处理 Windows 平台的图标
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
