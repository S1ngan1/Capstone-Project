// Custom hook for managing farm requests and user roles
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FarmRequest, FarmRequestWithProfile, UserProfile, FarmRequestCreatePayload, AdminReviewPayload } from '../interfaces/FarmRequest';

export const useFarmRequests = () => {
  const [farmRequests, setFarmRequests] = useState<FarmRequestWithProfile[]>([]);
  const [userRequests, setUserRequests] = useState<FarmRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);

  // Get current user's role
  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        setUserRole(profile.role);
        return profile.role;
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
    return null;
  };

  // Check if user can create a farm request (no pending requests)
  const canCreateRequest = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: pendingRequests, error } = await supabase
        .from('farm_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error checking pending requests:', error);
        return false;
      }

      return !pendingRequests || pendingRequests.length === 0;
    } catch (error) {
      console.error('Error checking request eligibility:', error);
      return false;
    }
  };

  // Create a new farm request
  const createFarmRequest = async (requestData: FarmRequestCreatePayload): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Check if user can create a request
      const eligible = await canCreateRequest();
      if (!eligible) {
        return { success: false, message: 'You already have a pending farm request. Please wait for approval.' };
      }

      const { data, error } = await supabase
        .from('farm_requests')
        .insert([
          {
            user_id: user.id,
            farm_name: requestData.farm_name,
            location: requestData.location,
            notes: requestData.notes;
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating farm request:', error);
        return { success: false, message: error.message };
      }

      await fetchUserRequests(); // Refresh user requests
      return { success: true, message: 'Farm request submitted successfully!' };
    } catch (error) {
      console.error('Error creating farm request:', error);
      return { success: false, message: 'Failed to create farm request' };
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's own requests
  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('farm_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false });

      if (!error && data) {
        setUserRequests(data);
      }
    } catch (error) {
      console.error('Error fetching user requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all requests (admin only)
  const fetchAllRequests = async () => {
    try {
      setLoading(true);

      // First fetch the farm requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('farm_requests')
        .select(`
          id,
          farm_name,
          location,
          user_id,
          requested_by,
          status,
          notes,
          admin_feedback,
          created_at,
          processed_at,
          requested_at,
          reviewed_by
        `)
        .order('requested_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
        return;
      }

      // Then fetch user profiles for each request
      const requestsWithProfiles = [];
      for (const request of requestsData || []) {
        // Get the user who made the request
        const userId = request.user_id || request.requested_by;
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, email, role')
          .eq('id', userId)
          .single();

        // Get the reviewer profile if available
        let reviewerData = null;
        if (request.reviewed_by) {
          const { data: reviewer, error: reviewerError } = await supabase
            .from('profiles')
            .select('id, username, email')
            .eq('id', request.reviewed_by)
            .single();

          if (!reviewerError && reviewer) {
            reviewerData = reviewer;
          }
        }

        requestsWithProfiles.push({
          ...request,
          profiles: profileData || { id: userId, username: 'Unknown User', email: '', role: 'user' },
          reviewer: reviewerData;
        });
      }

      setFarmRequests(requestsWithProfiles as FarmRequestWithProfile[]);
    } catch (error) {
      console.error('Error fetching all requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Approve a farm request (admin only)
  const approveFarmRequest = async (requestId: string, adminNotes?: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('approve_farm_request', {
        request_id: requestId,
        admin_notes_param: adminNotes;
      });

      if (error) {
        console.error('Error approving farm request:', error);
        return { success: false, message: error.message };
      }

      if (data && data[0]?.success) {
        await fetchAllRequests(); // Refresh the requests list
        return { success: true, message: data[0].message };
      } else {
        return { success: false, message: data?.[0]?.message || 'Failed to approve request' };
      }
    } catch (error) {
      console.error('Error approving farm request:', error);
      return { success: false, message: 'Failed to approve farm request' };
    } finally {
      setLoading(false);
    }
  };

  // Deny a farm request (admin only)
  const denyFarmRequest = async (requestId: string, adminNotes: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('deny_farm_request', {
        request_id: requestId,
        admin_notes_param: adminNotes;
      });

      if (error) {
        console.error('Error denying farm request:', error);
        return { success: false, message: error.message };
      }

      if (data && data[0]?.success) {
        await fetchAllRequests(); // Refresh the requests list
        return { success: true, message: data[0].message };
      } else {
        return { success: false, message: data?.[0]?.message || 'Failed to deny request' };
      }
    } catch (error) {
      console.error('Error denying farm request:', error);
      return { success: false, message: 'Failed to deny farm request' };
    } finally {
      setLoading(false);
    }
  };

  // Update user's pending request
  const updateFarmRequest = async (requestId: string, updateData: Partial<FarmRequestCreatePayload>): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('farm_requests')
        .update(updateData)
        .eq('id', requestId)
        .eq('status', 'pending'); // Only allow updating pending requests

      if (error) {
        console.error('Error updating farm request:', error);
        return { success: false, message: error.message };
      }

      await fetchUserRequests(); // Refresh user requests
      return { success: true, message: 'Farm request updated successfully!' };
    } catch (error) {
      console.error('Error updating farm request:', error);
      return { success: false, message: 'Failed to update farm request' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  return {
    farmRequests,
    userRequests,
    loading,
    userRole,
    fetchUserRole,
    canCreateRequest,
    createFarmRequest,
    fetchUserRequests,
    fetchAllRequests,
    approveFarmRequest,
    denyFarmRequest,
    updateFarmRequest
  };
};
