import React, { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import { Underline } from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { db, auth } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { 
  Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, 
  Loader2, CheckSquare, CheckCircle2, RotateCcw
} from "lucide-react";
import { Extension } from "@tiptap/core";
import { Task } from "../types";

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    setFontSize: (fontSize: string) => ReturnType,
    unsetFontSize: () => ReturnType,
    setLetterSpacing: (letterSpacing: string) => ReturnType,
    unsetLetterSpacing: () => ReturnType,
  }
}

// Custom extension for font size
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    } as any;
  },
});

// Custom extension for letter spacing
const LetterSpacing = Extension.create({
  name: 'letterSpacing',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          letterSpacing: {
            default: null,
            parseHTML: element => element.style.letterSpacing.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.letterSpacing) return {};
              return { style: `letter-spacing: ${attributes.letterSpacing}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLetterSpacing: (letterSpacing: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { letterSpacing }).run();
      },
      unsetLetterSpacing: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { letterSpacing: null }).removeEmptyTextStyle().run();
      },
    } as any;
  },
});

interface NoteEditorProps {
  docPath: string;
  title: string;
  placeholder?: string;
  isShared?: boolean;
  completedTasks?: Task[];
  onToggleComplete?: (task: Task) => void;
}

export function NoteEditor({ docPath, title, placeholder = "내용을 입력하세요...", isShared = false, completedTasks, onToggleComplete }: NoteEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      LetterSpacing,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveNote(editor.getHTML());
      }, 2000);
    },
    editorProps: {
      handleClick: () => {
        // Force cursor to end on any click within the editor
        if (editor) {
          editor.commands.focus('end');
        }
        return true; // Prevent default click behavior to ensure it always goes to end
      },
    },
  }) as any;

  useEffect(() => {
    const noteRef = doc(db, docPath);
    const unsubscribe = onSnapshot(noteRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (editor && !editor.isFocused && data.content !== editor.getHTML()) {
          editor.commands.setContent(data.content);
        }
        if (data.updatedAt) {
          setLastSaved(new Date(data.updatedAt));
        }
      }
    }, (error) => {
      console.error("Note Snapshot Error:", error);
    });

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editor, docPath]);

  const saveNote = async (content: string) => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const noteRef = doc(db, docPath);
      const data: any = {
        content,
        updatedAt: new Date().toISOString(),
      };
      if (isShared) {
        data.lastUpdatedBy = auth.currentUser.uid;
      }
      await setDoc(noteRef, data, { merge: true });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) return null;

  const fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px", "32px"];

  return (
    <div className={`flex h-full w-full bg-app-bg ${isShared ? "flex-row gap-4 px-2" : "flex-col"}`}>
      <div className={`flex flex-col bg-[#1e1e1e] overflow-hidden ${isShared ? "rounded-2xl border border-white/5 shadow-2xl flex-1 mt-2" : "h-full"}`}>
        {/* Toolbar */}
      <div className="p-2 border-b border-white/5 bg-[#252525] flex flex-wrap gap-1 items-center sticky top-0 z-10">
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("bold") ? "bg-emerald-500/20 text-emerald-500" : "text-gray-400"}`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("italic") ? "bg-emerald-500/20 text-emerald-500" : "text-gray-400"}`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("underline") ? "bg-emerald-500/20 text-emerald-500" : "text-gray-400"}`}
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <select
            onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
            className="bg-transparent text-[9px] text-gray-400 outline-none cursor-pointer hover:text-white"
            value={editor.getAttributes('textStyle').fontSize || "14px"}
          >
            {fontSizes.map(size => <option key={size} value={size} className="bg-[#252525]">{size}</option>)}
          </select>
          <select
            onChange={(e) => editor.chain().focus().setLetterSpacing(e.target.value).run()}
            className="bg-transparent text-[9px] text-gray-400 outline-none cursor-pointer hover:text-white ml-1"
            value={editor.getAttributes('textStyle').letterSpacing || "0"}
          >
            <option value="0" className="bg-[#252525]">자간: 보통</option>
            <option value="-0.05em" className="bg-[#252525]">자간: 좁게</option>
            <option value="0.1em" className="bg-[#252525]">자간: 넓게</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <input
            type="color"
            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            className="w-4 h-4 bg-transparent border-none cursor-pointer"
            value={editor.getAttributes('textStyle').color || "#ffffff"}
          />
          <button
            onClick={() => {
              const url = window.prompt("URL을 입력하세요:");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("link") ? "bg-emerald-500/20 text-emerald-500" : "text-gray-400"}`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("taskList") ? "bg-emerald-500/20 text-emerald-500" : "text-gray-400"}`}
            title="체크박스"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1 pr-1">
          {isSaving ? (
            <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
          ) : (
            <span className="text-[8px] text-gray-600">
              {lastSaved ? lastSaved.toLocaleTimeString() : ""}
            </span>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div 
        className="flex-1 overflow-y-auto p-3 custom-scrollbar cursor-text"
        onClick={() => editor.commands.focus('end')}
      >
        <EditorContent 
          editor={editor} 
          className="prose prose-invert max-w-none focus:outline-none min-h-full text-gray-300 text-sm"
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror {
          min-height: 100%;
          outline: none;
        }
        .ProseMirror p {
          margin-bottom: 0.3em;
        }
        .ProseMirror a {
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
        }
        ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.2em;
        }
        ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          user-select: none;
          margin-right: 0.5rem;
          margin-top: 0.2rem;
        }
        ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }
        ul[data-type="taskList"] input[type="checkbox"] {
          cursor: pointer;
          width: 1.1em;
          height: 1.1em;
          accent-color: #10b981;
        }
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror ol li::marker {
          font-weight: 900;
          font-size: 1.5rem;
          color: #10b981;
          display: inline-block;
          margin-right: 0.5rem;
        }
        .ProseMirror li p {
          margin: 0;
          display: inline;
        }
      `}} />
      </div>
      
      {isShared && (
        <div className="w-80 flex flex-col bg-[#1e1e1e] overflow-hidden rounded-2xl border border-white/5 shadow-2xl mt-2 flex-shrink-0">
          <div className="p-4 border-b border-white/5 bg-[#252525] flex items-center justify-between">
            <h3 className="text-white font-bold text-sm tracking-wide">완료된 작업</h3>
            <div className="bg-emerald-500/20 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {completedTasks?.length || 0}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {completedTasks?.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-10">완료된 작업이 없습니다</div>
            ) : (
              completedTasks?.map(task => (
                <div key={task.id} className="bg-[#252525] rounded-xl p-3 border border-white/5 flex gap-3 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="pt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-gray-300 font-medium truncate mb-1 line-through decoration-emerald-500/30">{task.title}</h4>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded-md truncate max-w-[80px] border border-white/5">
                        {task.assignee}
                      </span>
                      <span className="text-[10px] text-gray-500">{task.updatedAt.split("T")[0]}</span>
                    </div>
                  </div>
                  {onToggleComplete && (
                    <button 
                      onClick={() => onToggleComplete(task)}
                      className="ml-auto flex-shrink-0 w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors self-center"
                      title="완료 취소"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
