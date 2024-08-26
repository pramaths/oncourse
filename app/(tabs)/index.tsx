import React, { useState, useEffect } from 'react';
import { Image, Pressable, View, Text, TextInput, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/constants/routes';
import logo from "@/assets/images/logo.png";

export default function HomeScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Animation values
  const logoScale = useSharedValue(1);
  const logoRotation = useSharedValue(0);
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
  }));

  useEffect(() => {
    checkLogin();
    logoScale.value = withRepeat(withTiming(1.1, { duration: 1000 }), -1, true);
    logoRotation.value = withRepeat(withTiming(360, { duration: 5000 }), -1, true);
  }, []);

  async function checkLogin() {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      const userPassword = await AsyncStorage.getItem('userPassword');
      if (userEmail && userPassword) {
        const response = await fetch(`${BASE_URL}/api/users/${userEmail}`);
        if (response.ok) {
          router.replace('/Patients');
          return; // Exit the function early
        } else {
          await AsyncStorage.removeItem('userEmail');
          await AsyncStorage.removeItem('userPassword');
        }
      }
    } catch (error) {
      console.error('Error checking login:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Login Failed', 'Please enter both email and password.');
      return;
    }
  
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/users/${email}`);
      if (response.ok) {
        const userData = await response.json();
        if (userData.password === password) { 
          await AsyncStorage.setItem('userEmail', email);
          await AsyncStorage.setItem('userPassword', password);
          router.replace('/Patients');
        } else {
          Alert.alert('Login Failed', 'Incorrect password.');
        }
      } else {
        Alert.alert(
          "Register",
          "No account found with that email, would you like to create one?",
          [
            {
              text: "Yes",
              onPress: () => registerUser(email, password),
            },
            {
              text: "No",
              style: "cancel",
            },
          ]
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }

  async function registerUser(email: string, password: string) {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('userPassword', password);
        Alert.alert('Registration Successful', 'You are now registered and logged in.');
        router.replace('/Patients');
      } else {
        const errMessage = await response.text();
        Alert.alert('Registration Failed', errMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1 items-center justify-center">
      <View className="flex-row items-center bg-white p-5 rounded-lg m-10">
        <Animated.Image
          source={logo}
          style={logoAnimatedStyle}
          className="w-12 h-12 mr-4" 
        />
        <Text className="text-black text-2xl font-bold">
          ONCOURSE
        </Text>
      </View>
      <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        className='text-white border-2 rounded-md h-15 w-3/4 p-2 m-2 border-white' 
        placeholderTextColor='white'
      />
      <TextInput 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry={true} 
        className='text-white border-2 rounded-md h-15 w-3/4 p-2 m-2 border-white' 
        placeholderTextColor='white'
      />
      <Pressable onPress={handleLogin} className='mt-4 border-2 bg-blue-500 p-4 rounded-lg'>
        <Text style={{ color: 'white' }}>Log In</Text>
      </Pressable>
    </ThemedView>
  );
}