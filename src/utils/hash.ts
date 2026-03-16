/**
 * utils/hash.ts — MD5 签名计算
 *
 * 计算 skill 目录内所有文件内容的 MD5 签名，
 * 用于快速判断云端与本地的 skill 内容是否一致。
 *
 * 无外部依赖，使用 Node.js 内置 crypto 模块。
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 递归收集目录下所有文件的相对路径（按名称排序，确保跨平台一致性）。
 * 跳过 .git 目录。
 */
function collectFiles(dir: string, prefix = ''): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));
  const files: string[] = [];

  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name === '.git') continue;
      files.push(...collectFiles(join(dir, entry.name), rel));
    } else {
      files.push(rel);
    }
  }

  return files;
}

/**
 * 计算目录内容的 MD5 签名。
 *
 * 将所有文件的相对路径和文件内容依次写入 hash，
 * 返回十六进制摘要字符串。路径排序保证在不同环境下结果一致。
 */
export function hashDirectory(dir: string): string {
  const hash = createHash('md5');
  const files = collectFiles(dir);

  for (const file of files) {
    hash.update(file);
    hash.update(readFileSync(join(dir, file)));
  }

  return hash.digest('hex');
}
