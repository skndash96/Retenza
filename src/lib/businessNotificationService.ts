import { ServerPushNotificationService } from './server/pushNotificationService';
import { notificationTemplates } from './pushNotifications';

export class BusinessNotificationService {
    private static instance: BusinessNotificationService;
    private pushService: ServerPushNotificationService;

    private constructor() {
        this.pushService = ServerPushNotificationService.getInstance();
    }

    public static getInstance(): BusinessNotificationService {
        if (!BusinessNotificationService.instance) {
            BusinessNotificationService.instance = new BusinessNotificationService();
        }
        return BusinessNotificationService.instance;
    }

    // Send points earned notification to a specific customer
    async sendPointsEarnedNotification(
        customerId: number,
        businessId: number,
        points: number,
        businessName: string
    ): Promise<void> {
        const notification = notificationTemplates.pointsEarned(points, businessName);
        await this.pushService.sendNotificationToCustomer(customerId, businessId, notification);
    }

    // Send reward unlocked notification to a specific customer
    async sendRewardUnlockedNotification(
        customerId: number,
        businessId: number,
        rewardName: string,
        businessName: string
    ): Promise<void> {
        const notification = notificationTemplates.rewardUnlocked(rewardName, businessName);
        await this.pushService.sendNotificationToCustomer(customerId, businessId, notification);
    }

    // Send goal gradient nudge notification to a specific customer
    async sendGoalGradientNudgeNotification(
        customerId: number,
        businessId: number,
        percentage: number,
        businessName: string
    ): Promise<void> {
        const notification = notificationTemplates.goalGradientNudge(percentage, businessName);
        await this.pushService.sendNotificationToCustomer(customerId, businessId, notification);
    }

    // Send inactivity winback notification to a specific customer
    async sendInactivityWinbackNotification(
        customerId: number,
        businessId: number,
        businessName: string
    ): Promise<void> {
        const notification = notificationTemplates.inactivityWinback(businessName);
        await this.pushService.sendNotificationToCustomer(customerId, businessId, notification);
    }

    // Send trending missions notification to all customers of a business
    async sendTrendingMissionsNotification(
        businessId: number,
        missionTitle: string,
        businessName: string
    ): Promise<void> {
        const notification = notificationTemplates.trendingMissions(missionTitle, businessName);
        await this.pushService.sendNotificationToBusiness(businessId, notification);
    }

    // Send personalized tier rewards notification to customers of a specific tier
    async sendPersonalizedTierRewardsNotification(
        businessId: number,
        tierName: string,
        businessName: string,
        customerIds?: number[]
    ): Promise<void> {
        const notification = notificationTemplates.personalizedTierRewards(tierName, businessName);

        if (customerIds && customerIds.length > 0) {
            // Send to specific customers
            for (const customerId of customerIds) {
                await this.pushService.sendNotificationToCustomer(customerId, businessId, notification);
            }
        } else {
            // Send to all customers of the business
            await this.pushService.sendNotificationToBusiness(businessId, notification);
        }
    }

    // Send custom notification to a specific customer
    async sendCustomNotification(
        customerId: number,
        businessId: number,
        title: string,
        body: string,
        data?: Record<string, any>
    ): Promise<void> {
        const notification = {
            title,
            body,
            data: data ?? {},
            tag: 'custom',
            renotify: true,
        };
        await this.pushService.sendNotificationToCustomer(customerId, businessId, notification);
    }

    // Send custom notification to all customers of a business
    async sendCustomBusinessNotification(
        businessId: number,
        title: string,
        body: string,
        data?: Record<string, any>
    ): Promise<void> {
        const notification = {
            title,
            body,
            data: data ?? {},
            tag: 'custom-business',
            renotify: true,
        };
        await this.pushService.sendNotificationToBusiness(businessId, notification);
    }

    // Send promotional notification to all customers
    async sendPromotionalNotification(
        businessId: number,
        title: string,
        body: string,
        data?: Record<string, any>
    ): Promise<void> {
        const notification = {
            title,
            body,
            data: { ...data, type: 'promotional' },
            tag: 'promotional',
            renotify: false,
        };
        await this.pushService.sendNotificationToBusiness(businessId, notification);
    }

    // Send urgent notification to all customers
    async sendUrgentNotification(
        businessId: number,
        title: string,
        body: string,
        data?: Record<string, any>
    ): Promise<void> {
        const notification = {
            title,
            body,
            data: { ...data, type: 'urgent' },
            tag: 'urgent',
            requireInteraction: true,
            renotify: true,
        };
        await this.pushService.sendNotificationToBusiness(businessId, notification);
    }
} 