import { Alert, StyleSheet, Text, TextInput, View, ImageBackground, useWindowDimensions, AppState, Button, TouchableOpacity } from 'react-native';
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'


AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
  

const Auth = () => {
  const { width, height } = useWindowDimensions();
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)


  async function signInWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
    if (error) Alert.alert(error.message)
    setLoading(false)
  }


  return (
    <View style={[styles.container, { width, height }]}>
      <ImageBackground source={require('../assets/images/auth/background_login.png')} style={[styles.image, { width, height }]} resizeMode="cover">
        <View style={styles.overlay} />

        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@address.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.verticallySpaced, styles.horizontalSpaced]}>
           <TouchableOpacity style={styles.button} onPress={signInWithEmail} disabled={loading}>
                      <Text style={styles.buttonText}>
                        Sign In
                      </Text>
            </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  )
};

export default Auth;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 762,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // nền tối như em muốn
  },
  verticallySpaced: {
    marginVertical: 10,
  },
  horizontalSpaced: {
      marginTop: 20,
      marginHorizontal: 100,
  },
  button: {
    backgroundColor: '#7DDA58',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  input: {
    backgroundColor: 'white',
    marginHorizontal: 30,
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  label: {
    color: 'white',
    marginBottom: 5,
    marginLeft: 30,
    fontSize: 14,
    fontWeight: '500',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  mt20: {
    marginTop: 20,
  }
})

