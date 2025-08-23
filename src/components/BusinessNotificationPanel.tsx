import React, { useState } from 'react';
import { Send, Bell, Target, Users, Gift, TrendingUp, Star, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface BusinessNotificationPanelProps {
    businessId: number;
    businessName: string;
}

export const BusinessNotificationPanel: React.FC<BusinessNotificationPanelProps> = ({
    businessId,
    businessName,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('');
    const [customTitle, setCustomTitle] = useState('');
    const [customBody, setCustomBody] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const notificationTypes = [
        { id: 'points_earned', name: 'Points Earned', description: 'Notify when customers earn points', icon: Gift, color: 'bg-green-100 text-green-800' },
        { id: 'reward_unlocked', name: 'Reward Unlocked', description: 'Celebrate when customers unlock rewards', icon: Star, color: 'bg-yellow-100 text-yellow-800' },
        { id: 'goal_nudge', name: 'Goal Gradient Nudge', description: 'Encourage progress towards next reward', icon: Target, color: 'bg-blue-100 text-blue-800' },
        { id: 'inactivity_winback', name: 'Inactivity Win-Back', description: 'Re-engage inactive customers', icon: Users, color: 'bg-purple-100 text-purple-800' },
        { id: 'trending_missions', name: 'Trending Missions', description: 'Highlight popular challenges', icon: TrendingUp, color: 'bg-orange-100 text-orange-800' },
        { id: 'tier_rewards', name: 'Tier Rewards', description: 'Announce exclusive tier benefits', icon: Star, color: 'bg-indigo-100 text-indigo-800' },
        { id: 'custom', name: 'Custom Notification', description: 'Send personalized messages', icon: Bell, color: 'bg-gray-100 text-gray-800' },
        { id: 'promotional', name: 'Promotional', description: 'Share special offers and deals', icon: Gift, color: 'bg-pink-100 text-pink-800' },
        { id: 'urgent', name: 'Urgent', description: 'Send important announcements', icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
    ];

    const handleSendNotification = async () => {
        if (!selectedType) return;

        setIsLoading(true);
        setMessage(null);

        try {
            switch (selectedType) {
                case 'points_earned':
                    setMessage({ type: 'success', text: 'Points earned notifications are sent automatically' });
                    break;
                case 'reward_unlocked':
                    setMessage({ type: 'success', text: 'Reward unlocked notifications are sent automatically' });
                    break;
                case 'goal_nudge':
                    setMessage({ type: 'success', text: 'Goal nudge notifications are sent automatically' });
                    break;
                case 'inactivity_winback':
                    setMessage({ type: 'success', text: 'Inactivity winback notifications are sent automatically' });
                    break;
                case 'trending_missions': {
                    const res = await fetch('/api/business/notifications/trending-missions', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ businessId, missionTitle: 'New Challenge Available', businessName }),
                    });
                    if (!res.ok) throw new Error('Failed to send trending missions notification');
                    setMessage({ type: 'success', text: 'Trending missions notification sent successfully!' });
                    break;
                }
                case 'tier_rewards': {
                    const res = await fetch('/api/business/notifications/tier-rewards', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ businessId, tierName: 'Gold Member', businessName }),
                    });
                    if (!res.ok) throw new Error('Failed to send tier rewards notification');
                    setMessage({ type: 'success', text: 'Tier rewards notification sent successfully!' });
                    break;
                }
                case 'custom': {
                    if (!customTitle || !customBody) { setMessage({ type: 'error', text: 'Please fill in both title and body for custom notifications' }); return; }
                    const res = await fetch('/api/business/notifications/custom', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ businessId, title: customTitle, body: customBody }),
                    });
                    if (!res.ok) throw new Error('Failed to send custom notification');
                    setMessage({ type: 'success', text: 'Custom notification sent successfully!' });
                    setCustomTitle(''); setCustomBody('');
                    break;
                }
                case 'promotional': {
                    if (!customTitle || !customBody) { setMessage({ type: 'error', text: 'Please fill in both title and body for promotional notifications' }); return; }
                    const res = await fetch('/api/business/notifications/promotional', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ businessId, title: customTitle, body: customBody }),
                    });
                    if (!res.ok) throw new Error('Failed to send promotional notification');
                    setMessage({ type: 'success', text: 'Promotional notification sent successfully!' });
                    setCustomTitle(''); setCustomBody('');
                    break;
                }
                case 'urgent': {
                    if (!customTitle || !customBody) { setMessage({ type: 'error', text: 'Please fill in both title and body for urgent notifications' }); return; }
                    const res = await fetch('/api/business/notifications/urgent', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ businessId, title: customTitle, body: customBody }),
                    });
                    if (!res.ok) throw new Error('Failed to send urgent notification');
                    setMessage({ type: 'success', text: 'Urgent notification sent successfully!' });
                    setCustomTitle(''); setCustomBody('');
                    break;
                }
                default:
                    setMessage({ type: 'error', text: 'Unknown notification type' });
            }
        } catch (e) {
            console.error('Error sending notification:', e);
            setMessage({ type: 'error', text: 'Failed to send notification. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedType('');
        setCustomTitle('');
        setCustomBody('');
        setMessage(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Bell className="h-4 w-4" />
                    Send Notifications
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Send Notifications to Customers
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-scroll">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {notificationTypes.map((type) => (
                            <Card key={type.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedType === type.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedType(type.id)}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Badge className={type.color}>
                                            <type.icon className="h-3 w-3 mr-1" />
                                            {type.name}
                                        </Badge>
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground">{type.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {selectedType && (
                        <div className="space-y-4">
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="font-medium">Notification Details</h3>
                                {(selectedType === 'custom' || selectedType === 'promotional' || selectedType === 'urgent') && (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium">Title</label>
                                            <Input placeholder="Enter notification title..." value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Message</label>
                                            <Textarea placeholder="Enter notification message..." value={customBody} onChange={(e) => setCustomBody(e.target.value)} rows={3} />
                                        </div>
                                    </>
                                )}
                                {message && (
                                    <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                        {message.text}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Button onClick={handleSendNotification} disabled={isLoading} className="flex-1">
                                        {isLoading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Sending...</>) : (<><Send className="h-4 w-4 mr-2" />Send Notification</>)}
                                    </Button>
                                    <Button variant="outline" onClick={resetForm} disabled={isLoading}>Reset</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}; 