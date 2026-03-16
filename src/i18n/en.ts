/**
 * i18n/en.ts — English translations
 * Key format: "module.key" (flat)
 * Must have identical key set as zh.ts
 */

export const en = {
  // ── program ──
  'program.description': 'Manage and sync AI Agent skills across devices and workspaces',
  'program.helpText': `
Command reference:
  init [repo]                  Initialize / clone remote repo to ~/.skills/
    -a, --agent <id>           Specify agent (default: claude-code)
    -d, --dir <path>           Specify skills install directory

  install [skills...]          Install skills (no args → TUI)
    --cloud                    Use cloud version on conflict
    --local                    Keep local version on conflict
    -a, --agent <id>           Specify target agent
    --group                    Select from group list
    Supports remote install (GitHub URL):
    Repo URL → TUI browse & install
    Specific skill URL → direct download & install

  ls                           List installed skills and sync status

  uninstall [skills...]        Uninstall skills (no args → TUI)
    --dry-run                  Preview without executing

  publish [skills...]          Publish local changes to cloud (no args → TUI)
    -w, --workspace            Publish all changes in current workspace
    -y, --yes                  Skip confirmation
    -m, --message <msg>        Commit message
    -D, --delete               Delete specified skill from cloud

  collect                      Scan directory, collect skills to cloud (no args → TUI)
    -d, --dir <path>           Specify scan directory
    --dry-run                  Preview without executing

  info <name>                  View skill details (@group to query group)

  group create [name] [skills...]   Create group
    --desc <desc>              Description
    -w, --from-workspace       Select from installed skills in current workspace
  group delete <name>          Delete group (-y to skip confirmation)
  group list                   List all groups

  config                       View / modify config (no args → TUI)
  config get [key]             Get config key (omit to show all)
  config set <key> <value>     Set config key

Examples:
  \$ skills-sync init Gary-Hobson/agents
  \$ skills-sync install tmux nuttx-debug
  \$ skills-sync publish --workspace -y -m "sync all"
  \$ skills-sync group create nuttx nuttx-commit nuttx-debug
  \$ skills-sync install --group`,

  // ── command descriptions ──
  'cmd.init.description': 'Initialize local mirror, clone remote repo to ~/.skills/',
  'cmd.init.arg.repo': 'Repository URL (user/repo, HTTPS URL, or SSH URL)',
  'cmd.init.helpText': `
Examples:
  \$ skills-sync init Gary-Hobson/skills
  \$ skills-sync init Gary-Hobson/skills --agent claude-code
  \$ skills-sync init https://github.com/user/skills --dir .claude/skills
  \$ skills-sync init                    # TUI guided mode`,
  'cmd.install.description': 'Install skills from cloud to workspace',
  'cmd.install.arg.skills': 'Skill names to install (omit to enter TUI)',
  'cmd.install.helpText': `
Examples:
  \$ skills-sync install                        # TUI search & install/uninstall
  \$ skills-sync install foo-skill bar-skill    # Install specified skills
  \$ skills-sync install foo --cloud            # Use cloud version on conflict
  \$ skills-sync install foo --local            # Keep local version on conflict
  \$ skills-sync install --group                # Select from group list
  \$ skills-sync install https://github.com/anthropics/skills           # Browse remote repo TUI
  \$ skills-sync install https://github.com/anthropics/skills/tree/main/skills/pdf  # Install specific skill`,
  'cmd.ls.description': 'List installed skills and sync status',
  'cmd.uninstall.description': 'Uninstall skills from workspace',
  'cmd.uninstall.arg.skills': 'Skill names to uninstall (omit to enter TUI)',
  'cmd.uninstall.helpText': `
Examples:
  \$ skills-sync uninstall foo-skill
  \$ skills-sync uninstall foo-skill bar-skill --dry-run
  \$ skills-sync uninstall                    # TUI selection mode`,
  'cmd.info.description': 'View skill or group details (@group syntax to query group)',
  'cmd.info.arg.name': 'Skill name or @group name',
  'cmd.group.description': 'Manage skill groups (subcommands: create / delete / list)',
  'cmd.group.create.description': 'Create new group',
  'cmd.group.create.arg.name': 'Group name',
  'cmd.group.create.arg.skills': 'Skill names to include',
  'cmd.group.delete.description': 'Delete group',
  'cmd.group.delete.arg.name': 'Group name',
  'cmd.group.list.description': 'List all groups',
  'cmd.config.description': 'View and modify global config (subcommands: get / set)',
  'cmd.config.get.description': 'Get config key',
  'cmd.config.get.arg.key': 'Config key name (omit to show all)',
  'cmd.config.set.description': 'Set config key',
  'cmd.config.set.arg.key': 'Config key name',
  'cmd.config.set.arg.value': 'Config value',
  'cmd.publish.description': 'Push workspace skill changes to cloud (--delete to remove from cloud)',
  'cmd.publish.arg.skills': 'Specific skills to publish (omit to enter TUI)',
  'cmd.publish.helpText': `
Examples:
  \$ skills-sync publish foo -y -m "update foo"
  \$ skills-sync publish --workspace -y -m "sync all"
  \$ skills-sync publish foo -y -m "fix" -c "git push origin HEAD:refs/for/dev"
  \$ skills-sync publish --delete
  \$ skills-sync publish --delete foo bar -y -m "remove deprecated"`,
  'cmd.collect.description': 'Scan directories, collect skills to cloud mirror',
  'cmd.collect.helpText': `
Examples:
  \$ skills-sync collect
  \$ skills-sync collect --dir .claude/skills
  \$ skills-sync collect --dry-run`,

  // ── common ──
  'common.notInitialized': 'Not initialized. Run `skills-sync init <repo>` first.',
  'common.pullLatest': 'Pulling latest from cloud...',
  'common.pullFailed': 'Pull failed: {error}. Proceeding with cached mirror.',
  'common.pushFailed': 'Push failed: {error}',
  'common.cancelled': 'Cancelled.',
  'common.noSkillsSelected': 'No skills selected.',
  'common.commitMessage': 'Commit message:',
  'common.notSet': '(not set)',
  'common.copiedToMirror': 'Copied {name} → mirror',

  // ── init ──
  'init.requiresArg': 'init requires a repository argument in non-interactive mode.',
  'init.usage': 'Usage: skills-sync init <repo> [--agent <id>]',
  'init.currentRepo': 'Current repository: {repo}',
  'init.currentAgent': 'Current agent: {agent}',
  'init.replaceRepo': 'Replace with a different repository?',
  'init.promptNewRepo': 'New Git repository URL (user/repo, HTTPS, or SSH):',
  'init.promptRepo': 'Git repository URL (user/repo, HTTPS, or SSH):',
  'init.repoRequired': 'Repository URL is required.',
  'init.noAgentsDetected': 'No installed agents detected.',
  'init.useAgentFlag': 'Use --agent <id> to specify an agent manually.',
  'init.noAgentsWithFlag': 'No installed agents detected. Use --agent <id> to specify one manually.',
  'init.selectAgent': 'Select agent type:',
  'init.agentSkillsDir': 'skills dir: {path}',
  'init.badUrl': 'Cannot parse repository URL: "{repo}"',
  'init.supportedFormats': 'Supported formats: user/repo, https://github.com/user/repo, git@github.com:user/repo.git',
  'init.mirrorExists': 'Local mirror already exists, pulling latest...',
  'init.pulled': 'Pulled latest from cloud (branch: {branch}).',
  'init.pullFailed': 'Pull failed: {error}',
  'init.cloning': 'Cloning {url} → {dir} ...',
  'init.cloneComplete': 'Clone complete.',
  'init.cloneFailed': 'Clone failed: {error}',
  'init.unknownAgent': 'Unknown agent: "{agent}". Available: {list}',
  'init.cannotResolveDir': 'Cannot resolve default skills directory for agent: "{agent}"',
  'init.configSaved': 'Config saved: agent={agent}, remote={remote}',
  'init.runInstall': '\nRun `skills-sync install` to install skills into your workspace.',
  'init.mirrorDirInfo': 'Mirror directory: {dir}',
  'init.scanWorkspaces': 'Scan all workspaces to collect existing skills?',
  'init.noGhCli': 'GitHub CLI (gh) not found or not logged in. Please provide a Git repository URL.',
  'init.ghNotLoggedIn': 'GitHub CLI (gh) is installed but not logged in. Run `gh auth login` first, or provide a Git repository URL.',
  'init.ghDetected': 'GitHub CLI detected (logged in as {user}).',
  'init.ghCreateRepo': 'No repository provided. Create a private GitHub repo "{repo}"?',
  'init.ghRepoCreated': 'Created private repository: {repo}',
  'init.ghRepoExists': 'Repository {repo} already exists, using it.',
  'init.ghCreateFailed': 'Failed to create repository: {error}',
  'init.selectLanguage': 'Select interface language / 选择界面语言:',
  'init.langEnglish': 'English',
  'init.langChinese': '中文 (Chinese)',

  // ── install ──
  'install.badUrl': 'Cannot parse GitHub URL: "{url}"',
  'install.supportedFormats': 'Supported formats:',
  'install.supportedFormat1': '  https://github.com/owner/repo',
  'install.supportedFormat2': '  https://github.com/owner/repo/tree/branch/skills/name',
  'install.requiresTTY': 'Remote repository browsing requires interactive mode (TTY).',
  'install.provideSpecificUrl': 'Provide a specific skill URL for non-interactive install.',
  'install.fetchingRemote': 'Fetching skills from {owner}/{repo} (branch: {branch})...',
  'install.noValidSkillsRemote': 'No valid skills found in https://github.com/{owner}/{repo}',
  'install.skillsMustHaveMd': 'Skills must contain a SKILL.md file.',
  'install.foundRemoteSkills': 'Found {count} skill(s) in remote repository.',
  'install.selectFromRemote': 'Select skills to install from {owner}/{repo}',
  'install.alreadyExists': '"{name}" already exists. What to do?',
  'install.alreadyExistsLocal': '"{name}" already exists locally. What to do?',
  'install.alreadyExistsCloud': '"{name}" exists, overwriting with remote version (--cloud).',
  'install.alreadyExistsKeepLocal': '"{name}" already exists, keeping local version (--local).',
  'install.alreadyExistsNonTty': '"{name}" already exists. Use --cloud to overwrite.',
  'install.updateOption': '[u] Update (overwrite with remote version)',
  'install.skipOption': '[s] Skip (keep local version)',
  'install.skipped': 'Skipped: {name}',
  'install.installing': 'Installing {name}...',
  'install.installed': 'Installed: {name}',
  'install.failed': 'Failed to install "{name}": {error}',
  'install.downloadFailed': 'Failed to download "{name}": {error}',
  'install.downloading': 'Downloading {name} from {owner}/{repo}...',
  'install.doneCount': '\nDone: {installed} installed, {skipped} skipped.',
  'install.noSkillsAvailable': 'No skills available in cloud mirror.',
  'install.noChanges': 'No changes.',
  'install.differsFromCloud': '\n{count} skill(s) differ from cloud:',
  'install.keepOrCloud': '{name}: keep local or use cloud version?',
  'install.keepLocalOption': '[l] Keep local version',
  'install.useCloudOption': '[c] Use cloud version',
  'install.updatedToCloud': '{name}: updated to cloud version',
  'install.keptLocal': '{name}: kept local version',
  'install.unknownAgent': 'Unknown agent: "{agent}". Use --dir to specify an explicit path.',
  'install.noNamesSpecified': 'No skill names specified. Use `skills-sync install <skill...>` or `skills-sync install` for TUI.',
  'install.installedList': 'Installed: {list}',
  'install.skippedList': 'Skipped (local version kept): {list}',
  'install.failedSkill': 'Failed to install "{name}": {reason}',
  'install.nothingToInstall': 'Nothing to install.',
  'install.searchPrompt': 'Search skills to install',
  'install.groupRequiresTTY': 'Group selection requires interactive mode.',
  'install.noGroups': 'No groups defined. Create one with: skills-sync group create',
  'install.selectGroups': 'Select groups to install',
  'install.noGroupsSelected': 'No groups selected.',
  'install.installingFromGroups': 'Installing {count} skill(s) from {groups} group(s)...',

  // ── ls ──
  'ls.checkingCloud': 'Checking cloud status...',
  'ls.noSkillsInstalled': 'No skills installed.',
  'ls.noSkillsInstalledAvailable': 'No skills installed. Available in cloud mirror:',
  'ls.none': '  (none)',
  'ls.workspacePath': 'Workspace: {path}',
  'ls.skillsDir': 'Skills dir: {path}',
  'ls.agent': 'Agent: {agent}',
  'ls.statusSynced': '✓ synced',
  'ls.statusModified': '~ modified',
  'ls.summaryInstalled': '{count} installed',
  'ls.summaryModified': '~ {count} modified',
  'ls.summarySynced': '✓ {count} synced',
  'ls.selectPrompt': 'Installed skills (select to manage)',
  'ls.actionPrompt': 'Action for {count} skill(s)',
  'ls.publishAction': '↑ Publish to cloud',
  'ls.publishDesc': 'Push local changes to cloud ({count} skill(s))',
  'ls.forceSyncAction': '⟳ Force sync (cloud → local)',
  'ls.forceSyncDesc': 'Reset selected to cloud version',
  'ls.cancelAction': '↩️ Cancel',
  'ls.noModified': 'No modified skills in selection.',
  'ls.published': 'Published: {list}',
  'ls.resetConfirm': 'Reset {count} skill(s) to cloud version? Local changes will be lost.',
  'ls.resetDone': 'Reset to cloud: {list}',

  // ── uninstall ──
  'uninstall.requiresArgs': 'uninstall requires skill names in non-interactive mode.',
  'uninstall.usage': 'Usage: skills-sync uninstall <skill> [skill2 ...]',
  'uninstall.noSkillsInstalled': 'No skills installed in this workspace.',
  'uninstall.noValidSkills': 'No valid skills to uninstall.',
  'uninstall.searchPrompt': 'Search skills to uninstall',
  'uninstall.confirmPrompt': 'About to uninstall {count} skill(s): {list}. Confirm?',
  'uninstall.requiresAtLeastOne': 'Please specify at least one skill to uninstall.',
  'uninstall.dryRunWouldRemove': '[dry-run] Would remove:',
  'uninstall.removed': 'Removed: {list}',
  'uninstall.notFound': 'Not found (skipped): {list}',

  // ── publish ──
  'publish.requiresArgs': 'publish requires arguments or -m in non-interactive mode.',
  'publish.nothingToPublish': 'Nothing to publish. All skills are up-to-date.',
  'publish.nothingToPublishAll': 'Nothing to publish. All skills are up-to-date or have no local changes.',
  'publish.searchPrompt': 'Search skills to publish',
  'publish.willPublish': 'Will publish:',
  'publish.requiresConfirm': 'Publish requires confirmation. Use -y to skip.',
  'publish.confirmPrompt': 'Publish {count} skill(s)?',
  'publish.published': 'Published {count} skill(s): {list}',
  'publish.deleteSearchPrompt': 'Search skills to delete from cloud',
  'publish.deleteWarning': '⚠️  This will permanently delete {count} skill(s) from the cloud:',
  'publish.deleteConfirm': 'Are you sure? This cannot be undone.',
  'publish.requiresAtLeastOne': 'Please specify at least one skill to delete.',
  'publish.deleteUsage': 'Usage: skills-sync publish --delete <skill> [skill2 ...]',
  'publish.notFoundInCloud': 'Not found in cloud: {list}',
  'publish.nothingToDelete': 'Nothing to delete.',
  'publish.deleteRequiresConfirm': 'Delete requires confirmation. Use -y to skip.',
  'publish.deleteConfirmPrompt': 'Permanently delete {count} skill(s) from cloud: {list}?',
  'publish.deletedFromMirror': 'Deleted {name} from mirror',
  'publish.deletedFromCloud': 'Deleted {count} skill(s) from cloud: {list}',

  // ── collect ──
  'collect.scanning': 'Scanning all agent skill directories...',
  'collect.scannedLocations': '  Scanned {count} location(s):',
  'collect.scannedLocationsShort': '  Scanned {count} location(s)',
  'collect.noValidSkills': 'No valid skills found across any agent directory.',
  'collect.foundSkills': 'Found {count} valid skill(s): +{added} new, ~{modified} modified, {unchanged} unchanged',
  'collect.unchangedList': '  Unchanged: {list}',
  'collect.allUpToDate': 'All skills are up to date. Nothing to collect.',
  'collect.allUpToDateCount': 'All {count} skills are up to date. Nothing to collect.',
  'collect.selectPrompt': 'Select skills to collect ({added} new, {modified} modified)',
  'collect.nothingSelected': 'Nothing selected.',
  'collect.dryRunWouldCollect': '[dry-run] Would collect:',
  'collect.dryRunItem': '  - {name} ← {path}',
  'collect.collected': '  Collected: {name} ← {source}',
  'collect.publishedCount': 'Collected and published {count} skill(s): {list}',
  'collect.new': '  New ({count}): {list}',
  'collect.modified': '  Modified ({count}): {list}',
  'collect.unchangedCount': '  Unchanged ({count}): {list}',
  'collect.skip': 'Skip "{name}" ({path}): {errors}',
  'collect.skipping': 'Skipping "{name}" ({path}): {errors}',

  // ── config ──
  'config.requiresSubcmd': 'config requires subcommand (get/set) in non-interactive mode.',
  'config.noConfig': 'No config found. Run `skills-sync init <repo>` first.',
  'config.currentConfig': 'Current configuration:',
  'config.actionPrompt': 'Action:',
  'config.editAction': 'Edit a config key',
  'config.exitAction': 'Exit',
  'config.selectKey': 'Select config key to edit:',
  'config.newValue': 'New value for "{key}":',
  'config.unknownKey': 'Unknown config key: "{key}". Valid keys: {keys}',
  'config.setDone': 'Set {key} = {value}',
  'config.selectAgent': 'Select agent:',
  'config.languageDescription': 'Display language (en / zh)',

  // ── group ──
  'group.created': 'Created group "@{name}" with {count} skill(s).',
  'group.deleted': 'Deleted group "@{name}".',
  'group.notFound': 'Group "@{name}" not found.',
  'group.deleteConfirm': 'About to delete group @{name}. Confirm?',
  'group.deleteConfirmShort': 'Delete group @{name}?',
  'group.noGroups': 'No groups defined.',
  'group.noGroupsToDelete': 'No groups to delete.',
  'group.createRequiresArgs': 'group create requires arguments in non-interactive mode.',
  'group.createUsage': 'Usage: skills-sync group create <name> <skills...>',
  'group.noWorkspaceSkills': 'No skills installed in current workspace.',
  'group.noSkillsAvailable': 'No skills available. Initialize and collect skills first.',
  'group.searchPrompt': 'Search skills for the group',
  'group.namePrompt': 'Group name:',
  'group.nameRequired': 'Group name is required.',
  'group.descriptionPrompt': 'Description:',
  'group.selectGroupToView': 'Select group to view',
  'group.selectGroupToDelete': 'Select group to delete',
  'group.viewSkillsHeader': '  {count} skills:',

  // ── info ──
  'info.groupNotFound': 'Group "@{name}" not found.',
  'info.groupHeader': 'Group: @{name}',
  'info.groupDescription': '  Description: {desc}',
  'info.groupSkills': '  Skills ({count}): {list}',
  'info.groupCreated': '  Created: {date}',
  'info.skillNotFound': 'Skill "{name}" not found in cloud mirror.',
  'info.skillHeader': 'Skill: {name}',
  'info.skillHash': '  Hash:  {hash}',
  'info.skillFiles': '  Files: {list}',
  'info.skillMdHeader': '\n--- SKILL.md ---',
  'info.noSkillMd': '  (no SKILL.md)',

  // ── skill-display ──
  'skillDisplay.skipped': '  ⚠ skipped "{name}": {reasons}',

  // ── main TUI ──
  'main.prompt': 'skills-sync — What do you want to do?',
  'main.initialize': '🚀 Initialize',
  'main.initializeDesc': 'Clone remote repo to ~/.skills/',
  'main.installSkills': '📦 Install skills',
  'main.installSkillsDesc': 'Install from cloud or remote URL',
  'main.uninstallSkills': '🗑️  Uninstall skills',
  'main.uninstallSkillsDesc': 'Remove skills from workspace',
  'main.listInstalled': '📋 List installed',
  'main.listInstalledDesc': 'Show installed skills & sync status',
  'main.publishChanges': '📤 Publish changes',
  'main.publishChangesDesc': 'Push local modifications to cloud',
  'main.collectSkills': '🔍 Collect skills',
  'main.collectSkillsDesc': 'Scan & collect skills into cloud mirror',
  'main.groups': '📁 Groups',
  'main.groupsDesc': 'Manage skill groups',
  'main.link': '🔗 Link agents',
  'main.linkDesc': 'Link other agents to share skills directory',
  'main.config': '⚙️  Config',
  'main.configDesc': 'View / edit global config',
  'main.exit': '👋 Exit',
  'main.publishSubPrompt': 'Publish actions',
  'main.publishPushAction': '📤 Publish changes',
  'main.publishPushDesc': 'Push local modifications to cloud',
  'main.publishDeleteAction': '🗑️  Delete from cloud',
  'main.publishDeleteDesc': 'Remove skills from cloud mirror',
  'main.groupActions': 'Group actions',
  'main.groupListAction': '📋 List groups',
  'main.groupCreateAction': '➕ Create group',
  'main.groupDeleteAction': '🗑️  Delete group',

  // ── option descriptions (index.ts) ──
  'opt.agentDefault': 'Specify agent (default: claude-code)',
  'opt.skillsInstallDir': 'Specify skills install directory',
  'opt.targetAgent': 'Specify target agent',
  'opt.installDir': 'Specify install directory (absolute path)',
  'opt.groupSelect': 'Select from group list',
  'opt.cloudConflict': 'Use cloud version on conflict',
  'opt.localConflict': 'Keep local version on conflict',
  'opt.skillsDir': 'Specify skills directory',
  'opt.dryRun': 'Preview without executing',
  'opt.json': 'Output as JSON',
  'opt.desc': 'Description',
  'opt.fromWorkspace': 'Select from installed skills in current workspace',
  'opt.skipConfirm': 'Skip confirmation',
  'opt.publishAll': 'Publish all workspace changes',
  'opt.commitMessage': 'Commit message',
  'opt.customPush': 'Custom push command',
  'opt.deleteCloud': 'Delete specified skill from cloud',
  'opt.scanDir': 'Specify scan directory',
  'opt.unlinkAgents': 'Remove symlinks for specified agents',

  // ── link ──
  'cmd.link.description': 'Link other agents to primary agent skills directory',
  'cmd.link.arg.agents': 'Agent IDs to link (omit for TUI)',
  'cmd.link.helpText': `
Examples:
  \$ skills-sync link                    # TUI: select agents to link
  \$ skills-sync link openclaw cursor    # CLI: link specific agents
  \$ skills-sync link -D                 # TUI: select agents to unlink
  \$ skills-sync link -D openclaw        # CLI: unlink specific agent`,
  'link.requiresTTY': 'link requires interactive mode (TTY) without arguments.',
  'link.primaryAgent': 'Primary agent: {agent} ({dir})',
  'link.selectAgents': 'Select agents to link to primary skills directory:',
  'link.selectUnlink': 'Select agents to unlink:',
  'link.alreadyLinked': '→ linked to {target}',
  'link.existsNotLink': '⚠ directory exists: {path}',
  'link.alreadyCorrect': '{agent}: already linked correctly.',
  'link.replaceDir': '{agent}: {path} is a real directory. Replace with symlink? (original backed up)',
  'link.skipped': '{agent}: skipped.',
  'link.skipExistingDir': '{agent}: {path} is a real directory, skipping (use TUI to replace).',
  'link.skipPrimary': '{agent}: is the primary agent, skipping.',
  'link.backedUp': 'Backed up: {from} → {to}',
  'link.created': '{agent}: linked {link} → {target}',
  'link.unknownAgent': 'Unknown agent: {agent}',
  'link.primaryNotExists': 'Primary skills directory does not exist yet: {dir}',
  'link.runInstallFirst': 'Run `skills-sync install` first to create it, or the link will be created pointing to a non-existent directory.',
  'link.notLinked': '{agent}: not linked.',
  'link.notSymlink': '{agent}: {path} is not a symlink, cannot unlink.',
  'link.removed': '{agent}: unlinked {path}',
  'link.noLinksFound': 'No linked agents found in current workspace.',
  'link.noOtherAgents': 'No other installed agents detected on this system.',
} as const;

export type TranslationKey = keyof typeof en;
