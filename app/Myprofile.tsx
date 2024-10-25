import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme } from './ThemeContext'; 
import { useAuth } from '../context/authContext'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { doc, updateDoc, getDoc } from 'firebase/firestore'; 
import { db } from '../firebaseConfig'; 

const MyProfile: React.FC = () => {
  const { darkModeEnabled, toggleDarkMode } = useTheme(); 
  const { user } = useAuth(); 
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false); 

  useEffect(() => {
    const loadProfileImage = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data?.profileImage) {
          setImageUri(data.profileImage);
        }
      }
    };

    loadProfileImage();
  }, [user.uid]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
     
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }], 
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } 
      );

      setImageUri(manipResult.uri);
      await uploadImageToFirebase(manipResult.uri);
    }
  };

  const uploadImageToFirebase = async (uri: string) => {
    setIsUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const storage = getStorage();
      const storageRef = ref(storage, `profile_images/${user.uid}`);

      await uploadBytes(storageRef, blob);

     
      const downloadURL = await getDownloadURL(storageRef);

     
      await updateUserProfileImage(downloadURL);

      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const updateUserProfileImage = async (downloadURL: string) => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, { profileImage: downloadURL });
      setImageUri(downloadURL);
    } catch (error) {
      console.error('Error updating Firestore document:', error);
    }
  };

  const toggleNotifications = () => setNotificationsEnabled(prev => !prev);

  const handleSaveChanges = () => {
    alert('Profile updated successfully!');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      padding: 20,
      backgroundColor: darkModeEnabled ? '#333' : '#fff', 
    },
    headerText: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 20,
      color: darkModeEnabled ? '#fff' : '#000', 
    },
    imageContainer: {
      marginBottom: 20,
    },
    profileImage: {
      width: 150,
      height: 150,
      borderRadius: 75,
    },
    imagePlaceholder: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: '#cccccc',
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingsContainer: {
      width: '100%',
      marginTop: 20,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>My Profile</Text>

      <TouchableOpacity onPress={pickImage} style={styles.imageContainer} disabled={isUploading}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.profileImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text>{isUploading ? 'Uploading...' : 'Upload Photo'}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.settingsContainer}>
        <View style={styles.settingItem}>
          <Text style={{ color: darkModeEnabled ? '#fff' : '#000' }}>Enable Notifications</Text>
          <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
        </View>
        <View style={styles.settingItem}>
          <Text style={{ color: darkModeEnabled ? '#fff' : '#000' }}>Dark Mode</Text>
          <Switch value={darkModeEnabled} onValueChange={toggleDarkMode} />
        </View>
        <Button title="Save Changes" onPress={handleSaveChanges} />
      </View>
    </View>
  );
};

export default MyProfile;
