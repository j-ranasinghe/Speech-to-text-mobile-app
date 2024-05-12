import React from 'react';
import { StatusBar, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import HomeScreen from './screens/HomeScreen';
import SpeechToTextScreen from './screens/SpeechToTextScreen';
import SettingsScreen from './screens/SettingsScreen';
import HistoryScreen from './screens/HistoryScreen';
import LoginScreen from './screens/LoginScreen';

const Stack = createNativeStackNavigator();

const App: React.FC = () => {
  return (
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar translucent backgroundColor="transparent" />
        <NavigationContainer>
          <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{
                headerShown: false,
              }}
          >
            <Stack.Screen
                name="Login"
                component={LoginScreen}
            />
            <Stack.Screen
                name="Home"
                component={HomeScreen}
            />
            <Stack.Screen
                name="SpeechToText"
                component={SpeechToTextScreen}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
            />
            <Stack.Screen
                name="History"
                component={HistoryScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
  );
};

export default App;