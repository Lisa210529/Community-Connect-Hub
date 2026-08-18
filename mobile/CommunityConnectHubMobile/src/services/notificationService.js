import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';

export async function requestNotificationPermission(userId) {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED
    || authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) return null;

  const token = await messaging().getToken();
  if (token && userId) {
    await firestore().collection('users').doc(userId).set(
      { fcmToken: token, pushEnabled: true, pushUpdatedAt: new Date().toISOString() },
      { merge: true },
    );
  }
  return token;
}

export function onForegroundMessage(callback) {
  return messaging().onMessage(callback);
}
