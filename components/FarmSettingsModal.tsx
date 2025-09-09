import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { vietnameseProvinces } from '../lib/vietnameseProvinces';
import { activityLogService } from '../utils/activityLogService';

interface Farm {
  id: string;
  name: string;
  location: string;
  address?: string;
  notes?: string;
}

interface FarmUser {
  id: string;
  user_id: string;
  farm_role: string;
  profiles: {;
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

const FarmSettingsModal: React.FC<FarmSettingsModalProps> = ({;
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
  const [farmAddress, setFarmAddress] = useState(farm?.address || '');
  const [farmNotes, setFarmNotes] = useState(farm?.notes || '');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editingMemberRole, setEditingMemberRole] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const isOwner = userRole === 'owner';
  const canManage = isOwner || userRole === 'manager';

  // Reset form when farm changes
  useEffect(() => {
    if (farm) {
      setFarmName(farm.name);
      setFarmLocation(farm.location);
      setFarmAddress(farm.address || '');
      setFarmNotes(farm.notes || '');
    }
  }, [farm]);

  const handleUpdateFarm = async () => {
    if (!farm || !farmName.trim() || !farmLocation.trim()) {
      Alert.alert('Error', 'Farm name and location are required');
      return;
    }

    try {
      setLoading(true);

      // Store old data for logging
      const oldData = {
        name: farm.name,
        location: farm.location,
        address: farm.address,
        notes: farm.notes;
      };

      const { error } = await supabase
        .from('farms')
        .update({
          name: farmName.trim(),
          location: farmLocation.trim(),
          address: farmAddress.trim() || null,
          notes: farmNotes.trim() || null,
        })
        .eq('id', farm.id);

      if (error) throw error;

      // Log the farm update activity
      const newData = {
        name: farmName.trim(),
        location: farmLocation.trim(),
        address: farmAddress.trim() || null,
        notes: farmNotes.trim() || null;
      };

      await activityLogService.logFarmUpdate(farm.id, oldData, newData);

      Alert.alert('Success', 'Farm details updated successfully!');
      setEditingFarm(false);
      onRefresh();
    } catch (error: any) {;
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newUserEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!canManage) {
      Alert.alert('Permission Denied', 'Only owners and managers can add members');
      return;
    }

    try {
      setLoading(true);

      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('email', newUserEmail.trim().toLowerCase())
        .single();

      if (userError || !userData) {
        Alert.alert('Error', 'User not found with this email address');
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('farm_users')
        .select('id')
        .eq('farm_id', farm?.id)
        .eq('user_id', userData.id)
        .single();

      if (existingMember) {
        Alert.alert('Error', 'User is already a member of this farm');
        return;
      }

      // Add user to farm
      const { error: addError } = await supabase
        .from('farm_users')
        .insert({
          farm_id: farm?.id,
          user_id: userData.id,
          farm_role: newUserRole,
        });

      if (addError) throw addError;

      Alert.alert('Success', `${userData.username} added to farm successfully!`);
      setNewUserEmail('');
      setNewUserRole('viewer');
      onRefresh();
    } catch (error: any) {;
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {;
    if (!canManage) {
      Alert.alert('Permission Denied', 'Only owners and managers can change member roles');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('farm_users')
        .update({ farm_role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      Alert.alert('Success', 'Member role updated successfully!');
      setEditingMember(null);
      onRefresh();
    } catch (error: any) {;
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {;
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only farm owners can remove members');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this farm?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {;
            try {
              setLoading(true);
              const { error } = await supabase
                .from('farm_users')
                .delete()
                .eq('id', memberId);

              if (error) throw error;

              Alert.alert('Success', `${memberName} removed from farm successfully!`);
              onRefresh();
            } catch (error: any) {;
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteFarm = async () => {
    if (!farm || !isOwner) return;

    if (deleteConfirmText.trim() !== farm.name) {
      Alert.alert('Error', 'Please enter the exact farm name to confirm deletion');
      return;
    }

    try {
      setLoading(true);

      // Store farm data for logging before deletion
      const farmData = {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        address: farm.address,
        notes: farm.notes;
      };

      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farm.id);

      if (error) throw error;

      // Log the farm deletion activity
      await activityLogService.logFarmDelete(farmData);

      Alert.alert('Success', 'Farm deleted successfully!');
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      onClose();
      navigation.navigate('Home');
    } catch (error: any) {;
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleStyle = (role: string) => {;
    switch (role) {
      case 'owner':
        return styles.ownerRoleTag;
      case 'manager':
        return styles.managerRoleTag;
      default:
        return styles.viewerRoleTag;
    }
  };

  const renderFarmTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="information-circle" size={28} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Farm Information</Text>
          </View>
          {canManage && (
            <TouchableOpacity
              style={[styles.editButton, editingFarm && styles.editButtonActive]}
              onPress={() => setEditingFarm(!editingFarm)}
              disabled={loading}
            >
              <LinearGradient
                colors={editingFarm ? ['#f44336', '#d32f2f'] : ['#4CAF50', '#388E3C']}
                style={styles.editButtonGradient}
              >
                <Ionicons
                  name={editingFarm ? "close" : "create-outline"}
                  size={24}
                  color="white"
                />
                <Text style={styles.editButtonText}>
                  {editingFarm ? 'Cancel' : 'Edit'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {editingFarm ? (
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Text style={styles.required}>* </Text>Farm Name
              </Text>
              <TextInput
                style={[styles.textInput, !farmName.trim() && styles.errorInput]}
                value={farmName}
                onChangeText={setFarmName}
                placeholder="Enter farm name"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Text style={styles.required}>* </Text>Province/Location
              </Text>
              <TouchableOpacity
                style={[styles.dropdownButton, !farmLocation && styles.errorInput]}
                onPress={() => setShowLocationDropdown(!showLocationDropdown)}
                disabled={loading}
              >
                <Text style={[styles.dropdownText, !farmLocation && styles.placeholderText]}>
                  {farmLocation || 'Select province'}
                </Text>
                <Ionicons
                  name={showLocationDropdown ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>

              {showLocationDropdown && (
                <View style={styles.dropdown}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {vietnameseProvinces.map((province, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFarmLocation(province);
                          setShowLocationDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{province}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Detailed Address</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={farmAddress}
                onChangeText={setFarmAddress}
                placeholder="Enter specific address (street, district, etc.)"
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Farm Notes & Description</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={farmNotes}
                onChangeText={setFarmNotes}
                placeholder="Describe what crops you grow, farming goals, special notes for AI suggestions..."
                multiline
                numberOfLines={5}
                editable={!loading}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, loading && styles.disabledButton]}
                onPress={() => {
                  setEditingFarm(false);
                  setFarmName(farm?.name || '');
                  setFarmLocation(farm?.location || '');
                  setFarmAddress(farm?.address || '');
                  setFarmNotes(farm?.notes || '');
                  setShowLocationDropdown(false);
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.disabledButton]}
                onPress={handleUpdateFarm}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#4CAF50', '#388E3C']}
                  style={styles.saveButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={24} color="white" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoDisplay}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="business" size={24} color="#4CAF50" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Farm Name</Text>
                  <Text style={styles.infoValue}>{farm?.name}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location" size={24} color="#2196F3" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Province</Text>
                  <Text style={styles.infoValue}>{farm?.location}</Text>
                </View>
              </View>

              {farm?.address && (
                <View style={styles.infoRow}>
                  <Ionicons name="navigate" size={24} color="#FF9800" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue}>{farm.address}</Text>
                  </View>
                </View>
              )}

              {farm?.notes && (
                <View style={styles.infoRow}>
                  <Ionicons name="document-text" size={24} color="#9C27B0" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Farm Notes</Text>
                    <Text style={styles.infoValue}>{farm.notes}</Text>
                  </View>
                </View>
              )}
            </View>

            {isOwner && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <LinearGradient
                  colors={['#f44336', '#d32f2f']}
                  style={styles.deleteButtonGradient}
                >
                  <Ionicons name="trash" size={24} color="white" />
                  <Text style={styles.deleteButtonText}>Delete Farm</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderMembersTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="people" size={28} color="#2196F3" />
            <Text style={styles.sectionTitle}>Farm Members</Text>
          </View>
        </View>

        {canManage && (
          <View style={styles.addMemberForm}>
            <Text style={styles.formTitle}>Add New Member</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Text style={styles.required}>* </Text>Email Address
              </Text>
              <TextInput
                style={styles.textInput}
                value={newUserEmail}
                onChangeText={setNewUserEmail}
                placeholder="Enter member's email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleSelector}>
                {['viewer', 'manager'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      newUserRole === role && styles.roleOptionSelected
                    ]}
                    onPress={() => setNewUserRole(role)}
                    disabled={loading}
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
              style={[styles.addButton, loading && styles.disabledButton]}
              onPress={handleAddMember}
              disabled={loading}
            >
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.addButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={24} color="white" />
                    <Text style={styles.addButtonText}>Add Member</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.membersList}>
          <Text style={styles.membersTitle}>Current Members ({farmUsers.length})</Text>

          {farmUsers.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Ionicons name="person-circle" size={40} color="#666" />
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.profiles.username}</Text>
                  <Text style={styles.memberEmail}>{member.profiles.email}</Text>
                </View>
              </View>

              <View style={styles.memberActions}>
                {editingMember === member.id ? (
                  <View style={styles.roleEditContainer}>
                    <View style={styles.roleSelector}>
                      {['viewer', 'manager'].map((role) => (
                        <TouchableOpacity
                          key={role}
                          style={[
                            styles.roleOption,
                            styles.smallRoleOption,
                            editingMemberRole === role && styles.roleOptionSelected
                          ]}
                          onPress={() => setEditingMemberRole(role)}
                        >
                          <Text style={[
                            styles.roleOptionText,
                            styles.smallRoleText,
                            editingMemberRole === role && styles.roleOptionTextSelected
                          ]}>
                            {role}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={styles.cancelEditButton}
                        onPress={() => {
                          setEditingMember(null);
                          setEditingMemberRole('');
                        }}
                      >
                        <Ionicons name="close" size={16} color="#f44336" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.saveEditButton}
                        onPress={() => handleUpdateMemberRole(member.id, editingMemberRole)}
                      >
                        <Ionicons name="checkmark" size={16} color="#4CAF50" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={[styles.roleTag, getRoleStyle(member.farm_role)]}>
                      <Text style={styles.roleTagText}>{member.farm_role}</Text>
                    </View>

                    {canManage && member.farm_role !== 'owner' && (
                      <View style={styles.memberActionButtons}>
                        <TouchableOpacity
                          style={styles.editMemberButton}
                          onPress={() => {
                            setEditingMember(member.id);
                            setEditingMemberRole(member.farm_role);
                          }}
                        >
                          <Ionicons name="create" size={16} color="#2196F3" />
                        </TouchableOpacity>

                        {isOwner && (
                          <TouchableOpacity
                            style={styles.removeMemberButton}
                            onPress={() => handleRemoveMember(member.id, member.profiles.username)}
                          >
                            <Ionicons name="trash" size={16} color="#f44336" />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#E8F5E8', '#F0F8FF']}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Farm Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'farm' && styles.activeTab]}
            onPress={() => setActiveTab('farm')}
          >
            <Ionicons
              name="settings"
              size={24}
              color={activeTab === 'farm' ? 'white' : '#666'}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'farm' && styles.activeTabText
            ]}>
              Farm Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'members' && styles.activeTab]}
            onPress={() => setActiveTab('members')}
          >
            <Ionicons
              name="people"
              size={24}
              color={activeTab === 'members' ? 'white' : '#666'}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'members' && styles.activeTabText
            ]}>
              Members
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'farm' ? renderFarmTab() : renderMembersTab()}

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModal}>
              <View style={styles.deleteModalHeader}>
                <Ionicons name="warning" size={48} color="#f44336" />
                <Text style={styles.deleteModalTitle}>Delete Farm</Text>
              </View>

              <Text style={styles.deleteModalText}>
                This action cannot be undone. All farm data, sensors, and member access will be permanently removed.
              </Text>

              <Text style={styles.deleteModalInstruction}>
                Type "<Text style={styles.farmNameHighlight}>{farm?.name}</Text>" to confirm:
              </Text>;

              <TextInput
                style={[
                  styles.deleteConfirmInput,
                  deleteConfirmText === farm?.name && styles.deleteConfirmInputValid
                ]}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="Enter farm name here"
                editable={!loading}
              />

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.deleteCancelButton}
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={loading}
                >
                  <Text style={styles.deleteCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteConfirmButton,
                    (deleteConfirmText !== farm?.name || loading) && styles.disabledButton
                  ]}
                  onPress={handleDeleteFarm}
                  disabled={deleteConfirmText !== farm?.name || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.deleteConfirmButtonText}>Delete Forever</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {;
    flex: 1,
  },
  header: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {;
    padding: 8,
  },
  title: {;
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {;
    width: 44,
  },
  tabContainer: {;
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {;
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {;
    backgroundColor: '#4CAF50',
  },
  tabText: {;
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {;
    color: 'white',
  },
  tabContent: {;
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {;
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {;
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {;
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {;
    borderRadius: 12,
    overflow: 'hidden',
  },
  editButtonActive: {;
    // Additional styles for active state if needed
  },
  editButtonGradient: {;
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  editButtonText: {;
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editForm: {;
    gap: 20,
  },
  inputGroup: {;
    gap: 8,
  },
  label: {;
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  required: {;
    color: '#f44336',
    fontSize: 18,
  },
  textInput: {;
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  errorInput: {;
    borderColor: '#f44336',
    backgroundColor: '#FFEBEE',
  },
  multilineInput: {;
    height: 80,
    textAlignVertical: 'top',
  },
  notesInput: {;
    height: 120,
    textAlignVertical: 'top',
  },
  dropdownButton: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  dropdownText: {;
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {;
    color: '#999',
  },
  dropdown: {;
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: 'white',
    maxHeight: 200,
    marginTop: 4,
  },
  dropdownScroll: {;
    maxHeight: 200,
  },
  dropdownItem: {;
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {;
    fontSize: 16,
    color: '#333',
  },
  buttonRow: {;
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {;
    flex: 1,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {;
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {;
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonText: {;
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {;
    opacity: 0.5,
  },
  infoDisplay: {;
    gap: 20,
  },
  infoCard: {;
    gap: 16,
  },
  infoRow: {;
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  infoTextContainer: {;
    flex: 1,
  },
  infoLabel: {;
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {;
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    lineHeight: 22,
  },
  deleteButton: {;
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  deleteButtonGradient: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  deleteButtonText: {;
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addMemberForm: {;
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 16,
  },
  formTitle: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  roleSelector: {;
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {;
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  roleOptionSelected: {;
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
  },
  roleOptionText: {;
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  roleOptionTextSelected: {;
    color: 'white',
  },
  smallRoleOption: {;
    flex: 0,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  smallRoleText: {;
    fontSize: 12,
  },
  addButton: {;
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {;
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  membersList: {;
    gap: 12,
  },
  membersTitle: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  memberCard: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  memberInfo: {;
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberDetails: {;
    flex: 1,
  },
  memberName: {;
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberEmail: {;
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  memberActions: {;
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleTag: {;
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ownerRoleTag: {;
    backgroundColor: '#FFD700',
  },
  managerRoleTag: {;
    backgroundColor: '#4CAF50',
  },
  viewerRoleTag: {;
    backgroundColor: '#2196F3',
  },
  roleTagText: {;
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  memberActionButtons: {;
    flexDirection: 'row',
    gap: 8,
  },
  editMemberButton: {;
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  removeMemberButton: {;
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  roleEditContainer: {;
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editActions: {;
    flexDirection: 'row',
    gap: 4,
  },
  cancelEditButton: {;
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FFEBEE',
  },
  saveEditButton: {;
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#E8F5E8',
  },
  deleteModalOverlay: {;
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModal: {;
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  deleteModalHeader: {;
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalTitle: {;
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginTop: 8,
  },
  deleteModalText: {;
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  deleteModalInstruction: {;
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  farmNameHighlight: {;
    fontWeight: 'bold',
    color: '#f44336',
  },
  deleteConfirmInput: {;
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteConfirmInputValid: {;
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  deleteModalButtons: {;
    flexDirection: 'row',
    gap: 12,
  },
  deleteCancelButton: {;
    flex: 1,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteCancelButtonText: {;
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  deleteConfirmButton: {;
    flex: 1,
    backgroundColor: '#f44336',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {;
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FarmSettingsModal;
