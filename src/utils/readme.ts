/**
 * utils/readme.ts — 生成并更新 ~/.agents/README.md
 *
 * 扫描 ~/.agents/skills/ 下所有 skill，读取各 SKILL.md 的 description 和
 * 最后修改时间，只替换 README.md 中由 skills-sync 维护的三个章节：
 *   - ## 目录结构
 *   - ## 快速恢复
 *   - ## 全局 Skills
 * 其余内容（标题、简介、用户自定义章节）保持不变。
 *
 * 依赖: core/config-manager.ts (getAgentsDir, getSkillsDir, getEffectiveConfig)
 * 被引用: core/sync-engine.ts
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { getAgentsDir, getSkillsDir, getEffectiveConfig } from '../core/config-manager.js';

// ── 常量 ──────────────────────────────────────────────────────────────────────

/** 章节之间的分隔符（水平线） */
const SEPARATOR = '\n\n---\n\n';

/** 标注 skills-sync 托管的章节，渲染为可见的 blockquote */
const MANAGED_NOTE = '> *由 [skills-sync](https://www.npmjs.com/package/@garyhobson/skills-sync) 自动维护，请勿手动编辑此章节*';

// ── 类型 ──────────────────────────────────────────────────────────────────────

interface SkillEntry {
  name: string;
  description: string;
  updatedAt: string;
}

interface GroupEntry {
  name: string;
  description: string;
  skills: string[];
}

// ── Skill 扫描 ─────────────────────────────────────────────────────────────────

/** 从 SKILL.md frontmatter 提取 description，fallback 到第一个 # 标题 */
function extractDescription(skillPath: string): string {
  const skillMd = join(skillPath, 'SKILL.md');
  if (!existsSync(skillMd)) return '';
  try {
    const content = readFileSync(skillMd, 'utf-8');
    const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const fm = fmMatch[1];
      // 支持多行 YAML (>- 或 |)：取 description: 之后所有缩进行
      const descStart = fm.match(/^description:\s*(.*)$/m);
      if (descStart) {
        const firstLine = descStart[1].trim();
        if (firstLine && firstLine !== '>-' && firstLine !== '|' && firstLine !== '>') {
          // 单行
          return firstLine;
        }
        // 多行：收集后续缩进行
        const afterDesc = fm.slice(fm.indexOf(descStart[0]) + descStart[0].length);
        const lines: string[] = [];
        for (const line of afterDesc.split('\n').slice(1)) {
          if (/^\s+/.test(line)) lines.push(line.trim());
          else if (line.trim() === '') continue;
          else break;
        }
        return lines.join(' ');
      }
    }
    const titleMatch = content.match(/^#\s+(.+)/m);
    if (titleMatch) return titleMatch[1].trim();
  } catch {
    // ignore
  }
  return '';
}

/** 截断 description：去掉 TRIGGERS 之后的部分 */
function cleanDescription(desc: string): string {
  const idx = desc.search(/\s*TRIGGERS?\s*[-—]/i);
  if (idx > 0) return desc.slice(0, idx).trim();
  return desc;
}

/** 获取 skill 目录的最后修改时间（SKILL.md 优先），格式 YYYY-MM-DD */
function getUpdatedAt(skillPath: string): string {
  try {
    const skillMd = join(skillPath, 'SKILL.md');
    const target = existsSync(skillMd) ? skillMd : skillPath;
    return statSync(target).mtime.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

/** 读取 agentsDir/groups.json，返回按名称排序的 GroupEntry 列表 */
function scanGroups(agentsDir: string): GroupEntry[] {
  const groupsFile = join(agentsDir, 'groups.json');
  if (!existsSync(groupsFile)) return [];
  try {
    const raw = JSON.parse(readFileSync(groupsFile, 'utf-8')) as Record<string, { description?: string; skills?: string[] }>;
    return Object.entries(raw)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, g]) => ({
        name,
        description: g.description ?? '',
        skills: g.skills ?? [],
      }));
  } catch {
    return [];
  }
}

