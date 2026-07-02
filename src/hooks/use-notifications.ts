import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Database } from '@/types/database.types';

export type AppNotification = Database['public']['Tables']['notifications']['Row'];

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up realtime subscription
    if (!user) return;
    
    const channel = supabase
      .channel(`public:notifications:${user.id}:${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((current) => [payload.new as AppNotification, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(current => 
        current.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      setNotifications(current => 
        current.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const sendAlert = async (seniorId: string, title: string, body: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: seniorId,
          title,
          body,
          type: 'alert',
        })
        .select()
        .single();
        
      if (error) throw error;

      // Invoke the Edge Function directly to send the push notification
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: seniorId,
          title,
          body,
          type: 'alert',
          reference_id: data.id,
        },
      });

      return true;
    } catch (error) {
      console.error('Error sending alert:', error);
      return false;
    }
  };

  return {
    notifications,
    loading,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    sendAlert,
  };
}
