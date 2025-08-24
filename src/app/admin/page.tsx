import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel - E1 Calculator',
  description: 'Lead management and analytics for E1 Calculator',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">
            Manage leads and view analytics for the E1 Calculator
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Admin panel functionality will be implemented in later tasks
            </p>
            <p className="text-sm text-gray-400 mt-2">
              This includes lead management, CSV export, and statistics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
