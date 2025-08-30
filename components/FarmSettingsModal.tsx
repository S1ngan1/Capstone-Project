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
  const [activeTab, setActiveTab] = useState('farm');
  const [editingFarm, setEditingFarm] = useState(false);
  const [farmName, setFarmName] = useState(farm?.name || '');
  const [farmLocation, setFarmLocation] = useState(farm?.location || '');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');

  const isOwner = userRole === 'owner';
  const canManage = isOwner || userRole === 'manager';

  const handleUpdateFarm = async () => {
    if (!farm || !farmName.trim() || !farmLocation.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('farms')
        .update({
          name: farmName.trim(),
          location: farmLocation.trim(),
        })
        .eq('id', farm.id);

      if (error) throw error;

      Alert.alert('Success', 'Farm updated successfully');
      setEditingFarm(false);
      onRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteFarm = async () => {
    if (!farm || !isOwner) return;

    Alert.alert(
      'Delete Farm',
      'Are you sure you want to delete this farm? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('farms')
                .delete()
                .eq('id', farm.id);

              if (error) throw error;

              Alert.alert('Success', 'Farm deleted successfully');
              onClose();
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !farm) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

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
        .eq('farm_id', farm.id)
        .eq('user_id', userData.id)
        .single();

      if (existingUser) {
        Alert.alert('Error', 'User is already a member of this farm');
        return;
      }

      // Add user to farm
      const { error } = await supabase
        .from('farm_users')
        .insert({
          farm_id: farm.id,
          user_id: userData.id,
          farm_role: newUserRole,
        });

      if (error) throw error;

      Alert.alert('Success', 'User added successfully');
      setNewUserEmail('');
      setNewUserRole('viewer');
      onRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemoveUser = async (userId: string, username: string) => {
    if (!farm || !canManage) return;

    Alert.alert(
      'Remove User',
      `Are you sure you want to remove ${username} from this farm?`,
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
                .eq('farm_id', farm.id)
                .eq('user_id', userId);

              if (error) throw error;

              Alert.alert('Success', 'User removed successfully');
              onRefresh();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleChangeUserRole = async (userId: string, currentRole: string, username: string) => {
    if (!farm || !canManage) return;

    const roles = ['viewer', 'manager', 'owner'];
    const roleOptions = roles.map(role => ({
      text: role.charAt(0).toUpperCase() + role.slice(1),
      onPress: async () => {
        if (role === currentRole) return;

        try {
          const { error } = await supabase
            .from('farm_users')
            .update({ farm_role: role })
            .eq('farm_id', farm.id)
            .eq('user_id', userId);

          if (error) throw error;

          Alert.alert('Success', `${username}'s role updated to ${role}`);
          onRefresh();
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      },
    }));

    Alert.alert('Change Role', `Select new role for ${username}:`, [
      ...roleOptions,
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderFarmTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Farm Information</Text>
        {editingFarm ? (
          <View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Farm Name</Text>
              <TextInput
                style={styles.input}
                value={farmName}
                onChangeText={setFarmName}
                placeholder="Enter farm name"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowLocationDropdown(true)}
              >
                <Text style={farmLocation ? styles.inputText : styles.placeholder}>
                  {farmLocation || 'Select province'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditingFarm(false);
                  setFarmName(farm?.name || '');
                  setFarmLocation(farm?.location || '');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateFarm}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{farm?.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{farm?.location}</Text>
            </View>
            {canManage && (
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setEditingFarm(true)}
              >
                <Ionicons name="pencil" size={16} color="#fff" />
                <Text style={styles.editButtonText}>Edit Farm</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {isOwner && (
        <View style={styles.section}>
          <Text style={styles.dangerSectionTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDeleteFarm}
          >
            <Ionicons name="trash" size={16} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete Farm</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderUsersTab = () => (
    <View style={styles.tabContent}>
      {canManage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New User</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={newUserEmail}
              onChangeText={setNewUserEmail}
              placeholder="Enter user email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleSelector}>
              {['viewer', 'manager'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    newUserRole === role && styles.roleOptionSelected,
                  ]}
                  onPress={() => setNewUserRole(role)}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      newUserRole === role && styles.roleOptionTextSelected,
                    ]}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={handleAddUser}
          >
            <Ionicons name="person-add" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Add User</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Farm Members ({farmUsers.length})</Text>
        {farmUsers.map((user) => (
          <View key={user.id} style={styles.userItem}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.profiles.username}</Text>
              <Text style={styles.userEmail}>{user.profiles.email}</Text>
              <View style={styles.roleContainer}>
                <Text style={[styles.roleTag, styles[`${user.farm_role}Role`]]}>
                  {user.farm_role.charAt(0).toUpperCase() + user.farm_role.slice(1)}
                </Text>
              </View>
            </View>
            {canManage && user.farm_role !== 'owner' && (
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleChangeUserRole(user.user_id, user.farm_role, user.profiles.username)}
                >
                  <Ionicons name="settings" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRemoveUser(user.user_id, user.profiles.username)}
                >
                  <Ionicons name="person-remove" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Farm Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'farm' && styles.activeTab]}
            onPress={() => setActiveTab('farm')}
          >
            <Ionicons name="home" size={20} color={activeTab === 'farm' ? '#2196F3' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'farm' && styles.activeTabText]}>
              Farm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'users' && styles.activeTab]}
            onPress={() => setActiveTab('users')}
          >
            <Ionicons name="people" size={20} color={activeTab === 'users' ? '#2196F3' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
              Users
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {activeTab === 'farm' ? renderFarmTab() : renderUsersTab()}
        </ScrollView>

        {/* Location Dropdown Modal */}
        <Modal
          visible={showLocationDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLocationDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowLocationDropdown(false)}
          >
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdown}>
                {vietnameseProvinces.map((province) => (
                  <TouchableOpacity
                    key={province.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFarmLocation(province.name);
                      setShowLocationDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{province.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContent: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
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
    backgroundColor: '#fff',
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    flex: 0.45,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flex: 0.45,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  roleSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: '#2196F3',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#666',
  },
  roleOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
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
  roleContainer: {
    marginTop: 5,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  ownerRole: {
    backgroundColor: '#FF9800',
    color: '#fff',
  },
  managerRole: {
    backgroundColor: '#2196F3',
    color: '#fff',
  },
  viewerRole: {
    backgroundColor: '#4CAF50',
    color: '#fff',
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 300,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
