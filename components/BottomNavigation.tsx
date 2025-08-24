import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase'; // Adjust import path as needed

const BottomNavigation = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { session } = useAuthContext();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch role từ bảng farm_users
  useEffect(() => {
  const fetchUserRole = async () => {
    if (session?.user?.id) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)

        if (error) throw error;

        if (data && data.length > 0) {
          setUserRole(data[0].role);
          console.log("User role set to:", data[0].role);
        } else {
          setUserRole('owner'); 
          console.log("User role fallback: owner");
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setUserRole('owner'); // fallback khi có lỗi
      } finally {
        setLoading(false);
      }
    }
  };

  fetchUserRole();
}, [session]);



  if (loading) {
    return null; // Hoặc render spinner/loading UI
  }

  // Base tabs
  const baseTabs = [
    { name: 'Home', label: 'Home', icon: 'home' },
    { name: 'Farm', label: 'Farm', icon: 'leaf' },
    { name: 'Suggestion', label: 'Suggestion', icon: 'bulb' },
    { name: 'Settings', label: 'Settings', icon: 'settings' },
    
    ];


  // Nếu role = manager thì thêm UserManagement
  const tabs =
    userRole?.trim() === 'manager'
      ? [
          ...baseTabs.slice(0, 3), // Home, Farm, Suggestion
          { name: 'UserManagement', label: 'Users', icon: 'people' },
          baseTabs[3], // Settings
        ]
      : baseTabs;

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: 5 + insets.bottom }]}>
      {tabs.map((tab) => {
        const isFocused = route.name === tab.name;
        const iconName = isFocused
          ? tab.icon
          : (`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap);
        const iconColor = isFocused ? '#00A388' : 'gray';

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => navigation.navigate(tab.name as keyof RootStackParamList)}
            style={styles.tabBarButton}
          >
            <Ionicons name={iconName} size={24} color={iconColor} />
            <Text style={[styles.tabBarLabel, { color: iconColor }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNavigation;

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 125,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  tabBarButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
