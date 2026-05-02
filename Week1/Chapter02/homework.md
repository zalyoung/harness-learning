# Homework：AGENTS.md 实践与对比分析

## 任务 1：为项目编写 AGENTS.md

> **原始要求：** 选择一个你正在做的项目（或创建一个新项目），按照 6 个组成部分的框架，编写一份完整的 AGENTS.md。至少包含：项目概述、技术栈、编码规范、项目结构。

编写的 AGENTS.md 完整内容如下：

```markdown
# AGENTS.md

## 项目概述

AI 知识库助手 —— 自动化技术情报管线。每日从 GitHub Trending 和 Hacker News
抓取 AI/LLM/Agent 领域的热门项目与讨论，由大模型进行语义分析、去重和摘要生成，
最终输出结构化的知识条目（JSON）。分析结果通过 Telegram 和飞书双渠道推送，
帮助团队高效追踪 AI 领域前沿动态。

## 技术栈

- **运行时**：Python 3.12
- **AI 编排**：OpenCode（Agent 框架）+ 国产大模型
- **工作流引擎**：LangGraph
- **多渠道分发**：OpenClaw（统一消息推送层）
- **数据存储**：本地 JSON 文件（knowledge/raw/ → knowledge/articles/）
- **虚拟环境和包管理**：必须使用虚拟环境运行项目，禁止直接使用系统级 Python 解释器。
  创建命令：`python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`。

## 编码规范

- 严格遵循 [PEP 8](https://peps.python.org/pep-0008/)。
- 命名约定：变量/函数/方法使用 `snake_case`，类名使用 `PascalCase`，
  常量使用 `UPPER_SNAKE_CASE`。
- 所有公共函数/方法必须包含 [Google 风格 docstring]
  (https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings)
  （含 `Args`、`Returns`、`Raises` 段落）。
- 禁止使用裸 `print()` 输出日志，统一使用 `logging` 模块。
- 类型注解：所有函数签名必须包含完整的类型标注。
- 每行不超过 100 字符，缩进使用 4 个空格。

## 项目结构

\```
ai-knowledge-base/
├── AGENTS.md                    # 本文件
├── .opencode/
│   ├── agents/                  # Agent 角色定义（.yml 或 .md）
│   ├── skills/                  # Skill 定义（采集/分析/发布等）
│   ├── package.json             # OpenCode 插件依赖
│   └── .gitignore
└── knowledge/
    ├── raw/                     # 原始采集数据（未处理）
    └── articles/                # AI 分析后的结构化知识条目
\```

## 知识条目 JSON 格式

每一条经过分析的知识条目存储为一个独立的 JSON 文件，字段定义如下：

\```json
{
  "id": "c8a7b3f1-4d2e-4a9b-b8c6-1f3e5a7b9d0c",
  "title": "LangGraph v0.3 发布：支持多 Agent 协同",
  "source_url": "https://github.com/langchain-ai/langgraph/releases/tag/v0.3.0",
  "source_type": "github_trending",
  "summary": "LangGraph 在 v0.3 中引入了 SupervisorAgent 模式……",
  "tags": ["langgraph", "multi-agent", "orchestration"],
  "published_at": "2026-05-02T08:30:00Z",
  "fetched_at": "2026-05-02T09:00:00Z",
  "analyzed_at": "2026-05-02T09:15:00Z",
  "status": "published"
}
\```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `str` | UUID v4，全局唯一标识 |
| `title` | `str` | 中文标题（由 AI 生成，准确概括内容） |
| `source_url` | `str` | 原始来源链接 |
| `source_type` | `str` | 来源类型，枚举值：`github_trending` / `hackernews` |
| `summary` | `str` | AI 生成的摘要（100-300 字，突出技术亮点和适用场景） |
| `tags` | `List[str]` | 标签列表（3-8 个，小写英文） |
| `published_at` | `str` | 原文发布时间（ISO 8601） |
| `fetched_at` | `str` | 采集时间（ISO 8601） |
| `analyzed_at` | `str` | AI 分析完成时间（ISO 8601） |
| `status` | `str` | 状态，枚举值：`draft` / `published` / `archived` |

## Agent 角色概览

| 角色名称 | 文件位置 | 职责 | 输入 | 输出 |
|---------|---------|------|------|------|
| **采集 Agent** | `.opencode/agents/collector.` | 调用 GitHub Trending API
  和 Hacker News API 抓取当日热门内容，按 AI/LLM/Agent 关键词过滤 | 无（定时触发）
  | `knowledge/raw/YYYY-MM-DD.json` |
| **分析 Agent** | `.opencode/agents/analyzer.` | 对原始数据进行去重（基于 URL）、
  语义分析、摘要生成、标签分类 | `knowledge/raw/YYYY-MM-DD.json`
  | `knowledge/articles/{id}.json` |
| **发布 Agent** | `.opencode/agents/publisher.` | 从 `knowledge/articles/`
  读取 `status: published` 的条目，通过 OpenClaw 分发至 Telegram 和飞书
  | `knowledge/articles/*.json` | Telegram 消息 + 飞书卡片消息 |

## 红线（绝对禁止）

1. **禁止将凭证写入代码**。API Key、Webhook URL、Bot Token 等敏感信息
   必须通过环境变量或 `.env` 文件加载，且 `.env` 文件不得提交到 Git。
2. **禁止跳过去重逻辑**。在写入 `knowledge/articles/` 之前，必须基于
   `source_url` 检查是否已存在，避免重复存储和分析。
3. **禁止对同一来源发起高频请求**。采集 Agent 对各 API 的请求间隔不得
   小于 30 秒，遵守 Rate Limiting 规范。
4. **禁止直接修改 `knowledge/articles/` 中的文件**。所有对知识条目的修改
   必须通过分析 Agent 完成，以保持数据一致性和审计追溯。
5. **禁止在生产环境中使用裸 `print()` 或 `sys.stdout.write()` 输出日志**。
   统一使用 `logging` 模块，日志级别按需配置。
6. **禁止在未经人工确认的情况下自动发布**。发布 Agent 在执行分发前必须生成
   预览摘要，由人工确认后再推送至外部渠道。
```

---

## 任务 2：对比实验 —— 有 Memory vs 无 Memory

> **原始要求：** 在 OpenCode 中，分别在有 AGENTS.md 和删除 AGENTS.md 的情况下，给出同样的编程指令（如"写一个用户登录接口"），对比两次产出的代码质量、代码风格和规范遵守程度。截图记录差异。

### 实验设计

分别准备两份风格迥异的 `github_api.py`：
- **`utils/github_api.py`**：在提供了完整 AGENTS.md（含编码规范）的情况下，由 Agent 生成的版本。
- **`utils/github_api_new.py`**：模拟在无 AGENTS.md（或未遵守规范）的情况下产出的代码。

两份代码实现相同功能：调用 GitHub API 获取仓库基本信息。

### 实验结果：逐项对比

| 规范要求 | `github_api.py`（有 Memory） | `github_api_new.py`（无 Memory） |
|---|---|---|
| Google 风格 docstring（Args/Returns/Raises） | ✅ 第13-25行完整 | ❌ 无 docstring |
| 禁止裸 `print()`，统一 `logging` | ✅ 使用 `logger.exception()` | ❌ 第12行使用 `print()` |
| 完整类型注解 | ✅ `Optional[dict]` | ✅ 有类型注解 |
| 常量命名 `UPPER_SNAKE_CASE` | ✅ `GITHUB_API_BASE` | ❌ 无模块常量 |
| 行宽 / 缩进 | ✅ | ✅ |
| 异常处理 | ✅ `try/except` | ❌ 仅检查状态码 |

### 关键差异分析

#### 差异 1：Docstring 缺失（最严重违规）

`github_api.py` 包含完整的 Google 风格文档字符串，涵盖 `Args`、`Returns`、`Raises` 三个必需段落，任何开发者或 AI 阅读时都能立即理解函数的输入、输出和异常行为。

`github_api_new.py` 完全缺失 docstring，读者只能通过阅读函数体推测行为。

#### 差异 2：裸 `print()` 触碰红线

AGENTS.md 红线第5条明确禁止使用 `print()` 输出日志。`github_api.py` 使用 `logging` 模块的 `logger.exception()` 规范记录异常，`github_api_new.py` 却使用裸 `print()`：

```python
# github_api_new.py —— 违规
print(f"请求失败: {resp.status_code} {resp.reason}")
```

```python
# github_api.py —— 规范
logger.exception("Failed to fetch repo info for %s/%s", owner, repo)
```

#### 差异 3：异常处理缺失

`github_api.py` 用 `try/except` 兜底网络相关异常（`URLError`、`OSError`），确保函数在连接超时、DNS 解析失败等场景下返回 `None` 而非崩溃。

`github_api_new.py` 仅检查响应状态码，对连接超时、DNS 解析失败等异常无任何保护，`requests.get()` 可能直接抛出未处理异常。

#### 差异 4：常量管理

`github_api.py` 将 API 基地址抽取为模块级常量 `GITHUB_API_BASE`，符合 `UPPER_SNAKE_CASE` 命名约定，便于后续复用和修改。`github_api_new.py` 将 URL 硬编码在函数体内。

### 实验结论

**有 AGENTS.md 约束时，Agent 产出的代码在规范性和健壮性上显著优于无约束的版本。** `github_api_new.py` 在两道硬性规范（docstring、禁用 `print()`）上直接违规，且缺乏异常处理机制。

---

## 任务 3：思考题 —— Memory 遗漏了什么

> **原始要求：** 在使用 Agent 的过程中，观察它是否产出了不符合你期望的代码。如果有，思考是 AGENTS.md 里缺了什么规则，然后补充上去。

### 问题发现

在使用 Agent 编写脚本后，运行出错，错误原因是**缺少相关依赖包**。Agent 默认使用系统级 Python 解释器执行代码，导致：
- 依赖包未安装到项目内部，污染系统环境
- 不同项目之间的依赖版本冲突
- 协作时其他开发者无法复现运行环境

### 原因分析

最初的 AGENTS.md 中，技术栈章节仅列出了运行时和框架，但**遗漏了包管理和虚拟环境的使用方式**。Agent 在没有明确指令的情况下，不会主动创建虚拟环境或以隔离方式安装依赖。

### 补充规则

已在 AGENTS.md 技术栈章节补充以下内容：

```markdown
- 虚拟环境和包管理：必须使用虚拟环境运行项目，禁止直接使用系统级 Python 解释器。
  创建命令：`python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`。
```

同时在技术栈章节增加了对应的约束条目，确保 Agent 在后续任务中自动遵循。

### 反思

AGENTS.md 不是一次性写完就完事的文档。随着实际使用中发现 Agent 产出的问题，需要持续迭代补充规则——**Memory 的质量决定 Agent 产出的质量**。
