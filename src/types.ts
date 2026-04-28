export type Priority = "긴급" | "높음" | "보통" | "낮음";
export type Status = "예정" | "진행 중" | "완료" | "대기 중";
export type TaskType = "설치" | "점검" | "수리" | "휴대용단말기" | "기타";

export interface Task {
  id: string;
  title: string;
  status: Status;
  assignee: string;
  dueDate: string; // YYYY-MM-DD
  visitTime?: string; // HH:mm
  priority: Priority;
  taskType: TaskType;
  description: string;
  memo?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  showOnCalendar?: boolean;
  attachments?: string[];
}
