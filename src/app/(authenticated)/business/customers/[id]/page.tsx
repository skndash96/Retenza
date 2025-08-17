'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthSession } from '@/hooks/useAuthSession';
import { toast } from 'react-toastify';

interface Transaction {
  id: number;
  bill_amount: number;
  points_awarded: number;
  created_at: string;
}

interface Loyalty {
  points: number;
  current_tier_name: string;
}

interface Customer {
  id: number;
  name: string | null;
  phone_number: string;
  gender: string | null;
  dob: string | null;
  anniversary: string | null;
  is_setup_complete: boolean;
  created_at: string;
  updated_at: string;
}

export default function CustomerDetailPage() {
  const { user, role, loading } = useAuthSession();
  const router = useRouter();
  const params = useParams();
  const customerId = params.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [billAmount, setBillAmount] = useState('');
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomer = useCallback(async () => {
    setLoadingCustomer(true);
    try {
      const res = await fetch(`/api/business/customers/${String(customerId)}`);
      if (!res.ok){
        toast.error('Failed to fetch customer details');
        throw new Error('Failed to fetch customer');
      } 
      const data = await res.json() as {
        customer: Customer;
        loyalty: Loyalty;
        transactions?: Transaction[];
      };
      setCustomer(data.customer);
      setLoyalty(data.loyalty);
      setTransactions(data.transactions ?? []);
    } catch (err) {
      console.error(err);
      setCustomer(null);
      setLoyalty(null);
      setTransactions([]);
    } finally {
      setLoadingCustomer(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (!loading) {
      if (!user || role !== 'business') {
        router.push('/login/business');
      } else {
        void fetchCustomer();
      }
    }
  }, [loading, user, role, router, fetchCustomer]);

  async function handleAddTransaction() {
    if (!billAmount || isNaN(Number(billAmount))) {
      toast.error('Enter a valid bill amount');
      setError('Enter a valid bill amount');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/business/customers/${String(customerId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bill_amount: Number(billAmount) }),
      });
      if (!res.ok) throw new Error('Failed to add transaction');

      const data = await res.json() as { transaction: Transaction };

      setTransactions((prev) => [data.transaction, ...prev]);
      await fetchCustomer();
      setBillAmount('');
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = (err as Error)?.message ?? 'Failed to add transaction. Something went wrong.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || loadingCustomer) return <div>Loading customer...</div>;
  if (!customer) return <div>Customer not found.</div>;

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{customer.name ?? 'Unnamed Customer'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Phone: {customer.phone_number}</p>
          <p>Gender: {customer.gender ?? 'N/A'}</p>
          <p>
            DOB: {customer.dob
              ? new Date(customer.dob).toLocaleDateString('en-CA')
              : 'N/A'}
          </p>
          <p>
            Anniversary: {customer.anniversary
              ? new Date(customer.anniversary).toLocaleDateString('en-CA')
              : 'N/A'}
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Loyalty Info</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Points: {loyalty?.points ?? 0}</p>
          <p>Tier: {loyalty?.current_tier_name ?? 'N/A'}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Record New Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Bill amount"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
            />
            <Button onClick={handleAddTransaction} disabled={submitting}>
              {submitting ? 'Saving...' : 'Add'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 && <p>No transactions yet.</p>}
          {transactions.length > 0 && (
            <div className="grid gap-2">
              {transactions.map((txn) => (
                <Card key={txn.id} className="p-2">
                  <p>Bill Amount: {txn.bill_amount}</p>
                  <p>Points Awarded: {txn.points_awarded}</p>
                  <p>Date: {new Date(txn.created_at).toLocaleString()}</p>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}