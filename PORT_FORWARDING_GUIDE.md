# 端口转发指南

## 问题说明
Cursor 的端口转发功能需要 `code-tunnel.exe`，但该文件缺失。以下是几种替代方案。

## 方案 1: 使用 localtunnel (推荐，最简单)

### 安装和使用
```bash
# 方法 1: 使用 npx (无需安装)
npx --yes localtunnel --port 3000

# 方法 2: 全局安装后使用
npm install -g localtunnel
lt --port 3000
```

运行后会得到一个公网 URL，例如：`https://xxxxx.loca.lt`

### 自定义子域名
```bash
lt --port 3000 --subdomain your-custom-name
```

## 方案 2: 使用 ngrok (更稳定，需要注册)

### 安装
1. 访问 https://ngrok.com/ 注册账号
2. 下载 ngrok 并解压
3. 获取 authtoken 并配置：
```bash
ngrok config add-authtoken YOUR_TOKEN
```

### 使用
```bash
ngrok http 3000
```

## 方案 3: 使用 Cloudflare Tunnel (免费，稳定)

### 安装
```bash
# 下载 cloudflared
# Windows: 从 https://github.com/cloudflare/cloudflared/releases 下载
# 或使用包管理器
winget install --id Cloudflare.cloudflared
```

### 使用
```bash
cloudflared tunnel --url http://localhost:3000
```

## 方案 4: 修复 Cursor 的 code-tunnel

如果希望使用 Cursor 内置的端口转发功能：

1. **重新安装 Cursor**
   - 完全卸载 Cursor
   - 重新下载并安装最新版本

2. **手动下载 code-tunnel**
   - 检查 Cursor 的更新日志或 GitHub 仓库
   - 手动下载 `code-tunnel.exe` 到 `d:\soft\cursor\bin\` 目录

3. **使用 VS Code 的端口转发**
   - Cursor 基于 VS Code，可以尝试使用 VS Code 的端口转发功能
   - 在 Cursor 中按 `Ctrl+Shift+P`，搜索 "Ports: Focus on Ports View"

## 快速启动脚本

创建一个 `forward-port.ps1` 脚本：

```powershell
# forward-port.ps1
Write-Host "启动端口转发..." -ForegroundColor Green
Write-Host "选择方案:" -ForegroundColor Yellow
Write-Host "1. localtunnel (最简单)"
Write-Host "2. ngrok (需要 token)"
Write-Host "3. cloudflared (Cloudflare)"

$choice = Read-Host "请输入选项 (1-3)"

switch ($choice) {
    "1" {
        Write-Host "使用 localtunnel..." -ForegroundColor Cyan
        npx --yes localtunnel --port 3000
    }
    "2" {
        Write-Host "使用 ngrok..." -ForegroundColor Cyan
        ngrok http 3000
    }
    "3" {
        Write-Host "使用 cloudflared..." -ForegroundColor Cyan
        cloudflared tunnel --url http://localhost:3000
    }
    default {
        Write-Host "无效选项，使用 localtunnel..." -ForegroundColor Yellow
        npx --yes localtunnel --port 3000
    }
}
```

## 注意事项

1. **安全性**: 使用端口转发时，你的本地服务会暴露到公网，请确保：
   - 不要在生产环境使用
   - 不要在暴露的端口上运行敏感服务
   - 使用 HTTPS（某些工具自动提供）

2. **GitHub Codespaces/Copilot**: 
   - 如果是为了 GitHub 相关功能，确保 token 已正确配置
   - 检查 GitHub 设置中的端口转发权限

3. **防火墙**: 确保本地防火墙允许端口 3000 的连接

## 推荐方案

- **开发测试**: 使用 `localtunnel`（最简单快速）
- **生产演示**: 使用 `ngrok`（更稳定，有管理界面）
- **长期使用**: 使用 `Cloudflare Tunnel`（免费且稳定）



