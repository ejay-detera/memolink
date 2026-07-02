import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useNotifications, AppNotification } from '@/hooks/use-notifications';
import { useAuth } from '@/hooks/use-auth';

export default function CaregiverNotificationsScreen() {
  const router = useRouter();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const renderItem = ({ item }: { item: AppNotification }) => {
    let iconName: keyof typeof Ionicons.glyphMap = 'notifications';
    let iconColor: string = Colors.light.primary;

    if (item.type === 'alert') {
      iconName = 'warning';
      iconColor = '#ef4444'; // red
    }

    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
        onPress={() => {
          if (!item.is_read) {
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
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={Colors.light.textSecondary} />
          <Text style={styles.emptyText}>You have no notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
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
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadCard: {
    backgroundColor: '#f8fbff',
    borderColor: '#e5f0fc',
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
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
    color: Colors.light.textSecondary,
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
