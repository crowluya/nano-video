# 多语言扩展 - 技术方案

> 本文档描述如何实现 spec.md 中的需求

---

## 元信息

| 字段 | 值 |
|------|-----|
| **基于规范** | spec.md v1.0 |
| **创建日期** | 2026-01-31 |
| **负责人** | AI Assistant |
| **预计工时** | ~14 小时 |
| **状态** | 设计中 |

---

## 架构设计

### 目录结构

```
i18n/
├── request.ts          # next-intl 请求配置（保持不变）
├── routing.ts          # 语言路由配置（需修改）
└── messages/
    ├── en/             # ✅ 已有
    │   ├── common.json
    │   ├── Landing.json
    │   ├── NanoBananaVideo.json
    │   └── NotFound.json
    ├── zh/             # ✅ 已有
    ├── ja/             # ✅ 已有
    ├── es/             # 🆕 新建
    ├── fr/             # 🆕 新建
    ├── ko/             # 🆕 新建
    ├── pt/             # 🆕 新建
    ├── de/             # 🆕 新建
    ├── it/             # 🆕 新建
    ├── nl/             # 🆕 新建
    ├── ru/             # 🆕 新建
    └── pl/             # 🆕 新建

public/images/brand/
├── og.png              # ✅ 已有
├── og_zh.png           # ✅ 已有
├── og_ja.png           # ✅ 已有
├── og_es.png           # 🆕 新建
├── og_fr.png           # 🆕 新建
├── og_ko.png           # 🆕 新建
├── og_pt.png           # 🆕 新建
├── og_de.png           # 🆕 新建
├── og_it.png           # 🆕 新建
├── og_nl.png           # 🆕 新建
├── og_ru.png           # 🆕 新建
└── og_pl.png           # 🆕 新建

scripts/
├── translate-all.ts    # 🆕 AI 翻译脚本
├── check-i18n.ts       # 🆕 翻译完整性检查
└── generate-og.ts      # 🆕 OG 图片生成
```

---

## 技术方案

### 1. 语言配置更新

**文件**: `i18n/routing.ts`

```typescript
// 更新 LOCALES 数组
export const LOCALES = [
  'en', 'zh', 'ja',      // 已有
  'es', 'fr', 'ko', 'pt', // Phase 1
  'de', 'it', 'ru',       // Phase 2
  'nl', 'pl',             // Phase 3
] as const;

export const DEFAULT_LOCALE = 'en' as const;

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

**影响**: 全局语言路由，需要测试所有页面

---

### 2. 翻译文件生成

**方案**: AI 翻译 + 人工校对

**流程**:
1. 创建目标语言目录结构
2. 使用 AI 批量翻译英文原文
3. 人工校对关键页面
4. 运行完整性检查

**脚本**: `scripts/translate-all.ts`

```typescript
import { readdir, readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';

const SOURCE_LOCALE = 'en';
const TARGET_LOCALES = ['es', 'fr', 'ko', 'pt', 'de', 'it', 'nl', 'ru', 'pl'];

async function translateJSON(content: unknown, targetLang: string): Promise<unknown> {
  // 调用 AI API 进行翻译
  // 保持 JSON 结构，只翻译字符串值
  // 跳过品牌名称、技术术语
}

async function main() {
  const files = await glob('i18n/messages/en/*.json');

  for (const locale of TARGET_LOCALES) {
    for (const file of files) {
      const sourceContent = await readFile(file, 'utf-8');
      const targetContent = await translateJSON(sourceContent, locale);
      const targetPath = file.replace('/en/', `/${locale}/`);
      await writeFile(targetPath, JSON.stringify(targetContent, null, 2));
    }
  }
}
```

---

### 3. 翻译完整性检查

**文件**: `scripts/check-i18n.ts`

```typescript
import { readdir, readFile } from 'fs/promises';
import { glob } from 'glob';

async function checkCompleteness() {
  const enFiles = await glob('i18n/messages/en/*.json');
  const locales = ['en', 'zh', 'ja', 'es', 'fr', 'ko', 'pt', 'de', 'it', 'nl', 'ru', 'pl'];

  // 读取英文 key 集合
  const enKeys = new Map<string, Set<string>>();
  for (const file of enFiles) {
    const content = await readFile(file, 'utf-8');
    const keys = extractAllKeys(JSON.parse(content));
    enKeys.set(file, keys);
  }

  // 检查每种语言
  for (const locale of locales) {
    if (locale === 'en') continue;
    console.log(`\n检查 ${locale}:`);

    for (const [file, expectedKeys] of enKeys) {
      const targetPath = file.replace('/en/', `/${locale}/`);
      const content = await readFile(targetPath, 'utf-8');
      const actualKeys = extractAllKeys(JSON.parse(content));

      const missing = [...expectedKeys].filter(k => !actualKeys.has(k));
      if (missing.length > 0) {
        console.log(`  ❌ ${file}: 缺少 ${missing.length} 个 key`);
        missing.forEach(k => console.log(`    - ${k}`));
      } else {
        console.log(`  ✅ ${file}`);
      }
    }
  }
}
```

---

### 4. 字体配置

**文件**: `app/globals.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap');

:root {
  --font-sans: 'Inter', 'Noto Sans KR', system-ui, sans-serif;
}

body {
  font-family: var(--font-sans);
}
```

**说明**:
- Inter 字体支持 Latin + Cyrillic (ru, pl, nl, de, it, fr, es, pt, en)
- Noto Sans KR 支持韩语
- 中日语使用系统字体

---

### 5. SEO 配置

**文件**: `app/[locale]/layout.tsx`

```typescript
export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations('Metadata');

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
    openGraph: {
      images: [{
        url: `/images/brand/og_${params.locale}.png`,
        width: 1200,
        height: 630,
      }],
    },
  };
}
```

---

### 6. OG 图片生成

**文件**: `scripts/generate-og.ts`

```typescript
import sharp from 'sharp';
import { promises as fs } from 'fs';

