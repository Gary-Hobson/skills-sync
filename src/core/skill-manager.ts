/**
 * core/skill-manager.ts — Skill 安装、卸载与状态查询
 *
 * 负责将 skill 从本地镜像（~/.agents/skills/）安装到 workspace，
 * 以及从 workspace 卸载 skill。直接操作文件系统，不维护安装记录。
 *
 * 依赖: adapters/fs.ts, utils/hash.ts, core/config-manager.ts,
 *       core/conflict-resolver.ts, types/index.ts
 * 被引用: commands/install.ts, commands/uninstall.ts, commands/ls.ts
 */

import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { createFsAdapter } from '../adapters/fs.js';
import { getSkillsDir } from './config-manager.js';
import { detectConflict, resolveConflict } from './conflict-resolver.js';
import type { ConflictStrategy, SkillSyncInfo } from '../types/index.js';

const fs = createFsAdapter();

export interface InstallResult {
  installed: string[];
  skipped: string[];
  errors: Array<{ skill: string; reason: string }>;
}

export interface UninstallResult {
  removed: string[];
  notFound: string[];
}

/**
 * 列出本地镜像中所有可用的 skill 名称。
 */
export function listAvailableSkills(): string[] {
  const skillsDir = getSkillsDir();
  return fs.listDirs(skillsDir);
}

/**
 * 列出 workspace 中已安装的 skill 名称（通过扫描目录）。
 */
export function listInstalledSkills(wsSkillsDir: string): string[] {
  return fs.listDirs(wsSkillsDir);
}

/**
 * 安装一个或多个 skill 到指定 workspace 目录。
 *
 * @param skillNames  - 要安装的 skill 名称列表（空数组 = 安装全部可用）
 * @param wsSkillsDir - workspace 中的 skills 目录绝对路径
 * @param strategy    - 冲突策略
 * @param dryRun      - 如果为 true，只预览不实际操作
 */
export async function installSkills(
  skillNames: string[],
  wsSkillsDir: string,
  strategy: ConflictStrategy = 'cloud',
  dryRun = false,
): Promise<InstallResult> {
  const cloudDir = getSkillsDir();
  const available = listAvailableSkills();

  // 不指定时安装全部
  const toInstall = skillNames.length > 0 ? skillNames : available;

  const result: InstallResult = { installed: [], skipped: [], errors: [] };

  for (const name of toInstall) {
    const cloudSkillDir = join(cloudDir, name);
    const wsSkillDir = join(wsSkillsDir, name);

    // 验证云端 skill 存在
    if (!existsSync(cloudSkillDir)) {
      result.errors.push({ skill: name, reason: `Skill "${name}" not found in cloud mirror` });
      continue;
    }

    // 检测冲突（二元比较）
    const conflict = detectConflict(name, cloudSkillDir, wsSkillDir);
    const action = resolveConflict(conflict, strategy);

    if (action === 'skip') {
      result.skipped.push(name);
      continue;
    }

    if (action === 'cloud') {
      if (!dryRun) {
        fs.removeDir(wsSkillDir);
        fs.copyDir(cloudSkillDir, wsSkillDir);
      }
      result.installed.push(name);
    } else {
      result.skipped.push(name);
    }
  }

  return result;
}

/**
 * 从 workspace 卸载 skill。
 */
export function uninstallSkills(
  skillNames: string[],
  wsSkillsDir: string,
  dryRun = false,
): UninstallResult {
  const result: UninstallResult = { removed: [], notFound: [] };

  for (const name of skillNames) {
    const wsSkillDir = join(wsSkillsDir, name);
    if (!existsSync(wsSkillDir)) {
      result.notFound.push(name);
      continue;
    }
    if (!dryRun) {
      fs.removeDir(wsSkillDir);
    }
    result.removed.push(name);
  }

  return result;
}

/**
 * 获取 workspace 中所有已安装 skill 的同步状态（二元比较）。
 *
 * @param wsSkillsDir - workspace skills 目录的绝对路径
 */
export function getSkillSyncStatus(wsSkillsDir: string): SkillSyncInfo[] {
  const cloudDir = getSkillsDir();
  const installed = listInstalledSkills(wsSkillsDir);

  return installed.map(name => {
    const cloudSkillDir = join(cloudDir, name);
    const wsSkillDir = join(wsSkillsDir, name);
    const conflict = detectConflict(name, cloudSkillDir, wsSkillDir);
    return {
      name,
      status: conflict.status,
      localHash: conflict.workspaceHash || undefined,
      cloudHash: conflict.cloudHash || undefined,
    };
  });
}
