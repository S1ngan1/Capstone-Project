 import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { vietnameseProvinces } from '../lib/vietnameseProvinces';

interface Farm {
  id: string;
  name: string;
  location: string;
}

interface FarmUser {
  id: string;
  user_id: string;
  farm_role: string;
  profiles: {
    username: string;
    email: string;
    role: string;
  };
}

interface FarmSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  farm: Farm | null;
  userRole: string;
  farmUsers: FarmUser[];
  onRefresh: () => void;
  navigation: any;
}

const FarmSettingsModal: React.FC<FarmSettingsModalProps> = ({
  visible,
  onClose,
  farm,
  userRole,
  farmUsers,
  onRefresh,
  navigation,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'users' | 'delete'>('edit');
  const [farmName, setFarmName] = useState(farm?.name || '');
  const [farmLocation, setFarmLocation] = useState(farm?.location || '');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');

  React.useEffect(() => {
    if (farm) {
      setFarmName(farm.name);
      setFarmLocation(farm.location);
    }
  }, [farm]);

  const handleUpdateFarm = async () => {
    if (!farm || !farmName.trim()) {
      Alert.alert('Error', 'Farm name is required');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('farms')
        .update({
          name: farmName.trim(),
          location: farmLocation
        })
        .eq('id', farm.id);

      if (error) throw error;

      Alert.alert('Success', 'Farm updated successfully');
      onRefresh();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update farm');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setLoading(true);
    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newUserEmail.trim())
        .single();

      if (userError || !userData) {
        Alert.alert('Error', 'User not found with this email');
        return;
      }

      // Check if user is already in the farm
      const { data: existingUser } = await supabase
        .from('farm_users')
        .select('id')
        .eq('farm_id', farm?.id)
        .eq('user_id', userData.id)
        .single();

      if (existingUser) {
        Alert.alert('Error', 'User is already a member of this farm');
        return;
      }

      // Add user to farm
      const { error: addError } = await supabase
        .from('farm_users')
        .insert({
          farm_id: farm?.id,
          user_id: userData.id,
          farm_role: newUserRole
        });

      if (addError) throw addError;

      Alert.alert('Success', 'User added successfully');
      setNewUserEmail('');
      setNewUserRole('viewer');
      onRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    Alert.alert(
      'Remove User',
      'Are you sure you want to remove this user from the farm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('farm_users')
                .delete()
                .eq('farm_id', farm?.id)
                .eq('user_id', userId);

              if (error) throw error;

              Alert.alert('Success', 'User removed successfully');
              onRefresh();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove user');
            }
          }
        }
      ]
    );
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('farm_users')
        .update({ farm_role: newRole })
        .eq('farm_id', farm?.id)
        .eq('user_id', userId);

      if (error) throw error;

      Alert.alert('Success', 'User role updated successfully');
      onRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update user role');
    }
  };

  const handleDeleteFarm = async () => {
    Alert.alert(
      'Delete Farm',
      'Are you sure you want to delete this farm? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Delete all farm users first
              await supabase
                .from('farm_users')
                .delete()
                .eq('farm_id', farm?.id);

              // Delete the farm
              const { error } = await supabase
                .from('farms')
                .delete()
                .eq('id', farm?.id);

              if (error) throw error;

              Alert.alert('Success', 'Farm deleted successfully');
              onClose();
              navigation.navigate('Home');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete farm');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const selectLocation = (province: any) => {
    setFarmLocation(province.name);
    setShowLocationDropdown(false);
  };

  const renderEditTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Farm Name</Text>
        <TextInput
          style={styles.input}
          value={farmName}
          onChangeText={setFarmName}
          placeholder="Enter farm name"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowLocationDropdown(true)}
        >
          <Text style={farmLocation ? styles.inputText : styles.placeholder}>
            {farmLocation || 'Select location'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.updateButton]}
        onPress={handleUpdateFarm}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Updating...' : 'Update Farm'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderUsersTab = () => (
    <ScrollView style={styles.tabContent}>
      {userRole === 'owner' && (
        <View style={styles.addUserSection}>
          <Text style={styles.sectionTitle}>Add New User</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={newUserEmail}
              onChangeText={setNewUserEmail}
              placeholder="Enter user email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleSelector}>
              {['owner', 'manager', 'viewer'].map(role => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    newUserRole === role && styles.roleOptionSelected
                  ]}
                  onPress={() => setNewUserRole(role)}
                >
                  <Text style={[
                    styles.roleOptionText,
                    newUserRole === role && styles.roleOptionTextSelected
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={handleAddUser}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Adding...' : 'Add User'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.usersList}>
        <Text style={styles.sectionTitle}>Farm Members</Text>
        {farmUsers.map(user => (
          <View key={user.id} style={styles.userItem}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.profiles.username}</Text>
              <Text style={styles.userEmail}>{user.profiles.email}</Text>
            </View>
            <View style={styles.userActions}>
              <View style={[styles.roleBadge, getRoleBadgeStyle(user.farm_role)]}>
                <Text style={styles.roleBadgeText}>{user.farm_role}</Text>
              </View>
              {userRole === 'owner' && user.farm_role !== 'owner' && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveUser(user.user_id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ff4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderDeleteTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <Text style={styles.dangerDescription}>
          Deleting this farm will permanently remove all data including sensors,
          readings, and user associations. This action cannot be undone.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDeleteFarm}
          disabled={loading || userRole !== 'owner'}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Deleting...' : 'Delete Farm'}
          </Text>
        </TouchableOpacity>
        {userRole !== 'owner' && (
          <Text style={styles.permissionNote}>
            Only farm owners can delete farms
          </Text>
        )}
      </View>
    </View>
  );

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'owner':
        return { backgroundColor: '#ff6b35' };
      case 'manager':
        return { backgroundColor: '#4CAF50' };
      case 'viewer':
        return { backgroundColor: '#2196F3' };
      default:
        return { backgroundColor: '#999' };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#E8F5E8', '#F0F8F0']}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Farm Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'edit' && styles.activeTab]}
            onPress={() => setActiveTab('edit')}
          >
            <Text style={[styles.tabText, activeTab === 'edit' && styles.activeTabText]}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'users' && styles.activeTab]}
            onPress={() => setActiveTab('users')}
          >
            <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
              Users
            </Text>
          </TouchableOpacity>
          {userRole === 'owner' && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'delete' && styles.activeTab]}
              onPress={() => setActiveTab('delete')}
            >
              <Text style={[styles.tabText, activeTab === 'delete' && styles.activeTabText]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {activeTab === 'edit' && renderEditTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'delete' && renderDeleteTab()}

        {/* Location Dropdown Modal */}
        <Modal
          visible={showLocationDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLocationDropdown(false)}
        >
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setShowLocationDropdown(false)}
          >
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdown}>
                {vietnameseProvinces.map((province) => (
                  <TouchableOpacity
                    key={province.id}
                    style={styles.dropdownItem}
                    onPress={() => selectLocation(province)}
                  >
                    <Text style={styles.dropdownItemText}>{province.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
  },
  addButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addUserSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#666',
  },
  roleOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  usersList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 8,
  },
  dangerZone: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffebee',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  dangerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  permissionNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dropdown: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default FarmSettingsModal;
