import "server-only";

type AdminRealtimeEvent = {
  type: "super-admin-data" | "orders-updated";
  at: string;
};

type Listener = (event: AdminRealtimeEvent) => void;

const GLOBAL_KEY = "__hllc_admin_realtime_listeners__";

function listeners() {
  const globalStore = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: Set<Listener>;
  };

  if (!globalStore[GLOBAL_KEY]) {
    globalStore[GLOBAL_KEY] = new Set<Listener>();
  }

  return globalStore[GLOBAL_KEY];
}

export function subscribeAdminRealtime(listener: Listener) {
  listeners().add(listener);

  return () => {
    listeners().delete(listener);
  };
}

export function publishSuperAdminDataChanged() {
  const event: AdminRealtimeEvent = { type: "super-admin-data", at: new Date().toISOString() };
  for (const listener of listeners()) listener(event);
}

export function publishOrdersUpdated() {
  const event: AdminRealtimeEvent = { type: "orders-updated", at: new Date().toISOString() };
  for (const listener of listeners()) listener(event);
}
