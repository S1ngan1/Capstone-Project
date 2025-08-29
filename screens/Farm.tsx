import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, FlatList, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp, RouteProp, useRoute } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BottomNavigation from '../components/BottomNavigation';
import { RootStackParamList } from '../App';
import { vietnameseProvinces, Province, getProvincesByRegion } from '../lib/vietnameseProvinces';

interface Farm {
  id: string;
  name: string;
  location?: string;
}

interface FarmWithRole {
  id: string;
  farm_id: string;
  user_id: string;
  farm_role: string;
  farms: Farm;
}

type FarmRouteProp = RouteProp<RootStackParamList, 'Farm'>;

const Farm = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<FarmRouteProp>();
  const { session } = useAuthContext();

  const [farmsWithRoles, setFarmsWithRoles] = useState<FarmWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmLocation, setNewFarmLocation] = useState('');
  const [addingFarm, setAddingFarm] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);

  useEffect(() => {
    // Check if we should show the add form based on navigation params
    if (route.params?.showAddForm) {
      setShowAddForm(true);
    }
  }, [route.params]);

  useEffect(() => {
    fetchFarms();
  }, [session]);

  const fetchFarms = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch farms through the farm_users junction table with updated schema
      const { data, error } = await supabase
        .from('farm_users')
        .select(`
          id,
          farm_id,
          user_id,
          farm_role,
          farms!inner (
            id,
            name,
            location
          )
        `)
        .eq('user_id', session.user.id)
        .order('id', { ascending: false });

      if (error) {
        // Silently handle errors without showing alerts or logging
        setFarmsWithRoles([]);
      } else {
        setFarmsWithRoles(data || []);
      }
    } catch (error) {
      // Silently handle errors without logging
      setFarmsWithRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const addFarm = async () => {
    if (!newFarmName.trim() || !selectedProvince) {
      Alert.alert('Missing Information', 'Please enter farm name and select a province');
      return;
    }

    if (!session?.user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setAddingFarm(true);

      // First, create the farm
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .insert([
          {
            name: newFarmName.trim(),
            location: selectedProvince.name,
          }
        ])
        .select()
        .single();

      if (farmError) {
        console.error('Error adding farm:', farmError);
        Alert.alert('Error', `Failed to add farm: ${farmError.message}`);
        return;
      }

      // Then, create the relationship in farm_users table with owner farm_role
      const { error: relationError } = await supabase
        .from('farm_users')
        .insert([
          {
            farm_id: farmData.id,
            user_id: session.user.id,
            farm_role: 'owner'
          }
        ]);

      if (relationError) {
        console.error('Error creating farm relationship:', relationError);
        Alert.alert('Error', 'Farm created but failed to assign ownership');
      } else {
        Alert.alert('Success', 'Farm added successfully!');
        setNewFarmName('');
        setSelectedProvince(null);
        setShowAddForm(false);
        fetchFarms(); // Refresh the list
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setAddingFarm(false);
    }
  };

  const handleProvinceSelect = (province: Province) => {
    setSelectedProvince(province);
    setNewFarmLocation(province.name);
    setShowProvinceModal(false);
  };

  const renderProvinceItem = ({ item }: { item: Province }) => (
    <TouchableOpacity
      style={styles.provinceItem}
      onPress={() => handleProvinceSelect(item)}
    >
      <View style={styles.provinceInfo}>
        <Text style={styles.provinceName}>{item.name}</Text>
        <Text style={styles.provinceNameEn}>{item.nameEn}</Text>
      </View>
      <View style={styles.regionBadge}>
        <Text style={styles.regionText}>{item.region}</Text>
      </View>
    </TouchableOpacity>
  );

  const { northern, central, southern } = getProvincesByRegion();

  const renderFarmItem = ({ item }: { item: FarmWithRole }) => (
    <TouchableOpacity
      style={styles.farmCard}
      onPress={() => navigation.navigate('FarmDetails', { farmId: item.farm_id })}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fffe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.farmCardGradient}
      >
        <View style={styles.farmInfo}>
          <Text style={styles.farmName}>{item.farms.name}</Text>
          <Text style={styles.farmLocation}>📍 {item.farms.location || 'No location'}</Text>
          <View style={styles.farmMeta}>
            <View style={styles.roleContainer}>
              <Text style={styles.farmRole}>Role: {item.farm_role.charAt(0).toUpperCase() + item.farm_role.slice(1)}</Text>
            </View>
            <Text style={styles.farmId}>ID: {item.farm_id.slice(0, 8)}...</Text>
          </View>
        </View>
        <View style={styles.farmActionButton}>
          <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.background}
      >
        {/* Enhanced Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Farm Management</Text>
            <Text style={styles.headerSubtitle}>
              {farmsWithRoles.length} farm{farmsWithRoles.length !== 1 ? 's' : ''} available
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.headerAddButton, showAddForm && styles.headerAddButtonActive]}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons
              name={showAddForm ? "close" : "add"}
              size={24}
              color={showAddForm ? "#FF6B6B" : "white"}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Enhanced Add Farm Form - Always Visible at Top */}
          <View style={[styles.addFormContainer, showAddForm && styles.addFormContainerExpanded]}>
            <TouchableOpacity
              style={[styles.addFormToggle, showAddForm && styles.addFormToggleActive]}
              onPress={() => setShowAddForm(!showAddForm)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={showAddForm ? ['#FF6B6B', '#FF8E8E'] : ['#4CAF50', '#45a049']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addFormToggleGradient}
              >
                <View style={styles.addFormToggleContent}>
                  <View style={styles.addFormToggleLeft}>
                    <View style={styles.addFormToggleIcon}>
                      <Ionicons
                        name={showAddForm ? "remove-circle-outline" : "add-circle"}
                        size={32}
                        color="white"
                      />
                    </View>
                    <View>
                      <Text style={styles.addFormToggleTitle}>
                        {showAddForm ? 'Cancel Adding Farm' : 'Add New Farm'}
                      </Text>
                      <Text style={styles.addFormToggleSubtitle}>
                        {showAddForm ? 'Close the form' : 'Create and manage your farm'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={showAddForm ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="white"
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {showAddForm && (
              <View style={styles.addFormContent}>
                <LinearGradient
                  colors={['#ffffff', '#f8f9fa']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addForm}
                >
                  <Text style={styles.addFormTitle}>🌱 Create Your New Farm</Text>
                  <Text style={styles.addFormDescription}>
                    Fill in the details below to start monitoring your new farm
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      <Ionicons name="leaf" size={16} color="#4CAF50" /> Farm Name
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={newFarmName}
                      onChangeText={setNewFarmName}
                      placeholder="e.g., Green Valley Farm"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      <Ionicons name="location" size={16} color="#4CAF50" /> Location (Province)
                    </Text>
                    <TouchableOpacity
                      style={styles.dropdownInput}
                      onPress={() => setShowProvinceModal(true)}
                    >
                      <Text style={[styles.dropdownText, !selectedProvince && styles.placeholderText]}>
                        {selectedProvince ? selectedProvince.name : 'Select a province in Vietnam'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowAddForm(false);
                        setNewFarmName('');
                        setSelectedProvince(null);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.submitButton, addingFarm && styles.disabledButton]}
                      onPress={addFarm}
                      disabled={addingFarm}
                    >
                      <LinearGradient
                        colors={addingFarm ? ['#a5d6a7', '#a5d6a7'] : ['#4CAF50', '#45a049']}
                        style={styles.submitButtonGradient}
                      >
                        <Text style={styles.submitButtonText}>
                          {addingFarm ? 'Creating...' : 'Create Farm'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Farms List Section */}
          <View style={styles.farmsSection}>
            <View style={styles.sectionHeaderInline}>
              <Text style={styles.sectionTitle}>
                {farmsWithRoles.length > 0 ? 'Your Farms' : 'No Farms Yet'}
              </Text>
              {farmsWithRoles.length > 0 && (
                <View style={styles.farmCountIndicator}>
                  <Text style={styles.farmCountText}>{farmsWithRoles.length}</Text>
                </View>
              )}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="leaf" size={48} color="#4CAF50" />
                <Text style={styles.loadingText}>Loading your farms...</Text>
              </View>
            ) : farmsWithRoles.length > 0 ? (
              <FlatList
                data={farmsWithRoles}
                renderItem={renderFarmItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={styles.farmsList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="leaf-outline" size={64} color="#4CAF50" />
                </View>
                <Text style={styles.emptyTitle}>Start Your Smart Farming Journey</Text>
                <Text style={styles.emptySubtitle}>
                  Create your first farm to begin monitoring soil conditions, weather patterns, and crop health with our advanced IoT sensors.
                </Text>
                <TouchableOpacity
                  style={styles.createFirstFarmButton}
                  onPress={() => setShowAddForm(true)}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#45a049']}
                    style={styles.createFirstFarmButtonGradient}
                  >
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text style={styles.createFirstFarmButtonText}>Create Your First Farm</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Province Selection Modal */}
        <Modal
          visible={showProvinceModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowProvinceModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Province</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowProvinceModal(false)}
                >
                  <Ionicons name="close" size={20} color="#4CAF50" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.provincesList} showsVerticalScrollIndicator={false}>
                <View style={styles.regionSection}>
                  <Text style={styles.regionTitle}>🏔️ Northern Region</Text>
                  {northern.map((province) => (
                    <TouchableOpacity
                      key={province.id}
                      style={styles.provinceItem}
                      onPress={() => handleProvinceSelect(province)}
                    >
                      <View style={styles.provinceInfo}>
                        <Text style={styles.provinceName}>{province.name}</Text>
                        <Text style={styles.provinceNameEn}>{province.nameEn}</Text>
                      </View>
                      <View style={styles.regionBadge}>
                        <Text style={styles.regionText}>{province.region}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.regionSection}>
                  <Text style={styles.regionTitle}>🏖️ Central Region</Text>
                  {central.map((province) => (
                    <TouchableOpacity
                      key={province.id}
                      style={styles.provinceItem}
                      onPress={() => handleProvinceSelect(province)}
                    >
                      <View style={styles.provinceInfo}>
                        <Text style={styles.provinceName}>{province.name}</Text>
                        <Text style={styles.provinceNameEn}>{province.nameEn}</Text>
                      </View>
                      <View style={styles.regionBadge}>
                        <Text style={styles.regionText}>{province.region}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.regionSection}>
                  <Text style={styles.regionTitle}>🌴 Southern Region</Text>
                  {southern.map((province) => (
                    <TouchableOpacity
                      key={province.id}
                      style={styles.provinceItem}
                      onPress={() => handleProvinceSelect(province)}
                    >
                      <View style={styles.provinceInfo}>
                        <Text style={styles.provinceName}>{province.name}</Text>
                        <Text style={styles.provinceNameEn}>{province.nameEn}</Text>
                      </View>
                      <View style={styles.regionBadge}>
                        <Text style={styles.regionText}>{province.region}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </LinearGradient>
      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerAddButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  addFormContainer: {
    marginTop: 20,
  },
  addFormContainerExpanded: {
    marginBottom: 20,
  },
  addFormToggle: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  addFormToggleActive: {
    elevation: 8,
  },
  addFormToggleGradient: {
    borderRadius: 15,
  },
  addFormToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  addFormToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addFormToggleIcon: {
    marginRight: 16,
  },
  addFormToggleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  addFormToggleSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  addFormContent: {
    marginTop: 15,
  },
  addForm: {
    borderRadius: 15,
    padding: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addFormTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  addFormDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 10,
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  farmsSection: {
    flex: 1,
    marginBottom: 100,
  },
  sectionHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  farmCountIndicator: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  farmCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  farmsList: {
    paddingBottom: 20,
  },
  farmCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  farmCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
  },
  farmInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  farmLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  farmMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  farmRole: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  farmId: {
    fontSize: 12,
    color: '#999',
  },
  farmActionButton: {
    marginLeft: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createFirstFarmButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  createFirstFarmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createFirstFarmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  provincesList: {
    paddingBottom: 10,
  },
  regionSection: {
    marginBottom: 20,
  },
  regionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
    paddingLeft: 5,
  },
  provinceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  provinceInfo: {
    flex: 1,
  },
  provinceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  provinceNameEn: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  regionBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  regionText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default Farm;
