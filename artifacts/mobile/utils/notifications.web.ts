export async function registerForPushNotifications(_userId: string): Promise<string | null> {
  return null;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function notifyLocalStatusChange(
  _statut: string,
  _orderId: string
): Promise<void> {
  // Non supporté sur navigateur web
}
