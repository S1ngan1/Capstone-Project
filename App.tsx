import 'react-native-url-polyfill/auto';
import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

import Account from './components/users/Account';
import Login from './app/(auth)/login';
import Onboarding from './components/Onboarding';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
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

  // Hiện Onboarding 1 lần đầu tiên rồi mới tới Login
  if (showOnboarding && !session) {
    return <Onboarding onFinish={() => setShowOnboarding(false)} />;
  }

  return (
    <View style={styles.container}>
      {session && session.user ? (
        <Account session={session} />
      ) : (
        <Login />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
