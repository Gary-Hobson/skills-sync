/**
 * tui/search-checkbox.ts — 可搜索的多选列表
 *
 * 基于 @inquirer/core 自定义实现，支持：
 * - 实时输入关键词过滤列表
 * - 空格切换选中/取消
 * - 上下箭头导航
 * - 回车确认选择
 * - 退格删除搜索字符
 *
 * 依赖: @inquirer/core
 * 被引用: tui/prompts.ts
 */

import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  isUpKey,
  isDownKey,
  isSpaceKey,
  isEnterKey,
  isBackspaceKey,
} from '@inquirer/core';
import chalk from 'chalk';

export interface SearchCheckboxChoice {
  name: string;
  value: string;
  description?: string;
}

interface SearchCheckboxConfig {
  message: string;
  choices: SearchCheckboxChoice[];
  pageSize?: number;
  /** Pre-selected values (e.g. already installed skills) */
  defaultSelected?: string[];
}

export const searchCheckbox: (
  config: SearchCheckboxConfig,
  context?: { input?: NodeJS.ReadableStream; clearPromptOnDone?: boolean },
) => Promise<string[]> = createPrompt<string[], SearchCheckboxConfig>(
  (config, done) => {
    const { message, choices, pageSize = 15, defaultSelected = [] } = config;

    const [searchTerm, setSearchTerm] = useState('');
    const [cursor, setCursor] = useState(0);
    const [selected, setSelected] = useState<ReadonlyArray<string>>([...defaultSelected]);
    const [status, setStatus] = useState<'idle' | 'done'>('idle');

    // Track which items were pre-selected (installed)
    const preSelected = new Set(defaultSelected);

    // Filter choices by search term
    const q = searchTerm.toLowerCase();
    const filtered = q
      ? choices.filter(c => c.name.toLowerCase().includes(q))
      : choices;

    useKeypress((key, rl) => {
      if (isEnterKey(key)) {
        setStatus('done');
        done([...selected]);
        return;
      }

      // Esc → cancel (return empty selection)
      if (key.name === 'escape') {
        setStatus('done');
        done([]);
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

      if (isSpaceKey(key)) {
        if (filtered.length > 0 && filtered[cursor]) {
          const val = filtered[cursor].value;
          const set = new Set(selected);
          if (set.has(val)) {
            set.delete(val);
          } else {
            set.add(val);
          }
          setSelected([...set]);
        }
        return;
      }

      if (isBackspaceKey(key)) {
        if (searchTerm.length > 0) {
          setSearchTerm(searchTerm.slice(0, -1));
          setCursor(0);
        }
        return;
      }

      // Tab clears search
      if (key.name === 'tab') {
        setSearchTerm('');
        setCursor(0);
        return;
      }

      // Printable character → use rl.line which handles shift, unicode, etc.
      if (!key.ctrl && key.name) {
        // rl.line contains the full current input line; we use it as the new search term
        const line = rl.line.trim();
        if (line !== searchTerm) {
          setSearchTerm(line);
          setCursor(0);
        }
      }
    });

    const prefix = usePrefix({ status: status === 'done' ? 'done' : 'idle' });

    if (status === 'done') {
      const names = choices
        .filter(c => selected.includes(c.value))
        .map(c => c.name);
      return `${prefix} ${message} ${names.length > 0 ? names.join(', ') : '(none)'}`;
    }

    const page = usePagination({
      items: filtered,
      active: Math.min(cursor, Math.max(filtered.length - 1, 0)),
      pageSize,
      renderItem({ item, isActive }) {
        const checked = selected.includes(item.value);
        const checkbox = checked ? chalk.green('[x]') : '[ ]';
        const pointer = isActive ? '>' : ' ';
        const desc = item.description ? `  ${chalk.gray(item.description)}` : '';
        const label = isActive ? chalk.blue(item.name) : item.name;
        return `${pointer} ${checkbox} ${label}${desc}`;
      },
      loop: true,
    });

    const selectedCount = selected.length;
    const searchHint = searchTerm ? ` filter: "${searchTerm}"` : '';
    const countInfo = filtered.length < choices.length
      ? ` (${filtered.length}/${choices.length})`
      : ` (${choices.length})`;
    const header = `${prefix} ${message}${countInfo}${searchHint}  [${selectedCount} selected]`;
    const help = 'Type to filter · ↑↓ navigate · Space toggle · Tab clear · Enter confirm · Esc back';

    return `${header}\n${page}\n${help}`;
  },
);
