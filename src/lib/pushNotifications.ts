export interface PushSubscriptionData {
    endpoint: string;
    p256dh: string;
    auth: string;
}

export interface NotificationData {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
    requireInteraction?: boolean;
    tag?: string;
    renotify?: boolean;
}

export class PushNotificationService {
    private static instance: PushNotificationService;
    private vapidPublicKey: string;

    private constructor() {
        this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
    }

    public static getInstance(): PushNotificationService {
        if (!PushNotificationService.instance) {
            PushNotificationService.instance = new PushNotificationService();
        }
        return PushNotificationService.instance;
    }

    // Get VAPID public key
    getVapidPublicKey(): string {
        return this.vapidPublicKey ?? '';
    }
}

// Notification templates for different types
export const notificationTemplates = {
    pointsEarned: (points: number, businessName: string): NotificationData => ({
        title: '🎉 Points Earned!',
        body: `You've earned ${points} points at ${businessName}! Keep shopping to unlock more rewards.`,
        data: { type: 'points_earned', points, businessName },
        tag: 'points-earned',
        renotify: true,
    }),

    rewardUnlocked: (rewardName: string, businessName: string): NotificationData => ({
        title: '🏆 Reward Unlocked!',
        body: `Congratulations! You've unlocked "${rewardName}" at ${businessName}.`,
        data: { type: 'reward_unlocked', rewardName, businessName },
        tag: 'reward-unlocked',
        renotify: true,
    }),

    goalGradientNudge: (percentage: number, businessName: string): NotificationData => ({
        title: '🎯 Almost There!',
        body: `You're ${percentage}% of the way to your next reward at ${businessName}. Keep going!`,
        data: { type: 'goal_nudge', percentage, businessName },
        tag: 'goal-nudge',
        requireInteraction: true,
    }),

    inactivityWinback: (businessName: string): NotificationData => ({
        title: '💝 We Miss You!',
        body: `Haven't seen you at ${businessName} lately. Come back for exclusive offers!`,
        data: { type: 'inactivity_winback', businessName },
        tag: 'inactivity-winback',
        actions: [
            {
                action: 'view_offers',
                title: 'View Offers',
                icon: '/icon-192.png',
            },
        ],
    }),

    trendingMissions: (missionTitle: string, businessName: string): NotificationData => ({
        title: '🔥 Trending Mission!',
        body: `"${missionTitle}" is trending at ${businessName}. Join the challenge now!`,
        data: { type: 'trending_missions', missionTitle, businessName },
        tag: 'trending-missions',
        renotify: true,
    }),

    personalizedTierRewards: (tierName: string, businessName: string): NotificationData => ({
        title: '⭐ Tier Benefits!',
        body: `As a ${tierName} member at ${businessName}, you have exclusive rewards waiting!`,
        data: { type: 'tier_rewards', tierName, businessName },
        tag: 'tier-rewards',
        requireInteraction: true,
    }),
}; 