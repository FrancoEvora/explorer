(() => {
  'use strict';
  const SUPABASE_URL = 'https://qlatvknnzejjljbottxb.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Mzk6IxB1ituBQp5nEl1npQ_XzxCpfVM';
  const APP_VERSION = '4.0.0';
  const MEDIA_BUCKET = 'explorer-media';
  const APP_URL = 'https://explorer-six-self.vercel.app';
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
  });
  window.Explorer = {
    config: { SUPABASE_URL, SUPABASE_KEY, APP_VERSION, MEDIA_BUCKET, APP_URL },
    supabase: client,
    state: {
      user: null,
      profile: null,
      emergencyContact: null,
      guestMode: false,
      activeTrail: null,
      trailPoints: [],
      trailPaused: false,
      trailStartedAtMs: 0,
      pauseStartedAtMs: 0,
      pausedMs: 0,
      currentLocation: null,
      map: null,
      wakeLock: null,
      mapLayers: {},
      feedType: 'all',
      communityItems: [],
      permissions: JSON.parse(localStorage.getItem('explorer-permissions-v4') || '{}')
    },
    utils: {}
  };
})();
