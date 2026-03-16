/**
 * i18n/zh.ts — 中文翻译
 * Key 集合必须与 en.ts 完全一致
 */

import type { TranslationKey } from './en.js';

export const zh: Record<TranslationKey, string> = {
  // ── program ──
  'program.description': '跨设备、跨工作区统一管理和同步 AI Agent skills',
  'program.helpText': `
命令参考:
  init [repo]                  初始化 / 克隆远端仓库到 ~/.skills/
    -a, --agent <id>           指定 agent（默认: claude-code）
    -d, --dir <path>           指定 skills 安装目录

  install [skills...]          安装 skill（无参数进入 TUI）
    --cloud                    冲突时使用云端版本
    --local                    冲突时保留本地版本
    -a, --agent <id>           指定目标 agent
    --group                    从 group 列表选择安装
    支持远程安装（GitHub URL）：
    仓库级 URL → TUI 选择安装
    具体 skill URL → 直接下载安装

  ls                           列出已安装 skill 及同步状态

  uninstall [skills...]        卸载 skill（无参数进入 TUI）
    --dry-run                  预览，不实际操作

  publish [skills...]          发布本地修改到云端（无参数进入 TUI）
    -w, --workspace            发布当前 workspace 所有变更
    -y, --yes                  跳过确认
    -m, --message <msg>        提交消息
    -D, --delete               从云端删除指定 skill

  collect                      扫描目录，收集 skill 到云端（无参数进入 TUI）
    -d, --dir <path>           指定扫描目录
    --dry-run                  预览，不实际操作

  info <name>                  查看 skill 详情（@group 查询 group）

  group create [name] [skills...]   创建 group
    --desc <desc>              描述
    -w, --from-workspace       从当前 workspace 已安装的 skills 中选择
  group delete <name>          删除 group（-y 跳过确认）
  group list                   列出所有 group

  config                       查看 / 修改配置（无参数进入 TUI）
  config get [key]             获取配置项（不填则显示全部）
  config set <key> <value>     设置配置项

示例:
  \$ skills-sync init Gary-Hobson/agents
  \$ skills-sync install tmux nuttx-debug
  \$ skills-sync publish --workspace -y -m "sync all"
  \$ skills-sync group create nuttx nuttx-commit nuttx-debug
  \$ skills-sync install --group`,

  // ── command descriptions ──
  'cmd.init.description': '初始化本地镜像，克隆远端仓库到 ~/.skills/',
  'cmd.init.arg.repo': '仓库地址（user/repo、HTTPS URL 或 SSH URL）',
  'cmd.init.helpText': `
示例:
  \$ skills-sync init Gary-Hobson/skills
  \$ skills-sync init Gary-Hobson/skills --agent claude-code
  \$ skills-sync init https://github.com/user/skills --dir .claude/skills
  \$ skills-sync init                    # TUI 引导模式`,
  'cmd.install.description': '从云端安装 skill 到 workspace',
  'cmd.install.arg.skills': '要安装的 skill 名称（不指定则进入 TUI 选择）',
  'cmd.install.helpText': `
示例:
  \$ skills-sync install                        # TUI 搜索选择安装/卸载
  \$ skills-sync install foo-skill bar-skill    # 安装指定 skill
  \$ skills-sync install foo --cloud            # 冲突时使用云端版本
  \$ skills-sync install foo --local            # 冲突时保留本地版本
  \$ skills-sync install --group                # 从 group 列表选择安装
  \$ skills-sync install https://github.com/anthropics/skills           # 浏览远程仓库 TUI 选择
  \$ skills-sync install https://github.com/anthropics/skills/tree/main/skills/pdf  # 安装远程指定 skill`,
  'cmd.ls.description': '列出已安装 skill 及同步状态',
  'cmd.uninstall.description': '从 workspace 卸载 skill',
  'cmd.uninstall.arg.skills': '要卸载的 skill 名称（不指定则进入 TUI 选择）',
  'cmd.uninstall.helpText': `
示例:
  \$ skills-sync uninstall foo-skill
  \$ skills-sync uninstall foo-skill bar-skill --dry-run
  \$ skills-sync uninstall                    # TUI 选择模式`,
  'cmd.info.description': '查看 skill 或 group 详情（@group 语法查询 group）',
  'cmd.info.arg.name': 'skill 名称或 @group 名称',
  'cmd.group.description': '管理 skill groups（子命令: create / delete / list）',
  'cmd.group.create.description': '创建新 group',
  'cmd.group.create.arg.name': 'group 名称',
  'cmd.group.create.arg.skills': '包含的 skill 名称列表',
  'cmd.group.delete.description': '删除 group',
  'cmd.group.delete.arg.name': 'group 名称',
  'cmd.group.list.description': '列出所有 group',
  'cmd.config.description': '查看和修改全局配置（子命令: get / set）',
  'cmd.config.get.description': '获取配置项',
  'cmd.config.get.arg.key': '配置键名（不填则显示全部）',
  'cmd.config.set.description': '设置配置项',
  'cmd.config.set.arg.key': '配置键名',
  'cmd.config.set.arg.value': '配置值',
  'cmd.publish.description': '将 workspace 中的 skill 修改推送到云端（--delete 从云端删除）',
  'cmd.publish.arg.skills': '指定要发布的 skill（不填则进入 TUI 选择）',
  'cmd.publish.helpText': `
示例:
  \$ skills-sync publish foo -y -m "update foo"
  \$ skills-sync publish --workspace -y -m "sync all"
  \$ skills-sync publish foo -y -m "fix" -c "git push origin HEAD:refs/for/dev"
  \$ skills-sync publish --delete
  \$ skills-sync publish --delete foo bar -y -m "remove deprecated"`,
  'cmd.collect.description': '扫描目录，将 skill 收集到云端镜像',
  'cmd.collect.helpText': `
示例:
  \$ skills-sync collect
  \$ skills-sync collect --dir .claude/skills
  \$ skills-sync collect --dry-run`,

  // ── common ──
  'common.notInitialized': '尚未初始化，请先运行 `skills-sync init <repo>`。',
  'common.pullLatest': '正在拉取云端最新内容...',
  'common.pullFailed': '拉取失败：{error}，将使用本地缓存继续。',
  'common.pushFailed': '推送失败：{error}',
  'common.cancelled': '已取消。',
  'common.noSkillsSelected': '未选择任何 skill。',
  'common.commitMessage': '提交消息：',
  'common.notSet': '（未设置）',
  'common.copiedToMirror': '已复制 {name} → 镜像',

  // ── init ──
  'init.requiresArg': '非交互模式下 init 需要提供仓库地址参数。',
  'init.usage': '用法：skills-sync init <repo> [--agent <id>]',
  'init.currentRepo': '当前仓库：{repo}',
  'init.currentAgent': '当前 agent：{agent}',
  'init.replaceRepo': '是否替换为其他仓库？',
  'init.promptNewRepo': '新 Git 仓库地址（user/repo、HTTPS 或 SSH）：',
  'init.promptRepo': 'Git 仓库地址（user/repo、HTTPS 或 SSH）：',
  'init.repoRequired': '仓库地址不能为空。',
  'init.noAgentsDetected': '未检测到已安装的 agent。',
  'init.useAgentFlag': '请使用 --agent <id> 手动指定 agent。',
  'init.noAgentsWithFlag': '未检测到已安装的 agent，请使用 --agent <id> 手动指定。',
  'init.selectAgent': '选择 agent 类型：',
  'init.agentSkillsDir': 'skills 目录：{path}',
  'init.badUrl': '无法解析仓库地址："{repo}"',
  'init.supportedFormats': '支持的格式：user/repo, https://github.com/user/repo, git@github.com:user/repo.git',
  'init.mirrorExists': '本地镜像已存在，正在拉取最新内容...',
  'init.pulled': '已拉取云端最新内容（分支：{branch}）。',
  'init.pullFailed': '拉取失败：{error}',
  'init.cloning': '正在克隆 {url} → {dir} ...',
  'init.cloneComplete': '克隆完成。',
  'init.cloneFailed': '克隆失败：{error}',
  'init.unknownAgent': '未知 agent："{agent}"，可用：{list}',
  'init.cannotResolveDir': '无法解析 agent "{agent}" 的默认 skills 目录',
  'init.configSaved': '配置已保存：agent={agent}, remote={remote}',
  'init.runInstall': '\n运行 `skills-sync install` 将 skill 安装到当前 workspace。',
  'init.mirrorDirInfo': '镜像目录：{dir}',
  'init.scanWorkspaces': '是否扫描所有 workspace 收集已有 skill？',
  'init.noGhCli': '未检测到 GitHub CLI (gh) 或未登录。请提供一个 Git 仓库地址。',
  'init.ghNotLoggedIn': '已安装 GitHub CLI (gh) 但未登录。请先运行 `gh auth login`，或直接提供 Git 仓库地址。',
  'init.ghDetected': '检测到 GitHub CLI（已登录为 {user}）。',
  'init.ghCreateRepo': '未提供仓库地址。是否创建私有 GitHub 仓库 "{repo}"？',
  'init.ghRepoCreated': '已创建私有仓库：{repo}',
  'init.ghRepoExists': '仓库 {repo} 已存在，直接使用。',
  'init.ghCreateFailed': '创建仓库失败：{error}',
  'init.selectLanguage': 'Select interface language / 选择界面语言:',
  'init.langEnglish': 'English',
  'init.langChinese': '中文 (Chinese)',

  // ── install ──
  'install.badUrl': '无法解析 GitHub URL："{url}"',
  'install.supportedFormats': '支持的格式：',
  'install.supportedFormat1': '  https://github.com/owner/repo',
  'install.supportedFormat2': '  https://github.com/owner/repo/tree/branch/skills/name',
  'install.requiresTTY': '浏览远程仓库需要交互模式（TTY）。',
  'install.provideSpecificUrl': '非交互模式请提供具体的 skill URL 进行安装。',
  'install.fetchingRemote': '正在从 {owner}/{repo} 获取 skill 列表（分支：{branch}）...',
  'install.noValidSkillsRemote': '在 https://github.com/{owner}/{repo} 中未找到有效 skill',
  'install.skillsMustHaveMd': 'Skill 必须包含 SKILL.md 文件。',
  'install.foundRemoteSkills': '在远程仓库中找到 {count} 个 skill。',
  'install.selectFromRemote': '从 {owner}/{repo} 选择要安装的 skill',
  'install.alreadyExists': '"{name}" 已存在，请选择操作：',
  'install.alreadyExistsLocal': '"{name}" 本地已存在，请选择操作：',
  'install.alreadyExistsCloud': '"{name}" 已存在，将使用远程版本覆盖（--cloud）。',
  'install.alreadyExistsKeepLocal': '"{name}" 已存在，保留本地版本（--local）。',
  'install.alreadyExistsNonTty': '"{name}" 已存在，使用 --cloud 可强制覆盖。',
  'install.updateOption': '[u] 更新（覆盖为远程版本）',
  'install.skipOption': '[s] 跳过（保留本地版本）',
  'install.skipped': '已跳过：{name}',
  'install.installing': '正在安装 {name}...',
  'install.installed': '已安装：{name}',
  'install.failed': '安装 "{name}" 失败：{error}',
  'install.downloadFailed': '下载 "{name}" 失败：{error}',
  'install.downloading': '正在从 {owner}/{repo} 下载 {name}...',
  'install.doneCount': '\n完成：已安装 {installed} 个，已跳过 {skipped} 个。',
  'install.noSkillsAvailable': '云端镜像中没有可用的 skill。',
  'install.noChanges': '无变更。',
  'install.differsFromCloud': '\n{count} 个 skill 与云端存在差异：',
  'install.keepOrCloud': '{name}：保留本地版本还是使用云端版本？',
  'install.keepLocalOption': '[l] 保留本地版本',
  'install.useCloudOption': '[c] 使用云端版本',
  'install.updatedToCloud': '{name}：已更新为云端版本',
  'install.keptLocal': '{name}：已保留本地版本',
  'install.unknownAgent': '未知 agent："{agent}"，请使用 --dir 指定路径。',
  'install.noNamesSpecified': '未指定 skill 名称，请使用 `skills-sync install <skill...>` 或不带参数进入 TUI。',
  'install.installedList': '已安装：{list}',
  'install.skippedList': '已跳过（保留本地版本）：{list}',
  'install.failedSkill': '安装 "{name}" 失败：{reason}',
  'install.nothingToInstall': '没有需要安装的内容。',
  'install.searchPrompt': '搜索要安装的 skill',
  'install.groupRequiresTTY': 'Group 选择需要交互模式。',
  'install.noGroups': '没有可用的 group，请先创建：skills-sync group create',
  'install.selectGroups': '选择要安装的 group',
  'install.noGroupsSelected': '未选择任何 group。',
  'install.installingFromGroups': '正在从 {groups} 个 group 安装 {count} 个 skill...',

  // ── ls ──
  'ls.checkingCloud': '正在检查云端状态...',
  'ls.noSkillsInstalled': '没有已安装的 skill。',
  'ls.noSkillsInstalledAvailable': '没有已安装的 skill，云端镜像中可用的：',
  'ls.none': '  （无）',
  'ls.workspacePath': 'Workspace：{path}',
  'ls.skillsDir': 'Skills 目录：{path}',
  'ls.agent': 'Agent：{agent}',
  'ls.statusSynced': '✓ 已同步',
  'ls.statusModified': '~ 已修改',
  'ls.summaryInstalled': '{count} 个已安装',
  'ls.summaryModified': '~ {count} 个已修改',
  'ls.summarySynced': '✓ {count} 个已同步',
  'ls.selectPrompt': '已安装的 skill（选择以管理）',
  'ls.actionPrompt': '对 {count} 个 skill 执行操作',
  'ls.publishAction': '↑ 发布到云端',
  'ls.publishDesc': '推送本地修改到云端（{count} 个 skill）',
  'ls.forceSyncAction': '⟳ 强制同步（云端 → 本地）',
  'ls.forceSyncDesc': '将选中内容重置为云端版本',
  'ls.cancelAction': '↩️ 取消',
  'ls.noModified': '选中内容中没有已修改的 skill。',
  'ls.published': '已发布：{list}',
  'ls.resetConfirm': '将 {count} 个 skill 重置为云端版本？本地修改将会丢失。',
  'ls.resetDone': '已重置为云端版本：{list}',

  // ── uninstall ──
  'uninstall.requiresArgs': '非交互模式下 uninstall 需要提供 skill 名称。',
  'uninstall.usage': '用法：skills-sync uninstall <skill> [skill2 ...]',
  'uninstall.noSkillsInstalled': '当前 workspace 没有已安装的 skill。',
  'uninstall.noValidSkills': '没有可卸载的有效 skill。',
  'uninstall.searchPrompt': '搜索要卸载的 skill',
  'uninstall.confirmPrompt': '即将卸载 {count} 个 skill：{list}，确认吗？',
  'uninstall.requiresAtLeastOne': '请至少指定一个要卸载的 skill。',
  'uninstall.dryRunWouldRemove': '[dry-run] 将删除：',
  'uninstall.removed': '已删除：{list}',
  'uninstall.notFound': '未找到（已跳过）：{list}',

  // ── publish ──
  'publish.requiresArgs': '非交互模式下 publish 需要提供参数或 -m 选项。',
  'publish.nothingToPublish': '没有需要发布的内容，所有 skill 均已是最新。',
  'publish.nothingToPublishAll': '没有需要发布的内容，所有 skill 均已是最新或没有本地修改。',
  'publish.searchPrompt': '搜索要发布的 skill',
  'publish.willPublish': '将发布：',
  'publish.requiresConfirm': '发布操作需要确认，使用 -y 可跳过。',
  'publish.confirmPrompt': '发布 {count} 个 skill？',
  'publish.published': '已发布 {count} 个 skill：{list}',
  'publish.deleteSearchPrompt': '搜索要从云端删除的 skill',
  'publish.deleteWarning': '⚠️  以下 {count} 个 skill 将从云端永久删除：',
  'publish.deleteConfirm': '确定吗？此操作不可撤销。',
  'publish.requiresAtLeastOne': '请至少指定一个要删除的 skill。',
  'publish.deleteUsage': '用法：skills-sync publish --delete <skill> [skill2 ...]',
  'publish.notFoundInCloud': '云端未找到：{list}',
  'publish.nothingToDelete': '没有需要删除的内容。',
  'publish.deleteRequiresConfirm': '删除操作需要确认，使用 -y 可跳过。',
  'publish.deleteConfirmPrompt': '永久删除云端的 {count} 个 skill：{list}？',
  'publish.deletedFromMirror': '已从镜像删除 {name}',
  'publish.deletedFromCloud': '已从云端删除 {count} 个 skill：{list}',

  // ── collect ──
  'collect.scanning': '正在扫描所有 agent 的 skill 目录...',
  'collect.scannedLocations': '  已扫描 {count} 个位置：',
  'collect.scannedLocationsShort': '  已扫描 {count} 个位置',
  'collect.noValidSkills': '在所有 agent 目录中未找到有效 skill。',
  'collect.foundSkills': '找到 {count} 个有效 skill：+{added} 新增，~{modified} 已修改，{unchanged} 无变更',
  'collect.unchangedList': '  无变更：{list}',
  'collect.allUpToDate': '所有 skill 均为最新，无需收集。',
  'collect.allUpToDateCount': '所有 {count} 个 skill 均为最新，无需收集。',
  'collect.selectPrompt': '选择要收集的 skill（{added} 个新增，{modified} 个已修改）',
  'collect.nothingSelected': '未选择任何内容。',
  'collect.dryRunWouldCollect': '[dry-run] 将收集：',
  'collect.dryRunItem': '  - {name} ← {path}',
  'collect.collected': '  已收集：{name} ← {source}',
  'collect.publishedCount': '已收集并发布 {count} 个 skill：{list}',
  'collect.new': '  新增 ({count})：{list}',
  'collect.modified': '  已修改 ({count})：{list}',
  'collect.unchangedCount': '  无变更 ({count})：{list}',
  'collect.skip': '跳过 "{name}"（{path}）：{errors}',
  'collect.skipping': '跳过 "{name}"（{path}）：{errors}',

  // ── config ──
  'config.requiresSubcmd': '非交互模式下 config 需要子命令（get/set）。',
  'config.noConfig': '未找到配置，请先运行 `skills-sync init <repo>`。',
  'config.currentConfig': '当前配置：',
  'config.actionPrompt': '操作：',
  'config.editAction': '编辑配置项',
  'config.exitAction': '退出',
  'config.selectKey': '选择要编辑的配置项：',
  'config.newValue': '"{key}" 的新值：',
  'config.unknownKey': '未知配置项："{key}"，有效键：{keys}',
  'config.setDone': '已设置 {key} = {value}',
  'config.selectAgent': '选择 agent：',
  'config.languageDescription': '显示语言（en / zh）',

  // ── group ──
  'group.created': '已创建 group "@{name}"，包含 {count} 个 skill。',
  'group.deleted': '已删除 group "@{name}"。',
  'group.notFound': 'Group "@{name}" 不存在。',
  'group.deleteConfirm': '即将删除 group @{name}，确认吗？',
  'group.deleteConfirmShort': '删除 group @{name}？',
  'group.noGroups': '没有定义任何 group。',
  'group.noGroupsToDelete': '没有可删除的 group。',
  'group.createRequiresArgs': '非交互模式下 group create 需要提供参数。',
  'group.createUsage': '用法：skills-sync group create <name> <skills...>',
  'group.noWorkspaceSkills': '当前 workspace 没有已安装的 skill。',
  'group.noSkillsAvailable': '没有可用的 skill，请先初始化并收集。',
  'group.searchPrompt': '搜索要加入 group 的 skill',
  'group.namePrompt': 'Group 名称：',
  'group.nameRequired': 'Group 名称不能为空。',
  'group.descriptionPrompt': '描述：',
  'group.selectGroupToView': '选择要查看的 group',
  'group.selectGroupToDelete': '选择要删除的 group',
  'group.viewSkillsHeader': '  包含 {count} 个 skill：',

  // ── info ──
  'info.groupNotFound': 'Group "@{name}" 不存在。',
  'info.groupHeader': 'Group：@{name}',
  'info.groupDescription': '  描述：{desc}',
  'info.groupSkills': '  Skills ({count})：{list}',
  'info.groupCreated': '  创建时间：{date}',
  'info.skillNotFound': '云端镜像中找不到 skill "{name}"。',
  'info.skillHeader': 'Skill：{name}',
  'info.skillHash': '  Hash：{hash}',
  'info.skillFiles': '  文件：{list}',
  'info.skillMdHeader': '\n--- SKILL.md ---',
  'info.noSkillMd': '  （无 SKILL.md）',

  // ── skill-display ──
  'skillDisplay.skipped': '  ⚠ 已跳过 "{name}"：{reasons}',

  // ── main TUI ──
  'main.prompt': 'skills-sync — 请选择操作',
  'main.initialize': '🚀 初始化',
  'main.initializeDesc': '克隆远端仓库到 ~/.skills/',
  'main.installSkills': '📦 安装 skill',
  'main.installSkillsDesc': '从云端或远程 URL 安装',
  'main.uninstallSkills': '🗑️  卸载 skill',
  'main.uninstallSkillsDesc': '从 workspace 中移除 skill',
  'main.listInstalled': '📋 查看已安装',
  'main.listInstalledDesc': '显示已安装 skill 及同步状态',
  'main.publishChanges': '📤 发布修改',
  'main.publishChangesDesc': '将本地修改推送到云端',
  'main.collectSkills': '🔍 收集系统所有 skills',
  'main.collectSkillsDesc': '扫描系统中所有 agent 目录，收集到云端镜像',
  'main.groups': '📁 Group 管理',
  'main.groupsDesc': '管理 skill 分组',
  'main.link': '🔗 链接 Agent',
  'main.linkDesc': '将其他 agent 的 skills 目录链接到主 agent',
  'main.config': '⚙️  配置',
  'main.configDesc': '查看 / 编辑全局配置',
  'main.exit': '👋 退出',
  'main.publishSubPrompt': '发布操作',
  'main.publishPushAction': '📤 发布修改',
  'main.publishPushDesc': '将本地修改推送到云端',
  'main.publishDeleteAction': '🗑️  从云端删除',
  'main.publishDeleteDesc': '从云端镜像中移除 skill',
  'main.groupActions': 'Group 管理',
  'main.groupListAction': '📋 查看 group 列表',
  'main.groupCreateAction': '➕ 创建 group',
  'main.groupDeleteAction': '🗑️  删除 group',

  // ── option descriptions (index.ts) ──
  'opt.agentDefault': '指定 agent（默认：claude-code）',
  'opt.skillsInstallDir': '指定 skills 安装目录',
  'opt.targetAgent': '指定目标 agent',
  'opt.installDir': '指定安装目录（绝对路径）',
  'opt.groupSelect': '从 group 列表中选择',
  'opt.cloudConflict': '冲突时使用云端版本',
  'opt.localConflict': '冲突时保留本地版本',
  'opt.skillsDir': '指定 skills 目录',
  'opt.dryRun': '预览，不实际执行',
  'opt.json': '以 JSON 格式输出',
  'opt.desc': '描述',
  'opt.fromWorkspace': '从当前 workspace 已安装的 skills 中选择',
  'opt.skipConfirm': '跳过确认',
  'opt.publishAll': '发布当前 workspace 所有变更',
  'opt.commitMessage': '提交消息',
  'opt.customPush': '自定义推送命令',
  'opt.deleteCloud': '从云端删除指定 skill',
  'opt.scanDir': '指定扫描目录',
  'opt.unlinkAgents': '取消指定 agent 的符号链接',

  // ── link ──
  'cmd.link.description': '将其他 agent 的 skills 目录链接到主 agent',
  'cmd.link.arg.agents': '要链接的 agent ID（不指定则进入 TUI）',
  'cmd.link.helpText': `
示例:
  \$ skills-sync link                    # TUI：选择要链接的 agent
  \$ skills-sync link openclaw cursor    # CLI：链接指定 agent
  \$ skills-sync link -D                 # TUI：选择要取消链接的 agent
  \$ skills-sync link -D openclaw        # CLI：取消链接指定 agent`,
  'link.requiresTTY': 'link 命令无参数时需要交互式终端（TTY）。',
  'link.primaryAgent': '主 agent：{agent}（{dir}）',
  'link.selectAgents': '选择要链接到主 agent skills 目录的 agent：',
  'link.selectUnlink': '选择要取消链接的 agent：',
  'link.alreadyLinked': '→ 已链接到 {target}',
  'link.existsNotLink': '⚠ 目录已存在：{path}',
  'link.alreadyCorrect': '{agent}：已正确链接。',
  'link.replaceDir': '{agent}：{path} 是真实目录。是否替换为符号链接？（原目录将备份）',
  'link.skipped': '{agent}：已跳过。',
  'link.skipExistingDir': '{agent}：{path} 是真实目录，跳过（使用 TUI 模式可替换）。',
  'link.skipPrimary': '{agent}：是主 agent，跳过。',
  'link.backedUp': '已备份：{from} → {to}',
  'link.created': '{agent}：已链接 {link} → {target}',
  'link.unknownAgent': '未知 agent：{agent}',
  'link.primaryNotExists': '主 agent skills 目录尚不存在：{dir}',
  'link.runInstallFirst': '请先运行 `skills-sync install` 创建目录，否则链接将指向不存在的目录。',
  'link.notLinked': '{agent}：未链接。',
  'link.notSymlink': '{agent}：{path} 不是符号链接，无法取消。',
  'link.removed': '{agent}：已取消链接 {path}',
  'link.noLinksFound': '当前 workspace 中没有已链接的 agent。',
  'link.noOtherAgents': '未检测到其他已安装的 agent。',
};
