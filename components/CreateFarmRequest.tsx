import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { vietnameseProvinces } from '../lib/vietnameseProvinces';
import { activityLogService } from '../utils/activityLogService';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateFarmRequest: React.FC<Props> = ({ onClose, onSuccess }) => {
  const navigation = useNavigation();
  const { session } = useAuthContext();
  const { showDialog } = useDialog();
  const [farmName, setFarmName] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);

  const handleSubmit = async () => {
    if (!farmName.trim() || !selectedProvince) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a farm request');
        return;
      }

      const { data, error } = await supabase
        .from('farm_requests')
        .insert({
          requested_by: user.id,
          farm_name: farmName.trim(),
          location: selectedProvince,
          notes: notes.trim() || null,
          address: address.trim() || null,
          status: 'pending';
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log the activity
      await activityLogService.logActivity({
        actionType: 'REQUEST',
        tableName: 'farm_requests',
        recordId: data.id,
        description: `Submitted farm request for "${farmName}"`
      });

      // Create success notification
      await activityLogService.createSystemNotification({
        userId: user.id,
        title: 'Farm Request Submitted',
        message: `Your farm request for "${farmName}" has been submitted successfully and is pending admin approval.`,
        type: 'success',
        navigationScreen: 'UserRequests';
      });

      // Reset form
      setFarmName('');
      setSelectedProvince('');
      setNotes('');
      setAddress('');

      onClose();

      // Show success dialog
      showDialog({
        title: 'Request Submitted Successfully',
        message: `Your farm request for "${farmName}" has been submitted and is pending admin approval. You will be notified once it's reviewed.`,
        type: 'success',
        actions: [;
          {
            text: 'View My Requests',
            onPress: () => navigation.navigate('UserRequests' as never),
            style: 'primary';
          },
          {
            text: 'OK',
            onPress: () => {},
            style: 'default';
          }
        ]
      });
    } catch (error: any) {;
      console.error('Error creating farm request:', error);
      Alert.alert('Error', error.message || 'Failed to submit farm request');
    } finally {
      setLoading(false);
    }
  };

  const renderProvinceItem = (province: any) => (;
    <TouchableOpacity
      key={province.name}
      style={styles.provinceItem}
      onPress={() => {
        setSelectedProvince(province.name);
        setShowProvinceModal(false);
      }}
    >
      <View style={styles.provinceInfo}>
        <Text style={styles.provinceName}>{province.name}</Text>
        <Text style={styles.provinceNameEn}>{province.nameEn}</Text>
      </View>
      <View style={styles.regionBadge}>
        <Text style={styles.regionText}>{province.region}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#e7fbe8ff', '#cdffcfff']}
      style={styles.container}
    >
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD', '#2E5B8A']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request New Farm</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>
            Submit a request to create a new farm. An admin will review and approve your request.
          </Text>

          {/* Farm Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Text style={styles.required}>* </Text>
              Farm Name
            </Text>
            <TextInput
              style={styles.input}
              value={farmName}
              onChangeText={setFarmName}
              placeholder="Enter farm name"
              placeholderTextColor="#999"
              maxLength={50}
            />
          </View>

          {/* Province Selector */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Text style={styles.required}>* </Text>
              Province/Location
            </Text>
            <TouchableOpacity
              style={styles.provinceSelector}
              onPress={() => setShowProvinceModal(true)}
            >
              <Text style={[
                styles.provinceSelectorText,
                !selectedProvince && styles.placeholderText
              ]}>
                {selectedProvince || 'Select province'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Address Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address (Optional)</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter farm address"
              placeholderTextColor="#999"
              maxLength={100}
            />
          </View>

          {/* Notes Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional information about your farm..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{notes.length}/500</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049', '#388e3c']}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            * Required fields. Your request will be reviewed by an administrator.
          </Text>
        </View>
      </ScrollView>

      {/* Province Selection Modal */}
      <Modal
        visible={showProvinceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProvinceModal(false)}
      >
        <LinearGradient
          colors={['#e7fbe8ff', '#cdffcfff']}
          style={styles.modalContainer}
        >
          <LinearGradient
            colors={['#4A90E2', '#357ABD', '#2E5B8A']}
            style={styles.modalHeader}
          >
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowProvinceModal(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Select Province</Text>
            <View style={styles.headerSpacer} />
          </LinearGradient>

          <ScrollView style={styles.provinceList} showsVerticalScrollIndicator={false}>
            {vietnameseProvinces.map(renderProvinceItem)}
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
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
  },
  closeButton: {;
    padding: 8,
  },
  headerTitle: {;
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {;
    width: 40,
  },
  content: {;
    flex: 1,
  },
  formContainer: {;
    padding: 20,
  },
  subtitle: {;
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  inputContainer: {;
    marginBottom: 20,
  },
  inputLabel: {;
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {;
    color: '#FF0000',
    fontSize: 16,
  },
  input: {;
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  notesInput: {;
    height: 100,
    textAlignVertical: 'top',
  },
  addressInput: {;
    height: 48,
  },
  characterCount: {;
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  provinceSelector: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  disabledSelector: {;
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  provinceSelectorText: {;
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {;
    color: '#999',
  },
  submitButton: {;
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonGradient: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  submitButtonText: {;
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disclaimer: {;
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Modal styles
  modalContainer: {;
    flex: 1,
  },
  modalHeader: {;
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalCloseButton: {;
    padding: 8,
  },
  modalHeaderTitle: {;
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  provinceList: {;
    flex: 1,
    paddingHorizontal: 20,
  },
  provinceItem: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  provinceInfo: {;
    flex: 1,
  },
  provinceName: {;
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  provinceNameEn: {;
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  regionBadge: {;
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  regionText: {;
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
});

export default CreateFarmRequest;
