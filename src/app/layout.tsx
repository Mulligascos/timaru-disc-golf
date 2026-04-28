import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#111827",
};

export const metadata: Metadata = {
  title: {
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME ?? "Disc Golf Club"}`,
    default: process.env.NEXT_PUBLIC_APP_NAME ?? "Disc Golf Club",
  },
  description: "Your disc golf club management app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TDG",
  },
};

// This script runs before React hydrates, preventing theme flash
// and ensuring CSS variables are always set on navigation
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('tdg-theme');
    var settings = stored ? JSON.parse(stored) : { mode: 'light', accentColour: '#22c55e' };
    var root = document.documentElement;

    // Apply dark/light class
    if (settings.mode === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--bg-primary', '#001111');
      root.style.setProperty('--bg-card', '#112222');
      root.style.setProperty('--text-primary', '#f1f5f9');
      root.style.setProperty('--text-secondary', '#94a3b8');
      root.style.setProperty('--border-colour', '#222222');
    } else {
      root.style.setProperty('--bg-primary', '#f9fafb');
      root.style.setProperty('--bg-card', '#ffffff');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#373a41');
      root.style.setProperty('--border-colour', '#b4b6b8');
    }

    // Apply accent colour
    var hex = settings.accentColour || '#22c55e';
    var r = parseInt(hex.slice(1,3),16)/255;
    var g = parseInt(hex.slice(3,5),16)/255;
    var b = parseInt(hex.slice(5,7),16)/255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    var h=0, s=0, l=(max+min)/2;
    if (max !== min) {
      var d = max-min;
      s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      if (max===r) h=((g-b)/d+(g<b?6:0))/6;
      else if (max===g) h=((b-r)/d+2)/6;
      else h=((r-g)/d+4)/6;
    }
    h=Math.round(h*360); s=Math.round(s*100); l=Math.round(l*100);
    root.style.setProperty('--accent-500', 'hsl('+h+','+s+'%,'+l+'%)');
    root.style.setProperty('--accent-600', 'hsl('+h+','+s+'%,'+Math.max(l-8,20)+'%)');
    root.style.setProperty('--accent-50', 'hsl('+h+','+s+'%,97%)');
    root.style.setProperty('--accent-100', 'hsl('+h+','+s+'%,93%)');
    root.style.setProperty('--accent-200', 'hsl('+h+','+s+'%,86%)');
    root.style.setProperty('--accent-300', 'hsl('+h+','+s+'%,75%)');
    root.style.setProperty('--accent-700', 'hsl('+h+','+s+'%,'+Math.max(l-18,15)+'%)');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Run before paint to prevent theme flash on every navigation */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
