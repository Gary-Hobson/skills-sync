/**
 * utils/output.ts — 输出格式化
 *
 * 提供带颜色和图标的终端输出函数。
 * - success / info / muted 输出到 stdout
 * - error / warn 输出到 stderr
 *
 * 依赖: chalk
 */

import chalk from 'chalk';

/** 成功信息（绿色 + 勾号），输出到 stdout */
export function success(msg: string): void {
  console.log(chalk.green(`\u2713 ${msg}`));
}

/** 错误信息（红色 + 叉号），输出到 stderr */
export function error(msg: string): void {
  console.error(chalk.red(`\u2717 ${msg}`));
}

/** 警告信息（黄色 + 警告号），输出到 stderr */
export function warn(msg: string): void {
  console.error(chalk.yellow(`\u26A0 ${msg}`));
}

/** 普通信息（蓝色，无图标），输出到 stdout */
export function info(msg: string): void {
  console.log(chalk.blue(msg));
}

/** 次要信息（灰色，无图标），输出到 stdout */
export function muted(msg: string): void {
  console.log(chalk.gray(msg));
}

/** 纯文本行（无颜色），输出到 stdout */
export function plain(msg: string): void {
  console.log(msg);
}

/** 输出空行 */
export function blank(): void {
  console.log();
}

/** 返回灰色暗淡文本（用于次要信息，不打印） */
export function dim(msg: string): string {
  return chalk.gray(msg);
}
