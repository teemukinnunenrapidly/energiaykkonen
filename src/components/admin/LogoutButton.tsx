'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': getCsrfToken(),
        },
      });

      if (response.ok) {
        // Redirect to login page
        router.push('/admin/login');
        router.refresh(); // Refresh to clear server-side session
      } else {
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isLoading}
      className="text-sm"
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  );
}

function getCsrfToken(): string {
  if (typeof document === 'undefined') {
    return '';
  }
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='));
  return match ? decodeURIComponent(match.split('=')[1]) : '';
}
