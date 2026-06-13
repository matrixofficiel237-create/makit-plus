import { useEffect, useState, useRef } from "react";
import { API_BASE } from "../lib/api";
import { ZONES } from "../utils/zones";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";

interface ClientMapData {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  adresse: string;
  latitude: number;
  longitude: number;
  zone: string;
  zoneName: string;
  zoneCouleur: string;
  activeOrders: Array<{
    id: string;
    statut: string;
    totalFinal: number;
    adresse: { quartier: string };
  }>;
}

interface ZoneStat {
  id: string;
  nom: string;
  couleur: string;
  emoji: string;
  clientCount: number;
  activeOrderCount: number;
}

interface MapData {
  clients: ClientMapData[];
  zones: ZoneStat[];
}

const STATUT_LABELS: Record<string, string> = {
  en_attente: "⏳ En attente",
  achat_en_cours: "🛒 Achat en cours",
  en_livraison: "🚚 En livraison",
  livre: "✅ Livré",
};

export default function AdminMapView() {
  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientMapData | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/admin/map`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Impossible de charger les données"); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!data || !containerRef.current || mapRef.current) return;

    import("leaflet").then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!).setView([3.8617, 11.5208], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      data.clients.forEach(client => {
        const zone = ZONES.find(z => z.id === client.zone);
        const color = zone?.couleur ?? "#4CAF50";

        const svgIcon = L.divIcon({
          html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
          className: "",
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const hasActive = client.activeOrders.length > 0;
        const icon = hasActive ? L.divIcon({
          html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;">${client.activeOrders.length}</div>`,
          className: "",
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }) : svgIcon;

        const popupHtml = `
          <div style="min-width:180px;font-family:sans-serif">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${client.prenom} ${client.nom}</div>
            <div style="font-size:12px;color:#666;margin-bottom:2px">📞 ${client.telephone}</div>
            <div style="font-size:12px;color:#666;margin-bottom:8px">📍 ${client.adresse}</div>
            <div style="display:inline-block;padding:2px 8px;border-radius:12px;background:${color}22;color:${color};font-size:11px;font-weight:700;margin-bottom:8px">
              ${zone?.emoji ?? ""} ${client.zoneName}
            </div>
            ${client.activeOrders.length > 0 ? `
              <div style="border-top:1px solid #eee;padding-top:8px">
                ${client.activeOrders.map(o => `
                  <div style="font-size:11px;color:#333;margin-bottom:4px">
                    <b>${STATUT_LABELS[o.statut] ?? o.statut}</b>
                    — ${o.totalFinal?.toLocaleString() ?? 0} FCFA
                  </div>
                `).join("")}
              </div>
            ` : '<div style="font-size:11px;color:#aaa">Aucune commande active</div>'}
          </div>`;

        L.marker([client.latitude, client.longitude], { icon })
          .addTo(map)
          .bindPopup(popupHtml);
      });

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [data]);

  const filteredClients = data?.clients.filter(c =>
    selectedZone ? c.zone === selectedZone : true
  ) ?? [];

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
      Chargement de la carte...
    </div>
  );

  if (error) return (
    <div style={{ background: "#FFEBEE", borderRadius: 12, padding: 20, color: "#c62828" }}>{error}</div>
  );

  if (!data) return null;

  return (
    <div>
      {/* Zone stats */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          onClick={() => setSelectedZone(null)}
          style={{
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            background: selectedZone === null ? "#1a1a1a" : "#f0f0f0",
            color: selectedZone === null ? "white" : "#333",
            fontSize: 13, fontWeight: 600,
          }}
        >
          Toutes ({data.clients.length})
        </button>
        {data.zones.map(z => (
          <button
            key={z.id}
            onClick={() => setSelectedZone(z.id === selectedZone ? null : z.id)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: `2px solid ${z.couleur}`,
              cursor: "pointer",
              background: selectedZone === z.id ? z.couleur : "white",
              color: selectedZone === z.id ? "white" : z.couleur,
              fontSize: 13, fontWeight: 600,
            }}
          >
            {z.emoji} {z.nom} ({z.clientCount}
            {z.activeOrderCount > 0 ? ` · ${z.activeOrderCount} cmd` : ""})
          </button>
        ))}
      </div>

      {/* Leaflet map */}
      <div
        ref={containerRef}
        style={{ width: "100%", height: 420, borderRadius: 16, overflow: "hidden", marginBottom: 20, border: "1px solid #eee" }}
      />

      {/* Client list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filteredClients.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "#aaa", fontSize: 14 }}>
            Aucun client avec localisation GPS dans cette zone
          </div>
        ) : filteredClients.map(c => {
          const zone = ZONES.find(z => z.id === c.zone);
          return (
            <div
              key={c.id}
              onClick={() => setSelectedClient(selectedClient?.id === c.id ? null : c)}
              style={{
                background: "white", borderRadius: 12, padding: "12px 16px",
                border: `1.5px solid ${selectedClient?.id === c.id ? zone?.couleur ?? "#ddd" : "#eee"}`,
                cursor: "pointer",
                boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{c.prenom} {c.nom}</span>
                  <span style={{ fontSize: 12, color: "#888", marginLeft: 10 }}>📞 {c.telephone}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {c.activeOrders.length > 0 && (
                    <span style={{
                      background: "#E65100", color: "white", borderRadius: 12,
                      padding: "2px 8px", fontSize: 11, fontWeight: 700,
                    }}>
                      {c.activeOrders.length} commande{c.activeOrders.length > 1 ? "s" : ""} active{c.activeOrders.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <span style={{
                    background: (zone?.couleur ?? "#4CAF50") + "22",
                    color: zone?.couleur ?? "#4CAF50",
                    borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                  }}>
                    {zone?.emoji} {c.zoneName}
                  </span>
                </div>
              </div>
              {selectedClient?.id === c.id && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>📍 {c.adresse}</div>
                  {c.activeOrders.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#aaa" }}>Aucune commande active</div>
                  ) : c.activeOrders.map(o => (
                    <div key={o.id} style={{
                      background: "#f9f9f9", borderRadius: 8, padding: "8px 12px", marginBottom: 6,
                      fontSize: 12,
                    }}>
                      <b>{STATUT_LABELS[o.statut] ?? o.statut}</b>
                      {" — "}{o.totalFinal?.toLocaleString()} FCFA
                      {" — "}📍 {o.adresse?.quartier}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
