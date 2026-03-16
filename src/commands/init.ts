/**
 * commands/init.ts — init 命令
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { createGitAdapter } from '../adapters/git.js';
import {
  getAgentsDir, getSkillsDir, getGitRoot,
  saveGlobalConfig, loadGlobalConfig, isInitialized,
} from '../core/config-manager.js';
import { agentRegistry, getDefaultSkillsDir, resolveEnvPath } from '../utils/path.js';
import { success, error, info, warn } from '../utils/output.js';
import { EXIT_CODES } from '../types/index.js';
import type { GlobalConfig } from '../types/index.js';
import { isTTY, promptInput, promptSelect, promptConfirm, promptSearchSelect } from '../tui/prompts.js';
import { t, setLocale, detectLocale } from '../i18n/index.js';

const git = createGitAdapter();

/** 检测 gh CLI 是否可用且已登录 */
async function isGhAvailable(): Promise<boolean> {
  try {
    const { execSync } = await import('node:child_process');
    execSync('gh auth status', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** 获取 gh 当前登录用户名 */
async function getGhUsername(): Promise<string | null> {
  try {
    const { execSync } = await import('node:child_process');
    return execSync('gh api user -q .login', { encoding: 'utf-8' }).trim() || null;
  } catch {
    return null;
  }
}

/** 用 gh 创建私有仓库并返回 SSH URL，失败返回空字符串 */
async function tryCreateRepoWithGh(): Promise<string> {
  const ghOk = await isGhAvailable();
  if (!ghOk) {
    info(t('init.noGhCli'));
    return '';
  }

  const username = await getGhUsername();
  if (!username) {
    info(t('init.ghNotLoggedIn'));
    return '';
  }

  const repoName = '.skills';
  const fullName = `${username}/${repoName}`;
  info(t('init.ghDetected', { user: username }));
  const create = await promptConfirm(t('init.ghCreateRepo', { repo: fullName }), true);
  if (!create) return '';

  try {
    const { execSync } = await import('node:child_process');
    const result = execSync(
      `gh repo create ${repoName} --private --clone=false --description "AI Agent skills"`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] },
    ).trim();
    success(t('init.ghRepoCreated', { repo: fullName }));
    // 返回 SSH URL
    return `git@github.com:${fullName}.git`;
  } catch (e) {
    const msg = String(e);
    if (msg.includes('already exists')) {
      info(t('init.ghRepoExists', { repo: fullName }));
      return `git@github.com:${fullName}.git`;
    }
    error(t('init.ghCreateFailed', { error: msg }));
    return '';
  }
}

export interface InitOptions {
  agent?: string;
  dir?: string;
  language?: string;
}

/** 检测系统中已安装的 agent（全局配置目录存在） */
export function detectInstalledAgents(): Array<[string, typeof agentRegistry[string]]> {
  const home = homedir();
  const mirrorDir = getAgentsDir();
  return Object.entries(agentRegistry)
    .filter(([, paths]) => {
      const globalResolved = resolveEnvPath(paths.globalPath);
      const globalParent = dirname(globalResolved);
      // 排除镜像目录本身（避免自引用）
      if (globalParent === mirrorDir) return false;
      return existsSync(globalParent);
    })
    .sort(([a], [b]) => a.localeCompare(b));
}

async function initTUI(): Promise<void> {
  if (!isTTY()) {
    error(t('init.requiresArg'));
    error(t('init.usage'));
    process.exit(EXIT_CODES.ARG_ERROR);
  }

  const existingConfig = loadGlobalConfig();

  // ── 步骤 1：语言选择（仅首次初始化，且未设置 language 配置时） ──
  let selectedLanguage: string | undefined;
  if (!existingConfig?.language) {
    const detectedLocale = detectLocale(undefined);
    // 把检测到的语言排在第一位作为默认推荐
    const langChoices = detectedLocale === 'zh'
      ? [
          { name: t('init.langChinese'), value: 'zh' },
          { name: t('init.langEnglish'), value: 'en' },
        ]
      : [
          { name: t('init.langEnglish'), value: 'en' },
          { name: t('init.langChinese'), value: 'zh' },
        ];
    const langChoice = await promptSelect(t('init.selectLanguage'), langChoices);
    if (langChoice !== null) {
      setLocale(langChoice as 'en' | 'zh');
      selectedLanguage = langChoice;
    }
  }

  let repo: string;

  if (existingConfig?.remote) {
    info(t('init.currentRepo', { repo: existingConfig.remote }));
    if (existingConfig.agent) {
      info(t('init.currentAgent', { agent: existingConfig.agent }));
    }
    const replace = await promptConfirm(t('init.replaceRepo'), false);
    if (replace) {
      repo = await promptInput(t('init.promptNewRepo'));
      if (!repo.trim()) { error(t('init.repoRequired')); process.exit(EXIT_CODES.ARG_ERROR); }
    } else {
      repo = existingConfig.remote;
    }
  } else {
    repo = await promptInput(t('init.promptRepo'));
    if (!repo.trim()) {
      // 用户没有输入仓库地址，尝试用 gh 创建
      repo = await tryCreateRepoWithGh();
      if (!repo) {
        error(t('init.repoRequired'));
        process.exit(EXIT_CODES.ARG_ERROR);
      }
    }
  }

  const installedAgents = detectInstalledAgents();
  if (installedAgents.length === 0) {
    error(t('init.noAgentsDetected'));
    error(t('init.useAgentFlag'));
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }

  const agentChoices = installedAgents.map(([id, paths]) => ({
    name: `${paths.displayName} (${id})`,
    value: id,
    description: t('init.agentSkillsDir', { path: paths.projectPath }),
  }));
  const agentId = await promptSearchSelect(t('init.selectAgent'), agentChoices);
  if (agentId === null) return;

  await cmdInit(repo.trim(), {
    agent: agentId,
    language: selectedLanguage,
  });
}

export { initTUI };

/** 确保 gitRoot 下 .gitignore 包含指定条目，不存在则追加 */
function ensureGitignoreEntry(gitRoot: string, entry: string): void {
  const gitignorePath = join(gitRoot, '.gitignore');
  let content = '';
  if (existsSync(gitignorePath)) {
    content = readFileSync(gitignorePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim());
    if (lines.includes(entry)) return;
  }
  const nl = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  writeFileSync(gitignorePath, content + nl + entry + '\n', 'utf-8');
}

export async function cmdInit(repo: string, opts: InitOptions = {}): Promise<void> {
  const sshUrl = git.normalizeToSshUrl(repo);
  if (!sshUrl) {
    error(t('init.badUrl', { repo }));
    error(t('init.supportedFormats'));
    process.exit(EXIT_CODES.ARG_ERROR);
  }

  const mirrorDir = getAgentsDir();

  if (isInitialized()) {
    info(t('init.mirrorExists'));
    try {
      const { branch } = await git.fetchAndCheckout(getGitRoot());
      success(t('init.pulled', { branch }));
    } catch (err) {
      warn(t('init.pullFailed', { error: String(err) }));
    }
  } else {
    info(t('init.cloning', { url: sshUrl, dir: mirrorDir }));
    try {
      await git.clone(sshUrl, mirrorDir);
      success(t('init.cloneComplete'));
    } catch (e) {
      error(t('init.cloneFailed', { error: String(e) }));
      process.exit(EXIT_CODES.GENERAL_ERROR);
    }
  }

  let agentId: string;
  if (opts.agent) {
    agentId = opts.agent;
  } else if (isTTY()) {
    const installedAgents = detectInstalledAgents();
    if (installedAgents.length === 0) {
      error(t('init.noAgentsWithFlag'));
      process.exit(EXIT_CODES.GENERAL_ERROR);
    }
    const agentChoices = installedAgents.map(([id, paths]) => ({
      name: `${paths.displayName} (${id})`,
      value: id,
      description: t('init.agentSkillsDir', { path: paths.projectPath }),
    }));
    agentId = (await promptSearchSelect(t('init.selectAgent'), agentChoices))!;
    if (!agentId) return;
  } else {
    agentId = 'claude-code';
  }

  if (!(agentId in agentRegistry)) {
    error(t('init.unknownAgent', { agent: agentId, list: Object.keys(agentRegistry).join(', ') }));
    process.exit(EXIT_CODES.ARG_ERROR);
  }

  // 确保 config.json 在 .gitignore 中（本地配置不应提交）
  ensureGitignoreEntry(getGitRoot(), 'config.json');

  const existing = loadGlobalConfig() ?? {};
  delete (existing as Record<string, unknown>)['skills_dir'];
  const configToSave: GlobalConfig = { ...existing, agent: agentId, remote: sshUrl };
  if (opts.language) {
    configToSave.language = opts.language;
  }
  saveGlobalConfig(configToSave);
  success(t('init.configSaved', { agent: agentId, remote: sshUrl }));
  info(t('init.mirrorDirInfo', { dir: mirrorDir }));
  info(t('init.runInstall'));

  if (isTTY()) {
    const doCollect = await promptConfirm(t('init.scanWorkspaces'), true);
    if (doCollect) {
      const { cmdCollect } = await import('./collect.js');
      await cmdCollect({});
    }
  }
}
