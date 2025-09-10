import { supabase } from '../lib/supabase';
import { Notification } from '../types/interfaces';

export class NotificationService {
  /**
   * Create a new notification for a specific user
   */
  static async createNotification({
    userId,
    title,
    message,
    type,
    farmId,
    sensorId,
    level = 'normal'
  }: {
    userId: string;
    title: string;
    message: string;
    type: 'sensor_alert' | 'farm_invite' | 'system' | 'weather' | 'general' | 'farm_request' | 'sensor_request';
    farmId?: string;
    sensorId?: string;
    level?: 'urgent' | 'warning' | 'normal';
  }) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message, // Use 'message' field as per database structure
          type,
          is_read: false,
          farm_id: farmId,
          sensor_id: sensorId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createBulkNotifications({
    userIds,
    title,
    message,
    type,
    farmId,
    sensorId,
    level = 'normal'
  }: {
    userIds: string[];
    title: string;
    message: string;
    type: 'sensor_alert' | 'farm_invite' | 'system' | 'weather' | 'general' | 'farm_request' | 'sensor_request';
    farmId?: string;
    sensorId?: string;
    level?: 'urgent' | 'warning' | 'normal';
  }) {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message, // Use 'message' field as per database structure
        type,
        is_read: false,
        farm_id: farmId,
        sensor_id: sensorId,
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        console.error('Error creating bulk notifications:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createBulkNotifications:', error);
      return null;
    }
  }

  /**
   * Get farm members to send notifications to
   */
  static async getFarmMembers(farmId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('farm_users')
        .select('user_id')
        .eq('farm_id', farmId);

      if (error) {
        console.error('Error fetching farm members:', error);
        return [];
      }

      return data?.map(member => member.user_id) || [];
    } catch (error) {
      console.error('Error in getFarmMembers:', error);
      return [];
    }
  }

  /**
   * Send sensor alert to farm members
   */
  static async sendSensorAlert({
    farmId,
    sensorId,
    sensorName,
    value,
    unit,
    threshold,
    alertType
  }: {
    farmId: string;
    sensorId: string;
    sensorName: string;
    value: number;
    unit: string;
    threshold: number;
    alertType: 'high' | 'low' | 'critical';
  }) {
    const farmMembers = await this.getFarmMembers(farmId);
    
    if (farmMembers.length === 0) return;

    const level = alertType === 'critical' ? 'urgent' : alertType === 'high' ? 'warning' : 'normal';
    const title = `${alertType.toUpperCase()} Alert: ${sensorName}`;
    const message = `${sensorName} reading is ${value}${unit}, which is ${alertType === 'high' ? 'above' : 'below'} the threshold of ${threshold}${unit}. Please check your farm immediately.`;

    return await this.createBulkNotifications({
      userIds: farmMembers,
      title,
      message,
      type: 'sensor_alert',
      farmId,
      sensorId,
      level
    });
  }

  /**
   * Send farm invitation notification
   */
  static async sendFarmInvitation({
    userId,
    farmName,
    inviterName,
    farmId,
    role
  }: {
    userId: string;
    farmName: string;
    inviterName: string;
    farmId: string;
    role: string;
  }) {
    const title = 'Farm Invitation';
    const message = `${inviterName} has invited you to join "${farmName}" as a ${role}. You can accept or decline this invitation in your notifications.`;

    return await this.createNotification({
      userId,
      title,
      message,
      type: 'farm_invite',
      farmId,
      level: 'normal'
    });
  }

  /**
   * Send farm request update notification
   */
  static async sendFarmRequestUpdate({
    userId,
    farmName,
    status,
    farmId
  }: {
    userId: string;
    farmName: string;
    status: 'approved' | 'rejected';
    farmId: string;
  }) {
    const title = 'Farm Request Update';
    const message = status === 'approved' 
      ? `Your request to join "${farmName}" has been approved! You can now access the farm.`
      : `Your request to join "${farmName}" has been declined.`;

    return await this.createNotification({
      userId,
      title,
      message,
      type: 'farm_request',
      farmId,
      level: status === 'approved' ? 'normal' : 'warning'
    });
  }

  /**
   * Send system notification to all users
   */
  static async sendSystemNotification({
    title,
    message,
    level = 'normal'
  }: {
    title: string;
    message: string;
    level?: 'urgent' | 'warning' | 'normal';
  }) {
    try {
      // Get all user IDs
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id');

      if (error || !users) {
        console.error('Error fetching users for system notification:', error);
        return null;
      }

      const userIds = users.map(user => user.id);

      return await this.createBulkNotifications({
        userIds,
        title,
        message,
        type: 'system',
        level
      });
    } catch (error) {
      console.error('Error in sendSystemNotification:', error);
      return null;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        console.error('Error marking notification as read:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return null;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return null;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return false;
    }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }
}
