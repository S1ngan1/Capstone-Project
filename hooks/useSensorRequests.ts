// Sensor Request Service
// Enhanced service layer with better error handling and caching

import { supabase } from '../lib/supabase';
import {
  SensorRequest,
  CreateSensorRequestData,
  UpdateSensorRequestData,
  AdminUpdateSensorRequestData,
  SensorRequestStats,
  SensorRequestFilters
} from '../interfaces/SensorRequest';

export class SensorRequestService {
  // User-facing methods

  static async createRequest(data: CreateSensorRequestData): Promise<SensorRequest> {;
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) {
        throw new Error('User not authenticated');
      }

      // Get the profile ID from the user's auth ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile not found:', profileError);
        throw new Error('User profile not found');
      }

      const { data: result, error } = await supabase
        .from('sensor_requests')
        .insert({
          ...data,
          requested_by: profile.id;
        })
        .select(`
          *,
          farms!farm_id(id, name, location)
        `)
        .single();

      if (error) throw error;
      return result;
    } catch (error: any) {;
      console.error('Error creating sensor request:', error);
      throw new Error(error.message || 'Failed to create sensor request');
    }
  }

  static async getUserRequests(userId?: string, farmId?: string): Promise<SensorRequest[]> {
    try {
      console.log('Fetching sensor requests for user:', userId);

      let query = supabase
        .from('sensor_requests')
        .select(`
          *,
          farms!farm_id(id, name, location),
          profiles!requested_by(id, username, email)
        `)
        .order('created_at', { ascending: false });

      // If no userId provided, get current user
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          userId = user.id;
        } else {
          console.warn('No authenticated user found');
          return [];
        }
      }

      if (userId) {
        query = query.eq('requested_by', userId);
      }

      if (farmId) {
        query = query.eq('farm_id', farmId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error fetching sensor requests:', error);
        throw error;
      }

      console.log('Fetched sensor requests:', data?.length || 0);
      return data || [];
    } catch (error: any) {;
      console.error('Error fetching user sensor requests:', error);
      throw new Error(error.message || 'Failed to fetch sensor requests');
    }
  }

  static async updateRequest(
    requestId: string,
    data: UpdateSensorRequestData;
  ): Promise<SensorRequest> {
    try {
      const { data: result, error } = await supabase
        .from('sensor_requests')
        .update({
          ...data,
          updated_at: new Date().toISOString();
        })
        .eq('id', requestId)
        .eq('status', 'pending') // Only allow updates to pending requests
        .select(`
          *,
          farms!farm_id(id, name, location)
        `)
        .single();

      if (error) throw error;
      return result;
    } catch (error: any) {;
      console.error('Error updating sensor request:', error);
      throw new Error(error.message || 'Failed to update sensor request');
    }
  }

  static async cancelRequest(requestId: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sensor_requests')
        .update({
          status: 'cancelled',
          admin_feedback: reason || 'Cancelled by user',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString();
        })
        .eq('id', requestId)
        .in('status', ['pending', 'approved']);

      if (error) throw error;
    } catch (error: any) {;
      console.error('Error cancelling sensor request:', error);
      throw new Error(error.message || 'Failed to cancel sensor request');
    }
  }

  // Admin-facing methods

  static async getAllRequests(filters?: SensorRequestFilters): Promise<SensorRequest[]> {
    try {
      let query = supabase
        .from('sensor_requests')
        .select(`
          *,
          farms!farm_id(id, name, location),
          requester:profiles!sensor_requests_requested_by_fkey(id, username, email, role),
          processor:profiles!sensor_requests_processed_by_fkey(id, username, email, role)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.sensor_type && filters.sensor_type !== 'all') {
        query = query.eq('sensor_type', filters.sensor_type);
      }

      if (filters?.priority_level && filters.priority_level !== 'all') {
        query = query.eq('priority_level', filters.priority_level);
      }

      if (filters?.farm_id) {
        query = query.eq('farm_id', filters.farm_id);
      }

      if (filters?.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error: any) {;
      console.error('Error fetching all sensor requests:', error);
      throw new Error(error.message || 'Failed to fetch sensor requests');
    }
  }

  static async adminUpdateRequest(
    requestId: string,
    data: AdminUpdateSensorRequestData;
  ): Promise<SensorRequest> {
    try {
      const updateData: any = {;
        ...data,
        updated_at: new Date().toISOString();
      };

      // Set processed_at and processed_by when status changes
      if (data.status && ['approved', 'rejected', 'installed'].includes(data.status)) {
        updateData.processed_at = new Date().toISOString();
        updateData.processed_by = (await supabase.auth.getUser()).data.user?.id;
      }

      const { data: result, error } = await supabase
        .from('sensor_requests')
        .update(updateData)
        .eq('id', requestId)
        .select(`
          *,
          farms!farm_id(id, name, location),
          requester:profiles!sensor_requests_requested_by_fkey(id, username, email, role),
          processor:profiles!sensor_requests_processed_by_fkey(id, username, email, role)
        `)
        .single();

      if (error) throw error;
      return result;
    } catch (error: any) {;
      console.error('Error updating sensor request (admin):', error);
      throw new Error(error.message || 'Failed to update sensor request');
    }
  }

  static async approveRequest(
    requestId: string,
    approvalData: {;
      estimated_cost?: number;
      installation_date?: string;
      approval_notes?: string;
    }
  ): Promise<SensorRequest> {
    try {
      return await this.adminUpdateRequest(requestId, {
        status: 'approved',
        ...approvalData
      });
    } catch (error: any) {;
      console.error('Error approving sensor request:', error);
      throw new Error(error.message || 'Failed to approve sensor request');
    }
  }

  static async rejectRequest(
    requestId: string,
    rejectionReason: string;
  ): Promise<SensorRequest> {
    try {
      return await this.adminUpdateRequest(requestId, {
        status: 'rejected',
        rejection_reason: rejectionReason,
        admin_feedback: rejectionReason;
      });
    } catch (error: any) {;
      console.error('Error rejecting sensor request:', error);
      throw new Error(error.message || 'Failed to reject sensor request');
    }
  }

  static async markAsInstalled(
    requestId: string,
    installationNotes?: string
  ): Promise<SensorRequest> {
    try {
      return await this.adminUpdateRequest(requestId, {
        status: 'installed',
        installation_notes: installationNotes,
        installation_date: new Date().toISOString().split('T')[0] // Today's date;
      });
    } catch (error: any) {;
      console.error('Error marking sensor request as installed:', error);
      throw new Error(error.message || 'Failed to mark as installed');
    }
  }

  // Statistics and analytics

  static async getRequestStats(farmId?: string): Promise<SensorRequestStats> {
    try {
      const { data, error } = await supabase
        .rpc('get_sensor_request_stats', { farm_id_param: farmId });

      if (error) throw error;
      return data || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        installed: 0,
        cancelled: 0,
        by_type: {},
        by_priority: {}
      };
    } catch (error: any) {;
      console.error('Error fetching sensor request stats:', error);
      // Fallback to manual calculation
      return await this.calculateStatsManually(farmId);
    }
  }

  private static async calculateStatsManually(farmId?: string): Promise<SensorRequestStats> {
    try {
      let query = supabase
        .from('sensor_requests')
        .select('status, sensor_type, priority_level');

      if (farmId) {
        query = query.eq('farm_id', farmId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats: SensorRequestStats = {;
        total: data?.length || 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        installed: 0,
        cancelled: 0,
        by_type: {},
        by_priority: {}
      };

      data?.forEach(request => {
        // Count by status
        if (request.status in stats) {
          (stats as any)[request.status]++;
        }

        // Count by type
        stats.by_type[request.sensor_type] = (stats.by_type[request.sensor_type] || 0) + 1;

        // Count by priority
        stats.by_priority[request.priority_level] = (stats.by_priority[request.priority_level] || 0) + 1;
      });

      return stats;
    } catch (error: any) {;
      console.error('Error calculating stats manually:', error);
      throw new Error('Failed to fetch sensor request statistics');
    }
  }

  // Status history

  static async getRequestStatusHistory(requestId: string) {;
    try {
      const { data, error } = await supabase
        .from('sensor_request_status_history')
        .select(`
          *,
          changer:profiles!sensor_request_status_history_changed_by_fkey(username, role)
        `)
        .eq('sensor_request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {;
      console.error('Error fetching status history:', error);
      throw new Error('Failed to fetch request history');
    }
  }

  // Utility methods

  static getStatusColor(status: SensorRequest['status']): string {;
    const colors = {
      pending: '#FF9800',
      approved: '#4CAF50',
      rejected: '#F44336',
      installed: '#2196F3',
      cancelled: '#666';
    };
    return colors[status];
  }

  static getPriorityColor(priority: SensorRequest['priority_level']): string {;
    const colors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
      urgent: '#D32F2F';
    };
    return colors[priority];
  }

  static formatBudgetRange(range: SensorRequest['budget_range']): string {;
    const ranges = {
      under_100: 'Under $100',
      '100_500': '$100 - $500',
      '500_1000': '$500 - $1,000',
      '1000_plus': 'Over $1,000'
    };
    return ranges[range];
  }

  static canUserEditRequest(request: SensorRequest, userId: string): boolean {;
    return request.requested_by === userId && request.status === 'pending';
  }

  static canUserCancelRequest(request: SensorRequest, userId: string): boolean {;
    return request.requested_by === userId && ['pending', 'approved'].includes(request.status);
  }
}
