import 'react-native-url-polyfill/auto';
import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from './hooks/useAuth';
import { AuthContext } from './context/AuthContext';
import BottomNavigaton from './components/BottomNavigation';


import Auth from './components/Auth';
import Onboarding from './screens/Onboarding';

const Stack = createStackNavigator();

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
          <View style={styles.container}>
            {session && session.user ? (
              <BottomNavigaton />
            ) : (
              <Auth />
            )}
          </View>
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});