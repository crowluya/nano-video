#!/usr/bin/env python3
"""
Protect main branch hook for Claude Code
阻止在主分支上进行危险的写操作
"""

import sys
import json
import subprocess
import os

def main():
    try:
        # 读取事件 JSON
        event = json.load(sys.stdin)

        # 获取当前分支
        result = subprocess.run(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        )
        current_branch = result.stdout.strip()

        # 主分支列表
        protected_branches = ['main', 'master', 'production']

        # 如果在保护分支上
        if current_branch in protected_branches:
            # 获取工具名称
            tool = event.get('tool', event.get('name', ''))

            # 危险的写操作
            dangerous_tools = ['Edit', 'Write', 'MultiEdit']

            if tool in dangerous_tools:
                print(f"⚠️  ERROR: Cannot modify files on '{current_branch}' branch")
                print(f"Please create a feature branch first:")
                print(f"  git checkout -b feature/your-feature-name")
                sys.exit(1)

    except Exception as e:
        # 如果出错，允许操作（避免阻塞正常开发）
        pass

    sys.exit(0)

if __name__ == '__main__':
    main()
