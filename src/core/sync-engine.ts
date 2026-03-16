/**
 * core/sync-engine.ts — 同步引擎
 *
 * 负责：
 * 1. pull：拉取云端更新到本地镜像（~/.agents/skills/），保证 R ≡ L
 * 2. push：将本地镜像推送到云端（commit + push）
 * 3. sync workspace：将本地镜像变更传播到 workspace
 *
 * 依赖: adapters/git.ts, core/config-manager.ts, core/skill-manager.ts, types/index.ts,
 *       utils/readme.ts
 * 被引用: commands/install.ts, commands/publish.ts
 */

import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { createGitAdapter } from '../adapters/git.js';
import { createFsAdapter } from '../adapters/fs.js';
import {
  getSkillsDir,
  getAgentsDir,
  getGitRoot,
  isInitialized,
  getEffectiveConfig,
} from './config-manager.js';
import { updateAgentsReadme } from '../utils/readme.js';

const git = createGitAdapter();
const fs = createFsAdapter();

export interface SyncResult {
  pulled: boolean;
  pushed: boolean;
  error?: string;
}

/**
 * 从云端拉取最新，保证本地镜像 R ≡ L。
 * 使用 fetch + reset --hard 强制覆盖本地。
 */
export async function pullFromCloud(): Promise<{ success: boolean; error?: string }> {
  if (!isInitialized()) {
    return { success: false, error: 'Not initialized. Run `skills-sync init <repo>` first.' };
  }
  try {
    await git.pull(getGitRoot());
    updateAgentsReadme();
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * 将本地镜像的变更提交并推送到云端。
 *
 * @param message - 提交消息（默认自动生成）
 * @param customPushCmd - 自定义 push 命令（如 "git push origin HEAD:refs/for/dev"）
 */
export async function pushToCloud(message?: string, customPushCmd?: string): Promise<{ success: boolean; error?: string }> {
  if (!isInitialized()) {
    return { success: false, error: 'Not initialized. Run `skills-sync init <repo>` first.' };
  }
  const gitRoot = getGitRoot();
  try {
    updateAgentsReadme();
    const status = await git.status(gitRoot);
    if (status.isClean) {
      return { success: true }; // 无变更，跳过
    }
    const commitMsg = message ?? `sync: update skills ${new Date().toISOString().slice(0, 10)}`;
    await git.commit(gitRoot, commitMsg, ['.']);
    if (customPushCmd) {
      execSync(customPushCmd, { cwd: gitRoot, stdio: 'inherit' });
    } else {
      await git.push(gitRoot);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * 将 workspace 中指定 skill 的内容复制到本地镜像。
 * 用于 publish 命令（workspace → 云端方向）。
 *
 * @param skillName - skill 名称
 * @param wsSkillDir - workspace 中该 skill 的目录
 */
export function copySkillToMirror(skillName: string, wsSkillDir: string): void {
  const cloudSkillDir = join(getSkillsDir(), skillName);
  fs.removeDir(cloudSkillDir);
  fs.copyDir(wsSkillDir, cloudSkillDir);
}

/**
 * 从本地镜像中删除 skill 目录。
 * 用于 publish --delete 命令（云端方向的删除）。
 *
 * @param skillName - skill 名称
 * @returns true 如果目录存在并被删除，false 如果不存在
 */
export function deleteSkillFromMirror(skillName: string): boolean {
  const cloudSkillDir = join(getSkillsDir(), skillName);
  if (!fs.dirExists(cloudSkillDir)) {
    return false;
  }
  fs.removeDir(cloudSkillDir);
  return true;
}
