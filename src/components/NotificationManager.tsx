import React, { useEffect, useRef } from "react";
import { Task } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { parseISO, differenceInMinutes, isSameDay } from "date-fns";

export function NotificationManager({ tasks }: { tasks: Task[] }) {
  const { notificationSettings, user, profile } = useAuth();
  const prevTasksRef = useRef<Task[]>(tasks);
  const notifiedKeysRef = useRef<Set<string>>(new Set());

  const sendPush = async (title: string, body: string) => {
    if (!notificationSettings?.pushEnabled) return;
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        if (navigator.serviceWorker) {
          // getRegistration is safer than waiting for .ready if not registered properly, but ready works if registered.
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.showNotification) {
            await reg.showNotification(title, { body, icon: "/favicon.ico" });
            return;
          }
        }
        // Fallback for browsers that support the Notification constructor directly
        new Notification(title, { body, icon: "/favicon.ico" });
      } catch (err) {
        console.error("Push notification failed:", err);
      }
    }
  };

  // Poll for time-based alerts
  useEffect(() => {
    if (!notificationSettings?.pushEnabled) return;

    const checkTimes = () => {
      const now = new Date();
      tasks.forEach((task) => {
        if (task.status === "완료") return;

        // Try to construct a precise datetime using visitTime if available
        let targetTimeObj = parseISO(task.dueDate);
        if (task.visitTime) {
          const [hh, mm] = task.visitTime.split(":");
          targetTimeObj.setHours(parseInt(hh), parseInt(mm), 0, 0);
        } else {
          // If no visit time, maybe just default to end of day for deadline
          targetTimeObj.setHours(23, 59, 59, 999);
        }

        const diffMins = differenceInMinutes(targetTimeObj, now);

        // 1. 마감일 임박 (1시간 전)
        if (notificationSettings.notifyBeforeDeadline && diffMins > 0 && diffMins <= 60 && diffMins >= 59) {
          const key = `${task.id}-deadline-1h`;
          if (!notifiedKeysRef.current.has(key)) {
            sendPush("마감 1시간 전", `작업: ${task.title}`);
            notifiedKeysRef.current.add(key);
          }
        }

        // 2. 기한초과 경고 (1시간 뒤)
        // difference is negative when overdue
        if (notificationSettings.notifyOverdue && diffMins < 0 && diffMins <= -60 && diffMins >= -61) {
          const key = `${task.id}-overdue-1h`;
          if (!notifiedKeysRef.current.has(key)) {
            sendPush("기한 초과 경고", `작업이 1시간 이상 초과되었습니다: ${task.title}`);
            notifiedKeysRef.current.add(key);
          }
        }

        // 3. 일정시작 전 리마인드 (30분 전)
        // Let's assume visitTime is the start time.
        if (task.visitTime && notificationSettings.notifyBeforeStart && diffMins > 0 && diffMins <= 30 && diffMins >= 29) {
          const key = `${task.id}-start-30m`;
          if (!notifiedKeysRef.current.has(key)) {
            sendPush("일정 시작 30분 전", `작업: ${task.title}`);
            notifiedKeysRef.current.add(key);
          }
        }
      });
    };

    const interval = setInterval(checkTimes, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [tasks, notificationSettings]);

  // Handle new/completed tasks
  useEffect(() => {
    if (!notificationSettings?.pushEnabled || !notificationSettings.notifyNewTask) {
      prevTasksRef.current = tasks;
      return;
    }

    const prevTasks = prevTasksRef.current;
    
    // Only process if it's not the initial mount load
    if (prevTasks.length > 0) {
      tasks.forEach((task) => {
        const prevTask = prevTasks.find((t) => t.id === task.id);
        
        // New Task: created within last a few seconds, not authored by self?
        // Actually, requirement says "새로운 업무 생성시 혹은 완료시 전체 인원에게 알림"
        if (!prevTask) {
          // It's a new task
          if (task.authorId !== user?.sub) {
            sendPush("새로운 업무 생성", `${task.title} (담당자: ${task.assignee})`);
          }
        } else {
          // Existed before, check if just completed
          if (prevTask.status !== "완료" && task.status === "완료") {
            const key = `${task.id}-completed-global`;
            if (!notifiedKeysRef.current.has(key)) {
              // Option to skip notifying if I completed it myself:
              // if (task.authorId !== user?.sub) ... but requirement says '전체 인원에게' 
              sendPush("업무 완료", `작업이 완료되었습니다: ${task.title}`);
              notifiedKeysRef.current.add(key);
            }
          }
        }
      });
    }

    prevTasksRef.current = tasks;
  }, [tasks, notificationSettings, user?.sub]);

  return null;
}
