import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; 
import { useNavigation, useRoute, NavigationProp  } from '@react-navigation/native'; // Add this import
import BottomNavigation from '../components/BottomNavigation';
import AddFarm from '../components/AddFarm';
import { RootStackParamList } from '../App';

const Settings = () => {
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  return (
    <View style={styles.outerContainer}>
      <Text style={styles.settingsTitle}>Settings</Text>
      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBox}
      >
        {/* Profile - Now with navigation */}
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={handleProfilePress}
        >
          <View style={styles.itemContent}>
            <Ionicons name="person-outline" size={24} color="#333" style={styles.itemIcon} />
            <Text style={styles.itemText}>Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>

        {/* Add farm */}
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setVisible(true)}
        >
          <View style={styles.itemContent}>
            <Ionicons name="add-circle-outline" size={24} color="#333" style={styles.itemIcon} />
            <Text style={styles.itemText}>Add farm</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>

        {/* Notification Settings */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.itemContent}>
            <Ionicons name="notifications-outline" size={24} color="#333" style={styles.itemIcon} />
            <Text style={styles.itemText}>Notification Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>

        {/* About */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.itemContent}>
            <Ionicons name="information-circle-outline" size={24} color="#333" style={styles.itemIcon} />
            <Text style={styles.itemText}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>

        {/* Privacy Policy */}
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.itemContent}>
            <Ionicons name="lock-closed-outline" size={24} color="#333" style={styles.itemIcon} />
            <Text style={styles.itemText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </LinearGradient>

      <BottomNavigation />

      {/* Dialog AddFarm */}
      <AddFarm
        visible={visible}
        onClose={() => setVisible(false)}
        onSelect={(farm) => console.log("Chọn farm:", farm)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#e7fbe8ff',
    justifyContent: 'flex-start',
    alignItems: 'center', 
  },
  gradientBox: {
    width: '90%', 
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  settingsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    margin: 20,
    padding: 20,
    textAlign: 'left',
    width: '100%',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 15,
  },
  itemText: {
    fontSize: 18,
    color: '#333',
  },
});

export default Settings;