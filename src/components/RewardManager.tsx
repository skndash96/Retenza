"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit3, Trash2, Plus } from "lucide-react";

export type Reward = {
  id?: number; // Changed from string to number for consistency with database
  reward_type: "cashback" | "limited_usage" | "custom";
  percentage?: number;
  reward_text?: string;
  usage_limit_per_month?: number;
  one_time?: boolean;
  name?: string;
  reward?: string;
};

interface RewardManagerProps {
  rewards: Reward[];
  onRewardsChange: (rewards: Reward[]) => void;
  mode?: "add" | "edit";
  disabled?: boolean;
}

export function RewardManager({
  rewards,
  onRewardsChange,
  disabled = false,
}: RewardManagerProps) {
  const [rewardInput, setRewardInput] = useState<Reward>({
    reward_type: "cashback",
    percentage: 5,
    reward_text: "",
    usage_limit_per_month: 1.0,
    one_time: false,
    name: "",
    reward: "",
  });

  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  const resetRewardInput = () => {
    setRewardInput({
      reward_type: "cashback",
      percentage: 5,
      reward_text: "",
      usage_limit_per_month: 1.0,
      one_time: false,
      name: "",
      reward: "",
    });
  };

  const validateReward = (reward: Reward): boolean => {
    if (reward.reward_type === "cashback") {
      return (
        reward.percentage !== undefined &&
        reward.percentage > 0 &&
        reward.percentage <= 100
      );
    } else if (reward.reward_type === "limited_usage") {
      return !!(
        reward.reward_text &&
        reward.usage_limit_per_month &&
        reward.usage_limit_per_month > 0
      );
    } else if (reward.reward_type === "custom") {
      return !!(reward.name && reward.reward);
    }
    return false;
  };

  const addReward = () => {
    if (!validateReward(rewardInput)) return;

    const newReward: Reward = {
      id: Date.now(),
      ...rewardInput,
      reward_text:
        rewardInput.reward_type === "custom"
          ? `${rewardInput.name}: ${rewardInput.reward}`
          : rewardInput.reward_text,
    };

    onRewardsChange([...rewards, newReward]);
    resetRewardInput();
  };

  const updateReward = () => {
    if (!editingReward || editingIndex === -1 || !validateReward(rewardInput))
      return;

    const updatedRewards = [...rewards];
    updatedRewards[editingIndex] = {
      ...rewardInput,
      id: editingReward.id,
      reward_text:
        rewardInput.reward_type === "custom"
          ? `${rewardInput.name}: ${rewardInput.reward}`
          : rewardInput.reward_text,
    };

    onRewardsChange(updatedRewards);
    setEditingReward(null);
    setEditingIndex(-1);
    resetRewardInput();
  };

  const startEditing = (reward: Reward, index: number) => {
    setEditingReward(reward);
    setEditingIndex(index);
    setRewardInput({ ...reward });
  };

  const cancelEditing = () => {
    setEditingReward(null);
    setEditingIndex(-1);
    resetRewardInput();
  };

  const deleteReward = (index: number) => {
    const updatedRewards = rewards.filter((_, i) => i !== index);
    onRewardsChange(updatedRewards);
  };

  const getRewardDisplayText = (reward: Reward): string => {
    if (reward.reward_type === "cashback") {
      return `${reward.percentage}% cashback`;
    } else if (reward.reward_type === "limited_usage") {
      const monthlyText =
        reward.usage_limit_per_month === 1
          ? "Monthly"
          : reward.usage_limit_per_month === 0.5
            ? "Bi-monthly"
            : `${reward.usage_limit_per_month} times per month`;
      return `${reward.reward_text} (${monthlyText})`;
    } else if (reward.reward_type === "custom") {
      return `${reward.name}: ${reward.reward}`;
    }
    return "Unknown reward type";
  };

  const getRewardTypeColor = (type: string): string => {
    switch (type) {
      case "cashback":
        return "bg-green-100 text-green-800 border-green-200";
      case "limited_usage":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "custom":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Rewards Display */}
      {rewards.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-800">
            Current Rewards
          </h4>
          <div className="grid gap-3">
            {rewards.map((reward, index) => (
              <Card
                key={reward.id ?? index}
                className="border border-gray-200 shadow-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getRewardTypeColor(reward.reward_type)}
                        >
                          {reward.reward_type.replace("_", " ")}
                        </Badge>
                        <span className="font-medium text-gray-900">
                          {getRewardDisplayText(reward)}
                        </span>
                      </div>

                      {reward.reward_type === "limited_usage" &&
                        reward.usage_limit_per_month && (
                          <div className="text-sm text-gray-600">
                            <span>
                              Usage:{" "}
                              {reward.usage_limit_per_month === 1
                                ? "Monthly"
                                : reward.usage_limit_per_month === 0.5
                                  ? "Bi-monthly"
                                  : `${reward.usage_limit_per_month} times per month`}
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(reward, index)}
                        disabled={disabled}
                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteReward(index)}
                        disabled={disabled}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Reward Form */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            {editingReward ? "Edit Reward" : "Add New Reward"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reward Type Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Reward Type
            </Label>
            <select
              value={rewardInput.reward_type}
              onChange={(e) =>
                setRewardInput({
                  ...rewardInput,
                  reward_type: e.target.value as Reward["reward_type"],
                })
              }
              disabled={disabled}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="cashback">Cashback (Percentage)</option>
              <option value="limited_usage">Limited Usage Reward</option>
              <option value="custom">Custom Reward</option>
            </select>
          </div>

          {/* Cashback Reward Fields */}
          {rewardInput.reward_type === "cashback" && (
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Cashback Percentage
              </Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={rewardInput.percentage ?? ""}
                onChange={(e) =>
                  setRewardInput({
                    ...rewardInput,
                    percentage: Number(e.target.value),
                  })
                }
                disabled={disabled}
                placeholder="e.g., 5"
                className="mt-1 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter a percentage between 1-100
              </p>
            </div>
          )}

          {/* Limited Usage Reward Fields */}
          {rewardInput.reward_type === "limited_usage" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Reward Text
                </Label>
                <Input
                  value={rewardInput.reward_text ?? ""}
                  onChange={(e) =>
                    setRewardInput({
                      ...rewardInput,
                      reward_text: e.target.value,
                    })
                  }
                  disabled={disabled}
                  placeholder="e.g., 20% off on next purchase"
                  className="mt-1 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Usage Limit Per Month
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={rewardInput.usage_limit_per_month ?? ""}
                  onChange={(e) =>
                    setRewardInput({
                      ...rewardInput,
                      usage_limit_per_month: Number(e.target.value),
                    })
                  }
                  disabled={disabled || rewardInput.one_time}
                  placeholder="e.g., 2 (twice per month), 0.5 (bi-monthly)"
                  className="mt-1 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {rewardInput.one_time
                    ? "Disabled for one-time rewards"
                    : "2 = twice per month, 0.5 = bi-monthly, 1 = monthly"}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="one-time"
                  checked={rewardInput.one_time ?? false}
                  onChange={(e) =>
                    setRewardInput({
                      ...rewardInput,
                      one_time: e.target.checked,
                    })
                  }
                  disabled={disabled}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label
                  htmlFor="one-time"
                  className="text-sm font-medium text-gray-700"
                >
                  One-time reward only
                </Label>
              </div>
            </div>
          )}

          {/* Custom Reward Fields */}
          {rewardInput.reward_type === "custom" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Reward Name
                </Label>
                <Input
                  value={rewardInput.name ?? ""}
                  onChange={(e) =>
                    setRewardInput({ ...rewardInput, name: e.target.value })
                  }
                  disabled={disabled}
                  placeholder="e.g., VIP Access"
                  className="mt-1 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Reward Description
                </Label>
                <Textarea
                  value={rewardInput.reward ?? ""}
                  onChange={(e) =>
                    setRewardInput({ ...rewardInput, reward: e.target.value })
                  }
                  disabled={disabled}
                  placeholder="e.g., Exclusive access to premium services and priority support"
                  rows={3}
                  className="mt-1 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {editingReward ? (
              <>
                <Button
                  onClick={updateReward}
                  disabled={disabled || !validateReward(rewardInput)}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Update Reward
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={disabled}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={addReward}
                disabled={disabled || !validateReward(rewardInput)}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Reward
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
