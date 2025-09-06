"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthSession } from "@/hooks/useAuthSession";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { toast } from "react-toastify";
import {
  Calculator,
  Gift,
  CheckCircle,
  AlertCircle,
  UserPlus,
  User,
  Crown,
  Users,
  History,
  Search,
  X,
  IndianRupee,
} from "lucide-react";
import BusinessApprovalWrapper from "@/components/BusinessApprovalWrapper";

type Customer = {
  id: number;
  phone_number: string;
  name?: string | null;
  current_tier_name?: string | null;
  points: number;
  redeemable_points: string | number; // Can be string from DB or number
  is_newly_enrolled?: boolean;
  points_rate: number;
  current_tier: {
    id: number;
    name: string;
    points_to_unlock: number;
    rewards: Reward[];
  };
  monthly_redemptions?: Record<string, number>; // Track monthly redemptions per reward ID
};

type Reward = {
  id: string;
  reward_type: "cashback" | "limited_usage" | "custom";
  percentage?: number;
  reward_text?: string;
  usage_limit_per_month?: number;
  one_time?: boolean;
  name?: string;
  reward?: string;
  redeemed_count?: number;
};

type CustomerListItem = {
  id: number;
  phone_number: string;
  name?: string | null;
  points: number;
  current_tier_name?: string | null;
  last_txn_at?: string | null;
  created_at: string;
};

type MissionRegistry = {
  id: number;
  customer_id: number;
  mission_id: number;
  status: "in_progress" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  discount_amount: string;
  discount_percentage: string;
  notes?: string;
  customer_name: string;
  customer_phone: string;
  mission_title: string;
  mission_description: string;
  mission_offer: string;
};

