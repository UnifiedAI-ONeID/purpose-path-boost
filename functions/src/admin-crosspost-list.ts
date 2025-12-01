import * as functions from 'firebase-functions';

export const adminCrosspostList = functions.https.onCall(async (data, context) => {
  // TODO: Implement the real logic
  return {
    ok: true,
    rows: [
      {
        id: '1',
        platform: 'linkedin',
        title: 'My first post',
        status: 'posted',
        scheduled_at: null,
        published_at: new Date().toISOString(),
      },
      {
        id: '2',
        platform: 'x',
        title: 'My second post',
        status: 'queued',
        scheduled_at: new Date().toISOString(),
        published_at: null,
      },
    ],
  };
});
