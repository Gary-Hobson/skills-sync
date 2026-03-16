/**
 * adapters/github.ts — GitHub 远程仓库操作封装
 *
 * 使用 git sparse-checkout 下载仓库中的 skills 目录，不依赖 GitHub API（避免 rate limit）。
 *
 * 支持的 URL 格式：
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch/path/to/dir
 *
 * 依赖: node:fs, node:path, node:os, node:crypto, adapters/git.ts
 * 被引用: commands/install.ts
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { createGitAdapter } from './git.js';

// ─── URL 解析 ───

export interface ParsedGitHubUrl {
  /** GitHub 仓库 owner */
  owner: string;
  /** GitHub 仓库名 */
  repo: string;
  /** 分支名（默认 main） */
  branch: string;
  /** 仓库内子路径（空字符串表示仓库根目录） */
  subPath: string;
}

/**
 * 解析 GitHub URL，提取 owner/repo/branch/path。
 *
 * 支持格式：
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch
 * - https://github.com/owner/repo/tree/branch/path/to/dir
 *
 * @returns 解析结果，无法解析时返回 null
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  // 移除尾部斜杠和 .git 后缀
  const cleaned = url.replace(/\/+$/, '').replace(/\.git$/, '');

  const match = cleaned.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\/tree\/([^/]+)(?:\/(.+))?)?$/
  );

  if (!match) return null;

  const [, owner, repo, branch, subPath] = match;
  return {
    owner,
    repo,
    branch: branch || 'main',
    subPath: subPath || '',
  };
}

/**
 * 判断一个字符串是否为 GitHub URL。
 */
export function isGitHubUrl(input: string): boolean {
  return /^https?:\/\/github\.com\/[^/]+\/[^/]+/.test(input);
}

// ─── 内部工具 ───

/** 生成临时目录路径（不创建） */
function makeTmpDir(): string {
  return join(tmpdir(), `skills-sync-${randomBytes(6).toString('hex')}`);
}

/** 递归复制目录 */
function copyDirRecursive(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      mkdirSync(dirname(destPath), { recursive: true });
      writeFileSync(destPath, readFileSync(srcPath));
    }
  }
}

// ─── 远程 Skill 操作 ───

export interface RemoteSkillInfo {
  name: string;
  description?: string;
}

/**
 * Clone 句柄：列出 skills 后保持临时目录不删除，供后续直接复制，避免二次 clone。
 * 使用完毕后必须调用 close() 清理临时目录。
 */
export interface RemoteSkillsClone {
  skills: RemoteSkillInfo[];
  skillsSubDir: string;
  /**
   * 将指定 skill 从临时目录复制到目标目录（不触发网络请求）。
   * @param skillName - skill 名称
   * @param destDir   - 目标目录（已存在时会被覆盖）
   */
  copySkill(skillName: string, destDir: string): void;
  /** 清理临时目录 */
  close(): void;
}

/** 从 SKILL.md 内容提取 description 字段 */
function extractDescription(text: string): string | undefined {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return undefined;
  const descLine = match[1].split('\n').find(line => line.startsWith('description:'));
  if (!descLine) return undefined;
  let desc = descLine.replace(/^description:\s*/, '').trim();
  if ((desc.startsWith('"') && desc.endsWith('"')) || (desc.startsWith("'") && desc.endsWith("'"))) {
    desc = desc.slice(1, -1);
  }
  return desc || undefined;
}

/**
 * Sparse clone 远程仓库，自动探测 skills 目录位置（skills/ 或根目录），
 * 返回可复用的 clone 句柄。只做一次 git clone。
 * 调用方负责在使用完后调用 close() 清理临时目录。
 *
 * @param skillsSubDir 指定子目录；传 null 让函数自动探测（先 skills/，再根目录）
 */
export async function openRemoteSkillsClone(
  parsed: ParsedGitHubUrl,
  skillsSubDir: string | null = 'skills',
): Promise<RemoteSkillsClone> {
  const { owner, repo, branch } = parsed;
  const repoUrl = `https://github.com/${owner}/${repo}.git`;
  const tmpDir = makeTmpDir();

  const git = createGitAdapter();

  if (skillsSubDir === null) {
    // 自动探测模式：先 clone 不 checkout，用 ls-tree 探测目录，再 sparse-checkout
    await git.cloneNoCheckout(repoUrl, tmpDir, branch);

    // ls-tree 探测 skills/ 目录是否存在
    const entries = await git.lsTree(tmpDir, 'skills/');
    const resolvedSubDir = entries.length > 0 ? 'skills' : '';
    const sparsePath = resolvedSubDir || '/';

    await git.sparseCheckout(tmpDir, [sparsePath]);

    return buildCloneHandle(tmpDir, resolvedSubDir);
  }

  // 指定子目录模式
  const sparsePath = skillsSubDir || '/';
  await git.sparseClone(repoUrl, tmpDir, [sparsePath], branch);
  return buildCloneHandle(tmpDir, skillsSubDir);
}

