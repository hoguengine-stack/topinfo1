import React, { useEffect, useState } from "react";
import { Task } from "../types";
import { isSameDay, parseISO } from "date-fns";
import { AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function TodayTasksNotification({ tasks }: { tasks: Task[] }) {
  const [show, setShow] = useState(false);
  const todayTasks = tasks.filter((t) => isSameDay(parseISO(t.dueDate), new Date()) && t.status !== "완료");

  useEffect(() => {
    if (todayTasks.length > 0) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [tasks]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-4 right-4 z-[200]"
        >
          <div className="bg-red-500 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-red-400">
            <div className="bg-white/20 p-2 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">오늘 마감 작업 알림</p>
              <p className="text-xs opacity-90">오늘 처리해야 할 작업이 {todayTasks.length}건 있습니다!</p>
            </div>
            <button onClick={() => setShow(false)} className="p-1 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
