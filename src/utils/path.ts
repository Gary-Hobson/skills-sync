/**
 * utils/path.ts — 路径解析（agent -> 安装目录）
 *
 * 提供 agent 注册表和路径解析工具函数。
 * - agentRegistry: 完整的 AI agent 注册表，包含各 agent 的工程级和全局 skills 目录
 * - resolveEnvPath: 解析路径中的 ~ 和 $ENV_VAR
 * - resolveAgentSkillsDir: 根据 agent 类型返回 workspace 中的 skill 安装路径
 * - getDefaultSkillsDir: 返回 agent 的默认 skills 目录相对路径
 *
 * 依赖: src/types/index.ts (AgentPaths)
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AgentPaths } from '../types/index.js';

/**
 * 完整的 AI agent 注册表。
 * 与 vercel-labs/skills 的 agent 列表保持同步。
 * key 为 agent ID，value 包含显示名称、工程级路径和全局路径。
 */
export const agentRegistry: Record<string, AgentPaths> = {
  // ── 各 agent 独立项目级路径（以 pre-commit-hooks.yaml / 官方文档为准） ──

  // A
  adal:             { displayName: 'AdaL',             projectPath: '.adal/skills',         globalPath: '~/.adal/skills' },
  amp:              { displayName: 'Amp',              projectPath: '.amp/skills',           globalPath: '~/.amp/skills' },
  antigravity:      { displayName: 'Antigravity',      projectPath: '.agent/skills',         globalPath: '~/.gemini/antigravity/skills' },
  augment:          { displayName: 'Augment',          projectPath: '.augment/skills',       globalPath: '~/.augment/skills' },

  // C
  'claude-code':    { displayName: 'Claude Code',      projectPath: '.claude/skills',        globalPath: '$CLAUDE_CONFIG_DIR/skills' },
  cline:            { displayName: 'Cline',            projectPath: '.cline/skills',         globalPath: '~/.cline/skills' },
  codebuddy:        { displayName: 'CodeBuddy',        projectPath: '.codebuddy/skills',     globalPath: '~/.codebuddy/skills' },
  codex:            { displayName: 'Codex',            projectPath: '.codex/skills',         globalPath: '~/.codex/skills' },
  'command-code':   { displayName: 'Command Code',     projectPath: '.commandcode/skills',   globalPath: '~/.commandcode/skills' },
  continue:         { displayName: 'Continue',         projectPath: '.continue/skills',      globalPath: '~/.continue/skills' },
  cortex:           { displayName: 'Cortex Code',      projectPath: '.cortex/skills',        globalPath: '~/.snowflake/cortex/skills' },
  crush:            { displayName: 'Crush',            projectPath: '.crush/skills',         globalPath: '$XDG_CONFIG_HOME/crush/skills' },
  cursor:           { displayName: 'Cursor',           projectPath: '.cursor/skills',        globalPath: '~/.cursor/skills' },

  // D
  droid:            { displayName: 'Droid',            projectPath: '.factory/skills',       globalPath: '~/.factory/skills' },

  // G
  'gemini-cli':     { displayName: 'Gemini CLI',       projectPath: '.agent/skills',         globalPath: '~/.gemini/skills' },
  'github-copilot': { displayName: 'GitHub Copilot',   projectPath: '.github/skills',        globalPath: '~/.copilot/skills' },
  goose:            { displayName: 'Goose',            projectPath: '.goose/skills',         globalPath: '$XDG_CONFIG_HOME/goose/skills' },

  // I-K
  'iflow-cli':      { displayName: 'iFlow CLI',        projectPath: '.iflow/skills',         globalPath: '~/.iflow/skills' },
  junie:            { displayName: 'Junie',            projectPath: '.junie/skills',         globalPath: '~/.junie/skills' },
  kilo:             { displayName: 'Kilo Code',        projectPath: '.kilocode/skills',      globalPath: '~/.kilocode/skills' },
  'kimi-cli':       { displayName: 'Kimi Code CLI',    projectPath: '.kimi/skills',          globalPath: '$XDG_CONFIG_HOME/kimi/skills' },
  'kiro-cli':       { displayName: 'Kiro CLI',         projectPath: '.kiro/skills',          globalPath: '~/.kiro/skills' },
  kode:             { displayName: 'Kode',             projectPath: '.kode/skills',          globalPath: '~/.kode/skills' },

  // M-O
  mcpjam:           { displayName: 'MCPJam',           projectPath: '.mcpjam/skills',        globalPath: '~/.mcpjam/skills' },
  'mistral-vibe':   { displayName: 'Mistral Vibe',     projectPath: '.vibe/skills',          globalPath: '~/.vibe/skills' },
  mux:              { displayName: 'Mux',              projectPath: '.mux/skills',           globalPath: '~/.mux/skills' },
  neovate:          { displayName: 'Neovate',          projectPath: '.neovate/skills',       globalPath: '~/.neovate/skills' },
  openclaw:         { displayName: 'OpenClaw',         projectPath: '.openclaw/skills',      globalPath: '~/.openclaw/skills' },
  opencode:         { displayName: 'OpenCode',         projectPath: '.opencode/skills',      globalPath: '~/.opencode/skills' },
  openhands:        { displayName: 'OpenHands',        projectPath: '.openhands/skills',     globalPath: '~/.openhands/skills' },

  // P-R
  pi:               { displayName: 'Pi',               projectPath: '.pi/skills',            globalPath: '~/.pi/agent/skills' },
  pochi:            { displayName: 'Pochi',            projectPath: '.pochi/skills',         globalPath: '~/.pochi/skills' },
  qoder:            { displayName: 'Qoder',            projectPath: '.qoder/skills',         globalPath: '~/.qoder/skills' },
  'qwen-code':      { displayName: 'Qwen Code',        projectPath: '.qwen/skills',          globalPath: '~/.qwen/skills' },
  replit:           { displayName: 'Replit',            projectPath: '.replit/skills',        globalPath: '$XDG_CONFIG_HOME/replit/skills' },
  roo:              { displayName: 'Roo Code',         projectPath: '.roo/skills',           globalPath: '~/.roo/skills' },

  // T-Z
  trae:             { displayName: 'Trae',             projectPath: '.trae/skills',          globalPath: '~/.trae/skills' },
  'trae-cn':        { displayName: 'Trae CN',          projectPath: '.trae/skills',          globalPath: '~/.trae-cn/skills' },
  windsurf:         { displayName: 'Windsurf',         projectPath: '.windsurf/skills',      globalPath: '~/.codeium/windsurf/skills' },
  zencoder:         { displayName: 'Zencoder',         projectPath: '.zencoder/skills',      globalPath: '~/.zencoder/skills' },

  // Universal fallback（.agents/skills — 用于尚未明确自有路径的 agent）
  universal:        { displayName: 'Universal',        projectPath: '.agents/skills',        globalPath: '~/.agents/skills' },
};

