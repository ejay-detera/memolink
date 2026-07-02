import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  
  // Setup how notifications should be handled when app is in foreground
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  // console.warn('expo-notifications is not available in Expo Go. Please use a development build.');
}

/**
 * Handles registering the device for push notifications and
 * updating the user's profile with the token in Supabase.
 */
export async function registerForPushNotificationsAsync(userId: string) {
  if (!Notifications || !Notifications.setNotificationChannelAsync) {
    // console.warn('Notifications module is not fully available in Expo Go.');
    return undefined;
  }

  let token;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance?.MAX || 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    } catch (e) {
      console.warn('Failed to set notification channel:', e);
    }
  }

  if (Device.isDevice) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return;
      }
      
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        
      if (!projectId) {
        console.warn('Project ID not found. Ensure eas.json is configured.');
      }
      
      const tokenResult = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      token = tokenResult.data;
      console.log('Expo Push Token:', token);

      // Save token to Supabase profiles
      const { error } = await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', userId);

      if (error) {
        console.error('Error saving push token to profile:', error);
      }
    } catch (e) {
      console.warn('Notifications permission error:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Schedule a local notification (e.g. for medications or appointments)
 */
export async function scheduleLocalNotification(title: string, body: string, triggerDate: Date, data?: Record<string, any>) {
  if (!Notifications) return undefined;
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: triggerDate,
  });
}

/**
 * Cancel a specific local notification
 */
export async function cancelLocalNotification(notificationId: string) {
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all local notifications
 */
export async function cancelAllLocalNotifications() {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
