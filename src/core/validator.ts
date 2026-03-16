/**
 * core/validator.ts — Skill 规范校验
 *
 * 校验 skill 目录是否符合 agentskills.io 规范。
 * 规范要求：skill 目录下必须有 SKILL.md 文件。
 *
 * 依赖: node:fs
 * 被引用: core/skill-manager.ts, commands/publish.ts
 */

import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { SKILL_NAME_PATTERN } from '../types/index.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 校验一个 skill 目录是否合规。
 * - 目录名必须符合 /^[a-z0-9][a-z0-9-]*$/
 * - 目录下必须有 SKILL.md
 */
export function validateSkillDir(skillDir: string): ValidationResult {
  const errors: string[] = [];
  const name = basename(skillDir);

  if (!SKILL_NAME_PATTERN.test(name)) {
    errors.push(`Skill name "${name}" is invalid. Must match /^[a-z0-9][a-z0-9-]*$/`);
  }

  const skillMdPath = join(skillDir, 'SKILL.md');
  if (!existsSync(skillMdPath)) {
    errors.push(`Missing SKILL.md in ${skillDir}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 校验 skill 名称格式。
 */
export function validateSkillName(name: string): boolean {
  return SKILL_NAME_PATTERN.test(name);
}
