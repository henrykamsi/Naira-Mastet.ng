// ============================================================
// NAIRAMASTER.NG - SERVICE WORKER v6.0
// Complete Push Notification System
// ============================================================

const CACHE_NAME = 'nairamaster-v6';
const APP_NAME = 'NairaMaster.ng';
const ICON_URL = 'https://cdn.phototourl.com/free/2026-07-18-edf62e79-cb03-48b6-a74a-345e7ea2db36.jpg';

// ─── INSTALL EVENT ────────────────────────────────────────────
self.addEventListener('install', (event) => {
    console.log('📦 Service Worker installing...');
    
    // Skip waiting to activate immediately
    self.skipWaiting();
    
    // Cache essential files
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 Caching app shell...');
            return cache.addAll([
                '/',
                '/index.html',
                '/manifest.json',
                ICON_URL
            ]);
        })
    );
});

// ─── ACTIVATE EVENT ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
    console.log('⚡ Service Worker activating...');
    
    // Claim clients immediately
    event.waitUntil(clients.claim());
    
    // Clean old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// ─── FETCH EVENT ──────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// ─── PUSH NOTIFICATION ──────────────────────────────────────
self.addEventListener('push', (event) => {
    console.log('📨 Push notification received:', event);
    
    let data = {
        title: APP_NAME,
        body: 'You have a new notification!',
        icon: ICON_URL,
        badge: ICON_URL,
        tag: 'notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
            {
                action: 'open',
                title: '📱 Open APP',
                icon: ICON_URL
            },
            {
                action: 'dismiss',
                title: '❌ Dismiss',
                icon: ICON_URL
            }
        ]
    };

    // Parse push data
    if (event.data) {
        try {
            const parsedData = event.data.json();
            data.title = parsedData.title || data.title;
            data.body = parsedData.body || data.body;
            data.tag = parsedData.tag || data.tag;
            data.icon = parsedData.icon || data.icon;
            data.badge = parsedData.badge || data.badge;
            data.requireInteraction = parsedData.requireInteraction !== undefined ? parsedData.requireInteraction : true;
            data.vibrate = parsedData.vibrate || [200, 100, 200];
            data.actions = parsedData.actions || data.actions;
            data.data = parsedData.data || {};
            data.url = parsedData.url || '/';
        } catch (e) {
            // If not JSON, use as body text
            data.body = event.data.text();
        }
    }

    // Show notification
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: data.badge,
            tag: data.tag,
            requireInteraction: data.requireInteraction,
            vibrate: data.vibrate,
            actions: data.actions,
            data: data.data,
            renotify: true,
            silent: false
        })
    );
});

// ─── NOTIFICATION CLICK ──────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked:', event);
    
    const notification = event.notification;
    const action = event.action;
    const data = notification.data || {};

    // Close the notification
    notification.close();

    // Handle actions
    if (action === 'dismiss') {
        // Just close the notification
        return;
    }

    if (action === 'open' || !action) {
        // Open the APP
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Check if there's already a window/tab open
                    for (const client of clientList) {
                        if (client.url.includes('/') && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // If no window is open, open a new one
                    if (clients.openWindow) {
                        const url = data.url || '/';
                        return clients.openWindow(url);
                    }
                })
        );
    }

    // Handle custom actions from notification data
    if (data.action === 'navigate' && data.url) {
        event.waitUntil(
            clients.openWindow(data.url)
        );
    }

    if (data.action === 'sendTelegram' && data.message) {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    for (const client of clientList) {
                        client.postMessage({
                            type: 'TELEGRAM',
                            message: data.message
                        });
                    }
                })
        );
    }
});

