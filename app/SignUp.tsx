import { View, Text, TextInput, Button, StyleSheet, Alert, Image ,TouchableOpacity,Dimensions} from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {useAuth} from '../context/authContext';


import Icon from 'react-native-vector-icons/MaterialIcons';

const logo = require('../assets/images/logo.jpg');
const { width, height } = Dimensions.get('window');
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
    width: width, 
    height: height * 0.35, 
    marginBottom: height * 0.03, 
  },
  heading: {
    fontSize: width * 0.08, 
    fontWeight: 'bold',
    marginBottom: height * 0.02, 
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: width * 0.02, 
    marginBottom: height * 0.02, 
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
  account: {
    color: '#007BFF',
    marginTop:height*0.01,
    textAlign: 'center',
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
     
  },
  buttonText: {
    color: '#fff',
    fontSize: width * 0.04, 
    fontWeight: 'bold',
  },
});
