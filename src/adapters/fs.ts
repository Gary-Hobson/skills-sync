/**
 * adapters/fs.ts — 文件系统操作封装
 *
 * 封装所有文件系统操作，包括目录复制/删除、JSON/文本读写。
 * 本项目中所有文件操作应通过此模块调用，保持一致的错误处理和行为。
 *
 * 依赖: 无第三方依赖
 * 被引用: core/skill-manager.ts, core/config-manager.ts, core/group-manager.ts
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  cpSync,
  rmSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

export interface FsAdapter {
  /** 递归复制目录（用于 skill 安装） */
  copyDir(src: string, dest: string): void;

  /** 递归删除目录（用于 skill 卸载） */
  removeDir(dir: string): void;

  /** 读取 JSON 文件，文件不存在则返回 null */
  readJsonFile<T = unknown>(path: string): T | null;

  /** 写入 JSON 文件（自动创建父目录） */
  writeJsonFile(path: string, data: unknown): void;

  /** 确保目录存在（递归创建） */
  ensureDir(dir: string): void;

  /** 检查目录是否存在 */
  dirExists(dir: string): boolean;

  /** 检查文件是否存在 */
  fileExists(path: string): boolean;

  /** 列出指定目录下的子目录名（不含文件） */
  listDirs(dir: string): string[];

  /** 列出指定目录下的文件名（不含子目录） */
  listFiles(dir: string): string[];

  /** 读取文本文件，文件不存在则返回 null */
  readTextFile(path: string): string | null;

  /** 写入文本文件（自动创建父目录） */
  writeTextFile(path: string, content: string): void;
}

/** 创建 FsAdapter 实例 */
export function createFsAdapter(): FsAdapter {
  return {
    copyDir(src: string, dest: string): void {
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(src, dest, { recursive: true });
    },

    removeDir(dir: string): void {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
    },

    readJsonFile<T = unknown>(path: string): T | null {
      if (!existsSync(path)) {
        return null;
      }
      const content = readFileSync(path, 'utf-8');
      return JSON.parse(content) as T;
    },

    writeJsonFile(path: string, data: unknown): void {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    },

    ensureDir(dir: string): void {
      mkdirSync(dir, { recursive: true });
    },

    dirExists(dir: string): boolean {
      return existsSync(dir) && statSync(dir).isDirectory();
    },

    fileExists(path: string): boolean {
      return existsSync(path) && statSync(path).isFile();
    },

    listDirs(dir: string): string[] {
      if (!existsSync(dir)) {
        return [];
      }
      return readdirSync(dir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    },

    listFiles(dir: string): string[] {
      if (!existsSync(dir)) {
        return [];
      }
      return readdirSync(dir, { withFileTypes: true })
        .filter(entry => entry.isFile())
        .map(entry => entry.name);
    },

    readTextFile(path: string): string | null {
      if (!existsSync(path)) {
        return null;
      }
      return readFileSync(path, 'utf-8');
    },

    writeTextFile(path: string, content: string): void {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content, 'utf-8');
    },
  };
}