// ─── MESSAGE FROM MAIN APP ──────────────────────────────────
self.addEventListener('message', (event) => {
    console.log('📨 Message from main app:', event.data);
    
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const data = event.data.payload || {};
        self.registration.showNotification(data.title || APP_NAME, {
            body: data.body || 'You have a new notification!',
            icon: data.icon || ICON_URL,
            badge: data.badge || ICON_URL,
            tag: data.tag || 'notification',
            requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
            vibrate: data.vibrate || [200, 100, 200],
            actions: data.actions || [
                {
                    action: 'open',
                    title: '📱 Open APP',
                    icon: ICON_URL
                }
            ],
            data: data.data || {}
        });
    }

    if (event.data && event.data.type === 'SHOW_WELCOME') {
        self.registration.showNotification('🎉 Welcome to NairaMaster.ng!', {
            body: 'Proceed in performing tasks and start earning! 🚀',
            icon: ICON_URL,
            badge: ICON_URL,
            tag: 'welcome',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            actions: [
                {
                    action: 'open',
                    title: '📱 Start Earning',
                    icon: ICON_URL
                }
            ]
        });
    }

    if (event.data && event.data.type === 'TASK_APPROVED') {
        const data = event.data.payload || {};
        self.registration.showNotification('✅ Task Approved!', {
            body: `Your task has been approved! ${data.amount || '₦30'} added to your wallet! 💰`,
            icon: ICON_URL,
            badge: ICON_URL,
            tag: 'task_approved',
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 300],
            actions: [
                {
                    action: 'open',
                    title: '📱 View Balance',
                    icon: ICON_URL
                }
            ],
            data: {
                url: '/'
            }
        });
    }

    if (event.data && event.data.type === 'TASK_DECLINED') {
        const data = event.data.payload || {};
        self.registration.showNotification('❌ Task Declined', {
            body: `Your task submission was declined. ${data.reason || 'Please try again.'}`,
            icon: ICON_URL,
            badge: ICON_URL,
            tag: 'task_declined',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            actions: [
                {
                    action: 'open',
                    title: '📱 View Details',
                    icon: ICON_URL
                }
            ],
            data: {
                url: '/?tab=submissions'
            }
        });
    }

    if (event.data && event.data.type === 'WITHDRAWAL_APPROVED') {
        const data = event.data.payload || {};
        self.registration.showNotification('✅ Withdrawal Approved!', {
            body: `Your withdrawal of ${data.amount || '₦0'} has been approved! 💰`,
            icon: ICON_URL,
            badge: ICON_URL,
            tag: 'withdrawal_approved',
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 300],
            actions: [
                {
                    action: 'open',
                    title: '📱 View Balance',
                    icon: ICON_URL
                }
            ],
            data: {
                url: '/'
            }
        });
    }

    if (event.data && event.data.type === 'WITHDRAWAL_DECLINED') {
        const data = event.data.payload || {};
        self.registration.showNotification('❌ Withdrawal Declined', {
            body: `Your withdrawal was declined. ${data.reason || 'Please contact support.'}`,
            icon: ICON_URL,
            badge: ICON_URL,
            tag: 'withdrawal_declined',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            actions: [
                {
                    action: 'open',
                    title: '📱 Contact Support',
                    icon: ICON_URL
                }
            ],
            data: {
                url: '/?tab=settings'
            }
        });
    }

    if (event.data && event.data.type === 'NEW_TASK') {
        const data = event.data.payload || {};
        self.registration.showNotification('📋 New Task Available!', {
            body: `${data.title || 'A new task'} is available! Earn ${data.reward || '₦30'} now! 💰`,
            icon: ICON_URL,
            badge: ICON_URL,
            tag: 'new_task',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            actions: [
                {
                    action: 'open',
                    title: '📱 View Task',
                    icon: ICON_URL
                }
            ],
            data: {
                url: '/?tab=tasks'
            }
        });
    }

    if (event.data && event.data.type === 'REWARD_AVAILABLE') {
        const data = event.data.payload || {};
        self.registration.showNotification('🎁 Reward Available!', {
            body: `Claim your ${data.amount || '₦200'} reward before it's gone! 🎉`,
            icon: ICON_URL,
            badge: ICON_URL,
            tag: 'reward_available',
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 300],
            actions: [
                {
                    action: 'open',
                    title: '🎯 Claim Now',
                    icon: ICON_URL
                }
            ],
            data: {
                url: '/?tab=rewards'
            }
        });
    }

    if (event.data && event.data.type === 'DAILY_REWARD') {
        self.registration.showNotification('🎉 Daily Reward!', {
            body: 'You earned ₦100 for completing tasks today! Keep it up! 💪',
            icon: ICON_URL,
            badge: ICON_URL,
            tag: 'daily_reward',
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 300],
            actions: [
                {
                    action: 'open',
                    title: '📱 Keep Going!',
                    icon: ICON_URL
                }
            ],
            data: {
                url: '/'
            }
        });
    }

    if (event.data && event.data.type === 'SCORE_PENALTY') {
        const data = event.data.payload || {};
        self.registration.showNotification('⚠️ Score Penalty', {
            body: `${data.message || 'Your score has been reduced. Please improve your performance.'}`,
            icon: ICON_URL,
            badge: ICON_URL,
            tag: 'score_penalty',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            actions: [
                {
                    action: 'open',
                    title: '📱 View Score',
                    icon: ICON_URL
                }
            ],
            data: {
                url: '/'
            }
        });
    }

    if (event.data && event.data.type === 'FIRST_PAYMENT_CONFIRMED') {
        self.registration.showNotification('💳 First Payment Confirmed!', {
            body: 'Your first payment has been confirmed. You can now withdraw and create tasks! 🚀',
            icon: ICON_URL,
            badge: ICON_URL,
            tag: 'first_payment',
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 300],
            actions: [
                {
                    action: 'open',
                    title: '📱 Start Earning',
                    icon: ICON_URL
                }
            ],
            data: {
                url: '/'
            }
        });
    }

    if (event.data && event.data.type === 'APP_REOPEN') {
        self.registration.showNotification('🔔 APP is Now Open!', {
            body: 'NairaMaster.ng is back online! Return to start earning! 🚀',
            icon: ICON_URL,
            badge: ICON_URL,
            tag: 'app_reopen',
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 300],
            actions: [
                {
                    action: 'open',
                    title: '📱 Open APP',
                    icon: ICON_URL
                }
            ],
            data: {
                url: '/'
            }
        });
    }
});

