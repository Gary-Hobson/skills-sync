/**
 * commands/ls.ts — ls 命令
 */

import { join } from 'node:path';
import { getSkillSyncStatus, listAvailableSkills, installSkills } from '../core/skill-manager.js';
import { getWorkspaceInfo, getSkillsDir, isInitialized } from '../core/config-manager.js';
import { copySkillToMirror, pushToCloud, pullFromCloud } from '../core/sync-engine.js';
import { error, info, success, blank } from '../utils/output.js';
import { partitionSkills, printInvalidWarnings } from '../utils/skill-display.js';
import type { SkillSyncInfo } from '../types/index.js';
import { EXIT_CODES } from '../types/index.js';
import { isTTY, promptSelect, promptSearchCheckbox, promptConfirm, promptInput } from '../tui/prompts.js';
import { t } from '../i18n/index.js';

function statusIcon(status: string): string {
  switch (status) {
    case 'synced': return '✓';
    case 'modified': return '~';
    default: return '?';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'synced': return t('ls.statusSynced');
    case 'modified': return t('ls.statusModified');
    default: return status;
  }
}

function sortSkills(skills: SkillSyncInfo[]): SkillSyncInfo[] {
  const order: Record<string, number> = { modified: 0, synced: 1 };
  return [...skills].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
}

function getValidSkills(wsSkillsDir: string): { skills: SkillSyncInfo[]; invalidNames: Set<string> } {
  const allSkills = getSkillSyncStatus(wsSkillsDir);
  const { invalid: invalidSkills } = partitionSkills(allSkills.map(s => s.name), wsSkillsDir);
  if (invalidSkills.length > 0) printInvalidWarnings(invalidSkills);
  const invalidNames = new Set(invalidSkills.map(s => s.name));
  return { skills: sortSkills(allSkills.filter(s => !invalidNames.has(s.name))), invalidNames };
}

export async function lsTUI(): Promise<void> {
  if (!isInitialized()) { error(t('common.notInitialized')); process.exit(EXIT_CODES.GENERAL_ERROR); }
  const workspace = getWorkspaceInfo();
  const wsSkillsDir = join(workspace.path, workspace.skills_dir);

  info(t('ls.checkingCloud'));
  await pullFromCloud();
  const { skills } = getValidSkills(wsSkillsDir);
  if (skills.length === 0) { info(t('ls.noSkillsInstalled')); return; }

  const modifiedCount = skills.filter(s => s.status === 'modified').length;
  const syncedCount = skills.filter(s => s.status === 'synced').length;

  const parts: string[] = [t('ls.summaryInstalled', { count: skills.length })];
  if (modifiedCount > 0) parts.push(t('ls.summaryModified', { count: modifiedCount }));
  if (syncedCount > 0) parts.push(t('ls.summarySynced', { count: syncedCount }));
  info(parts.join('  |  '));
  blank();

  const choices = skills.map(s => ({ name: `${statusIcon(s.status)} ${s.name}`, value: s.name, description: statusLabel(s.status) }));
  const selected = await promptSearchCheckbox(t('ls.selectPrompt'), choices);
  if (selected.length === 0) return;

  const selectedSkills = skills.filter(s => selected.includes(s.name));
  const hasModified = selectedSkills.some(s => s.status === 'modified');

  const actions: Array<{ name: string; value: string; description?: string }> = [];
  if (hasModified) {
    actions.push({ name: t('ls.publishAction'), value: 'publish', description: t('ls.publishDesc', { count: selectedSkills.filter(s => s.status === 'modified').length }) });
    actions.push({ name: t('ls.forceSyncAction'), value: 'force-cloud', description: t('ls.forceSyncDesc') });
  }
  actions.push({ name: t('ls.cancelAction'), value: 'cancel' });

  const action = await promptSelect(t('ls.actionPrompt', { count: selected.length }), actions);
  if (action === null || action === 'cancel') return;

  switch (action) {
    case 'publish': {
      const toPublish = selectedSkills.filter(s => s.status === 'modified').map(s => s.name);
      if (toPublish.length === 0) { info(t('ls.noModified')); break; }
      const message = await promptInput(t('common.commitMessage'), `publish: update ${toPublish.join(', ')}`);
      for (const name of toPublish) {
        copySkillToMirror(name, join(wsSkillsDir, name));
        info(t('common.copiedToMirror', { name }));
      }
      const pushResult = await pushToCloud(message.trim() || undefined);
      if (pushResult.success) success(t('ls.published', { list: toPublish.join(', ') }));
      else error(t('common.pushFailed', { error: pushResult.error ?? '' }));
      break;
    }
    case 'force-cloud': {
      const confirmed = await promptConfirm(t('ls.resetConfirm', { count: selected.length }), false);
      if (!confirmed) { info(t('common.cancelled')); break; }
      const result = await installSkills(selected, wsSkillsDir, 'cloud');
      if (result.installed.length > 0) success(t('ls.resetDone', { list: result.installed.join(', ') }));
      break;
    }
  }
}

export async function cmdLs(): Promise<void> {
  if (!isInitialized()) { error(t('common.notInitialized')); process.exit(EXIT_CODES.GENERAL_ERROR); }
  const workspace = getWorkspaceInfo();
  const wsSkillsDir = join(workspace.path, workspace.skills_dir);
  const installed = getSkillSyncStatus(wsSkillsDir);
  if (installed.length === 0) {
    info(t('ls.noSkillsInstalledAvailable'));
    const available = listAvailableSkills();
    const { valid: validAvailable, invalid: invalidAvailable } = partitionSkills(available, getSkillsDir());
    if (invalidAvailable.length > 0) printInvalidWarnings(invalidAvailable);
    if (validAvailable.length === 0) { info(t('ls.none')); }
    else { for (const name of validAvailable) console.log(`  ${name}`); }
    return;
  }
  const { skills } = getValidSkills(wsSkillsDir);
  info(t('ls.workspacePath', { path: workspace.path }));
  info(t('ls.skillsDir', { path: wsSkillsDir }));
  info(t('ls.agent', { agent: workspace.agent }));
  for (const s of skills) {
    const label = statusLabel(s.status).padEnd(20);
    console.log(`  ${label}  ${s.name}`);
  }
}
