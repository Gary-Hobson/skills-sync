/**
 * commands/info.ts — info 命令
 */

import { join } from 'node:path';
import { createFsAdapter } from '../adapters/fs.js';
import { hashDirectory } from '../utils/hash.js';
import { getSkillsDir, isInitialized } from '../core/config-manager.js';
import { loadGroups } from '../core/group-manager.js';
import { error, info } from '../utils/output.js';
import { EXIT_CODES } from '../types/index.js';
import { t } from '../i18n/index.js';
const fs = createFsAdapter();

export interface InfoOptions { json?: boolean; }

export async function cmdInfo(name: string, opts: InfoOptions = {}): Promise<void> {
  if (!isInitialized()) { error(t('common.notInitialized')); process.exit(EXIT_CODES.GENERAL_ERROR); }

  if (name.startsWith('@')) {
    const groupName = name.slice(1);
    const groups = loadGroups();
    const group = groups[groupName];
    if (!group) { error(t('info.groupNotFound', { name: groupName })); process.exit(EXIT_CODES.GENERAL_ERROR); }
    if (opts.json) { console.log(JSON.stringify({ name: groupName, ...group }, null, 2)); return; }
    info(t('info.groupHeader', { name: groupName }));
    console.log(t('info.groupDescription', { desc: group.description }));
    console.log(t('info.groupSkills', { count: group.skills.length, list: group.skills.join(', ') }));
    console.log(t('info.groupCreated', { date: group.created }));
    return;
  }

  const skillDir = join(getSkillsDir(), name);
  if (!fs.dirExists(skillDir)) { error(t('info.skillNotFound', { name })); process.exit(EXIT_CODES.GENERAL_ERROR); }

  const skillMdPath = join(skillDir, 'SKILL.md');
  const skillMdContent = fs.readTextFile(skillMdPath);
  const hash = hashDirectory(skillDir);
  const files = fs.listFiles(skillDir);

  if (opts.json) { console.log(JSON.stringify({ name, hash, files, hasSkillMd: skillMdContent !== null }, null, 2)); return; }

  info(t('info.skillHeader', { name }));
  console.log(t('info.skillHash', { hash }));
  console.log(t('info.skillFiles', { list: files.join(', ') }));
  if (skillMdContent) {
    console.log(t('info.skillMdHeader'));
    console.log(skillMdContent.trim());
  } else {
    console.log(t('info.noSkillMd'));
  }
}
