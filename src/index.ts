/**
 * index.ts — CLI 入口，注册所有命令
 *
 * 每个子命令的逻辑在 src/commands/ 中实现。
 * 无参数时进入 TUI 模式（如果支持），有参数时走 CLI 模式。
 *
 * 依赖: commander, commands/*, i18n
 */

import { Command } from 'commander';
import { cmdInit, initTUI } from './commands/init.js';
import { cmdInstall, installTUI, installFromRemote } from './commands/install.js';
import { cmdLink, cmdUnlink, linkTUI } from './commands/link.js';
import { cmdLs, lsTUI } from './commands/ls.js';
import { cmdUninstall, uninstallTUI } from './commands/uninstall.js';
import { cmdInfo } from './commands/info.js';
import { cmdPublish, publishTUI, cmdPublishDelete } from './commands/publish.js';
import { cmdCollect, collectTUI } from './commands/collect.js';
import { cmdConfigGet, cmdConfigSet, configTUI } from './commands/config.js';
import { createGroup, deleteGroup, loadGroups } from './core/group-manager.js';
import { listAvailableSkills } from './core/skill-manager.js';
import { pushToCloud } from './core/sync-engine.js';
import { getWorkspaceInfo, getSkillsDir, loadGlobalConfig } from './core/config-manager.js';
import { buildSkillChoices, partitionSkills, printInvalidWarnings } from './utils/skill-display.js';
import { EXIT_CODES } from './types/index.js';
import { success, error, info } from './utils/output.js';
import { isTTY, promptSelect, promptSearchCheckbox, promptInput, promptConfirm } from './tui/prompts.js';
import { t, detectLocale, setLocale } from './i18n/index.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

// ── Initialize locale BEFORE registering commands (descriptions evaluate eagerly) ──
const globalConfig = loadGlobalConfig();
const locale = detectLocale(globalConfig?.language);
setLocale(locale);

// ── Register commands ──
const program = new Command();

program
  .name('skills-sync')
  .description(t('program.description'))
  .version(version)
  .addHelpText('after', t('program.helpText'));

// ── init ──
program
  .command('init')
  .description(t('cmd.init.description'))
  .argument('[repo]', t('cmd.init.arg.repo'))
  .option('-a, --agent <id>', t('opt.agentDefault'))
  .option('-d, --dir <path>', t('opt.skillsInstallDir'))
  .addHelpText('after', t('cmd.init.helpText'))
  .action(async (repo: string | undefined, opts: { agent?: string; dir?: string }) => {
    if (!repo) {
      await initTUI();
    } else {
      await cmdInit(repo, opts);
    }
  });

// ── install ──
program
  .command('install')
  .description(t('cmd.install.description'))
  .argument('[skills...]', t('cmd.install.arg.skills'))
  .option('-a, --agent <id>', t('opt.targetAgent'))
  .option('-d, --dir <path>', t('opt.installDir'))
  .option('--group', t('opt.groupSelect'), false)
  .option('--cloud', t('opt.cloudConflict'), false)
  .option('--local', t('opt.localConflict'), false)
  .addHelpText('after', t('cmd.install.helpText'))
  .action(async (skills: string[], opts: { agent?: string; dir?: string; group: boolean; cloud: boolean; local: boolean }) => {
    if (opts.group) {
      await installGroupTUI(opts);
    } else if (skills.length === 0) {
      await installTUI(opts);
    } else {
      await cmdInstall(skills, opts);
    }
  });

/** TUI 模式：从 group 列表中选择安装 */
async function installGroupTUI(opts: { agent?: string; dir?: string }): Promise<void> {
  if (!isTTY()) {
    error(t('install.groupRequiresTTY'));
    process.exit(EXIT_CODES.ARG_ERROR);
  }

  const { isInitialized } = await import('./core/config-manager.js');
  if (!isInitialized()) {
    error(t('common.notInitialized'));
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }

  const groups = loadGroups();
  const entries = Object.entries(groups);
  if (entries.length === 0) {
    error(t('install.noGroups'));
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }

  const choices = entries.map(([name, def]) => ({
    name: `@${name}`,
    value: name,
    description: `${def.description || ''} (${def.skills.length} skills: ${def.skills.join(', ')})`.trim(),
  }));

  const selected = await promptSearchCheckbox(t('install.selectGroups'), choices);
  if (selected.length === 0) {
    info(t('install.noGroupsSelected'));
    return;
  }

  const skillSet = new Set<string>();
  for (const groupName of selected) {
    const def = groups[groupName];
    if (def) {
      for (const s of def.skills) skillSet.add(s);
    }
  }

  const skillNames = [...skillSet];
  info(t('install.installingFromGroups', { count: skillNames.length, groups: selected.length }));
  await cmdInstall(skillNames, opts);
}

