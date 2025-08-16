import { redirect } from 'next/navigation';
import { getCustomerFromSession } from '@/lib/session';
import CustomerProfileForm from '../../../../components/customerProfileForm';

export default async function CustomerProfilePage() {
  const user = await getCustomerFromSession();
  
  if (!user) {
    redirect('/login/customer');
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white">
      <CustomerProfileForm user={{
        ...user,
        is_setup_complete: user.is_setup_complete ?? false
      }} />
    </div>
  );
}