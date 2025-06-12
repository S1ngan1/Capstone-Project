import 'react-native-url-polyfill/auto';
import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

import Account from './components/Account';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';


export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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
