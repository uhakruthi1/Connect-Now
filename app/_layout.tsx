import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '@/context/authContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from './ThemeContext'; // Renamed import to avoid conflict
import PrivateChat from './PrivateChat';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <CustomThemeProvider>
        <Main />
      </CustomThemeProvider>
    </AuthProvider>
  );
}

const Main = () => {
  const { darkModeEnabled } = useTheme();


  const theme = darkModeEnabled ? DarkTheme : DefaultTheme;

  return (
    <NavigationThemeProvider value={theme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen 
          name="SignUp" 
          options={{ 
            headerTitle: 'Create an Account',
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: '#5DA9C8' },
            headerBackTitleVisible: false,
          }} 
        />
        <Stack.Screen 
          name="Login" 
          options={{ 
            headerTitle: '',
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: '#5DA9C8' },
            headerBackTitleVisible: false,
          }} 
        />
        <Stack.Screen 
          name="Dashboard" 
          options={{ 
            headerTitle: '',
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: '#5DA9C8' },
            headerBackTitleVisible: false,
          }} 
        />
        <Stack.Screen 
          name="Myprofile" 
          options={{ 
            headerTitle: '',
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: '#5DA9C8' },
            headerBackTitleVisible: false,
          }} 
        />
      
      <Stack.Screen 
          name="SearchUsers" 
          options={{ 
            headerTitle: '',
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: '#5DA9C8' },
            headerBackTitleVisible: false,
          }} 
        />
    
      <Stack.Screen 
          name="Myrequest" 
          options={{ 
            headerTitle: '',
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: '#5DA9C8' },
            headerBackTitleVisible: false,
          }} 
        />
        <Stack.Screen 
          name="PrivateChat" 
          
          options={{ 
            headerTitle: '',
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: '#5DA9C8' },
            headerBackTitleVisible: false,
          }} 
        />
        <Stack.Screen 
          name="GroupChat" 
          
          options={{ 
            headerTitle: '',
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: '#5DA9C8' },
            headerBackTitleVisible: false,
          }} 
        />
      </Stack>
    </NavigationThemeProvider>
  );
}
