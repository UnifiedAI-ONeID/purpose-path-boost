import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const team = process.env.CALCOM_TEAM || 'zhengrowth';
  const slug = (req.query.slug as string) || req.body?.slug;
  const name = (req.query.name as string) || req.body?.name || '';
  const email = (req.query.email as string) || req.body?.email || '';
  const campaign = (req.query.campaign as string) || req.body?.campaign || 'site';

  if (!slug) {
    return res.status(400).json({ ok: false, error: 'Missing slug parameter' });
  }

  const params = new URLSearchParams({
    name,
    email,
    utm_source: 'zg',
    utm_medium: 'cta',
    utm_campaign: campaign
  });

  const url = `https://cal.com/${team}/${slug}?${params.toString()}`;

  return res.status(200).json({ ok: true, url });
}
