import { haversineKm, marcheLesPlusProche } from "./marches";

function fraisBaseDistance(distanceKm: number): number {
  if (distanceKm < 2) return 1000;
  if (distanceKm < 5) return 1500;
  if (distanceKm < 10) return 2000;
  if (distanceKm < 15) return 2500;
  return 3000;
}

function supplementMontant(total: number): number {
  if (total <= 0) return 0;
  if (total <= 10000) return 750;
  if (total <= 20000) return 1000;
  if (total <= 30000) return 1500;
  if (total <= 50000) return 2000;
  return 3000;
}

function supplementMontantSpecial(total: number): number {
  if (total <= 0) return 0;
  if (total <= 10000) return 1500;
  if (total <= 20000) return 2000;
  if (total <= 30000) return 2500;
  if (total <= 50000) return 3000;
  return 4000;
}

export function calculerFrais(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  totalProduits: number,
  prixSpecial = false
): number {
  if (totalProduits <= 0) return 0;
  const supplement = prixSpecial
    ? supplementMontantSpecial(totalProduits)
    : supplementMontant(totalProduits);

  if (!latitude || !longitude) return supplement;

  const marche = marcheLesPlusProche(latitude, longitude);
  const dist = haversineKm(latitude, longitude, marche.latitude, marche.longitude);
  return fraisBaseDistance(dist) + supplement;
}
