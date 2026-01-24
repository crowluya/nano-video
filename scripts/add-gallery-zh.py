#!/usr/bin/env python3
import json

# Gallery 中文翻译
gallery_zh = {
  "badge": {
    "label": "质量展示",
    "text": "视频质量画廊"
  },
  "title": "AI 生成的精彩视频",
  "description": "探索我们使用 Sora 2 和 Veo 3.1 创建的视频画廊",
  "tabs": {
    "realistic": "写实风格",
    "ugc": "UGC 风格",
    "3d": "3D 动画"
  },
  "categories": {
    "realistic": {
      "title": "写实风格视频",
      "description": "AI 生成的专业级写实视频",
      "videos": [
        {
          "id": "realistic-1",
          "title": "AI 代言人",
          "description": "专业 AI 生成的产品代言人展示智能手机"
        },
        {
          "id": "realistic-2",
          "title": "咖啡拉花艺术",
          "description": "咖啡师制作拿铁拉花的特写镜头"
        },
        {
          "id": "realistic-3",
          "title": "城市延时摄影",
          "description": "黄昏时分现代城市天际线的延时摄影"
        }
      ]
    },
    "ugc": {
      "title": "UGC 风格视频",
      "description": "适合社交媒体的真实用户生成内容风格视频",
      "videos": [
        {
          "id": "ugc-1",
          "title": "开箱体验",
          "description": "第一人称视角开箱高端耳机的真实体验"
        },
        {
          "id": "ugc-2",
          "title": "健身运动",
          "description": "明亮客厅中的活力开合跳健身运动"
        },
        {
          "id": "ugc-3",
          "title": "牛油果吐司",
          "description": "阳光厨房中制作彩色健康牛油果吐司"
        }
      ]
    },
    "3d": {
      "title": "3D 动画视频",
      "description": "具有皮克斯风格质量的创意 3D 动画视频",
      "videos": [
        {
          "id": "3d-1",
          "title": "3D 耳机展示",
          "description": "无线耳机旋转的 3D 产品展示"
        },
        {
          "id": "3d-2",
          "title": "可爱 3D 角色",
          "description": "快乐行走的可爱 3D 角色，迪士尼皮克斯风格"
        },
        {
          "id": "3d-3",
          "title": "3D Logo 动画",
          "description": "几何图形组合的 3D 品牌 Logo 动画"
        }
      ]
    }
  }
}

# 读取现有文件
with open('i18n/messages/zh/NanoBananaVideo.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 添加 Gallery
data['Gallery'] = gallery_zh

# 写回文件
with open('i18n/messages/zh/NanoBananaVideo.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ 中文翻译已添加")
