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
        options: {
          data: {
            username: username,
          }
        }
      })

      if (authError) {
        Alert.alert('Sign Up Error', authError.message)
        setLoading(false)
        return
      }

      // If user was created successfully, wait for auth to propagate and create profile
      if (authData.user) {
        // Wait for the auth user to be properly created in the database
        await new Promise(resolve => setTimeout(resolve, 2000))

        try {
          // Create profile with default role 'user'
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                username: username,
                email: email,
                role: 'user', // Default role for new users
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])

          if (profileError) {
            console.error('Profile creation error:', profileError)

            // If there's still an error, try upsert approach
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert([
                {
                  id: authData.user.id,
                  username: username,
                  email: email,
                  role: 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ], {
                onConflict: 'id'
              })

            if (upsertError) {
              console.error('Profile upsert error:', upsertError)
              Alert.alert('Profile Creation Error', 'Account created but profile setup failed. Please contact support.')
            }
          }

          Alert.alert(
            'Success!',
            'Account created successfully! Please check your email to verify your account before signing in.',
            [{ text: 'OK', onPress: onBackToLogin }]
          )

        } catch (profileErr) {
          console.error('Profile creation failed:', profileErr)
          Alert.alert('Profile Error', 'Account created but profile setup failed. Please try logging in.')
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      Alert.alert('Error', 'Something went wrong during signup. Please try again.')
    } finally {
      setLoading(false)
    }
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
          <Text style={styles.subtitle}>Join our farming community</Text>
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
            placeholder="Username"
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
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.verticallySpaced, styles.horizontalSpaced]}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
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
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  horizontalSpaced: {
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#8BC34A',
    opacity: 0.7,
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
    marginTop: 20,
  },
  signupText: {
    color: '#e0e0e0',
    fontSize: 16,
  },
  signupLink: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
})
