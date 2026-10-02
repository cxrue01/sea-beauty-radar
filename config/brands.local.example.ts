// 私人版品牌名单模板（虚构示例，仅用于演示格式）
//
// 使用方法：
//   1. 把本文件复制一份，改名为 brands.local.ts（放在 config/ 目录下）
//   2. 填入你自己的「直接竞品」和「自家品牌」
//   3. brands.local.ts 已被 .gitignore 忽略，绝不会上传 GitHub
//
// 程序逻辑（说明书 8.2）：brands.local.ts 存在 → 与公开版 brands.ts 合并；
// 不存在 → 只用公开版。

import type { Brand } from './brands';

// ⚠️ 下面是虚构示例，请替换成你自己的真实名单
export const localBrands: Brand[] = [
  { name: '示例品牌A', tier: 'direct', origin: 'CN', markets: ['VN'] },
  { name: '示例品牌B', tier: 'direct', origin: 'local', markets: ['ID'] },
  { name: '示例品牌C', tier: 'own', origin: 'CN', markets: ['VN', 'ID'] },
];
