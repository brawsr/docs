import { Provider } from '@/components/provider';
import '@fontsource-variable/spline-sans/wght.css';
import '@fontsource-variable/source-sans-3/wght.css';
import '@fontsource/commit-mono/400.css';
import '@fontsource/commit-mono/500.css';
import './global.css';

export const metadata = {
  metadataBase: new URL('https://docs.brawsr.io'),
  title: {
    default: 'brawsr docs',
    template: '%s · brawsr docs',
  },
  description: 'Build reliable browser automation with explicit checkpoints, rewind, and fork.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
