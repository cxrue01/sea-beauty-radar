// 6 国关键词配置：市场类 + 政策类（说明书第 7 节）
// 每个关键词后面的中文注释用于审核（说明书 7.1）
// 越南排最前、关键词最全（说明书 5.1「越南优先」）

export type Country = {
  code: string; // ISO 国家码
  name: string; // 中文名
  flag: string; // 国旗（Dashboard / 周刊用）
  language: string; // Google News 的 hl 参数
  gl: string; // Google News 的 gl 参数
  ceid: string; // Google News 的 ceid 参数
  market: string[]; // 市场类关键词
  policy: string[]; // 政策类关键词
};

export const countries: Country[] = [
  {
    code: 'VN',
    name: '越南',
    flag: '🇻🇳',
    language: 'vi',
    gl: 'VN',
    ceid: 'VN:vi',
    market: [
      'mỹ phẩm Trung Quốc', // 中国化妆品
      'mặt nạ mắt', // 眼膜
      'TikTok Shop mỹ phẩm', // TikTok Shop 化妆品
      'serum làm trắng', // 美白精华
      'bộ dưỡng da', // 护肤套装
      'thương hiệu mỹ phẩm mới', // 新美妆品牌
      'mỹ phẩm giảm giá', // 化妆品促销/打折
      'mỹ phẩm nhập khẩu', // 进口化妆品
      'mỹ phẩm giả', // 假冒化妆品
      'thị trường mỹ phẩm', // 化妆品市场
    ],
    policy: [
      'đăng ký mỹ phẩm', // 化妆品备案/注册
      'công bố mỹ phẩm', // 化妆品产品公布/备案
      'quy định nhập khẩu mỹ phẩm', // 化妆品进口规定
      'cấm thành phần mỹ phẩm', // 化妆品成分禁令
      'quản lý mỹ phẩm', // 化妆品监管
      'thuế mỹ phẩm', // 化妆品关税
    ],
  },
  {
    code: 'ID',
    name: '印尼',
    flag: '🇮🇩',
    language: 'id',
    gl: 'ID',
    ceid: 'ID:id',
    market: [
      'kosmetik China', // 中国化妆品
      'brand kecantikan', // 美妆品牌
      'masker mata', // 眼膜
      'serum pencerah', // 美白精华（pencerah 更中性；pemutih 有"漂白"负面含义）
      'kosmetik TikTok Shop', // TikTok Shop 化妆品
      'promo kosmetik', // 化妆品促销
      'industri kosmetik', // 化妆品产业/市场
    ],
    policy: [
      'BPOM kosmetik', // 印尼食药监·化妆品
      'sertifikasi halal kosmetik', // 化妆品清真认证
      'regulasi kosmetik', // 化妆品法规
      'bea masuk kosmetik', // 化妆品进口关税
    ],
  },
  {
    code: 'TH',
    name: '泰国',
    flag: '🇹🇭',
    language: 'th',
    gl: 'TH',
    ceid: 'TH:th',
    market: [
      'เครื่องสำอาง จีน', // 中国化妆品
      'มาส์กตา', // 眼膜
      'เซรั่มผิวขาว', // 美白精华
      'เครื่องสำอาง TikTok Shop', // TikTok Shop 化妆品
      'โปรโมชั่นเครื่องสำอาง', // 化妆品促销
      'ตลาดเครื่องสำอาง', // 化妆品市场
    ],
    policy: [
      'จดแจ้งเครื่องสำอาง', // 化妆品备案（泰国 FDA）
      'อย. เครื่องสำอาง', // 泰国食药监·化妆品
      'ภาษีนำเข้าเครื่องสำอาง', // 化妆品进口税
    ],
  },
  {
    code: 'PH',
    name: '菲律宾',
    flag: '🇵🇭',
    language: 'en-PH',
    gl: 'PH',
    ceid: 'PH:en',
    market: [
      'Chinese beauty brand Philippines', // 中国美妆品牌·菲律宾
      'eye mask skincare Philippines', // 眼膜护肤·菲律宾
      'whitening serum Philippines', // 美白精华·菲律宾
      'TikTok Shop beauty Philippines', // TikTok Shop 美妆·菲律宾
      'cosmetics launch Philippines', // 菲律宾化妆品上新
      'beauty market Philippines', // 化妆品市场·菲律宾
    ],
    policy: [
      'FDA cosmetics Philippines', // 菲律宾食药监·化妆品
      'cosmetics registration Philippines', // 菲律宾化妆品注册
      'cosmetics import Philippines', // 菲律宾化妆品进口
    ],
  },
  {
    code: 'MY',
    name: '马来西亚',
    flag: '🇲🇾',
    language: 'ms-MY',
    gl: 'MY',
    ceid: 'MY:ms',
    market: [
      'kosmetik China', // 中国化妆品
      'jenama kecantikan', // 美妆品牌
      'mask mata', // 眼膜
      'serum pencerah', // 美白精华（同印尼，避开 pemutih）
      'kosmetik TikTok Shop', // TikTok Shop 化妆品
      'promosi kosmetik', // 化妆品促销
      'pasaran kosmetik', // 化妆品市场
    ],
    policy: [
      'NPRA kosmetik', // 马来西亚药监局·化妆品
      'pendaftaran kosmetik', // 化妆品注册
      'kosmetik halal', // 清真化妆品
    ],
  },
  {
    code: 'SG',
    name: '新加坡',
    flag: '🇸🇬',
    language: 'en-SG',
    gl: 'SG',
    ceid: 'SG:en',
    market: [
      'Chinese beauty brand Singapore', // 中国美妆品牌·新加坡
      'beauty brand Singapore', // 新加坡美妆品牌
      'cosmetics launch Singapore', // 新加坡化妆品上新
      'TikTok Shop beauty Singapore', // TikTok Shop 美妆·新加坡
      'whitening serum Singapore', // 美白精华·新加坡
      'beauty market Singapore', // 化妆品市场·新加坡
    ],
    policy: [
      'HSA cosmetics Singapore', // 新加坡卫生科学局·化妆品
      'cosmetics regulation Singapore', // 新加坡化妆品法规
      'cosmetics import Singapore', // 新加坡化妆品进口
    ],
  },
];
