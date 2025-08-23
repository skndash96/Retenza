import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface NotificationBellProps {
    businessId: number;
    businessName: string;
}

interface Notification {
    id: number;
    title: string;
    body: string;
    type: string;
    is_read: boolean;
    sent_at: string;
    data: Record<string, unknown>;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
    businessId,
    businessName,
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const {
        isSupported,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe,
    } = usePushNotifications({ businessId, businessName });

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch(`/api/push/notifications?businessId=${businessId}&limit=20`);
            if (response.ok) {
                const data = (await response.json()) as { notifications: Notification[] };
                const list = data.notifications ?? [];
                setNotifications(list);
                setUnreadCount(list.filter((n) => !n.is_read).length);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    }, [businessId]);

    // Fetch notifications
    useEffect(() => {
        if (isSubscribed) {
            void fetchNotifications();
        }
    }, [isSubscribed, businessId, fetchNotifications]);

    const markAsRead = async (notificationId: number) => {
        try {
            const response = await fetch('/api/push/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId }),
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notificationId ? { ...n, is_read: true } : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleSubscribe = async () => {
        await subscribe();
        if (isSubscribed) {
            void fetchNotifications();
        }
    };

    const handleUnsubscribe = async () => {
        await unsubscribe();
        setNotifications([]);
        setUnreadCount(0);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'points_earned':
                return '🎉';
            case 'reward_unlocked':
                return '🏆';
            case 'goal_nudge':
                return '🎯';
            case 'inactivity_winback':
                return '💝';
            case 'trending_missions':
                return '🔥';
            case 'tier_rewards':
                return '⭐';
            default:
                return '🔔';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    if (!isSupported) {
        return null;
    }

    return (
        <div className="relative">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                        onClick={() => setIsOpen(true)}
                    >
                        {isSubscribed ? (
                            <>
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
                                    >
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Badge>
                                )}
                            </>
                        ) : (
                            <BellOff className="h-5 w-5" />
                        )}
                    </Button>
                </DialogTrigger>

                <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden">
                        {!isSubscribed ? (
                            <div className="text-center py-8">
                                <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Enable Notifications</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Get notified about points, rewards, and exclusive offers from {businessName}
                                </p>
                                <Button
                                    onClick={handleSubscribe}
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? 'Enabling...' : 'Enable Notifications'}
                                </Button>
                                {error && (
                                    <p className="text-sm text-destructive mt-2">{error}</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleUnsubscribe}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Disabling...' : 'Disable'}
                                    </Button>
                                </div>

                                <Separator />

                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Bell className="h-8 w-8 mx-auto mb-2" />
                                            <p>No notifications yet</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-3 rounded-lg border ${notification.is_read
                                                    ? 'bg-muted/50 border-muted'
                                                    : 'bg-background border-border'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="text-lg">
                                                        {getNotificationIcon(notification.type)}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-sm mb-1">
                                                            {notification.title}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            {notification.body}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDate(notification.sent_at)}
                                                            </span>
                                                            {!notification.is_read && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => void markAsRead(notification.id)}
                                                                    className="h-6 px-2 text-xs"
                                                                >
                                                                    Mark as read
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}; 