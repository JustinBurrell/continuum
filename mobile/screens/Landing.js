import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Landing() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Continuum</Text>
      <Text style={styles.subtitle}>Welcome to Continuum - Your all-in-one educational platform</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});
