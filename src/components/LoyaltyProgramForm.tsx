'use client';

import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import type { FieldErrors, UseFormRegister, Control, UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


const cashbackRewardSchema = z.object({
  reward_type: z.literal('cashback'),
  percentage: z.number().int().positive('Percentage must be a positive number.').max(100, 'Cashback cannot exceed 100%.'),
});

const limitedUsageRewardSchema = z.object({
  reward_type: z.literal('limited_usage'),
  reward_text: z.string().min(1, 'Reward description is required.'),
  usage_limit_per_month: z.number().positive('Usage limit per month must be a positive number.').max(12, 'Cannot exceed 12 times per month.'),
  one_time: z.boolean(),
});

const customRewardSchema = z.object({
  reward_type: z.literal('custom'),
  name: z.string().min(1, 'Reward name is required.'),
  reward: z.string().min(1, 'Reward description is required.'),
});

const rewardSchema = z.discriminatedUnion('reward_type', [
  cashbackRewardSchema,
  limitedUsageRewardSchema,
  customRewardSchema,
]);

const tierSchema = z.object({
  name: z.string().min(1, 'Tier name is required.'),
  points_to_unlock: z.number().int().positive('Points must be a positive integer.').min(0, 'Points must be at least 0.'),
  rewards: z.array(rewardSchema).min(1, 'At least one reward is required per tier.'),
});

const loyaltyProgramFormSchema = z.object({
  points_rate: z.number().int().positive('Points rate must be a positive integer.').min(1, 'Points rate must be at least 1.'),
  description: z.string().min(10, 'A loyalty program description is required.'),
  tiers: z.array(tierSchema).min(1, 'At least one loyalty tier is required.'),
});

type LoyaltyProgramData = z.infer<typeof loyaltyProgramFormSchema>;

export function LoyaltyProgramForm({
  onSubmit,
  onBack,
  isLoading,
}: {
  onSubmit: (data: LoyaltyProgramData) => void;
  onBack: () => void;
  isLoading: boolean;
}) {


  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoyaltyProgramData>({
    resolver: zodResolver(loyaltyProgramFormSchema),
    defaultValues: {
      points_rate: 1,
      description: '',
      tiers: [
        {
          name: 'Bronze',
          points_to_unlock: 0,
          rewards: [{ reward_type: 'cashback', percentage: 5 }],
        },
      ],
    },
  });

  const { fields: tierFields, append: appendTier, remove: removeTier } = useFieldArray({
    control,
    name: 'tiers',
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      <Card className="w-full max-w-3xl shadow-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Loyalty Program Setup
          </CardTitle>
          <CardDescription className="text-gray-600">
            Configure your loyalty program tiers and rewards to engage customers and drive retention.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Points Rate Section */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <Label className="text-sm font-medium text-indigo-800">
                Points Rate (Hidden from customers)
              </Label>
              <p className="text-xs text-indigo-600 mt-1">
                Currently set to 1:1 ratio. This will be configurable in future updates.
              </p>
            </div>

            {/* Description Section */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Program Description
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your loyalty program to customers..."
                className="mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Tiers Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold text-gray-800">Loyalty Tiers</Label>
                <Button
                  type="button"
                  onClick={() => appendTier({
                    name: `Tier ${tierFields.length + 1}`,
                    points_to_unlock: (tierFields.length + 1) * 100,
                    rewards: [{ reward_type: 'cashback', percentage: 5 }],
                  })}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  Add Tier
                </Button>
              </div>

              <div className="space-y-4">
                {tierFields.map((tier, tierIndex) => (
                  <Card key={tier.id} className="border border-gray-200">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-800">
                          {tier.name || `Tier ${tierIndex + 1}`}
                        </CardTitle>
                        {tierFields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTier(tierIndex)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Tier Name */}
                      <div>
                        <Label htmlFor={`tiers.${tierIndex}.name`} className="text-sm font-medium text-gray-700">
                          Tier Name
                        </Label>
                        <Input
                          id={`tiers.${tierIndex}.name`}
                          placeholder="e.g., Bronze, Silver, Gold"
                          className="mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          {...register(`tiers.${tierIndex}.name`)}
                        />
                        {errors.tiers?.[tierIndex]?.name && (
                          <p className="mt-1 text-sm text-red-600">{errors.tiers[tierIndex]?.name?.message}</p>
                        )}
                      </div>

                      {/* Points to Unlock */}
                      <div>
                        <Label htmlFor={`tiers.${tierIndex}.points_to_unlock`} className="text-sm font-medium text-gray-700">
                          Points to Unlock
                        </Label>
                        <Input
                          id={`tiers.${tierIndex}.points_to_unlock`}
                          type="number"
                          min="1"
                          placeholder="e.g., 100"
                          className="mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          {...register(`tiers.${tierIndex}.points_to_unlock`, { valueAsNumber: true })}
                        />
                        {errors.tiers?.[tierIndex]?.points_to_unlock && (
                          <p className="mt-1 text-sm text-red-600">{errors.tiers[tierIndex]?.points_to_unlock?.message}</p>
                        )}
                      </div>

                      {/* Rewards Section */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">
                          Rewards for this Tier
                        </Label>
                        <RewardFields
                          tierIndex={tierIndex}
                          control={control}
                          register={register}
                          setValue={setValue}
                          errors={errors}
                          isLoading={isLoading}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                {isLoading ? 'Setting up...' : 'Create Loyalty Program'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

const RewardFields = ({
  control,
  register,
  setValue,
  tierIndex,
  errors,
  isLoading,
}: {
  control: Control<LoyaltyProgramData>,
  register: UseFormRegister<LoyaltyProgramData>,
  setValue: UseFormSetValue<LoyaltyProgramData>,
  tierIndex: number,
  errors: FieldErrors<LoyaltyProgramData>,
  isLoading: boolean
}) => {
  const { fields: rewardFields, append: appendReward, remove: removeReward } = useFieldArray({
    control,
    name: `tiers.${tierIndex}.rewards`,
  });

  const watchedRewards = useWatch({ control, name: `tiers.${tierIndex}.rewards` }) ?? [];

  const handleAddReward = () => {
    appendReward({
      reward_type: 'cashback',
      percentage: 5
    });
  };



  return (
    <div className="space-y-4 mt-4">
      <h5 className="text-md font-medium">Rewards for this Tier</h5>
      {rewardFields.map((reward, rewardIndex) => {
        const currentReward = watchedRewards?.[rewardIndex];
        // Ensure we have a proper reward object with default values
        const rewardData = currentReward || { reward_type: 'cashback', percentage: 5 };

        return (
          <div key={reward.id} className="border-l-2 border-indigo-200 pl-3 py-3 space-y-3 rounded-sm bg-white">
            <div className="flex justify-between items-center">
              <h6 className="text-sm font-semibold">Reward {rewardIndex + 1}</h6>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeReward(rewardIndex)}
                disabled={isLoading}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </Button>
            </div>

            <div className="grid gap-3">
              <div>
                <Label>Reward Type</Label>
                <Controller
                  name={`tiers.${tierIndex}.rewards.${rewardIndex}.reward_type`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Set default values based on reward type
                        if (value === 'limited_usage') {
                          setValue(`tiers.${tierIndex}.rewards.${rewardIndex}.reward_text`, '');
                          setValue(`tiers.${tierIndex}.rewards.${rewardIndex}.usage_limit_per_month`, 1.0);
                          setValue(`tiers.${tierIndex}.rewards.${rewardIndex}.one_time`, false);
                        } else if (value === 'cashback') {
                          setValue(`tiers.${tierIndex}.rewards.${rewardIndex}.percentage`, 5);
                        } else if (value === 'custom') {
                          setValue(`tiers.${tierIndex}.rewards.${rewardIndex}.name`, '');
                          setValue(`tiers.${tierIndex}.rewards.${rewardIndex}.reward`, '');
                        }
                      }}
                      value={field.value || 'cashback'}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue placeholder="Select a type..." />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-50 bg-white shadow-lg border border-gray-200 rounded-md">
                        <SelectItem value="cashback">Cashback (Percentage)</SelectItem>
                        <SelectItem value="limited_usage">Limited Usage Reward</SelectItem>
                        <SelectItem value="custom">Custom Reward</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Cashback Reward Fields */}
              {rewardData.reward_type === 'cashback' && (
                <div>
                  <Label htmlFor={`tiers.${tierIndex}.rewards.${rewardIndex}.percentage`}>Cashback Percentage</Label>
                  <Input
                    id={`tiers.${tierIndex}.rewards.${rewardIndex}.percentage`}
                    type="number"
                    {...register(`tiers.${tierIndex}.rewards.${rewardIndex}.percentage`, { valueAsNumber: true })}
                    disabled={isLoading}
                    className="w-full min-w-0 focus:border-indigo-400 focus:ring-indigo-500"
                    placeholder="e.g., 5"
                    min="1"
                    max="100"
                  />
                  {errors?.tiers?.[tierIndex]?.rewards?.[rewardIndex] && (
                    <p className="text-red-500 text-sm mt-1">
                      Error in reward data
                    </p>
                  )}
                </div>
              )}

              {/* Limited Usage Reward Fields */}
              {rewardData.reward_type === 'limited_usage' && (
                <>
                  <div>
                    <Label htmlFor={`tiers.${tierIndex}.rewards.${rewardIndex}.reward_text`}>Reward Text</Label>
                    <Input
                      id={`tiers.${tierIndex}.rewards.${rewardIndex}.reward_text`}
                      {...register(`tiers.${tierIndex}.rewards.${rewardIndex}.reward_text`)}
                      disabled={isLoading}
                      className="w-full min-w-0 focus:border-indigo-400 focus:ring-indigo-500"
                      placeholder="e.g., 20% off on next purchase"
                    />
                    {errors?.tiers?.[tierIndex]?.rewards?.[rewardIndex] && (
                      <p className="text-red-500 text-sm mt-1">
                        Error in reward text
                      </p>
                    )}
                  </div>





                  <div>
                    <Label htmlFor={`tiers.${tierIndex}.rewards.${rewardIndex}.usage_limit_per_month`}>Usage Limit Per Month</Label>
                    <Input
                      id={`tiers.${tierIndex}.rewards.${rewardIndex}.usage_limit_per_month`}
                      type="number"
                      step="0.5"
                      {...register(`tiers.${tierIndex}.rewards.${rewardIndex}.usage_limit_per_month`, { valueAsNumber: true })}
                      disabled={isLoading || rewardData.one_time}
                      className="w-full min-w-0 focus:border-indigo-400 focus:ring-indigo-500"
                      placeholder="e.g., 2 (twice per month), 0.5 (bi-monthly)"
                      min="0.5"
                      max="12"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {rewardData.one_time ? 'Disabled for one-time rewards' : '2 = twice per month, 0.5 = bi-monthly, 1 = monthly'}
                    </div>
                    {errors?.tiers?.[tierIndex]?.rewards?.[rewardIndex] && (
                      <p className="text-red-500 text-sm mt-1">
                        Error in reward data
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`tiers.${tierIndex}.rewards.${rewardIndex}.one_time`}
                      {...register(`tiers.${tierIndex}.rewards.${rewardIndex}.one_time`)}
                      disabled={isLoading}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Label htmlFor={`tiers.${tierIndex}.rewards.${rewardIndex}.one_time`}>One-time reward only</Label>
                  </div>
                </>
              )}

              {/* Custom Reward Fields */}
              {rewardData.reward_type === 'custom' && (
                <>
                  <div>
                    <Label htmlFor={`tiers.${tierIndex}.rewards.${rewardIndex}.name`}>Reward Name</Label>
                    <Input
                      id={`tiers.${tierIndex}.rewards.${rewardIndex}.name`}
                      {...register(`tiers.${tierIndex}.rewards.${rewardIndex}.name`)}
                      disabled={isLoading}
                      className="w-full min-w-0 focus:border-indigo-400 focus:ring-indigo-500"
                      placeholder="e.g., VIP Access"
                    />
                    {errors?.tiers?.[tierIndex]?.rewards?.[rewardIndex] && (
                      <p className="text-red-500 text-sm mt-1">
                        Error in reward name
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`tiers.${tierIndex}.rewards.${rewardIndex}.reward`}>Reward Description</Label>
                    <Textarea
                      id={`tiers.${tierIndex}.rewards.${rewardIndex}.reward`}
                      {...register(`tiers.${tierIndex}.rewards.${rewardIndex}.reward`)}
                      disabled={isLoading}
                      className="w-full min-w-0 focus:border-indigo-400 focus:ring-indigo-500"
                      placeholder="e.g., Exclusive access to premium services and priority support"
                    />
                    {errors?.tiers?.[tierIndex]?.rewards?.[rewardIndex] && (
                      <p className="text-red-500 text-sm mt-1">
                        Error in reward description
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
      <Button
        type="button"
        onClick={handleAddReward}
        disabled={isLoading}
        variant="ghost"
        className="w-full text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-300"
      >
        + Add Reward
      </Button>
    </div>
  );
};