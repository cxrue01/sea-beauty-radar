// 公开版品牌名单（说明书 8.2 / 8.4）
// 只放公开可查的出海标杆和当地头部品牌，可安全上传 GitHub。
// 直接竞品（direct）和自家品牌（own）只放在 config/brands.local.ts（本地、不上传）。

export type BrandTier = 'direct' | 'benchmark' | 'local_leader' | 'own';
export type BrandOrigin = 'CN' | 'local' | 'KR' | 'global';

export type Brand = {
  name: string; // 品牌名（保留原文）
  tier: BrandTier; // 层级
  origin: BrandOrigin; // 背后资本（按真实资本标注，不按对外宣传身份，见说明书 8.5）
  markets: string[]; // 主攻国家（ISO 码）
};

// markets 是我的初步判断，你可随时改；留空表示尚未明确主攻 SEA 某国。
export const brands: Brand[] = [
  // —— 出海标杆（中国资本）——
  { name: 'Skintific', tier: 'benchmark', origin: 'CN', markets: ['ID', 'MY', 'VN', 'PH'] },
  { name: 'Glad2Glow', tier: 'benchmark', origin: 'CN', markets: ['ID', 'PH', 'MY'] },
  { name: 'Focallure', tier: 'benchmark', origin: 'CN', markets: ['VN', 'ID'] },
  { name: 'Pinkflash', tier: 'benchmark', origin: 'CN', markets: ['ID', 'PH'] },
  { name: 'Barenbliss', tier: 'benchmark', origin: 'CN', markets: ['ID', 'MY'] },
  { name: 'O.TWO.O', tier: 'benchmark', origin: 'CN', markets: ['VN', 'ID'] },
  { name: 'Y.O.U Beauty', tier: 'benchmark', origin: 'CN', markets: ['ID', 'MY', 'PH'] },
  { name: 'Dazzle Me', tier: 'benchmark', origin: 'CN', markets: ['PH'] },
  { name: 'Proya', tier: 'benchmark', origin: 'CN', markets: [] }, // 珀莱雅
  { name: 'Florasis', tier: 'benchmark', origin: 'CN', markets: [] }, // 花西子
  { name: 'Judydoll', tier: 'benchmark', origin: 'CN', markets: [] },
  { name: 'INTO YOU', tier: 'benchmark', origin: 'CN', markets: [] },

  // —— 当地头部（守擂者）——
  { name: 'Cocoon', tier: 'local_leader', origin: 'local', markets: ['VN'] },
  { name: 'Candid', tier: 'local_leader', origin: 'local', markets: ['VN'] },
  { name: 'Wardah', tier: 'local_leader', origin: 'local', markets: ['ID'] },
  { name: 'Kahf', tier: 'local_leader', origin: 'local', markets: ['ID'] },
];
