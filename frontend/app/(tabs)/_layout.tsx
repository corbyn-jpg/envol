import { Tabs } from 'expo-router';
import React from 'react';

import { TabBar } from '@/components/tab-bar';
import { TabBarIcon } from '@/components/tab-bar-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

const ICON_SIZE = 22;

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              label="Home"
              icon={
                <IconSymbol
                  size={ICON_SIZE}
                  name="house.fill"
                  color={focused ? Colors.background : Colors.icon}
                />
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: 'Ledger',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              label="Ledger"
              icon={
                <IconSymbol
                  size={ICON_SIZE}
                  name="book.closed.fill"
                  color={focused ? Colors.background : Colors.icon}
                />
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Rankings',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              label="Rankings"
              icon={
                <IconSymbol
                  size={ICON_SIZE}
                  name="chart.bar.fill"
                  color={focused ? Colors.background : Colors.icon}
                />
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="medals"
        options={{
          title: 'Medals',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              label="Medals"
              icon={
                <IconSymbol
                  size={ICON_SIZE}
                  name="rosette"
                  color={focused ? Colors.background : Colors.icon}
                />
              }
            />
          ),
        }}
      />
    </Tabs>
  );
}
