/**
 * utils/skill-display.ts — Skill TUI 显示工具
 *
 * 提供读取 SKILL.md 描述、校验合法性、构建带描述的 skill 选择列表等共用函数，
 * 供所有 TUI 多选 skill 的场景复用。
 *
 * 依赖: core/validator.ts
 * 被引用: commands/install.ts, commands/uninstall.ts, commands/publish.ts,
 *          commands/ls.ts, src/index.ts
 */

import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import chalk from 'chalk';
import { validateSkillDir } from '../core/validator.js';
import { t } from '../i18n/index.js';

/**
 * 计算字符串在终端中的显示宽度（CJK 字符占 2 列，其他占 1 列）。
 */
export function displayWidth(str: string): number {
  let width = 0;
  for (const ch of str) {
    const code = ch.codePointAt(0)!;
    if (
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0x303e) ||
      (code >= 0x3040 && code <= 0x33bf) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0x4e00 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff01 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x20000 && code <= 0x2fa1f)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * 按终端显示宽度截断字符串，保证不超过 maxWidth 列。
 */
export function truncateToWidth(str: string, maxWidth: number): string {
  let width = 0;
  const chars = [...str];
  for (let i = 0; i < chars.length; i++) {
    if (width + displayWidth(chars[i]) > maxWidth - 3) {
      return chars.slice(0, i).join('') + '...';
    }
    width += displayWidth(chars[i]);
  }
  return str;
}

/**
 * 从 SKILL.md YAML frontmatter 中读取 description 字段。
 * 根据 skill 名称宽度动态截断，确保整行不超过终端宽度。
 */
export function readSkillDescription(skillDir: string, skillNameWidth: number): string | undefined {
  const skillMdPath = join(skillDir, 'SKILL.md');
  if (!existsSync(skillMdPath)) return undefined;
  try {
    const content = readFileSync(skillMdPath, 'utf-8');
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return undefined;
    const descLine = match[1].split('\n').find(line => line.startsWith('description:'));
    if (!descLine) return undefined;
    let desc = descLine.replace(/^description:\s*/, '').trim();
    if ((desc.startsWith('"') && desc.endsWith('"')) || (desc.startsWith("'") && desc.endsWith("'"))) {
      desc = desc.slice(1, -1);
    }
    const termCols = process.stdout.columns || 80;
    const maxDescWidth = termCols - 6 - skillNameWidth - 2;
    if (maxDescWidth < 10) return undefined;
    return truncateToWidth(desc, maxDescWidth);
  } catch {
    return undefined;
  }
}

/**
 * 构建带描述的 skill 选择列表，供所有 TUI 多选 skill 的场景使用。
 *
 * @param skillNames   - skill 名称列表
 * @param skillsBaseDir - skill 目录所在的基础路径（用于读取 SKILL.md）
 * @param extraDesc    - 可选的额外标签映射（如状态标签），会显示在 skill 名称后括号中
 */
export function buildSkillChoices(
  skillNames: string[],
  skillsBaseDir: string,
  extraDesc?: Record<string, string>,
): Array<{ name: string; value: string; description?: string }> {
  return skillNames.map(name => {
    const extra = extraDesc?.[name];
    const label = extra ? `${name} (${extra})` : name;
    const mdDesc = readSkillDescription(join(skillsBaseDir, name), displayWidth(label));
    return {
      name: label,
      value: name,
      description: mdDesc,
    };
  });
}

/**
 * 将 skill 名称列表分为合法和非法两组。
 * 合法：目录名符合规范且包含 SKILL.md。
 */
export function partitionSkills(
  skillNames: string[],
  baseDir: string,
): { valid: string[]; invalid: Array<{ name: string; reasons: string[] }> } {
  const valid: string[] = [];
  const invalid: Array<{ name: string; reasons: string[] }> = [];
  for (const name of skillNames) {
    const result = validateSkillDir(join(baseDir, name));
    if (result.valid) {
      valid.push(name);
    } else {
      invalid.push({ name, reasons: result.errors });
    }
  }
  return { valid, invalid };
}

/**
 * 将非法 skill 列表以灰色提示输出到 stderr。
 * 不影响正常流程，仅告知用户跳过的原因。
 */
export function printInvalidWarnings(
  invalid: Array<{ name: string; reasons: string[] }>,
): void {
  for (const { name, reasons } of invalid) {
    process.stderr.write(chalk.gray(t('skillDisplay.skipped', { name, reasons: reasons.join('; ') })) + '\n');
  }
}
