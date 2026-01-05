const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rceditPath = path.join(__dirname, '../node_modules/rcedit/bin/rcedit-x64.exe');
const exePath = path.join(__dirname, '../release/win-unpacked/PenguinMagic.exe');
const iconPath = path.join(__dirname, '../resources/icon.ico');

console.log('rcedit路径:', rceditPath);
console.log('exe路径:', exePath);
console.log('icon路径:', iconPath);

if (!fs.existsSync(rceditPath)) {
  console.error('❌ rcedit不存在');
  process.exit(1);
}
if (!fs.existsSync(exePath)) {
  console.error('❌ exe文件不存在');
  process.exit(1);
}
if (!fs.existsSync(iconPath)) {
  console.error('❌ icon文件不存在');
  process.exit(1);
}

console.log('正在嵌入图标...');
execSync(`"${rceditPath}" "${exePath}" --set-icon "${iconPath}"`, { stdio: 'inherit' });
console.log('✅ 图标嵌入成功！');