/** 从已 checkout 的临时目录构建 clone 句柄 */
function buildCloneHandle(tmpDir: string, skillsSubDir: string): RemoteSkillsClone {
  const localSkillsDir = skillsSubDir ? join(tmpDir, skillsSubDir) : tmpDir;
  const skills: RemoteSkillInfo[] = [];

  if (existsSync(localSkillsDir)) {
    for (const entry of readdirSync(localSkillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillMdPath = join(localSkillsDir, entry.name, 'SKILL.md');
      if (!existsSync(skillMdPath)) continue;
      const skill: RemoteSkillInfo = { name: entry.name };
      try {
        skill.description = extractDescription(readFileSync(skillMdPath, 'utf-8'));
      } catch { /* ignore */ }
      skills.push(skill);
    }
  }

  return {
    skills,
    skillsSubDir,
    copySkill(skillName: string, destDir: string): void {
      const srcDir = join(localSkillsDir, skillName);
      if (!existsSync(srcDir)) {
        throw new Error(`Skill "${skillName}" not found in cloned repo`);
      }
      copyDirRecursive(srcDir, destDir);
    },
    close(): void {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    },
  };
}

/**
 * 列出远程仓库中指定目录下的所有 skill（子目录）。
 * 仅用于查询场景；安装场景请使用 openRemoteSkillsClone 避免二次下载。
 */
export async function listRemoteSkills(
  parsed: ParsedGitHubUrl,
  skillsSubDir = 'skills',
): Promise<RemoteSkillInfo[]> {
  const clone = await openRemoteSkillsClone(parsed, skillsSubDir);
  clone.close();
  return clone.skills;
}

/**
 * 下载远程仓库中指定 skill 的所有文件到本地目录。
 * 使用 git sparse-checkout 只下载该 skill 的目录。
 *
 * @param parsed   - 解析后的 GitHub URL 信息
 * @param skillName  - skill 名称（目录名）
 * @param destDir    - 本地目标目录（绝对路径）
 * @param skillsSubDir - 仓库内 skills 所在的子目录（默认 "skills"）
 */
export async function downloadRemoteSkill(
  parsed: ParsedGitHubUrl,
  skillName: string,
  destDir: string,
  skillsSubDir = 'skills',
): Promise<void> {
  const { owner, repo, branch } = parsed;
  const repoUrl = `https://github.com/${owner}/${repo}.git`;
  const tmpDir = makeTmpDir();

  const sparsePath = skillsSubDir ? `${skillsSubDir}/${skillName}` : skillName;

  try {
    const git = createGitAdapter();
    await git.sparseClone(repoUrl, tmpDir, [sparsePath], branch);

    const srcDir = join(tmpDir, sparsePath);
    if (!existsSync(srcDir)) {
      throw new Error(`Skill "${skillName}" not found at ${sparsePath} in ${owner}/${repo}`);
    }

    copyDirRecursive(srcDir, destDir);
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

/**
 * 从带有具体 skill 路径的 GitHub URL 中提取 skill 名称和 skills 父目录。
 *
 * 例如：
 * - https://github.com/anthropics/skills/tree/main/skills/pdf
 *   → { skillName: 'pdf', skillsSubDir: 'skills' }
 * - https://github.com/anthropics/skills/tree/main/my-skills/foo
 *   → { skillName: 'foo', skillsSubDir: 'my-skills' }
 *
 * @param parsed - 解析后的 GitHub URL
 * @returns skill 名称和父目录，如果 URL 指向仓库根（无 subPath）则返回 null
 */
export function extractSkillFromUrl(parsed: ParsedGitHubUrl): {
  skillName: string;
  skillsSubDir: string;
} | null {
  if (!parsed.subPath) return null;

  const parts = parsed.subPath.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const skillName = parts[parts.length - 1];
  const skillsSubDir = parts.slice(0, parts.length - 1).join('/');

  return { skillName, skillsSubDir };
}
