import { Redirect } from 'expo-router';

// The Pin tab button opens /create/camera directly (see the tabs layout).
export default function PinTab() {
  return <Redirect href="/create/camera" />;
}