/** 扫描 skillsDir，返回按名称排序的 SkillEntry 列表 */
function scanSkills(skillsDir: string): SkillEntry[] {
  if (!existsSync(skillsDir)) return [];
  try {
    return readdirSync(skillsDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(e => {
        const skillPath = join(skillsDir, e.name);
        return {
          name: e.name,
          description: cleanDescription(extractDescription(skillPath)),
          updatedAt: getUpdatedAt(skillPath),
        };
      });
  } catch {
    return [];
  }
}

/** 从 ~/.agents/.git 读取 origin remote URL，供快速恢复章节使用 */
function getGitRemote(agentsDir: string): string {
  try {
    return execSync('git remote get-url origin', { cwd: agentsDir, stdio: ['pipe', 'pipe', 'pipe'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

// ── 章节构建 ───────────────────────────────────────────────────────────────────

function buildDirStructureSection(): string {
  return [
    '## 目录结构',
    '',
    MANAGED_NOTE,
    '',
    '```',
    '~/.agents/',
    '  README.md',
    '  skills/                 <- 全局 Skills 主目录',
    '```',
  ].join('\n');
}

function buildGroupsSection(groups: GroupEntry[]): string {
  if (groups.length === 0) {
    return [
      '## Groups',
      '',
      MANAGED_NOTE,
      '',
      '暂无 group。使用 `skills-sync group add <name> <skill...>` 创建。',
    ].join('\n');
  }
  return [
    '## Groups',
    '',
    MANAGED_NOTE,
    '',
    '| Group | 说明 | 包含 Skills |',
    '|-------|------|-------------|',
    ...groups.map(g => `| \`${g.name}\` | ${g.description} | ${g.skills.map(s => `\`${s}\``).join(', ')} |`),
  ].join('\n');
}

function buildQuickStartSection(remote: string): string {
  const repoArg = remote || '<your-git-repo>';
  return [
    '## 快速恢复',
    '',
    MANAGED_NOTE,
    '',
    '```bash',
    `npm install -g @garyhobson/skills-sync`,
    `skills-sync init ${repoArg}`,
    '```',
  ].join('\n');
}

function buildSkillsSection(skills: SkillEntry[]): string {
  return [
    '## 全局 Skills',
    '',
    MANAGED_NOTE,
    '',
    `存放于 \`~/.agents/skills/\`，共 ${skills.length} 个。`,
    '',
    '| Skill | 说明 | 更新时间 |',
    '|-------|------|----------|',
    ...skills.map(s => `| \`${s.name}\` | ${s.description} | ${s.updatedAt} |`),
  ].join('\n');
}

// ── README 更新（只修改托管章节） ─────────────────────────────────────────────

/**
 * 将 readme 内容按 `\n\n---\n\n` 拆分为 blocks，替换托管章节后重新拼合。
 * 非托管章节原样保留。找不到的托管章节在末尾追加。
 */
function applyManagedSections(
  existing: string,
  updates: Map<string, string>,
): string {
  const blocks = existing.split(SEPARATOR);

  // 过滤掉已托管的章节（不论原来在哪里），保留用户自定义内容
  const retained = blocks.filter(block => {
    const m = block.match(/^## (.+)(?:\n|$)/);
    return !m || !updates.has(m[1].trim());
  });

  // 将所有托管章节按 Map 顺序追加到末尾
  for (const content of updates.values()) {
    retained.push(content);
  }

  return retained.join(SEPARATOR);
}

/** 全新生成 README（首次初始化，README 不存在时使用） */
function buildFullReadme(skills: SkillEntry[], groups: GroupEntry[], remote: string): string {
  const blocks = [
    [
      '# ~/.agents/ — AI Skills 管理仓库',
      '',
      '统一管理所有 AI Agent 的自定义技能（Skills），通过 [skills-sync](https://www.npmjs.com/package/@garyhobson/skills-sync) 备份和同步到 GitHub。',
    ].join('\n'),
    buildQuickStartSection(remote),
    buildDirStructureSection(),
    buildGroupsSection(groups),
    buildSkillsSection(skills),
  ];
  return blocks.join(SEPARATOR) + '\n';
}

// ── 公开 API ──────────────────────────────────────────────────────────────────

/**
 * 更新 ~/.agents/README.md 中由 skills-sync 维护的三个章节。
 * 其余内容保持不变；README 不存在时完整创建。
 * 静默失败：出错时不抛出，仅返回 false。
 */
export function updateAgentsReadme(): boolean {
  try {
    const agentsDir = getAgentsDir();
    const skillsDir = getSkillsDir();
    const skills = scanSkills(skillsDir);
    const groups = scanGroups(agentsDir);
    const remote = getEffectiveConfig().remote || getGitRemote(agentsDir);

    const readmePath = join(agentsDir, 'README.md');

    let content: string;
    if (existsSync(readmePath)) {
      const existing = readFileSync(readmePath, 'utf-8');
      const updates = new Map([
        ['快速恢复', buildQuickStartSection(remote)],
        ['目录结构', buildDirStructureSection()],
        ['Groups', buildGroupsSection(groups)],
        ['全局 Skills', buildSkillsSection(skills)],
      ]);
      content = applyManagedSections(existing, updates);
    } else {
      content = buildFullReadme(skills, groups, remote);
    }

    // 内容无变化时不写文件，避免触发无意义的 git diff
    const existing2 = existsSync(readmePath) ? readFileSync(readmePath, 'utf-8') : null;
    if (existing2 !== content) {
      writeFileSync(readmePath, content, 'utf-8');
    }
    return true;
  } catch {
    return false;
  }
}
