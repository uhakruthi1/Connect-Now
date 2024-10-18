// UserProfile.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Menu, Divider, Provider } from 'react-native-paper';
import { useAuth } from '../context/authContext';
import { useNavigation } from '@react-navigation/native';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);


  const toggleMenu = () => setVisible((prev) => !prev);

  const handleLogout = async () => {
    setVisible(false); 
    const response = await logout();
    if (response.success) {
      navigation.navigate('index');
    }
  };

  return (
    <Provider>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Chats</Text>
          <Menu
            visible={visible}
            onDismiss={() => setVisible(false)}
            anchor={
              <TouchableOpacity onPress={toggleMenu}>
                <Icon name="menu" size={40} color="#000" />
              </TouchableOpacity>
            }
          >
            <Menu.Item title="My Profile" />
            <Divider />
            <Menu.Item onPress={handleLogout} title="Logout" />
          </Menu>
        </View>
      </View>
    </Provider>
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
    padding:10,
  },
});
