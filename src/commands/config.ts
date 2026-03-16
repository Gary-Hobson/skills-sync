/**
 * commands/config.ts — config 命令
 */

import { loadGlobalConfig, saveGlobalConfig } from '../core/config-manager.js';
import { success, error, info } from '../utils/output.js';
import type { GlobalConfig } from '../types/index.js';
import { EXIT_CODES } from '../types/index.js';
import { isTTY, promptSelect, promptInput, promptSearchSelect } from '../tui/prompts.js';
import { t, setLocale } from '../i18n/index.js';
import type { Locale } from '../i18n/index.js';
import { agentRegistry, getDefaultSkillsDir } from '../utils/path.js';
import { detectInstalledAgents } from './init.js';

const VALID_KEYS: (keyof GlobalConfig)[] = ['agent', 'remote', 'language'];

function formatConfigValue(key: keyof GlobalConfig, val: unknown): string {
  if (val === undefined) return t('common.notSet');
  if (key === 'agent') {
    const dir = getDefaultSkillsDir(String(val));
    const entry = agentRegistry[String(val)];
    const displayName = entry?.displayName ?? String(val);
    return dir ? `${displayName} (${val}) → ${dir}` : String(val);
  }
  return String(val);
}

async function configTUI(): Promise<void> {
  if (!isTTY()) { error(t('config.requiresSubcmd')); process.exit(EXIT_CODES.ARG_ERROR); }
  const config = loadGlobalConfig();
  if (!config) { info(t('config.noConfig')); return; }

  // 直接列出配置项，选中即编辑，Esc 退出
  const choices = VALID_KEYS.map(k => ({
    name: `${k} = ${formatConfigValue(k, config[k])}`,
    value: k,
  }));

  const key = await promptSelect(t('config.currentConfig'), choices);
  if (key === null) return;

  // agent: searchable select from installed agents
  if (key === 'agent') {
    const installedAgents = detectInstalledAgents();
    if (installedAgents.length === 0) {
      error(t('init.noAgentsDetected'));
      return;
    }
    const agentChoices = installedAgents.map(([id, paths]) => ({
      name: `${paths.displayName} (${id})`,
      value: id,
      description: paths.projectPath,
    }));
    const agentId = await promptSearchSelect(t('config.selectAgent'), agentChoices);
    if (agentId === null) return;
    await cmdConfigSet('agent', agentId);
    return;
  }

  // language: select
  if (key === 'language') {
    const lang = await promptSelect(t('config.languageDescription'), [
      { name: 'English', value: 'en' },
      { name: '中文', value: 'zh' },
    ]);
    if (lang === null) return;
    await cmdConfigSet('language', lang);
    setLocale(lang as Locale);
    return;
  }

  // other keys: free input
  const currentVal = config[key] !== undefined ? String(config[key]) : '';
  const newVal = await promptInput(t('config.newValue', { key: String(key) }), currentVal);
  await cmdConfigSet(String(key), newVal);
}

export { configTUI };

export async function cmdConfigGet(key: string | undefined): Promise<void> {
  const config = loadGlobalConfig();
  if (!config) { info(t('config.noConfig')); return; }
  if (key) {
    if (!VALID_KEYS.includes(key as keyof GlobalConfig)) {
      error(t('config.unknownKey', { key, keys: VALID_KEYS.join(', ') }));
      process.exit(EXIT_CODES.ARG_ERROR);
    }
    const val = config[key as keyof GlobalConfig];
    console.log(val !== undefined ? formatConfigValue(key as keyof GlobalConfig, val) : t('common.notSet'));
  } else {
    for (const k of VALID_KEYS) {
      const val = config[k];
      if (val !== undefined) console.log(`${k} = ${formatConfigValue(k, val)}`);
    }
  }
}

export async function cmdConfigSet(key: string, value: string): Promise<void> {
  if (!VALID_KEYS.includes(key as keyof GlobalConfig)) {
    error(t('config.unknownKey', { key, keys: VALID_KEYS.join(', ') }));
    process.exit(EXIT_CODES.ARG_ERROR);
  }
  const config = loadGlobalConfig() ?? { agent: 'claude-code', remote: '' };
  delete (config as unknown as Record<string, unknown>)['skills_dir'];
  (config as unknown as Record<string, unknown>)[key] = value;
  saveGlobalConfig(config);
  success(t('config.setDone', { key, value: formatConfigValue(key as keyof GlobalConfig, value) }));
}
