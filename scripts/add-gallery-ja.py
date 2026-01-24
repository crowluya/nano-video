#!/usr/bin/env python3
import json

# Gallery 日文翻译
gallery_ja = {
  "badge": {
    "label": "品質",
    "text": "ビデオ品質ギャラリー"
  },
  "title": "AI生成の素晴らしい動画",
  "description": "Sora 2とVeo 3.1で作成した動画ギャラリーを探索",
  "tabs": {
    "realistic": "リアル",
    "ugc": "UGCスタイル",
    "3d": "3Dアニメーション"
  },
  "categories": {
    "realistic": {
      "title": "リアルスタイル動画",
      "description": "AIが生成したプロ品質のリアルな動画",
      "videos": [
        {
          "id": "realistic-1",
          "title": "AIスポークスパーソン",
          "description": "スマートフォン製品を紹介するプロのAI生成スポークスパーソン"
        },
        {
          "id": "realistic-2",
          "title": "コーヒーラテアート",
          "description": "バリスタがラテアートを作るクローズアップショット"
        },
        {
          "id": "realistic-3",
          "title": "都市タイムラプス",
          "description": "夕暮れ時の近代的な都市のスカイラインタイムラプス"
        }
      ]
    },
    "ugc": {
      "title": "UGCスタイル動画",
      "description": "ソーシャルメディア向けの本物のユーザー生成コンテンツスタイル動画",
      "videos": [
        {
          "id": "ugc-1",
          "title": "開封体験",
          "description": "プレミアムヘッドフォンを開封する一人称視点の体験"
        },
        {
          "id": "ugc-2",
          "title": "フィットネスワークアウト",
          "description": "明るいリビングでのエネルギッシュなジャンピングジャック"
        },
        {
          "id": "ugc-3",
          "title": "アボカドトースト",
          "description": "明るいキッチンでカラフルな健康的なアボカドトーストを作る"
        }
      ]
    },
    "3d": {
      "title": "3Dアニメーション動画",
      "description": "ピクサースタイルの品質を持つクリエイティブな3Dアニメーション動画",
      "videos": [
        {
          "id": "3d-1",
          "title": "3Dヘッドホンショーケース",
          "description": "ワイヤレスヘッドフォンが回転する3D製品ショーケース"
        },
        {
          "id": "3d-2",
          "title": "かわいい3Dキャラクター",
          "description": "楽しく歩くかわいい3Dキャラクター、ディズニーピクサースタイル"
        },
        {
          "id": "3d-3",
          "title": "3Dロゴアニメーション",
          "description": "幾何学的形状が組み合わさる3Dブランドロゴアニメーション"
        }
      ]
    }
  }
}

# 读取现有文件
with open('i18n/messages/ja/NanoBananaVideo.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 添加 Gallery
data['Gallery'] = gallery_ja

# 写回文件
with open('i18n/messages/ja/NanoBananaVideo.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ 日文翻译已添加")
