# skill: producthunt-daily 

## 需求
收集每天 Product Hunt 与 AI Agent 相关的创新产品并进行评分排序

## 要做什么
- 抓 https://www.producthunt.com/ 中 Top10 的产品
- 输出 JSON 数组，字段[name, description, upvote, reviews_star, website_url]

## 不做什么
- 不调用 API，直接走 HTML
- 不存数据库，存 JSON 文件

## 边界 & 验收
- 单词执行 < 10s
- 失败时抛出异常
- 输出通过 jsonschema 验证

## 如何验证
跑 `skill-invoke producthunt-daily` 后 · 检查输出是 JSON 且字段完整