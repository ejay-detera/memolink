import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { syncPendingSummaries } from '@/lib/journal-service';
import { useAuth } from '@/hooks/use-auth';
import { registerForPushNotificationsAsync } from '@/services/notification-service';

export default function AppLayout() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Fire and forget the sync process on app open, ensuring JWT is ready
      syncPendingSummaries();
      // Register for push notifications
      registerForPushNotificationsAsync(user.id);
    }
  }, [user]);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
