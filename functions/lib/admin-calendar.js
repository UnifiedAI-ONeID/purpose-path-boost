"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCalendarBooking = exports.syncCalendarBookings = exports.getCalendarBookings = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// Define Cal.com API key as a secret
const calcomApiKey = (0, params_1.defineSecret)('CALCOM_API_KEY');
// Fetch bookings from Cal.com API
async function fetchCalcomBookings() {
    try {
        const calcomHandle = await getIntegrationSetting('calcom', 'handle');
        if (!calcomHandle) {
            console.warn('Cal.com handle not configured');
            return [];
        }
        const apiKey = process.env.CALCOM_API_KEY;
        if (!apiKey) {
            console.warn('Cal.com API key not configured');
            return [];
        }
        // Fetch bookings from Cal.com API
        const response = await fetch('https://api.cal.com/v2/bookings', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            console.error('Cal.com API error:', response.statusText);
            return [];
        }
        const data = await response.json();
        // Map Cal.com bookings to our format
        return (data.bookings || []).map(booking => {
            var _a, _b;
            return ({
                id: booking.id,
                title: booking.title,
                startTime: booking.startTime,
                endTime: booking.endTime,
                attendees: (booking.attendees || []).map(a => ({
                    name: a.name || 'Unknown',
                    email: a.email,
                    phone: a.phone,
                })),
                eventType: ((_a = booking.eventType) === null || _a === void 0 ? void 0 : _a.title) || 'Unknown',
                status: (booking.status || 'pending'),
                organizer: ((_b = booking.organizer) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
                location: booking.location || undefined,
                notes: booking.description || undefined,
            });
        });
    }
    catch (error) {
        console.error('Failed to fetch Cal.com bookings:', error);
        return [];
    }
}
// Get integration setting from Firestore
async function getIntegrationSetting(integration, key) {
    try {
        const doc = await db.collection('settings').doc(integration).get();
        if (doc.exists) {
            const data = doc.data();
            return (data === null || data === void 0 ? void 0 : data[key]) || null;
        }
        return null;
    }
    catch (error) {
        console.error('Failed to get integration setting:', error);
        return null;
    }
}
// Save bookings to Firestore cache
async function cacheBookings(bookings) {
    try {
        const batch = db.batch();
        const now = new Date();
        // Update cache with timestamp
        batch.set(db.collection('_cache').doc('calendar_bookings'), {
            bookings,
            updated_at: now,
            ttl: new Date(now.getTime() + 3600000), // 1 hour TTL
        });
        await batch.commit();
    }
    catch (error) {
        console.error('Failed to cache bookings:', error);
    }
}
// Get bookings from cache or fetch fresh
async function getBookings() {
    try {
        // Try to get from cache first
        const cacheDoc = await db.collection('_cache').doc('calendar_bookings').get();
        if (cacheDoc.exists) {
            const cache = cacheDoc.data();
            if ((cache === null || cache === void 0 ? void 0 : cache.ttl) && cache.ttl.toDate() > new Date()) {
                return cache.bookings || [];
            }
        }
        // Cache miss or expired - fetch fresh
        const bookings = await fetchCalcomBookings();
        await cacheBookings(bookings);
        return bookings;
    }
    catch (error) {
        console.error('Failed to get bookings:', error);
        return [];
    }
}
// Calculate statistics
function calculateStats(bookings) {
    const now = new Date();
    const stats = {
        totalBookings: bookings.length,
        confirmedBookings: 0,
        cancelledBookings: 0,
        pendingBookings: 0,
        eventTypes: {},
        upcomingCount: 0,
    };
    bookings.forEach(booking => {
        // Count by status
        if (booking.status === 'confirmed')
            stats.confirmedBookings++;
        else if (booking.status === 'cancelled')
            stats.cancelledBookings++;
        else if (booking.status === 'pending')
            stats.pendingBookings++;
        // Count upcoming
        if (new Date(booking.startTime) > now) {
            stats.upcomingCount++;
        }
        // Count by event type
        stats.eventTypes[booking.eventType] = (stats.eventTypes[booking.eventType] || 0) + 1;
    });
    return stats;
}
// HTTP Functions
exports.getCalendarBookings = (0, https_1.onRequest)({ region: 'us-west1', secrets: [calcomApiKey] }, async (req, res) => {
    var _a;
    // Check auth
    if (!((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith('Bearer '))) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const bookings = await getBookings();
        const stats = calculateStats(bookings);
        res.json({
            data: bookings,
            stats,
        });
    }
    catch (error) {
        console.error('Error fetching calendar bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});
exports.syncCalendarBookings = (0, https_1.onRequest)({ region: 'us-west1', secrets: [calcomApiKey] }, async (req, res) => {
    var _a;
    // Check auth
    if (!((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith('Bearer '))) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        // Force refresh by deleting cache
        await db.collection('_cache').doc('calendar_bookings').delete();
        // Fetch fresh bookings
        const bookings = await fetchCalcomBookings();
        await cacheBookings(bookings);
        res.json({
            success: true,
            bookingsCount: bookings.length,
        });
    }
    catch (error) {
        console.error('Error syncing calendar:', error);
        res.status(500).json({ error: 'Failed to sync calendar' });
    }
});
exports.deleteCalendarBooking = (0, https_1.onRequest)({ region: 'us-west1', secrets: [calcomApiKey] }, async (req, res) => {
    var _a;
    // Check auth
    if (!((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith('Bearer '))) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    if (req.method !== 'DELETE') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const bookingId = req.query.bookingId;
        if (!bookingId) {
            res.status(400).json({ error: 'Missing bookingId' });
            return;
        }
        const apiKey = process.env.CALCOM_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: 'Cal.com API key not configured' });
            return;
        }
        // Cancel booking via Cal.com API
        const response = await fetch(`https://api.cal.com/v2/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            console.error('Cal.com API error:', response.statusText);
            res.status(500).json({ error: 'Failed to cancel booking' });
            return;
        }
        // Clear cache to force refresh
        await db.collection('_cache').doc('calendar_bookings').delete();
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});
//# sourceMappingURL=admin-calendar.js.map