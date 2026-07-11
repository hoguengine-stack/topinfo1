import { useState, useEffect } from "react";
import { Task } from "../types";
import { db, auth } from "../firebase";
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function getFirestoreErrorInfo(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId || undefined,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user, isEmployee } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user || !isEmployee) {
      setTasks([]);
      return;
    }

    const path = `tasks`;
    const tasksRef = collection(db, path);
    
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const fetchedTasks: Task[] = [];
      snapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      // Sort by updatedAt desc locally since we are using a shared collection
      fetchedTasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setTasks(fetchedTasks);
    }, (error) => {
      getFirestoreErrorInfo(error, OperationType.GET, path);
      setTasks([]);
      showToast("작업 목록을 불러오지 못했습니다. 로그인 상태와 Firebase 연결을 확인해 주세요.", "error");
    });

    return () => unsubscribe();
  }, [user, isEmployee, showToast]);

  const addTask = async (task: Omit<Task, "id" | "updatedAt" | "createdAt">) => {
    if (!user) return false;
    const path = `tasks`;
    const taskId = Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const newTask = {
      ...task,
      authorId: user.sub,
      createdAt: now,
      updatedAt: now,
    };
    
    try {
      await setDoc(doc(db, path, taskId), newTask);
      return true;
    } catch (error) {
      getFirestoreErrorInfo(error, OperationType.CREATE, `${path}/${taskId}`);
      showToast("작업 저장에 실패했습니다.", "error");
      return false;
    }
  };

  const updateTask = async (
    id: string,
    updates: Partial<Omit<Task, "id" | "updatedAt" | "createdAt">>,
  ) => {
    if (!user) return false;
    const path = `tasks/${id}`;
    
    try {
      await updateDoc(doc(db, "tasks", id), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      getFirestoreErrorInfo(error, OperationType.UPDATE, path);
      showToast("작업 수정에 실패했습니다.", "error");
      return false;
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return false;
    const path = `tasks/${id}`;
    
    try {
      await deleteDoc(doc(db, "tasks", id));
      return true;
    } catch (error) {
      getFirestoreErrorInfo(error, OperationType.DELETE, path);
      showToast("작업 삭제에 실패했습니다.", "error");
      return false;
    }
  };

  return { tasks, addTask, updateTask, deleteTask };
}
