import { useState, useEffect } from "react";
import { Task } from "../types";
import { db, auth } from "../firebase";
import { collection, doc, setDoc, onSnapshot, runTransaction } from "firebase/firestore";
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
      const taskRef = doc(db, "tasks", id);
      await runTransaction(db, async (transaction) => {
        const taskSnapshot = await transaction.get(taskRef);
        if (!taskSnapshot.exists()) throw new Error("task-not-found");

        const currentTask = { id: taskSnapshot.id, ...taskSnapshot.data() } as Task;
        let sourceRef: ReturnType<typeof doc> | null = null;

        if (updates.status && currentTask.sourceCollection && currentTask.sourceId) {
          sourceRef = doc(db, currentTask.sourceCollection, currentTask.sourceId);
          const sourceSnapshot = await transaction.get(sourceRef);
          if (!sourceSnapshot.exists()) throw new Error("linked-source-not-found");
          if (sourceSnapshot.data().linkedTaskId !== id) throw new Error("linked-source-mismatch");
        }

        transaction.update(taskRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });

        if (sourceRef && updates.status) {
          transaction.update(sourceRef, {
            status: updates.status === "완료" ? "완료" : "작업등록",
          });
        }
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
      const taskRef = doc(db, "tasks", id);
      await runTransaction(db, async (transaction) => {
        const taskSnapshot = await transaction.get(taskRef);
        if (!taskSnapshot.exists()) return;

        const currentTask = taskSnapshot.data() as Task;
        if (currentTask.sourceCollection || currentTask.sourceId) {
          throw new Error("linked-task-delete-blocked");
        }
        transaction.delete(taskRef);
      });
      return true;
    } catch (error) {
      getFirestoreErrorInfo(error, OperationType.DELETE, path);
      const isLinkedTask = error instanceof Error && error.message === "linked-task-delete-blocked";
      showToast(
        isLinkedTask
          ? "상담·배송 요청과 연결된 작업은 원본 이력을 보호하기 위해 삭제할 수 없습니다."
          : "작업 삭제에 실패했습니다.",
        "error",
      );
      return false;
    }
  };

  return { tasks, addTask, updateTask, deleteTask };
}
