#!/usr/bin/env python3
"""
i18n consistency check hook for Claude Code
检查是否有硬编码的文本
"""

import sys
import json
import re
import os

# 常见的硬编码文本模式（中英文日文）
HARDCODED_PATTERNS = [
    r'["\']([A-Z][a-z]+\s+[a-z]+\.?)["\']',  # 英文句子
    r'["\']([\u4e00-\u9fff]+)',               # 中文
    r'["\']([\u3040-\u309f\u30a0-\u30ff]+)',  # 日文
]

# 豁免模式（注释、log、技术术语）
EXEMPTION_PATTERNS = [
    r'//.*',           # 单行注释
    r'/\*.*\*/',       # 多行注释
    r'console\.',      # console.log
    r'toString|valueOf|getInstance',  # 技术术语
]

def main():
    try:
        # 读取事件 JSON
        event = json.load(sys.stdin)

        # 获取文件路径
        file_path = event.get('file', event.get('path', ''))

        # 只检查 TS/TSX 文件
        if not (file_path.endswith('.ts') or file_path.endswith('.tsx')):
            sys.exit(0)

        # 读取文件内容
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            sys.exit(0)

        # 检查是否有 useTranslations 或 getTranslations
        has_i18n_import = 'useTranslations' in content or 'getTranslations' in content or 'next-intl' in content

        # 如果文件使用了 i18n，检查是否有硬编码
        if has_i18n_import:
            lines = content.split('\n')
            issues = []

            for i, line in enumerate(lines, 1):
                # 跳过空行和纯代码行
                stripped = line.strip()
                if not stripped or stripped.startswith('//') or stripped.startswith('*'):
                    continue

                # 检查是否包含用户可见的硬编码文本
                for pattern in HARDCODED_PATTERNS:
                    matches = re.finditer(pattern, line)
                    for match in matches:
                        text = match.group(1)
                        # 只检查较长的文本（可能是用户可见的）
                        if len(text) >= 3:
                            # 跳过技术术语
                            if any(re.search(exemption, text) for exemption in EXEMPTION_PATTERNS):
                                continue
                            issues.append(f"Line {i}: {text.strip()}")

            if issues:
                print("⚠️  Potential hardcoded text found (use i18n instead):")
                for issue in issues[:5]:  # 最多显示 5 个
                    print(f"  {issue}")
                if len(issues) > 5:
                    print(f"  ... and {len(issues) - 5} more")

    except Exception as e:
        # 静默失败，不阻塞开发
        pass

    sys.exit(0)

if __name__ == '__main__':
    main()
