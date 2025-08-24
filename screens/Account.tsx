import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Input, Button } from '@rneui/themed';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { supabase } from '../lib/supabase';

import { useAuthContext } from '../context/AuthContext';
import { useNavigation, NavigationProp } from "@react-navigation/native"; 
import ConfirmLogoutDialog from '../components/Users/ConfirmLogoutDialog';
import BottomNavigation from '../components/BottomNavigation';

export type RootStackParamList = {
  Account: undefined;
  Home: undefined;
};

export default function Account() {
  const { session } = useAuthContext();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); 
  
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const { width } = useWindowDimensions();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await supabase.auth.signOut()
  }
  

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', session?.user.id)
        .single();

      if (error && status !== 406) throw error;

      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) console.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground source={require('../assets/images/account/background_account.png')} style={styles.background}>
      <View style={styles.overlay}>

        {/* <Image source={require('../assets/avatar.png')} style={styles.avatar} /> */}
        <Text style={styles.username}>{username || 'Username'}</Text>

        <View style={styles.iconRow}>
          <Ionicons name="home" size={28} color="white" style={styles.icon} onPress={() => navigation.navigate("Home")} />
          <MaterialIcons name="edit" size={28} color="white" style={styles.icon} />
          <Ionicons name="notifications" size={28} color="white" style={styles.icon} />
          <MaterialIcons name="logout" size={28} color="white" style={styles.icon} onPress={() => setShowLogoutConfirm(true)} />
        </View>

        <ConfirmLogoutDialog
          visible={showLogoutConfirm}
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
      />

        <Input
          placeholder="Email"
          value={session?.user?.email}
          disabled
          inputStyle={styles.inputText}
          inputContainerStyle={styles.inputContainer}
        />
        <Input
          placeholder="Password"
          value={"********"}
          disabled
          secureTextEntry
          inputStyle={styles.inputText}
          inputContainerStyle={styles.inputContainer}
        />
        <BottomNavigation />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 33, 24, 0.9)',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    marginTop: 20,
  },
  username: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 20,
  },
  icon: {
    marginHorizontal: 10,
  },
  inputText: {
    color: 'white',
  },
  inputContainer: {
    backgroundColor: '#1a3b2c',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
});
