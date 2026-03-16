/**
 * types/index.ts — 核心类型定义
 *
 * 定义 sync-skills 全局共享的类型、接口和常量。
 * 所有模块统一从此文件导入类型。
 *
 * 无外部依赖。
 */

/** 冲突解决策略：cloud 以云端为准，workspace 以本地工作区为准 */
export type ConflictStrategy = 'cloud' | 'workspace';

/** CLI 输出格式 */
export type OutputFormat = 'text' | 'json' | 'plain';

/** Skill 在云端与本地之间的同步状态 */
export type SyncStatus = 'synced' | 'modified';

/** Skill 元信息（来自 skill 目录中的元数据） */
export interface SkillMeta {
  name: string;
  description?: string;
  version?: string;
}

/** Skill 同步状态详情，包含双端 hash 用于比对 */
export interface SkillSyncInfo {
  name: string;
  status: SyncStatus;
  /** workspace 端文件的 MD5 签名 */
  localHash?: string;
  /** 云端（本地镜像）文件的 MD5 签名 */
  cloudHash?: string;
}

/** Group 定义，对应 groups.json 中的单个 group */
export interface GroupDef {
  /** group 的描述说明 */
  description: string;
  /** 包含的 skill 名称列表 */
  skills: string[];
  /** 创建时间（ISO 8601） */
  created: string;
}

/** groups.json 整体结构，key 为 group 名称 */
export type GroupsMap = Record<string, GroupDef>;

/** 当前 workspace 信息（直接从全局配置和当前目录推断，不持久化） */
export interface WorkspaceInfo {
  /** workspace 根目录的绝对路径（cwd） */
  path: string;
  /** skill 安装目录（相对于 workspace 根目录） */
  skills_dir: string;
  /** 关联的 agent ID */
  agent: string;
}

/** 全局配置，对应 config.json */
export interface GlobalConfig {
  /** 默认 agent ID */
  agent: string;
  /** 远端 Git 仓库 URL */
  remote: string;
  /** 界面语言（zh / en） */
  language?: string;
}

/** Agent 路径映射，定义 agent 在工程和全局的 skills 目录 */
export interface AgentPaths {
  /** agent 的显示名称 */
  displayName: string;
  /** 工程级 skills 目录（相对路径） */
  projectPath: string;
  /** 全局 skills 目录（可包含 ~ 和 $ENV_VAR） */
  globalPath: string;
}

/** Skill 名和 group 名的校验正则：小写字母、数字、连字符 */
export const SKILL_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/** 进程退出码 */
export const EXIT_CODES = {
  /** 操作成功 */
  SUCCESS: 0,
  /** 一般错误 */
  GENERAL_ERROR: 1,
  /** 参数错误 */
  ARG_ERROR: 2,
  /** 冲突未解决 */
  CONFLICT_UNRESOLVED: 3,
  /** 用户中断（Ctrl+C） */
  USER_INTERRUPT: 130,
} as const;
