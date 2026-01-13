/**
 * Funnel & Email Functions
 * 
 * Functions for email funnels, campaigns, and automation
 */

import * as functions from 'firebase-functions';
import { db } from './firebase-init';

// Helper to verify admin role
async function verifyAdmin(context: functions.https.CallableContext): Promise<void> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const userDoc = await db.collection('admins').doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
}

/**
 * Funnel Send Email - Send test or production email
 */
export const funnelSendEmail = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  const { to, subject, template, templateData, isTest } = data || {};

  if (!to || !subject) {
    throw new functions.https.HttpsError('invalid-argument', 'Recipient and subject required');
  }

  try {
    // Log email to queue
    const emailData = {
      to,
      subject,
      template: template || 'default',
      template_data: templateData || {},
      is_test: isTest || false,
      status: 'pending',
      created_at: new Date().toISOString(),
      created_by: context.auth!.uid
    };

    const docRef = await db.collection('email_queue').add(emailData);

    // In production, this would integrate with an email service
    // For now, we simulate sending
    await simulateSendEmail(emailData);

    // Update status
    await docRef.update({
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    return { ok: true, emailId: docRef.id, message: 'Email sent' };
  } catch (error) {
    console.error('Send email error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});

/**
 * Funnel Process Queue - Process pending emails in queue
 */
export const funnelProcessQueue = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  const { limit = 50 } = data || {};

  try {
    // Get pending emails
    const pendingSnap = await db.collection('email_queue')
      .where('status', '==', 'pending')
      .orderBy('created_at', 'asc')
      .limit(limit)
      .get();

    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const doc of pendingSnap.docs) {
      results.processed++;
      const emailData = doc.data();

      try {
        await simulateSendEmail(emailData);
        await doc.ref.update({
          status: 'sent',
          sent_at: new Date().toISOString()
        });
        results.success++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await doc.ref.update({
          status: 'failed',
          error: errorMessage,
          failed_at: new Date().toISOString()
        });
        results.failed++;
        results.errors.push(`${doc.id}: ${errorMessage}`);
      }
    }

    return { ok: true, results };
  } catch (error) {
    console.error('Process queue error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process email queue');
  }
});

/**
 * Funnel Campaign Create - Create email campaign
 */
export const funnelCampaignCreate = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  const { name, subject, template, segment, scheduledAt } = data || {};

  if (!name || !subject || !template) {
    throw new functions.https.HttpsError('invalid-argument', 'Name, subject, and template required');
  }

  try {
    const campaignData = {
      name,
      subject,
      template,
      segment: segment || 'all',
      scheduled_at: scheduledAt || null,
      status: 'draft',
      stats: {
        sent: 0,
        opened: 0,
        clicked: 0,
        bounced: 0
      },
      created_at: new Date().toISOString(),
      created_by: context.auth!.uid
    };

    const docRef = await db.collection('campaigns').add(campaignData);

    return { ok: true, campaignId: docRef.id, campaign: campaignData };
  } catch (error) {
    console.error('Create campaign error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create campaign');
  }
});

/**
 * Funnel Campaign List - List email campaigns
 */
export const funnelCampaignList = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  const { status, limit = 50 } = data || {};

  try {
    let query = db.collection('campaigns')
      .orderBy('created_at', 'desc')
      .limit(limit);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { ok: true, campaigns };
  } catch (error) {
    console.error('List campaigns error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to list campaigns');
  }
});

/**
 * Funnel Subscribe - Add subscriber to funnel
 */
export const funnelSubscribe = functions.https.onCall(async (data, context) => {
  const { email, name, source, tags } = data || {};

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email required');
  }

  try {
    // Check for existing subscriber
    const existingSnap = await db.collection('subscribers')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      // Update existing subscriber
      const existingDoc = existingSnap.docs[0];
      const existingData = existingDoc.data();
      
      await existingDoc.ref.update({
        tags: [...new Set([...(existingData.tags || []), ...(tags || [])])],
        updated_at: new Date().toISOString()
      });

      return { ok: true, subscriberId: existingDoc.id, isNew: false };
    }

    // Create new subscriber
    const subscriberData = {
      email: email.toLowerCase(),
      name: name || '',
      source: source || 'website',
      tags: tags || [],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await db.collection('subscribers').add(subscriberData);

    // Trigger welcome sequence
    await db.collection('automation_triggers').add({
      type: 'new_subscriber',
      subscriber_id: docRef.id,
      email: email.toLowerCase(),
      triggered_at: new Date().toISOString()
    });

    return { ok: true, subscriberId: docRef.id, isNew: true };
  } catch (error) {
    console.error('Subscribe error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to subscribe');
  }
});

/**
 * Funnel Unsubscribe - Remove subscriber from funnel
 */
export const funnelUnsubscribe = functions.https.onCall(async (data, context) => {
  const { email, subscriberId, reason } = data || {};

  if (!email && !subscriberId) {
    throw new functions.https.HttpsError('invalid-argument', 'Email or subscriberId required');
  }

  try {
    let docRef;

    if (subscriberId) {
      docRef = db.collection('subscribers').doc(subscriberId);
    } else {
      const snap = await db.collection('subscribers')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (snap.empty) {
        return { ok: true, message: 'Subscriber not found' };
      }

      docRef = snap.docs[0].ref;
    }

    await docRef.update({
      status: 'unsubscribed',
      unsubscribe_reason: reason || 'user_request',
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return { ok: true, message: 'Successfully unsubscribed' };
  } catch (error) {
    console.error('Unsubscribe error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to unsubscribe');
  }
});

// Helper functions

async function simulateSendEmail(emailData: any) {
  // Placeholder for actual email sending
  // Would integrate with SendGrid, Mailgun, SES, etc.
  console.log('Simulating email send:', emailData.to, emailData.subject);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return { success: true, messageId: `msg_${Date.now()}` };
}
