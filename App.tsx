import 'react-native-url-polyfill/auto';
import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from './hooks/useAuth';
import { AuthContext } from './context/AuthContext';

import Home from './screens/Home';
import Settings from './screens/Settings';
import Auth from './components/Auth';
import Onboarding from './screens/Onboarding';
import Notification from './screens/Notification';
import Farm from './screens/Farm';
import UserManagement from './screens/UserManagement';
import CreateFarm from './screens/CreateFarm';

const SuggestionScreen = () => (
  <View style={appStyles.placeholderScreen}>
    <Text style={appStyles.placeholderText}>Suggestion Screen</Text>
  </View>
);

export type RootStackParamList = {
    Auth: undefined;
    Onboarding: undefined;
    Home: undefined;
    Farm: undefined;
    Suggestion: undefined;
    Profile: undefined;
    Settings: undefined;
    Notification: undefined;
    UserManagement: undefined;
    CreateFarm: undefined;
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
                                <Stack.Screen name="Suggestion" component={SuggestionScreen} />
                                <Stack.Screen name="Settings" component={Settings} />
                                <Stack.Screen name="Notification" component={Notification} />
                                <Stack.Screen name="UserManagement" component={UserManagement} />
                                <Stack.Screen name="CreateFarm" component={CreateFarm} />
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