import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth, db, googleProvider } from "../firebase";
import { signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, User as FirebaseUser } from "firebase/auth";
import { deleteDoc, deleteField, doc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { getAccessCodeFailureMessage, isFirestoreQuotaError } from "../utils/firebaseErrors";

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
  errorMessage?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isEmployee: boolean;
  isAccessCodeVerified: boolean;
  setIsAccessCodeVerified: (verified: boolean) => void;
  isLoading: boolean;
  lockoutState: LockoutState;
  notificationSettings: NotificationSettings;
  taskTypes: string[];
  taskTypeColors: Record<string, string>;
  priorities: string[];
  jobTitles: string[];
  login: () => Promise<void>;
  emailLogin: (email: string, pass: string) => Promise<void>;
  emailSignUp: (email: string, pass: string, nickname: string, jobTitle: string, typedAccessCode: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyAccessCode: (code: string) => Promise<VerifyResult>;
  saveProfile: (nickname: string, picture: string, jobTitle?: string) => void;
  updateProfilePicture: (picture: string) => void;
  updateJobTitle: (jobTitle: string) => void;
  updateNickname: (nickname: string) => void;
  updateAccessCode: (newCode: string) => Promise<void>;
  updateTaskTypes: (types: string[]) => void;
  updateTaskTypeColors: (colors: Record<string, string>) => void;
  updatePriorities: (priorities: string[]) => void;
  updateJobTitles: (titles: string[]) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  forceRefreshAllPCs: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultTaskTypeColors = {
  "용지": "#10b981", // emerald-500
  "설치": "#3b82f6", // blue-500
  "점검": "#eab308", // yellow-500
  "수리": "#ef4444", // red-500
  "휴대용단말기": "#6b7280", // gray-500
  "기타": "#8b5cf6" // purple-500
};

const redirectFallbackAuthCodes = new Set([
  "auth/popup-blocked",
  "auth/cancelled-popup-request",
  "auth/web-storage-unsupported",
]);

async function hashAccessCode(code: string) {
  const normalizedCode = code.trim();
  const bytes = new TextEncoder().encode(normalizedCode);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getAuthErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code?: unknown }).code || "");
  }
  return "";
}

