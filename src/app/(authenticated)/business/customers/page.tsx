'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthSession } from '@/hooks/useAuthSession';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { toast } from 'react-toastify';

type BusinessCustomer = {
  id: number;
  phone_number: string;
  name?: string | null;
  current_tier_name?: string | null;
};

type GetCustomersResponse = {
  customers: BusinessCustomer[];
};

type PostAddResponse = {
  added: boolean;
  customer_id: number;
  customer: {
    id: number;
    phone_number: string;
    name?: string | null;
  };
  loyalty?: any;
};

export default function BusinessCustomersPage() {
  const { user, role, loading } = useAuthSession();
  const router = useRouter();

  const [customers, setCustomers] = useState<BusinessCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  async function loadCustomers() {
    try {
      setLoadingCustomers(true);
      const res = await fetch('/api/business/customers', { cache: 'no-store' });
      if (!res.ok){
        toast.error('Failed to fetch customers');
        throw new Error('Failed to fetch customers');
      } 
      const data: GetCustomersResponse = await res.json();
      setCustomers(Array.isArray(data?.customers) ? data.customers : []);
    } catch (err) {
      console.error(err);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function handleAddCustomerSubmit() {
    if (!phoneInput.trim()) {
      toast.info('Enter a phone number');
      return;
    }
    const phoneNumber = parsePhoneNumberFromString(phoneInput.trim(), 'IN');

    if (!phoneNumber || !phoneNumber.isValid()) {
      toast.error('Invalid phone number format.');
      return;
    }
    const formattedPhone = phoneNumber.format('E.164');

    try {
      const res = await fetch('/api/business/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: formattedPhone }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData?.error || 'Failed to add/find customer');
        return;
      }

      const data: PostAddResponse = await res.json();

      setShowAddModal(false);
      setPhoneInput('');
      toast.success('Customer successfully added!');
      await loadCustomers();
    } catch (e) {
      console.error(e);
      toast.error('Error adding customer');
    }
  }

  useEffect(() => {
    if (!loading) {
      if (!user || role !== 'business') {
        router.push('/login/business');
      } else {
        loadCustomers();
      }
    }
  }, [loading, user, role]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return customers;
    return customers.filter((c) => c.phone_number?.includes(q));
  }, [customers, search]);

  if (loading || loadingCustomers) {
    return <div className="p-6">Loading customers...</div>;
  }

return (
  <div className="container mx-auto py-8 px-4">
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
      <h1 className="text-3xl font-bold">Customers</h1>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Input
          placeholder="Search by phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <Button className="w-full sm:w-auto" onClick={() => setShowAddModal(true)}>
          Add Customer
        </Button>
      </div>
    </div>

    {showAddModal && (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Add or Link Customer</h2>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Phone Number"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setShowAddModal(false);
                setPhoneInput('');
              }}
            >
              Cancel
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleAddCustomerSubmit}>
              Add
            </Button>
          </div>
        </div>
      </div>
    )}

    <div className="grid gap-4">
      {filtered.length ? (
        filtered.map((customer) => (
          <Card
            key={customer.id}
            className="cursor-pointer hover:shadow-lg transition"
            onClick={() => router.push(`/business/customers/${customer.id}`)}
          >
            <CardHeader>
              <CardTitle>{customer.name ?? 'Unnamed Customer'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Phone: {customer.phone_number}</p>
              {customer.current_tier_name && (
                <p>Tier: {customer.current_tier_name}</p>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-gray-600">No customers found.</p>
      )}
    </div>
  </div>
);
}