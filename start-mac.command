#!/bin/bash

# ==============================================
#     企鹅艾洛魔法世界 - macOS 一键启动
# ==============================================

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=============================================="
echo "    🐧 企鹅艾洛魔法世界 - macOS 版"
echo "=============================================="
echo ""

# ============================================
# 检查 Node.js 环境
# ============================================
echo -e "${BLUE}[CHECK]${NC} 检查 Node.js 环境..."

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo -e "${RED}[ERROR]${NC} 未找到 Node.js！"
  echo ""
  echo "请先安装 Node.js 18 或更高版本："
  echo "  方式 1: 官网下载 https://nodejs.org/"
  echo "  方式 2: 使用 Homebrew: brew install node"
  echo ""
  read -p "按任意键退出..."
  exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}[OK]${NC} Node.js $NODE_VERSION"
echo ""

# ============================================
# 检查依赖和构建产物
# ============================================
NEED_INSTALL=0

if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}[WARN]${NC} 前端依赖未安装"
  NEED_INSTALL=1
fi

if [ ! -d "backend-nodejs/node_modules" ]; then
  echo -e "${YELLOW}[WARN]${NC} 后端依赖未安装"
  NEED_INSTALL=1
fi

if [ ! -d "dist" ]; then
  echo -e "${YELLOW}[WARN]${NC} 前端未构建"
  NEED_INSTALL=1
fi

# ============================================
# 首次安装流程
# ============================================
if [ "$NEED_INSTALL" -eq 1 ]; then
  echo ""
  echo -e "${BLUE}检测到首次运行，开始安装...${NC}"
  echo ""
  
  # 1. 安装前端依赖
  echo -e "${BLUE}[1/4]${NC} 安装前端依赖..."
  echo "       这可能需要几分钟..."
  echo ""
  
  npm install
  if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR]${NC} 前端依赖安装失败！"
    echo "         请检查网络连接"
    read -p "按任意键退出..."
    exit 1
  fi
  
  echo ""
  echo -e "${GREEN}[OK]${NC} 前端依赖安装完成"
  echo ""
  
  # 2. 安装后端依赖
  echo -e "${BLUE}[2/4]${NC} 安装后端依赖..."
  echo ""
  
  cd backend-nodejs
  npm install
  if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR]${NC} 后端依赖安装失败！"
    echo "         请检查网络连接"
    read -p "按任意键退出..."
    exit 1
  fi
  cd ..
  
  echo ""
  echo -e "${GREEN}[OK]${NC} 后端依赖安装完成"
  echo ""
  
  # 3. 构建前端
  echo -e "${BLUE}[3/4]${NC} 构建前端项目..."
  echo ""
  
  npm run build
  if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR]${NC} 前端构建失败！"
    read -p "按任意键退出..."
    exit 1
  fi
  
  echo ""
  echo -e "${GREEN}[OK]${NC} 前端构建完成"
  echo ""
  
  # 4. 创建数据目录
  echo -e "${BLUE}[4/4]${NC} 创建数据目录..."
  
  mkdir -p data
  mkdir -p input
  mkdir -p output
  mkdir -p creative_images
  
  echo -e "${GREEN}[OK]${NC} 目录创建完成"
  echo ""
  
  echo -e "${GREEN}============================================${NC}"
  echo ""
  echo "  ✅ 安装完成！"
  echo ""
  echo -e "${GREEN}============================================${NC}"
  echo ""
else
  echo -e "${GREEN}[OK]${NC} 依赖已就绪"
  echo ""
fi

# ============================================
# 清理旧服务
# ============================================
echo -e "${BLUE}[CLEAN]${NC} 清理旧服务..."

# 查找并终止占用 8765 端口的进程
PORT_PID=$(lsof -ti:8765)
if [ ! -z "$PORT_PID" ]; then
  kill -9 $PORT_PID 2>/dev/null
  echo -e "${GREEN}[OK]${NC} 端口已清理"
else
  echo -e "${GREEN}[OK]${NC} 端口空闲"
fi
echo ""

# ============================================
# 启动后端服务
# ============================================
echo -e "${BLUE}[START]${NC} 启动 Node.js 后端服务..."
echo ""

# 创建日志目录
mkdir -p logs

# 后台启动后端，输出重定向到日志
cd backend-nodejs
nohup node src/server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 等待后端启动
echo "       等待后端启动..."
sleep 3

# 检查后端是否成功启动
if lsof -ti:8765 >/dev/null 2>&1; then
  echo -e "${GREEN}[OK]${NC} 后端运行中 (PID: $BACKEND_PID, 端口: 8765)"
  echo ""
  
  # 保存 PID 用于后续停止
  echo $BACKEND_PID > .backend.pid
  
  # ============================================
  # 打开浏览器
  # ============================================
  echo -e "${GREEN}[SUCCESS]${NC} 打开浏览器..."
  open "http://127.0.0.1:8765"
  
  echo ""
  echo "=============================================="
  echo ""
  echo "  ✅ 服务正在后台运行"
  echo ""
  echo "  访问地址: http://127.0.0.1:8765"
  echo ""
  echo "  要停止服务，请运行："
  echo "    kill $BACKEND_PID"
  echo "  或查看日志："
  echo "    tail -f logs/backend.log"
  echo ""
  echo "=============================================="
  echo ""
  
  # 保持终端窗口打开 5 秒
  sleep 5
  
else
  echo ""
  echo -e "${RED}[ERROR]${NC} 后端启动失败！"
  echo ""
  echo "请查看日志文件获取详细信息："
  echo "  cat logs/backend.log"
  echo ""
  read -p "按任意键退出..."
  exit 1
fi
