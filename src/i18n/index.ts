/**
 * i18n/index.ts — 国际化核心模块
 *
 * 提供 t() 翻译函数、locale 检测与设置。
 * 优先级：SKILLS_SYNC_LANG > config.json language > 系统 LANG/LC_ALL > 默认 "en"
 */

import { en } from './en.js';
import { zh } from './zh.js';

export type Locale = 'zh' | 'en';

const translations: Record<Locale, Record<string, string>> = { en, zh };

let currentLocale: Locale = 'en';

/**
 * 从系统环境变量检测语言。可选传入 config 中的 language 值。
 */
export function detectLocale(configLanguage?: string): Locale {
  // 1. SKILLS_SYNC_LANG env
  const envLang = process.env['SKILLS_SYNC_LANG'];
  if (envLang === 'zh' || envLang === 'en') return envLang;
  // 2. config.json language
  if (configLanguage === 'zh' || configLanguage === 'en') return configLanguage;
  // 3. system LANG/LC_ALL
  const sysLang = process.env['LANG'] ?? process.env['LC_ALL'] ?? '';
  if (/^zh/i.test(sysLang)) return 'zh';
  return 'en';
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

/**
 * 翻译函数。key 不存在时 fallback 到英文，再 fallback 到 key 本身。
 * {name} 占位符会被 params 替换。
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = translations[currentLocale] ?? translations.en;
  let text = dict[key] ?? translations.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}
