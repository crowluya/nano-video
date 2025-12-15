# 端口转发快速启动脚本
param(
    [int]$Port = 3000,
    [string]$Method = "localtunnel"
)

Write-Host "`n=== 端口转发工具 ===" -ForegroundColor Cyan
Write-Host "端口: $Port" -ForegroundColor Yellow
Write-Host "方法: $Method`n" -ForegroundColor Yellow

switch ($Method.ToLower()) {
    "localtunnel" {
        Write-Host "使用 localtunnel 转发端口 $Port..." -ForegroundColor Green
        Write-Host "提示: 运行后会显示公网 URL，按 Ctrl+C 停止`n" -ForegroundColor Gray
        npx --yes localtunnel --port $Port
    }
    "ngrok" {
        Write-Host "使用 ngrok 转发端口 $Port..." -ForegroundColor Green
        Write-Host "提示: 需要先配置 ngrok authtoken`n" -ForegroundColor Gray
        ngrok http $Port
    }
    "cloudflared" {
        Write-Host "使用 Cloudflare Tunnel 转发端口 $Port..." -ForegroundColor Green
        Write-Host "提示: 首次使用需要安装 cloudflared`n" -ForegroundColor Gray
        cloudflared tunnel --url http://localhost:$Port
    }
    default {
        Write-Host "未知方法: $Method" -ForegroundColor Red
        Write-Host "可用方法: localtunnel, ngrok, cloudflared" -ForegroundColor Yellow
        exit 1
    }
}



