import 'react-native-url-polyfill/auto';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { TutorialProvider } from './context/TutorialContext';

// Import screens
import Home from './screens/Home';
import Farm from './screens/Farm';
import FarmDetails from './screens/FarmDetails';
import SensorDetail from './screens/SensorDetail';
import Settings from './screens/Settings';
import Profile from './screens/Profile';
import About from './screens/About';
import Notification from './screens/Notification';
import CreateFarm from './screens/CreateFarm';
import UserRequests from './screens/UserRequests';
import UserSensorRequests from './screens/UserSensorRequests';
import AdminFarmRequests from './screens/AdminFarmRequests';
import AdminSensorRequests from './screens/AdminSensorRequests';
import UserManagement from './screens/UserManagement';
import UserDetail from './screens/UserDetail';
import ActivityLogs from './screens/ActivityLogs';
import Suggestion from './screens/Suggestion';
import Account from './screens/Account';
import PrivacyPolicy from './screens/PrivacyPolicy';
import Onboarding from './screens/Onboarding';

// Import tutorial component
import AppTutorial from './components/AppTutorial';

// Define navigation stack param list
export type RootStackParamList = {
  Home: undefined;
  Farm: { farmId: string };
  FarmDetails: { farmId: string };
  SensorDetail: { sensorId: string; farmId: string };
  Settings: undefined;
  Profile: undefined;
  About: undefined;
  Notification: undefined;
  CreateFarm: undefined;
  UserRequests: undefined;
  UserSensorRequests: undefined;
  AdminFarmRequests: undefined;
  AdminSensorRequests: undefined;
  UserManagement: undefined;
  UserDetail: { userId: string };
  ActivityLogs: undefined;
  Suggestion: undefined;
  Account: undefined;
  PrivacyPolicy: undefined;
  Onboarding: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DialogProvider>
          <TutorialProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#f5f5f5' }
                }}
              >
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen name="Farm" component={Farm} />
                <Stack.Screen name="FarmDetails" component={FarmDetails} />
                <Stack.Screen name="SensorDetail" component={SensorDetail} />
                <Stack.Screen name="Settings" component={Settings} />
                <Stack.Screen name="Profile" component={Profile} />
                <Stack.Screen name="About" component={About} />
                <Stack.Screen name="Notification" component={Notification} />
                <Stack.Screen name="CreateFarm" component={CreateFarm} />
                <Stack.Screen name="UserRequests" component={UserRequests} />
                <Stack.Screen name="UserSensorRequests" component={UserSensorRequests} />
                <Stack.Screen name="AdminFarmRequests" component={AdminFarmRequests} />
                <Stack.Screen name="AdminSensorRequests" component={AdminSensorRequests} />
                <Stack.Screen name="UserManagement" component={UserManagement} />
                <Stack.Screen name="UserDetail" component={UserDetail} />
                <Stack.Screen name="ActivityLogs" component={ActivityLogs} />
                <Stack.Screen name="Suggestion" component={Suggestion} />
                <Stack.Screen name="Account" component={Account} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
                <Stack.Screen name="Onboarding" component={Onboarding} />
              </Stack.Navigator>
              <AppTutorial />
            </NavigationContainer>
          </TutorialProvider>
        </DialogProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
