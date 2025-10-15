export type SocialPlatform =
  | 'linkedin' | 'facebook' | 'instagram' | 'x' | 'youtube'
  | 'wechat' | 'red' | 'zhihu' | 'douyin';

export function utmize(url: string, platform: SocialPlatform, slug: string, extra: Record<string, string> = {}) {
  const u = new URL(url, location.origin);
  u.searchParams.set('utm_source', platform);
  u.searchParams.set('utm_medium', 'social');
  u.searchParams.set('utm_campaign', `blog-${slug}`);
  u.searchParams.set('utm_content', `${platform}-${new Date().toISOString().slice(0, 10)}`);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  return u.toString();
}
