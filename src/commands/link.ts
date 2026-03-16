/**
 * commands/link.ts — link 命令
 *
 * 为其他 agent 创建符号链接，指向主 agent 的 skills 目录。
 * 使得多个 agent 共享同一套 skills，无需重复安装。
 *
 * 依赖: core/config-manager.ts, utils/path.ts, tui/prompts.ts, i18n
 */

import { existsSync, lstatSync, readlinkSync, symlinkSync, unlinkSync, mkdirSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { agentRegistry } from '../utils/path.js';
import { getWorkspaceInfo } from '../core/config-manager.js';
import { success, error, info, warn } from '../utils/output.js';
import { EXIT_CODES } from '../types/index.js';
import { isTTY, promptSearchCheckbox, promptConfirm } from '../tui/prompts.js';
import { t } from '../i18n/index.js';
import { detectInstalledAgents } from './init.js';

export interface LinkOptions {
  agent?: string;
  unlink?: boolean;
}

/** 获取主 agent 的 workspace skills 目录（绝对路径） */
function getPrimarySkillsDir(opts?: { agent?: string }): { agent: string; dir: string } {
  const workspace = getWorkspaceInfo(opts);
  return {
    agent: workspace.agent,
    dir: resolve(workspace.path, workspace.skills_dir),
  };
}

/** 获取指定 agent 在当前 workspace 下的 skills 目录（绝对路径） */
function getAgentSkillsDir(agentId: string): string | null {
  const entry = agentRegistry[agentId];
  if (!entry) return null;
  return resolve(process.cwd(), entry.projectPath);
}

/** 检查路径是否存在（包括断链的符号链接） */
function pathExists(p: string): boolean {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

/** 检查路径是否为符号链接 */
function isSymlink(p: string): boolean {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

/** TUI 模式：选择要链接的 agent */
async function linkTUI(opts: LinkOptions): Promise<void> {
  if (!isTTY()) {
    error(t('link.requiresTTY'));
    process.exit(EXIT_CODES.ARG_ERROR);
  }

  const primary = getPrimarySkillsDir(opts);

  if (opts.unlink) {
    await unlinkTUI(primary);
    return;
  }

  info(t('link.primaryAgent', { agent: primary.agent, dir: primary.dir }));

  // 列出已安装的 agent（排除主 agent 自身）
  const installedAgents = detectInstalledAgents()
    .filter(([id]) => id !== primary.agent);

  if (installedAgents.length === 0) {
    info(t('link.noOtherAgents'));
    return;
  }

  const choices = installedAgents.map(([id, paths]) => {
    const targetDir = resolve(process.cwd(), paths.projectPath);
    let desc: string;
    if (pathExists(targetDir)) {
      if (isSymlink(targetDir)) {
        const linkTarget = readlinkSync(targetDir);
        desc = t('link.alreadyLinked', { target: linkTarget });
      } else {
        desc = t('link.existsNotLink', { path: paths.projectPath });
      }
    } else {
      desc = paths.projectPath;
    }
    return {
      name: `${paths.displayName} (${id})`,
      value: id,
      description: desc,
    };
  });

  const selected = await promptSearchCheckbox(t('link.selectAgents'), choices);
  if (selected.length === 0) return;

  await cmdLink(selected, opts);
}

export { linkTUI };

/** CLI 模式：为指定 agent 创建符号链接 */
export async function cmdLink(agents: string[], opts: LinkOptions = {}): Promise<void> {
  const primary = getPrimarySkillsDir(opts);

  if (!existsSync(primary.dir)) {
    warn(t('link.primaryNotExists', { dir: primary.dir }));
    info(t('link.runInstallFirst'));
  }

  for (const agentId of agents) {
    if (agentId === primary.agent) {
      warn(t('link.skipPrimary', { agent: agentId }));
      continue;
    }

    const targetDir = getAgentSkillsDir(agentId);
    if (!targetDir) {
      error(t('link.unknownAgent', { agent: agentId }));
      continue;
    }

    // 计算相对路径的符号链接（相对于目标的父目录）
    const targetParent = dirname(targetDir);
    const relPath = relative(targetParent, primary.dir);

    if (pathExists(targetDir)) {
      if (isSymlink(targetDir)) {
        const currentTarget = readlinkSync(targetDir);
        if (resolve(targetParent, currentTarget) === primary.dir) {
          info(t('link.alreadyCorrect', { agent: agentId }));
          continue;
        }
        // 链接指向别处，删掉重建
        unlinkSync(targetDir);
      } else {
        // 是真实目录，需要确认
        if (isTTY()) {
          const confirmed = await promptConfirm(
            t('link.replaceDir', { agent: agentId, path: targetDir }),
            false,
          );
          if (!confirmed) {
            info(t('link.skipped', { agent: agentId }));
            continue;
          }
        } else {
          warn(t('link.skipExistingDir', { agent: agentId, path: targetDir }));
          continue;
        }
        // 重命名为 backup
        const { renameSync } = await import('node:fs');
        const backupDir = targetDir + '.bak';
        renameSync(targetDir, backupDir);
        info(t('link.backedUp', { from: targetDir, to: backupDir }));
      }
    }

    // 确保父目录存在
    if (!existsSync(targetParent)) {
      mkdirSync(targetParent, { recursive: true });
    }

    symlinkSync(relPath, targetDir);
    success(t('link.created', { agent: agentId, link: targetDir, target: relPath }));
  }
}

/** CLI 模式：解除符号链接 */
export async function cmdUnlink(agents: string[], opts: LinkOptions = {}): Promise<void> {
  const primary = getPrimarySkillsDir(opts);

  for (const agentId of agents) {
    const targetDir = getAgentSkillsDir(agentId);
    if (!targetDir) {
      error(t('link.unknownAgent', { agent: agentId }));
      continue;
    }

    if (!pathExists(targetDir)) {
      info(t('link.notLinked', { agent: agentId }));
      continue;
    }

    if (!isSymlink(targetDir)) {
      warn(t('link.notSymlink', { agent: agentId, path: targetDir }));
      continue;
    }

    unlinkSync(targetDir);
    success(t('link.removed', { agent: agentId, path: targetDir }));
  }
}

/** TUI：选择要 unlink 的 agent */
async function unlinkTUI(primary: { agent: string; dir: string }): Promise<void> {
  // 找出当前 workspace 下所有指向主 agent skills 目录的符号链接
  const linked: Array<{ id: string; displayName: string; path: string; target: string }> = [];

  for (const [id, paths] of Object.entries(agentRegistry)) {
    if (id === primary.agent) continue;
    const targetDir = resolve(process.cwd(), paths.projectPath);
    try {
      if (isSymlink(targetDir)) {
        const linkTarget = readlinkSync(targetDir);
        linked.push({ id, displayName: paths.displayName, path: targetDir, target: linkTarget });
      }
    } catch {
      // 不存在，跳过
    }
  }

  if (linked.length === 0) {
    info(t('link.noLinksFound'));
    return;
  }

  const choices = linked.map(l => ({
    name: `${l.displayName} (${l.id})`,
    value: l.id,
    description: `${l.path} → ${l.target}`,
  }));

  const selected = await promptSearchCheckbox(t('link.selectUnlink'), choices);
  if (selected.length === 0) return;

  await cmdUnlink(selected);
}
