import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SplitPay',
  description: 'Group contributions and transparent payment distribution.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
