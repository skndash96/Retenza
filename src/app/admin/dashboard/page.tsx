"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Shield,
    Building2,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    LogOut,
    Target,
    Filter,
    Trash2
} from "lucide-react";
import { toast } from "react-toastify";
import { Business } from "@/server/db/schema";

export default function AdminDashboardPage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if admin is authenticated
        const isAuthenticated = localStorage.getItem("adminAuthenticated");
        if (!isAuthenticated) {
            router.push("/admin/login");
            return;
        }

        void fetchBusinesses();
    }, [router]);

    useEffect(() => {
        filterBusinesses();
    }, [businesses, searchTerm, filterStatus]);

    const fetchBusinesses = async () => {
        try {
            const response = await fetch("/api/admin/businesses");
            if (response.ok) {
                const data = await response.json();
                setBusinesses(data.businesses ?? []);
            } else {
                toast.error("Failed to fetch businesses");
            }
        } catch {
            toast.error("Error fetching businesses");
        } finally {
            setIsLoading(false);
        }
    };

    const filterBusinesses = () => {
        let filtered = businesses;

        // Apply status filter
        if (filterStatus === "pending") {
            filtered = filtered.filter(b => !b.approved);
        } else if (filterStatus === "approved") {
            filtered = filtered.filter(b => b.approved);
        }

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(b =>
                b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.businessType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.phoneNumber.includes(searchTerm)
            );
        }

        setFilteredBusinesses(filtered);
    };

    const handleDelete = async (businessId: number) => {
        if (!confirm("Are you sure you want to delete this business? This action cannot be undone.")) {
            return;
        }

        setIsUpdating(true);

        try {
            const response = await fetch(`/api/admin/businesses/${businessId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Business deleted successfully");
                void fetchBusinesses(); // Refresh the list
            } else {
                toast.error("Failed to delete business");
            }
        } catch {
            toast.error("Error deleting business");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleApproval = async (businessId: number, approved: boolean) => {
        setIsUpdating(true);
        try {
            const response = await fetch(`/api/admin/businesses/${businessId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ approved }),
            });

            if (response.ok) {
                toast.success(`Business ${approved ? "approved" : "rejected"} successfully`);
                void fetchBusinesses(); // Refresh the list
            } else {
                toast.error("Failed to update business status");
            }
        } catch {
            toast.error("Error updating business status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("adminAuthenticated");
        localStorage.removeItem("adminUsername");
        router.push("/admin/login");
    };

    const getStats = () => {
        const total = businesses.length;
        const pending = businesses.filter(b => !b.approved).length;
        const approved = businesses.filter(b => b.approved).length;
        const setupComplete = businesses.filter(b => b.isSetupComplete).length;

        return { total, pending, approved, setupComplete };
    };

    const stats = getStats();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Admin Dashboard</span>
                        </div>

                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Building2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Total Businesses</p>
                                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-yellow-600 font-medium">Pending Approval</p>
                                    <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-green-600 font-medium">Approved</p>
                                    <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Target className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-purple-600 font-medium">Setup Complete</p>
                                    <p className="text-2xl font-bold text-purple-900">{stats.setupComplete}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search businesses by name, type, or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as any)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending Approval</option>
                                    <option value="approved">Approved</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Businesses List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Business Requests</h2>
                        <p className="text-sm text-gray-600">
                            Showing {filteredBusinesses.length} of {businesses.length} businesses
                        </p>
                    </div>

                    {filteredBusinesses.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No businesses found matching your criteria.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {filteredBusinesses.map((business) => (
                                <motion.div
                                    key={business.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="hover:shadow-lg transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                                {business.name}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge variant={business.approved ? "default" : "secondary"}>
                                                                    {business.approved ? "Approved" : "Pending Approval"}
                                                                </Badge>
                                                                {business.isSetupComplete && (
                                                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                                                        Setup Complete
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                                        <div>
                                                            <p><strong>Business Type:</strong> {business.businessType || "Not specified"}</p>
                                                            <p><strong>Phone:</strong> {business.phoneNumber}</p>
                                                            <p><strong>Address:</strong> {business.address || "Not specified"}</p>
                                                        </div>
                                                        <div>
                                                            <p><strong>Description:</strong> {business.description || "No description"}</p>
                                                            <p><strong>Created:</strong> {new Date(business.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 min-w-[200px]">
                                                    {!business.approved ? (
                                                        <>
                                                            <Button
                                                                onClick={() => handleApproval(business.id, true)}
                                                                disabled={isUpdating}
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleApproval(business.id, false)}
                                                                disabled={isUpdating}
                                                                variant="destructive"
                                                            >
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Reject
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <div className="text-center space-y-2">
                                                            <Badge variant="default" className="text-green-600 bg-green-100">
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                Approved
                                                            </Badge>
                                                            <p className="text-xs text-gray-500">
                                                                Approved on {new Date(business.createdAt).toLocaleDateString()}
                                                            </p>
                                                            <Button
                                                                onClick={() => handleDelete(business.id)}
                                                                disabled={isUpdating}
                                                                variant="destructive"
                                                                size="sm"
                                                                className="w-full"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}