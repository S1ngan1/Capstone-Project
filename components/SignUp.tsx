import { Alert, StyleSheet, Text, TextInput, View, ImageBackground, useWindowDimensions, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

interface SignUpProps {
  onBackToLogin: () => void
}

const SignUp: React.FC<SignUpProps> = ({ onBackToLogin }) => {
  const { width, height } = useWindowDimensions()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signUpWithEmail() {
    // Validate that all fields are entered
    if (!email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields.')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.')
      return
    }

    // Username validation
    if (username.length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters long.')
      return
    }

    // Password length validation
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.')
      return
    }

    // Password confirmation validation
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.')
      return
    }

    setLoading(true)

    try {
      // First, create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      })

      if (authError) {
        Alert.alert('Registration Error', authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        Alert.alert('Registration Error', 'Failed to create user account')
        setLoading(false)
        return
      }

      // Wait a moment to ensure the user is properly created in the auth system
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Now create the profile with the user's ID
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id, // Use the auth user's ID
          username: username.trim(),
          email: email.trim(),
          role: 'user', // Default role as requested
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        Alert.alert(
          'Profile Creation Error',
          'Account created but profile setup failed. Please contact support.'
        )
        setLoading(false)
        return
      }

      Alert.alert(
        'Success!',
        'Account created successfully. Please check your email to verify your account.',
        [{ text: 'OK', onPress: onBackToLogin }]
      )

    } catch (error) {
      console.error('Registration error:', error)
      Alert.alert('Registration Error', 'An unexpected error occurred. Please try again.')
    }

    setLoading(false)
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <ImageBackground
        source={require('../assets/images/auth/background_login.png')}
        style={[styles.image, { width, height }]}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Smart Farm Assistant</Text>
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
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Choose a username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Choose a secure password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.verticallySpaced, styles.horizontalSpaced]}>
          <TouchableOpacity
            style={styles.button}
            onPress={signUpWithEmail}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signupSection}>
          <Text style={styles.signupText}>Already have an account?</Text>
          <TouchableOpacity onPress={onBackToLogin}>
            <Text style={styles.signupLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

      </ImageBackground>
    </View>
  )
}

export default SignUp

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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  horizontalSpaced: {
    paddingHorizontal: 10,
  },
  mt20: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  signupText: {
    color: '#fff',
    fontSize: 16,
    marginRight: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  signupLink: {
    color: '#81C784',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
})
