/**
 * commands/publish.ts — publish 命令
 */

import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { copySkillToMirror, pushToCloud, pullFromCloud, deleteSkillFromMirror } from '../core/sync-engine.js';
import { detectConflict } from '../core/conflict-resolver.js';
import type { ConflictInfo } from '../core/conflict-resolver.js';
import { getWorkspaceInfo, getSkillsDir, isInitialized } from '../core/config-manager.js';
import { buildSkillChoices, partitionSkills, printInvalidWarnings } from '../utils/skill-display.js';
import { createFsAdapter } from '../adapters/fs.js';
import { listAvailableSkills } from '../core/skill-manager.js';
import { warn, error, success, info } from '../utils/output.js';
import { EXIT_CODES } from '../types/index.js';
import { isTTY, promptSearchCheckbox, promptConfirm, promptInput } from '../tui/prompts.js';
import { t } from '../i18n/index.js';
const fs = createFsAdapter();

export interface PublishOptions {
  message?: string; yes?: boolean; workspace?: boolean; cmd?: string; dir?: string; delete?: boolean;
}

function detectPublishable(wsSkillsBase: string, cloudDir: string): ConflictInfo[] {
  if (!existsSync(wsSkillsBase)) return [];
  const allDirs = fs.listDirs(wsSkillsBase);
  const results: ConflictInfo[] = [];
  for (const name of allDirs) {
    results.push(detectConflict(name, join(cloudDir, name), join(wsSkillsBase, name)));
  }
  return results;
}

async function publishTUI(opts: PublishOptions = {}): Promise<void> {
  if (!isTTY()) { error(t('publish.requiresArgs')); process.exit(EXIT_CODES.ARG_ERROR); }
  if (!isInitialized()) { error(t('common.notInitialized')); process.exit(EXIT_CODES.GENERAL_ERROR); }
  if (opts.delete) { await deleteTUI(opts); return; }

  info(t('common.pullLatest'));
  const pullResult = await pullFromCloud();
  if (!pullResult.success) warn(t('common.pullFailed', { error: pullResult.error ?? '' }));

  const workspace = getWorkspaceInfo(opts);
  const wsSkillsBase = opts.dir ? resolve(opts.dir) : join(workspace.path, workspace.skills_dir);
  const cloudDir = getSkillsDir();

  const rawWsSkills = existsSync(wsSkillsBase) ? fs.listDirs(wsSkillsBase) : [];
  const { invalid: invalidSkills } = partitionSkills(rawWsSkills, wsSkillsBase);
  if (invalidSkills.length > 0) printInvalidWarnings(invalidSkills);
  const invalidNames = new Set(invalidSkills.map(s => s.name));

  const publishable = detectPublishable(wsSkillsBase, cloudDir)
    .filter(c => c.status === 'modified' && !invalidNames.has(c.skillName));

  if (publishable.length === 0) { info(t('publish.nothingToPublish')); return; }

  const extraDesc: Record<string, string> = {};
  for (const c of publishable) extraDesc[c.skillName] = 'modified';
  const choices = buildSkillChoices(publishable.map(c => c.skillName), wsSkillsBase, extraDesc);
  const selected = await promptSearchCheckbox(t('publish.searchPrompt'), choices);
  if (selected.length === 0) { info(t('common.noSkillsSelected')); return; }

  const message = await promptInput(t('common.commitMessage'), `publish: update ${selected.join(', ')}`);
  await cmdPublish(selected, { ...opts, message: message.trim() || undefined });
}

export { publishTUI };

