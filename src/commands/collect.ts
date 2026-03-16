/**
 * commands/collect.ts — collect 命令
 */

import { join, resolve } from 'node:path';
import { statSync, readdirSync } from 'node:fs';
import { createFsAdapter } from '../adapters/fs.js';
import { validateSkillDir } from '../core/validator.js';
import { copySkillToMirror, pushToCloud } from '../core/sync-engine.js';
import { getSkillsDir, isInitialized } from '../core/config-manager.js';
import { warn, error, success, info, muted, blank } from '../utils/output.js';
import chalk from 'chalk';
import { hashDirectory } from '../utils/hash.js';
import { agentRegistry, resolveEnvPath } from '../utils/path.js';
import { EXIT_CODES } from '../types/index.js';
import { isTTY, promptInput, promptSearchCheckbox } from '../tui/prompts.js';
import { t } from '../i18n/index.js';
const fs = createFsAdapter();

export interface CollectOptions { dir?: string; dryRun?: boolean; message?: string; }

interface DiscoveredSkill {
  name: string; path: string; agent: string; location: string; mtime: number;
}
interface ScanResult {
  discovered: DiscoveredSkill[]; added: DiscoveredSkill[]; modified: DiscoveredSkill[];
  unchanged: DiscoveredSkill[]; invalid: Array<{ name: string; path: string; errors: string[] }>; scannedDirs: string[];
}

function getDirMtime(dir: string): number {
  try {
    let maxMtime = statSync(dir).mtimeMs;
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = join(dir, item.name);
      try {
        const stat = statSync(fullPath);
        if (stat.mtimeMs > maxMtime) maxMtime = stat.mtimeMs;
        if (item.isDirectory() && item.name !== '.git') {
          const subMtime = getDirMtime(fullPath);
          if (subMtime > maxMtime) maxMtime = subMtime;
        }
      } catch { /* skip */ }
    }
    return maxMtime;
  } catch { return 0; }
}

function getAllSkillDirs(): Array<{ dir: string; agent: string; location: 'global' | 'project' }> {
  const seen = new Set<string>();
  const result: Array<{ dir: string; agent: string; location: 'global' | 'project' }> = [];
  const cwd = process.cwd();
  const mirrorDir = getSkillsDir();
  for (const [agentId, paths] of Object.entries(agentRegistry)) {
    const globalDir = resolveEnvPath(paths.globalPath);
    if (globalDir && !seen.has(globalDir) && globalDir !== mirrorDir) {
      seen.add(globalDir);
      if (fs.dirExists(globalDir)) result.push({ dir: globalDir, agent: agentId, location: 'global' });
    }
    const projectDir = resolve(cwd, paths.projectPath);
    if (!seen.has(projectDir) && projectDir !== mirrorDir) {
      seen.add(projectDir);
      if (fs.dirExists(projectDir)) result.push({ dir: projectDir, agent: agentId, location: 'project' });
    }
  }
  return result;
}

function scanAllAgents(explicitDir?: string): ScanResult {
  const mirrorDir = getSkillsDir();
  const discovered = new Map<string, DiscoveredSkill>();
  const invalid: Array<{ name: string; path: string; errors: string[] }> = [];
  const scannedDirs: string[] = [];
  const dirsToScan = explicitDir
    ? [{ dir: resolve(explicitDir), agent: 'custom', location: 'project' as const }]
    : getAllSkillDirs();
  for (const { dir, agent, location } of dirsToScan) {
    if (!fs.dirExists(dir)) continue;
    scannedDirs.push(dir);
    for (const name of fs.listDirs(dir)) {
      const skillDir = join(dir, name);
      const validation = validateSkillDir(skillDir);
      if (!validation.valid) { invalid.push({ name, path: skillDir, errors: validation.errors }); continue; }
      const mtime = getDirMtime(skillDir);
      const existing = discovered.get(name);
      if (!existing || mtime > existing.mtime) discovered.set(name, { name, path: skillDir, agent, location, mtime });
    }
  }
  const added: DiscoveredSkill[] = [], modified: DiscoveredSkill[] = [], unchanged: DiscoveredSkill[] = [];
  for (const skill of discovered.values()) {
    const mirrorSkillDir = join(mirrorDir, skill.name);
    if (!fs.dirExists(mirrorSkillDir)) { added.push(skill); }
    else if (hashDirectory(skill.path) !== hashDirectory(mirrorSkillDir)) { modified.push(skill); }
    else { unchanged.push(skill); }
  }
  return { discovered: Array.from(discovered.values()), added, modified, unchanged, invalid, scannedDirs };
}

function skillSource(skill: DiscoveredSkill): string {
  return `${agentRegistry[skill.agent]?.displayName ?? skill.agent} (${skill.location})`;
}

