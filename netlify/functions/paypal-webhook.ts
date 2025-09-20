import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import admin from 'firebase-admin';
import fetch from 'node-fetch';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const handler = async (event, context) => {
  try {
    const reqBody = JSON.parse(event.body);
    const headers = event.headers;

    const {
      'paypal-transmission-id': transmissionId,
      'paypal-transmission-time': transmissionTime,
      'paypal-cert-url': certUrl,
      'paypal-auth-algo': authAlgo,
      'paypal-transmission-sig': transmissionSig
    } = headers;

    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    const paypalApi = process.env.PAYPAL_API;

    
 if (!clientId || !secret || !webhookId || !paypalApi) {
      console.error('Missing PayPal environment variables');
      return {
        statusCode: 500,
        body: 'Missing configuration',
      };
    }

    // 4. Get PayPal OAuth Token
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const tokenRes = await fetch(`${paypalApi}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      console.error('Failed to fetch access token:', await tokenRes.text());
      return { statusCode: 500, body: 'Error fetching PayPal token' };
    }

    const { access_token } = await tokenRes.json();

    // 5. Verify Webhook Signature
    const verifyRes = await fetch(`${paypalApi}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: reqBody,
      }),
    });

    const verifyData = await verifyRes.json();
    if (verifyData.verification_status !== 'SUCCESS') {
      console.error('Webhook verification failed:', verifyData);
      return { statusCode: 400, body: 'Invalid signature' };
    }

    // 6. Process Event
    const eventType = reqBody.event_type;
    const resource = reqBody.resource || {};
    const subscriberEmail = resource.subscriber?.email_address;

    if (!subscriberEmail) {
      console.warn('No subscriber email');
      return { statusCode: 200, body: 'No action needed' };
    }

    const usersSnap = await admin.firestore()
      .collection('users')
      .where('email', '==', subscriberEmail)
      .limit(1)
      .get();

    if (usersSnap.empty) {
      console.warn(`No user found for ${subscriberEmail}`);
      return { statusCode: 200, body: 'User not found' };
    }

    const userRef = usersSnap.docs[0].ref;

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const now = new Date();
      const expiryDate = new Date(now.setMonth(now.getMonth() + 1));
      await userRef.update({
        subscriptionStatus: 'active',
        subscriptionId: resource.id,
        subscriptionExpiry: expiryDate.toISOString(),
        qrCodesGenerated: 0,
        updatedAt: new Date().toISOString(),
      });
    } else if (eventType === 'BILLING.SUBSCRIPTION.UPDATED') {
      await userRef.update({
        planId: resource.plan_id || admin.firestore.FieldValue.delete(),
        updatedAt: new Date().toISOString(),
      });
    } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
      await userRef.update({
        subscriptionStatus: 'cancelled',
        updatedAt: new Date().toISOString(),
      });
    } else {
      console.info(`Unhandled event: ${eventType}`);
    }

    return { statusCode: 200, body: 'Webhook processed' }; 
    
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Internal server error' };
  }
};