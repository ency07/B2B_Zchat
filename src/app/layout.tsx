import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP B2B Premium",
  description: "Core modular B2B ERP with RLS multi-tenancy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Synchronous inline script placed inside ThemeProvider to execute immediately after next-themes' script and override theme/colors for tenants */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  const params = new URLSearchParams(window.location.search);
                  const tenant = params.get('tenant');
                  if (tenant) {
                    const cached = localStorage.getItem('tenant_config_' + tenant);
                    if (cached) {
                      const config = JSON.parse(cached);
                      if (config.theme === 'dark') {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                      }
                      if (config.primaryColor) {
                        document.documentElement.style.setProperty('--primary', config.primaryColor);
                        document.documentElement.style.setProperty('--ring', config.primaryColor);
                      }
                    } else {
                      // Fallback a valores estáticos iniciales
                      let primary = null;
                      if (tenant === 'apex') {
                        document.documentElement.classList.add('dark');
                        primary = '142 72% 29%';
                      } else if (tenant === 'acme' || tenant === 'ventitech') {
                        document.documentElement.classList.add('dark');
                        primary = '199 89% 48%';
                      }
                      if (primary) {
                        document.documentElement.style.setProperty('--primary', primary);
                        document.documentElement.style.setProperty('--ring', primary);
                      }
                    }
                  }
                } catch (e) {}
              `,
            }}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
