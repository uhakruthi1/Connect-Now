import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Divider } from 'react-native-paper';
import { useAuth } from '../context/authContext';
import { useNavigation } from '@react-navigation/native';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false); 

  const toggleModal = () => setVisible((prev) => !prev);

  const handleLogout = async () => {
    setVisible(false);
    const response = await logout();
    if (response.success) {
      navigation.navigate('index'); 
    }
  };

  const handleMyProfile = () => {
    setVisible(false);
    navigation.navigate('Myprofile');
  };

  const handleSearchUsers = () => {
    setVisible(false);
    navigation.navigate('SearchUsers');
  };

  const handleFriendRequests = () => {
    setVisible(false);
    navigation.navigate('Myrequest');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Chats</Text>
        <TouchableOpacity onPress={toggleModal}>
          <Icon name="menu" size={40} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Modal for displaying menu options */}
      <Modal
        visible={visible}
        transparent={true} // Makes the modal background transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setVisible(false)}>
          {/* Modal content */}
          <View style={styles.modalContainer}>
            <TouchableOpacity onPress={handleMyProfile} style={styles.menuItem}>
              <Text style={styles.menuText}>My Profile</Text>
            </TouchableOpacity>
            <Divider style={styles.divider} />
            <TouchableOpacity onPress={handleSearchUsers} style={styles.menuItem}>
              <Text style={styles.menuText}>Search Users</Text>
            </TouchableOpacity>
            <Divider style={styles.divider} />
            <TouchableOpacity onPress={handleFriendRequests} style={styles.menuItem}>
              <Text style={styles.menuText}>My Requests</Text>
            </TouchableOpacity>
            <Divider style={styles.divider} />
            <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Adds a dark overlay with transparency
    justifyContent: 'flex-start',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 180, // Positioned just below the header
    marginHorizontal: 20, // Add some spacing from the edges of the screen
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 10, // Add elevation for Android shadow
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0', // Light background color for menu items
  },
  menuText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  logoutText: {
    color: '#d9534f', // Red color for logout
  },
  divider: {
    marginVertical: 10,
  },
});
