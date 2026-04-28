import { useState, useEffect } from "react";
import { Task } from "../types";
import { db, auth } from "../firebase";
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  throw new Error(JSON.stringify(errInfo));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
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
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user]);

  const addTask = async (task: Omit<Task, "id" | "updatedAt" | "createdAt">) => {
    if (!user) return;
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
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${path}/${taskId}`);
    }
  };

  const updateTask = async (
    id: string,
    updates: Partial<Omit<Task, "id" | "updatedAt" | "createdAt">>,
  ) => {
    if (!user) return;
    const path = `tasks/${id}`;
    
    try {
      await updateDoc(doc(db, "tasks", id), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    const path = `tasks/${id}`;
    
    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return { tasks, addTask, updateTask, deleteTask };
}
