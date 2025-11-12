#!/bin/bash
# One-click launcher for macOS
# Usage: double-click run.command

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="${DIR}"

cd "$ROOT" || exit 1

mkdir -p "${ROOT}/logs"
export NODE_ENV=production

# Check Node.js version >= 20
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 未安装。请安装 Node.js >= 20 后重试。"
  exit 1
fi
NODE_MAJOR=$(node -v | sed 's/^v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "检测到 Node.js 版本 < 20。请升级到 >= 20 再运行。当前版本: $(node -v)"
  exit 1
fi

# If runtime dependencies are not installed, install them (prefer pnpm)
if [ ! -d "${ROOT}/node_modules" ]; then
  echo "[runtime] Installing minimal production dependencies..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install --prod --frozen-lockfile || pnpm install --prod
  else
    if command -v npm >/dev/null 2>&1; then
      npm install --only=prod
    else
      echo "Neither pnpm nor npm found. Please install one of them and rerun."
      exit 1
    fi
  fi
fi

# Ensure @libsql/client is available at runtime; install if missing
node -e "try{require.resolve('@libsql/client');process.exit(0)}catch(e){process.exit(1)}"
if [ $? -ne 0 ]; then
  echo "[runtime] @libsql/client 未检测到，正在安装..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm add @libsql/client --prod || {
      echo "[runtime] 使用 pnpm 安装失败，尝试 npm 安装。";
      if command -v npm >/dev/null 2>&1; then
        npm i @libsql/client --only=prod || {
          echo "[runtime] 安装 @libsql/client 失败，请检查网络或代理设置。";
          exit 1;
        }
      else
        echo "Neither pnpm nor npm found. Please install one of them and rerun."
        exit 1
      fi
    }
  else
    if command -v npm >/dev/null 2>&1; then
      npm i @libsql/client --only=prod || {
        echo "[runtime] 安装 @libsql/client 失败，请检查网络或代理设置。";
        exit 1;
      }
    else
      echo "Neither pnpm nor npm found. Please install one of them and rerun."
      exit 1
    fi
  fi
fi

# Run and append logs
# Show output AND write to logs
node "${ROOT}/scripts/run.mjs" 2>&1 | tee -a "${ROOT}/logs/app.log"
