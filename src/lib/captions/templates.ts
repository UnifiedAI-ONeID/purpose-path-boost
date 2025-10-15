import { pickHashtags, platformHashLimit, EMO } from './helpers';
import { utmize, SocialPlatform } from '../utm';

type CaptionBuilderArgs = {
  platform: SocialPlatform;
  lang: 'en' | 'zh-CN' | 'zh-TW';
  title: string;
  summary?: string;
  slug: string;
  coverUrl?: string;
  tags?: string[];
  baseUrl?: string; // default https://zhengrowth.com
};

type CaptionBuilderReturn = {
  text: string;
  link: string;
};

export const buildCaption = ({ 
  platform, 
  lang, 
  title, 
  summary = '', 
  slug, 
  tags = [], 
  baseUrl = 'https://zhengrowth.com' 
}: CaptionBuilderArgs): CaptionBuilderReturn => {
  const link = utmize(`${baseUrl}/blog/${slug}`, platform, slug);
  const max = platformHashLimit(platform);
  
  const commonTags = ['LifeCoaching', 'Clarity', 'Confidence', 'Consistency', 'Mindset', 'WomenInLeadership', 'CareerGrowth', 'ZhenGrowth'];
  const zhTagsCN = ['人生教练', '自我成长', '清晰', '自信', '目标', '女性成长', '职场', '心态', '真成长'];
  const zhTagsTW = ['人生教練', '自我成長', '清晰', '自信', '目標', '女性成長', '職場', '心態', '真成長'];
  
  const chosen = pickHashtags(
    lang === 'en' ? [...tags, ...commonTags] :
    lang === 'zh-CN' ? [...tags, ...zhTagsCN] :
    [...tags, ...zhTagsTW], 
    max
  );

  // Templates for English
  const en = {
    linkedin:  `${EMO.leaf} ${title}\n\n${summary}\n\n${EMO.link} Read: ${link}\n${chosen.join(' ')}`,
    facebook:  `${title}\n\n${summary}\n\nRead: ${link}\n${chosen.join(' ')}`,
    instagram: `${title}\n\n${summary}\n\nMore in bio / link: ${link}\n${chosen.join(' ')}`,
    x:         `${title} — ${summary.slice(0, 150)} ${link} ${chosen.join(' ')}`.trim(),
    youtube:   `${title}\n\n${summary}\n\nFull article: ${link}\n${chosen.join(' ')}`,
    wechat:    `${title}\n\n${summary}\n\n${link}`,
    red:       `${title}\n\n${summary}\n\n${link}\n${chosen.join(' ')}`,
    zhihu:     `${title}\n\n${summary}\n\n${link}`,
    douyin:    `${title}\n\n${summary}\n\n${link}`
  };

  // Templates for Simplified Chinese
  const zhCN = {
    linkedin:  `${EMO.leaf} ${title}\n\n${summary}\n\n${EMO.link} 文章链接：${link}\n${chosen.join(' ')}`,
    facebook:  `${title}\n\n${summary}\n\n阅读全文：${link}\n${chosen.join(' ')}`,
    instagram: `${title}\n\n${summary}\n\n更多内容：${link}\n${chosen.join(' ')}`,
    x:         `${title}—${summary.slice(0, 150)} ${link} ${chosen.join(' ')}`.trim(),
    youtube:   `${title}\n\n${summary}\n\n全文：${link}\n${chosen.join(' ')}`,
    wechat:    `${title}\n\n${summary}\n\n${link}`,
    red:       `${title}\n\n${summary}\n\n${link}\n${chosen.join(' ')}`,
    zhihu:     `${title}\n\n${summary}\n\n${link}`,
    douyin:    `${title}\n\n${summary}\n\n${link}`
  };

  // Templates for Traditional Chinese
  const zhTW = {
    linkedin:  `${EMO.leaf} ${title}\n\n${summary}\n\n${EMO.link} 文章連結：${link}\n${chosen.join(' ')}`,
    facebook:  `${title}\n\n${summary}\n\n閱讀全文：${link}\n${chosen.join(' ')}`,
    instagram: `${title}\n\n${summary}\n\n更多內容：${link}\n${chosen.join(' ')}`,
    x:         `${title}－${summary.slice(0, 150)} ${link} ${chosen.join(' ')}`.trim(),
    youtube:   `${title}\n\n${summary}\n\n全文：${link}\n${chosen.join(' ')}`,
    wechat:    `${title}\n\n${summary}\n\n${link}`,
    red:       `${title}\n\n${summary}\n\n${link}\n${chosen.join(' ')}`,
    zhihu:     `${title}\n\n${summary}\n\n${link}`,
    douyin:    `${title}\n\n${summary}\n\n${link}`
  };

  const map = lang === 'en' ? en : lang === 'zh-CN' ? zhCN : zhTW;
  const key = platform as keyof typeof en;

  return { text: map[key] || map.linkedin, link };
};
