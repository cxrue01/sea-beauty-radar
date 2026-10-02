// Dashboard / 周刊共用的中文标签映射（说明书 8.3 / 9.2 / 11）。
// 品牌层级和背后资本的中文名，与 scripts/test-analyze.ts 里保持一致。
import { countries } from '../config/keywords';
import { MARKET_CATEGORIES, POLICY_CATEGORIES } from './analyze';

export type CountryMeta = { code: string; name: string; flag: string };

/** 国家显示顺序 = 配置文件里的顺序（越南排第一，说明书 5.1）。 */
export const COUNTRY_ORDER: string[] = countries.map((c) => c.code);

export const COUNTRY_BY_CODE: Record<string, CountryMeta> = Object.fromEntries(
  countries.map((c) => [c.code, { code: c.code, name: c.name, flag: c.flag }]),
);

export const COUNTRY_LABEL: Record<string, string> = Object.fromEntries(
  countries.map((c) => [c.code, `${c.flag} ${c.name}`]),
);

export const SECTION_LABEL: Record<string, string> = {
  market: '市场动态',
  policy: '进入政策',
};

export const IMPACT_LABEL: Record<string, string> = {
  high: '高影响',
  medium: '中影响',
  low: '低影响',
};

export const TIER_LABEL: Record<string, string> = {
  direct: '直接竞品',
  benchmark: '出海标杆',
  local_leader: '当地头部',
  own: '自家品牌',
};

export const ORIGIN_LABEL: Record<string, string> = {
  CN: '中国',
  local: '本土',
  KR: '韩国',
  global: '国际',
};

export const MARKET_CATEGORY_LIST = MARKET_CATEGORIES;
export const POLICY_CATEGORY_LIST = POLICY_CATEGORIES;
export const ALL_CATEGORY_LIST = [...MARKET_CATEGORIES, ...POLICY_CATEGORIES];
