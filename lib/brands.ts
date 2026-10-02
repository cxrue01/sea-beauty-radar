// 品牌名单加载与标签解析（说明书 8.2 / 8.3）。
// 公开版 + 私人版（brands.local.ts 存在时合并）。品牌标签只在显示时动态解析，
// 绝不写入数据库——保证存进 GitHub 的数据里不出现 direct（直接竞品）/ own（自家品牌）。
import { existsSync } from 'fs';
import path from 'path';
import { brands as publicBrands, type Brand } from '../config/brands';

export type BrandTag = { name: string; tier?: string; origin?: string; inList: boolean };

export async function loadBrands(): Promise<Brand[]> {
  const localPath = path.join(process.cwd(), 'config', 'brands.local.ts');
  if (existsSync(localPath)) {
    try {
      const mod = (await import(localPath)) as { localBrands?: Brand[] };
      return [...publicBrands, ...(mod.localBrands ?? [])];
    } catch {
      console.warn('⚠️ 检测到 config/brands.local.ts 但读取失败，先用公开版。');
    }
  }
  return publicBrands;
}

export function brandNameMap(brands: Brand[]): Map<string, Brand> {
  return new Map(brands.map((b) => [b.name, b]));
}

export function brandTags(names: string[], brandMap: Map<string, Brand>): BrandTag[] {
  return names.map((name) => {
    const b = brandMap.get(name);
    return b ? { name, tier: b.tier, origin: b.origin, inList: true } : { name, inList: false };
  });
}
