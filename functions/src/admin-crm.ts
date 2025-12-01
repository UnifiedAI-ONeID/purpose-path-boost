import * as functions from 'firebase-functions';

export const adminCrm = functions.https.onCall(async (data, context) => {
  // TODO: Implement the real logic
  return {
    ok: true,
    leads: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        created_at: new Date().toISOString(),
        tags: ['new'],
        stage: 'lead',
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        created_at: new Date().toISOString(),
        tags: ['active'],
        stage: 'contacted',
      },
    ],
  };
});
