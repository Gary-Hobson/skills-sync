/**
 * commands/install.ts — install 命令
 */

import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createFsAdapter } from '../adapters/fs.js';
import {
  isGitHubUrl, parseGitHubUrl, extractSkillFromUrl,
  openRemoteSkillsClone, downloadRemoteSkill,
} from '../adapters/github.js';
import { installSkills, listAvailableSkills } from '../core/skill-manager.js';
import { pullFromCloud } from '../core/sync-engine.js';
import { isInitialized, getSkillsDir, getWorkspaceInfo } from '../core/config-manager.js';
import { detectConflict } from '../core/conflict-resolver.js';
import { getDefaultSkillsDir } from '../utils/path.js';
import { buildSkillChoices, truncateToWidth, displayWidth } from '../utils/skill-display.js';
import { success, error, warn, info } from '../utils/output.js';
import type { ConflictStrategy } from '../types/index.js';
import { EXIT_CODES } from '../types/index.js';
import { isTTY, promptSelect, promptSearchCheckbox } from '../tui/prompts.js';
import { loadGroups } from '../core/group-manager.js';
import { partitionSkills, printInvalidWarnings } from '../utils/skill-display.js';
import { t } from '../i18n/index.js';
const fs = createFsAdapter();

export interface InstallOptions {
  agent?: string; dir?: string; local?: boolean; cloud?: boolean; skipPull?: boolean;
}

export { buildSkillChoices } from '../utils/skill-display.js';

function resolveWsSkillsDir(opts: InstallOptions): string {
  const workspace = getWorkspaceInfo(opts);
  if (opts.dir) return resolve(opts.dir);
  if (opts.agent) {
    const agentDefaultDir = getDefaultSkillsDir(opts.agent);
    if (!agentDefaultDir) {
      error(t('install.unknownAgent', { agent: opts.agent }));
      process.exit(EXIT_CODES.ARG_ERROR);
    }
    return join(workspace.path, agentDefaultDir);
  }
  return join(workspace.path, workspace.skills_dir);
}

export async function installFromRemote(url: string, opts: InstallOptions = {}): Promise<void> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    error(t('install.badUrl', { url }));
    error(t('install.supportedFormats'));
    error(t('install.supportedFormat1'));
    error(t('install.supportedFormat2'));
    process.exit(EXIT_CODES.ARG_ERROR);
  }
  const skillInfo = extractSkillFromUrl(parsed);
  if (skillInfo) {
    await installRemoteSkill(parsed, skillInfo.skillName, skillInfo.skillsSubDir, opts);
  } else {
    await installRemoteTUI(parsed, opts);
  }
}

async function installRemoteTUI(
  parsed: import('../adapters/github.js').ParsedGitHubUrl, opts: InstallOptions,
): Promise<void> {
  if (!isTTY()) {
    error(t('install.requiresTTY'));
    error(t('install.provideSpecificUrl'));
    process.exit(EXIT_CODES.ARG_ERROR);
  }
  info(t('install.fetchingRemote', { owner: parsed.owner, repo: parsed.repo, branch: parsed.branch }));
  const clone = await openRemoteSkillsClone(parsed, null);
  try {
    if (clone.skills.length === 0) {
      error(t('install.noValidSkillsRemote', { owner: parsed.owner, repo: parsed.repo }));
      error(t('install.skillsMustHaveMd'));
      return;
    }
    info(t('install.foundRemoteSkills', { count: clone.skills.length }));
    const wsSkillsDir = resolveWsSkillsDir(opts);
    const diskInstalled = new Set<string>(existsSync(wsSkillsDir) ? fs.listDirs(wsSkillsDir) : []);
    const choices = clone.skills.map(s => {
      const installed = diskInstalled.has(s.name);
      const tag = installed ? '  [installed]' : '';
      const termCols = process.stdout.columns || 80;
      const maxDescWidth = termCols - 6 - displayWidth(s.name) - 2;
      let desc = s.description || '';
      if (desc && maxDescWidth >= 10) desc = truncateToWidth(desc, maxDescWidth);
      return { name: s.name, value: s.name, description: desc + tag };
    });
    const selected = await promptSearchCheckbox(
      t('install.selectFromRemote', { owner: parsed.owner, repo: parsed.repo }), choices,
    );
    if (selected.length === 0) { info(t('common.noSkillsSelected')); return; }
    fs.ensureDir(wsSkillsDir);
    let installedCount = 0;
    let skippedCount = 0;
    for (const skillName of selected) {
      const wsSkillDir = join(wsSkillsDir, skillName);
      if (existsSync(wsSkillDir)) {
        const action = await promptSelect(t('install.alreadyExists', { name: skillName }), [
          { name: t('install.updateOption'), value: 'update' as const },
          { name: t('install.skipOption'), value: 'skip' as const },
        ]);
        if (action === null || action === 'skip') {
          info(t('install.skipped', { name: skillName })); skippedCount++; continue;
        }
        fs.removeDir(wsSkillDir);
      }
      info(t('install.installing', { name: skillName }));
      try {
        clone.copySkill(skillName, wsSkillDir);
        success(t('install.installed', { name: skillName }));
        installedCount++;
      } catch (err) {
        error(t('install.failed', { name: skillName, error: String(err) }));
      }
    }
    if (installedCount > 0 || skippedCount > 0) {
      info(t('install.doneCount', { installed: installedCount, skipped: skippedCount }));
    }
  } finally { clone.close(); }
}