export default function BusinessCashierPage() {
  const { user, role, loading } = useAuthSession();
  const router = useRouter();

  const [phoneInput, setPhoneInput] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [redeemedRewards, setRedeemedRewards] = useState<Reward[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Customer list modal states
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [customerList, setCustomerList] = useState<CustomerListItem[]>([]);
  const [loadingCustomerList, setLoadingCustomerList] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  // Mission registry states
  const [inProgressMissions, setInProgressMissions] = useState<
    MissionRegistry[]
  >([]);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [selectedMission, setSelectedMission] =
    useState<MissionRegistry | null>(null);
  const [missionNotes, setMissionNotes] = useState("");

  // Manual discount state
  const [manualDiscountAmount, setManualDiscountAmount] = useState("");
  const [manualDiscountPercentage, setManualDiscountPercentage] = useState("");

  // Redeemable points redemption state
  const [redeemablePointsToUse, setRedeemablePointsToUse] = useState("");

  // Fetch missions whenever customer changes
  useEffect(() => {
    if (customer) {
      void fetchInProgressMissions();
    } else {
      setInProgressMissions([]);
    }
  }, [customer]);

  useEffect(() => {
    if (!loading && (!user || role !== "business")) {
      router.push("/login/business");
    }
  }, [loading, user, role, router]);

  const fetchAllCustomers = async () => {
    setLoadingCustomerList(true);
    try {
      const res = await fetch("/api/business/customers");
      if (!res.ok) {
        toast.error("Failed to fetch customers");
        return;
      }
      const data = (await res.json()) as { customers: CustomerListItem[] };
      setCustomerList(data.customers ?? []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Error fetching customers");
    } finally {
      setLoadingCustomerList(false);
    }
  };

  const openCustomerList = () => {
    setShowCustomerList(true);
    void fetchAllCustomers();
  };

  const fetchInProgressMissions = async () => {
    if (!customer) {
      setInProgressMissions([]);
      return;
    }

    console.log("Fetching missions for customer:", customer.id);
    setLoadingMissions(true);
    try {
      const res = await fetch(
        `/api/business/mission-registry?status=in_progress&customer_id=${customer.id}`,
      );
      console.log("Mission fetch response status:", res.status);

      if (!res.ok) {
        toast.error("Failed to fetch in-progress missions");
        return;
      }

      const data = (await res.json()) as { registries: MissionRegistry[] };
      console.log("Mission data received:", data);
      setInProgressMissions(data.registries ?? []);
      console.log("Missions set to state:", data.registries ?? []);
    } catch (error) {
      console.error("Error fetching missions:", error);
      toast.error("Error fetching missions");
    } finally {
      setLoadingMissions(false);
    }
  };

  const completeMission = async (
    registryId: number,
    status: "completed" | "failed",
  ) => {
    try {
      const res = await fetch("/api/business/mission-registry", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registry_id: registryId,
          status,
          notes: missionNotes || undefined,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to complete mission");
        return;
      }

      toast.success(
        `Mission ${status === "completed" ? "completed" : "failed"} successfully`,
      );
      setShowMissionModal(false);
      setSelectedMission(null);
      setMissionNotes("");
      void fetchInProgressMissions(); // Refresh the list
    } catch (error) {
      console.error("Error completing mission:", error);
      toast.error("Error completing mission");
    }
  };

  const selectCustomerFromList = async (selectedCustomer: CustomerListItem) => {
    setPhoneInput(selectedCustomer.phone_number);
    setShowCustomerList(false);

    // Auto-search for the selected customer
    const phoneNumber = parsePhoneNumberFromString(
      selectedCustomer.phone_number,
      "IN",
    );
    if (phoneNumber?.isValid()) {
      const formattedPhone = phoneNumber.format("E.164");
      setLoadingCustomer(true);

      try {
        const res = await fetch(
          `/api/business/customers/search?phone=${encodeURIComponent(formattedPhone)}`,
        );
        if (res.ok) {
          const customerData = (await res.json()) as Customer;
          setCustomer(customerData);

          // Auto-select cashback rewards (they only accumulate points, no immediate discount)
          const cashbackRewards = customerData.current_tier.rewards.filter(
            (reward) =>
              reward.reward_type === "cashback" && canRedeemReward(reward),
          );
          setRedeemedRewards(cashbackRewards);

          setIsNewCustomer(customerData.is_newly_enrolled ?? false);
          toast.success(`Customer selected: ${customerData.name ?? "Unnamed"}`);
          // fetchInProgressMissions will be called automatically by useEffect
        }
      } catch (error) {
        console.error("Error selecting customer:", error);
      } finally {
        setLoadingCustomer(false);
      }
    }
  };

  const filteredCustomers = customerList.filter(
    (customer) =>
      (customer.name
        ?.toLowerCase()
        .includes(customerSearchTerm.toLowerCase()) ??
        false) ||
      customer.phone_number.includes(customerSearchTerm),
  );

  const enterCustomer = async () => {
    if (!phoneInput.trim()) {
      toast.info("Please enter a phone number");
      return;
    }

    const phoneNumber = parsePhoneNumberFromString(phoneInput.trim(), "IN");
    if (!phoneNumber?.isValid()) {
      toast.error("Invalid phone number format");
      return;
    }

    const formattedPhone = phoneNumber.format("E.164");
    setLoadingCustomer(true);

    try {
      const res = await fetch(
        `/api/business/customers/search?phone=${encodeURIComponent(formattedPhone)}`,
      );
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Customer not found. They need to register first.");
          setCustomer(null);
          setIsNewCustomer(false);
        } else {
          toast.error("Failed to find customer");
        }
        return;
      }

      const customerData = (await res.json()) as Customer;
      setCustomer(customerData);

      // Auto-select cashback rewards (they only accumulate points, no immediate discount)
      const cashbackRewards = customerData.current_tier.rewards.filter(
        (reward) =>
          reward.reward_type === "cashback" && canRedeemReward(reward),
      );
      setRedeemedRewards(cashbackRewards);

      setIsNewCustomer(customerData.is_newly_enrolled ?? false);
      toast.success(`Customer entered: ${customerData.name ?? "Unnamed"}`);
      // fetchInProgressMissions will be called automatically by useEffect
    } catch (error) {
      console.error("Error finding customer:", error);
      toast.error("Error finding customer");
    } finally {
      setLoadingCustomer(false);
    }
  };

  const canRedeemReward = (reward: Reward): boolean => {
    // Check if one-time reward was already redeemed
    if (reward.one_time && (reward.redeemed_count ?? 0) > 0) {
      return false;
    }

    // Check monthly usage limit for limited usage rewards
    if (
      reward.reward_type === "limited_usage" &&
      reward.usage_limit_per_month
    ) {
      // Count redemptions in the current month
      const monthlyRedemptions =
        customer?.monthly_redemptions?.[reward.id] ?? 0;

      // Check if monthly limit is reached
      if (monthlyRedemptions >= reward.usage_limit_per_month) {
        return false;
      }
    }

    return true;
  };

  const getRewardValue = (reward: Reward, billAmount: number): number => {
    // Cashback rewards don't provide immediate discounts - they only accumulate points
    if (reward.reward_type === "cashback") {
      return 0;
    }

    // Limited usage rewards don't have automatic value calculation
    // The cashier will handle the reward manually (could be free item, service, etc.)
    if (reward.reward_type === "limited_usage") {
      return 0;
    }

    return 0;
  };

  const toggleReward = (reward: Reward) => {
    if (!canRedeemReward(reward)) return;

    const isRedeemed = redeemedRewards.some((r) => r.id === reward.id);
    if (isRedeemed) {
      setRedeemedRewards((prev) => prev.filter((r) => r.id !== reward.id));
    } else {
      setRedeemedRewards((prev) => [...prev, reward]);
    }
  };

  const calculateFinalAmount = (): number => {
    if (!customer || !billAmount) return 0;

    const bill = parseFloat(billAmount);
    if (isNaN(bill)) return 0;

    let totalDiscount = 0;

    // Add redeemable points discount (from previous cashback accumulation)
    if (redeemablePointsToUse) {
      totalDiscount += parseFloat(redeemablePointsToUse);
    }

    // Add reward discounts (EXCLUDE cashback rewards - they only accumulate points)
    redeemedRewards.forEach((reward) => {
      if (reward.reward_type !== "cashback") {
        totalDiscount += getRewardValue(reward, bill);
      }
    });

    // Add manual discount amount
    if (manualDiscountAmount) {
      totalDiscount += parseFloat(manualDiscountAmount) || 0;
    }

    // Add manual discount percentage
    if (manualDiscountPercentage) {
      const percentageDiscount =
        (bill * (parseFloat(manualDiscountPercentage) || 0)) / 100;
      totalDiscount += percentageDiscount;
    }

    return Math.max(0, bill - totalDiscount);
  };

  const processTransaction = async () => {
    if (!customer || !billAmount) {
      toast.info("Please enter customer and bill amount");
      return;
    }

    const bill = parseFloat(billAmount);
    if (isNaN(bill) || bill <= 0) {
      toast.error("Please enter a valid bill amount");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch("/api/business/customers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          bill_amount: bill,
          redeemable_points_used: parseFloat(redeemablePointsToUse) || 0,
          redeemed_rewards: redeemedRewards.map((reward) => ({
            reward_id: reward.id,
            reward_type: reward.reward_type,
            value: getRewardValue(reward, bill),
          })),
        }),
      });

      if (!res.ok) {
        try {
          const errorData = (await res.json()) as unknown;
          const errorMessage =
            typeof errorData === "object" &&
            errorData !== null &&
            "message" in errorData
              ? String((errorData as { message: unknown }).message)
              : "Failed to process transaction";
          toast.error(errorMessage);
        } catch {
          toast.error("Failed to process transaction");
        }
        return;
      }

      toast.success("Transaction processed successfully!");

      setCustomer(null);
      setPhoneInput("");
      setBillAmount("");
      setRedeemedRewards([]);
      setIsNewCustomer(false);
      setManualDiscountAmount("");
      setManualDiscountPercentage("");
      setRedeemablePointsToUse("");

      toast.info(`Final amount: ₹${calculateFinalAmount().toFixed(2)}`);
    } catch (error) {
      console.error("Error processing transaction:", error);
      toast.error("Error processing transaction");
    } finally {
      setIsProcessing(false);
    }
  };

  const finalAmount = calculateFinalAmount();
  const discountAmount =
    customer && billAmount ? parseFloat(billAmount) - finalAmount : 0;
  const canSubmit = customer && billAmount; // Removed requirement for rewards
  const [hasEditedRedeemable, setHasEditedRedeemable] = useState(false);
  useEffect(() => {
    if (customer && billAmount) {
      const availablePoints = parseFloat(
        customer.redeemable_points?.toString() || "0",
      );
      const bill = parseFloat(billAmount) || 0;
      if (bill > 0 && availablePoints > 0) {
        const maxRedeem = Math.min(availablePoints, bill / 2);
        // Reset if not edited or if the current value is above the new max
        if (
          !hasEditedRedeemable ||
          parseFloat(redeemablePointsToUse) > maxRedeem
        ) {
          setRedeemablePointsToUse(maxRedeem.toFixed(2));
          setHasEditedRedeemable(false);
        }
      } else {
        setRedeemablePointsToUse("");
        setHasEditedRedeemable(false);
      }
    } else {
      setRedeemablePointsToUse("");
      setHasEditedRedeemable(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, billAmount]);


  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <BusinessApprovalWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                Cashier Portal
              </h1>
              <p className="text-gray-600">
                Process customer transactions and redeem loyalty rewards
              </p>
            </div>
            <Button
              onClick={openCustomerList}
              variant="outline"
              className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <Users className="h-4 w-4" />
              View All Customers
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Side - Customer Entry & Bill Input */}
          <div className="space-y-6">
            {/* Customer Entry - Simple and Highlighted */}
            <Card className="border-2 border-blue-300 bg-blue-50 shadow-md">
              <CardHeader className="">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-blue-700">
                  <User className="h-5 w-5" />
                  Enter Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="">
                <div>
                  <Label
                    htmlFor="phone"
                    className="mb-2 font-semibold text-blue-800"
                  >
                    Phone Number
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      placeholder="Enter customer phone number"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && enterCustomer()}
                      className="flex-1 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                    <Button
                      onClick={enterCustomer}
                      disabled={loadingCustomer || !phoneInput.trim()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                    >
                      {loadingCustomer ? "Entering..." : "Enter"}
                    </Button>
                  </div>
                </div>

                {customer && (
                  <div
                    className={`rounded-lg border p-4 shadow-sm ${isNewCustomer ? "border-blue-200 bg-blue-50" : "border-green-200 bg-green-50"}`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      {isNewCustomer ? (
                        <UserPlus className="h-5 w-5 text-blue-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      <span
                        className={`text-base font-semibold ${isNewCustomer ? "text-blue-800" : "text-green-800"}`}
                      >
                        {isNewCustomer
                          ? "New Customer Enrolled"
                          : "Customer Found"}
                      </span>
                    </div>

                    {/* Customer Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          {customer.name ?? "Unnamed Customer"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-gray-700">
                          Tier:{" "}
                          <span className="font-medium">
                            {customer.current_tier_name}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-gray-700">
                          Loyalty Points:{" "}
                          <span className="font-medium">{customer.points}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">
                          Redeemable Cashback:{" "}
                          <span className="font-medium">
                            ₹
                            {parseFloat(
                              customer.redeemable_points?.toString() || "0",
                            ).toFixed(2)}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">
                          Points Rate:{" "}
                          <span className="font-medium">
                            {customer.points_rate || 1} point
                            {(customer.points_rate || 1) === 1 ? "" : "s"} per
                            ₹1
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm text-gray-700">
                          Next Tier:{" "}
                          <span className="font-medium">
                            {customer.current_tier.points_to_unlock >
                            customer.points
                              ? `${customer.current_tier.points_to_unlock - customer.points} points needed`
                              : "Maximum tier reached!"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Clear Customer Button */}
                    <div className="mt-4 border-t border-gray-200 pt-3">
                      <Button
                        onClick={() => {
                          setCustomer(null);
                          setPhoneInput("");
                          setRedeemedRewards([]);
                          setIsNewCustomer(false);
                          setInProgressMissions([]);
                          setManualDiscountAmount("");
                          setManualDiscountPercentage("");
                          setRedeemablePointsToUse("");
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear Customer
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bill Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Bill Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bill">Bill Amount (₹)</Label>
                  <Input
                    id="bill"
                    type="number"
                    placeholder="0.00"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="mt-1 text-lg"
                    min="0"
                  />
                </div>

                {/* Manual Discount Input */}
                {billAmount && customer && (
                  <div className="space-y-3">
                    {/* Redeemable Points Redemption */}
                    {parseFloat(customer.redeemable_points?.toString() || "0") >
                      0 && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <Label
                          htmlFor="redeemablePoints"
                          className="text-sm font-medium text-green-800"
                        >
                          Use Redeemable Cashback (Available: ₹
                          {parseFloat(
                            customer.redeemable_points?.toString() || "0",
                          ).toFixed(2)}
                          )
                        </Label>
                        <Input
                          id="redeemablePoints"
                          type="number"
                          placeholder="0.00"
                          value={redeemablePointsToUse}
                          value={redeemablePointsToUse}
                          onChange={(e) => {
                            setHasEditedRedeemable(true);
                            const value = parseFloat(e.target.value) || 0;
                            const availablePoints = parseFloat(
                              customer.redeemable_points?.toString() || "0",
                            );
                            const bill = parseFloat(billAmount) || 0;
                            const maxValue = Math.min(
                              value,
                              availablePoints,
                              bill / 2,
                            );
                            setRedeemablePointsToUse(maxValue.toString());
                          }}
                          className="mt-1 border-green-300 text-sm focus:border-green-500"
                          min="0"
                          max={Math.min(
                            parseFloat(
                              customer.redeemable_points?.toString() || "0",
                            ),
                            parseFloat(billAmount) / 2 || 0,
                          )}
                          step="0.01"
                        />
                        <div className="mt-1 text-xs text-green-600">
                          Max: ₹
                          {Math.min(
                            parseFloat(
                              customer.redeemable_points?.toString() || "0",
                            ),
                            parseFloat(billAmount) || 0,
                          ).toFixed(2)}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label
                          htmlFor="manualDiscountAmount"
                          className="text-sm text-gray-600"
                        >
                          Manual Discount Amount (₹)
                        </Label>
                        <Input
                          id="manualDiscountAmount"
                          type="number"
                          placeholder="0.00"
                          value={manualDiscountAmount}
                          onChange={(e) =>
                            setManualDiscountAmount(e.target.value)
                          }
                          className="mt-1 text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="manualDiscountPercentage"
                          className="text-sm text-gray-600"
                        >
                          Manual Discount (%)
                        </Label>
                        <Input
                          id="manualDiscountPercentage"
                          type="number"
                          placeholder="0"
                          value={parseFloat(
                            manualDiscountPercentage,
                          ).toString()}
                          onChange={(e) =>
                            setManualDiscountPercentage(e.target.value)
                          }
                          className="mt-1 text-sm"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {billAmount && customer && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-800">Bill Amount:</span>
                      <span className="font-bold text-blue-900">
                        ₹{parseFloat(billAmount).toFixed(2)}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-green-700">
                            Total Discount:
                          </span>
                          <span className="font-bold text-green-800">
                            -₹{discountAmount.toFixed(2)}
                          </span>
                        </div>

                        {/* Discount Breakdown */}
                        <div className="space-y-1 border-l-2 border-green-200 pl-2 text-xs text-green-600">
                          {redeemablePointsToUse && (
                            <div className="flex justify-between">
                              <span>Redeemable Cashback:</span>
                              <span>
                                -₹{parseFloat(redeemablePointsToUse).toFixed(2)}
                              </span>
                            </div>
                          )}
                          {manualDiscountAmount && (
                            <div className="flex justify-between">
                              <span>Manual Amount:</span>
                              <span>
                                -₹{parseFloat(manualDiscountAmount).toFixed(2)}
                              </span>
                            </div>
                          )}
                          {manualDiscountPercentage && (
                            <div className="flex justify-between">
                              <span>
                                Manual Percentage (
                                {parseFloat(manualDiscountPercentage).toFixed(
                                  1,
                                )}
                                %):
                              </span>
                              <span>
                                -₹
                                {(
                                  (parseFloat(billAmount) *
                                    parseFloat(manualDiscountPercentage)) /
                                  100
                                ).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between border-t border-blue-200 pt-2">
                      <span className="font-semibold text-blue-900">
                        Final Amount:
                      </span>
                      <span className="text-xl font-bold text-blue-900">
                        ₹{finalAmount.toFixed(2)}
                      </span>
                    </div>

                    {/* Points to be earned */}
                    <div className="mt-3 border-t border-blue-200 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-800">Points to Earn:</span>
                        <span className="font-bold text-blue-900">
                          {Math.floor(
                            parseFloat(billAmount) *
                              (customer.points_rate || 1),
                          )}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-blue-600">
                        Rate: {customer.points_rate || 1} point
                        {(customer.points_rate || 1) === 1 ? "" : "s"} per ₹1
                      </div>
                    </div>

                    {/* Cashback Rewards Info */}
                    {redeemedRewards.some(
                      (r) => r.reward_type === "cashback",
                    ) && (
                      <div className="mt-3 border-t border-blue-200 pt-3">
                        <div className="mb-2 flex items-center gap-2">
                          <Gift className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Cashback Rewards Active
                          </span>
                        </div>
                        <div className="text-xs text-green-600">
                          Cashback rewards will accumulate as redeemable points
                          for future visits
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button - Show after bill amount entry */}
                {canSubmit && (
                  <Button
                    onClick={processTransaction}
                    disabled={isProcessing}
                    className="w-full bg-green-600 py-3 text-lg text-white hover:bg-green-700"
                  >
                    {isProcessing ? (
                      "Processing Transaction..."
                    ) : (
                      <>
                        <IndianRupee className="mr-2 h-5 w-5" />
                        Process Transaction - Final Amount: ₹
                        {finalAmount.toFixed(2)}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Available Rewards & In-Progress Missions */}
          <div className="space-y-6">
            {/* In-Progress Missions - Only show if there are missions */}
            {inProgressMissions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    In-Progress Missions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingMissions ? (
                    <div className="py-4 text-center">
                      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"></div>
                      <p className="mt-2 text-sm text-gray-500">
                        Loading missions...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inProgressMissions.map((mission) => (
                        <div
                          key={mission.id}
                          className="rounded-lg border p-3 hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <Badge className="bg-blue-100 text-blue-800">
                                  {mission.mission_title}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {mission.mission_offer}
                                </Badge>
                              </div>
                              <p className="mb-2 text-sm text-gray-700">
                                {mission.mission_description}
                              </p>
                              <div className="space-y-1 text-xs text-gray-500">
                                <p>
                                  Customer: {mission.customer_name} (
                                  {mission.customer_phone})
                                </p>
                                <p>
                                  Started:{" "}
                                  {new Date(
                                    mission.started_at,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedMission(mission);
                                setShowMissionModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Complete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Available Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!customer ? (
                  <div className="py-8 text-center text-gray-500">
                    <User className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <p>Enter a customer to see available rewards</p>
                  </div>
                ) : customer.current_tier.rewards.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <Gift className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <p>No rewards available for this tier</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Customer can still earn points!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customer.current_tier.rewards.map((reward) => {
                      const canRedeem = canRedeemReward(reward);
                      const isRedeemed = redeemedRewards.some(
                        (r) => r.id === reward.id,
                      );

                      return (
                        <div
                          key={reward.id}
                          className={`rounded-lg border p-4 transition-all ${
                            isRedeemed
                              ? "border-green-500 bg-green-50"
                              : canRedeem
                                ? "cursor-pointer border-gray-200 hover:border-indigo-300"
                                : "border-gray-200 bg-gray-50 opacity-60"
                          }`}
                          onClick={() => canRedeem && toggleReward(reward)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <Badge
                                  className={
                                    reward.reward_type === "cashback"
                                      ? "bg-green-100 text-green-800"
                                      : reward.reward_type === "limited_usage"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-purple-100 text-purple-800"
                                  }
                                >
                                  {reward.reward_type.replace("_", " ")}
                                </Badge>
                                {reward.one_time && (
                                  <Badge variant="outline" className="text-xs">
                                    One-time
                                  </Badge>
                                )}
                              </div>

                              <h4 className="font-medium text-gray-900">
                                {reward.reward_type === "cashback" &&
                                  `${reward.percentage}% Cashback`}
                                {reward.reward_type === "limited_usage" &&
                                  reward.reward_text}
                                {reward.reward_type === "custom" &&
                                  `${reward.name}: ${reward.reward}`}
                              </h4>

                              {reward.reward_type === "cashback" &&
                                billAmount && (
                                  <p className="mt-1 text-sm text-green-600">
                                    Will accumulate {reward.percentage}% as
                                    redeemable points
                                  </p>
                                )}

                              {reward.reward_type === "limited_usage" && (
                                <p className="mt-1 text-sm text-blue-600">
                                  Manual reward - handle at checkout
                                </p>
                              )}

                              {reward.usage_limit_per_month && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Usage:{" "}
                                  {reward.usage_limit_per_month === 1
                                    ? "Monthly"
                                    : reward.usage_limit_per_month === 0.5
                                      ? "Bi-monthly"
                                      : `${reward.usage_limit_per_month} times per month`}
                                  {customer?.monthly_redemptions?.[
                                    reward.id
                                  ] !== undefined && (
                                    <span className="ml-2 text-blue-600">
                                      (Used:{" "}
                                      {customer.monthly_redemptions[reward.id]}/
                                      {reward.usage_limit_per_month})
                                    </span>
                                  )}
                                </p>
                              )}

                              {reward.reward_type === "limited_usage" &&
                                reward.usage_limit_per_month && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    Usage:{" "}
                                    {reward.usage_limit_per_month === 1
                                      ? "Monthly"
                                      : reward.usage_limit_per_month === 0.5
                                        ? "Bi-monthly"
                                        : `${reward.usage_limit_per_month} times per month`}
                                    {customer?.monthly_redemptions?.[
                                      reward.id
                                    ] !== undefined && (
                                      <span className="ml-2 text-blue-600">
                                        (Used:{" "}
                                        {
                                          customer.monthly_redemptions[
                                            reward.id
                                          ]
                                        }
                                        /{reward.usage_limit_per_month})
                                      </span>
                                    )}
                                  </p>
                                )}

                              {!canRedeem && (
                                <p className="mt-1 text-xs font-medium text-red-500">
                                  {reward.one_time &&
                                  (reward.redeemed_count ?? 0) > 0
                                    ? "Already redeemed"
                                    : "Not available"}
                                </p>
                              )}
                            </div>

                            <div className="ml-4">
                              {isRedeemed ? (
                                <CheckCircle className="h-6 w-6 text-green-600" />
                              ) : !canRedeem ? (
                                <AlertCircle className="h-6 w-6 text-gray-400" />
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                >
                                  Redeem
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Customer List Modal */}
        {showCustomerList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    All Customers
                  </h2>
                </div>
                <Button
                  onClick={() => setShowCustomerList(false)}
                  variant="outline"
                  size="sm"
                  className="hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Bar */}
              <div className="border-b border-gray-100 p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    placeholder="Search customers by name or phone..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Customer List */}
              <div className="max-h-[60vh] overflow-y-auto">
                {loadingCustomerList ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Loading customers...</div>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Users className="mb-3 h-12 w-12 text-gray-300" />
                    <p className="text-gray-500">No customers found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => selectCustomerFromList(customer)}
                        className="cursor-pointer p-4 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                                <User className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {customer.name ?? "Unnamed Customer"}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {customer.phone_number}
                                </p>
                              </div>
                            </div>

                            <div className="ml-13 flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Crown className="h-3 w-3 text-yellow-500" />
                                <span>
                                  {customer.current_tier_name ?? "No Tier"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Gift className="h-3 w-3 text-purple-500" />
                                <span>{customer.points} points</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <History className="h-3 w-3 text-blue-500" />
                                <span>
                                  {customer.last_txn_at
                                    ? `Last: ${new Date(customer.last_txn_at).toLocaleDateString()}`
                                    : "No transactions"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <Badge variant="outline" className="mb-1">
                              {customer.current_tier_name ?? "No Tier"}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              Joined:{" "}
                              {new Date(
                                customer.created_at,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 bg-gray-50 p-6">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Total customers: {filteredCustomers.length}</span>
                  <span>Click on a customer to select them</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mission Completion Modal */}
        {showMissionModal && selectedMission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Complete Mission</h3>

                <div className="mb-4">
                  <p className="mb-2 text-sm text-gray-600">
                    Mission: {selectedMission.mission_title}
                  </p>
                  <p className="mb-2 text-sm text-gray-600">
                    Customer: {selectedMission.customer_name}
                  </p>

                  {/* Prominent Offer Display */}
                  <div className="mt-3 rounded-lg border-2 border-dotted border-blue-300 bg-blue-50 p-3">
                    <p className="mb-1 text-sm font-medium text-blue-800">
                      Mission Offer:
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {selectedMission.mission_offer}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mission-notes">Notes (Optional)</Label>
                    <Input
                      id="mission-notes"
                      placeholder="Add any notes about mission completion..."
                      value={missionNotes}
                      onChange={(e) => setMissionNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() =>
                      completeMission(selectedMission.id, "completed")
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Complete Mission
                  </Button>
                  <Button
                    onClick={() =>
                      completeMission(selectedMission.id, "failed")
                    }
                    variant="outline"
                    className="flex-1"
                  >
                    Mark Failed
                  </Button>
                  <Button
                    onClick={() => {
                      setShowMissionModal(false);
                      setSelectedMission(null);
                      setMissionNotes("");
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BusinessApprovalWrapper>
  );
}
