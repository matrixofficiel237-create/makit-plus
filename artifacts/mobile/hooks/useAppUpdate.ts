import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { API_BASE } from "@/utils/api";

export const APP_CURRENT_VERSION = "1.0.0";

export interface UpdateInfo {
  available: boolean;
  version: string;
  apkUrl: string;
  releaseNotes: string;
}

function parseVersion(v: string): number[] {
  return v.split(".").map((n) => parseInt(n, 10) || 0);
}

function isNewerVersion(remote: string, local: string): boolean {
  const r = parseVersion(remote);
  const l = parseVersion(local);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] ?? 0;
    const lv = l[i] ?? 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
}

export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    checkForUpdate();
  }, []);

  async function checkForUpdate() {
    try {
      const res = await fetch(`${API_BASE}/version`);
      if (!res.ok) return;
      const data = await res.json();
      if (isNewerVersion(data.version, APP_CURRENT_VERSION)) {
        setUpdateInfo({
          available: true,
          version: data.version,
          apkUrl: data.apkUrl,
          releaseNotes: data.releaseNotes || "",
        });
      }
    } catch {
      // Silencieux si le serveur est indisponible
    }
  }

  function dismiss() {
    setDismissed(true);
  }

  return {
    updateInfo: !dismissed ? updateInfo : null,
    dismiss,
    currentVersion: APP_CURRENT_VERSION,
  };
}
