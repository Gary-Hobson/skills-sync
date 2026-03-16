/**
 * core/group-manager.ts — Group CRUD 管理
 *
 * 管理 skill groups（~/.agents/groups.json）。
 * Group 是一组 skill 的命名集合，方便批量安装。
 *
 * 依赖: adapters/fs.ts, core/config-manager.ts, types/index.ts
 * 被引用: commands/group.ts, commands/install.ts, commands/search.ts
 */

import { join } from 'node:path';
import { createFsAdapter } from '../adapters/fs.js';
import { getAgentsDir } from './config-manager.js';
import { SKILL_NAME_PATTERN } from '../types/index.js';
import type { GroupDef, GroupsMap } from '../types/index.js';

const fs = createFsAdapter();

function getGroupsPath(): string {
  return join(getAgentsDir(), 'groups.json');
}

export function loadGroups(): GroupsMap {
  return fs.readJsonFile<GroupsMap>(getGroupsPath()) ?? {};
}

export function saveGroups(groups: GroupsMap): void {
  fs.writeJsonFile(getGroupsPath(), groups);
}

/** 创建或更新一个 group */
export function createGroup(name: string, description: string, skills: string[]): void {
  if (!SKILL_NAME_PATTERN.test(name)) {
    throw new Error(`Invalid group name: "${name}". Must match /^[a-z0-9][a-z0-9-]*$/`);
  }
  const groups = loadGroups();
  groups[name] = { description, skills, created: new Date().toISOString() };
  saveGroups(groups);
}

/** 删除一个 group */
export function deleteGroup(name: string): boolean {
  const groups = loadGroups();
  if (!(name in groups)) return false;
  delete groups[name];
  saveGroups(groups);
  return true;
}

/** 获取一个 group 的 skill 列表 */
export function getGroupSkills(name: string): string[] | null {
  const groups = loadGroups();
  return groups[name]?.skills ?? null;
}

/** 列出所有 group 名称 */
export function listGroups(): string[] {
  return Object.keys(loadGroups());
}
