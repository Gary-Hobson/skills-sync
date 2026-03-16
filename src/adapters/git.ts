/**
 * adapters/git.ts — Git 操作封装
 *
 * 使用 simple-git 封装所有 git 操作。
 * 本项目中所有 git 操作必须通过此模块调用，不直接使用 shell。
 *
 * 依赖: simple-git
 * 被引用: core/sync-engine.ts, core/config-manager.ts, commands/init.ts, commands/publish.ts
 */

import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

export interface GitAdapter {
  /** 克隆仓库到指定目录 */
  clone(repoUrl: string, targetDir: string): Promise<void>;

  /** 强制拉取最新（确保 R ≡ L） */
  pull(repoDir: string): Promise<void>;

  /** 推送到远端 */
  push(repoDir: string): Promise<void>;

  /** 获取仓库状态 */
  status(repoDir: string): Promise<GitStatus>;

  /** 提交变更 */
  commit(repoDir: string, message: string, files: string[]): Promise<void>;

  /** 获取远端 URL */
  getRemoteUrl(repoDir: string): Promise<string | null>;

  /** 设置或更新 origin remote URL */
  setRemoteUrl(repoDir: string, url: string): Promise<void>;

  /** 检查目录是否是 git 仓库 */
  isGitRepo(dir: string): Promise<boolean>;

  /** 初始化新 git 仓库 */
  init(dir: string): Promise<void>;

  /** 获取当前分支名 */
  getCurrentBranch(repoDir: string): Promise<string>;

  /** 获取文件 diff（工作区 vs 最新提交） */
  diff(repoDir: string, files?: string[]): Promise<string>;

  /** fetch 远端 */
  fetch(repoDir: string, remote?: string, branch?: string): Promise<void>;

  /** 将各种 URL 格式统一为 SSH URL */
  normalizeToSshUrl(input: string): string | null;

  /** 验证远程仓库是否可访问 */
  isRemoteReachable(url: string): Promise<boolean>;

  /** fetch 远端并检出主分支（用于 init 场景） */
  fetchAndCheckout(repoDir: string): Promise<{ branch: string; pulled: boolean }>;

  /** 稀疏克隆仓库到指定目录，只检出指定路径 */
  sparseClone(repoUrl: string, targetDir: string, paths: string[], branch?: string): Promise<void>;

  /** 克隆仓库但不检出文件（用于后续 ls-tree 探测 + sparse-checkout） */
  cloneNoCheckout(repoUrl: string, targetDir: string, branch?: string): Promise<void>;

  /** 设置 sparse-checkout 路径并检出 */
  sparseCheckout(repoDir: string, paths: string[]): Promise<void>;

  /** 列出指定路径下的目录条目（不需 checkout，只读 tree 对象） */
  lsTree(repoDir: string, path: string): Promise<string[]>;
}

export interface GitStatus {
  isClean: boolean;
  modified: string[];
  created: string[];
  deleted: string[];
}

/** 创建绑定到指定目录的 SimpleGit 实例 */
function createGit(baseDir: string): SimpleGit {
  const options: Partial<SimpleGitOptions> = {
    baseDir,
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: true,
  };
  return simpleGit(options);
}

/**
 * 将各种输入格式统一转换为 SSH git URL。
 * - "user/repo"                         -> git@github.com:user/repo.git
 * - "https://github.com/user/repo"      -> git@github.com:user/repo.git
 * - "git@github.com:user/repo.git"      -> 原样返回
 *
 * 无法识别的格式返回 null。
 */
function normalizeToSshUrl(input: string): string | null {
  // 已是 SSH 格式
  if (input.startsWith('git@')) {
    return input.endsWith('.git') ? input : `${input}.git`;
  }

  // HTTPS 格式
  const httpsMatch = input.match(
    /^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?$/,
  );
  if (httpsMatch) {
    const [, host, user, repo] = httpsMatch;
    return `git@${host}:${user}/${repo}.git`;
  }

  // 简写格式: user/repo
  if (/^[^/]+\/[^/]+$/.test(input)) {
    const repo = input.endsWith('.git') ? input : `${input}.git`;
    return `git@github.com:${repo}`;
  }

  return null;
}

