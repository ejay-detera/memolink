import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useNotifications, AppNotification } from '@/hooks/use-notifications';
import { useMedications } from '@/hooks/use-medications';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

type NotificationItem = {
  id: string;
  type: 'alert' | 'medication' | 'appointment';
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, loading: notifLoading, markAsRead, markAllAsRead } = useNotifications();
  const { medications, loading: medLoading } = useMedications(user?.id);
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptsLoading, setApptsLoading] = useState(true);

  // Fetch today's appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data } = await supabase
          .from('medical_appointments')
          .select('*')
          .eq('senior_id', user.id)
          .gte('appointment_date', todayStart.toISOString())
          .lte('appointment_date', todayEnd.toISOString());

        setAppointments(data || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setApptsLoading(false);
      }
    };
    fetchAppointments();
  }, [user]);

  const unifiedNotifications = useMemo(() => {
    const items: NotificationItem[] = [];

    // 1. Add DB Notifications (Alerts from caregiver)
    notifications.forEach((n) => {
      items.push({
        id: n.id,
        type: n.type as any,
        title: n.title,
        body: n.body,
        timestamp: n.created_at,
        isRead: n.is_read || false,
      });
    });

    // 2. Add Medications due today
    medications.forEach((med) => {
      if (med.is_active && med.times && med.times.length > 0) {
        med.times.forEach((time, index) => {
          // Construct a mock timestamp for today at the specified time
          const [hours, minutes] = time.split(':');
          const d = new Date();
          d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          
          items.push({
            id: `med-${med.id}-${index}`,
            type: 'medication',
            title: `Medication Reminder: ${med.name}`,
            body: `It is time to take ${med.dosage}. ${med.instructions || ''}`,
            timestamp: d.toISOString(),
            isRead: false, // For local dynamic items, we treat them as unread for now or based on log
          });
        });
      }
    });

    // 3. Add Appointments due today
    appointments.forEach((appt) => {
      items.push({
        id: `appt-${appt.id}`,
        type: 'appointment',
        title: `Upcoming Appointment: ${appt.doctor_name}`,
        body: `You have an appointment at ${appt.location || appt.clinic_name || 'the clinic'} at ${new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        timestamp: appt.appointment_date,
        isRead: false,
      });
    });

    // Sort by timestamp descending
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, medications, appointments]);

  const renderItem = ({ item }: { item: NotificationItem }) => {
    let iconName: keyof typeof Ionicons.glyphMap = 'notifications';
    let iconColor = Colors.light.primary;

    if (item.type === 'alert') {
      iconName = 'warning';
      iconColor = '#ef4444'; // red
    } else if (item.type === 'medication') {
      iconName = 'medical';
      iconColor = '#3b82f6'; // blue
    } else if (item.type === 'appointment') {
      iconName = 'calendar';
      iconColor = '#8b5cf6'; // purple
    }

    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => {
          if (!item.isRead && item.type === 'alert') {
            markAsRead(item.id);
          }
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!item.isRead && item.type === 'alert' && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const isLoading = notifLoading || medLoading || apptsLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead} style={styles.readAllButton}>
          <Ionicons name="checkmark-done" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : unifiedNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={Colors.light.textTertiary} />
          <Text style={styles.emptyText}>You have no notifications</Text>
        </View>
      ) : (
        <FlatList
          data={unifiedNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.outline,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    color: Colors.light.text,
  },
  readAllButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundElement,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: `${Colors.light.primary}08`,
    borderColor: Colors.light.primary,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    color: Colors.light.textTertiary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
