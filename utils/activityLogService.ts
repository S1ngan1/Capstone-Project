import { supabase } from '../lib/supabase'
export interface ActivityLog {
  id: string
  user_id: string
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'REQUEST' | 'APPROVE' | 'REJECT'
  table_name: string
  record_id?: string
  old_data?: any
  new_data?: any
  description: string
  ip_address?: string
  user_agent?: string
  created_at: string
  username?: string
  email?: string
  user_role?: string
}
export interface Notification {
  id: string
  user_id: string
  activity_log_id?: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
  read_at?: string
  metadata?: any // Add metadata field for navigation information
}
class ActivityLogService {
  /**
   * Log an activity action
   */
  async logActivity(params: {
    actionType: ActivityLog['action_type']
    tableName: string
    recordId?: string
    oldData?: any
    newData?: any
    description: string
  }): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      // Direct insert instead of using database function
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action_type: params.actionType,
          table_name: params.tableName,
          record_id: params.recordId,
          old_data: params.oldData,
          new_data: params.newData,
          description: params.description,
          ip_address: null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
        })
        .select('id')
        .single()
      if (error) {
        console.error('Error logging activity:', error)
        return null
      }
      // Create a simple notification
      if (data?.id) {
        await this.createNotificationForActivity(user.id, data.id, params.actionType, params.description)
      }
      return data?.id || null
    } catch (error) {
      console.error('Error in logActivity:', error)
      return null
    }
  }
  /**
   * Create a notification for an activity (simplified version)
   */
  private async createNotificationForActivity(
    userId: string,
    activityLogId: string,
    actionType: string,
    description: string
  ) {
    try {
      const title = this.getNotificationTitle(actionType)
      const type = this.getNotificationType(actionType)
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          activity_log_id: activityLogId,
          title,
          message: description,
          type
        })
    } catch (error) {
      console.error('Error creating notification:', error)
      // Don't throw error here, notification creation is not critical
    }
  }
  private getNotificationTitle(actionType: string): string {
    switch (actionType) {
      case 'CREATE': return 'Item Created'
      case 'UPDATE': return 'Item Updated'
      case 'DELETE': return 'Item Deleted'
      case 'REQUEST': return 'Request Submitted'
      case 'APPROVE': return 'Request Approved'
      case 'REJECT': return 'Request Rejected'
      default: return 'Activity Recorded'
    }
  }
  private getNotificationType(actionType: string): 'info' | 'success' | 'warning' | 'error' {
    switch (actionType) {
      case 'CREATE': return 'success'
      case 'UPDATE': return 'info'
      case 'DELETE': return 'warning'
      case 'REQUEST': return 'info'
      case 'APPROVE': return 'success'
      case 'REJECT': return 'error'
      default: return 'info'
    }
  }
  /**
   * Get activity logs for current user or all (if admin)
   */
  async getActivityLogs(params: {
    page?: number
    limit?: number
    userId?: string
    actionType?: string
    tableName?: string
  } = {}): Promise<{ data: ActivityLog[]; count: number }> {
    try {
      const { page = 1, limit = 20, userId, actionType, tableName } = params
      const offset = (page - 1) * limit
      // Use manual join instead of foreign key relationship
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
      // Apply filters
      if (userId) {
        query = query.eq('user_id', userId)
      }
      if (actionType) {
        query = query.eq('action_type', actionType)
      }
      if (tableName) {
        query = query.eq('table_name', tableName)
      }
      // Get total count first
      const { count: totalCount, error: countError } = await query
      if (countError) {
        console.error('Error getting count:', countError)
        if (countError.code === '42P01') {
          console.warn('Activity logs table not found, returning empty data')
          return { data: [], count: 0 }
        }
        return { data: [], count: 0 }
      }
      // Only apply range if we have enough records
      if (totalCount && totalCount > 0) {
        const maxOffset = Math.max(0, totalCount - 1)
        const safeOffset = Math.min(offset, maxOffset)
        const safeLimit = Math.min(limit, totalCount - safeOffset)
        query = query.range(safeOffset, safeOffset + safeLimit - 1)
      }
      const { data: logs, error } = await query
      if (error) {
        console.error('Error fetching activity logs:', error)
        return { data: [], count: 0 }
      }
      // Now fetch user profiles separately for the logs we retrieved
      if (!logs || logs.length === 0) {
        return { data: [], count: totalCount || 0 }
      }
      const userIds = [...new Set(logs.map(log => log.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, email, role')
        .in('id', userIds)
      // Create a map of user profiles for quick lookup
      const profileMap = new Map()
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile)
      })
      // Transform data to include user info
      const transformedData = logs.map(log => {
        const profile = profileMap.get(log.user_id)
        return {
          ...log,
          username: profile?.username || 'Unknown User',
          email: profile?.email || 'Unknown Email',
          user_role: profile?.role || 'user'
        }
      })
      return { data: transformedData, count: totalCount || 0 }
    } catch (error) {
      console.error('Error in getActivityLogs:', error)
      return { data: [], count: 0 }
    }
  }
  /**
   * Get notifications for current user
   */
  async getNotifications(params: {
    page?: number
    limit?: number
    unreadOnly?: boolean
  } = {}): Promise<{ data: Notification[]; count: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found for notifications')
        return { data: [], count: 0 }
      }
      const { page = 1, limit = 20, unreadOnly = false } = params
      const offset = (page - 1) * limit
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id) // Filter by current user
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (unreadOnly) {
        query = query.eq('is_read', false)
      }
      const { data, error, count } = await query
      if (error) {
        console.error('Error fetching notifications:', error)
        // If notifications table doesn't exist, return empty data
        if (error.code === '42P01') {
          console.warn('Notifications table not found, returning empty data')
          return { data: [], count: 0 }
        }
        return { data: [], count: 0 }
      }
      console.log(`Fetched ${data?.length || 0} notifications for user ${user.id}`)
      return { data: data || [], count: count || 0 }
    } catch (error) {
      console.error('Error in getNotifications:', error)
      return { data: [], count: 0 }
    }
  }
  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found for unread count')
        return 0
      }
      // Direct query to count unread notifications
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      if (error) {
        console.error('Error getting unread count:', error)
        return 0
      }
      const unreadCount = count || 0
      console.log(`Unread notifications count: ${unreadCount} for user ${user.id}`)
      return unreadCount
    } catch (error) {
      console.error('Error in getUnreadNotificationCount:', error)
      return 0
    }
  }
  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
      if (error) {
        console.error('Error marking notification as read:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error)
      return false
    }
  }
  /**
   * Mark all notifications as read for current user
   */
  async markAllNotificationsAsRead(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false)
      if (error) {
        console.error('Error marking all notifications as read:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Error in markAllNotificationsAsRead:', error)
      return false
    }
  }
  /**
   * Get new activity log count for current user (with debouncing)
   */
  private lastFetchTime: number = 0
  private cachedCount: number = 0
  private readonly FETCH_DEBOUNCE_MS = 1000 // Reduced from 2000 to 1000ms for better responsiveness
  async getNewActivityLogCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found for new activity count')
        return 0
      }
      // Get count of unviewed activity logs for the current user
      const { count, error } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('viewed', false)
      if (error) {
        console.error('Error getting new activity count:', error)
        return 0
      }
      const activityCount = count || 0
      console.log(`New activity count: ${activityCount} for user ${user.id}`)
      return activityCount
    } catch (error) {
      console.error('Error in getNewActivityLogCount:', error)
      return 0
    }
  }
  /**
   * Mark activity logs as viewed
   */
  async markActivityLogsAsViewed(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      const { data, error } = await supabase
        .from('activity_logs')
        .update({ viewed: true })
        .eq('user_id', user.id)
        .eq('viewed', false)
      if (error) {
        console.error('Error marking activity logs as viewed:', error)
        return false
      }
      console.log(`Activity logs marked as viewed for user_id: ${user.id}, updated rows: ${data ? data.length : 0}`)
      return true
    } catch (error) {
      console.error('Error in markActivityLogsAsViewed:', error)
      return false
    }
  }
  // Store subscription references to prevent multiple subscriptions
  private activeSubscriptions: Map<string, any> = new Map()
  /**
   * Subscribe to real-time notifications with subscription management
   */
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channelName = `notifications_${userId}`
    // Check if subscription already exists
    if (this.activeSubscriptions.has(channelName)) {
      console.log('Notifications subscription already exists for user:', userId)
      return this.activeSubscriptions.get(channelName)
    }
    try {
      const subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('Real-time notification received:', payload)
            if (payload.new) {
              callback(payload.new as Notification)
            }
          }
        )
        .subscribe((status) => {
          console.log(`Notifications subscription status for ${userId}:`, status)
        })
      // Store the subscription
      this.activeSubscriptions.set(channelName, subscription)
      console.log(`Notifications subscription created for user: ${userId}`)
      return subscription
    } catch (error) {
      console.error('Error creating notifications subscription:', error)
      return null
    }
  }
  /**
   * Subscribe to activity logs for real-time updates
   */
  subscribeToActivityLogs(userId: string, callback: (activity: ActivityLog) => void) {
    const channelName = `activity_logs_${userId}`
    // Check if subscription already exists
    if (this.activeSubscriptions.has(channelName)) {
      console.log('Activity logs subscription already exists for user:', userId)
      return this.activeSubscriptions.get(channelName)
    }
    try {
      const subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('Real-time activity log received:', payload)
            if (payload.new) {
              callback(payload.new as ActivityLog)
            }
          }
        )
        .subscribe((status) => {
          console.log(`Activity logs subscription status for ${userId}:`, status)
        })
      // Store the subscription
      this.activeSubscriptions.set(channelName, subscription)
      console.log(`Activity logs subscription created for user: ${userId}`)
      return subscription
    } catch (error) {
      console.error('Error creating activity logs subscription:', error)
      return null
    }
  }
  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const subscription = this.activeSubscriptions.get(channelName)
    if (subscription) {
      subscription.unsubscribe()
      this.activeSubscriptions.delete(channelName)
      console.log(`Unsubscribed from channel: ${channelName}`)
    }
  }
  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    this.activeSubscriptions.forEach((subscription, channelName) => {
      subscription.unsubscribe()
      console.log(`Unsubscribed from channel: ${channelName}`)
    })
    this.activeSubscriptions.clear()
    console.log('All subscriptions cleared')
  }
  /**
   * Create a system notification (for admin actions, system events, etc.)
   */
  async createSystemNotification(params: {
    userId: string
    title: string
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    metadata?: any
    navigationScreen?: string
  }): Promise<void> {
    try {
      const { userId, title, message, type = 'info', metadata, navigationScreen } = params
      // Include navigationScreen in metadata if provided
      const finalMetadata = {
        ...metadata,
        navigationScreen
      }
      // Try inserting with metadata first
      let { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          is_read: false,
          metadata: finalMetadata
        })
      // If metadata column doesn't exist, try without it
      if (error && error.message?.includes("metadata")) {
        console.warn('metadata column not found, inserting notification without metadata')
        const { error: fallbackError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title,
            message,
            type,
            is_read: false
          })
        if (fallbackError) {
          console.error('Error creating notification (fallback):', fallbackError)
        } else {
          console.log(`System notification created for user ${userId}: ${title} (without metadata)`)
        }
      } else if (error) {
        console.error('Error creating system notification:', error)
      } else {
        console.log(`System notification created for user ${userId}: ${title}`)
      }
    } catch (error) {
      console.error('Error in createSystemNotification:', error)
    }
  }
  /**
   * Create a notification for sensor request submission
   */
  async createSensorRequestSubmissionNotification(params: {
    userId: string
    sensorRequestId: string
    sensorType: string
    farmName: string
  }): Promise<void> {
    try {
      const { userId, sensorRequestId, sensorType, farmName } = params
      await this.createSystemNotification({
        userId,
        title: 'Sensor Request Submitted',
        message: `Your ${sensorType} sensor request for farm "${farmName}" has been submitted and is pending admin review.`,
        type: 'success',
        metadata: {
          sensorRequestId,
          farmName,
          sensorType,
          action: 'submitted'
        }
      })
    } catch (error) {
      console.error('Error creating sensor request submission notification:', error)
    }
  }
  /**
   * Create a notification for farm request submission
   */
  async createFarmRequestSubmissionNotification(params: {
    userId: string
    farmRequestId: string
    farmName: string
  }): Promise<void> {
    try {
      const { userId, farmRequestId, farmName } = params
      await this.createSystemNotification({
        userId,
        title: 'Farm Request Submitted',
        message: `Your farm request for "${farmName}" has been submitted and is pending admin review.`,
        type: 'success',
        metadata: {
          farmRequestId,
          farmName,
          action: 'submitted'
        }
      })
    } catch (error) {
      console.error('Error creating farm request submission notification:', error)
    }
  }
}
export const activityLogService = new ActivityLogService()