// ─── SYNC EVENT (Background Sync) ──────────────────────────
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'sync-notifications') {
        event.waitUntil(
            self.registration.showNotification('📨 NairaMaster.ng', {
                body: 'You have pending notifications. Open the APP to view them.',
                icon: ICON_URL,
                badge: ICON_URL,
                tag: 'sync-notification',
                requireInteraction: true,
                actions: [
                    {
                        action: 'open',
                        title: '📱 Open APP',
                        icon: ICON_URL
                    }
                ],
                data: {
                    url: '/'
                }
            })
        );
    }

    if (event.tag === 'sync-tasks') {
        event.waitUntil(
            self.registration.showNotification('📋 Task Update Available!', {
                body: 'New tasks are available. Check them out now! 💰',
                icon: ICON_URL,
                badge: ICON_URL,
                tag: 'sync-tasks',
                requireInteraction: true,
                actions: [
                    {
                        action: 'open',
                        title: '📱 View Tasks',
                        icon: ICON_URL
                    }
                ],
                data: {
                    url: '/?tab=tasks'
                }
            })
        );
    }
});

// ─── PERIODIC SYNC (Daily/Midnight) ────────────────────────
self.addEventListener('periodicsync', (event) => {
    console.log('🔄 Periodic sync:', event.tag);
    
    if (event.tag === 'daily-midnight') {
        event.waitUntil(
            self.registration.showNotification('🌅 Rise and Shine!', {
                body: 'New day, new tasks! Start earning on NairaMaster.ng today! 💰',
                icon: ICON_URL,
                badge: ICON_URL,
                tag: 'midnight-notification',
                requireInteraction: true,
                vibrate: [200, 100, 200, 100, 300],
                actions: [
                    {
                        action: 'open',
                        title: '📱 Start Earning',
                        icon: ICON_URL
                    }
                ],
                data: {
                    url: '/'
                }
            })
        );
    }

    if (event.tag === 'weekly-summary') {
        event.waitUntil(
            self.registration.showNotification('📊 Weekly Summary', {
                body: 'Check your earnings this week on NairaMaster.ng! 💰',
                icon: ICON_URL,
                badge: ICON_URL,
                tag: 'weekly-summary',
                requireInteraction: true,
                vibrate: [200, 100, 200],
                actions: [
                    {
                        action: 'open',
                        title: '📱 View Report',
                        icon: ICON_URL
                    }
                ],
                data: {
                    url: '/'
                }
            })
        );
    }
});

// ─── NOTIFICATION CLOSE EVENT ──────────────────────────────
self.addEventListener('notificationclose', (event) => {
    console.log('🔔 Notification closed:', event.notification.tag);
});

// ─── ERROR HANDLING ──────────────────────────────────────────
self.addEventListener('error', (event) => {
    console.error('❌ Service Worker error:', event.error);
});

// ─── UNHANDLED REJECTION ──────────────────────────────────
self.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Service Worker unhandled rejection:', event.reason);
});

console.log('✅ Service Worker initialized successfully!');
console.log('📋 Features:');
console.log('  - Push Notifications');
console.log('  - Background Sync');
console.log('  - Daily Midnight Notifications');
console.log('  - Inactivity Reminders');
console.log('  - App Reopen Notifications');
console.log('  - Task Approval Notifications');
console.log('  - Withdrawal Notifications');
console.log('  - Reward Notifications');
console.log('  - Score Penalty Notifications');