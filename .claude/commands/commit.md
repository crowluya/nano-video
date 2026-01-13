---
description: 基于 git diff 生成 Conventional Commits 规范的提交信息
model: sonnet
allowed-tools:
  - Bash
---

# Git 提交指令

请执行以下步骤生成符合 Conventional Commits 规范的提交信息。

## 执行步骤

1. **查看状态**
   ```bash
   !git status
   ```

2. **查看变更**
   ```bash
   !git diff
   !git diff --staged
   ```

3. **查看最近提交风格**
   ```bash
   !git log -5 --oneline
   ```

4. **分析变更并生成提交信息**

   根据变更类型选择前缀：
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `style:` 代码格式（不影响功能）
   - `refactor:` 重构
   - `test:` 测试相关
   - `chore:` 构建/工具相关
   - `i18n:` 翻译相关

5. **执行提交**

   使用 HEREDOC 格式执行 git commit：

   ```bash
   !git commit -m "$(cat <<'EOF'
   <type>(<scope>): <subject>

   <body>

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```

6. **验证提交**
   ```bash
   !git status
   !git log -1 --pretty=fuller
   ```

## 示例

```
feat(video): add Sora model support

- Add Sora API integration
- Update video generation UI
- Add i18n translations for Sora

Co-Authored-By: Claude <noreply@anthropic.com>
```

请开始执行。