const LOCALES = ['en', 'zh', 'ja', 'es', 'fr', 'ko', 'pt', 'de', 'it', 'nl', 'ru', 'pl'];

// 文字映射
const TITLES: Record<string, string> = {
  'en': 'Nano Banana Video',
  'zh': '香蕉视频',
  'ja': 'バナナビデオ',
  'es': 'Nano Banana Video',
  'fr': 'Nano Banana Video',
  'ko': '나노 바나나 비디오',
  'pt': 'Nano Banana Video',
  'de': 'Nano Banana Video',
  'it': 'Nano Banana Video',
  'nl': 'Nano Banana Video',
  'ru': 'Нано Банана Видео',
  'pl': 'Nano Banana Video',
};

async function generateOG(locale: string) {
  // 使用 kie.ai 或本地 sharp 合成
  // 背景 + 品牌名称 + slogan
}
```

---

### 7. 语言切换器组件

**文件**: `components/language-selector.tsx`

```typescript
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LOCALES, LOCALE_NAMES, DEFAULT_LOCALE } from '@/i18n/routing';

export function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <select onChange={(e) => switchLocale(e.target.value)}>
      {LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_NAMES[locale]}
        </option>
      ))}
    </select>
  );
}
```

---

## 实施顺序

### Phase 1: 基础设施（2h）
1. 更新 `i18n/routing.ts`
2. 创建所有语言目录结构
3. 配置字体
4. 创建翻译脚本
5. 创建检查脚本

### Phase 2: 翻译生成（6h）
6. 执行 AI 翻译（es, fr, ko, pt）
7. 人工校对 Phase 1 翻译
8. 执行 AI 翻译（de, it, ru）
9. 人工校对 Phase 2 翻译
10. 执行 AI 翻译（nl, pl）
11. 人工校对 Phase 3 翻译
12. 运行完整性检查

### Phase 3: SEO 优化（3h）
13. 生成所有 OG 图片
14. 更新 layout.tsx metadata
15. 配置 hreflang 标签
16. 更新 sitemap

### Phase 4: 测试验证（3h）
17. 手动测试所有语言切换
18. 测试 UI 文本显示
19. 测试 SEO 标签
20. Lighthouse 测试
21. 修复问题

---

## 测试策略

### 单元测试
- 翻译完整性检查脚本
- 语言代码验证

### 集成测试
- 语言切换功能
- 路由重定向

### E2E 测试
- 手动测试清单
  - [ ] 每种语言首页正常显示
  - [ ] 语言切换器工作正常
  - [ ] URL 结构正确
  - [ ] SEO 标签正确

---

## 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| AI 翻译质量 | 人工校对关键页面（Landing, Pricing） |
| UI 文本溢出 | 增加长文本测试，使用 CSS `text-overflow` |
| 字体加载失败 | 提供系统字体回退 |
| 缺少翻译 key | 自动检查脚本 + CI 集成 |

---

## 回滚计划

如果出现问题：
1. 恢复 `i18n/routing.ts` 到 3 语言
2. 删除新语言目录
3. 重新部署

---

*方案版本: v1.0*
*最后更新: 2026-01-31*
