'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import BusinessApprovalWrapper from '@/components/BusinessApprovalWrapper';
import { motion } from 'framer-motion';
import {
    Building2,
    Phone,
    Edit3,
    Save,
    X,
    Plus,
    Trash2,
    Upload,
    Image
} from 'lucide-react';

interface BusinessProfile {
    id: number;
    name: string;
    business_type: string;
    description: string;
    address: string;
    contact_number: string;
    contact_number_2?: string;
    gmap_link?: string;
    logo_url?: string;
    additional_info?: Record<string, {
        label: string;
        type: string;
        value: string;
        required: boolean;
    }>;
}

interface EditableField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'email' | 'url' | 'tel';
    placeholder: string;
    required: boolean;
    category: 'basic' | 'contact' | 'details' | 'custom';
}

export default function BusinessProfilePage() {
    const { user, role, loading: authLoading } = useAuthSession();
    const router = useRouter();
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [showAddField, setShowAddField] = useState(false);
    const [newField, setNewField] = useState({
        key: '',
        label: '',
        type: 'text' as 'text' | 'textarea' | 'email' | 'url' | 'tel',
        required: false
    });

    // Predefined editable fields - modular and extensible
    const editableFields: EditableField[] = [
        // Basic Information
        { key: 'name', label: 'Business Name', type: 'text', placeholder: 'Enter business name', required: false, category: 'basic' },
        { key: 'business_type', label: 'Business Type', type: 'text', placeholder: 'e.g., Restaurant, Retail, Service', required: false, category: 'basic' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe your business', required: false, category: 'basic' },

        // Contact Information
        { key: 'address', label: 'Address', type: 'text', placeholder: 'Business address', required: false, category: 'contact' },
        { key: 'email', label: 'Business Email', type: 'email', placeholder: 'Business email address', required: false, category: 'contact' },
        { key: 'contact_number', label: 'Primary Phone', type: 'tel', placeholder: 'Primary contact number', required: false, category: 'contact' },
        { key: 'contact_number_2', label: 'Secondary Phone', type: 'tel', placeholder: 'Secondary contact number', required: false, category: 'contact' },
        { key: 'gmap_link', label: 'Google Maps Link', type: 'url', placeholder: 'Google Maps URL for your business location', required: false, category: 'contact' },

        // Business Details
        { key: 'logo_url', label: 'Company Logo', type: 'url', placeholder: 'GCP bucket URL for your company logo', required: false, category: 'details' },
    ];

    useEffect(() => {
        if (!authLoading && (!user || role !== 'business')) {
            toast.info('Please log in as a business to view your profile.');
            router.push('/login/business');
        }
    }, [authLoading, user, role, router]);

    useEffect(() => {
        if (!authLoading && user && role === 'business') {
            void fetchProfile();
        }
    }, [authLoading, user, role]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/business/profile');
            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }
            const data = await response.json();
            setProfile(data);
        } catch (error) {
            toast.error('Failed to load profile');
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (key: string, currentValue: string | number | undefined) => {
        setEditing(key);
        setEditValue(currentValue ? String(currentValue) : '');
    };

    const cancelEditing = () => {
        setEditing(null);
        setEditValue('');
    };

    const saveField = async (key: string) => {
        if (!profile) return;

        setSaving(true);
        try {
            const response = await fetch('/api/business/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    [key]: editValue,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            setProfile(prev => prev ? { ...prev, [key]: editValue } : null);
            setEditing(null);
            setEditValue('');
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
            console.error('Error updating profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const addCustomField = async () => {
        if (!newField.key || !newField.label) {
            toast.error('Please fill in all fields');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/business/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    additional_info: {
                        ...profile?.additional_info,
                        [newField.key]: {
                            label: newField.label,
                            type: newField.type,
                            value: '',
                            required: newField.required
                        }
                    }
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add custom field');
            }

            // Refresh profile to get updated data
            await fetchProfile();
            setShowAddField(false);
            setNewField({ key: '', label: '', type: 'text', required: false });
            toast.success('Custom field added successfully');
        } catch (error) {
            toast.error('Failed to add custom field');
            console.error('Error adding custom field:', error);
        } finally {
            setSaving(false);
        }
    };

    const removeCustomField = async (key: string) => {
        if (!profile?.additional_info) return;

        setSaving(true);
        try {
            const updatedAdditionalInfo = { ...profile.additional_info };
            delete updatedAdditionalInfo[key];

            const response = await fetch('/api/business/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    additional_info: updatedAdditionalInfo,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to remove custom field');
            }

            await fetchProfile();
            toast.success('Custom field removed successfully');
        } catch (error) {
            toast.error('Failed to remove custom field');
            console.error('Error removing custom field:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('logo', file);

            const response = await fetch('/api/business/logo/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error ?? 'Failed to upload logo');
            }

            const result = await response.json();

            // Update the profile with the new logo URL in the database
            const updateResponse = await fetch('/api/business/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logo_url: result.logo_url,
                }),
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to save logo URL to profile');
            }

            // Refresh the profile to show the new logo
            await fetchProfile();
            toast.success('Logo uploaded and saved successfully');

            // Clear the file input
            event.target.value = '';
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
            console.error('Error uploading logo:', error);
        } finally {
            setSaving(false);
        }
    };

    const renderField = (field: EditableField) => {
        const currentValue = profile?.[field.key as keyof BusinessProfile];
        const isEditing = editing === field.key;

        // Special handling for gmap_link to make it clickable
        if (field.key === 'gmap_link' && currentValue && !isEditing) {
            return (
                <div className="flex items-center justify-between group">
                    <div className="flex-1">
                        <p className="text-sm text-gray-600">{field.label}</p>
                        <a
                            href={currentValue as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                            {currentValue as string}
                        </a>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(field.key, typeof currentValue === 'string' || typeof currentValue === 'number' ? currentValue : '')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Edit3 className="w-4 h-4" />
                    </Button>
                </div>
            );
        }

        // Special handling for logo_url to display as image
        if (field.key === 'logo_url' && currentValue && !isEditing) {
            return (
                <div className="flex items-center justify-between group">
                    <div className="flex-1">
                        <p className="text-sm text-gray-600">{field.label}</p>
                        <div className="flex items-center gap-3 mt-2">
                            <img
                                src={currentValue as string}
                                alt="Company Logo"
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                            <a
                                href={currentValue as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                            >
                                View Full Size
                            </a>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(field.key, typeof currentValue === 'string' || typeof currentValue === 'number' ? currentValue : '')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Edit3 className="w-4 h-4" />
                    </Button>
                </div>
            );
        }

        if (isEditing) {
            return (
                <div className="flex items-center gap-2">
                    {field.type === 'textarea' ? (
                        <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder={field.placeholder}
                            className="flex-1"
                            rows={3}
                        />
                    ) : (
                        <Input
                            type={field.type}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder={field.placeholder}
                            className="flex-1"
                        />
                    )}
                    <Button
                        size="sm"
                        onClick={() => saveField(field.key)}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Save className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={saving}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-between group">
                <div className="flex-1">
                    <p className="text-sm text-gray-600">{field.label}</p>
                    <p className="text-gray-900 font-medium">
                        {currentValue ? String(currentValue) : <span className="text-gray-400 italic">Not set</span>}
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(field.key, typeof currentValue === 'string' || typeof currentValue === 'number' ? currentValue : '')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Edit3 className="w-4 h-4" />
                </Button>
            </div>
        );
    };

    const renderCustomFields = () => {
        if (!profile?.additional_info) return null;

        return Object.entries(profile.additional_info).map(([key, fieldData]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                    <p className="text-sm text-gray-600">{fieldData.label}</p>
                    <p className="text-gray-900 font-medium">
                        {fieldData.value ?? <span className="text-gray-400 italic">Not set</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(key, fieldData.value)}
                        className="text-blue-600 hover:text-blue-700"
                    >
                        <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCustomField(key)}
                        className="text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        ));
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user || role !== 'business') {
        return null;
    }

    return (
        <BusinessApprovalWrapper>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="container mx-auto py-8 px-4">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-3">
                            <Building2 className="w-4 h-4 mr-2" />
                            Business Profile
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Manage Your Business Profile
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Keep your business information up-to-date to provide the best experience for your customers.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Basic Information */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="h-fit">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                        Basic Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {editableFields
                                        .filter(field => field.category === 'basic')
                                        .map(field => (
                                            <div key={field.key} className="space-y-2">
                                                {renderField(field)}
                                            </div>
                                        ))}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Contact Information */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="h-fit">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Phone className="w-5 h-5 text-green-600" />
                                        Contact Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {editableFields
                                        .filter(field => field.category === 'contact')
                                        .map(field => (
                                            <div key={field.key} className="space-y-2">
                                                {renderField(field)}
                                            </div>
                                        ))}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Business Details */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="h-fit">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Image className="w-5 h-5 text-orange-600" />
                                        Business Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Logo Upload Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Company Logo</p>
                                                <p className="text-xs text-gray-500">Upload your company logo (PNG, JPEG, GIF, WebP, SVG)</p>
                                            </div>
                                            <Button
                                                onClick={() => document.getElementById('logo-upload')?.click()}
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Logo
                                            </Button>
                                        </div>

                                        <input
                                            id="logo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleLogoUpload}
                                        />

                                        {profile?.logo_url && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <img
                                                    src={profile.logo_url}
                                                    alt="Company Logo"
                                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">Current Logo</p>
                                                    <p className="text-xs text-gray-500">Click edit to change the URL</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {editableFields
                                        .filter(field => field.category === 'details')
                                        .map(field => (
                                            <div key={field.key} className="space-y-2">
                                                {renderField(field)}
                                            </div>
                                        ))}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Custom Fields */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Card className="h-fit">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Plus className="w-5 h-5 text-purple-600" />
                                        Custom Fields
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {renderCustomFields()}

                                    {!showAddField ? (
                                        <Button
                                            onClick={() => setShowAddField(true)}
                                            variant="outline"
                                            className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Custom Field
                                        </Button>
                                    ) : (
                                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label htmlFor="fieldKey" className="text-xs">Field Key</Label>
                                                    <Input
                                                        id="fieldKey"
                                                        value={newField.key}
                                                        onChange={(e) => setNewField(prev => ({ ...prev, key: e.target.value }))}
                                                        placeholder="e.g., specialties"
                                                        className="text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="fieldLabel" className="text-xs">Display Label</Label>
                                                    <Input
                                                        id="fieldLabel"
                                                        value={newField.label}
                                                        onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                                                        placeholder="e.g., Specialties"
                                                        className="text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label htmlFor="fieldType" className="text-xs">Field Type</Label>
                                                    <select
                                                        id="fieldType"
                                                        value={newField.type}
                                                        onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value as any }))}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                                                    >
                                                        <option value="text">Text</option>
                                                        <option value="textarea">Long Text</option>
                                                        <option value="email">Email</option>
                                                        <option value="url">URL</option>
                                                        <option value="tel">Phone</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-end">
                                                    <label className="flex items-center gap-2 text-xs">
                                                        <input
                                                            type="checkbox"
                                                            checked={newField.required}
                                                            onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                                                            className="rounded"
                                                        />
                                                        Required
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={addCustomField}
                                                    disabled={saving || !newField.key || !newField.label}
                                                    size="sm"
                                                    className="flex-1"
                                                >
                                                    {saving ? 'Adding...' : 'Add Field'}
                                                </Button>
                                                <Button
                                                    onClick={() => setShowAddField(false)}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </BusinessApprovalWrapper>
    );
} 