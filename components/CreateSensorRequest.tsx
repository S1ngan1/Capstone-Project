import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { activityLogService } from '../utils/activityLogService';
import {
  SENSOR_TYPES,
  BUDGET_RANGES,
  PRIORITY_LEVELS,
  CreateSensorRequestData,
  SensorRequest
} from '../interfaces/SensorRequest';
import { SensorRequestService } from '../hooks/useSensorRequests';

interface Props {
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
  farmId?: string;
}

interface Farm {
  id: string;
  name: string;
  location: string;
}

const CreateSensorRequest: React.FC<Props> = ({ visible, onClose, onRefresh, farmId }) => {
  const { session } = useAuthContext();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showFarmModal, setShowFarmModal] = useState(false);
  const [showSensorTypeModal, setShowSensorTypeModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateSensorRequestData>({
    farm_id: farmId || '',
    sensor_type: 'ph',
    sensor_brand: '',
    sensor_model: '',
    quantity: 1,
    installation_location: '',
    justification: '',
    technical_requirements: '',
    budget_range: '100_500',
    priority_level: 'medium';
  });

  useEffect(() => {
    if (!farmId) {
      fetchUserFarms();
    }
  }, [farmId]);

  const fetchUserFarms = async () => {
    try {
      const { data, error } = await supabase
        .from('farm_users')
        .select(`
          farm_id,
          farms!inner(id, name, location)
        `)
        .eq('user_id', session?.user?.id)
        .in('farm_role', ['owner', 'manager']);

      if (error) throw error;
      setFarms(data?.map(item => item.farms) || []);
    } catch (error: any) {;
      console.error('Error fetching farms:', error);
      Alert.alert('Error', 'Failed to load your farms');
    }
  };

  const validateStep = (stepNumber: number): boolean => {;
    switch (stepNumber) {
      case 1:
        return !!(formData.farm_id && formData.sensor_type && formData.quantity > 0);
      case 2:
        return !!(formData.installation_location.trim() && formData.justification.trim());
      case 3:
        return !!(formData.budget_range && formData.priority_level);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      Alert.alert('Incomplete Information', 'Please fill in all required fields before proceeding.');
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!formData.farm_id || !formData.sensor_type || formData.quantity <= 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log('CreateSensorRequest: Starting submission process...');
      console.log('CreateSensorRequest: Form data:', formData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a sensor request');
        return;
      }

      console.log('CreateSensorRequest: User authenticated:', user.id);

      // Get farm details for notification
      const { data: farmData } = await supabase
        .from('farms')
        .select('name')
        .eq('id', formData.farm_id)
        .single();

      console.log('CreateSensorRequest: Farm data:', farmData);

      // Create the sensor request with all required fields
      const requestData = {
        requested_by: user.id,
        farm_id: formData.farm_id,
        sensor_type: formData.sensor_type,
        quantity: formData.quantity,
        installation_location: formData.installation_location.trim() || 'Not specified',
        justification: formData.justification.trim() || 'No justification provided',
        technical_requirements: formData.technical_requirements?.trim() || null,
        budget_range: formData.budget_range || '100_500',
        priority_level: formData.priority_level || 'medium',
        status: 'pending';
      };

      console.log('CreateSensorRequest: Inserting request data:', requestData);

      const { data, error } = await supabase
        .from('sensor_requests')
        .insert(requestData)
        .select()
        .single();

      if (error) {
        console.error('CreateSensorRequest: Database error:', error);
        throw error;
      }

      console.log('CreateSensorRequest: Successfully created request:', data);

      // Log the activity
      await activityLogService.logActivity({
        actionType: 'REQUEST',
        tableName: 'sensor_requests',
        recordId: data.id,
        description: `Submitted ${formData.sensor_type} sensor request for farm "${farmData?.name}"`
      });

      // Create success notification
      await activityLogService.createSystemNotification({
        userId: user.id,
        title: 'Sensor Request Submitted',
        message: `Your ${formData.sensor_type} sensor request for "${farmData?.name}" has been submitted successfully and is pending admin approval.`,
        type: 'success',
        navigationScreen: 'UserRequests';
      });

      // Reset form
      setFormData({
        farm_id: farmId || '',
        sensor_type: 'ph',
        sensor_brand: '',
        sensor_model: '',
        quantity: 1,
        installation_location: '',
        justification: '',
        technical_requirements: '',
        budget_range: '100_500',
        priority_level: 'medium';
      });

      onClose();

      Alert.alert(
        'Success',
        `Your ${formData.sensor_type} sensor request has been submitted successfully and is pending admin approval.`,
        [
          {
            text: 'OK',
            onPress: () => {},
          }
        ]
      );

      console.log('CreateSensorRequest: Request submission completed successfully');
    } catch (error: any) {;
      console.error('CreateSensorRequest: Error creating sensor request:', error);
      Alert.alert('Error', error.message || 'Failed to submit sensor request');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (updates: Partial<CreateSensorRequestData>) => {;
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Get selected farm object
  const selectedFarm = farms.find(farm => farm.id === formData.farm_id) ||
    (farmId ? { id: farmId, name: 'Current Farm', location: 'Farm Location' } : null);

  // Get selected sensor type object
  const selectedSensorType = SENSOR_TYPES[formData.sensor_type];

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((stepNumber) => (
        <View key={stepNumber} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            step >= stepNumber ? styles.stepCircleActive : styles.stepCircleInactive
          ]}>
            <Text style={[
              styles.stepNumber,
              step >= stepNumber ? styles.stepNumberActive : styles.stepNumberInactive
            ]}>
              {stepNumber}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel,
            step >= stepNumber ? styles.stepLabelActive : styles.stepLabelInactive
          ]}>
            {stepNumber === 1 ? 'Sensor' : stepNumber === 2 ? 'Details' : 'Review'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Sensor Selection</Text>
      <Text style={styles.stepDescription}>Choose your farm and sensor type</Text>

      {/* Farm Selection */}
      {!farmId && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Farm <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowFarmModal(true)}
          >
            <Text style={[styles.selectButtonText, !selectedFarm && styles.placeholder]}>
              {selectedFarm ? selectedFarm.name : 'Select a farm'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {selectedFarm && (
            <Text style={styles.helperText}>📍 {selectedFarm.location}</Text>
          )}
        </View>
      )}

      {/* Sensor Type Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Sensor Type <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowSensorTypeModal(true)}
        >
          <View style={styles.sensorTypeDisplay}>
            <Ionicons name={selectedSensorType.icon as any} size={20} color="#4A90E2" />
            <Text style={styles.selectButtonText}>{selectedSensorType.name}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        <Text style={styles.helperText}>{selectedSensorType.description}</Text>
        <Text style={styles.costInfo}>💰 {selectedSensorType.typical_cost_range}</Text>
      </View>

      {/* Quantity */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Quantity <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[styles.quantityButton, formData.quantity <= 1 && styles.quantityButtonDisabled]}
            onPress={() => formData.quantity > 1 && updateFormData({ quantity: formData.quantity - 1 })}
            disabled={formData.quantity <= 1}
          >
            <Ionicons name="remove" size={20} color={formData.quantity <= 1 ? "#ccc" : "#4A90E2"} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{formData.quantity}</Text>
          <TouchableOpacity
            style={[styles.quantityButton, formData.quantity >= 10 && styles.quantityButtonDisabled]}
            onPress={() => formData.quantity < 10 && updateFormData({ quantity: formData.quantity + 1 })}
            disabled={formData.quantity >= 10}
          >
            <Ionicons name="add" size={20} color={formData.quantity >= 10 ? "#ccc" : "#4A90E2"} />
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>Maximum 10 sensors per request</Text>
      </View>

      {/* Optional: Brand and Model */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Preferred Brand (Optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.sensor_brand}
          onChangeText={(text) => updateFormData({ sensor_brand: text })}
          placeholder="e.g., Atlas Scientific, Hanna Instruments"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Preferred Model (Optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.sensor_model}
          onChangeText={(text) => updateFormData({ sensor_model: text })}
          placeholder="e.g., EZO-pH, HI-98107"
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Installation Details</Text>
      <Text style={styles.stepDescription}>Provide location and justification for the sensor</Text>

      {/* Installation Location */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Installation Location <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.installation_location}
          onChangeText={(text) => updateFormData({ installation_location: text })}
          placeholder="Describe exactly where the sensor will be installed (e.g., Greenhouse A, Section 2, North corner near irrigation line)"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <Text style={styles.helperText}>Be specific about the exact location for optimal installation</Text>
      </View>

      {/* Justification */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Justification <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.justification}
          onChangeText={(text) => updateFormData({ justification: text })}
          placeholder="Explain why this sensor is needed and how it will benefit your farming operations"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.helperText}>Help us understand the impact this sensor will have</Text>
      </View>

      {/* Technical Requirements */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Technical Requirements (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.technical_requirements}
          onChangeText={(text) => updateFormData({ technical_requirements: text })}
          placeholder="Any specific technical requirements, connectivity needs, or special considerations"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Budget & Priority</Text>
      <Text style={styles.stepDescription}>Set your budget range and priority level</Text>

      {/* Budget Range */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Budget Range <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowBudgetModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {BUDGET_RANGES[formData.budget_range]}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        <Text style={styles.helperText}>This helps us recommend appropriate sensors</Text>
      </View>

      {/* Priority Level */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Priority Level <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowPriorityModal(true)}
        >
          <View style={styles.priorityDisplay}>
            <View style={[
              styles.priorityDot,
              { backgroundColor: PRIORITY_LEVELS[formData.priority_level].color }
            ]} />
            <Text style={styles.selectButtonText}>
              {PRIORITY_LEVELS[formData.priority_level].label}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        <Text style={styles.helperText}>
          {PRIORITY_LEVELS[formData.priority_level].description}
        </Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Request Summary</Text>
        <View style={styles.summaryItem}>
          <Ionicons name="business-outline" size={16} color="#666" />
          <Text style={styles.summaryText}>
            {selectedFarm?.name || 'Farm not selected'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name={selectedSensorType.icon as any} size={16} color="#666" />
          <Text style={styles.summaryText}>
            {formData.quantity}x {selectedSensorType.name}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.summaryText}>
            {BUDGET_RANGES[formData.budget_range]}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[
            styles.priorityDot,
            { backgroundColor: PRIORITY_LEVELS[formData.priority_level].color }
          ]} />
          <Text style={styles.summaryText}>
            {PRIORITY_LEVELS[formData.priority_level].label} Priority
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <LinearGradient colors={['#e7fbe8ff', '#cdffcfff']} style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#4A90E2', '#357ABD', '#2E5B8A']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Sensor</Text>
          <View style={styles.headerRight} />
        </LinearGradient>

        {/* Progress Indicator */}
        {renderStepIndicator()}

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {step > 1 && (
            <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
              <Text style={styles.previousButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          {step < 3 ? (
            <TouchableOpacity
              style={[styles.nextButton, !validateStep(step) && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!validateStep(step)}
            >
              <LinearGradient
                colors={validateStep(step) ? ['#4CAF50', '#45a049'] : ['#ccc', '#bbb']}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#ccc', '#bbb'] : ['#4CAF50', '#45a049']}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color="white" />
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Modals */}
        {/* Farm Selection Modal */}
        {!farmId && (
          <Modal visible={showFarmModal} animationType="slide" transparent>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Farm</Text>
                  <TouchableOpacity onPress={() => setShowFarmModal(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalList}>
                  {farms.map((farm) => (
                    <TouchableOpacity
                      key={farm.id}
                      style={styles.modalItem}
                      onPress={() => {
                        updateFormData({ farm_id: farm.id });
                        setShowFarmModal(false);
                      }}
                    >
                      <Text style={styles.modalItemTitle}>{farm.name}</Text>
                      <Text style={styles.modalItemSubtitle}>📍 {farm.location}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* Sensor Type Selection Modal */}
        <Modal visible={showSensorTypeModal} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Sensor Type</Text>
                <TouchableOpacity onPress={() => setShowSensorTypeModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {Object.entries(SENSOR_TYPES).map(([key, sensorType]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.modalItem}
                    onPress={() => {
                      updateFormData({ sensor_type: key as any });
                      setShowSensorTypeModal(false);
                    }}
                  >
                    <View style={styles.sensorTypeModalItem}>
                      <Ionicons name={sensorType.icon as any} size={24} color="#4A90E2" />
                      <View style={styles.sensorTypeModalInfo}>
                        <Text style={styles.modalItemTitle}>{sensorType.name}</Text>
                        <Text style={styles.modalItemSubtitle}>{sensorType.description}</Text>
                        <Text style={styles.sensorTypeCost}>💰 {sensorType.typical_cost_range}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Budget Range Modal */}
        <Modal visible={showBudgetModal} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Budget Range</Text>
                <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {Object.entries(BUDGET_RANGES).map(([key, range]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.modalItem}
                    onPress={() => {
                      updateFormData({ budget_range: key as any });
                      setShowBudgetModal(false);
                    }}
                  >
                    <Text style={styles.modalItemTitle}>{range}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Priority Level Modal */}
        <Modal visible={showPriorityModal} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Priority Level</Text>
                <TouchableOpacity onPress={() => setShowPriorityModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {Object.entries(PRIORITY_LEVELS).map(([key, priority]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.modalItem}
                    onPress={() => {
                      updateFormData({ priority_level: key as any });
                      setShowPriorityModal(false);
                    }}
                  >
                    <View style={styles.priorityModalItem}>
                      <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
                      <View style={styles.priorityModalInfo}>
                        <Text style={styles.modalItemTitle}>{priority.label}</Text>
                        <Text style={styles.modalItemSubtitle}>{priority.description}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {;
    padding: 5,
  },
  headerTitle: {;
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerRight: {;
    width: 34,
  },
  stepIndicator: {;
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  stepItem: {;
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {;
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  stepCircleActive: {;
    backgroundColor: '#4A90E2',
  },
  stepCircleInactive: {;
    backgroundColor: '#E0E0E0',
  },
  stepNumber: {;
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepNumberActive: {;
    color: 'white',
  },
  stepNumberInactive: {;
    color: '#666',
  },
  stepLabel: {;
    fontSize: 12,
    fontWeight: '600',
  },
  stepLabelActive: {;
    color: '#4A90E2',
  },
  stepLabelInactive: {;
    color: '#666',
  },
  content: {;
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {;
    paddingVertical: 20,
  },
  stepTitle: {;
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {;
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  inputGroup: {;
    marginBottom: 20,
  },
  label: {;
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {;
    color: '#E74C3C',
  },
  input: {;
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {;
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectButton: {;
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonText: {;
    fontSize: 16,
    color: '#333',
  },
  placeholder: {;
    color: '#999',
  },
  helperText: {;
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  costInfo: {;
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    marginTop: 3,
  },
  sensorTypeDisplay: {;
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {;
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {;
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  quantityButtonDisabled: {;
    opacity: 0.5,
  },
  quantityText: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  priorityDisplay: {;
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {;
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  summaryContainer: {;
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryItem: {;
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {;
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  navigationContainer: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  previousButton: {;
    padding: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  previousButtonText: {;
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {;
    borderRadius: 8,
    overflow: 'hidden',
  },
  nextButtonDisabled: {;
    opacity: 0.5,
  },
  nextButtonGradient: {;
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  nextButtonText: {;
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  submitButton: {;
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitButtonDisabled: {;
    opacity: 0.5,
  },
  submitButtonGradient: {;
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  submitButtonText: {;
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {;
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {;
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {;
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalList: {;
    maxHeight: 400,
  },
  modalItem: {;
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemTitle: {;
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalItemSubtitle: {;
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sensorTypeModalItem: {;
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorTypeModalInfo: {;
    marginLeft: 12,
    flex: 1,
  },
  sensorTypeCost: {;
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    marginTop: 2,
  },
  priorityModalItem: {;
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityModalInfo: {;
    marginLeft: 12,
    flex: 1,
  },
});

export default CreateSensorRequest;
