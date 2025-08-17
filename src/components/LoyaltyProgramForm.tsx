'use client';

import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import type { FieldErrors, UseFormRegister, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

const rewardSchema = z.discriminatedUnion('reward_type', [
  z.object({ reward_type: z.literal('Free Item'), description: z.string().min(1, 'Item name is required.'), value: z.number().optional() }),
  z.object({ reward_type: z.literal('Discount'), description: z.string().optional(), value: z.number().int().positive().min(1, 'Percentage must be a positive number.').max(100, 'Discount cannot exceed 100%.') }),
  z.object({ reward_type: z.literal('Cashback'), description: z.string().optional(), value: z.number().int().positive().min(1, 'Amount must be a positive number.') }),
]);

const tierSchema = z.object({
  name: z.string().min(1, 'Tier name is required.'),
  points_to_unlock: z.number().int().positive('Points must be a positive integer.').min(1, 'Points must be at least 1.'),
  rewards: z.array(rewardSchema).min(1, 'At least one reward is required per tier.'),
});

const loyaltyProgramFormSchema = z.object({
  points_rate: z.number().int().positive('Points rate must be a positive integer.').min(1, 'Points rate must be at least 1.'),
  description: z.string().min(5, 'A loyalty program description is required.'),
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
  const [activeTierIndex, setActiveTierIndex] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoyaltyProgramData>({
    resolver: zodResolver(loyaltyProgramFormSchema),
    defaultValues: {
      points_rate: 1,
      description: '',
      tiers: [
        {
          name: 'Bronze',
          points_to_unlock: 1,
          rewards: [{ reward_type: 'Free Item', description: '', value: 0 }],
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
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-gray-700 bg-clip-text text-transparent">
            Loyalty Program Setup
          </CardTitle>
          <CardDescription className="text-gray-600">
            Define your loyalty tiers and rewards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor="points_rate">Points Rate</Label>
                  <Input
                    id="points_rate"
                    type="number"
                    {...register('points_rate', { valueAsNumber: true })}
                    disabled={isLoading}
                    className="focus:border-amber-400 focus:ring-amber-500"
                  />
                  {errors.points_rate && (
                    <p className="text-red-500 text-sm mt-1">
                      {String(errors.points_rate.message)}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Loyalty Program Description</Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        id="description"
                        disabled={isLoading}
                        placeholder="e.g., Get 10% off on your first purchase"
                        value={field.value}
                        onChange={field.onChange}
                        className="focus:border-amber-400 focus:ring-amber-500"
                      />
                    )}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {String(errors.description.message)}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Manage Tiers</h3>
                <div className="flex gap-2 flex-wrap mb-4">
                  {tierFields.map((tier, index) => (
                    <Button
                      key={tier.id}
                      type="button"
                      variant={activeTierIndex === index ? 'default' : 'outline'}
                      onClick={() => setActiveTierIndex(index)}
                      className={`whitespace-nowrap ${
                        activeTierIndex === index
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-white'
                          : ''
                      }`}
                    >
                      {tier.name || `Tier ${index + 1}`}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      appendTier({ name: '', points_to_unlock: 1, rewards: [] });
                      setActiveTierIndex(tierFields.length);
                    }}
                    disabled={isLoading}
                  >
                    + Add Tier
                  </Button>
                </div>

                {tierFields.length > 0 && (
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Tier Details</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            if (tierFields.length > 1) {
                              removeTier(activeTierIndex);
                              setActiveTierIndex(0);
                            }
                          }}
                          disabled={isLoading || tierFields.length === 1}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove Tier
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`tiers.${activeTierIndex}.name`}>Tier Name</Label>
                            <Input
                              id={`tiers.${activeTierIndex}.name`}
                              {...register(`tiers.${activeTierIndex}.name`)}
                              disabled={isLoading}
                              className="focus:border-amber-400 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`tiers.${activeTierIndex}.points_to_unlock`}>
                              Points to Unlock
                            </Label>
                            <Input
                              id={`tiers.${activeTierIndex}.points_to_unlock`}
                              type="number"
                              {...register(`tiers.${activeTierIndex}.points_to_unlock`, {
                                valueAsNumber: true,
                              })}
                              disabled={isLoading}
                              className="focus:border-amber-400 focus:ring-amber-500"
                            />
                          </div>
                        </div>

                        <RewardFields
                          control={control}
                          register={register}
                          tierIndex={activeTierIndex}
                          errors={errors}
                          isLoading={isLoading}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white"
              >
                {isLoading ? 'Finalizing...' : 'Complete Setup'}
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
  tierIndex,
  errors,
  isLoading,
}: {
  control: Control<LoyaltyProgramData>,
  register: UseFormRegister<LoyaltyProgramData>,
  tierIndex: number,
  errors: FieldErrors<LoyaltyProgramData>,
  isLoading: boolean
}) => {
  const { fields: rewardFields, append: appendReward, remove: removeReward } = useFieldArray({
    control,
    name: `tiers.${tierIndex}.rewards`,
  });

  const watchedRewards = useWatch({ control, name: `tiers.${tierIndex}.rewards` }) ?? [];

  return (
    <div className="space-y-4 mt-4">
      <h5 className="text-md font-medium">Rewards for this Tier</h5>
      {rewardFields.map((reward, rewardIndex) => {
        const currentReward = watchedRewards?.[rewardIndex] ?? { reward_type: '', description: '', value: 0 };
        return (
          <div key={reward.id} className="border-l-2 border-gray-200 pl-3 py-3 space-y-3 rounded-sm bg-white">
            <div className="flex justify-between items-center">
              <h6 className="text-sm font-semibold">Reward {rewardIndex + 1}</h6>
              <Button type="button" variant="ghost" onClick={() => removeReward(rewardIndex)} disabled={isLoading} className="text-red-500 hover:text-red-700 text-xs">Remove</Button>
            </div>

            <div className="grid gap-3">
              <div>
                <Label>Reward Type</Label>
                <Controller
                  name={`tiers.${tierIndex}.rewards.${rewardIndex}.reward_type`}
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue placeholder="Select a type..." />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-50 bg-white shadow-lg border border-gray-200 rounded-md">
                        <SelectItem value="Free Item">Free Item</SelectItem>
                        <SelectItem value="Discount">Discount</SelectItem>
                        <SelectItem value="Cashback">Cashback</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {(currentReward.reward_type === 'Free Item' || !currentReward.reward_type) && (
                <div>
                  <Label htmlFor={`tiers.${tierIndex}.rewards.${rewardIndex}.description`}>Item Name</Label>
                  <Input id={`tiers.${tierIndex}.rewards.${rewardIndex}.description`} {...register(`tiers.${tierIndex}.rewards.${rewardIndex}.description`)} disabled={isLoading} className="w-full min-w-0" />
                  {errors?.tiers?.[tierIndex]?.rewards?.[rewardIndex]?.description && <p className="text-red-500 text-sm mt-1">{String(errors.tiers[tierIndex]?.rewards?.[rewardIndex]?.description?.message)}</p>}
                </div>
              )}

              {(currentReward.reward_type === 'Discount' || currentReward.reward_type === 'Cashback') && (
                <div>
                  <Label htmlFor={`tiers.${tierIndex}.rewards.${rewardIndex}.value`}>
                    {currentReward.reward_type === 'Discount' ? 'Percentage' : 'Amount'}
                  </Label>
                  <Input id={`tiers.${tierIndex}.rewards.${rewardIndex}.value`} type="number" {...register(`tiers.${tierIndex}.rewards.${rewardIndex}.value`, { valueAsNumber: true })} disabled={isLoading} className="w-full min-w-0" />
                  {Array.isArray(errors?.tiers) &&
                    errors.tiers[tierIndex] &&
                    Array.isArray((errors.tiers[tierIndex])?.rewards) &&
                    (errors.tiers[tierIndex]).rewards[rewardIndex]?.value && (
                      <p className="text-red-500 text-sm mt-1">
                        {String((errors.tiers[tierIndex]).rewards[rewardIndex]?.value?.message)}
                      </p>
                  )}
                </div>
              )}

            </div>
          </div>
        );
      })}
      <Button
        type="button"
        onClick={() => appendReward({ reward_type: 'Free Item', description: '', value: 0 })}
        disabled={isLoading}
        variant="ghost"
        className="w-full text-blue-600 hover:text-blue-800 border"
      >
        + Add Reward
      </Button>
    </div>
  );
};