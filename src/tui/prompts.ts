/**
 * tui/prompts.ts — TUI 交互提示工具
 *
 * 封装 @inquirer/prompts 和自定义 prompt，提供统一的交互式提示函数。
 * 所有 TUI 交互通过此模块发起，确保风格一致。
 * Ctrl+C (SIGINT) 统一捕获，优雅退出（exit code 130）。
 *
 * 依赖: @inquirer/prompts, tui/search-checkbox.ts
 * 被引用: commands/*.ts
 */

import { input, select, checkbox, confirm } from '@inquirer/prompts';
import { createPrompt, useState, useKeypress, usePrefix, usePagination, isUpKey, isDownKey, isEnterKey } from '@inquirer/core';
import chalk from 'chalk';
import { searchCheckbox } from './search-checkbox.js';
import { EXIT_CODES } from '../types/index.js';

/** Esc-aware search select: single-select with type-to-filter, returns null on Esc */
const escSearchSelect: (
  config: { message: string; choices: Array<{ name: string; value: string; description?: string }>; pageSize?: number },
  context?: { input?: NodeJS.ReadableStream },
) => Promise<string | null> = createPrompt<string | null, { message: string; choices: Array<{ name: string; value: string; description?: string }>; pageSize?: number }>(
  (config, done) => {
    const { message, choices, pageSize = 10 } = config;
    const [cursor, setCursor] = useState(0);
    const [filter, setFilter] = useState('');
    const [status, setStatus] = useState<'idle' | 'done'>('idle');

    const filtered = filter
      ? choices.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.value.toLowerCase().includes(filter.toLowerCase()))
      : choices;

    useKeypress((key) => {
      if (isEnterKey(key)) {
        setStatus('done');
        done(filtered[cursor]?.value ?? null);
        return;
      }
      if (key.name === 'escape') {
        if (filter) { setFilter(''); setCursor(0); return; }
        setStatus('done');
        done(null);
        return;
      }
      if (isUpKey(key)) {
        setCursor(cursor <= 0 ? Math.max(filtered.length - 1, 0) : cursor - 1);
        return;
      }
      if (isDownKey(key)) {
        setCursor(cursor >= filtered.length - 1 ? 0 : cursor + 1);
        return;
      }
      if (key.name === 'backspace') {
        setFilter(filter.slice(0, -1));
        setCursor(0);
        return;
      }
      if (key.name && key.name.length === 1 && !key.ctrl) {
        setFilter(filter + key.name);
        setCursor(0);
      }
    });

    const prefix = usePrefix({ status: status === 'done' ? 'done' : 'idle' });

    if (status === 'done') {
      const selected = filtered[cursor];
      return `${prefix} ${message} ${selected ? chalk.cyan(selected.name) : ''}`;
    }

    const safeCursor = Math.min(cursor, Math.max(filtered.length - 1, 0));
    const page = usePagination({
      items: filtered,
      active: safeCursor,
      pageSize,
      renderItem({ item, isActive }) {
        const pointer = isActive ? chalk.cyan('❯') : ' ';
        const label = isActive ? chalk.cyan(item.name) : item.name;
        const desc = item.description ? chalk.dim(` ${item.description}`) : '';
        return `${pointer} ${label}${desc}`;
      },
      loop: true,
    });

    const desc = filtered[safeCursor]?.description;
    const descLine = desc ? `\n${chalk.cyan(desc)}` : '';
    const filterLine = filter ? ` ${chalk.yellow(filter)}` : '';
    const help = `${chalk.bold('↑↓')} ${chalk.dim('navigate')}${chalk.dim(' • ')}${chalk.bold('⏎')} ${chalk.dim('select')}${chalk.dim(' • ')}${chalk.dim('type to filter')}${chalk.dim(' • ')}${chalk.bold('Esc')} ${chalk.dim('back')}`;

    return `${prefix} ${chalk.bold(message)}${filterLine}${filtered.length === 0 ? `\n  ${chalk.dim('(no matches)')}` : `\n${page}`}${descLine}\n${help}`;
  },
);

