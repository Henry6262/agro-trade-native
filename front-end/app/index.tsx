import { View, Text } from 'react-native';

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>Welcome to Agro Trade!</Text>
      <Text>The app is working on web!</Text>
    </View>
  );
}