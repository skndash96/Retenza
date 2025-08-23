import { useState, useEffect } from "react";

interface BusinessApprovalStatus {
    isApproved: boolean;
    isLoading: boolean;
    error: string | null;
}

export function useBusinessApproval(businessId?: number): BusinessApprovalStatus {
    const [isApproved, setIsApproved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!businessId) {
            setIsLoading(false);
            return;
        }

        const checkApprovalStatus = async () => {
            try {
                const response = await fetch(`/api/business/approval-status/${businessId}`);
                if (response.ok) {
                    const data = await response.json();
                    setIsApproved(data.approved);
                } else {
                    setError("Failed to check approval status");
                }
            } catch (err) {
                setError("Error checking approval status");
            } finally {
                setIsLoading(false);
            }
        };

        void checkApprovalStatus();
    }, [businessId]);

    return { isApproved, isLoading, error };
} 