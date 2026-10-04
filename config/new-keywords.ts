// 2026-10-02 政策收紧后新增的「连锁渠道 + KOL/代言人」关键词。
// 供关键词命中统计用（见关键决定 12：连续 3 周零命中的再删除）。
// 注意：这里的 kw 必须和 config/keywords.ts 里的字符串完全一致（统计靠字符串精确匹配）。
export type NewKeyword = { country: string; kw: string; meaning: string };

export const NEW_KEYWORDS: NewKeyword[] = [
  { country: 'VN', kw: 'Watsons mỹ phẩm', meaning: '屈臣氏·化妆品' },
  { country: 'VN', kw: 'Guardian mỹ phẩm', meaning: 'Guardian·化妆品' },
  { country: 'VN', kw: 'Hasaki', meaning: 'Hasaki 越南美妆连锁' },
  { country: 'VN', kw: 'đại sứ thương hiệu mỹ phẩm', meaning: '美妆品牌代言人' },
  { country: 'VN', kw: 'KOL mỹ phẩm', meaning: '美妆 KOL/达人' },
  { country: 'ID', kw: 'Watsons kosmetik', meaning: '屈臣氏·化妆品' },
  { country: 'ID', kw: 'Guardian kosmetik', meaning: 'Guardian·化妆品' },
  { country: 'ID', kw: 'brand ambassador kosmetik', meaning: '化妆品品牌代言人' },
  { country: 'ID', kw: 'kol kecantikan', meaning: '美妆 KOL/达人' },
  { country: 'TH', kw: 'Watsons เครื่องสำอาง', meaning: '屈臣氏·化妆品' },
  { country: 'TH', kw: 'Guardian เครื่องสำอาง', meaning: 'Guardian·化妆品' },
  { country: 'TH', kw: 'พรีเซนเตอร์ เครื่องสำอาง', meaning: '化妆品品牌代言人' },
  { country: 'TH', kw: 'บิวตี้บล็อกเกอร์ เครื่องสำอาง', meaning: '美妆博主/KOL' },
  { country: 'PH', kw: 'Watsons beauty Philippines', meaning: '屈臣氏·美妆' },
  { country: 'PH', kw: 'Guardian beauty Philippines', meaning: 'Guardian·美妆' },
  { country: 'PH', kw: 'beauty brand ambassador Philippines', meaning: '美妆品牌代言人' },
  { country: 'PH', kw: 'beauty influencer Philippines', meaning: '美妆达人/KOL' },
  { country: 'MY', kw: 'Watsons kosmetik', meaning: '屈臣氏·化妆品' },
  { country: 'MY', kw: 'Guardian kosmetik', meaning: 'Guardian·化妆品' },
  { country: 'MY', kw: 'duta jenama kosmetik', meaning: '化妆品品牌代言人' },
  { country: 'MY', kw: 'influencer kecantikan', meaning: '美妆达人/KOL' },
  { country: 'SG', kw: 'Watsons beauty Singapore', meaning: '屈臣氏·美妆' },
  { country: 'SG', kw: 'Guardian beauty Singapore', meaning: 'Guardian·美妆' },
  { country: 'SG', kw: 'beauty brand ambassador Singapore', meaning: '美妆品牌代言人' },
  { country: 'SG', kw: 'beauty influencer Singapore', meaning: '美妆达人/KOL' },
];
