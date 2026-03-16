/**
 * core/conflict-resolver.ts — 冲突检测与解决
 *
 * 比较 workspace 中的 skill 与本地镜像（~/.skills/skills/）中的 skill。
 * 使用二元比较（镜像 hash vs workspace hash）。
 *
 * 两种状态：
 * - synced：双端内容一致（hash 相同）
 * - modified：workspace 与镜像不同（未安装、已修改、或双方不同）
 *
 * 依赖: utils/hash.ts, types/index.ts
 * 被引用: core/skill-manager.ts, commands/publish.ts
 */

import { existsSync } from 'node:fs';
import { hashDirectory } from '../utils/hash.js';
import type { ConflictStrategy, SyncStatus } from '../types/index.js';

export interface ConflictInfo {
  skillName: string;
  status: SyncStatus;
  cloudHash: string;
  workspaceHash: string;
}

/**
 * 计算单个 skill 的同步状态（二元比较）。
 *
 * @param skillName    - skill 名称
 * @param cloudSkillDir  - 本地镜像中的 skill 目录（~/.skills/skills/<name>）
 * @param wsSkillDir   - workspace 中的 skill 目录
 */
export function detectConflict(
  skillName: string,
  cloudSkillDir: string,
  wsSkillDir: string,
): ConflictInfo {
  const cloudExists = existsSync(cloudSkillDir);
  const wsExists = existsSync(wsSkillDir);

  const cloudHash = cloudExists ? hashDirectory(cloudSkillDir) : '';
  const workspaceHash = wsExists ? hashDirectory(wsSkillDir) : '';

  const status: SyncStatus = (cloudHash === workspaceHash) ? 'synced' : 'modified';

  return { skillName, status, cloudHash, workspaceHash };
}

/**
 * 根据策略决定冲突操作。
 * - workspace 中不存在 → 直接安装（新安装，无需确认）
 * - 已存在但内容不同 → 根据策略决定
 *   - cloud: 用镜像版本覆盖 workspace
 *   - 其他: 保留 workspace 版本（跳过）
 */
export function resolveConflict(
  info: ConflictInfo,
  strategy: ConflictStrategy,
): 'cloud' | 'workspace' | 'skip' {
  if (info.status === 'synced') return 'skip';
  // workspace 中不存在该 skill → 直接从镜像安装
  if (!info.workspaceHash) return 'cloud';
  // workspace 已存在但与镜像不同 → 根据策略决定
  return strategy === 'cloud' ? 'cloud' : 'skip';
}
