import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth, db, googleProvider } from "../firebase";
import { signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, getIdTokenResult, User as FirebaseUser } from "firebase/auth";
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
  isAdmin?: boolean;
  errorMessage?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isEmployee: boolean;
  hasStaffAccess: boolean;
  isStaffAccessLoading: boolean;
  isLoading: boolean;
  notificationSettings: NotificationSettings;
  taskTypes: string[];
  taskTypeColors: Record<string, string>;
  priorities: string[];
  jobTitles: string[];
  login: () => Promise<void>;
  emailLogin: (email: string, pass: string) => Promise<void>;
  emailSignUp: (email: string, pass: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshStaffAccess: () => Promise<VerifyResult>;
  saveProfile: (nickname: string, picture: string, jobTitle?: string) => void;
  updateProfilePicture: (picture: string) => void;
  updateJobTitle: (jobTitle: string) => void;
  updateNickname: (nickname: string) => void;
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

function readUidList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

async function loadStaffAccess(uid: string) {
  const securitySnapshot = await getDoc(doc(db, "settings", "security"));
  if (!securitySnapshot.exists()) return { authorized: false, isAdmin: false };

  const security = securitySnapshot.data();
  const adminUids = readUidList(security.adminUids);
  const employeeUids = readUidList(security.employeeUids);
  const isAdmin = adminUids.includes(uid);
  return {
    authorized: isAdmin || employeeUids.includes(uid),
    isAdmin,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isGoogleSession, setIsGoogleSession] = useState(false);
  const [isAdminAccount, setIsAdminAccount] = useState(false);
  const [hasStaffAccess, setHasStaffAccess] = useState(false);
  const [isStaffAccessLoading, setIsStaffAccessLoading] = useState(true);
  const [taskTypes, setTaskTypes] = useState<string[]>(["용지", "설치", "점검", "수리", "휴대용단말기", "기타"]);
  const [taskTypeColors, setTaskTypeColors] = useState<Record<string, string>>(defaultTaskTypeColors);
  const [priorities, setPriorities] = useState<string[]>(["긴급", "높음", "보통", "낮음"]);
  const [jobTitles, setJobTitles] = useState<string[]>(["현장 관리자", "팀장", "엔지니어", "실장"]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initTimeRef = useRef(Date.now());

  const isEmployee = isGoogleSession && hasStaffAccess;
  const isAdmin = isEmployee && isAdminAccount;

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsStaffAccessLoading(true);
        setUser({
          sub: firebaseUser.uid,
          name: firebaseUser.displayName || "",
          picture: firebaseUser.photoURL || "",
          email: firebaseUser.email || "",
          email_verified: firebaseUser.emailVerified,
        });

        try {
          const tokenResult = await getIdTokenResult(firebaseUser);
          const isGoogle = tokenResult.signInProvider === "google.com";
          setIsGoogleSession(isGoogle);
          if (!isGoogle) setIsStaffAccessLoading(false);
        } catch {
          setIsGoogleSession(false);
          setIsStaffAccessLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsGoogleSession(false);
        setIsAdminAccount(false);
        setHasStaffAccess(false);
        setIsStaffAccessLoading(false);
        setIsLoading(false);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!user || !isGoogleSession) {
      setHasStaffAccess(false);
      setIsAdminAccount(false);
      return;
    }

    setIsStaffAccessLoading(true);
    loadStaffAccess(user.sub)
      .then((access) => {
        if (cancelled) return;
        setHasStaffAccess(access.authorized);
        setIsAdminAccount(access.isAdmin);
      })
      .catch(() => {
        if (cancelled) return;
        setHasStaffAccess(false);
        setIsAdminAccount(false);
      })
      .finally(() => {
        if (cancelled) return;
        setIsStaffAccessLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isGoogleSession]);

  useEffect(() => {
    if (!user || !isEmployee) return;

    const versionRef = doc(db, "system", "version");
    const unsubscribeVersion = onSnapshot(versionRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      if (data.updatedAt && data.updatedAt > initTimeRef.current) {
        console.log("새로운 코드가 배포되었습니다. 화면을 새로고침합니다.");
        const url = new URL(window.location.href);
        url.searchParams.set("t", Date.now().toString());
        window.location.href = url.toString();
      }
    }, (err) => {
      console.warn("version check error", err);
    });

    return () => unsubscribeVersion();
  }, [user, isEmployee]);

  useEffect(() => {
    if (!user || !profile || !isEmployee) return;
    setDoc(doc(db, "staff_profiles", user.sub), {
      uid: user.sub,
      nickname: profile.nickname,
      ...(profile.jobTitle ? { jobTitle: profile.jobTitle } : {}),
      updatedAt: new Date().toISOString(),
    }, { merge: true }).catch((error) => {
      console.warn("Staff directory sync failed", error);
    });
  }, [isEmployee, profile?.jobTitle, profile?.nickname, user?.sub]);

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
      } else {
        // Initialize default user document
        const defaultData = {
          profile: { nickname: user.name, picture: user.picture, jobTitle: "현장 관리자" },
          taskTypes: ["용지", "설치", "점검", "수리", "휴대용단말기", "기타"],
          taskTypeColors: defaultTaskTypeColors,
          priorities: ["긴급", "높음", "보통", "낮음"],
          jobTitles: ["현장 관리자", "팀장", "엔지니어", "실장"],
          notificationSettings: defaultNotificationSettings,
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

  const emailSignUp = async (email: string, pass: string, nickname: string) => {
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
        };
        await setDoc(userRef, defaultData);
        // Explicitly set the profile in memory or let the snapshot hook update it.
        setProfile({ nickname, picture: "", jobTitle: "현장 관리자" });
      }
    } catch (error) {
      console.error("Email signUp failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setIsGoogleSession(false);
      setIsAdminAccount(false);
      setHasStaffAccess(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const refreshStaffAccess = async (): Promise<VerifyResult> => {
    if (!user || !isGoogleSession) {
      return { success: false, errorMessage: "Google Workspace 계정으로 로그인해야 합니다." };
    }

    try {
      const access = await loadStaffAccess(user.sub);
      setHasStaffAccess(access.authorized);
      setIsAdminAccount(access.isAdmin);
      return access.authorized
        ? { success: true, isAdmin: access.isAdmin }
        : { success: false, errorMessage: "이 Google 계정은 아직 임직원 허용 목록에 등록되지 않았습니다." };
    } catch {
      setHasStaffAccess(false);
      setIsAdminAccount(false);
      return { success: false, errorMessage: "임직원 권한을 확인하지 못했습니다. 관리자에게 Firebase UID 등록을 요청해 주세요." };
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
        hasStaffAccess,
        isStaffAccessLoading,
        isLoading,
        notificationSettings,
        taskTypes,
        taskTypeColors,
        priorities,
        jobTitles,
        login,
        emailLogin,
        emailSignUp,
        logout,
        refreshStaffAccess,
        saveProfile,
        updateProfilePicture,
        updateJobTitle,
        updateNickname,
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
