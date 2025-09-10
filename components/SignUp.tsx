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
        email: email,
        password: password,
      })
      if (authError) {
        Alert.alert('Sign Up Error', authError.message)
        setLoading(false)
        return
      }
      // If user was created successfully, create their profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              username: username,
              email: email,
            }
          ])
        if (profileError) {
          console.error('Profile creation error:', profileError)
          Alert.alert(
            'Account Created',
            'Your account was created but there was an issue setting up your profile. You can update it later in settings.'
          )
        }
      }
      if (authData.user && !authData.user.email_confirmed_at) {
        Alert.alert(
          'Check your email',
          `A confirmation link has been sent to ${email}. Please check your email and click the link to confirm your account.`,
          [
            {
              text: 'OK',
              onPress: () => onBackToLogin()
            }
          ]
        )
      } else {
        Alert.alert(
          'Success',
          'Account created successfully!',
          [
            {
              text: 'OK',
              onPress: () => onBackToLogin()
            }
          ]
        )
      }
    } catch (error) {
      console.error('Signup error:', error)
      Alert.alert('Error', 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <View style={[styles.container, { width, height }]}>
      <ImageBackground source={require('../assets/images/auth/background_login.png')} style={[styles.image, { width, height }]} resizeMode="cover">
        <View style={styles.overlay} />
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
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
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
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
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>
        <View style={[styles.verticallySpaced, styles.horizontalSpaced]}>
           <TouchableOpacity style={styles.button} onPress={signUpWithEmail} disabled={loading}>
                      <Text style={styles.buttonText}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                      </Text>
            </TouchableOpacity>
        </View>
        <View style={[styles.verticallySpaced, styles.horizontalSpaced]}>
           <TouchableOpacity style={styles.backButton} onPress={onBackToLogin} disabled={loading}>
                      <Text style={styles.backButtonText}>
                        Back to Login
                      </Text>
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
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#7DDA58',
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
  backButtonText: {
    color: '#7DDA58',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  mt20: {
    marginTop: 20,
  }
})
