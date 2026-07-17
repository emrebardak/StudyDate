import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import {
  profileRowToRegistrationData,
  mapEmailVerificationStatusFromAPI,
} from '../data/mappers';

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
import RegisterEmailCodeScreen from '../screens/RegisterEmailCodeScreen';
import RegisterProfileScreen from '../screens/RegisterProfileScreen';
import RegisterTraitsScreen from '../screens/RegisterTraitsScreen';
import RegisterFinalScreen from '../screens/RegisterFinalScreen';
import PostDateSurveyScreen from '../screens/PostDateSurveyScreen';
import MatchFoundScreen from '../screens/MatchFoundScreen';

import { Colors, Typography, Spacing, Radius } from '../theme';
import type {
  RootStackParamList,
  TabParamList,
  RegistrationData,
} from '../types';

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
    | 'RegisterVerification'
    | 'RegisterEmailCode'
    | 'MainTabs'
    | 'RegisterProfile'
    | null
  >(null);
  // Only populated when resuming an incomplete registration (see below). In
  // current usage this will almost always resolve to just `{ email }` — see
  // profileRowToRegistrationData's doc comment in data/mappers.ts for why.
  const [pendingProfileData, setPendingProfileData] = useState<
    Partial<RegistrationData> | undefined
  >(undefined);
  // Set only when the row query ITSELF fails (network hiccup, RLS misconfig, or a
  // handle_new_user() trigger-lag race right before the row exists yet) — not when it
  // succeeds and simply reports email_verified=false. Unlike the profile-completeness
  // check below, this one must NOT fail open to MainTabs: failing open here would let a
  // transient error silently bypass the app's only verification gate. Blocks behind a
  // retry instead of guessing.
  const [checkError, setCheckError] = useState(false);

  const resolveSession = useCallback(() => {
    setCheckError(false);
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
        .select(
          'name, university, department, current_tags, current_goal_text, email_verified',
        )
        .eq('id', session.user.id)
        .single();

      if (error) {
        setCheckError(true);
        return;
      }

      // Same reasoning as the !row?.name check below: an unverified user has
      // a session (signUp() grants one immediately — see RegisterVerificationScreen.tsx)
      // but hasn't proven control of their email yet. Checked first since it's earlier
      // in the flow than profile completion.
      if (!mapEmailVerificationStatusFromAPI(row).emailVerified) {
        setPendingProfileData(
          profileRowToRegistrationData(row, session.user.email ?? undefined),
        );
        setInitialRoute('RegisterEmailCode');
        return;
      }

      if (!row?.name) {
        // Fail open here on purpose (profile-completeness only, not the security-relevant
        // email_verified check above): worst case is a blank-profile inconvenience, not a
        // bypassed verification gate — genuinely different risk profile.
        setPendingProfileData(
          profileRowToRegistrationData(row, session.user.email ?? undefined),
        );
        setInitialRoute('RegisterProfile');
        return;
      }

      setInitialRoute('MainTabs');
    });
  }, []);

  useEffect(() => {
    resolveSession();
  }, [resolveSession]);

  if (checkError) {
    return (
      <View style={styles.splash}>
        <Ionicons
          name="cloud-offline-outline"
          size={40}
          color={Colors.danger}
        />
        <Text style={styles.checkErrorText}>
          Couldn't confirm your account status. Check your connection and try
          again.
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          activeOpacity={0.85}
          onPress={resolveSession}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          name="RegisterEmailCode"
          component={RegisterEmailCodeScreen}
          initialParams={{ data: pendingProfileData ?? {} }}
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
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  checkErrorText: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  retryBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
  },
  tabBar: {
    backgroundColor: Colors.tabBg,
    borderTopColor: '#F0E4D4',
    borderTopWidth: 1,
    paddingBottom: 8,
    height: 70,
  },
});
