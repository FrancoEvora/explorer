(() => {
  'use strict';

  const SUPABASE_URL = 'https://qlatvknnzejjljbottxb.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Mzk6IxB1ituBQp5nEl1npQ_XzxCpfVM';
  const APP_VERSION = '1.0.0';
  const MEDIA_BUCKET = 'explorer-media';
  const OWNER_EMAIL = 'franco@evoraurbanismo.com.br';

  let client = null;
  let user = null;
  let callbacks = {};
  let latestState = null;
  let syncTimer = null;
  let syncPromise = null;
  let lastSnapshotAt = 0;
  let authBound = false;
  let activeUserId = '';

  function byId(id) {
    return document.getElementById(id);
  }

  function setStatus(text, tone = 'muted') {
    callbacks.onStatus?.({ text, tone });
    const status = byId('cloudStatus');
    if (status) {
      status.textContent = text;
      status.className = `pill ${tone}`;
    }
  }

  function setAuthMessage(message, tone = 'muted') {
    const el = byId('authMessage');
    if (!el) return;
    el.textContent = message || '';
    el.dataset.tone = tone;
  }

  function setAuthBusy(busy) {
    ['btnSignIn', 'btnSignUp'].forEach((id) => {
      const button = byId(id);
      if (button) button.disabled = busy;
    });
  }

  function showAuth() {
    byId('authGate')?.classList.remove('hidden');
    byId('appShell')?.classList.add('hidden');
  }

  function showApp() {
    byId('authGate')?.classList.add('hidden');
    byId('appShell')?.classList.remove('hidden');
  }

  async function start(options = {}) {
    callbacks = options;
    bindAuthControls();

    if (!window.supabase?.createClient) {
      setAuthMessage('Não foi possível carregar a conexão segura. Verifique a internet e atualize a página.', 'error');
      showAuth();
      return;
    }

    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    setStatus('conectando', 'muted');
    const { data, error } = await client.auth.getSession();
    if (error) console.warn('Falha ao recuperar sessão', error);

    if (data?.session?.user) {
      await handleAuthenticated(data.session.user);
    } else {
      showAuth();
      setStatus(navigator.onLine ? 'aguardando login' : 'offline', navigator.onLine ? 'muted' : 'danger');
    }

    client.auth.onAuthStateChange((event, session) => {
      window.setTimeout(async () => {
        if (session?.user) {
          await handleAuthenticated(session.user);
        } else if (event === 'SIGNED_OUT') {
          user = null;
          activeUserId = '';
          showAuth();
          setStatus('sessão encerrada', 'muted');
          callbacks.onSignedOut?.();
        }
      }, 0);
    });
  }

  async function handleAuthenticated(nextUser) {
    user = nextUser;
    showApp();
    const email = byId('signedUserEmail');
    if (email) email.textContent = nextUser.email || 'usuário autenticado';
    setAuthMessage('');
    setStatus('sincronizando', 'muted');

    if (activeUserId === nextUser.id) return;
    activeUserId = nextUser.id;
    await callbacks.onAuthenticated?.(nextUser);
  }

  function bindAuthControls() {
    if (authBound) return;
    authBound = true;

    byId('btnSignIn')?.addEventListener('click', signIn);
    byId('btnSignUp')?.addEventListener('click', signUp);
    byId('btnSignOut')?.addEventListener('click', signOut);
    byId('authForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      signIn();
    });
  }

  function getCredentials() {
    return {
      email: byId('authEmail')?.value.trim() || '',
      password: byId('authPassword')?.value || '',
    };
  }

  async function signIn() {
    if (!client) return;
    const { email, password } = getCredentials();
    if (email.toLowerCase() !== OWNER_EMAIL) {
      setAuthMessage('Esta instalação do Explorer é privada e vinculada ao e-mail do proprietário.', 'error');
      return;
    }
    if (!email || password.length < 6) {
      setAuthMessage('Informe um e-mail válido e uma senha com pelo menos 6 caracteres.', 'error');
      return;
    }
    setAuthBusy(true);
    setAuthMessage('Entrando…');
    const { error } = await client.auth.signInWithPassword({ email, password });
    setAuthBusy(false);
    if (error) {
      setAuthMessage('Não foi possível entrar. Confira o e-mail, a senha e a confirmação da conta.', 'error');
      return;
    }
    setAuthMessage('Acesso autorizado.', 'ok');
  }

  async function signUp() {
    if (!client) return;
    const { email, password } = getCredentials();
    if (email.toLowerCase() !== OWNER_EMAIL) {
      setAuthMessage('Esta instalação do Explorer é privada e vinculada ao e-mail do proprietário.', 'error');
      return;
    }
    if (!email || password.length < 8) {
      setAuthMessage('Para criar a conta, use uma senha com pelo menos 8 caracteres.', 'error');
      return;
    }
    setAuthBusy(true);
    setAuthMessage('Criando sua conta segura…');
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: 'Franco' } },
    });
    setAuthBusy(false);
    if (error) {
      setAuthMessage(error.message || 'Não foi possível criar a conta.', 'error');
      return;
    }
    if (data?.session) {
      setAuthMessage('Conta criada e conectada.', 'ok');
    } else {
      setAuthMessage('Conta criada. Confirme o e-mail recebido e depois toque em Entrar.', 'ok');
    }
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
  }

  async function loadState(localState) {
    if (!client || !user) return localState;
    try {
      const { data, error } = await client
        .from('current_state')
        .select('state, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (data?.state && typeof data.state === 'object') {
        setStatus('nuvem atualizada', 'good');
        return data.state;
      }
      await syncNow(localState, { forceSnapshot: true });
      return localState;
    } catch (error) {
      console.warn('Falha ao carregar dados da nuvem', error);
      setStatus('modo local', 'danger');
      return localState;
    }
  }

  function scheduleSync(state, delay = 900) {
    latestState = JSON.parse(JSON.stringify(state));
    if (!client || !user) return;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncNow(latestState), delay);
    setStatus(navigator.onLine ? 'alterações pendentes' : 'offline · pendente', navigator.onLine ? 'muted' : 'danger');
  }

  async function syncNow(state, options = {}) {
    if (!client || !user || !state) return false;
    if (!navigator.onLine) {
      latestState = JSON.parse(JSON.stringify(state));
      setStatus('offline · pendente', 'danger');
      return false;
    }
    latestState = JSON.parse(JSON.stringify(state));
    if (syncPromise) return syncPromise;
    const syncingSnapshot = JSON.stringify(latestState);

    syncPromise = (async () => {
      setStatus('sincronizando', 'muted');
      const payload = {
        user_id: user.id,
        app_version: APP_VERSION,
        state: JSON.parse(syncingSnapshot),
      };
      const { error } = await client.from('current_state').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;

      await syncNormalized(latestState).catch((normalizedError) => {
        console.warn('Sincronização normalizada incompleta', normalizedError);
      });

      const now = Date.now();
      if (options.forceSnapshot || now - lastSnapshotAt > 30 * 60 * 1000) {
        await client.from('sync_snapshots').insert({
          user_id: user.id,
          app_version: APP_VERSION,
          snapshot: latestState,
        }).then(({ error: snapshotError }) => {
          if (snapshotError) console.warn('Snapshot não criado', snapshotError);
        });
        lastSnapshotAt = now;
      }

      setStatus('salvo na nuvem', 'good');
      return true;
    })().catch((error) => {
      console.warn('Falha ao sincronizar', error);
      setStatus('erro de sincronização', 'danger');
      return false;
    }).finally(() => {
      syncPromise = null;
      if (JSON.stringify(latestState) !== syncingSnapshot) scheduleSync(latestState, 500);
    });

    return syncPromise;
  }

  async function syncNormalized(state) {
    const uid = user.id;

    // O estado consolidado é a fonte de verdade. As tabelas analíticas são
    // reconstruídas para evitar registros órfãos após exclusões ou importações.
    for (const table of ['media', 'trail_points', 'observations', 'risks', 'trails', 'equipment', 'sos_events']) {
      const { error: cleanupError } = await client.from(table).delete().eq('user_id', uid);
      if (cleanupError) throw cleanupError;
    }

    const trails = [
      ...(state.activeTrail ? [{ ...state.activeTrail, isActive: true }] : []),
      ...(state.trails || []).map((trail) => ({ ...trail, isActive: false })),
    ];

    if (trails.length) {
      const rows = trails.map((trail) => ({
        id: trail.id,
        user_id: uid,
        name: trail.name || 'Trilha',
        place: trail.place || null,
        start_notes: trail.startNotes || null,
        start_time: trail.startTime,
        end_time: trail.endTime || null,
        distance_meters: Number(trail.distanceMeters || 0),
        is_active: Boolean(trail.isActive),
      }));
      const { error } = await client.from('trails').upsert(rows, { onConflict: 'id' });
      if (error) throw error;

      const points = trails.flatMap((trail) => (trail.points || []).map((point, index) => ({
        user_id: uid,
        trail_id: trail.id,
        sequence_no: index,
        recorded_at: point.timestamp || trail.startTime,
        latitude: Number(point.lat),
        longitude: Number(point.lng),
        altitude: finiteOrNull(point.altitude),
        accuracy: finiteOrNull(point.accuracy),
        speed: finiteOrNull(point.speed),
        heading: finiteOrNull(point.heading),
      })));
      if (points.length) {
        const { error: pointError } = await client.from('trail_points').upsert(points, { onConflict: 'trail_id,sequence_no' });
        if (pointError) throw pointError;
      }
    }

    const observations = (state.observations || []).map((obs) => ({
      id: obs.id,
      user_id: uid,
      trail_id: obs.trailId || null,
      created_at: obs.createdAt,
      type: obs.type || 'Outro',
      status: obs.status || null,
      species: obs.species || null,
      behavior: obs.behavior || null,
      habitat: obs.habitat || null,
      notes: obs.notes || null,
      latitude: finiteOrNull(obs.location?.lat),
      longitude: finiteOrNull(obs.location?.lng),
      altitude: finiteOrNull(obs.location?.altitude),
    }));
    if (observations.length) {
      const { error } = await client.from('observations').upsert(observations, { onConflict: 'id' });
      if (error) throw error;
    }

    const risks = (state.risks || []).map((risk) => ({
      id: risk.id,
      user_id: uid,
      trail_id: risk.trailId || null,
      created_at: risk.createdAt,
      type: risk.type || 'Outro',
      severity: risk.severity || 'baixa',
      notes: risk.notes || null,
      latitude: finiteOrNull(risk.location?.lat),
      longitude: finiteOrNull(risk.location?.lng),
      altitude: finiteOrNull(risk.location?.altitude),
    }));
    if (risks.length) {
      const { error } = await client.from('risks').upsert(risks, { onConflict: 'id' });
      if (error) throw error;
    }

    const mediaRows = [];
    (state.observations || []).forEach((obs) => {
      [...(obs.media || []), ...(obs.professionalPhotos || [])].forEach((media) => {
        if (!media.storagePath) return;
        mediaRows.push(mediaRow(media, uid, obs.id, null));
      });
    });
    (state.risks || []).forEach((risk) => {
      (risk.media || []).forEach((media) => {
        if (!media.storagePath) return;
        mediaRows.push(mediaRow(media, uid, null, risk.id));
      });
    });
    if (mediaRows.length) {
      const { error } = await client.from('media').upsert(mediaRows, { onConflict: 'id' });
      if (error) throw error;
    }

    const equipment = (state.settings?.equipment || []).map((item) => ({
      id: stableEquipmentId(item.category, item.name),
      user_id: uid,
      category: item.category || 'Acessório',
      name: item.name,
    })).filter((item) => item.name);
    if (equipment.length) {
      const { error } = await client.from('equipment').upsert(equipment, { onConflict: 'user_id,category,name' });
      if (error) console.warn('Equipamentos não sincronizados', error);
    }

    const settings = state.settings || {};
    const { error: settingsError } = await client.from('user_settings').upsert({
      user_id: uid,
      planned_return: settings.plannedReturn || null,
      emergency_phone: settings.emergencyPhone || null,
      trusted_contacts: settings.trustedContacts || null,
      medical_info: settings.medicalInfo || null,
      return_alert_sent_for: settings.returnAlertSentFor || null,
    }, { onConflict: 'user_id' });
    if (settingsError) throw settingsError;

    const sosRows = (state.sosEvents || []).map((event) => ({
      id: event.id,
      user_id: uid,
      created_at: event.createdAt || new Date().toISOString(),
      latitude: finiteOrNull(event.location?.lat ?? event.lat),
      longitude: finiteOrNull(event.location?.lng ?? event.lng),
      altitude: finiteOrNull(event.location?.altitude ?? event.altitude),
      battery_percent: Number.isFinite(Number(event.batteryPercent)) ? Number(event.batteryPercent) : null,
      details: event,
    }));
    if (sosRows.length) {
      const { error } = await client.from('sos_events').upsert(sosRows, { onConflict: 'id' });
      if (error) console.warn('Eventos SOS não sincronizados', error);
    }
  }

  function mediaRow(media, uid, observationId, riskId) {
    return {
      id: media.id,
      user_id: uid,
      observation_id: observationId,
      risk_id: riskId,
      kind: media.kind || 'file',
      name: media.name || null,
      mime_type: media.type || null,
      size_bytes: Number(media.size || 0),
      storage_path: media.storagePath,
      camera_model: media.cameraModel || null,
      lens_model: media.lensModel || null,
      accessory_used: media.accessoryUsed || null,
      focal_length: media.focalLength || null,
      shot_settings: media.shotSettings || null,
      note: media.note || null,
      created_at: media.createdAt || new Date().toISOString(),
    };
  }

  function finiteOrNull(value) {
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }

  function stableEquipmentId(category, name) {
    const input = `${category || ''}|${name || ''}`.toLowerCase();
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `eq-${(hash >>> 0).toString(16)}`;
  }

  async function uploadFile(file, mediaId) {
    if (!client || !user || !navigator.onLine || !file) return '';
    const cleanName = (file.name || 'arquivo').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-120);
    const path = `${user.id}/${mediaId}/${Date.now()}-${cleanName}`;
    const { error } = await client.storage.from(MEDIA_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || undefined,
    });
    if (error) {
      console.warn('Upload para a nuvem falhou', error);
      return '';
    }
    return path;
  }

  async function getSignedMediaUrl(path) {
    if (!client || !user || !path || !navigator.onLine) return '';
    const { data, error } = await client.storage.from(MEDIA_BUCKET).createSignedUrl(path, 3600);
    if (error) {
      console.warn('URL privada não gerada', error);
      return '';
    }
    return data?.signedUrl || '';
  }

  async function clearCloudData() {
    if (!client || !user) return;
    const uid = user.id;
    const tables = ['media', 'observations', 'risks', 'trail_points', 'trails', 'equipment', 'sos_events', 'sync_snapshots', 'current_state'];
    for (const table of tables) {
      const { error } = await client.from(table).delete().eq('user_id', uid);
      if (error) console.warn(`Falha ao limpar ${table}`, error);
    }
    await client.from('user_settings').delete().eq('user_id', uid);
    await removeUserStorage(uid);
  }

  async function removeUserStorage(uid) {
    try {
      const { data: folders } = await client.storage.from(MEDIA_BUCKET).list(uid, { limit: 1000 });
      const paths = [];
      for (const folder of folders || []) {
        const prefix = `${uid}/${folder.name}`;
        const { data: files } = await client.storage.from(MEDIA_BUCKET).list(prefix, { limit: 1000 });
        (files || []).forEach((file) => paths.push(`${prefix}/${file.name}`));
      }
      if (paths.length) await client.storage.from(MEDIA_BUCKET).remove(paths);
    } catch (error) {
      console.warn('Falha ao limpar arquivos privados', error);
    }
  }

  window.addEventListener('online', () => {
    if (latestState) scheduleSync(latestState, 300);
  });

  window.ExplorerCloud = {
    start,
    loadState,
    scheduleSync,
    syncNow,
    uploadFile,
    getSignedMediaUrl,
    clearCloudData,
    signOut,
    getUser: () => user,
    getClient: () => client,
    version: APP_VERSION,
  };
})();
