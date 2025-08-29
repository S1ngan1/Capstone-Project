import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BottomNavigation from '../components/BottomNavigation';

// Types
interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'normal_user' | 'data_manager';
  created_at: string;
}

interface UserFarmRole {
  id: string;
  farm_id: string;
  farm_role: string;
  farms: {
    name: string;
    location: string;
  };
}

type RootStackParamList = {
  UserDetail: { userId: string };
};

type UserDetailRouteProp = RouteProp<RootStackParamList, 'UserDetail'>;

const UserDetail = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<UserDetailRouteProp>();
  const { session } = useAuthContext();
  const { userId } = route.params;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userFarms, setUserFarms] = useState<UserFarmRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, email, role, created_at')
        .eq('id', userId)
        .single();

      if (!profileError && profileData) {
        setUserProfile(profileData);
      }

      // Fetch user's farm roles
      const { data: farmsData, error: farmsError } = await supabase
        .from('farm_users')
        .select(`
          id,
          farm_id,
          farm_role,
          farms!inner (
            name,
            location
          )
        `)
        .eq('user_id', userId);

      if (!farmsError && farmsData) {
        setUserFarms(farmsData);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApplicationRoleStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return { backgroundColor: '#dc3545', color: 'white' };
      case 'data_manager':
        return { backgroundColor: '#007bff', color: 'white' };
      default:
        return { backgroundColor: '#28a745', color: 'white' };
    }
  };

  const getFarmRoleStyle = (farmRole: string) => {
    switch (farmRole) {
      case 'owner':
        return { backgroundColor: '#ffd700', color: '#333' };
      case 'manager':
        return { backgroundColor: '#4CAF50', color: 'white' };
      default:
        return { backgroundColor: '#ddd', color: '#333' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#e7fbe8ff', '#cdffcfff']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading user details...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Profile Section */}
          <View style={styles.section}>
            <View style={styles.profileHeader}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={48} color="#4CAF50" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userProfile?.username}</Text>
                <Text style={styles.userEmail}>{userProfile?.email}</Text>
                <View style={[styles.roleContainer, getApplicationRoleStyle(userProfile?.role || 'normal_user')]}>
                  <Text style={[styles.roleText, { color: getApplicationRoleStyle(userProfile?.role || 'normal_user').color }]}>
                    {userProfile?.role?.replace('_', ' ').toUpperCase() || 'NORMAL USER'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* User Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Username</Text>
                  <Text style={styles.infoValue}>{userProfile?.username}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{userProfile?.email}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="shield-outline" size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Application Role</Text>
                  <Text style={styles.infoValue}>
                    {userProfile?.role?.replace('_', ' ').toUpperCase() || 'NORMAL USER'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>
                    {userProfile?.created_at ? formatDate(userProfile.created_at) : 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Farm Roles Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Farm Roles ({userFarms.length})
            </Text>
            {userFarms.length > 0 ? (
              userFarms.map((farmRole) => (
                <View key={farmRole.id} style={styles.farmCard}>
                  <View style={styles.farmInfo}>
                    <Text style={styles.farmName}>{farmRole.farms.name}</Text>
                    <Text style={styles.farmLocation}>📍 {farmRole.farms.location}</Text>
                  </View>
                  <View style={[styles.farmRoleContainer, getFarmRoleStyle(farmRole.farm_role)]}>
                    <Text style={[styles.farmRoleText, { color: getFarmRoleStyle(farmRole.farm_role).color }]}>
                      {farmRole.farm_role.charAt(0).toUpperCase() + farmRole.farm_role.slice(1)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="farm" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No farm roles assigned</Text>
              </View>
            )}
          </View>

          {/* Bottom spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <BottomNavigation />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    paddingBottom: 70,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e7fbe8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  roleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  farmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  farmInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  farmLocation: {
    fontSize: 14,
    color: '#666',
  },
  farmRoleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  farmRoleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  bottomSpacer: {
    height: 70,
  },
});

export default UserDetail;
