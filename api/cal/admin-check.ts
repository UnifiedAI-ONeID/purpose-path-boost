import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCalKey } from '../_util/calKey';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const key = await getCalKey();
    return res.status(200).json({
      ok: true,
      has_key: !!key,
      team: process.env.CALCOM_TEAM || 'zhengrowth'
    });
  } catch (error: any) {
    return res.status(200).json({
      ok: false,
      error: error.message
    });
  }
}
