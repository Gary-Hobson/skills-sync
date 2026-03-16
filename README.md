# skills-sync

[![npm version](https://img.shields.io/npm/v/@garyhobson/skills-sync)](https://www.npmjs.com/package/@garyhobson/skills-sync)
[![npm downloads](https://img.shields.io/npm/dm/@garyhobson/skills-sync)](https://www.npmjs.com/package/@garyhobson/skills-sync)
[![GitHub](https://img.shields.io/github/license/Gary-Hobson/skills-sync)](https://github.com/Gary-Hobson/skills-sync)

[中文](#中文) | [English](#english)

---

<a id="中文"></a>

## 中文

跨设备、跨工作区统一管理和同步 AI Agent skills 的 CLI 工具。

支持 **41 种 AI Agent**（Claude Code、Cursor、Windsurf、Codex、Gemini CLI、GitHub Copilot 等），一个仓库管理所有 skills，一条命令同步到任意设备和 workspace。

### ✨ 核心功能

- **统一管理** — 所有 skills 存储在一个 Git 仓库，跨设备跨项目一致
- **智能安装** — 从本地镜像或 GitHub URL 直接安装到 workspace
- **全系统扫描** — 自动发现系统中所有 agent 的 skills 目录，收集到云端
- **Group 批量操作** — 创建命名分组，一键安装整套 skills
- **多 Agent 适配** — 内置 41 种 agent 的路径映射，自动安装到正确位置
- **跨 Agent 链接** — 符号链接共享 skills，无需重复安装

### 📦 安装

```bash
npm i -g @garyhobson/skills-sync
```

### 🚀 快速开始

1. 初始化：克隆云端仓库到本地镜像

```bash
skills-sync init <私有 git 仓库地址>
```

2. 初始化完成后，进入交互式主菜单：

```bash
skills-sync
```

### 📖 常用命令

> 所有命令无参数时进入 🖥 TUI 交互模式，有参数时直接 CLI 执行。完整参数见下方折叠的命令参考。

#### 安装 / 卸载

```bash
skills-sync install                     # 🖥 TUI 搜索多选安装
skills-sync install foo bar             # 安装指定 skills
skills-sync install @group-name         # 安装整个 group
skills-sync install --group             # 🖥 TUI 从 group 列表选择
skills-sync install https://github.com/user/repo  # 从 GitHub 直接安装
skills-sync uninstall                   # 🖥 TUI 选择卸载
skills-sync uninstall foo               # 卸载指定 skill
```

#### 查看状态

```bash
skills-sync ls                          # 列出已安装 skills 及同步状态（✓ 已同步 / ~ 已修改）
skills-sync info foo                    # 查看 skill 详情
skills-sync info @group-name            # 查看 group 详情
```

#### 发布 / 收集

```bash
skills-sync publish                     # 🖥 TUI 选择修改过的 skills 发布到云端
skills-sync publish foo -m "fix typo"   # 发布指定 skill
skills-sync publish -w -y               # 一键发布所有修改
skills-sync publish -D foo              # 从云端删除 skill
skills-sync collect                     # 🖥 TUI 全系统扫描收集 skills 到云端
skills-sync collect --dry-run           # 预览，不实际操作
```

#### 链接 / 分组 / 配置

```bash
skills-sync link                        # 🖥 TUI 选择要链接的 agent
skills-sync link cursor windsurf        # 为 Cursor 和 Windsurf 创建符号链接共享 skills
skills-sync link -D cursor              # 解除链接
skills-sync group create                # 🖥 TUI 创建 group
skills-sync group list                  # 查看 group 列表
skills-sync config set agent cursor     # 切换默认 agent
skills-sync config set language en      # 切换语言
```

### 🌐 多语言

支持中文和英文，首次 `init` 时自动检测系统语言并引导选择。

```bash
# 通过配置切换
skills-sync config set language zh      # 中文
skills-sync config set language en      # English

# 通过环境变量临时切换
SKILLS_SYNC_LANG=zh skills-sync --help
```

语言优先级：`SKILLS_SYNC_LANG` env > `config.json language` > 系统 `LANG/LC_ALL` > 默认 `en`

非中英文系统默认使用英文。

### 🤖 支持的 Agent

<details>
<summary>查看全部 41 种 Agent</summary>

| Agent | 工程路径 | 全局路径 |
|-------|---------|---------|
| Claude Code | `.claude/skills` | `~/.claude/skills` |
| Cursor | `.cursor/skills` | `~/.cursor/skills` |
| Windsurf | `.windsurf/skills` | `~/.codeium/windsurf/skills` |
| Codex | `.codex/skills` | `~/.codex/skills` |
| Gemini CLI | `.agent/skills` | `~/.gemini/skills` |
| GitHub Copilot | `.github/skills` | `~/.copilot/skills` |
| Amp | `.amp/skills` | `~/.amp/skills` |
| Cline | `.cline/skills` | `~/.cline/skills` |
| OpenCode | `.opencode/skills` | `~/.opencode/skills` |
| Roo Code | `.roo/skills` | `~/.roo/skills` |
| Continue | `.continue/skills` | `~/.continue/skills` |
| Augment | `.augment/skills` | `~/.augment/skills` |
| Kilo Code | `.kilocode/skills` | `~/.kilocode/skills` |
| Trae | `.trae/skills` | `~/.trae/skills` |
| Goose | `.goose/skills` | `$XDG_CONFIG_HOME/goose/skills` |
| Junie | `.junie/skills` | `~/.junie/skills` |
| Pi | `.pi/skills` | `~/.pi/agent/skills` |
| OpenClaw | `.openclaw/skills` | `~/.openclaw/skills` |
| Kiro CLI | `.kiro/skills` | `~/.kiro/skills` |
| AdaL | `.adal/skills` | `~/.adal/skills` |
| Antigravity | `.agent/skills` | `~/.gemini/antigravity/skills` |
| CodeBuddy | `.codebuddy/skills` | `~/.codebuddy/skills` |
| Command Code | `.commandcode/skills` | `~/.commandcode/skills` |
| Cortex Code | `.cortex/skills` | `~/.snowflake/cortex/skills` |
| Crush | `.crush/skills` | `$XDG_CONFIG_HOME/crush/skills` |
| Droid | `.factory/skills` | `~/.factory/skills` |
| iFlow CLI | `.iflow/skills` | `~/.iflow/skills` |
| Kimi Code CLI | `.kimi/skills` | `$XDG_CONFIG_HOME/kimi/skills` |
| Kode | `.kode/skills` | `~/.kode/skills` || MCPJam | `.mcpjam/skills` | `~/.mcpjam/skills` |
| Mistral Vibe | `.vibe/skills` | `~/.vibe/skills` |
| Mux | `.mux/skills` | `~/.mux/skills` |
| Neovate | `.neovate/skills` | `~/.neovate/skills` |
| OpenHands | `.openhands/skills` | `~/.openhands/skills` |
| Pochi | `.pochi/skills` | `~/.pochi/skills` |
| Qoder | `.qoder/skills` | `~/.qoder/skills` |
| Qwen Code | `.qwen/skills` | `~/.qwen/skills` |
| Replit | `.replit/skills` | `$XDG_CONFIG_HOME/replit/skills` |
| Trae CN | `.trae/skills` | `~/.trae-cn/skills` |
| Zencoder | `.zencoder/skills` | `~/.zencoder/skills` |
| Universal | `.agents/skills` | `~/.agents/skills` |

</details>

<details>
<summary>📋 完整命令参考</summary>

> 所有命令无参数时进入 🖥 TUI 交互式模式，有参数时直接 CLI 执行。

#### `init [repo]` — 克隆云端仓库到本地镜像

**作用域**：📥 本地镜像 `~/.skills/` ← 云端仓库

克隆/拉取云端 Git 仓库到本地镜像目录。不修改 workspace。

TUI 引导流程：选择语言 → 输入仓库 → 选择 agent → 是否扫描收集。

```bash
skills-sync init                              # 🖥 TUI 引导
skills-sync init user/repo                    # CLI GitHub 简写
skills-sync init git@github.com:user/repo.git # CLI SSH URL
skills-sync init user/repo -a cursor          # CLI 指定 agent
```

| 参数 | 说明 |
|------|------|
| `[repo]` | 仓库地址（省略进入 🖥 TUI） |
| `-a, --agent <id>` | 指定 agent（默认: claude-code） |
| `-d, --dir <path>` | 指定 skills 目录 |

#### `install [skills...]` — 从镜像安装到 workspace

**作用域**：📥 当前 workspace ← 本地镜像（或直接 ← GitHub URL）

从本地镜像复制 skills 到当前项目的 skills 目录。不修改镜像和云端。

```bash
skills-sync install                     # 🖥 TUI 可搜索多选
skills-sync install foo bar             # CLI 安装指定 skills
skills-sync install @group-name         # CLI 安装整个 group
skills-sync install --group             # 🖥 TUI 从 group 列表选择
skills-sync install foo --cloud         # 冲突时用镜像版本覆盖 workspace
skills-sync install foo --local         # 冲突时保留 workspace 版本

# 远程安装（直接从 GitHub 下载到 workspace，不经过镜像）
skills-sync install https://github.com/owner/repo
skills-sync install https://github.com/owner/repo/tree/main/skills/pdf
```

| 参数 | 说明 |
|------|------|
| `[skills...]` | skill 名称、@group 或 GitHub URL |
| `--group` | 🖥 TUI 从 group 列表选择 |
| `--cloud` | 冲突时用镜像版本覆盖 workspace |
| `--local` | 冲突时保留 workspace 版本不变 |
| `-a, --agent <id>` | 指定目标 agent |
| `-d, --dir <path>` | 指定安装目录 |

#### `ls` — 查看 workspace 同步状态（只读）

**作用域**：👁️ 只读

列出当前 workspace 已安装 skills，与本地镜像比对显示同步状态。不修改任何内容。

- **🖥 TUI 模式**：可搜索多选 → 操作菜单（更新/发布/强制同步）
- **CLI 模式**（管道/非 TTY）：打印状态列表到 stdout

| 状态 | 含义 |
|------|------|
| `✓ synced` | workspace 与镜像一致 |
| `~ modified` | workspace 与镜像不同 |

#### `uninstall [skills...]` — 从 workspace 删除

**作用域**：🗑️ 当前 workspace

从当前项目删除 skills 文件。不影响本地镜像和云端仓库。

```bash
skills-sync uninstall                   # 🖥 TUI 多选卸载
skills-sync uninstall foo bar           # CLI 卸载指定
skills-sync uninstall foo --dry-run     # CLI 预览，不实际删除
```

#### `publish [skills...]` — 从 workspace 推送到云端 ⚠️

**作用域**：📤 云端仓库 ← 本地镜像 ← workspace

将 workspace 中修改过的 skills 复制回本地镜像，然后 git commit + push 到云端仓库。

```bash
skills-sync publish                     # 🖥 TUI 选择修改过的 skills + 输入提交消息
skills-sync publish foo -m "fix typo"   # CLI 指定 skill + 提交消息
skills-sync publish -w -y               # CLI 发布所有修改，跳过确认
skills-sync publish -D foo              # CLI 从镜像删除 skill + git push（⚠️ 云端也会删除）
skills-sync publish -D                  # 🖥 TUI 选择要从云端删除的 skill
```

| 参数 | 说明 |
|------|------|
| `[skills...]` | skill 名称（省略进入 🖥 TUI） |
| `-w, --workspace` | 发布 workspace 所有修改 |
| `-y, --yes` | 跳过确认 |
| `-m, --message <msg>` | git 提交消息 |
| `-D, --delete` | 从云端删除 skill |

#### `collect` — 全系统扫描收集到云端 ⚠️

**作用域**：📤 云端仓库 ← 本地镜像 ← 全系统 agent 目录

扫描系统中所有已安装 agent 的 skills 目录（global + project 路径），hash 对比发现新增/修改的 skills，复制到本地镜像后 git commit + push 到云端。

```bash
skills-sync collect                     # 🖥 TUI 扫描 → 多选要收集的 skills → git push 到云端
skills-sync collect --dry-run           # CLI 预览（只列出发现的 skills，不修改任何内容）
skills-sync collect -d ./my-skills      # CLI 扫描指定目录
```

| 参数 | 说明 |
|------|------|
| `-d, --dir <path>` | 指定扫描目录（默认扫描所有 agent 目录） |
| `--dry-run` | 预览不执行（只读） |
| `-m, --message <msg>` | git 提交消息 |

#### `info <name>` — 查看详情（只读）

**作用域**：👁️ 只读

查看本地镜像中 skill 或 group 的详情。不修改任何内容。

```bash
skills-sync info foo                    # skill 详情（hash、文件列表、SKILL.md 内容）
skills-sync info @group-name            # group 详情（描述、skills 列表）
skills-sync info foo --json             # JSON 输出
```

#### `group` — 管理分组定义 ⚠️

**作用域**：📤 云端仓库 ← 本地镜像（`create`/`delete` 会 git push）；`list` 只读

Group 定义保存在本地镜像中，创建和删除操作会自动 git push 到云端。

```bash
skills-sync group create                           # 🖥 TUI 创建 group → git push 到云端
skills-sync group create name foo bar --desc "..."  # CLI 直接创建 → git push 到云端
skills-sync group create -w                        # 🖥 TUI 从 workspace 已安装 skills 选择
skills-sync group delete name                      # CLI 删除 group → git push 到云端
skills-sync group delete name -y                   # CLI 删除，跳过确认
skills-sync group list                             # 🖥 TUI 查看 group 列表（只读）
```

#### `link [agents...]` — 跨 agent 共享 skills（符号链接）

**作用域**：🔗 当前 workspace

为其他 agent 创建指向主 agent skills 目录的符号链接，使多个 agent 共享同一套 skills，无需重复安装。

```bash
skills-sync link                        # 🖥 TUI 选择要链接的 agent
skills-sync link cursor windsurf        # CLI 为指定 agent 创建符号链接
skills-sync link -D                     # 🖥 TUI 选择要解除链接的 agent
skills-sync link -D cursor              # CLI 解除指定 agent 的符号链接
```

| 参数 | 说明 |
|------|------|
| `[agents...]` | 要链接的 agent ID（省略进入 🖥 TUI） |
| `-D, --delete` | 解除符号链接 |

行为细节：
- 创建相对路径符号链接（便于移植）
- 目标位置已有符号链接（指向别处）→ 自动替换
- 目标位置已有真实目录 → TUI 模式询问备份替换，CLI 模式跳过并警告
- 主 agent 自身会被跳过

#### `config` — 修改本地配置

**作用域**：🔧 本地配置文件 `~/.skills/config.json`

查看和修改全局配置。不影响 workspace 和云端仓库。

```bash
skills-sync config                      # 🖥 TUI 选择配置项修改
skills-sync config get                  # CLI 查看全部配置
skills-sync config get agent            # CLI 查看单项
skills-sync config set agent cursor     # CLI 设置默认 agent
skills-sync config set language zh      # CLI 切换语言
```

可配置项：`agent`、`remote`、`language`

</details>

<a id="english"></a>

## English

A CLI tool for managing and syncing AI agent skills across devices and workspaces.

Supports **41 AI agents** (Claude Code, Cursor, Windsurf, Codex, Gemini CLI, GitHub Copilot, etc.) — one repo for all skills, one command to sync to any device and workspace.

### ✨ Features

- **Unified management** — All skills stored in a single Git repo, consistent across devices and projects
- **Smart install** — Install from local mirror or directly from GitHub URLs
- **System-wide scan** — Auto-discover skills from all agent directories and collect to cloud
- **Group operations** — Create named groups, batch-install entire skill sets
- **Multi-agent support** — Built-in path mappings for 41 agents, auto-installs to the correct location
- **Cross-agent linking** — Symlink skills across agents, no duplicate installs needed

### 📦 Install

```bash
npm i -g @garyhobson/skills-sync
```

### 🚀 Quick Start

1. Initialize: clone your cloud repo to a local mirror

```bash
skills-sync init <private-git-repo-url>
```

2. Launch the interactive main menu:

```bash
skills-sync
```

### 📖 Common Commands

> All commands enter 🖥 TUI interactive mode without arguments, or run directly with arguments. See full parameter reference in the collapsible section below.

#### Install / Uninstall

```bash
skills-sync install                     # 🖥 TUI searchable multi-select
skills-sync install foo bar             # Install specific skills
skills-sync install @group-name         # Install an entire group
skills-sync install --group             # 🖥 TUI select from group list
skills-sync install https://github.com/user/repo  # Install directly from GitHub
skills-sync uninstall                   # 🖥 TUI select skills to uninstall
skills-sync uninstall foo               # Uninstall a specific skill
```

#### View Status

```bash
skills-sync ls                          # List installed skills & sync status (✓ synced / ~ modified)
skills-sync info foo                    # View skill details
skills-sync info @group-name            # View group details
```

#### Publish / Collect

```bash
skills-sync publish                     # 🖥 TUI select modified skills to publish
skills-sync publish foo -m "fix typo"   # Publish a specific skill
skills-sync publish -w -y               # Publish all changes at once
skills-sync publish -D foo              # Delete skill from cloud
skills-sync collect                     # 🖥 TUI system-wide scan & collect to cloud
skills-sync collect --dry-run           # Preview only, no changes
```

#### Link / Group / Config

```bash
skills-sync link                        # 🖥 TUI select agents to link
skills-sync link cursor windsurf        # Symlink skills for Cursor and Windsurf
skills-sync link -D cursor              # Remove symlink
skills-sync group create                # 🖥 TUI create group
skills-sync group list                  # View group list
skills-sync config set agent cursor     # Switch default agent
skills-sync config set language en      # Switch language
```

### 🌐 Multi-Language

Supports English and Chinese. Auto-detected on first `init`.

```bash
skills-sync config set language en      # English
skills-sync config set language zh      # 中文

# Temporary override via env var
SKILLS_SYNC_LANG=en skills-sync --help
```

Priority: `SKILLS_SYNC_LANG` env > `config.json language` > system `LANG/LC_ALL` > default `en`

### 🤖 Supported Agents

<details>
<summary>View all 41 agents</summary>

| Agent | Project Path | Global Path |
|-------|-------------|-------------|
| Claude Code | `.claude/skills` | `~/.claude/skills` |
| Cursor | `.cursor/skills` | `~/.cursor/skills` |
| Windsurf | `.windsurf/skills` | `~/.codeium/windsurf/skills` |
| Codex | `.codex/skills` | `~/.codex/skills` |
| Gemini CLI | `.agent/skills` | `~/.gemini/skills` |
| GitHub Copilot | `.github/skills` | `~/.copilot/skills` |
| Amp | `.amp/skills` | `~/.amp/skills` |
| Cline | `.cline/skills` | `~/.cline/skills` |
| OpenCode | `.opencode/skills` | `~/.opencode/skills` |
| Roo Code | `.roo/skills` | `~/.roo/skills` |
| Continue | `.continue/skills` | `~/.continue/skills` |
| Augment | `.augment/skills` | `~/.augment/skills` |
| Kilo Code | `.kilocode/skills` | `~/.kilocode/skills` |
| Trae | `.trae/skills` | `~/.trae/skills` |
| Goose | `.goose/skills` | `$XDG_CONFIG_HOME/goose/skills` |
| Junie | `.junie/skills` | `~/.junie/skills` |
| Pi | `.pi/skills` | `~/.pi/agent/skills` |
| OpenClaw | `.openclaw/skills` | `~/.openclaw/skills` |
| Kiro CLI | `.kiro/skills` | `~/.kiro/skills` |
| AdaL | `.adal/skills` | `~/.adal/skills` |
| Antigravity | `.agent/skills` | `~/.gemini/antigravity/skills` |
| CodeBuddy | `.codebuddy/skills` | `~/.codebuddy/skills` |
| Command Code | `.commandcode/skills` | `~/.commandcode/skills` |
| Cortex Code | `.cortex/skills` | `~/.snowflake/cortex/skills` |
| Crush | `.crush/skills` | `$XDG_CONFIG_HOME/crush/skills` |
| Droid | `.factory/skills` | `~/.factory/skills` |
| iFlow CLI | `.iflow/skills` | `~/.iflow/skills` |
| Kimi Code CLI | `.kimi/skills` | `$XDG_CONFIG_HOME/kimi/skills` |
| Kode | `.kode/skills` | `~/.kode/skills` |
| MCPJam | `.mcpjam/skills` | `~/.mcpjam/skills` |
| Mistral Vibe | `.vibe/skills` | `~/.vibe/skills` |
| Mux | `.mux/skills` | `~/.mux/skills` |
| Neovate | `.neovate/skills` | `~/.neovate/skills` |
| OpenHands | `.openhands/skills` | `~/.openhands/skills` |
| Pochi | `.pochi/skills` | `~/.pochi/skills` |
| Qoder | `.qoder/skills` | `~/.qoder/skills` |
| Qwen Code | `.qwen/skills` | `~/.qwen/skills` |
| Replit | `.replit/skills` | `$XDG_CONFIG_HOME/replit/skills` |
| Trae CN | `.trae/skills` | `~/.trae-cn/skills` |
| Zencoder | `.zencoder/skills` | `~/.zencoder/skills` |
| Universal | `.agents/skills` | `~/.agents/skills` |

</details>

<details>
<summary>📋 Full Command Reference</summary>

> All commands enter 🖥 TUI interactive mode without arguments, or run directly with arguments.

#### `init [repo]` — Clone cloud repo to local mirror

**Scope**: 📥 Local mirror `~/.skills/` ← cloud repo

Clone/pull cloud Git repo to local mirror. Does not modify workspace.

TUI guided flow: select language → enter repo → select agent → scan & collect.

```bash
skills-sync init                              # 🖥 TUI guided
skills-sync init user/repo                    # CLI GitHub shorthand
skills-sync init git@github.com:user/repo.git # CLI SSH URL
skills-sync init user/repo -a cursor          # CLI specify agent
```

| Parameter | Description |
|-----------|-------------|
| `[repo]` | Repo URL (omit for 🖥 TUI) |
| `-a, --agent <id>` | Specify agent (default: claude-code) |
| `-d, --dir <path>` | Specify skills directory |

#### `install [skills...]` — Install from mirror to workspace

**Scope**: 📥 Workspace ← local mirror (or ← GitHub URL)

Copy skills from local mirror to project skills directory. Does not modify mirror or cloud.

```bash
skills-sync install                     # 🖥 TUI searchable multi-select
skills-sync install foo bar             # CLI install specific skills
skills-sync install @group-name         # CLI install entire group
skills-sync install --group             # 🖥 TUI select from group list
skills-sync install foo --cloud         # On conflict, use mirror version
skills-sync install foo --local         # On conflict, keep workspace version

# Remote install (direct GitHub download, bypasses mirror)
skills-sync install https://github.com/owner/repo
skills-sync install https://github.com/owner/repo/tree/main/skills/pdf
```

| Parameter | Description |
|-----------|-------------|
| `[skills...]` | Skill names, @group, or GitHub URL |
| `--group` | 🖥 TUI select from group list |
| `--cloud` | On conflict, overwrite with mirror version |
| `--local` | On conflict, keep workspace version |
| `-a, --agent <id>` | Specify target agent |
| `-d, --dir <path>` | Specify install directory |

#### `ls` — View workspace sync status (read-only)

**Scope**: 👁️ Read-only

List workspace skills with sync status compared to mirror.

- **🖥 TUI mode**: searchable multi-select → action menu (update/publish/force sync)
- **CLI mode** (pipe/non-TTY): print status list to stdout

| Status | Meaning |
|--------|---------|
| `✓ synced` | Workspace matches mirror |
| `~ modified` | Workspace differs from mirror |

#### `uninstall [skills...]` — Remove from workspace

**Scope**: 🗑️ Current workspace

Remove skill files from current project. Does not affect mirror or cloud.

```bash
skills-sync uninstall                   # 🖥 TUI multi-select
skills-sync uninstall foo bar           # CLI uninstall specific
skills-sync uninstall foo --dry-run     # CLI preview, no actual deletion
```

#### `publish [skills...]` — Push workspace to cloud ⚠️

**Scope**: 📤 Cloud repo ← mirror ← workspace

Copy modified skills from workspace to mirror, then git commit + push to cloud.

```bash
skills-sync publish                     # 🖥 TUI select modified skills + commit message
skills-sync publish foo -m "fix typo"   # CLI publish specific skill
skills-sync publish -w -y               # CLI publish all, skip confirmation
skills-sync publish -D foo              # CLI delete from mirror + git push (⚠️ cloud too)
skills-sync publish -D                  # 🖥 TUI select skills to delete from cloud
```

| Parameter | Description |
|-----------|-------------|
| `[skills...]` | Skill names (omit for 🖥 TUI) |
| `-w, --workspace` | Publish all workspace changes |
| `-y, --yes` | Skip confirmation |
| `-m, --message <msg>` | Git commit message |
| `-D, --delete` | Delete skill from cloud |

#### `collect` — System-wide scan & collect ⚠️

**Scope**: 📤 Cloud repo ← mirror ← all agent directories

Scan all installed agents' skills directories (global + project), hash-compare to find new/modified skills, copy to mirror, then git commit + push.

```bash
skills-sync collect                     # 🖥 TUI scan → multi-select → git push
skills-sync collect --dry-run           # CLI preview (no changes)
skills-sync collect -d ./my-skills      # CLI scan specific directory
```

| Parameter | Description |
|-----------|-------------|
| `-d, --dir <path>` | Specify scan directory (default: all agent dirs) |
| `--dry-run` | Preview only (read-only) |
| `-m, --message <msg>` | Git commit message |

#### `info <name>` — View details (read-only)

**Scope**: 👁️ Read-only

View skill or group details from local mirror.

```bash
skills-sync info foo                    # Skill details (hash, files, SKILL.md)
skills-sync info @group-name            # Group details (description, skills list)
skills-sync info foo --json             # JSON output
```

#### `group` — Manage group definitions ⚠️

**Scope**: 📤 Cloud repo ← mirror (`create`/`delete` git push); `list` read-only

Group definitions are saved to mirror. Create/delete operations auto git push.

```bash
skills-sync group create                           # 🖥 TUI create group → git push
skills-sync group create name foo bar --desc "..."  # CLI create → git push
skills-sync group create -w                        # 🖥 TUI select from workspace skills
skills-sync group delete name                      # CLI delete group → git push
skills-sync group delete name -y                   # CLI delete, skip confirmation
skills-sync group list                             # 🖥 TUI view group list (read-only)
```

#### `link [agents...]` — Cross-agent skill sharing (symlinks)

**Scope**: 🔗 Current workspace

Create symlinks from other agents' skills directories to the primary agent's, enabling shared skills.

```bash
skills-sync link                        # 🖥 TUI select agents to link
skills-sync link cursor windsurf        # CLI create symlinks
skills-sync link -D                     # 🖥 TUI select agents to unlink
skills-sync link -D cursor              # CLI remove symlink
```

| Parameter | Description |
|-----------|-------------|
| `[agents...]` | Agent IDs to link (omit for 🖥 TUI) |
| `-D, --delete` | Remove symlinks |

Behavior:
- Creates relative symlinks (portable)
- Existing symlink (pointing elsewhere) → auto-replaced
- Existing real directory → TUI asks to backup & replace, CLI skips with warning
- Primary agent is skipped

#### `config` — Local configuration

**Scope**: 🔧 Local config `~/.skills/config.json`

View and modify global config. Does not affect workspace or cloud.

```bash
skills-sync config                      # 🖥 TUI select config to edit
skills-sync config get                  # CLI view all config
skills-sync config get agent            # CLI view single item
skills-sync config set agent cursor     # CLI set default agent
skills-sync config set language zh      # CLI switch language
```

Configurable: `agent`, `remote`, `language`

</details>

## License

MIT