async function installRemoteSkill(
  parsed: import('../adapters/github.js').ParsedGitHubUrl,
  skillName: string, skillsSubDir: string, opts: InstallOptions,
): Promise<void> {
  const wsSkillsDir = resolveWsSkillsDir(opts);
  const wsSkillDir = join(wsSkillsDir, skillName);
  fs.ensureDir(wsSkillsDir);
  if (existsSync(wsSkillDir)) {
    if (opts.cloud) {
      info(t('install.alreadyExistsCloud', { name: skillName }));
      fs.removeDir(wsSkillDir);
    } else if (opts.local) {
      info(t('install.alreadyExistsKeepLocal', { name: skillName }));
      return;
    } else if (isTTY()) {
      const action = await promptSelect(t('install.alreadyExistsLocal', { name: skillName }), [
        { name: t('install.updateOption'), value: 'update' as const },
        { name: t('install.skipOption'), value: 'skip' as const },
      ]);
      if (action === null || action === 'skip') { info(t('install.skipped', { name: skillName })); return; }
      fs.removeDir(wsSkillDir);
    } else {
      warn(t('install.alreadyExistsNonTty', { name: skillName }));
      return;
    }
  }
  info(t('install.downloading', { name: skillName, owner: parsed.owner, repo: parsed.repo }));
  try {
    await downloadRemoteSkill(parsed, skillName, wsSkillDir, skillsSubDir);
    success(t('install.installed', { name: skillName }));
  } catch (err) {
    error(t('install.downloadFailed', { name: skillName, error: String(err) }));
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

// ─── 本地安装 ───

async function installTUI(opts: InstallOptions = {}): Promise<void> {
  if (!isTTY()) { await cmdInstall([], opts); return; }
  if (!isInitialized()) { error(t('common.notInitialized')); process.exit(EXIT_CODES.GENERAL_ERROR); }

  info(t('common.pullLatest'));
  const pullResult = await pullFromCloud();
  if (!pullResult.success) warn(t('common.pullFailed', { error: pullResult.error ?? '' }));

  const allSkills = listAvailableSkills();
  const groups = loadGroups();
  const cloudDir = getSkillsDir();
  const { valid: validSkills, invalid: invalidSkills } = partitionSkills(allSkills, cloudDir);
  if (invalidSkills.length > 0) printInvalidWarnings(invalidSkills);

  const workspace = getWorkspaceInfo(opts);
  const wsSkillsDir = opts.dir ? resolve(opts.dir) : join(workspace.path, workspace.skills_dir);
  const diskInstalled = new Set<string>(existsSync(wsSkillsDir) ? fs.listDirs(wsSkillsDir) : []);

  const choices = buildSkillChoices(validSkills, cloudDir);
  for (const [name, def] of Object.entries(groups)) {
    choices.push({ name: `@${name}`, value: `@${name}`, description: `${def.description} (${def.skills.length} skills)` });
  }
  if (choices.length === 0) { info(t('install.noSkillsAvailable')); return; }

  const defaultSelected = validSkills.filter(n => diskInstalled.has(n));
  const selected = await promptSearchCheckbox(t('install.searchPrompt'), choices, undefined, defaultSelected);
  if (selected.length === 0 && defaultSelected.length > 0) return;

  const selectedSet = new Set(selected);
  const toUninstall = defaultSelected.filter(n => !selectedSet.has(n));
  const toInstall = selected.filter(n => !diskInstalled.has(n));

  const currentDisk = existsSync(wsSkillsDir) ? fs.listDirs(wsSkillsDir) : [];
  const diffs: Array<{ skillName: string }> = [];
  for (const name of currentDisk) {
    const cloudSkillDir = join(cloudDir, name);
    const wsSkillDir2 = join(wsSkillsDir, name);
    if (!existsSync(cloudSkillDir)) continue;
    const conflict = detectConflict(name, cloudSkillDir, wsSkillDir2);
    if (conflict.status === 'modified') diffs.push({ skillName: name });
  }

  if (diffs.length > 0) {
    info(t('install.differsFromCloud', { count: diffs.length }));
    for (const d of diffs) info(`  ${d.skillName}`);
    for (const d of diffs) {
      const choice = await promptSelect(t('install.keepOrCloud', { name: d.skillName }), [
        { name: t('install.keepLocalOption'), value: 'local' as const },
        { name: t('install.useCloudOption'), value: 'cloud' as const },
      ]);
      if (choice === null) continue;
      if (choice === 'cloud') {
        fs.removeDir(join(wsSkillsDir, d.skillName));
        fs.copyDir(join(cloudDir, d.skillName), join(wsSkillsDir, d.skillName));
        success(t('install.updatedToCloud', { name: d.skillName }));
      } else {
        info(t('install.keptLocal', { name: d.skillName }));
      }
    }
  }

  if (toInstall.length === 0 && toUninstall.length === 0) {
    if (diffs.length === 0) info(t('install.noChanges'));
    return;
  }
  if (toUninstall.length > 0) {
    const { cmdUninstall } = await import('./uninstall.js');
    await cmdUninstall(toUninstall, { dir: opts.dir });
  }
  if (toInstall.length > 0) {
    await cmdInstall(toInstall, { ...opts, skipPull: true });
  }
}

export { installTUI };

export async function cmdInstall(skillNames: string[], opts: InstallOptions = {}): Promise<void> {
  const remoteUrls = skillNames.filter(isGitHubUrl);
  const localNames = skillNames.filter(n => !isGitHubUrl(n));
  if (remoteUrls.length > 0) {
    for (const url of remoteUrls) await installFromRemote(url, opts);
    if (localNames.length === 0) return;
  }
  if (!isInitialized()) { error(t('common.notInitialized')); process.exit(EXIT_CODES.GENERAL_ERROR); }
  if (!opts.skipPull) {
    info(t('common.pullLatest'));
    const pullResult = await pullFromCloud();
    if (!pullResult.success) warn(t('common.pullFailed', { error: pullResult.error ?? '' }));
  }

  const wsSkillsDir = resolveWsSkillsDir(opts);
  const strategy: ConflictStrategy = opts.cloud ? 'cloud' : 'workspace';

  const resolvedNames = localNames.filter(n => !n.startsWith('@'));
  const groupRefs = localNames.filter(n => n.startsWith('@'));
  if (groupRefs.length > 0) {
    const groups = loadGroups();
    for (const ref of groupRefs) {
      const groupName = ref.slice(1);
      const def = groups[groupName];
      if (def) resolvedNames.push(...def.skills);
      else warn(`Group "${ref}" not found, skipping.`);
    }
  }
  if (resolvedNames.length === 0) {
    error(t('install.noNamesSpecified'));
    process.exit(EXIT_CODES.ARG_ERROR);
  }
  fs.ensureDir(wsSkillsDir);
  const result = await installSkills(resolvedNames, wsSkillsDir, strategy, false);
  if (result.installed.length > 0) success(t('install.installedList', { list: result.installed.join(', ') }));
  if (result.skipped.length > 0) info(t('install.skippedList', { list: result.skipped.join(', ') }));
  if (result.errors.length > 0) {
    for (const e of result.errors) error(t('install.failedSkill', { name: e.skill, reason: e.reason }));
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
  if (result.installed.length === 0 && result.skipped.length === 0 && result.errors.length === 0) {
    info(t('install.nothingToInstall'));
  }
}
