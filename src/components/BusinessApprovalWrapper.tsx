"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BusinessApprovalPending from "./BusinessApprovalPending";

interface BusinessApprovalWrapperProps {
    children: React.ReactNode;
}

export default function BusinessApprovalWrapper({ children }: BusinessApprovalWrapperProps) {
    const [isApproved, setIsApproved] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function checkApprovalStatus() {
            try {
                const res = await fetch('/api/business/approval-status/me');
                if (res.ok) {
                    const data = await res.json();
                    setIsApproved(data.approved);
                } else {
                    // If we can't check approval status, assume not approved for security
                    setIsApproved(false);
                }
            } catch (error) {
                console.error('Failed to check approval status:', error);
                // If there's an error, assume not approved for security
                setIsApproved(false);
            } finally {
                setIsLoading(false);
            }
        }

        void checkApprovalStatus();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking approval status...</p>
                </div>
            </div>
        );
    }

    if (isApproved === false) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
                <div className="container mx-auto px-4 py-8">
                    <BusinessApprovalPending />
                </div>
            </div>
        );
    }

    // Only render children if business is approved
    return <>{children}</>;
} 