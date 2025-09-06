'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Save } from 'lucide-react';
import { RewardManager, type Reward } from './RewardManager';

export type Tier = {
    id?: number; // Changed from string to number for consistency with database
    name: string;
    points_to_unlock: number;
    rewards: Reward[];
};

interface NewTierFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tier: Tier) => void;
    disabled?: boolean;
}

export function NewTierForm({ isOpen, onClose, onSave, disabled = false }: NewTierFormProps) {
    const [tierData, setTierData] = useState<Tier>({
        name: '',
        points_to_unlock: 100,
        rewards: []
    });

    const handleSave = () => {
        if (!tierData.name || tierData.points_to_unlock < 0) return;
        onSave(tierData);
        handleClose();
    };

    const handleClose = () => {
        setTierData({
            name: '',
            points_to_unlock: 100,
            rewards: []
        });
        onClose();
    };

    const handleRewardsChange = (rewards: Reward[]) => {
        setTierData({ ...tierData, rewards });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold text-white">
                            Create New Tier
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="text-white hover:bg-white/20"
                        >
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                    {/* Tier Basic Info */}
                    <Card className="border border-gray-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800">
                                Tier Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Tier Name</Label>
                                    <Input
                                        value={tierData.name}
                                        onChange={(e) => setTierData({ ...tierData, name: e.target.value })}
                                        disabled={disabled}
                                        placeholder="e.g., Gold Tier"
                                        className="mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Give your tier a memorable name
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Points to Unlock</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={tierData.points_to_unlock}
                                        onChange={(e) => setTierData({ ...tierData, points_to_unlock: Number(e.target.value) })}
                                        disabled={disabled}
                                        placeholder="e.g., 500"
                                        className="mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Customers need this many points to reach this tier
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rewards Management */}
                    <Card className="border border-gray-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800">
                                Configure Rewards
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                Add rewards that customers will receive when they reach this tier
                            </p>
                        </CardHeader>
                        <CardContent>
                            <RewardManager
                                rewards={tierData.rewards}
                                onRewardsChange={handleRewardsChange}
                                mode="add"
                                disabled={disabled}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={disabled}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={disabled || !tierData.name || tierData.points_to_unlock < 0}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Create Tier
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
} 