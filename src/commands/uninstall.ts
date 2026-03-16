/**
 * commands/uninstall.ts — uninstall 命令
 */

import { join, resolve } from 'node:path';
import { uninstallSkills, listInstalledSkills } from '../core/skill-manager.js';
import { getWorkspaceInfo, isInitialized } from '../core/config-manager.js';
import { buildSkillChoices, partitionSkills, printInvalidWarnings } from '../utils/skill-display.js';
import { success, error, warn, info } from '../utils/output.js';
import { EXIT_CODES } from '../types/index.js';
import { isTTY, promptSearchCheckbox, promptConfirm } from '../tui/prompts.js';
import { t } from '../i18n/index.js';

export interface UninstallOptions { dir?: string; dryRun?: boolean; }

async function uninstallTUI(opts: UninstallOptions = {}): Promise<void> {
  if (!isTTY()) {
    error(t('uninstall.requiresArgs'));
    error(t('uninstall.usage'));
    process.exit(EXIT_CODES.ARG_ERROR);
  }
  if (!isInitialized()) { error(t('common.notInitialized')); process.exit(EXIT_CODES.GENERAL_ERROR); }

  const workspace = getWorkspaceInfo(opts);
  const wsSkillsDir = opts.dir ? resolve(opts.dir) : join(workspace.path, workspace.skills_dir);
  const installed = listInstalledSkills(wsSkillsDir);
  if (installed.length === 0) { info(t('uninstall.noSkillsInstalled')); return; }

  const { valid, invalid } = partitionSkills(installed, wsSkillsDir);
  if (invalid.length > 0) printInvalidWarnings(invalid);
  if (valid.length === 0) { info(t('uninstall.noValidSkills')); return; }

  const choices = buildSkillChoices(valid, wsSkillsDir);
  const selected = await promptSearchCheckbox(t('uninstall.searchPrompt'), choices);
  if (selected.length === 0) { info(t('common.noSkillsSelected')); return; }

  const confirmed = await promptConfirm(
    t('uninstall.confirmPrompt', { count: selected.length, list: selected.join(', ') }), false,
  );
  if (!confirmed) { info(t('common.cancelled')); return; }
  await cmdUninstall(selected, opts);
}

export { uninstallTUI };

export async function cmdUninstall(skillNames: string[], opts: UninstallOptions = {}): Promise<void> {
  if (skillNames.length === 0) {
    error(t('uninstall.requiresAtLeastOne'));
    error(t('uninstall.usage'));
    process.exit(EXIT_CODES.ARG_ERROR);
  }
  if (!isInitialized()) { error(t('common.notInitialized')); process.exit(EXIT_CODES.GENERAL_ERROR); }
  const workspace = getWorkspaceInfo(opts);
  const wsSkillsDir = opts.dir ? resolve(opts.dir) : join(workspace.path, workspace.skills_dir);

  if (opts.dryRun) {
    info(t('uninstall.dryRunWouldRemove'));
    for (const name of skillNames) info(`  - ${name}`);
    return;
  }
  const result = uninstallSkills(skillNames, wsSkillsDir, false);
  if (result.removed.length > 0) success(t('uninstall.removed', { list: result.removed.join(', ') }));
  if (result.notFound.length > 0) warn(t('uninstall.notFound', { list: result.notFound.join(', ') }));
}
