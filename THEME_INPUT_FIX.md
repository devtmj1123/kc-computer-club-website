# Light Theme Input Text Color Fix

## 问题描述

在浅色主题下，输入框（input/textarea/select）的背景色是白色 (#ffffff)，但文本颜色无法清晰显示，导致用户无法看清输入的内容。

### 症状
- 浅色主题中，textbox 背景为白色
- 文字也显示为白色或无法看清
- 导致用户体验差

## 根本原因

在 `src/app/globals.css` 中：

1. **CSS 变量不完整**
   - 只定义了 `--input-bg` 和 `--input-border`
   - 但没有定义 `--input-text` 变量来控制文本颜色

2. **浅色主题 CSS 规则缺失**
   ```css
   .light input,
   .light textarea,
   .light select {
     background-color: var(--input-bg);  /* 白色 */
     border-color: var(--input-border);
     /* ❌ 缺少 color 属性 */
   }
   ```

3. **文本颜色继承混乱**
   - 深色主题显式定义了 `color: var(--foreground)`
   - 浅色主题没有定义，导致颜色继承不正确

## 解决方案

### 1️⃣ 添加 CSS 变量

**浅色主题**（第 47-51 行）：
```css
--input-text: #111814;  /* ✅ 深色文本用于亮背景 */
```

**深色主题**（第 90-96 行）：
```css
--input-text: #ffffff;  /* ✅ 浅色文本用于暗背景 */
```

### 2️⃣ 更新 CSS 规则

**浅色主题输入框**（第 334-341 行）：
```css
.light input,
.light textarea,
.light select {
  background-color: var(--input-bg);
  border-color: var(--input-border);
  color: var(--input-text);  /* ✅ 添加文本颜色 */
}
```

**学生页面输入框**（第 648-655 行）：
```css
.student-layout input,
.student-layout textarea,
.student-layout select {
  background-color: var(--input-bg);
  border-color: var(--input-border);
  color: var(--input-text);  /* ✅ 改为使用 input-text 而不是 foreground */
}
```

## 修改效果

| 主题 | 背景色 | 文本色 | 对比度 | 效果 |
|------|--------|--------|--------|------|
| 浅色 | #ffffff | #111814 | ✅ 优秀 | 文字清晰可见 |
| 深色 | #102219 | #ffffff | ✅ 优秀 | 文字清晰可见 |

## 代码变更统计

```
src/app/globals.css
  - 2 个新 CSS 变量（--input-text）
  - 2 个 CSS 规则更新（添加 color 属性）
```

## 验证

✅ TypeScript 类型检查通过  
✅ 没有 Lint 错误  
✅ 向后兼容  

