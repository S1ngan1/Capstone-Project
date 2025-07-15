import 'react-native-url-polyfill/auto';
import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet } from 'react-native';

import { useAuth } from './hooks/useAuth';
import { AuthContext } from './context/AuthContext';

import Account from './screens/Account';
import Auth from './components/Auth';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';

const Stack = createStackNavigator();

export default function App() {
  const { session } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding && !session) {
    return <Onboarding onFinish={() => setShowOnboarding(false)} />;
  }

  return (
    <AuthContext.Provider value={{ session }}>
      <NavigationContainer>
        <View style={styles.container}>
          {session && session.user ? (
            <Stack.Navigator
              screenOptions={{
                headerShown: false
              }}
            >
              <Stack.Screen name="Account" component={Account} />
              <Stack.Screen name="Home" component={Home} />
            </Stack.Navigator>
          ) : (
            <Auth />
          )}
        </View>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});