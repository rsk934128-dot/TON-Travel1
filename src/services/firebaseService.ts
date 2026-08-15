import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Booking, UserState, UserTravelPreferences, TonPriceAlertConfig } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Register with Email & Password
 */
export async function registerWithEmail(email: string, pass: string, displayName?: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (cred.user) {
    await initializeUserProfile(cred.user, displayName);
  }
  return cred.user;
}

/**
 * Login with Email & Password
 */
export async function loginWithEmail(email: string, pass: string) {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

/**
 * Login with Google Popup
 */
export async function loginWithGoogle() {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) {
      await initializeUserProfile(cred.user);
    }
    return cred.user;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('[Firebase Auth] User closed Google Sign-in popup.');
      return null;
    }
    if (error?.code === 'auth/popup-blocked') {
      console.warn('[Firebase Auth] Sign-in popup blocked by browser.');
      throw new Error('ব্রাউজার দ্বারা পপআপ ব্লক করা হয়েছে। দয়া করে পপআপ অনুমোদন করুন অথবা ইমেইল দিয়ে লগইন করুন।');
    }
    console.warn('[Firebase Auth] Google Sign-in Error:', error?.message || error);
    throw error;
  }
}

/**
 * Logout User
 */
export async function logoutFirebase() {
  await signOut(auth);
}

/**
 * Initialize / update User Profile document in Firestore
 */
export async function initializeUserProfile(user: User, customName?: string) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: customName || user.displayName || 'TON Traveler',
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      isTelegramPremium: false,
      connectedWallet: null,
      walletType: null,
      tonBalance: 12.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}

/**
 * Sync User Profile state to Firestore
 */
export async function saveUserStateToFirestore(userId: string, state: Partial<UserState>) {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      isTelegramPremium: state.isTelegramPremium ?? false,
      connectedWallet: state.connectedWallet ?? null,
      walletType: state.walletType ?? null,
      tonBalance: state.tonBalance ?? 0,
      displayName: state.userProfile?.name,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user state to Firestore:', error);
  }
}

/**
 * Save / Update a Booking in Firestore
 */
export async function saveBookingToFirestore(userId: string, booking: Booking) {
  try {
    const bookingRef = doc(db, 'users', userId, 'bookings', booking.id);
    await setDoc(bookingRef, {
      ...booking,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving booking to Firestore:', error);
  }
}

/**
 * Delete a Booking from Firestore
 */
export async function deleteBookingFromFirestore(userId: string, bookingId: string) {
  try {
    const bookingRef = doc(db, 'users', userId, 'bookings', bookingId);
    await deleteDoc(bookingRef);
  } catch (error) {
    console.error('Error deleting booking from Firestore:', error);
  }
}

/**
 * Save User Travel Preferences to Firestore
 */
export async function saveUserPreferencesToFirestore(userId: string, preferences: UserTravelPreferences) {
  try {
    const prefRef = doc(db, 'users', userId, 'preferences', 'default');
    await setDoc(prefRef, {
      ...preferences,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving preferences to Firestore:', error);
  }
}

/**
 * Save TON Price Alert Configuration to User document in Firestore
 */
export async function savePriceAlertConfigToFirestore(userId: string, config: TonPriceAlertConfig): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      priceAlertConfig: {
        ...config,
        updatedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load TON Price Alert Configuration from User document in Firestore
 */
export async function loadPriceAlertConfigFromFirestore(userId: string): Promise<TonPriceAlertConfig | null> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return (data?.priceAlertConfig as TonPriceAlertConfig) || null;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Real-time subscription to User's TON Price Alert Configuration in Firestore
 */
export function subscribeToPriceAlertConfig(
  userId: string,
  onUpdate: (config: TonPriceAlertConfig | null) => void
): () => void {
  const path = `users/${userId}`;
  const userRef = doc(db, 'users', userId);
  const unsubscribe = onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate((data?.priceAlertConfig as TonPriceAlertConfig) || null);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
  return unsubscribe;
}
