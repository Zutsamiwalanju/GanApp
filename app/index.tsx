import { Redirect } from 'expo-router';
import { useApp } from '../src/store';

export default function Index() {
  const { onboarded, profile } = useApp();
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href={profile.role === 'promoter' ? '/promoter' : '/(tabs)'} />;
}
