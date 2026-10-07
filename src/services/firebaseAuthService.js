import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Service for Firebase Authentication and Multi-Tenant User Management
 */

// Format generic email if username provided
export function formatOrgUserEmail(username, orgSlug = 'audit') {
  if (username.includes('@')) return username.trim().toLowerCase();
  return `${username.trim().toLowerCase()}@${orgSlug}.auditos.local`;
}

/**
 * Listen to Firebase Auth state changes
 */
export function onFirebaseAuthStateChanged(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let profile = null;
        if (userDocSnap.exists()) {
          profile = userDocSnap.data();
        }

        callback({
          firebaseUser,
          profile,
          isAuthenticated: true
        });
      } catch (err) {
        console.error('Error fetching user profile from Firestore:', err);
        callback({
          firebaseUser,
          profile: null,
          isAuthenticated: true,
          error: err.message
        });
      }
    } else {
      callback({
        firebaseUser: null,
        profile: null,
        isAuthenticated: false
      });
    }
  });
}

/**
 * Sign in with Firebase Email & Password
 */
export async function loginWithFirebase(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const uid = userCredential.user.uid;

  // Retrieve user profile and associated organization
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  let userProfile = null;
  let orgData = null;

  if (userDocSnap.exists()) {
    userProfile = userDocSnap.data();
    if (userProfile.orgId) {
      const orgRef = doc(db, 'organizations', userProfile.orgId);
      const orgSnap = await getDoc(orgRef);
      if (orgSnap.exists()) {
        orgData = orgSnap.data();
      }
    }
  }

  return {
    user: userCredential.user,
    profile: userProfile,
    organization: orgData
  };
}

/**
 * Register a new organization and master admin account
 */
export async function registerOrganizationWithAdmin({
  email,
  password,
  displayName,
  orgProfile
}) {
  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const uid = userCredential.user.uid;

  // Update Auth Profile
  await updateProfile(userCredential.user, {
    displayName: displayName || orgProfile.auditorName || 'ผู้ดูแลระบบ อปท.'
  });

  // 2. Generate a clean orgId
  const cleanOrgSlug = (orgProfile.name || 'org')
    .replace(/\s+/g, '-')
    .toLowerCase();
  const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 3. Save Organization Profile to Firestore
  const orgPayload = {
    id: orgId,
    name: orgProfile.name || 'องค์กรปกครองส่วนท้องถิ่น',
    orgType: orgProfile.orgType || 'องค์การบริหารส่วนตำบล',
    district: orgProfile.district || '',
    province: orgProfile.province || 'อุบลราชธานี',
    fiscalYear: orgProfile.fiscalYear || '2569',
    auditorName: orgProfile.auditorName || displayName || 'ผู้ตรวจสอบภายใน',
    auditorPosition: orgProfile.auditorPosition || 'นักวิชาการตรวจสอบภายในปฏิบัติการ',
    approverName: orgProfile.approverName || 'นายกองค์กรปกครองส่วนท้องถิ่น',
    approverPosition: orgProfile.approverPosition || `นายก${orgProfile.orgType || 'อปท.'}`,
    palatName: orgProfile.palatName || 'ปลัดองค์กรปกครองส่วนท้องถิ่น',
    palatPosition: orgProfile.palatPosition || `ปลัด${orgProfile.orgType || 'อปท.'}`,
    ownerUid: uid,
    ownerEmail: email.trim().toLowerCase(),
    subscription: {
      plan: 'trial', // trial | monthly | yearly
      status: 'active',
      trialExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      pricePerMonth: 70,
      pricePerYear: 700
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, 'organizations', orgId), orgPayload);

  // 4. Save User Profile to Firestore
  const userProfile = {
    uid,
    email: email.trim().toLowerCase(),
    displayName: displayName || orgProfile.auditorName || 'หน่วยตรวจสอบภายใน',
    role: 'admin',
    orgId,
    orgName: orgPayload.name,
    position: orgProfile.auditorPosition || 'นักวิชาการตรวจสอบภายในปฏิบัติการ',
    department: 'หน่วยตรวจสอบภายใน',
    canManageUsers: true,
    createdAt: serverTimestamp()
  };

  await setDoc(doc(db, 'users', uid), userProfile);

  return {
    user: userCredential.user,
    profile: userProfile,
    organization: orgPayload
  };
}

/**
 * Sign out from Firebase
 */
export async function logoutFirebase() {
  await fbSignOut(auth);
}