// ── ls ──
program
  .command('ls')
  .description(t('cmd.ls.description'))
  .action(async () => {
    await cmdLs();
  });

// ── uninstall ──
program
  .command('uninstall')
  .description(t('cmd.uninstall.description'))
  .argument('[skills...]', t('cmd.uninstall.arg.skills'))
  .option('-d, --dir <path>', t('opt.skillsDir'))
  .option('--dry-run', t('opt.dryRun'), false)
  .addHelpText('after', t('cmd.uninstall.helpText'))
  .action(async (skills: string[], opts: { dir?: string; dryRun: boolean }) => {
    if (skills.length === 0) {
      await uninstallTUI(opts);
    } else {
      await cmdUninstall(skills, opts);
    }
  });

// ── info ──
program
  .command('info')
  .description(t('cmd.info.description'))
  .argument('<name>', t('cmd.info.arg.name'))
  .option('--json', t('opt.json'), false)
  .action(async (name: string, opts: { json: boolean }) => {
    await cmdInfo(name, opts);
  });

// ── group ──
const groupCmd = program
  .command('group')
  .description(t('cmd.group.description'));

groupCmd
  .addCommand(
    new Command('create')
      .description(t('cmd.group.create.description'))
      .argument('[name]', t('cmd.group.create.arg.name'))
      .argument('[skills...]', t('cmd.group.create.arg.skills'))
      .option('--desc <description>', t('opt.desc'), '')
      .option('-w, --from-workspace', t('opt.fromWorkspace'), false)
      .action(async (name: string | undefined, skills: string[], opts: { desc: string; fromWorkspace: boolean }) => {
        if (!name || skills.length === 0) {
          await groupCreateTUI(opts.fromWorkspace);
        } else {
          try {
            createGroup(name, opts.desc, skills);
            success(t('group.created', { name, count: skills.length }));
            const pushResult = await pushToCloud('group create: @' + name);
            if (!pushResult.success) error(t('common.pushFailed', { error: pushResult.error ?? '' }));
          } catch (e) {
            error(String(e));
            process.exit(EXIT_CODES.ARG_ERROR);
          }
        }
      })
  )
  .addCommand(
    new Command('delete')
      .description(t('cmd.group.delete.description'))
      .argument('<name>', t('cmd.group.delete.arg.name'))
      .option('-y, --yes', t('opt.skipConfirm'), false)
      .action(async (name: string, opts: { yes: boolean }) => {
        if (!opts.yes && isTTY()) {
          const confirmed = await promptConfirm(t('group.deleteConfirm', { name }), false);
          if (!confirmed) {
            info(t('common.cancelled'));
            return;
          }
        }
        const deleted = deleteGroup(name);
        if (deleted) {
          success(t('group.deleted', { name }));
          const pushResult = await pushToCloud('group delete: @' + name);
          if (!pushResult.success) error(t('common.pushFailed', { error: pushResult.error ?? '' }));
        } else {
          error(t('group.notFound', { name }));
          process.exit(EXIT_CODES.GENERAL_ERROR);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description(t('cmd.group.list.description'))
      .action(() => {
        const groups = loadGroups();
        const entries = Object.entries(groups);
        if (entries.length === 0) {
          info(t('group.noGroups'));
          return;
        }
        for (const [name, def] of entries) {
          console.log(`  @${name.padEnd(20)} ${def.description}`);
          console.log(`    skills: ${def.skills.join(', ')}`);
        }
      })
  );

/** TUI 模式：交互式创建 group */
async function groupCreateTUI(fromWorkspace = false): Promise<void> {
  if (!isTTY()) {
    error(t('group.createRequiresArgs'));
    error(t('group.createUsage'));
    process.exit(EXIT_CODES.ARG_ERROR);
  }

  let rawSkillNames: string[];
  let skillsBaseDir: string;

  if (fromWorkspace) {
    const workspace = getWorkspaceInfo();
    const { join } = await import('node:path');
    const { existsSync } = await import('node:fs');
    const { createFsAdapter } = await import('./adapters/fs.js');
    const fs = createFsAdapter();
    const wsSkillsDir = join(workspace.path, workspace.skills_dir);
    rawSkillNames = existsSync(wsSkillsDir) ? fs.listDirs(wsSkillsDir) : [];
    skillsBaseDir = wsSkillsDir;
  } else {
    rawSkillNames = listAvailableSkills();
    skillsBaseDir = getSkillsDir();
  }

  const { valid: skillNames, invalid: invalidSkills } = partitionSkills(rawSkillNames, skillsBaseDir);
  if (invalidSkills.length > 0) printInvalidWarnings(invalidSkills);

  if (skillNames.length === 0) {
    error(fromWorkspace
      ? t('group.noWorkspaceSkills')
      : t('group.noSkillsAvailable'));
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }

  const choices = buildSkillChoices(skillNames, skillsBaseDir);

  const selectedSkills = await promptSearchCheckbox(
    t('group.searchPrompt'),
    choices,
  );

  if (selectedSkills.length === 0) {
    info(t('common.noSkillsSelected'));
    return;
  }

  const groupName = await promptInput(t('group.namePrompt'));
  if (!groupName.trim()) {
    error(t('group.nameRequired'));
    process.exit(EXIT_CODES.ARG_ERROR);
  }

  const description = await promptInput(t('group.descriptionPrompt'), '');

  try {
    createGroup(groupName.trim(), description, selectedSkills);
    success(t('group.created', { name: groupName.trim(), count: selectedSkills.length }));
    const pushResult = await pushToCloud('group create: @' + groupName.trim());
    if (!pushResult.success) error(t('common.pushFailed', { error: pushResult.error ?? '' }));
  } catch (e) {
    error(String(e));
    process.exit(EXIT_CODES.ARG_ERROR);
  }
}

// ── config ──
const configCmd = program
  .command('config')
  .description(t('cmd.config.description'));

configCmd
  .addCommand(
    new Command('get')
      .description(t('cmd.config.get.description'))
      .argument('[key]', t('cmd.config.get.arg.key'))
      .action(async (key: string | undefined) => {
        await cmdConfigGet(key);
      })
  )
  .addCommand(
    new Command('set')
      .description(t('cmd.config.set.description'))
      .argument('<key>', t('cmd.config.set.arg.key'))
      .argument('<value>', t('cmd.config.set.arg.value'))
      .action(async (key: string, value: string) => {
        await cmdConfigSet(key, value);
      })
  );

configCmd.action(async () => {
  await configTUI();
});

// ── publish ──
program
  .command('publish')
  .description(t('cmd.publish.description'))
  .argument('[skills...]', t('cmd.publish.arg.skills'))
  .option('-w, --workspace', t('opt.publishAll'), false)
  .option('-y, --yes', t('opt.skipConfirm'), false)
  .option('-m, --message <msg>', t('opt.commitMessage'))
  .option('-c, --cmd <command>', t('opt.customPush'))
  .option('-D, --delete', t('opt.deleteCloud'), false)
  .addHelpText('after', t('cmd.publish.helpText'))
  .action(async (skills: string[], opts: { workspace: boolean; yes: boolean; message?: string; cmd?: string; delete: boolean }) => {
    if (opts.delete) {
      if (skills.length === 0) {
        await publishTUI({ ...opts, delete: true });
      } else {
        await cmdPublishDelete(skills, opts);
      }
    } else if (skills.length === 0 && !opts.message && !opts.workspace) {
      await publishTUI(opts);
    } else {
      await cmdPublish(skills, opts);
    }
  });

// ── link ──
program
  .command('link')
  .description(t('cmd.link.description'))
  .argument('[agents...]', t('cmd.link.arg.agents'))
  .option('-D, --delete', t('opt.unlinkAgents'), false)
  .addHelpText('after', t('cmd.link.helpText'))
  .action(async (agents: string[], opts: { delete: boolean }) => {
    if (agents.length === 0) {
      await linkTUI({ unlink: opts.delete });
    } else if (opts.delete) {
      await cmdUnlink(agents);
    } else {
      await cmdLink(agents);
    }
  });

// ── collect ──
program
  .command('collect')
  .description(t('cmd.collect.description'))
  .option('-d, --dir <path>', t('opt.scanDir'))
  .option('--dry-run', t('opt.dryRun'), false)
  .option('-m, --message <msg>', t('opt.commitMessage'))
  .addHelpText('after', t('cmd.collect.helpText'))
  .action(async (opts: { dir?: string; dryRun: boolean; message?: string }) => {
    if (!opts.dryRun && !opts.message) {
      await collectTUI(opts);
    } else {
      await cmdCollect(opts);
    }
  });

// ── 默认行为：无子命令时进入 TUI 主菜单 ──
program.addHelpCommand(true);

program.action(async () => {
  if (isTTY()) {
    await mainTUI();
  } else {
    program.outputHelp();
  }
});

/** TUI 主菜单：无参数启动时的交互入口 */
async function mainTUI(): Promise<void> {
  const { isInitialized } = await import('./core/config-manager.js');
  const initialized = isInitialized();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const choices: Array<{ name: string; value: string; description?: string }> = [];

    if (!initialized) {
      choices.push({ name: t('main.initialize'), value: 'init', description: t('main.initializeDesc') });
    } else {
      choices.push(
        { name: t('main.installSkills'),   value: 'install',   description: t('main.installSkillsDesc') },
        { name: t('main.uninstallSkills'), value: 'uninstall', description: t('main.uninstallSkillsDesc') },
        { name: t('main.listInstalled'),   value: 'ls',        description: t('main.listInstalledDesc') },
        { name: t('main.publishChanges'),  value: 'publish',   description: t('main.publishChangesDesc') },
        { name: t('main.collectSkills'),   value: 'collect',   description: t('main.collectSkillsDesc') },
        { name: t('main.groups'),          value: 'group',     description: t('main.groupsDesc') },
        { name: t('main.link'),            value: 'link',      description: t('main.linkDesc') },
        { name: t('main.config'),          value: 'config',    description: t('main.configDesc') },
      );
    }

    choices.push({ name: t('main.exit'), value: 'exit' });

    const action = await promptSelect(t('main.prompt'), choices);

    if (action === null || action === 'exit') break;

    try {
      switch (action) {
        case 'init':
          await initTUI();
          break;
        case 'install':
          await installTUI({});
          break;
        case 'uninstall':
          await uninstallTUI({});
          break;
        case 'ls':
          await lsTUI();
          break;
        case 'publish': {
          const pubAction = await promptSelect(t('main.publishSubPrompt'), [
            { name: t('main.publishPushAction'),   value: 'push',   description: t('main.publishPushDesc') },
            { name: t('main.publishDeleteAction'), value: 'delete', description: t('main.publishDeleteDesc') },
          ]);
          if (pubAction === null) break;
          if (pubAction === 'push') await publishTUI({});
          else if (pubAction === 'delete') await publishTUI({ delete: true });
          break;
        }
        case 'collect':
          await collectTUI({});
          break;
        case 'group':
          await groupMenuTUI();
          break;
        case 'link':
          await linkTUI({});
          break;
        case 'config':
          await configTUI();
          break;
      }
    } catch (e) {
      error(String(e));
    }

    console.log();
  }
}

/** Group 子菜单 TUI */
async function groupMenuTUI(): Promise<void> {
  const action = await promptSelect(t('main.groupActions'), [
    { name: t('main.groupListAction'),   value: 'list' },
    { name: t('main.groupCreateAction'), value: 'create' },
    { name: t('main.groupDeleteAction'), value: 'delete' },
  ]);

  if (action === null) return;

  switch (action) {
    case 'list': {
      const groups = loadGroups();
      const entries = Object.entries(groups);
      if (entries.length === 0) {
        info(t('group.noGroups'));
        break;
      }
      const choices = entries.map(([name, def]) => ({
        name: `@${name}`,
        value: name,
        description: `${def.description || ''} (${def.skills.length} skills)`,
      }));
      const selected = await promptSelect(t('group.selectGroupToView'), choices);
      if (selected === null) break;
      const def = groups[selected];
      if (def) {
        info(`\n  @${selected}`);
        if (def.description) info(`  ${def.description}`);
        info(t('group.viewSkillsHeader', { count: def.skills.length }));
        for (const skill of def.skills) {
          console.log(`    - ${skill}`);
        }
        console.log();
      }
      break;
    }
    case 'create':
      await groupCreateTUI();
      break;
    case 'delete': {
      const groups = loadGroups();
      const entries = Object.entries(groups);
      if (entries.length === 0) {
        info(t('group.noGroupsToDelete'));
        break;
      }
      const choices = entries.map(([name, def]) => ({
        name: `@${name}`,
        value: name,
        description: def.description || `${def.skills.length} skills`,
      }));
      const groupName = await promptSelect(t('group.selectGroupToDelete'), choices);
      if (groupName === null) break;
      const confirmed = await promptConfirm(t('group.deleteConfirmShort', { name: groupName }), false);
      if (confirmed) {
        deleteGroup(groupName);
        success(t('group.deleted', { name: groupName }));
        const pushResult = await pushToCloud('group delete: @' + groupName);
        if (!pushResult.success) error(t('common.pushFailed', { error: pushResult.error ?? '' }));
      }
      break;
    }
  }
}

program.parseAsync(process.argv);