/** Esc-aware select: returns null on Esc instead of throwing */
const escSelect: (
  config: { message: string; choices: Array<{ name: string; value: string; description?: string }>; pageSize?: number },
  context?: { input?: NodeJS.ReadableStream },
) => Promise<string | null> = createPrompt<string | null, { message: string; choices: Array<{ name: string; value: string; description?: string }>; pageSize?: number }>(
  (config, done) => {
    const { message, choices, pageSize = 10 } = config;
    const [cursor, setCursor] = useState(0);
    const [status, setStatus] = useState<'idle' | 'done'>('idle');

    useKeypress((key) => {
      if (isEnterKey(key)) {
        setStatus('done');
        done(choices[cursor]?.value ?? null);
        return;
      }
      if (key.name === 'escape') {
        setStatus('done');
        done(null);
        return;
      }
      if (isUpKey(key)) {
        setCursor(cursor <= 0 ? choices.length - 1 : cursor - 1);
      }
      if (isDownKey(key)) {
        setCursor(cursor >= choices.length - 1 ? 0 : cursor + 1);
      }
    });

    const prefix = usePrefix({ status: status === 'done' ? 'done' : 'idle' });

    if (status === 'done') {
      const selected = choices[cursor];
      return `${prefix} ${message} ${selected ? chalk.cyan(selected.name) : ''}`;
    }

    const page = usePagination({
      items: choices,
      active: cursor,
      pageSize,
      renderItem({ item, isActive }) {
        const pointer = isActive ? chalk.cyan('❯') : ' ';
        const label = isActive ? chalk.cyan(item.name) : item.name;
        return `${pointer} ${label}`;
      },
      loop: true,
    });

    const desc = choices[cursor]?.description;
    const descLine = desc ? `\n${chalk.cyan(desc)}` : '';
    const help = `${chalk.bold('↑↓')} ${chalk.dim('navigate')}${chalk.dim(' • ')}${chalk.bold('⏎')} ${chalk.dim('select')}${chalk.dim(' • ')}${chalk.bold('Esc')} ${chalk.dim('back')}`;

    return `${prefix} ${chalk.bold(message)}\n${page}${descLine}\n${help}`;
  },
);

/**
 * 包装 inquirer prompt，捕获 Ctrl+C (ExitPromptError)，优雅退出。
 */
async function withGracefulExit<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    // @inquirer/core throws ExitPromptError on Ctrl+C
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ExitPromptError') {
      process.exit(EXIT_CODES.USER_INTERRUPT);
    }
    throw err;
  }
}

/** 检测当前是否为 TTY 环境（非 TTY 不应进入 TUI） */
export function isTTY(): boolean {
  return !!process.stdin.isTTY && !!process.stdout.isTTY;
}

/** 文本输入 */
export async function promptInput(message: string, defaultValue?: string): Promise<string> {
  return withGracefulExit(() => input({ message, default: defaultValue }));
}

/** 单选（Esc 返回 null） */
export async function promptSelect<T extends string>(
  message: string,
  choices: Array<{ name: string; value: T; description?: string }>,
): Promise<T | null> {
  return withGracefulExit(() => escSelect({ message, choices })) as Promise<T | null>;
}

/** 多选（checkbox） */
export async function promptCheckbox<T extends string>(
  message: string,
  choices: Array<{ name: string; value: T; description?: string }>,
): Promise<T[]> {
  return withGracefulExit(() => checkbox({ message, choices }));
}

/** 确认（y/N） */
export async function promptConfirm(message: string, defaultValue = false): Promise<boolean> {
  return withGracefulExit(() => confirm({ message, default: defaultValue }));
}

/**
 * 可搜索的多选列表：实时输入过滤，空格切换选中，回车确认。
 * 基于 @inquirer/core 自定义实现。
 */
export async function promptSearchCheckbox(
  message: string,
  choices: Array<{ name: string; value: string; description?: string }>,
  pageSize?: number,
  defaultSelected?: string[],
): Promise<string[]> {
  return withGracefulExit(() => searchCheckbox({ message, choices, pageSize, defaultSelected }));
}

/** 可搜索的单选（type-to-filter + Esc 返回 null） */
export async function promptSearchSelect<T extends string>(
  message: string,
  choices: Array<{ name: string; value: T; description?: string }>,
): Promise<T | null> {
  return withGracefulExit(() => escSearchSelect({ message, choices })) as Promise<T | null>;
}
