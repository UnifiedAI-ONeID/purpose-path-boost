import { AI } from '../ai-config';
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

export const buildCaption = async ({ 
  platform, 
  lang, 
  title, 
  summary = '', 
  slug, 
  tags = [], 
  baseUrl = 'https://zhengrowth.com' 
}: CaptionBuilderArgs): Promise<CaptionBuilderReturn> => {
  const link = utmize(`${baseUrl}/blog/${slug}`, platform, slug);

  const prompt = `
    Generate a social media caption for the following blog post:

    **Title:** ${title}
    **Summary:** ${summary}
    **Tags:** ${tags.join(', ' || 'N/A')}
    **Platform:** ${platform}
    **Language:** ${lang}
    **Link:** ${link}

    The caption should be engaging and encourage users to click the link to read the full blog post.
    Please also include relevant hashtags.
  `;

  const response = await AI.genkit.generate({ prompt });
  const text = response.text();

  return { text, link };
};
