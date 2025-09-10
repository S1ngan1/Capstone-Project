import { supabase } from '../lib/supabase';

interface CreateNotificationParams {
  user_id: string;
  title: string;
  content: string;
  type: 'sensor_alert' | 'farm_invite' | 'system' | 'weather' | 'general';
  level: 'urgent' | 'warning' | 'normal';
  farm_id?: string;
  sensor_id?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: params.user_id,
        title: params.title,
        content: params.content,
        type: params.type,
        level: params.level,
        farm_id: params.farm_id,
        sensor_id: params.sensor_id,
        is_read: false,
        created_at: new Date().toISOString(),
      }]);

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }

    console.log('Notification created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error creating notification:', error);
    return { success: false, error };
  }
};

export const createSensorAlert = async (
  user_id: string,
  sensor_name: string,
  sensor_value: number,
  sensor_unit: string,
  farm_id: string,
  sensor_id: string
) => {
  return createNotification({
    user_id,
    title: 'Sensor Alert',
    content: `${sensor_name} reading: ${sensor_value} ${sensor_unit}`,
    type: 'sensor_alert',
    level: 'warning',
    farm_id,
    sensor_id,
  });
};

export const createFarmInvite = async (
  user_id: string,
  farm_name: string,
  farm_id: string,
  inviter_name: string
) => {
  return createNotification({
    user_id,
    title: 'Farm Invitation',
    content: `${inviter_name} has invited you to join ${farm_name}`,
    type: 'farm_invite',
    level: 'normal',
    farm_id,
  });
};

export const createSystemNotification = async (
  user_id: string,
  title: string,
  content: string,
  level: 'urgent' | 'warning' | 'normal' = 'normal'
) => {
  return createNotification({
    user_id,
    title,
    content,
    type: 'system',
    level,
  });
};

export const createWeatherAlert = async (
  user_id: string,
  farm_id: string,
  weather_condition: string
) => {
  return createNotification({
    user_id,
    title: 'Weather Alert',
    content: `Weather alert for your farm: ${weather_condition}`,
    type: 'weather',
    level: 'warning',
    farm_id,
  });
};