/**
 * 解析路径中的 ~ 和 $ENV_VAR。
 *
 * 支持的环境变量：
 * - $XDG_CONFIG_HOME（默认 ~/.config）
 * - $CODEX_HOME（默认 ~/.codex）
 * - $CLAUDE_CONFIG_DIR（默认 ~/.claude）
 * - ~ 替换为用户 home 目录
 */
export function resolveEnvPath(path: string): string {
  const home = homedir();
  let resolved = path;

  if (resolved.startsWith('$XDG_CONFIG_HOME')) {
    const xdg = process.env.XDG_CONFIG_HOME ?? join(home, '.config');
    resolved = resolved.replace('$XDG_CONFIG_HOME', xdg);
  } else if (resolved.startsWith('$CODEX_HOME')) {
    const codex = process.env.CODEX_HOME ?? join(home, '.codex');
    resolved = resolved.replace('$CODEX_HOME', codex);
  } else if (resolved.startsWith('$CLAUDE_CONFIG_DIR')) {
    const claude = process.env.CLAUDE_CONFIG_DIR ?? join(home, '.claude');
    resolved = resolved.replace('$CLAUDE_CONFIG_DIR', claude);
  } else if (resolved.startsWith('~')) {
    resolved = resolved.replace('~', home);
  }

  return resolved;
}

/**
 * 根据 agent 类型返回 workspace 中的 skill 安装路径（绝对路径）。
 *
 * @param agent - agent ID（如 'claude-code'）
 * @param workspace - workspace 根目录的绝对路径
 * @returns skill 安装目录的绝对路径，agent 不存在时返回 null
 */
export function resolveAgentSkillsDir(agent: string, workspace: string): string | null {
  const entry = agentRegistry[agent];
  if (!entry) return null;
  return join(workspace, entry.projectPath);
}

/**
 * 返回 agent 的默认 skills 目录（相对路径）。
 *
 * @param agent - agent ID（如 'claude-code'）
 * @returns 相对路径字符串（如 '.claude/skills'），agent 不存在时返回 null
 */
export function getDefaultSkillsDir(agent: string): string | null {
  const entry = agentRegistry[agent];
  if (!entry) return null;
  return entry.projectPath;
}

/**
 * 返回 agent 的全局 skills 目录（绝对路径，已解析环境变量）。
 *
 * @param agent - agent ID
 * @returns 绝对路径字符串，agent 不存在时返回 null
 */
export function getAgentGlobalPath(agent: string): string | null {
  const entry = agentRegistry[agent];
  if (!entry) return null;
  return resolveEnvPath(entry.globalPath);
}
