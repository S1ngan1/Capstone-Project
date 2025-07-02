import 'react-native-url-polyfill/auto';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { useAuth } from './hooks/useAuth';
import Account from './screens/Account';
import Auth from './components/Auth';
import Onboarding from './screens/Onboarding';


export default function App() {
  const { session } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding && !session) {
    return <Onboarding onFinish={() => setShowOnboarding(false)} />;
  }

  return (
    <View style={styles.container}>
      {session && session.user ? (
        <Account session={session} />
      ) : (
        <Auth />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