/** 创建 GitAdapter 实例 */
export function createGitAdapter(): GitAdapter {
  return {
    async clone(repoUrl: string, targetDir: string): Promise<void> {
      const git = simpleGit();
      await git.clone(repoUrl, targetDir);
    },

    async pull(repoDir: string): Promise<void> {
      const git = createGit(repoDir);
      // 获取当前分支
      const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
      // fetch + reset --hard 确保本地镜像与远端完全一致（R ≡ L）
      await git.fetch(['origin', branch]);
      await git.reset(['--hard', `origin/${branch}`]);
    },

    async push(repoDir: string): Promise<void> {
      const git = createGit(repoDir);
      const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
      await git.push(['origin', branch, '-u']);
    },

    async status(repoDir: string): Promise<GitStatus> {
      const git = createGit(repoDir);
      const s = await git.status();
      return {
        isClean: s.isClean(),
        modified: s.modified,
        created: s.created,
        deleted: s.deleted,
      };
    },

    async commit(repoDir: string, message: string, files: string[]): Promise<void> {
      const git = createGit(repoDir);
      await git.add(files);
      await git.commit(message);
    },

    async getRemoteUrl(repoDir: string): Promise<string | null> {
      try {
        const git = createGit(repoDir);
        const remotes = await git.getRemotes(true);
        const origin = remotes.find(r => r.name === 'origin');
        return origin?.refs.push ?? origin?.refs.fetch ?? null;
      } catch {
        return null;
      }
    },

    async setRemoteUrl(repoDir: string, url: string): Promise<void> {
      const git = createGit(repoDir);
      const remotes = await git.getRemotes(true);
      const origin = remotes.find(r => r.name === 'origin');
      if (origin) {
        await git.remote(['set-url', 'origin', url]);
      } else {
        await git.remote(['add', 'origin', url]);
      }
    },

    async isGitRepo(dir: string): Promise<boolean> {
      try {
        const git = createGit(dir);
        return await git.checkIsRepo();
      } catch {
        return false;
      }
    },

    async init(dir: string): Promise<void> {
      const git = simpleGit();
      await git.init([dir]);
    },

    async getCurrentBranch(repoDir: string): Promise<string> {
      const git = createGit(repoDir);
      const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
      return branch || 'main';
    },

    async diff(repoDir: string, files?: string[]): Promise<string> {
      const git = createGit(repoDir);
      if (files && files.length > 0) {
        return await git.diff(['--', ...files]);
      }
      return await git.diff();
    },

    async fetch(repoDir: string, remote = 'origin', branch?: string): Promise<void> {
      const git = createGit(repoDir);
      const args = [remote];
      if (branch) {
        args.push(branch);
      }
      await git.fetch(args);
    },

    normalizeToSshUrl,

    async isRemoteReachable(url: string): Promise<boolean> {
      try {
        const git = simpleGit();
        await git.listRemote([url]);
        return true;
      } catch {
        return false;
      }
    },

    async fetchAndCheckout(repoDir: string): Promise<{ branch: string; pulled: boolean }> {
      const git = createGit(repoDir);
      await git.fetch(['origin']);

      // 获取远端默认分支名
      let branch = 'main';
      try {
        const lsRemote = await git.listRemote(['--symref', 'origin', 'HEAD']);
        const match = lsRemote.match(/refs\/heads\/(\S+)\s+HEAD/);
        if (match) branch = match[1];
      } catch {
        // 保持默认 main
      }

      // 判断本地是否有 commit
      let hasCommits = false;
      try {
        await git.revparse(['HEAD']);
        hasCommits = true;
      } catch {
        hasCommits = false;
      }

      if (!hasCommits) {
        // 新仓库：checkout 远程主分支
        await git.checkout(['-b', branch, '--track', `origin/${branch}`]);
        return { branch, pulled: true };
      }

      // 已有 commit：pull --rebase
      const headBefore = await git.revparse(['HEAD']);
      await git.pull('origin', branch, { '--rebase': null });
      const headAfter = await git.revparse(['HEAD']);
      return { branch, pulled: headBefore !== headAfter };
    },

    async sparseClone(repoUrl: string, targetDir: string, paths: string[], branch?: string): Promise<void> {
      const git = simpleGit();
      // --no-checkout: 跳过初始 checkout，等 sparse-checkout set 后再 checkout
      // --single-branch: 只拉取目标分支，减少协商时间
      // --filter=blob:none: 不下载 blob，按需 fetch
      const cloneArgs = ['--filter=blob:none', '--no-checkout', '--depth=1', '--single-branch'];
      if (branch) cloneArgs.push('--branch', branch);
      await git.clone(repoUrl, targetDir, cloneArgs);
      const repoGit = createGit(targetDir);
      await repoGit.raw(['sparse-checkout', 'set', ...paths]);
      await repoGit.raw(['checkout']);
    },

    async cloneNoCheckout(repoUrl: string, targetDir: string, branch?: string): Promise<void> {
      const git = simpleGit();
      const args = ['--filter=blob:none', '--no-checkout', '--depth=1', '--single-branch'];
      if (branch) args.push('--branch', branch);
      await git.clone(repoUrl, targetDir, args);
    },

    async sparseCheckout(repoDir: string, paths: string[]): Promise<void> {
      const repoGit = createGit(repoDir);
      await repoGit.raw(['sparse-checkout', 'set', ...paths]);
      await repoGit.raw(['checkout']);
    },

    async lsTree(repoDir: string, path: string): Promise<string[]> {
      const git = createGit(repoDir);
      try {
        const output = await git.raw(['ls-tree', '--name-only', 'HEAD', path]);
        return output.split('\n').filter(Boolean);
      } catch {
        return [];
      }
    },
  };
}
