# 多语言扩展规范 (Language Expansion Spec)

> Nano Banana Video 高价值国家语言实施方案

---

## 一、目标语言列表

### 当前状态 (3 语言)
| 代码 | 语言 | 状态 | 区域 |
|------|------|------|------|
| `en` | English | ✅ | 全球 |
| `zh` | 中文 | ✅ | 中国/华人 |
| `ja` | 日本語 | ✅ | 日本 |

### 待新增 (9 语言)

#### Western High-Value (高 ARPU)
| 代码 | 语言 | 优先级 | 市场范围 | 人口 | GDP/人均 |
|------|------|--------|----------|------|----------|
| `es` | Español | P0 | 西班牙 + 拉美 | 5亿+ | $12K |
| `fr` | Français | P0 | 法国 + 非洲法语区 | 3亿+ | $35K |
| `de` | Deutsch | P1 | 德国/奥地利/瑞士 | 1亿+ | $48K |
| `it` | Italiano | P1 | 意大利/瑞士 | 7000万 | $31K |
| `nl` | Nederlands | P2 | 荷兰/比利时 | 2800万 | $55K |
| `pt` | Português | P0 | 巴西 + 葡萄牙 | 2.6亿 | $15K |

#### Asian High-Demand (高 AI 需求)
| 代码 | 语言 | 优先级 | 市场范围 | 人口 | GDP/人均 |
|------|------|--------|----------|------|----------|
| `ko` | 한국어 | P0 | 韩国 | 5100万 | $32K |

#### Eastern Europe (增长市场)
| 代码 | 语言 | 优先级 | 市场范围 | 人口 | GDP/人均 |
|------|------|--------|----------|------|----------|
| `ru` | Русский | P1 | 俄罗斯/东欧 | 2.6亿 | $15K |
| `pl` | Polski | P2 | 波兰 | 3800万 | $18K |

---

## 二、技术实施步骤

### Step 1: 更新 routing.ts

```typescript
// i18n/routing.ts
export const LOCALES = ['en', 'zh', 'ja', 'es', 'fr', 'ko', 'pt', 'de', 'it', 'nl', 'ru', 'pl']
export const DEFAULT_LOCALE = 'en'
export const LOCALE_NAMES: Record<string, string> = {
  'en': 'English',
  'zh': '中文',
  'ja': '日本語',
  'es': 'Español',
  'fr': 'Français',
  'ko': '한국어',
  'pt': 'Português',
  'de': 'Deutsch',
  'it': 'Italiano',
  'nl': 'Nederlands',
  'ru': 'Русский',
  'pl': 'Polski',
};
export const LOCALE_TO_HREFLANG: Record<string, string> = {
  'en': 'en-US',
  'zh': 'zh-CN',
  'ja': 'ja-JP',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'ko': 'ko-KR',
  'pt': 'pt-BR',
  'de': 'de-DE',
  'it': 'it-IT',
  'nl': 'nl-NL',
  'ru': 'ru-RU',
  'pl': 'pl-PL',
};
```

### Step 2: 创建翻译文件结构

```
i18n/messages/
├── en/
│   ├── common.json
│   ├── Landing.json
│   ├── NanoBananaVideo.json
│   └── NotFound.json
├── zh/
│   └── (same structure)
├── ja/
│   └── (same structure)
├── es/      # 新建
├── fr/      # 新建
├── ko/      # 新建
├── pt/      # 新建
├── de/      # 新建
├── it/      # 新建
├── nl/      # 新建
├── ru/      # 新建
└── pl/      # 新建
```

### Step 3: 翻译内容文件清单

每个新语言需要翻译以下文件：

| 文件 | 行数 | 说明 |
|------|------|------|
| `common.json` | ~350 行 | 通用文本（Header/Footer/UI） |
| `Landing.json` | ~600 行 | 落地页文案 |
| `NanoBananaVideo.json` | ~550 行 | 功能介绍文案 |
| `NotFound.json` | ~20 行 | 404 页面 |

**单语言约 1,500 行翻译**

---

## 三、翻译策略

### 3.1 AI 翻译 + 人工校对流程

```bash
# 使用 AI 批量翻译
pnpm tsx scripts/translate-all.ts [targetLocale]
```

### 3.2 各语言翻译注意事项

| 语言 | 注意事项 |
|------|----------|
| `es` | 拉美 vs 西班牙差异，使用中性拉丁美洲西班牙语 |
| `fr` | 法语有 formal/informal 区分，使用 formal (vous) |
| `de` | 德语复合词长，需要 UI 空间测试 |
| `it` | 性数配合复杂，AI 翻译需仔细校对 |
| `nl` | 荷兰语句子结构特殊，注意校对 |
| `pt` | 巴葡 vs 葡葡，使用巴西葡萄牙语 (pt-BR) |
| `ko` | 敬语系统，使用正式敬语 (존댓말) |
| `ru` | 语法格复杂，需仔细校对 |
| `pl` | 语法格和性别极复杂，建议人工校对 |

### 3.3 不可翻译的保留字段

以下字段保持英文，不翻译：
- 品牌名称: "Nano Banana Video"
- 技术术语: "Sora", "Veo", "Flux", "Midjourney"
- 模型名称: "GPT-4", "DALL-E", "Stable Diffusion"
- URL 路径: `/video-generation`, `/pricing`

---

## 四、UI/UX 适配

