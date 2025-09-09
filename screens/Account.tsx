import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

const Account: React.FC = () => {;
  const navigation = useNavigation();
  const { session } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../assets/images/account/background_account.png')}
                style={styles.avatar}
                defaultSource={require('../assets/images/icon.png')}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {session?.user?.user_metadata?.full_name || session?.user?.email || 'User'}
              </Text>
              <Text style={styles.userEmail}>
                {session?.user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Text style={styles.menuItemText}>Settings</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notification' as never)}
          >
            <Text style={styles.menuItemText}>Notifications</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('UserManagement' as never)}
          >
            <Text style={styles.menuItemText}>User Management</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]}>
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {;
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {;
    flex: 1,
  },
  header: {;
    backgroundColor: '#4CAF50',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  profileSection: {;
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {;
    marginRight: 15,
  },
  avatar: {;
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
  },
  userInfo: {;
    flex: 1,
  },
  userName: {;
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userEmail: {;
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuSection: {;
    backgroundColor: 'white',
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  menuItem: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {;
    fontSize: 16,
    color: '#333',
  },
  menuItemArrow: {;
    fontSize: 20,
    color: '#ccc',
  },
  actionsSection: {;
    padding: 20,
    marginTop: 20,
  },
  actionButton: {;
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButtonText: {;
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {;
    backgroundColor: '#f44336',
  },
  logoutButtonText: {;
    color: 'white',
  },
});

export default Account;
