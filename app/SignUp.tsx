import { View, Text, TextInput, Button, StyleSheet, Alert, Image ,TouchableOpacity} from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {useAuth} from '../context/authContext';


import Icon from 'react-native-vector-icons/MaterialIcons';

const logo = require('../assets/images/logo.jpg');

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigation = useNavigation();
  const router = useRouter();
  const {register}=useAuth();
 
const handleRegister = async () => {

  if (name === '' || email === '') {
      Alert.alert(name === '' ? "Enter name" : "Enter email");
  } else if (password === '') {
      Alert.alert("Enter Password");
  } else if (confirmPassword === '') {
      Alert.alert("Enter Password again");
  } else if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
  } else {
   
      let response = await register(email, password, name);
     
      if (!response.Success) {
          Alert.alert('Sign Up', response.msg);
      }
  }
};


  return (
    
    <View style={styles.container}>
      <View>
        <Image source={logo} style={styles.logo} />
      </View>
      <Text style={styles.heading}>Sign Up</Text>

     
      <View style={styles.inputContainer}>
        <Icon name="person" size={24} color="#708090" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Enter Name"
          value={name}
          onChangeText={setName}
        />
      </View>

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

     
      <View style={styles.inputContainer}>
        <Icon name="lock" size={24} color="#708090" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={true}
        />
      </View>

      
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/Login')}>
        <Text style={styles.account}>Already have an account?</Text>
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
    marginBottom: 20,
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
},  backButton: {
  marginTop: 20,
  backgroundColor: '#5DA9C8',
  paddingVertical: 15,
  paddingHorizontal: 30,
  borderRadius: 5,
},
backButtonText: {
  color: '#fff',
  fontSize: 18,
  fontWeight: 'bold',
},
account: {
  color: '#007BFF',
  marginTop: 20,
  textAlign: 'center',
  textDecorationLine: 'underline',
},
});