export async function cmdPublish(skillNames: string[], opts: PublishOptions = {}): Promise<void> {
  if (!isInitialized()) { error(t('common.notInitialized')); process.exit(EXIT_CODES.GENERAL_ERROR); }

  info(t('common.pullLatest'));
  const pullResult = await pullFromCloud();
  if (!pullResult.success) warn(t('common.pullFailed', { error: pullResult.error ?? '' }));

  const workspace = getWorkspaceInfo(opts);
  const wsSkillsBase = opts.dir ? resolve(opts.dir) : join(workspace.path, workspace.skills_dir);
  const cloudDir = getSkillsDir();

  const rawWsSkills = existsSync(wsSkillsBase) ? fs.listDirs(wsSkillsBase) : [];
  const { invalid: invalidSkills } = partitionSkills(rawWsSkills, wsSkillsBase);
  if (invalidSkills.length > 0) printInvalidWarnings(invalidSkills);
  const invalidNames = new Set(invalidSkills.map(s => s.name));

  let toPublish = detectPublishable(wsSkillsBase, cloudDir)
    .filter(c => c.status === 'modified' && !invalidNames.has(c.skillName));
  if (!opts.workspace && skillNames.length > 0) {
    toPublish = toPublish.filter(c => skillNames.includes(c.skillName));
  }
  if (toPublish.length === 0) { info(t('publish.nothingToPublishAll')); return; }

  info(t('publish.willPublish'));
  for (const c of toPublish) info(`  - ${c.skillName}`);

  if (!opts.yes) {
    if (!isTTY()) { error(t('publish.requiresConfirm')); process.exit(EXIT_CODES.ARG_ERROR); }
    const confirmed = await promptConfirm(t('publish.confirmPrompt', { count: toPublish.length }), false);
    if (!confirmed) { info(t('common.cancelled')); return; }
  }

  for (const c of toPublish) {
    copySkillToMirror(c.skillName, join(wsSkillsBase, c.skillName));
    info(t('common.copiedToMirror', { name: c.skillName }));
  }

  const commitMsg = opts.message ?? `publish: update ${toPublish.map(c => c.skillName).join(', ')}`;
  const pushResult = await pushToCloud(commitMsg, opts.cmd);
  if (!pushResult.success) { error(t('common.pushFailed', { error: pushResult.error ?? '' })); process.exit(EXIT_CODES.GENERAL_ERROR); }
  success(t('publish.published', { count: toPublish.length, list: toPublish.map(c => c.skillName).join(', ') }));
}

async function deleteTUI(opts: PublishOptions = {}): Promise<void> {
  info(t('common.pullLatest'));
  const pullResult = await pullFromCloud();
  if (!pullResult.success) warn(t('common.pullFailed', { error: pullResult.error ?? '' }));

  const cloudDir = getSkillsDir();
  const availableSkills = listAvailableSkills();
  if (availableSkills.length === 0) { info(t('publish.nothingToDelete')); return; }

  const choices = buildSkillChoices(availableSkills, cloudDir);
  const selected = await promptSearchCheckbox(t('publish.deleteSearchPrompt'), choices);
  if (selected.length === 0) { info(t('common.noSkillsSelected')); return; }

  warn(t('publish.deleteWarning', { count: selected.length }));
  for (const name of selected) warn(`  - ${name}`);
  const confirmed = await promptConfirm(t('publish.deleteConfirm'), false);
  if (!confirmed) { info(t('common.cancelled')); return; }

  const message = await promptInput(t('common.commitMessage'), `delete: remove ${selected.join(', ')}`);
  await cmdPublishDelete(selected, { ...opts, message: message.trim() || undefined });
}

export async function cmdPublishDelete(skillNames: string[], opts: PublishOptions = {}): Promise<void> {
  if (!isInitialized()) { error(t('common.notInitialized')); process.exit(EXIT_CODES.GENERAL_ERROR); }
  if (skillNames.length === 0) {
    error(t('publish.requiresAtLeastOne'));
    error(t('publish.deleteUsage'));
    process.exit(EXIT_CODES.ARG_ERROR);
  }

  info(t('common.pullLatest'));
  const pullResult = await pullFromCloud();
  if (!pullResult.success) warn(t('common.pullFailed', { error: pullResult.error ?? '' }));

  const deleted: string[] = [];
  const notFound: string[] = [];
  for (const name of skillNames) {
    if (deleteSkillFromMirror(name)) { deleted.push(name); info(t('publish.deletedFromMirror', { name })); }
    else notFound.push(name);
  }
  if (notFound.length > 0) warn(t('publish.notFoundInCloud', { list: notFound.join(', ') }));
  if (deleted.length === 0) { info(t('publish.nothingToDelete')); return; }

  if (!opts.yes) {
    if (!isTTY()) { error(t('publish.deleteRequiresConfirm')); process.exit(EXIT_CODES.ARG_ERROR); }
    const confirmed = await promptConfirm(t('publish.deleteConfirmPrompt', { count: deleted.length, list: deleted.join(', ') }), false);
    if (!confirmed) { info(t('common.cancelled')); return; }
  }

  const commitMsg = opts.message ?? `delete: remove ${deleted.join(', ')}`;
  const pushResult = await pushToCloud(commitMsg, opts.cmd);
  if (!pushResult.success) { error(t('common.pushFailed', { error: pushResult.error ?? '' })); process.exit(EXIT_CODES.GENERAL_ERROR); }
  success(t('publish.deletedFromCloud', { count: deleted.length, list: deleted.join(', ') }));
}
