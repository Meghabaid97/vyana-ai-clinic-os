import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration.
 *
 * - DEV (hot-reload from Lovable sandbox): keep `server.url` set.
 * - PROD (App Store / TestFlight / installable build): set CAP_MODE=prod
 *   so the native app loads the bundled `dist/` instead of the web preview.
 *
 *   Build the prod iOS app:
 *     npm run build
 *     CAP_MODE=prod npx cap sync ios
 *     CAP_MODE=prod npx cap open ios
 */
const isProd = process.env.CAP_MODE === 'prod';

const config: CapacitorConfig = {
  appId: 'com.vyana.health',
  appName: 'Vyana',
  webDir: 'dist',
  ...(isProd
    ? {
        // Production: load bundled assets, never the live website
        server: {
          androidScheme: 'https',
          iosScheme: 'vyana',
        },
      }
    : {
        // Dev: hot-reload from the Lovable sandbox preview
        server: {
          url: 'https://7c435247-6dc0-4b68-9808-f61158e40739.lovableproject.com?forceHideBadge=true',
          cleartext: true,
          iosScheme: 'lovable',
        },
      }),
  ios: {
    // Status bar / home indicator clearance is handled in CSS via the
    // .safe-area-top / .safe-area-bottom utilities (env(safe-area-inset-*)).
    // Using contentInset:'always' on top of that creates a double inset
    // that shows up as a thick empty band under the status bar.
    contentInset: 'never',
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
