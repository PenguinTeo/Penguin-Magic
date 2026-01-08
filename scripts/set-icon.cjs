const { rcedit } = require('rcedit');
const path = require('path');

const exePath = path.join(__dirname, '../release/win-unpacked/PenguinMagic.exe');
const iconPath = path.join(__dirname, '../resources/icon.ico');

console.log('正在设置图标...');
console.log('EXE:', exePath);
console.log('ICO:', iconPath);

rcedit(exePath, { icon: iconPath })
  .then(() => {
    console.log('✅ 图标设置成功！');
  })
  .catch(err => {
    console.error('❌ 图标设置失败:', err);
  });
