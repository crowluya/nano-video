---
description: 使用 Playwright 测试网页表单填写
argument-hint: <url>
allowed-tools:
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_wait_for
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_type
  - mcp__playwright__browser_fill_form
  - mcp__playwright__browser_select_option
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_close
---

使用 Playwright MCP 分析并测试网页表单：

1. 打开网页: $ARGUMENTS
2. 等待页面加载
3. 获取页面快照，分析表单结构
4. 列出所有可填写的表单字段
5. 截图记录表单状态

请分析表单结构并报告可交互的元素。