### 4.1 字体考虑

| 语言 | 字体家族 | 备选 |
|------|----------|------|
| Latin scripts | Inter/System UI | - |
| `ko` | Noto Sans KR | Pretendard |
| `ru` | Inter (支持 Cyrillic) | Roboto |
| `pl` | Inter (支持 Latin Extended) | - |

```css
/* app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap');
```

### 4.2 文本长度差异

不同语言文本长度差异约 ±30%，需要测试：

| 组件 | 需测试 |
|------|--------|
| 导航菜单 | ✅ 长文本折叠 |
| CTA 按钮 | ✅ 按钮宽度 |
| Pricing 表格 | ✅ 单元格溢出 |
| 卡片标题 | ✅ 标题换行 |

### 4.3 日期/数字格式

| 语言 | 日期格式 | 数字格式 |
|------|----------|----------|
| en, es, pt, nl, pl, ru | MM/DD/YYYY | 1,234.56 |
| de, it | DD.MM.YYYY | 1.234,56 |
| fr | DD/MM/YYYY | 1 234,56 (thin space) |
| zh, ja | YYYY/MM/DD | 1,234.56 |
| ko | YYYY.MM.DD | 1,234.56 |

---

## 五、SEO 配置

### 5.1 hreflang 标签

```typescript
// app/[locale]/layout.tsx
export function generateMetadata({ params }: { params: { locale: string } }) {
  return {
    alternates: {
      canonical: `https://nanobananavideo.net/${params.locale}`,
      languages: {
        'en': 'https://nanobananavideo.net/en',
        'zh': 'https://nanobananavideo.net/zh',
        'ja': 'https://nanobananavideo.net/ja',
        'es': 'https://nanobananavideo.net/es',
        'fr': 'https://nanobananavideo.net/fr',
        'ko': 'https://nanobananavideo.net/ko',
        'pt': 'https://nanobananavideo.net/pt',
        'de': 'https://nanobananavideo.net/de',
        'it': 'https://nanobananavideo.net/it',
        'nl': 'https://nanobananavideo.net/nl',
        'ru': 'https://nanobananavideo.net/ru',
        'pl': 'https://nanobananavideo.net/pl',
      },
    },
  };
}
```

### 5.2 OG 图片

各语言需要独立 OG 图片：

| 文件 | 尺寸 |
|------|------|
| `og.png` | 1200x630 (en) |
| `og_zh.png` | 1200x630 (zh) |
| `og_ja.png` | 1200x630 (ja) |
| `og_es.png` | 1200x630 (es) |
| `og_fr.png` | 1200x630 (fr) |
| `og_ko.png` | 1200x630 (ko) |
| `og_pt.png` | 1200x630 (pt) |
| `og_de.png` | 1200x630 (de) |
| `og_it.png` | 1200x630 (it) |
| `og_nl.png` | 1200x630 (nl) |
| `og_ru.png` | 1200x630 (ru) |
| `og_pl.png` | 1200x630 (pl) |

---

## 六、实施检查清单

### Phase 1: 准备 (P0 语言)
- [ ] 更新 `i18n/routing.ts` 添加 es, fr, ko, pt
- [ ] 创建 `i18n/messages/{es,fr,ko,pt}/` 目录
- [ ] 复制 en 翻译文件到新语言目录
- [ ] 执行 AI 翻译脚本
- [ ] 人工校对 AI 翻译质量
- [ ] 测试 UI 文本显示正常

### Phase 2: 补充 (P1 语言)
- [ ] 添加 de, it, ru
- [ ] 重复上述翻译流程
- [ ] 重点校对 de/ru 的长文本显示

### Phase 3: 完善 (P2 语言)
- [ ] 添加 nl, pl
- [ ] 完成所有 12 语言翻译

### Phase 4: SEO 优化
- [ ] 配置 hreflang 标签
- [ ] 生成各语言 OG 图片
- [ ] 提交各语言 sitemap 到 Google

---

## 七、脚本工具

### 翻译脚本
```bash
# scripts/translate-all.ts
# 用途: 从 en 翻译到目标语言，生成完整翻译文件
pnpm tsx scripts/translate-all.ts es
```

### 检查脚本
```bash
# scripts/check-i18n.ts
# 用途: 检查翻译文件完整性（是否有缺失的 key）
pnpm tsx scripts/check-i18n.ts
```

### OG 图片生成脚本
```bash
# scripts/generate-og-images.ts
# 用途: 批量生成各语言 OG 图片
pnpm tsx scripts/generate-og-images.ts
```

---

## 八、预计工作量

| 阶段 | 语言数 | 翻译行数 | AI 翻译 | 人工校对 | UI 测试 |
|------|--------|----------|---------|----------|---------|
| Phase 1 | 4 | 6,000 | 1h | 4h | 1h |
| Phase 2 | 3 | 4,500 | 1h | 3h | 1h |
| Phase 3 | 2 | 3,000 | 0.5h | 2h | 0.5h |

**总计: ~14 小时**

---

## 九、上线后验证

1. **流量验证**: Google Search Console 检查各语言索引
2. **转化验证**: 各语言试用→付费转化率
3. **技术验证**: Lighthouse 分数保持 90+
4. **内容验证**: 每月检查翻译准确性，更新 AI 相关术语

---

*文档版本: v1.0*
*最后更新: 2026-01-31*
