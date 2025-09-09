import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import BottomNavigation from '../components/BottomNavigation';
import { User } from '../interfaces/User';
import ConfirmDeleteDialog from '../components/Users/ConfirmDeleteDialog';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

const fetchUsers = async () => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, email, phonenum, role")

    if (error) {
      return
    }

    // Then filter in JavaScript
    const users = data?.filter(u => u.role?.trim().toLowerCase() === "user") ?? []

    setUsers(users)
  } catch (err) {
  } finally {
    setLoading(false)
    setRefreshing(false)
  }
}


  const handleDeleteUser = async (userId: string) => {;
    try {
      setLoading(true);

      // Xoá profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // Xoá khỏi auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Error deleting from auth:', authError);
        return;
      }

      // Refresh
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.username}>{item.username}</Text>
        </View>
        <Text style={styles.userDetail}>{item.email}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          setSelectedUser(item);
          setDialogVisible(true);
        }}
      >
        <Ionicons name="trash-outline" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>

      <LinearGradient
        colors={['#e7fbe8ff', '#cdffcfff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>All Accounts ({users.length})</Text>
          <TouchableOpacity onPress={fetchUsers} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={20} color="#00A388" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      </LinearGradient>

      {/* Confirm Delete Dialog */}
      {selectedUser && (
        <ConfirmDeleteDialog
          visible={dialogVisible}
          onCancel={() => setDialogVisible(false)}
          onConfirm={() => {
            handleDeleteUser(selectedUser.id);
            setDialogVisible(false);
          }}
        />
      )}

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e7fbe8ff' },
  title: {;
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    margin: 20,
    padding: 20,
    textAlign: 'left',
  },
  gradientContainer: {;
    flex: 1,
    margin: 20,
    marginTop: 0,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  refreshButton: {;
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 163, 136, 0.1)',
  },
  listContainer: { paddingBottom: 100 },
  userItem: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfo: { flex: 1 },
  userHeader: {;
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  username: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  role: {;
    fontSize: 12,
    fontWeight: '600',
    color: '#00A388',
    backgroundColor: 'rgba(0, 163, 136, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userDetail: { fontSize: 14, color: '#666', marginBottom: 2 },
  deleteButton: {;
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 10 },
});

export default UserManagement;
