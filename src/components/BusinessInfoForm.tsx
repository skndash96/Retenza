'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { INDUSTRY_OPTIONS } from '@/server/constants/industry';

export function BusinessInfoForm({
    onSubmit,
    isLoading,
    schema,
}: {
    onSubmit: (data: any) => void | Promise<void>;
    isLoading: boolean;
    schema: z.ZodSchema;
}) {
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);

    const { register, handleSubmit, formState: { errors }, control } = useForm({
        resolver: zodResolver(schema as any),
        defaultValues: {
            name: '',
            phone_number: '',
            address: '',
            business_type: '',
            email: '',
            description: '',
            gmap_link: '',
            logo_url: '',
            password: '',
            confirmPassword: '',
        },
    });

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Only PNG, JPEG, GIF, WebP, and SVG files are allowed.');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('File too large. Maximum size is 5MB.');
            return;
        }

        setLogoFile(file);
        event.target.value = '';
    };

    const handleFormSubmit = async (data: any) => {
        try {
            setLogoUploading(true);

            // If there's a logo file, upload it first
            if (logoFile) {
                const formData = new FormData();
                formData.append('logo', logoFile);

                const uploadResponse = await fetch('/api/signup/business/logo-upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    const errorData = await uploadResponse.json();
                    throw new Error(errorData.error ?? 'Failed to upload logo');
                }

                const uploadResult = await uploadResponse.json();
                data.logo_url = uploadResult.logo_url;
            }

            // Now submit the business info with the logo URL
            await onSubmit(data);

            // Clear the logo file after successful submission
            setLogoFile(null);

        } catch (error) {
            console.error('Error in form submission:', error);
            alert(error instanceof Error ? error.message : 'Failed to submit form');
        } finally {
            setLogoUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <Card className="shadow-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="text-center pb-8">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                        Business Information
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Please provide your business details to get started. All fields marked with * are required.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                        {/* Required Fields Section */}
                        <div className="space-y-5">
                            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Required Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                        Business Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        disabled={isLoading}
                                        className="mt-1 focus:border-blue-500 focus:ring-blue-500 border-gray-300"
                                        placeholder="Enter your business name"
                                    />
                                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message ? String(errors.name.message) : 'Invalid input'}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">
                                        Phone Number (Login) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="phone_number"
                                        {...register('phone_number')}
                                        disabled={isLoading}
                                        className="mt-1 focus:border-blue-500 focus:ring-blue-500 border-gray-300"
                                        placeholder="+1234567890"
                                    />
                                    {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number.message ? String(errors.phone_number.message) : 'Invalid input'}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                                        Address <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="address"
                                        {...register('address')}
                                        disabled={isLoading}
                                        className="mt-1 focus:border-blue-500 focus:ring-blue-500 border-gray-300"
                                        placeholder="Enter your business address"
                                    />
                                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message ? String(errors.address.message) : 'Invalid input'}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="business_type" className="text-sm font-medium text-gray-700">
                                        Business Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="business_type"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value ?? ''}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger className="mt-1 focus:border-blue-500 focus:ring-blue-500 border-gray-300">
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
                                    {errors.business_type && <p className="text-red-500 text-sm mt-1">{errors.business_type.message ? String(errors.business_type.message) : 'Invalid input'}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                        Password <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        {...register('password')}
                                        disabled={isLoading}
                                        className="mt-1 focus:border-blue-500 focus:ring-blue-500 border-gray-300"
                                        placeholder="Create a strong password"
                                    />
                                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message ? String(errors.password.message) : 'Invalid input'}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        {...register('confirmPassword')}
                                        disabled={isLoading}
                                        className="mt-1 focus:border-blue-500 focus:ring-blue-500 border-gray-300"
                                        placeholder="Confirm your password"
                                    />
                                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message ? String(errors.confirmPassword.message) : 'Invalid input'}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Optional Fields Section */}
                        <div className="space-y-5">
                            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Additional Information (Optional)</h3>

                            <div>
                                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                    Business Description
                                </Label>
                                <textarea
                                    id="description"
                                    {...register('description')}
                                    disabled={isLoading}
                                    rows={3}
                                    placeholder="Describe your business, services, or what makes you unique..."
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 focus:outline-none resize-none"
                                />
                                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message ? String(errors.description.message) : 'Invalid input'}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                        Business Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...register('email')}
                                        disabled={isLoading}
                                        placeholder="business@example.com"
                                        className="mt-1 focus:border-blue-500 focus:ring-blue-500 border-gray-300"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">We&apos;ll use this to send you important updates and notifications</p>
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message ? String(errors.email.message) : 'Invalid input'}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="gmap_link" className="text-sm font-medium text-gray-700">
                                        Google Maps Link
                                    </Label>
                                    <Input
                                        id="gmap_link"
                                        type="url"
                                        {...register('gmap_link')}
                                        disabled={isLoading}
                                        placeholder="https://maps.google.com/..."
                                        className="mt-1 focus:border-blue-500 focus:ring-blue-500 border-gray-300"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Customers can click this to get directions to your business</p>
                                    {errors.gmap_link && <p className="text-red-500 text-sm mt-1">{errors.gmap_link.message ? String(errors.gmap_link.message) : 'Invalid input'}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="logo" className="text-sm font-medium text-gray-700">
                                    Company Logo
                                </Label>
                                <div className="mt-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            onClick={() => document.getElementById('logo-upload')?.click()}
                                            size="sm"
                                            variant="outline"
                                            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                            disabled={isLoading}
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload Logo
                                        </Button>
                                        <span className="text-xs text-gray-500">PNG, JPEG, GIF, WebP, SVG (max 5MB)</span>
                                    </div>

                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                        disabled={isLoading}
                                    />

                                    {logoFile && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <img
                                                src={URL.createObjectURL(logoFile)}
                                                alt="Preview"
                                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{logoFile.name}</p>
                                                <p className="text-xs text-gray-500">{(logoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => setLogoFile(null)}
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {errors.logo_url && <p className="text-red-500 text-sm mt-1">{errors.logo_url.message ? String(errors.logo_url.message) : 'Invalid input'}</p>}
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg"
                                disabled={isLoading || logoUploading}
                            >
                                {isLoading || logoUploading ? "Processing..." : "Next: Set Up Loyalty Program"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 