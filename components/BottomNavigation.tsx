import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Home from '../screens/Home';
import Account from '../screens/Account';

export type RootTabParamList = {
  HomeTab: undefined;
  FarmTab: undefined;
  SuggestionTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const FarmScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Farm Screen</Text>
  </View>
);

const SuggestionScreen = () => (
  <View style={styles.placeholderScreen}>
    <Text style={styles.placeholderText}>Suggestion Screen</Text>
  </View>
);

const BottomNavigaton = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'FarmTab') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'SuggestionTab') {
            iconName = focused ? 'bulb' : 'bulb-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          const iconColor = focused ? '#00A388' : 'gray'; 
          return <Ionicons name={iconName} size={size} color={iconColor} />;
        },
        tabBarActiveTintColor: '#00A388',
        tabBarInactiveTintColor: 'black',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 60,
          paddingBottom: 5,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={Home} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="FarmTab" component={FarmScreen} options={{ tabBarLabel: 'Farm' }} />
      <Tab.Screen name="SuggestionTab" component={SuggestionScreen} options={{ tabBarLabel: 'Suggestion' }} />
      <Tab.Screen name="ProfileTab" component={Account} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default BottomNavigaton

const styles = StyleSheet.create({
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e7fbe8ff',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});
