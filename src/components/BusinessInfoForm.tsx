'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// z is not used since schema is passed as prop
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const INDUSTRY_OPTIONS = [
  "Retail", "Restaurant", "Healthcare", "Education", "Beauty",
  "Electronics", "Fitness", "Automotive", "Other",
];

// Schema is passed as a prop, so we don't need to define it here

export function BusinessInfoForm({
  onSubmit,
  isLoading,
  schema,
}: {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  schema: any;
}) {
  const { register, handleSubmit, formState: { errors }, control } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone_number: '',
      contact_number_2: '',
      address: '',
      business_type: '',
      password: '',
      confirmPassword: '',
    },
  });

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-gray-700 bg-clip-text text-transparent">
            Business Information
          </CardTitle>
          <CardDescription className="text-gray-600">
            Please provide your business details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                {...register('name')}
                disabled={isLoading}
                className="focus:border-amber-400 focus:ring-amber-500"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{String(errors.name.message)}</p>}
            </div>

            <div>
              <Label htmlFor="phone_number">Phone Number (Login)</Label>
              <Input
                id="phone_number"
                {...register('phone_number')}
                disabled={isLoading}
                className="focus:border-amber-400 focus:ring-amber-500"
              />
              {errors.phone_number && <p className="text-red-500 text-sm mt-1">{String(errors.phone_number.message)}</p>}
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                {...register('address')}
                disabled={isLoading}
                className="focus:border-amber-400 focus:ring-amber-500"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{String(errors.address.message)}</p>}
            </div>

            <div>
              <Label htmlFor="business_type">Business Type</Label>
              <Controller
                name="business_type"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="focus:border-amber-400 focus:ring-amber-500">
                      <SelectValue placeholder="Select a type..." />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-50 bg-white shadow-lg border border-gray-200 rounded-md">
                      {INDUSTRY_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.business_type && <p className="text-red-500 text-sm mt-1">{String(errors.business_type.message)}</p>}
            </div>

            <div>
              <Label htmlFor="contact_number_2">Additional Contact Number (Optional)</Label>
              <Input
                id="contact_number_2"
                {...register('contact_number_2')}
                disabled={isLoading}
                className="focus:border-amber-400 focus:ring-amber-500"
              />
              {errors.contact_number_2 && <p className="text-red-500 text-sm mt-1">{String(errors.contact_number_2.message)}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                disabled={isLoading}
                className="focus:border-amber-400 focus:ring-amber-500"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{String(errors.password.message)}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                disabled={isLoading}
                className="focus:border-amber-400 focus:ring-amber-500"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{String(errors.confirmPassword.message)}</p>}
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Next: Set Up Loyalty"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
