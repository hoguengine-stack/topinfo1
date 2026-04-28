import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth, db, googleProvider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";

interface User {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale?: string;
}

interface Profile {
  nickname: string;
  picture: string;
  jobTitle?: string;
}

export interface LockoutState {
  failedAttempts: number;
  lockoutTier: number;
  lockoutUntil: number | null;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  notifyBeforeDeadline: boolean;
  notifyOverdue: boolean;
  notifyBeforeStart: boolean;
  notifyNewTask: boolean;
}

export const defaultNotificationSettings: NotificationSettings = {
  pushEnabled: false,
  notifyBeforeDeadline: true,
  notifyOverdue: true,
  notifyBeforeStart: true,
  notifyNewTask: true,
};

export interface VerifyResult {
  success: boolean;
  locked?: boolean;
  lockoutUntil?: number | null;
  attemptsLeft?: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAccessCodeVerified: boolean;
  isLoading: boolean;
  lockoutState: LockoutState;
  notificationSettings: NotificationSettings;
  taskTypes: string[];
  priorities: string[];
  jobTitles: string[];
  login: () => Promise<void>;
  logout: () => Promise<void>;
  verifyAccessCode: (code: string) => VerifyResult;
  saveProfile: (nickname: string, picture: string, jobTitle?: string) => void;
  updateProfilePicture: (picture: string) => void;
  updateJobTitle: (jobTitle: string) => void;
  updateNickname: (nickname: string) => void;
  updateAccessCode: (newCode: string) => void;
  updateTaskTypes: (types: string[]) => void;
  updatePriorities: (priorities: string[]) => void;
  updateJobTitles: (titles: string[]) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  forceRefreshAllPCs: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAccessCodeVerified, setIsAccessCodeVerified] = useState(() => {
    return localStorage.getItem("isAccessCodeVerified") === "true";
  });
  const [lockoutState, setLockoutState] = useState<LockoutState>({ failedAttempts: 0, lockoutTier: 0, lockoutUntil: null });
  const [taskTypes, setTaskTypes] = useState<string[]>(["설치", "점검", "수리", "휴대용단말기", "기타"]);
  const [priorities, setPriorities] = useState<string[]>(["긴급", "높음", "보통", "낮음"]);
  const [jobTitles, setJobTitles] = useState<string[]>(["현장 관리자", "팀장", "엔지니어", "실장"]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [accessCode, setAccessCode] = useState<string>("kicckmk");
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initTimeRef = useRef(Date.now());

  useEffect(() => {
    // Listen to system version changes for auto-reloading multiple PCs
    const versionRef = doc(db, "system", "version");
    const unsubscribeVersion = onSnapshot(versionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.updatedAt && data.updatedAt > initTimeRef.current) {
          console.log("새로운 코드가 배포되었습니다. 화면을 새로고침합니다.");
          const url = new URL(window.location.href);
          url.searchParams.set('t', Date.now().toString());
          window.location.href = url.toString();
        }
      }
    }, (err) => {
      console.warn("version check error", err);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          sub: firebaseUser.uid,
          name: firebaseUser.displayName || "",
          picture: firebaseUser.photoURL || "",
          email: firebaseUser.email || "",
          email_verified: firebaseUser.emailVerified,
        });
      } else {
        setUser(null);
        setProfile(null);
        setIsAccessCodeVerified(false);
        localStorage.removeItem("isAccessCodeVerified");
        setIsLoading(false);
      }
      setIsAuthReady(true);
    });
    return () => {
      unsubscribeVersion();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const userRef = doc(db, "users", user.sub);
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.profile) setProfile(data.profile);
        if (data.taskTypes) setTaskTypes(data.taskTypes);
        if (data.priorities) setPriorities(data.priorities);
        if (data.jobTitles) setJobTitles(data.jobTitles);
        if (data.notificationSettings) setNotificationSettings({ ...defaultNotificationSettings, ...data.notificationSettings });
        if (data.accessCode) setAccessCode(data.accessCode);
        if (data.lockoutState) setLockoutState(data.lockoutState);
      } else {
        // Initialize default user document
        const defaultData = {
          profile: { nickname: user.name, picture: user.picture, jobTitle: "현장 관리자" },
          taskTypes: ["설치", "점검", "수리", "휴대용단말기", "기타"],
          priorities: ["긴급", "높음", "보통", "낮음"],
          jobTitles: ["현장 관리자", "팀장", "엔지니어", "실장"],
          notificationSettings: defaultNotificationSettings,
          accessCode: "kicckmk",
          lockoutState: { failedAttempts: 0, lockoutTier: 0, lockoutUntil: null }
        };
        await setDoc(userRef, defaultData);
        setProfile(defaultData.profile);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Error: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const saveLockoutState = async (newState: LockoutState) => {
    setLockoutState(newState);
    if (user) {
      await updateDoc(doc(db, "users", user.sub), { lockoutState: newState });
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("isAccessCodeVerified");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const verifyAccessCode = (code: string): VerifyResult => {
    if (lockoutState.lockoutUntil && Date.now() < lockoutState.lockoutUntil) {
      return { success: false, locked: true, lockoutUntil: lockoutState.lockoutUntil };
    }

    if (code === accessCode) {
      setIsAccessCodeVerified(true);
      localStorage.setItem("isAccessCodeVerified", "true");
      saveLockoutState({ failedAttempts: 0, lockoutTier: 0, lockoutUntil: null });
      return { success: true };
    } else {
      let newAttempts = lockoutState.failedAttempts + 1;
      let newTier = lockoutState.lockoutTier;
      let newUntil = lockoutState.lockoutUntil;

      if (newAttempts >= 5) {
        newTier += 1;
        newAttempts = 0;
        let lockoutDuration = 0;
        if (newTier === 1) lockoutDuration = 5 * 60 * 1000; // 5 mins
        else if (newTier === 2) lockoutDuration = 30 * 60 * 1000; // 30 mins
        else if (newTier === 3) lockoutDuration = 60 * 60 * 1000; // 1 hour
        else lockoutDuration = 24 * 60 * 60 * 1000; // 24 hours

        newUntil = Date.now() + lockoutDuration;
      }

      const newState = { failedAttempts: newAttempts, lockoutTier: newTier, lockoutUntil: newUntil };
      saveLockoutState(newState);
      
      return { 
        success: false, 
        locked: newAttempts === 0, 
        lockoutUntil: newUntil, 
        attemptsLeft: 5 - newAttempts 
      };
    }
  };

  const updateAccessCode = async (newCode: string) => {
    setAccessCode(newCode);
    if (user) {
      await updateDoc(doc(db, "users", user.sub), { accessCode: newCode });
    }
  };

  const saveProfile = async (nickname: string, picture: string, jobTitle: string = "현장 관리자") => {
    const newProfile = { nickname, picture, jobTitle };
    setProfile(newProfile);
    if (user) {
      await updateDoc(doc(db, "users", user.sub), { profile: newProfile });
    }
  };

  const updateProfilePicture = async (picture: string) => {
    if (profile) {
      const newProfile = { ...profile, picture };
      setProfile(newProfile);
      if (user) {
        await updateDoc(doc(db, "users", user.sub), { profile: newProfile });
      }
    }
  };

  const updateJobTitle = async (jobTitle: string) => {
    if (profile) {
      const newProfile = { ...profile, jobTitle };
      setProfile(newProfile);
      if (user) {
        await updateDoc(doc(db, "users", user.sub), { profile: newProfile });
      }
    }
  };

  const updateNickname = async (nickname: string) => {
    if (profile) {
      const newProfile = { ...profile, nickname };
      setProfile(newProfile);
      if (user) {
        await updateDoc(doc(db, "users", user.sub), { profile: newProfile });
      }
    }
  };

  const updateTaskTypes = async (types: string[]) => {
    setTaskTypes(types);
    if (user) {
      await updateDoc(doc(db, "users", user.sub), { taskTypes: types });
    }
  };

  const updatePriorities = async (p: string[]) => {
    setPriorities(p);
    if (user) {
      await updateDoc(doc(db, "users", user.sub), { priorities: p });
    }
  };

  const updateJobTitles = async (titles: string[]) => {
    setJobTitles(titles);
    if (user) {
      await updateDoc(doc(db, "users", user.sub), { jobTitles: titles });
    }
  };

  const updateNotificationSettings = async (settings: NotificationSettings) => {
    setNotificationSettings(settings);
    if (user) {
      await updateDoc(doc(db, "users", user.sub), { notificationSettings: settings });
    }
  };

  const forceRefreshAllPCs = async () => {
    try {
      const versionRef = doc(db, "system", "version");
      await setDoc(versionRef, { updatedAt: Date.now(), updatedBy: user?.sub || 'admin' }, { merge: true });
    } catch (e) {
      console.error("Force refresh failed:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAccessCodeVerified,
        isLoading,
        lockoutState,
        notificationSettings,
        taskTypes,
        priorities,
        jobTitles,
        login,
        logout,
        verifyAccessCode,
        saveProfile,
        updateProfilePicture,
        updateJobTitle,
        updateNickname,
        updateAccessCode,
        updateTaskTypes,
        updatePriorities,
        updateJobTitles,
        updateNotificationSettings,
        forceRefreshAllPCs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
