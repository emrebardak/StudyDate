// Supabase client singleton for StudyMatch (React Native).
//
// React Native specifics:
//   * `react-native-url-polyfill/auto` — RN has no full WHATWG `URL`; supabase-js needs it.
//   * AsyncStorage — persists the auth session across app restarts (RN has no localStorage).
//   * detectSessionInUrl: false — there is no URL to parse a session out of in a native app.
//
// The URL/key below are the Supabase CLI's LOCAL dev values (from `npx supabase status`).
// They are the shared, non-secret defaults baked into every local Supabase install — safe
// to commit for local development. Swap these for the hosted project's values in Phase 6
// (ideally via env/config rather than editing this file).

import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// LOCAL DEV — replace with hosted values in Phase 6.
//
// `127.0.0.1` means "this device" — on the Android emulator that's the emulator's own
// loopback, NOT the host machine running `supabase start`. Android's AVD provides a
// special alias, `10.0.2.2`, that routes to the host's localhost. iOS Simulator shares
// the host's network directly, so `127.0.0.1` works there unmodified. A real physical
// device needs the host's actual LAN IP instead of either of these — not handled below.
const SUPABASE_URL = Platform.select({
  android: 'http://10.0.2.2:54321',
  default: 'http://127.0.0.1:54321',
});
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
