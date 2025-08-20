import { Redirect } from 'expo-router';

export default function Home() {
  // Immediately redirect to user selection page
  return <Redirect href="/user-selection" />;
}