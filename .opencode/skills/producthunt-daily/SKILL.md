---
name: producthunt-daily
description: Fetch Product Hunt top 10 products via GraphQL API with votes and ratings. Use when collecting daily Product Hunt data, tracking launches, or getting trending products.
---

# ProductHunt Daily

## SOP

### 1. Setup (首次使用)

```bash
cd .opencode/skills/producthunt-daily
echo "YOUR_TOKEN" > .token  # 从 https://www.producthunt.com/v2/oauth/applications 获取
npm install
```

### 2. Fetch

```bash
npm run fetch
```

输出 `producthunt-daily.json`，格式：

```json
[
  {
    "name": "Product Name",
    "description": "Tagline",
    "upvote": 293,
    "reviews_star": 4.98,
    "website_url": "https://..."
  }
]
```

### 3. Validate

```bash
npm test
```

## Commands

| 命令 | 说明 |
|------|------|
| `npm run fetch` | 获取 Top10 产品 |
| `npm run validate` | 验证输出文件 |
| `npm test` | 运行冒烟测试 |

## Constraints

- 执行时间 < 5s
- 失败时抛异常
- 输出符合 JSON Schema
