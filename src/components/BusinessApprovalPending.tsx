import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, AlertCircle } from "lucide-react";

export default function BusinessApprovalPending() {
    return (
        <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg text-yellow-800">
                            Approval Pending
                        </CardTitle>
                        <CardDescription className="text-yellow-700">
                            Your business registration is under review
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-2">
                                Your business account is currently pending admin approval.
                            </p>
                            <p>
                                Our team is reviewing your registration details. This process typically takes 24-48 hours.
                                You&apos;ll be able to access all features once approved.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-2">
                                Need assistance or have questions?
                            </p>
                            <p>
                                Contact our support team at{" "}
                                <a
                                    href="mailto:retenza24@gmail.com"
                                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                                >
                                    retenza24@gmail.com
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-2">
                    <p className="text-xs text-yellow-600">
                        You&apos;ll receive an email notification once your account is approved.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
} 