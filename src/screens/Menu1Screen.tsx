import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Menu1Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu 1</Text>
      <Text style={styles.subtitle}>This is Menu 1 Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
