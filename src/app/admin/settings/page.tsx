import { redirect } from 'next/navigation';

export default async function AdminSettingsPage() {
  // For now, redirect to main admin page since we're focusing on leads management
  redirect('/admin');
}
