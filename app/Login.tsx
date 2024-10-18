import { View, Text, TextInput, Button, StyleSheet, Alert, Image ,TouchableOpacity} from 'react-native';
import React, { useState } from 'react';
const logo = require('../assets/images/logo.jpg');
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../context/authContext';
import {auth} from '../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native'; 
import { useRouter } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {login}=useAuth();
  const router = useRouter();
  const navigation=useNavigation();
  const handleLogin = async() => {
    if (password === '' || email=='') {
      Alert.alert('Error', 'Invalid Credentials!');
      return;
    }
    const response= await login(email,password);
    if(!response.success){
      Alert.alert('Login',response.msg)
    }
    else{
      router.push('/Dashboard')
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
    width: 500,
    height: 350,
   
    marginBottom: 30,
  },
  heading: {
    fontSize: 35,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    width: '80%',
    backgroundColor: '#f9f9f9',
    marginLeft:50
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  icon: {
    marginRight: 10,
  },
  forgotPassword: {
    color: '#007BFF',
    marginBottom: 20,
    marginRight:40,
    textAlign: 'right',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#5DA9C8', 
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#5DADE2', 
    alignItems: 'center',
    width: '80%',
    marginTop: 20,
    marginLeft:50
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
