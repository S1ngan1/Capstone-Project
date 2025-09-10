import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, Switch, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import SensorDataTable from '../components/Charts/SensorDataTable';
import WeatherWidget from '../components/WeatherWidget';
import BottomNavigation from '../components/BottomNavigation';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Farm, FarmUser, Sensor, SensorData, SectionItem, RootStackParamList } from '../types/interfaces';

type FarmDetailsRouteProp = RouteProp<RootStackParamList, 'FarmDetails'>;

const FarmDetails = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<FarmDetailsRouteProp>();
  const { session } = useAuthContext();
  const { farmId } = route.params;

  const [farm, setFarm] = useState<Farm | null>(null);
  const [farmUsers, setFarmUsers] = useState<FarmUser[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<SectionItem[]>([
    { id: '1', title: '🌤️ Weather Overview', type: 'weather', enabled: true, icon: 'partly-sunny' },
    { id: '2', title: '📊 Sensor Data & Analytics', type: 'sensorData', enabled: true, icon: 'analytics' },
    { id: '3', title: '🔧 Farm Sensors', type: 'sensors', enabled: true, icon: 'hardware-chip' },
    { id: '4', title: '👥 Farm Members', type: 'members', enabled: true, icon: 'people' },
  ]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    fetchFarmDetails();
    loadSectionPreferences();
    checkFirstVisit();
  }, [farmId, session]);

  const checkFirstVisit = async () => {
    try {
      const hasSeenHelp = await AsyncStorage.getItem('hasSeenSectionHelp');
      if (!hasSeenHelp) {
        setTimeout(() => {
          setShowHelpModal(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking first visit:', error);
    }
  };

  const markHelpAsSeen = async () => {
    try {
      await AsyncStorage.setItem('hasSeenSectionHelp', 'true');
      setShowHelpModal(false);
    } catch (error) {
      console.error('Error marking help as seen:', error);
    }
  };

  const loadSectionPreferences = async () => {
    try {
      const storedSections = await AsyncStorage.getItem(`farmSections_${farmId}`);
      if (storedSections) {
        setSections(JSON.parse(storedSections));
      }
    } catch (error) {
      console.error('Error loading section preferences:', error);
    }
  };

  const saveSectionPreferences = async (newSections: SectionItem[]) => {
    try {
      await AsyncStorage.setItem(`farmSections_${farmId}`, JSON.stringify(newSections));
    } catch (error) {
      console.error('Error saving section preferences:', error);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, enabled: !section.enabled }
        : section
    );
    setSections(newSections);
    saveSectionPreferences(newSections);
  };

  const onDragEnd = ({ data }: { data: SectionItem[] }) => {
    setSections(data);
    saveSectionPreferences(data);
  };

  const fetchFarmDetails = async () => {
    if (!session?.user?.id || !farmId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch farm details
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('id, name, location')
        .eq('id', farmId)
        .single();

      if (!farmError && farmData) {
        setFarm(farmData);
      }

      // Fetch current user's farm role for this farm
      const { data: userRoleData, error: roleError } = await supabase
        .from('farm_users')
        .select('farm_role')
        .eq('farm_id', farmId)
        .eq('user_id', session.user.id)
        .single();

      if (!roleError && userRoleData) {
        setUserRole(userRoleData.farm_role);
      }

      // Fetch all users for this farm with updated schema
      const { data: usersData, error: usersError } = await supabase
        .from('farm_users')
        .select(`
          id,
          user_id,
          farm_role,
          profiles!inner (
            username,
            email,
            role
          )
        `)
        .eq('farm_id', farmId);

      if (!usersError && usersData) {
        // Fix the profiles structure
        const formattedUsers = usersData.map(user => ({
          ...user,
          profiles: Array.isArray(user.profiles) ? user.profiles[0] : user.profiles
        }));
        setFarmUsers(formattedUsers as FarmUser[]);
      }

      // Fetch real sensors from sensor table with correct column names
      console.log('Fetching sensors for farm:', farmId);

      const { data: sensorTableData, error: sensorTableError } = await supabase
        .from('sensor')
        .select(`
          sensor_id,
          sensor_name,
          sensor_type,
          status,
          units,
          farm_id,
          model,
          calibration_date,
          notes
        `)
        .eq('farm_id', farmId);

      if (!sensorTableError && sensorTableData && sensorTableData.length > 0) {
        console.log('Found real sensors:', sensorTableData);

        // Get latest readings for each sensor from sensor_data table
        const sensorsWithReadings: Sensor[] = [];

        for (const sensor of sensorTableData) {
          // Fetch latest reading for this sensor
          const { data: latestReading, error: readingError } = await supabase
            .from('sensor_data')
            .select('value, created_at')
            .eq('sensor_id', sensor.sensor_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          sensorsWithReadings.push({
            id: sensor.sensor_id,
            name: sensor.sensor_name || 'Unknown Sensor',
            type: sensor.sensor_type || 'unknown',
            status: (sensor.status as 'active' | 'inactive' | 'maintenance') || 'active',
            last_reading: latestReading?.value || 0,
            unit: sensor.units || '',
            updated_at: latestReading?.created_at || sensor.calibration_date || new Date().toISOString(),
            farm_id: sensor.farm_id,
            location: sensor.notes || 'Farm Location',
          });
        }

        setSensors(sensorsWithReadings);
        console.log('Processed sensors with readings:', sensorsWithReadings);
      } else {
        console.error('Error fetching sensors or no sensors found:', sensorTableError);
        setSensors([]);
      }
    } catch (error) {
      console.error('Error fetching farm details:', error);
      setSensors([]);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: FarmUser }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => (navigation as any).navigate('UserDetail', { userId: item.user_id })}
      activeOpacity={0.8}
    >
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={24} color="#4CAF50" />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.profiles.username}</Text>
          <Text style={styles.userEmail}>{item.profiles.email}</Text>
          <Text style={styles.appRoleText}>
            App Role: {item.profiles.role?.replace('_', ' ').toUpperCase() || 'NORMAL USER'}
          </Text>
        </View>
      </View>
      <View style={styles.roleContainer}>
        <Text style={[styles.roleText, getFarmRoleStyle(item.farm_role)]}>
          {item.farm_role?.charAt(0).toUpperCase() + item.farm_role?.slice(1) || 'Unknown'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSensorItem = ({ item }: { item: Sensor }) => (
    <TouchableOpacity
      style={styles.sensorCard}
      onPress={() => (navigation as any).navigate('SensorDetail', { sensorId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.sensorHeader}>
        <View style={styles.sensorInfo}>
          <Text style={styles.sensorName}>{item.name}</Text>
          <Text style={styles.sensorType}>{item.type?.toUpperCase() || 'UNKNOWN'}</Text>
        </View>
        <View style={[styles.statusIndicator, item.status === 'active' ? styles.activeStatus : styles.inactiveStatus]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.sensorReading}>
        <Text style={styles.readingValue}>
          {item.last_reading} {item.unit}
        </Text>
        <Text style={styles.lastUpdated}>
          Updated: {new Date(item.updated_at).toLocaleTimeString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getFarmRoleStyle = (farmRole: string) => {
    switch (farmRole) {
      case 'owner':
        return styles.ownerRole;
      case 'manager':
        return styles.managerRole;
      default:
        return styles.viewerRole;
    }
  };

  const renderSectionContent = (section: SectionItem) => {
    if (!section.enabled) return null;

    switch (section.type) {
      case 'weather':
        return farm?.location ? (
          <View style={styles.sectionContent}>
            <WeatherWidget location={farm.location} compact={false} />
          </View>
        ) : null;

      case 'sensorData':
        return (
          <View style={styles.sectionContent}>
            <SensorDataTable farmId={farmId} />
          </View>
        );

      case 'sensors':
        return (
          <View style={styles.sectionContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading sensors...</Text>
              </View>
            ) : sensors.length > 0 ? (
              <FlatList
                data={sensors}
                renderItem={renderSensorItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="hardware-chip-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>No sensors configured for this farm</Text>
              </View>
            )}
          </View>
        );

      case 'members':
        return (
          <View style={styles.sectionContent}>
            {farmUsers.length > 0 ? (
              <FlatList
                data={farmUsers}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>No members found</Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const renderDraggableItem = ({ item, drag, isActive }: RenderItemParams<SectionItem>) => {
    const count = item.type === 'sensors' ? sensors.length : 
                 item.type === 'members' ? farmUsers.length : 0;

    return (
      <View style={[styles.draggableSection, isActive && styles.activeDraggableSection]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <TouchableOpacity
              onLongPress={drag}
              disabled={isActive}
              style={styles.dragHandle}
            >
              <Ionicons name="reorder-three" size={24} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.titleWithCount}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              {(item.type === 'sensors' || item.type === 'members') && (
                <View style={[styles.countBadge, item.type === 'sensors' ? styles.sensorCount : styles.memberCount]}>
                  <Text style={styles.countText}>{count}</Text>
                </View>
              )}
            </View>
            
            <Switch
              value={item.enabled}
              onValueChange={() => toggleSection(item.id)}
              trackColor={{ false: '#ddd', true: '#4CAF50' }}
              thumbColor={item.enabled ? '#fff' : '#fff'}
            />
          </View>
        </View>
        
        {renderSectionContent(item)}
      </View>
    );
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
            <Text style={styles.loadingText}>Loading farm details...</Text>
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
          <View style={styles.headerContent}>
            <Text style={styles.farmName}>{farm?.name || 'Loading...'}</Text>
            <Text style={styles.farmLocation}>📍 {farm?.location || ''}</Text>
            <Text style={styles.userRole}>Your role: {userRole}</Text>
          </View>
          {/* Settings button removed as requested */}
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setShowHelpModal(true)}
          >
            <Ionicons name="help-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Draggable Sections */}
        <View style={styles.content}>
          <DraggableFlatList
            data={sections}
            onDragEnd={onDragEnd}
            keyExtractor={(item) => item.id}
            renderItem={renderDraggableItem}
            contentContainerStyle={styles.sectionsContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </LinearGradient>
      <BottomNavigation />

      {/* Help Modal */}
      <Modal
        visible={showHelpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.helpModalContent}>
            <View style={styles.helpModalHeader}>
              <Text style={styles.helpModalTitle}>📱 Customize Your Dashboard</Text>
              <TouchableOpacity
                onPress={() => setShowHelpModal(false)}
                style={styles.helpModalClose}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.helpModalBody}>
              <View style={styles.helpItem}>
                <Ionicons name="reorder-three" size={24} color="#4CAF50" />
                <Text style={styles.helpItemText}>
                  <Text style={styles.helpItemTitle}>Drag to Reorder:</Text>{'\n'}
                  Hold and drag the three-line icon to rearrange sections in your preferred order.
                </Text>
              </View>
              
              <View style={styles.helpItem}>
                <View style={styles.helpToggle}>
                  <Switch value={true} trackColor={{ false: '#ddd', true: '#4CAF50' }} />
                </View>
                <Text style={styles.helpItemText}>
                  <Text style={styles.helpItemTitle}>Toggle Visibility:</Text>{'\n'}
                  Use the switches to show or hide sections you don't need.
                </Text>
              </View>
              
              <View style={styles.helpItem}>
                <Ionicons name="save" size={24} color="#2196F3" />
                <Text style={styles.helpItemText}>
                  <Text style={styles.helpItemTitle}>Auto-Save:</Text>{'\n'}
                  Your preferences are automatically saved and will persist across app sessions.
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.helpModalButton}
              onPress={markHelpAsSeen}
            >
              <Text style={styles.helpModalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

  {/* Settings modal removed as requested */}
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  farmName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  farmLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  weatherSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sensorSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sensorsSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  membersSection: {
    marginBottom: 100,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  titleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorCount: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 24,
    alignItems: 'center',
    marginLeft: 8,
  },
  sensorCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  memberCount: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 24,
    alignItems: 'center',
    marginLeft: 8,
  },
  memberCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sensorCard: {
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
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sensorType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: '#d4edda',
  },
  inactiveStatus: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  sensorReading: {
    alignItems: 'flex-start',
  },
  readingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  userCard: {
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e7fbe8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  appRoleText: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 2,
  },
  roleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ownerRole: {
    backgroundColor: '#ffd700',
    color: '#333',
  },
  managerRole: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  viewerRole: {
    backgroundColor: '#ddd',
    color: '#333',
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
  lastSection: {
    marginBottom: 80, // Add margin to ensure visibility above bottom navigation
  },
  bottomSpacer: {
    height: 70, // Height of the bottom navigation
  },
  noDataCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  addSensorButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  addSensorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // New styles for draggable sections
  sectionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  draggableSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeDraggableSection: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dragHandle: {
    padding: 5,
    marginRight: 10,
  },
  countBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 24,
    alignItems: 'center',
    marginLeft: 8,
  },
  countText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionContent: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  // Help button and modal styles
  helpButton: {
    padding: 5,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  helpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  helpModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  helpModalClose: {
    padding: 5,
  },
  helpModalBody: {
    padding: 20,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  helpItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  helpItemTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  helpToggle: {
    transform: [{ scale: 0.8 }],
  },
  helpModalButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  helpModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FarmDetails;
