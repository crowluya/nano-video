#!/bin/bash
# Auto-format hook for Claude Code
# 自动格式化 TypeScript/TSX 代码

# 读取事件 JSON
EVENT_JSON=$(cat)

# 提取文件路径
FILE_PATH=$(echo "$EVENT_JSON" | jq -r '.file // .path // empty')

# 如果没有文件路径，退出
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# 只处理 TypeScript/TSX 文件
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
    # 使用 Prettier 格式化
    if command -v pnpm &> /dev/null; then
        cd "$(git rev-parse --show-toplevel)"
        pnpm prettier --write "$FILE_PATH" 2>/dev/null || true
    fi
fi

exit 0