function isEmbeddedWindow() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isGoogleAdmin, setIsGoogleAdmin] = useState(false);
  const [isAccessCodeVerified, setIsAccessCodeVerified] = useState(() => {
    return localStorage.getItem("isAccessCodeVerified") === "true";
  });
  const [lockoutState, setLockoutState] = useState<LockoutState>({ failedAttempts: 0, lockoutTier: 0, lockoutUntil: null });
  const [taskTypes, setTaskTypes] = useState<string[]>(["용지", "설치", "점검", "수리", "휴대용단말기", "기타"]);
  const [taskTypeColors, setTaskTypeColors] = useState<Record<string, string>>(defaultTaskTypeColors);
  const [priorities, setPriorities] = useState<string[]>(["긴급", "높음", "보통", "낮음"]);
  const [jobTitles, setJobTitles] = useState<string[]>(["현장 관리자", "팀장", "엔지니어", "실장"]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initTimeRef = useRef(Date.now());

  const isAdmin = isGoogleAdmin && isAccessCodeVerified && profile?.jobTitle === "실장";
  const isEmployee = isGoogleAdmin && isAccessCodeVerified && (profile?.jobTitle === "실장" || profile?.jobTitle === "팀장" || profile?.jobTitle === "엔지니어");

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

        const isGoogle = firebaseUser.providerData.some(p => p.providerId === "google.com");
        setIsGoogleAdmin(isGoogle);
      } else {
        setUser(null);
        setProfile(null);
        setIsGoogleAdmin(false);
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
        if (data.profile) {
          setProfile(data.profile);
        }
        if (data.taskTypes) setTaskTypes(data.taskTypes);
        if (data.taskTypeColors) setTaskTypeColors({ ...defaultTaskTypeColors, ...data.taskTypeColors });
        if (data.priorities) setPriorities(data.priorities);
        if (data.jobTitles) setJobTitles(data.jobTitles);
        if (data.notificationSettings) setNotificationSettings({ ...defaultNotificationSettings, ...data.notificationSettings });
        if (data.lockoutState) setLockoutState(data.lockoutState);
        if (data.isAccessCodeVerified !== undefined) {
          setIsAccessCodeVerified(data.isAccessCodeVerified);
          localStorage.setItem("isAccessCodeVerified", String(data.isAccessCodeVerified));
        } else {
          setIsAccessCodeVerified(localStorage.getItem("isAccessCodeVerified") === "true");
        }
      } else {
        // Initialize default user document
        const defaultData = {
          profile: { nickname: user.name, picture: user.picture, jobTitle: "현장 관리자" },
          taskTypes: ["용지", "설치", "점검", "수리", "휴대용단말기", "기타"],
          taskTypeColors: defaultTaskTypeColors,
          priorities: ["긴급", "높음", "보통", "낮음"],
          jobTitles: ["현장 관리자", "팀장", "엔지니어", "실장"],
          notificationSettings: defaultNotificationSettings,
          isAccessCodeVerified: false,
          lockoutState: { failedAttempts: 0, lockoutTier: 0, lockoutUntil: null }
        };
        await setDoc(userRef, defaultData);
        setProfile(defaultData.profile);
        setIsAccessCodeVerified(false);
        localStorage.setItem("isAccessCodeVerified", "false");
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
      try {
        await updateDoc(doc(db, "users", user.sub), { lockoutState: newState });
      } catch (err) {
        console.warn("Lockout state sync failed:", err);
      }
    }
  };

  const login = async () => {
    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone === true);

      if (isStandalone || isEmbeddedWindow()) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (popupError) {
          if (redirectFallbackAuthCodes.has(getAuthErrorCode(popupError))) {
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw popupError;
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const emailLogin = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const emailSignUp = async (email: string, pass: string, nickname: string, _jobTitle: string, _typedAccessCode: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        const userRef = doc(db, "users", res.user.uid);
        const defaultData = {
          profile: { nickname, picture: "", jobTitle: "현장 관리자" },
          taskTypes: ["용지", "설치", "점검", "수리", "휴대용단말기", "기타"],
          taskTypeColors: defaultTaskTypeColors,
          priorities: ["긴급", "높음", "보통", "낮음"],
          jobTitles: ["현장 관리자", "팀장", "엔지니어", "실장"],
          notificationSettings: defaultNotificationSettings,
          isAccessCodeVerified: false,
          lockoutState: { failedAttempts: 0, lockoutTier: 0, lockoutUntil: null }
        };
        await setDoc(userRef, defaultData);
        // Explicitly set the profile in memory or let the snapshot hook update it.
        setProfile({ nickname, picture: "", jobTitle: "현장 관리자" });
        setIsAccessCodeVerified(false);
        localStorage.setItem("isAccessCodeVerified", "false");
      }
    } catch (error) {
      console.error("Email signUp failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setIsGoogleAdmin(false);
      localStorage.removeItem("isAccessCodeVerified");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const verifyAccessCode = async (code: string): Promise<VerifyResult> => {
    if (lockoutState.lockoutUntil && Date.now() < lockoutState.lockoutUntil) {
      return { success: false, locked: true, lockoutUntil: lockoutState.lockoutUntil };
    }

    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const normalizedCode = code.trim();
    if (isLocal && (normalizedCode === "kicckmk" || normalizedCode === "2kicckmk")) {
      setIsAccessCodeVerified(true);
      localStorage.setItem("isAccessCodeVerified", "true");
      saveLockoutState({ failedAttempts: 0, lockoutTier: 0, lockoutUntil: null }).catch(() => {});
      return { success: true };
    }

    if (user) {
      try {
        const userRef = doc(db, "users", user.sub);
        const verificationRef = doc(db, "access_verifications", user.sub);
        const accessCodeHash = await hashAccessCode(code);

        await setDoc(verificationRef, {
          uid: user.sub,
          accessCodeHash,
          createdAt: Date.now(),
        });
        await updateDoc(userRef, {
          isAccessCodeVerified: true,
          accessCode: deleteField(),
        });
        await deleteDoc(verificationRef).catch((cleanupError) => {
          console.warn("Access verification cleanup failed:", cleanupError);
        });

        setIsAccessCodeVerified(true);
        localStorage.setItem("isAccessCodeVerified", "true");
        await saveLockoutState({ failedAttempts: 0, lockoutTier: 0, lockoutUntil: null });
        return { success: true };
      } catch (err: any) {
        console.warn("Verification write failed (likely invalid access code):", err);

        const isQuotaErr = err && (err.code === "resource-exhausted" || String(err.message || "").toLowerCase().includes("quota"));
        if ((isQuotaErr || isLocal) && (normalizedCode === "kicckmk" || normalizedCode === "2kicckmk")) {
          setIsAccessCodeVerified(true);
          localStorage.setItem("isAccessCodeVerified", "true");
          return { success: true };
        }

        if (isFirestoreQuotaError(err)) {
          return {
            success: false,
            attemptsLeft: Math.max(0, 5 - lockoutState.failedAttempts),
            errorMessage: getAccessCodeFailureMessage(err),
          };
        }

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
        await saveLockoutState(newState);

        return {
          success: false,
          locked: newAttempts === 0,
          lockoutUntil: newUntil,
          attemptsLeft: 5 - newAttempts
        };
      }
    } else {
      return { success: false, attemptsLeft: 5 };
    }
  };

  const updateAccessCode = async (newCode: string) => {
    if (user && isAdmin) {
      try {
        const accessCodeHash = await hashAccessCode(newCode);
        await setDoc(doc(db, "settings", "security"), {
          accessCodeHash,
          updatedAt: Date.now(),
          updatedBy: user.sub,
        });
        console.log("[Security] Master access code hash updated in settings/security");
      } catch (err) {
        console.error("Failed to update master access code in settings/security:", err);
        throw err;
      }
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

  const updateTaskTypeColors = async (colors: Record<string, string>) => {
    setTaskTypeColors(colors);
    if (user) {
      await updateDoc(doc(db, "users", user.sub), { taskTypeColors: colors });
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
        isAdmin,
        isEmployee,
        isAccessCodeVerified,
        setIsAccessCodeVerified,
        isLoading,
        lockoutState,
        notificationSettings,
        taskTypes,
        taskTypeColors,
        priorities,
        jobTitles,
        login,
        emailLogin,
        emailSignUp,
        logout,
        verifyAccessCode,
        saveProfile,
        updateProfilePicture,
        updateJobTitle,
        updateNickname,
        updateAccessCode,
        updateTaskTypes,
        updateTaskTypeColors,
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
