import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { profileRowToRegistrationData } from '../data/mappers';

import DashboardScreen from '../screens/DashboardScreen';
import DiscoveryScreen from '../screens/DiscoveryScreen';
import ChatScreen from '../screens/ChatScreen';
import ConversationsListScreen from '../screens/ConversationsListScreen';
import StudyDatePlannerScreen from '../screens/StudyDatePlannerScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FilterScreen from '../screens/FilterScreen';
import RegisterVerificationScreen from '../screens/RegisterVerificationScreen';
import RegisterProfileScreen from '../screens/RegisterProfileScreen';
import RegisterTraitsScreen from '../screens/RegisterTraitsScreen';
import RegisterFinalScreen from '../screens/RegisterFinalScreen';
import PostDateSurveyScreen from '../screens/PostDateSurveyScreen';
import MatchFoundScreen from '../screens/MatchFoundScreen';

import { Colors, Typography, Spacing } from '../theme';
import type { RootStackParamList, TabParamList, RegistrationData } from '../types';

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
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Match" component={DiscoveryScreen} />
      <Tab.Screen name="Chats" component={ConversationsListScreen} />
      <Tab.Screen name="Planner" component={StudyDatePlannerScreen} />
      <Tab.Screen name="Profile" component={MyProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Root Stack ─────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  // Resolves once on mount: an existing session skips straight to MainTabs instead
  // of always landing on RegisterVerification. initialRouteName only applies at the
  // Stack.Navigator's first mount, so we hold off rendering it until this is known.
  const [initialRoute, setInitialRoute] = useState<
    'RegisterVerification' | 'MainTabs' | 'RegisterProfile' | null
  >(null);
  // Only populated when resuming an incomplete registration (see below).
  const [pendingProfileData, setPendingProfileData] = useState<
    Partial<RegistrationData> | undefined
  >(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!session) {
        setInitialRoute('RegisterVerification');
        return;
      }

      // A session alone doesn't mean registration ever finished — Step 4's
      // "Complete Archive" is the only step that actually writes to
      // public.users, so a user who quit at Step 1-3 has a session but a
      // blank profile row. `name` is the first field Step 2 collects, so its
      // absence reliably signals an incomplete profile without a new column.
      const { data: row, error } = await supabase
        .from('users')
        .select('name, university, department, current_tags, current_goal_text')
        .eq('id', session.user.id)
        .single();

      if (error) {
        // Fail open on a transient fetch error — don't block an already-
        // registered user from the app over a network hiccup; this matches
        // the prior (session-only) behavior when the check itself fails.
        setInitialRoute('MainTabs');
        return;
      }

      if (!row?.name) {
        setPendingProfileData(
          profileRowToRegistrationData(row, session.user.email ?? undefined),
        );
        setInitialRoute('RegisterProfile');
        return;
      }

      setInitialRoute('MainTabs');
    });
  }, []);

  if (initialRoute === null) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="RegisterVerification"
          component={RegisterVerificationScreen}
        />
        <Stack.Screen
          name="RegisterProfile"
          component={RegisterProfileScreen}
          initialParams={{ data: pendingProfileData ?? {} }}
        />
        <Stack.Screen name="RegisterTraits" component={RegisterTraitsScreen} />
        <Stack.Screen name="RegisterFinal" component={RegisterFinalScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
        <Stack.Screen name="MatchFound" component={MatchFoundScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Filter" component={FilterScreen} />
        <Stack.Screen
          name="StudyDatePlanner"
          component={StudyDatePlannerScreen}
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
        <Stack.Screen
          name="PostDateSurvey"
          component={PostDateSurveyScreen}
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: Colors.tabBg,
    borderTopColor: '#F0E4D4',
    borderTopWidth: 1,
    paddingBottom: 8,
    height: 70,
  },
});
