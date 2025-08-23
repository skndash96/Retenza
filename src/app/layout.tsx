import "../styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
  title: "Retenza",
  description: "Loyalty Platform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.json",
  themeColor: "#317EFB",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', async () => {
                  try {
                    // Register our standalone service worker
                    const registration = await navigator.serviceWorker.register('/sw-standalone.js');
                    console.log('Standalone SW registered successfully:', registration);
                    
                    // Request notification permission
                    if ('Notification' in window && Notification.permission === 'default') {
                      const permission = await Notification.requestPermission();
                      console.log('Notification permission:', permission);
                    }
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                      console.log('Service Worker update found');
                      const newWorker = registration.installing;
                      newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          console.log('New service worker available');
                        }
                      });
                    });
                  } catch (err) {
                    console.log('SW registration failed:', err);
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
