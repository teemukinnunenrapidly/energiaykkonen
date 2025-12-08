import type { Metadata } from 'next';
import './embed.css';

export const metadata: Metadata = {
  title: 'Energialaskelma - Energiaykkönen',
  description: 'Laske kuinka paljon säästäisit ilmavesilämpöpumpulla',
  robots: 'noindex, nofollow',
};

export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