async function collectTUI(opts: CollectOptions = {}): Promise<void> {
  if (!isTTY()) { await cmdCollect(opts); return; }
  if (!isInitialized()) { error(t('common.notInitialized')); process.exit(EXIT_CODES.GENERAL_ERROR); }

  info(t('collect.scanning'));
  const { discovered, added, modified, unchanged, invalid, scannedDirs } = scanAllAgents(opts.dir);
  muted(t('collect.scannedLocations', { count: scannedDirs.length }));
  for (const dir of scannedDirs) muted(`    ${dir}`);
  blank();

  if (invalid.length > 0) {
    for (const item of invalid) warn(t('collect.skip', { name: item.name, path: item.path, errors: item.errors.join('; ') }));
  }
  if (discovered.length === 0) { info(t('collect.noValidSkills')); return; }

  const changedCount = added.length + modified.length;
  info(t('collect.foundSkills', { count: discovered.length, added: added.length, modified: modified.length, unchanged: unchanged.length }));
  if (unchanged.length > 0) muted(t('collect.unchangedList', { list: unchanged.map(s => s.name).join(', ') }));
  if (changedCount === 0) { success(t('collect.allUpToDate')); return; }
  blank();

  const allChanged = [...added, ...modified];
  const choices = allChanged.map(skill => {
    const isNew = added.includes(skill);
    return {
      name: `${isNew ? chalk.green('+') : chalk.yellow('~')} ${skill.name}`,
      value: skill.name,
      description: `${isNew ? 'new' : 'modified'} ← ${skillSource(skill)}`,
    };
  });
  const selected = await promptSearchCheckbox(
    t('collect.selectPrompt', { added: added.length, modified: modified.length }),
    choices, undefined, allChanged.map(s => s.name),
  );
  if (selected.length === 0) { info(t('collect.nothingSelected')); return; }

  const toCollect = allChanged.filter(s => selected.includes(s.name));
  const selectedAdded = toCollect.filter(s => added.includes(s));
  const selectedModified = toCollect.filter(s => modified.includes(s));
  const msgParts: string[] = [];
  if (selectedAdded.length > 0) msgParts.push(`add ${selectedAdded.map(s => s.name).join(', ')}`);
  if (selectedModified.length > 0) msgParts.push(`update ${selectedModified.map(s => s.name).join(', ')}`);
  const defaultMsg = `collect: ${msgParts.join('; ')}`;
  const message = await promptInput(t('common.commitMessage'), defaultMsg);
  await doCollect(toCollect, opts.dryRun ?? false, message.trim() || defaultMsg);
}

export { collectTUI };

async function doCollect(skills: DiscoveredSkill[], dryRun: boolean, commitMsg: string): Promise<void> {
  if (dryRun) {
    info(t('collect.dryRunWouldCollect'));
    for (const skill of skills) info(`  - ${skill.name} ← ${skill.path}`);
    return;
  }
  for (const skill of skills) {
    copySkillToMirror(skill.name, skill.path);
    info(t('collect.collected', { name: skill.name, source: skillSource(skill) }));
  }
  const pushResult = await pushToCloud(commitMsg);
  if (!pushResult.success) { error(t('common.pushFailed', { error: pushResult.error ?? '' })); process.exit(EXIT_CODES.GENERAL_ERROR); }
  success(t('collect.publishedCount', { count: skills.length, list: skills.map(s => s.name).join(', ') }));
}

export async function cmdCollect(opts: CollectOptions = {}): Promise<void> {
  if (!isInitialized()) { error(t('common.notInitialized')); process.exit(EXIT_CODES.GENERAL_ERROR); }
  info(t('collect.scanning'));
  const { discovered, added, modified, unchanged, invalid, scannedDirs } = scanAllAgents(opts.dir);
  muted(t('collect.scannedLocationsShort', { count: scannedDirs.length }));

  if (invalid.length > 0) {
    for (const item of invalid) warn(t('collect.skipping', { name: item.name, path: item.path, errors: item.errors.join('; ') }));
  }
  if (discovered.length === 0) { info(t('collect.noValidSkills')); return; }

  const changedCount = added.length + modified.length;
  if (changedCount === 0) { success(t('collect.allUpToDateCount', { count: discovered.length })); return; }

  info(t('collect.foundSkills', { count: discovered.length, added: added.length, modified: modified.length, unchanged: unchanged.length }));
  if (added.length > 0) info(t('collect.new', { count: added.length, list: added.map(s => s.name).join(', ') }));
  if (modified.length > 0) info(t('collect.modified', { count: modified.length, list: modified.map(s => s.name).join(', ') }));
  if (unchanged.length > 0) muted(t('collect.unchangedCount', { count: unchanged.length, list: unchanged.map(s => s.name).join(', ') }));

  const allChanged = [...added, ...modified];
  const commitMsg = opts.message ?? `collect: ${added.length > 0 ? `add ${added.map(s => s.name).join(', ')}` : ''}${added.length > 0 && modified.length > 0 ? '; ' : ''}${modified.length > 0 ? `update ${modified.map(s => s.name).join(', ')}` : ''}`;
  await doCollect(allChanged, opts.dryRun ?? false, commitMsg);
}
