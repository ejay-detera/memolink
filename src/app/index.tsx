import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { session, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (userRole === 'caregiver') {
    return <Redirect href="/(app)/(caregiver)" />;
  } else {
    return <Redirect href="/(app)/(senior)" />;
  }
}
