# 汎用UIコンポーネントAPIリファレンス

本ドキュメントは shared/ui レイヤーの汎用UIコンポーネントのAPI仕様を記載します。

---

## IconContainer

**ファイルパス**: `web/src/shared/ui/icon-container/IconContainer.tsx`

**用途**: アイコンを統一されたコンテナで表示するコンポーネント。

### Props

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `size` | "sm" \| "md" \| "lg" \| "xl" \| "2xl" | "md" | コンテナのサイズ |
| `rounded` | "sm" \| "md" \| "lg" | "md" | 角の丸み |
| `bgColor` | "brand" \| "accent" \| "positive" \| "negative" \| "surface" \| "gradient-brand" \| "gradient-accent" \| "white-semi" \| "transparent" | "surface" | 背景色 |
| `className` | string | - | 追加のTailwindクラス |
| `children` | ReactNode | - | アイコン要素（必須） |

### バリアント詳細

#### size

| 値 | 実際のクラス | サイズ |
|----|------------|--------|
| sm | `w-8 h-8` | 32px × 32px |
| md | `w-10 h-10` | 40px × 40px |
| lg | `w-12 h-12` | 48px × 48px |
| xl | `w-14 h-14` | 56px × 56px |
| 2xl | `w-16 h-16` | 64px × 64px |

#### rounded

| 値 | 実際のクラス |
|----|------------|
| sm | `rounded-lg` |
| md | `rounded-xl` |
| lg | `rounded-2xl` |

#### bgColor

| 値 | 実際のクラス | 用途 |
|----|------------|------|
| brand | `bg-brand-100` | ブランドカラー（水色系） |
| accent | `bg-accent-100` | アクセントカラー（紫系） |
| positive | `bg-positive-100` | ポジティブ（緑系） |
| negative | `bg-negative-100` | ネガティブ（赤系） |
| surface | `bg-surface-tertiary` | ニュートラル（グレー系） |
| gradient-brand | `bg-gradient-brand` | ブランドグラデーション |
| gradient-accent | `bg-gradient-accent` | アクセントグラデーション |
| white-semi | `bg-white/20` | 半透明白 |
| transparent | `bg-transparent` | 透明 |

### 使用例

#### 基本的な使用

```tsx
import { IconContainer } from "@/shared/ui/icon-container"
import { Bell } from "lucide-react"

<IconContainer size="md" rounded="md" bgColor="accent">
  <Bell className="w-5 h-5 text-accent-600" />
</IconContainer>
```

#### グラデーション背景

```tsx
<IconContainer size="lg" rounded="lg" bgColor="gradient-brand">
  <span className="text-2xl">🤖</span>
</IconContainer>
```

#### カスタムクラスの追加

```tsx
<IconContainer
  size="xl"
  rounded="lg"
  bgColor="brand"
  className="mx-auto shadow-lg"
>
  <TrendingUp className="w-8 h-8" />
</IconContainer>
```

---

## AlertBox

**ファイルパス**: `web/src/shared/ui/alert-box/AlertBox.tsx`

**用途**: 情報・警告・エラーなどの通知ボックスを表示するコンポーネント。

### Props

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `variant` | "info" \| "success" \| "warning" \| "danger" \| "neutral" | "neutral" | 通知の種類（色） |
| `size` | "compact" \| "default" \| "large" | "default" | ボックスのサイズ |
| `className` | string | - | 追加のTailwindクラス |
| `children` | ReactNode | - | 内容（必須） |
| `as` | keyof JSX.IntrinsicElements | "div" | 使用するHTML要素 |

### バリアント詳細

#### variant

| 値 | 背景色 | ボーダー色 | 用途 |
|----|--------|-----------|------|
| info | `bg-blue-500/5` | `border-blue-500/10` | 情報通知 |
| success | `bg-green-500/5` | `border-green-500/10` | 成功通知 |
| warning | `bg-amber-500/5` | `border-amber-500/10` | 警告通知 |
| danger | `bg-red-500/5` | `border-red-500/10` | エラー通知 |
| neutral | `bg-surface-tertiary` | `border-(--border-primary)` | ニュートラル |

#### size

| 値 | パディング | 角の丸み |
|----|----------|----------|
| compact | `p-3` | `rounded-lg` |
| default | `p-4` | `rounded-xl` |
| large | `p-6` | `rounded-2xl` |

### 使用例

#### 基本的な使用（情報通知）

