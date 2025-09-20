'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, X, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { RewardManager } from './RewardManager';
import { Tier } from '@/server/db/schema';

interface TierManagerProps {
    tier: Tier;
    onTierChange: (tier: Tier) => void;
    onDelete: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    disabled?: boolean;
}

export function TierManager({
    tier,
    onTierChange,
    onDelete,
    onMoveUp,
    onMoveDown,
    canMoveUp = false,
    canMoveDown = false,
    disabled = false
}: TierManagerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Tier>({ ...tier });

    const handleSave = () => {
        onTierChange(editData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditData({ ...tier });
        setIsEditing(false);
    };

    const handleRewardsChange = (rewards: Tier['rewards']) => {
        setEditData({ ...editData, rewards });
    };

    const getTierColor = (points: number): string => {
        if (points <= 100) return 'bg-bronze-100 text-bronze-800 border-bronze-200';
        if (points <= 500) return 'bg-silver-100 text-silver-800 border-silver-200';
        if (points <= 1000) return 'bg-gold-100 text-gold-800 border-gold-200';
        return 'bg-platinum-100 text-platinum-800 border-platinum-200';
    };

    const getTierName = (points: number): string => {
        if (points <= 100) return 'Bronze';
        if (points <= 500) return 'Silver';
        if (points <= 1000) return 'Gold';
        return 'Platinum';
    };

    if (isEditing) {
        return (
            <Card className="border-2 border-indigo-300 shadow-lg">
                <CardHeader className="bg-indigo-50 border-b border-indigo-200">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold text-indigo-900">
                            Edit Tier: {tier.name}
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={disabled || !editData.name || editData.points_to_unlock < 0}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={disabled}
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* Tier Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Tier Name</Label>
                            <Input
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                disabled={disabled}
                                placeholder="e.g., Gold Tier"
                                className="mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Points to Unlock</Label>
                            <Input
                                type="number"
                                min="1"
                                value={editData.points_to_unlock}
                                onChange={(e) => setEditData({ ...editData, points_to_unlock: Number(e.target.value) })}
                                disabled={disabled}
                                placeholder="e.g., 500"
                                className="mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Customers need this many points to reach this tier
                            </p>
                        </div>
                    </div>

                    {/* Rewards Management */}
                    <div className="border-t pt-6">
                        <RewardManager
                            rewards={editData.rewards}
                            onRewardsChange={handleRewardsChange}
                            mode="edit"
                            disabled={disabled}
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <CardTitle className="text-xl font-bold text-gray-900">
                                {tier.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className={getTierColor(tier.points_to_unlock)}>
                                    {getTierName(tier.points_to_unlock)}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                    {tier.points_to_unlock} points to unlock
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Move Up/Down Buttons */}
                        {onMoveUp && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onMoveUp}
                                disabled={disabled || !canMoveUp}
                                className="text-gray-600 border-gray-300 hover:bg-gray-50"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </Button>
                        )}
                        {onMoveDown && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onMoveDown}
                                disabled={disabled || !canMoveDown}
                                className="text-gray-600 border-gray-300 hover:bg-gray-50"
                            >
                                <ArrowDown className="w-4 h-4" />
                            </Button>
                        )}

                        {/* Edit Button */}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                            disabled={disabled}
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                        </Button>

                        {/* Delete Button */}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onDelete}
                            disabled={disabled}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Rewards Summary */}
                <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-800">Rewards ({tier.rewards.length})</h4>
                    {tier.rewards.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                            <p>No rewards configured for this tier</p>
                            <p className="text-sm">Click Edit to add rewards</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {tier.rewards.map((reward, index) => (
                                <div key={reward.id ?? index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <Badge className={getRewardTypeColor(reward.reward_type)}>
                                            {reward.reward_type.replace('_', ' ')}
                                        </Badge>
                                        <span className="font-medium text-gray-900">
                                            {getRewardDisplayText(reward)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Helper functions
function getRewardDisplayText(reward: Tier['rewards'][number]): string {
    if (reward.reward_type === 'cashback') {
        return `${reward.percentage}% cashback`;
    } else if (reward.reward_type === 'limited_usage') {
        const monthlyText = reward.usage_limit_per_month === 1 ? 'Monthly' : reward.usage_limit_per_month === 0.5 ? 'Bi-monthly' : `${reward.usage_limit_per_month} times per month`;
        return `${reward.reward_text} (${monthlyText}, ${reward.one_time ? 'One-time' : 'Multiple'})`;
    } else if (reward.reward_type === 'custom') {
        return `${reward.name}: ${reward.reward}`;
    }
    return 'Unknown reward type';
}

function getRewardTypeColor(type: string): string {
    switch (type) {
        case 'cashback': return 'bg-green-100 text-green-800 border-green-200';
        case 'limited_usage': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'custom': return 'bg-purple-100 text-purple-800 border-purple-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
} 