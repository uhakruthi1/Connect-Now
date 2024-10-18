import { Link } from 'expo-router';
import { useRouter } from 'expo-router';
import { ScrollView, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from 'expo-router';



export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  return (
    <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.welcomeText}>Welcome to the App!</Text>
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/Login')} 
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/SignUp')} 
      >
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F8FF',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    width: '100%', 
    paddingHorizontal: 40, 
  },
  link: {
    flex: 1, 
    marginHorizontal: 5, 
  },
  button: {
    backgroundColor: '#5DA9C8', 
    borderWidth: 1,
    borderColor: '#7FB3D5', 
    borderRadius: 5,
    paddingVertical: 15,
    alignItems: 'center',
    width:150
  },
  buttonText: {
    color: '#fff', 
    fontSize: 18,
    fontWeight: 'bold',
  },
});
