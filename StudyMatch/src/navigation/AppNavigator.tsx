import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { View, StyleSheet } from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';
import DiscoveryScreen from '../screens/DiscoveryScreen';
import ChatScreen from '../screens/ChatScreen';
import StudyDatePlannerScreen from '../screens/StudyDatePlannerScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FilterScreen from '../screens/FilterScreen';

import { Colors, Typography, Spacing } from '../theme';
import type { RootStackParamList, TabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ── Bottom Tabs ────────────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: Typography.size.xs,
          fontWeight: Typography.weight.medium,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, { active: string; inactive: string }> = {
            Dashboard: { active: 'grid', inactive: 'grid-outline' },
            Match: { active: 'hand-left', inactive: 'hand-left-outline' },
            Chats: { active: 'chatbubble', inactive: 'chatbubble-outline' },
            Planner: { active: 'calendar', inactive: 'calendar-outline' },
            Profile: { active: 'person', inactive: 'person-outline' },
          };
          const map = icons[route.name];
          const iconName = focused ? map.active : map.inactive;
          return (
            <Ionicons name={iconName as any} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Match" component={DiscoveryScreen} />
      <Tab.Screen name="Chats" component={ChatScreen} />
      <Tab.Screen name="Planner" component={StudyDatePlannerScreen} />
      <Tab.Screen name="Profile" component={MyProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Root Stack ─────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Filter" component={FilterScreen} />
        <Stack.Screen
          name="StudyDatePlanner"
          component={StudyDatePlannerScreen}
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBg,
    borderTopColor: '#F0E4D4',
    borderTopWidth: 1,
    paddingBottom: 8,
    height: 70,
  },
});
