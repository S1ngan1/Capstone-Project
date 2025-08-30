import 'react-native-url-polyfill/auto';
import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from './hooks/useAuth';
import { AuthContext } from './context/AuthContext';

import Home from './screens/Home';
import Account from './screens/Account';
import Settings from './screens/Settings';
import Auth from './components/Auth';
import Onboarding from './screens/Onboarding';
import Notification from './screens/Notification';
import Farm from './screens/Farm';
import FarmDetails from './screens/FarmDetails';
import UserDetail from './screens/UserDetail';
import SensorDetail from './screens/SensorDetail';
import UserManagement from './screens/UserManagement';
import Suggestion from './screens/Suggestion';

export type RootStackParamList = {
    Auth: undefined;
    Onboarding: undefined;
    Home: undefined;
    Farm: { showAddForm?: boolean } | undefined;
    FarmDetails: { farmId: string };
    Suggestion: undefined;
    Profile: undefined;
    Settings: undefined;
    Notification: undefined;
    UserManagement: undefined;
    UserDetail: { userId: string };
    SensorDetail: { sensorId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
    const { session } = useAuth();
    const [showOnboarding, setShowOnboarding] = useState(true);

    if (showOnboarding && !session) {
        return <Onboarding onFinish={() => setShowOnboarding(false)} />;
    }

    return (
        <AuthContext.Provider value={{ session }}>
            <SafeAreaProvider>
                <NavigationContainer>
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        {!session || !session.user ? (
                            <Stack.Group>
                                <Stack.Screen name="Auth" component={Auth} />
                            </Stack.Group>
                        ) : (
                            <Stack.Group>
                                <Stack.Screen name="Home" component={Home} />
                                <Stack.Screen name="Farm" component={Farm} />
                                <Stack.Screen name="FarmDetails" component={FarmDetails} />
                                <Stack.Screen name="Suggestion" component={Suggestion} />
                                <Stack.Screen name="Profile" component={Account} />
                                <Stack.Screen name="Settings" component={Settings} />
                                <Stack.Screen name="Notification" component={Notification} />
                                <Stack.Screen name="UserManagement" component={UserManagement} />
                                <Stack.Screen name="UserDetail" component={UserDetail} />
                                <Stack.Screen name="SensorDetail" component={SensorDetail} />
                            </Stack.Group>
                        )}
                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        </AuthContext.Provider>
    );
}

const appStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
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