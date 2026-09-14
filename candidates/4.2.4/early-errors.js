(() => {
  'use strict';
  const buffer = window.__explorerEarlyErrors = window.__explorerEarlyErrors || [];
  const push = (kind, value) => {
    if (window.__explorerTelemetryReady || buffer.length >= 8) return;
    buffer.push({ kind, value, at: Date.now() });
  };

  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) return;
    push('error', {
      message: event.message || 'Erro de inicialização',
      filename: event.filename || '',
      line: event.lineno || null,
      column: event.colno || null,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || 'Promise rejeitada');
    push('unhandledrejection', { message: reason });
  });
})();
