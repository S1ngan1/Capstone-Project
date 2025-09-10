import { Alert, StyleSheet, Text, TextInput, View, ImageBackground, useWindowDimensions, AppState, Button, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import SignUp from './SignUp'
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
const Auth = () => {
  const { width, height } = useWindowDimensions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  // If signup screen should be shown, render SignUp component
  if (showSignUp) {
    return <SignUp onBackToLogin={() => setShowSignUp(false)} />
  }
  async function signInWithEmail() {
    // Validate that email and password are entered
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password to sign in.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
    if (error) Alert.alert('Sign In Error', error.message)
    setLoading(false)
  }
  return (
    <View style={[styles.container, { width, height }]}>
      <ImageBackground source={require('../assets/images/auth/background_login.png')} style={[styles.image, { width, height }]} resizeMode="cover">
        <View style={styles.overlay} />
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>
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
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Text>
            </TouchableOpacity>
        </View>
        <View style={styles.signupSection}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => setShowSignUp(true)}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  )
}
export default Auth
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.8,
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
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 5,
  },
  signupText: {
    color: 'white',
    fontSize: 16,
  },
  signupLink: {
    color: '#7DDA58',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
})
