/**
 * core/config-manager.ts — 配置读写
 *
 * 管理全局配置（config.json）。
 *
 * 镜像仓库目录优先级：
 *   SKILLS_SYNC_MIRROR_DIR env > 默认 ~/.skills
 *
 * 配置文件位置：<mirror_dir>/config.json
 *
 * 依赖: types/index.ts, utils/path.ts
 */

import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import type { GlobalConfig, WorkspaceInfo } from '../types/index.js';
import { agentRegistry, getDefaultSkillsDir } from '../utils/path.js';

// ─── 路径常量 ───

/** 默认镜像仓库根目录 */
const DEFAULT_MIRROR_DIR = join(homedir(), '.skills');

/**
 * 解析镜像仓库根目录。
 * 优先级：SKILLS_SYNC_MIRROR_DIR env > 默认 ~/.skills
 */
function resolveMirrorDir(): string {
  const envMirror = process.env['SKILLS_SYNC_MIRROR_DIR'];
  if (envMirror) return resolve(envMirror);
  return DEFAULT_MIRROR_DIR;
}

// 延迟初始化（模块加载时解析一次）
let _mirrorDir: string | null = null;

function getMirrorDirCached(): string {
  if (_mirrorDir === null) _mirrorDir = resolveMirrorDir();
  return _mirrorDir;
}

/** 重置缓存（init 后镜像目录可能变了） */
export function resetMirrorDirCache(): void {
  _mirrorDir = null;
}

/** 返回配置文件路径 */
function getConfigPathInternal(): string {
  return join(getMirrorDirCached(), 'config.json');
}

/** 返回 skills 子目录路径 */
function getSkillsDirInternal(): string {
  return join(getMirrorDirCached(), 'skills');
}

/** 默认全局配置 */
const DEFAULT_CONFIG: GlobalConfig = {
  agent: 'claude-code',
  remote: '',
};

// ─── 内部工具 ───

function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function readFileSafe(filePath: string): string | null {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function loadProjectConfig(workspacePath: string): Partial<GlobalConfig> {
  const jsonPath = join(workspacePath, '.skills-sync.json');
  const content = readFileSafe(jsonPath);
  if (content !== null) {
    try {
      const parsed: unknown = JSON.parse(content);
      if (parsed !== null && typeof parsed === 'object') return parsed as Partial<GlobalConfig>;
    } catch {
      // ignore
    }
    return {};
  }

  return {};
}

function getEnvOverrides(): Partial<GlobalConfig> {
  const overrides: Partial<GlobalConfig> = {};

  const agent = process.env['SKILLS_SYNC_AGENT'];
  if (agent !== undefined && agent !== '') overrides.agent = agent;

  const remote = process.env['SKILLS_SYNC_REMOTE'];
  if (remote !== undefined && remote !== '') overrides.remote = remote;

  const lang = process.env['SKILLS_SYNC_LANG'];
  if (lang !== undefined && lang !== '') overrides.language = lang;

  return overrides;
}

// ─── 全局配置 ───

export function loadGlobalConfig(): GlobalConfig | null {
  const content = readFileSafe(getConfigPathInternal());
  if (content === null) return null;
  try {
    const parsed: unknown = JSON.parse(content);
    if (parsed !== null && typeof parsed === 'object') return parsed as GlobalConfig;
    return null;
  } catch {
    return null;
  }
}

export function saveGlobalConfig(config: GlobalConfig): void {
  const mirrorDir = getMirrorDirCached();
  ensureDir(mirrorDir);
  writeFileSync(getConfigPathInternal(), JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export function getEffectiveConfig(overrides?: Partial<GlobalConfig>): GlobalConfig {
  const globalConfig = loadGlobalConfig() ?? {};
  const projectConfig = loadProjectConfig(process.cwd());
  const envOverrides = getEnvOverrides();

  const merged: GlobalConfig = {
    ...DEFAULT_CONFIG,
    ...globalConfig,
    ...projectConfig,
    ...envOverrides,
    ...(overrides ?? {}),
  };

  return merged;
}

// ─── Workspace 推断 ───

export function getWorkspaceInfo(opts?: { agent?: string; dir?: string }): WorkspaceInfo {
  const config = getEffectiveConfig({ agent: opts?.agent });
  const agent = config.agent || 'claude-code';
  let skillsDir: string;
  if (opts?.dir) {
    skillsDir = opts.dir;
  } else {
    skillsDir = getDefaultSkillsDir(agent) ?? (agent in agentRegistry ? agentRegistry[agent]!.projectPath : '.claude/skills');
  }
  return {
    path: resolve(process.cwd()),
    skills_dir: skillsDir,
    agent,
  };
}

// ─── 路径常量访问 ───

/** 返回镜像仓库根目录（默认 ~/.skills） */
export function getAgentsDir(): string {
  return getMirrorDirCached();
}

/** 返回 skills 子目录路径（<mirror_dir>/skills/） */
export function getSkillsDir(): string {
  return getSkillsDirInternal();
}

/** 返回 config.json 文件路径 */
export function getConfigPath(): string {
  return getConfigPathInternal();
}

/**
 * 返回 git 仓库的根目录。
 * - 新结构：<mirror>/skills/.git → git root = <mirror>/skills/
 * - 旧结构：<mirror>/.git（skills/ 是子目录）→ git root = <mirror>/
 */
export function getGitRoot(): string {
  const mirrorDir = getMirrorDirCached();
  const skillsDir = getSkillsDirInternal();
  const newGitDir = join(skillsDir, '.git');
  if (existsSync(newGitDir)) return skillsDir;
  const oldGitDir = join(mirrorDir, '.git');
  if (existsSync(oldGitDir)) return mirrorDir;
  return skillsDir;
}

/**
 * 检查是否已初始化。
 */
export function isInitialized(): boolean {
  const mirrorDir = getMirrorDirCached();
  const skillsDir = getSkillsDirInternal();
  return existsSync(join(skillsDir, '.git')) || existsSync(join(mirrorDir, '.git'));
}
