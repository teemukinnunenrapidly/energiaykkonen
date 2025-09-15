export default function PDFSettingsPage() {
  if (typeof window !== 'undefined') {
    window.location.replace('/admin');
  }
  return null;
}
