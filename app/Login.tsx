import { View, Text, TextInput, Button, StyleSheet, Alert, Image, TouchableOpacity, Dimensions } from 'react-native';
import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/authContext';
import { auth } from '../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native'; 
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const logo = require('../assets/images/logo.jpg');




export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (password === '' || email == '') {
      Alert.alert('Error', 'Invalid Credentials!');
      return;
    }
    const response = await login(email, password);
    if (!response.success) {
      Alert.alert('Login', response.msg);
    } else {
      router.push('/Dashboard');
    }
  };

  const handlePasswordReset = () => {
    if (email === '') {
      Alert.alert('Error', 'Please enter your email address to reset your password.');
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert('Password Reset', 'A password reset link has been sent to your email address.');
      })
      .catch((error) => {
        Alert.alert('Error', error.message);
      });
  };

  return (
    <View style={styles.container}>
      <View>
        <Image source={logo} style={styles.logo} />
      </View>

      <Text style={styles.heading}>Login</Text>

      <View style={styles.inputContainer}>
        <Icon name="email" size={24} color="#708090" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email ID"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock" size={24} color="#708090" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />
      </View>
      <TouchableOpacity onPress={handlePasswordReset}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logo: {
    width: width, 
    height: height * 0.35, 
    marginBottom: height * 0.05, 
  },
  heading: {
    fontSize: width * 0.09, 
    fontWeight: 'bold',
    marginBottom: height * 0.04, 
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: width * 0.02, 
    marginBottom: height * 0.025, 
    width: '80%', 
    backgroundColor: '#f9f9f9',
    alignSelf: 'center', 
  },
  input: {
    flex: 1,
    paddingVertical: height * 0.02, 
    paddingHorizontal: width * 0.02, 
  },
  icon: {
    marginRight: width * 0.02, 
  },
  forgotPassword: {
    fontSize: width * 0.04,
    color: '#007BFF',
    marginRight: height * 0.05, 
    textAlign: 'right',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#5DA9C8',
    paddingVertical: height * 0.02, 
    paddingHorizontal: width * 0.3, 
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#5DADE2',
    alignItems: 'center',
    width: '80%', 
    alignSelf: 'center', 
    marginTop: height * 0.02, 
  },
  buttonText: {
    color: '#fff',
    fontSize: width * 0.05, 
    fontWeight: 'bold',
  },
});
