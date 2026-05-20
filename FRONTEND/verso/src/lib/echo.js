import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance = null;

const BROADCAST_AUTH_URL = (() => {
  const apiBase = import.meta.env.VITE_API_URL || '';
  return apiBase.replace(/\/api\/?$/, '') + '/broadcasting/auth';
})();

export function getEcho() {
  if (echoInstance) return echoInstance;

  if (!window.Pusher) window.Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
    wssPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        const token = localStorage.getItem('auth_token');
        fetch(BROADCAST_AUTH_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then((res) => res.ok ? res.json() : Promise.reject(res))
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
      },
    }),
  });

  return echoInstance;
}

export function getSocketId() {
  try {
    return echoInstance?.socketId?.() || null;
  } catch {
    return null;
  }
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