```tsx
import { AlertBox } from "@/shared/ui/alert-box"
import { IconContainer } from "@/shared/ui/icon-container"
import { Info } from "lucide-react"

<AlertBox variant="info" size="default">
  <div className="flex items-start gap-3">
    <IconContainer size="md" rounded="sm" bgColor="brand">
      <Info className="w-5 h-5" />
    </IconContainer>
    <div>
      <p className="font-medium mb-1">お知らせ</p>
      <p className="text-sm">新機能がリリースされました。</p>
    </div>
  </div>
</AlertBox>
```

#### 成功通知

```tsx
<AlertBox variant="success" size="default">
  <div className="flex items-center gap-2 text-green-700">
    <CheckCircle size={20} />
    <span className="font-medium">保存に成功しました</span>
  </div>
</AlertBox>
```

#### エラー通知

```tsx
<AlertBox variant="danger" size="default">
  <div className="flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
    <div>
      <p className="font-medium text-red-700 mb-1">エラーが発生しました</p>
      <p className="text-sm text-red-600">入力内容をご確認ください。</p>
    </div>
  </div>
</AlertBox>
```

#### セマンティックHTML要素として使用

```tsx
<AlertBox variant="warning" size="large" as="section">
  <h3 className="font-bold text-amber-700 mb-2">重要な注意事項</h3>
  <p className="text-sm">投資判断はご自身の責任で行ってください。</p>
</AlertBox>
```

---

## SectionHeader

**ファイルパス**: `web/src/shared/ui/section-header/SectionHeader.tsx`

**用途**: セクション見出しを統一的に表示するコンポーネント。

### Props

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `icon` | ReactNode | - | 見出しの左側に表示するアイコン |
| `title` | string | - | 見出しテキスト（必須） |
| `titleVariant` | "L_bold" \| "M_bold" \| "S_bold" | "L_bold" | タイトルのサイズ |
| `variant` | "default" \| "info" \| "success" \| "warning" \| "danger" \| "brand" | "default" | テキストカラー |
| `showBorder` | boolean | false | 下線を表示するか |
| `className` | string | - | 追加のTailwindクラス |

### バリアント詳細

#### variant（色）

| 値 | テキストカラー | 用途 |
|----|--------------|------|
| default | `text-foreground` | デフォルト（黒/白） |
| info | `text-blue-600` | 情報セクション |
| success | `text-green-600` | 成功セクション |
| warning | `text-amber-600` | 警告セクション |
| danger | `text-red-600` | エラーセクション |
| brand | `text-brand-600` | ブランドセクション |

#### titleVariant

| 値 | フォントサイズ |
|----|-------------|
| L_bold | text-lg (18px) |
| M_bold | text-base (16px) |
| S_bold | text-sm (14px) |

### 使用例

#### 基本的な使用

```tsx
import { SectionHeader } from "@/shared/ui/section-header"
import { BookOpen } from "lucide-react"

<SectionHeader
  icon={<BookOpen size={24} />}
  title="基礎知識"
  variant="info"
/>
```

#### 下線付き

```tsx
<SectionHeader
  icon={<TrendingUp size={24} />}
  title="市場分析"
  variant="success"
  showBorder={true}
/>
```

#### アイコンなし

```tsx
<SectionHeader
  title="プロフィール設定"
  titleVariant="M_bold"
  variant="default"
/>
```

---

## 共通のベストプラクティス

### 1. cn()でクラス名をマージ

すべてのコンポーネントは `className` propsをサポートしており、`cn()`ユーティリティで既存クラスとマージされます。

```tsx
<IconContainer
  size="md"
  bgColor="brand"
  className="shadow-lg hover:scale-105 transition-transform"
>
  <Icon />
</IconContainer>
```

### 2. HTML属性の透過

すべてのコンポーネントは `React.HTMLAttributes` を継承しているため、標準のHTML属性を使用できます。

```tsx
<AlertBox
  variant="info"
  onClick={() => console.log("clicked")}
  data-testid="alert-box"
  aria-label="情報通知"
>
  内容
</AlertBox>
```

### 3. TypeScript型安全性

CVAの `VariantProps` により、バリアント値は型チェックされます。

```tsx
// ✅ 正しい
<IconContainer size="md" bgColor="brand" />

// ❌ コンパイルエラー
<IconContainer size="xl-extra" bgColor="invalid-color" />
```

### 4. コンポーネントの組み合わせ

異なるコンポーネントを組み合わせて複雑なUIを構築できます。

```tsx
<AlertBox variant="info" size="default">
  <div className="flex items-start gap-3">
    <IconContainer size="md" rounded="sm" bgColor="brand">
      <Info className="w-5 h-5 text-brand-600" />
    </IconContainer>
    <div>
      <SectionHeader
        title="重要なお知らせ"
        titleVariant="M_bold"
        variant="info"
      />
      <p className="text-sm mt-2">内容...</p>
    </div>
  </div>
</AlertBox>
```
