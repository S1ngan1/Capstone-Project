import 'react-native-url-polyfill/auto';
import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { TutorialProvider } from './context/TutorialContext';
import AppTutorial from './components/AppTutorial';
import Home from './screens/Home';
import Settings from './screens/Settings';
import Auth from './components/Auth';
import Onboarding from './screens/Onboarding';
import Notification from './screens/Notification';
import FarmDetails from './screens/FarmDetails';
import UserDetail from './screens/UserDetail';
import SensorDetail from './screens/SensorDetail';
import UserManagement from './screens/UserManagement';
import Suggestion from './screens/Suggestion';
import AdminFarmRequests from './screens/AdminFarmRequests';
import AdminSensorRequests from './screens/AdminSensorRequests';
import UserSensorRequests from './screens/UserSensorRequests';
import UserRequests from './screens/UserRequests';
import ActivityLogs from './screens/ActivityLogs';
import CreateFarm from './screens/CreateFarm';
import Profile from './screens/Profile';
import About from './screens/About';
import PrivacyPolicy from './screens/PrivacyPolicy';

export type RootStackParamList = {
    Auth: undefined;
    Onboarding: undefined;
    Home: undefined;
    FarmDetails: { farmId: string };
    Suggestion: undefined;
    Settings: undefined;
    Notification: undefined;
    UserManagement: undefined;
    UserDetail: { userId: string };
    SensorDetail: { sensorId: string };
    AdminFarmRequests: undefined;
    AdminSensorRequests: undefined;
    UserSensorRequests: undefined;
    UserRequests: undefined;
    ActivityLogs: undefined;
    CreateFarm: undefined;
    Profile: undefined;
    About: undefined;
    PrivacyPolicy: undefined;
    ViewRequests: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Main app component that uses the AuthContext
const AppContent = () => {
    const { session } = useAuthContext();
    const [showOnboarding, setShowOnboarding] = useState(true);

    if (showOnboarding && !session) {
        return <Onboarding onFinish={() => setShowOnboarding(false)} />;
    }

    if (!session) {
        return <Auth />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen name="FarmDetails" component={FarmDetails} />
                <Stack.Screen name="Suggestion" component={Suggestion} />
                <Stack.Screen name="Settings" component={Settings} />
                <Stack.Screen name="Notification" component={Notification} />
                <Stack.Screen name="UserManagement" component={UserManagement} />
                <Stack.Screen name="UserDetail" component={UserDetail} />
                <Stack.Screen name="SensorDetail" component={SensorDetail} />
                <Stack.Screen name="AdminFarmRequests" component={AdminFarmRequests} />
                <Stack.Screen name="AdminSensorRequests" component={AdminSensorRequests} />
                <Stack.Screen name="UserSensorRequests" component={UserSensorRequests} />
                <Stack.Screen name="UserRequests" component={UserRequests} />
                <Stack.Screen name="ActivityLogs" component={ActivityLogs} />
                <Stack.Screen name="CreateFarm" component={CreateFarm} />
                <Stack.Screen name="Profile" component={Profile} />
                <Stack.Screen name="About" component={About} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
            </Stack.Navigator>
            <AppTutorial />
        </NavigationContainer>
    );
};

// Main App component with providers (without tutorial for now)
export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <DialogProvider>
                    <TutorialProvider>
                        <AppContent />
                    </TutorialProvider>
                </DialogProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
