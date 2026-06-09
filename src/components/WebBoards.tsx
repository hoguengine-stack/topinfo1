import React, { useState, useEffect, createContext, useContext } from "react";
import { db, storage } from "../firebase";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import { ResourceItem } from "../types";
import { buildResourceFileDraft, buildResourceRecord, getSafeStorageFileName } from "../utils/resourceFiles";
import { Lock, Unlock, Search, FileText, Download, Reply, Trash, CheckCircle2, FileDown, PlusCircle } from "lucide-react";

// =========================================================================
// 1. Suggestion Board Context & Provider
// =========================================================================

const SuggestionBoardContext = createContext<any>(null);

export function useSuggestionBoard() {
  const context = useContext(SuggestionBoardContext);
  if (!context) {
    throw new Error("useSuggestionBoard must be used within a SuggestionBoardProvider");
  }
  return context;
}

export function SuggestionBoardProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    authorName: "",
    isSecret: false,
    password: "",
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "suggestions"), (snap) => {
      const items: any[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...d.data() });
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPosts(items);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.content.toLowerCase().includes(search.toLowerCase()) ||
        p.authorName.toLowerCase().includes(search.toLowerCase())
      ));
    }
  }, [search, posts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content || !newPost.authorName) {
      alert("모든 빈칸을 채워주세요.");
      return;
    }
    if (newPost.isSecret && !newPost.password) {
      alert("비밀 게시글의 수정/조회를 위한 비밀번호를 입력해주세요.");
      return;
    }

    try {
      await addDoc(collection(db, "suggestions"), {
        title: newPost.title,
        content: newPost.content,
        authorName: newPost.authorName,
        isSecret: newPost.isSecret,
        password: newPost.password ? newPost.password : "",
        authorId: user?.sub || "anonymous",
        replies: [],
        createdAt: new Date().toISOString(),
      });
      setIsCreating(false);
      setNewPost({ title: "", content: "", authorName: "", isSecret: false, password: "" });
    } catch (err) {
      console.error(err);
      alert("저장 오류가 발생했습니다.");
    }
  };

  const handleAddReply = async () => {
    if (!selectedPost || !commentText.trim()) return;

    try {
      const reply = {
        id: Math.random().toString(36).substring(2, 9),
        authorName: profile?.nickname || "관리자",
        content: commentText,
        createdAt: new Date().toISOString(),
      };

      const postRef = doc(db, "suggestions", selectedPost.id);
      const updatedReplies = [...(selectedPost.replies || []), reply];
      await updateDoc(postRef, { replies: updatedReplies });

      setSelectedPost((prev: any) => ({ ...prev, replies: updatedReplies }));
      setCommentText("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "suggestions", postId));
      setSelectedPost(null);
      setConfirmDeletePostId(null);
    } catch (err) {
      alert("삭제 실패");
    }
  };

  const handleUnlockAndOpen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;
    if (unlockPassword === selectedPost.password || isAdmin) {
      setSelectedPost((prev: any) => ({ ...prev, _unlocked: true }));
      setUnlockError("");
      setUnlockPassword("");
    } else {
      setUnlockError("비밀번호가 일치하지 않습니다.");
    }
  };

  const canViewDetail = (post: any) => {
    if (!post.isSecret) return true;
    if (isAdmin) return true;
    if (post.authorId === user?.sub && user?.sub !== "anonymous") return true;
    return post._unlocked === true;
  };

  return (
    <SuggestionBoardContext.Provider value={{
      user,
      profile,
      isAdmin,
      posts,
      filteredPosts,
      search,
      setSearch,
      selectedPost,
      setSelectedPost,
      unlockPassword,
      setUnlockPassword,
      unlockError,
      setUnlockError,
      commentText,
      setCommentText,
      confirmDeletePostId,
      setConfirmDeletePostId,
      isCreating,
      setIsCreating,
      newPost,
      setNewPost,
      handleCreatePost,
      handleAddReply,
      handleDeletePost,
      handleUnlockAndOpen,
      canViewDetail,
    }}>
      {children}
    </SuggestionBoardContext.Provider>
  );
}

// =========================================================================
// 2. Suggestion Board Split Components
// =========================================================================

export function SuggestionBoardHeader() {
  const { isCreating, setIsCreating } = useSuggestionBoard();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">건의 & 가맹점 의견제안</h2>
          <p className="text-slate-500 mt-2">대표님들의 소소한 건의 및 조언을 귀담아 들어 최고의 서비스를 제공하겠습니다.</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="self-start md:self-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-md active:scale-95 transition flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" /> 의견 제안하기
          </button>
        )}
      </div>
    </div>
  );
}

export function SuggestionBoardSearch() {
  const { search, setSearch } = useSuggestionBoard();

  return (
    <div className="max-w-4xl mx-auto px-4 py-3 w-full">
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="제목, 본문, 또는 가맹점명 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none w-full"
        />
      </div>
    </div>
  );
}

export function SuggestionBoardBody() {
  const {
    user,
    isAdmin,
    filteredPosts,
    selectedPost,
    setSelectedPost,
    unlockPassword,
    setUnlockPassword,
    unlockError,
    setUnlockError,
    commentText,
    setCommentText,
    confirmDeletePostId,
    setConfirmDeletePostId,
    isCreating,
    setIsCreating,
    newPost,
    setNewPost,
    handleCreatePost,
    handleAddReply,
    handleDeletePost,
    handleUnlockAndOpen,
    canViewDetail,
  } = useSuggestionBoard();

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 w-full">
      {isCreating ? (
        <form onSubmit={handleCreatePost} className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-3xl shadow-sm mb-10 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-lg font-bold text-slate-800">새로운 의견 작성</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium"
            >
              취소하기
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">작성자 명 *</label>
              <input
                type="text"
                required
                placeholder="상호 또는 성함"
                value={newPost.authorName}
                onChange={(e) => setNewPost({ ...newPost, authorName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">비밀 게시글 여부</label>
              <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPost.isSecret}
                    onChange={(e) => setNewPost({ ...newPost, isSecret: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                    {newPost.isSecret ? <Lock className="w-3.5 h-3.5 text-orange-500" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                    비밀글로 설정하기
                  </span>
                </label>
              </div>
            </div>
          </div>

          {newPost.isSecret && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">조회용 비밀번호 (숫자 4자리) *</label>
              <input
                type="password"
                required
                maxLength={4}
                placeholder="비밀번호 4자리"
                value={newPost.password}
                onChange={(e) => setNewPost({ ...newPost, password: e.target.value })}
                className="w-44 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-center tracking-[0.5em] font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">건의 글 제목 *</label>
            <input
              type="text"
              required
              placeholder="예시: 단말기 교환 건의 또는 세무 프로그램 오류 개선"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">상세 제안 내용 *</label>
            <textarea
              required
              rows={5}
              placeholder="제안하고자 하시는 내용을 솔직하고 상세히 기재해 주십시오."
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-sm hover:shadow active:scale-[0.98] transition"
          >
            의견 등록 제출
          </button>
        </form>
      ) : null}

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="hidden md:grid grid-cols-12 px-6 py-4 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
          <div className="col-span-1 text-center">글 번호</div>
          <div className="col-span-7">의견 및 제안 제목</div>
          <div className="col-span-2 text-center">작성자</div>
          <div className="col-span-2 text-center">등록일</div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">등록된 건의사항 의견이 존재하지 않습니다.</div>
          ) : (
            filteredPosts.map((post, idx) => {
              return (
                <div key={post.id} className="hover:bg-slate-50 transition-colors">
                  <div
                    onClick={() => {
                      if (selectedPost?.id === post.id) {
                        setSelectedPost(null);
                      } else {
                        setSelectedPost(post);
                        setUnlockError("");
                      }
                    }}
                    className="grid grid-cols-1 md:grid-cols-12 items-center px-6 py-4 cursor-pointer text-sm"
                  >
                    <div className="hidden md:block col-span-1 text-center font-mono text-xs text-slate-400">{filteredPosts.length - idx}</div>
                    <div className="col-span-12 md:col-span-7 font-semibold text-slate-800 flex items-center gap-2">
                      {post.isSecret && (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs gap-1 font-bold">
                          <Lock className="w-3 h-3" /> 비밀글
                        </span>
                      )}
                      <span className="truncate">{post.title}</span>
                      {post.replies?.length > 0 && (
                        <span className="shrink-0 bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
                          답변 {post.replies.length}
                        </span>
                      )}
                    </div>
                    <div className="col-span-6 md:col-span-2 md:text-center text-xs text-slate-500 mt-2 md:mt-0">
                      <span className="md:hidden font-semibold mr-1">작성자:</span>{post.authorName}
                    </div>
                    <div className="col-span-6 md:col-span-2 text-right md:text-center text-xs text-slate-400 mt-2 md:mt-0 font-mono">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {selectedPost?.id === post.id && (
                    <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-6 md:px-12">
                      {!canViewDetail(post) ? (
                        <form onSubmit={handleUnlockAndOpen} className="max-w-md mx-auto text-center space-y-4 py-4">
                          <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 text-orange-500">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">이 글은 비밀 보장을 위해 잠겨있습니다</h4>
                            <p className="text-xs text-slate-500 mt-1">작성 시 정하신 숫자 비밀번호 4자리를 입력해주세요.</p>
                          </div>
                          <div className="flex gap-2 justify-center items-center">
                            <input
                              type="password"
                              maxLength={4}
                              placeholder="••••"
                              value={unlockPassword}
                              onChange={(e) => { setUnlockPassword(e.target.value); setUnlockError(""); }}
                              className="bg-white border border-slate-200 text-center text-lg w-24 py-2 font-bold tracking-[0.2em] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                            />
                            <button
                              type="submit"
                              className="bg-slate-900 border border-transparent text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
                            >
                              게시글 해제
                            </button>
                          </div>
                          {unlockError && <p className="text-xs text-red-500 font-semibold">{unlockError}</p>}
                        </form>
                      ) : (
                        <div className="space-y-6">
                          <div className="border-b border-slate-100 pb-5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-400">의견 상세내용</span>
                              {(isAdmin || post.authorId === user?.sub) && (
                                confirmDeletePostId === post.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePost(post.id);
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
                                    >
                                      삭제 확정
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeletePostId(null);
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition"
                                    >
                                      취소
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeletePostId(post.id);
                                    }}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                                  >
                                    <Trash className="w-3.5 h-3.5" /> 삭제하기
                                  </button>
                                )
                              )}
                            </div>
                            <p className="text-slate-800 text-sm whitespace-pre-wrap mt-3 leading-relaxed">{post.content}</p>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                              <Reply className="w-3.5 h-3.5 rotate-180" /> 탑정보통신 전담 엔지니어 답변
                            </h4>

                            {post.replies && post.replies.length > 0 ? (
                              <div className="space-y-3">
                                {post.replies.map((reply: any) => (
                                  <div key={reply.id} className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-extrabold text-blue-700">{reply.authorName} (전담팀)</span>
                                      <span className="text-[10px] font-mono text-slate-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 border border-dashed border-slate-200 p-4 rounded-2xl text-center">
                                등록된 제안답변이 없습니다. 담당 사외 기술팀이 검토 중입니다.
                              </div>
                            )}

                            {isAdmin && (
                              <div className="mt-4 border-t border-slate-100 pt-4 flex gap-2">
                                <input
                                  type="text"
                                  placeholder="가맹점주님께 전해드릴 답변을 성심성의껏 작성하세요..."
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
                                />
                                <button
                                  onClick={handleAddReply}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                                >
                                  답변달기
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function SuggestionBoard() {
  return (
    <SuggestionBoardProvider>
      <SuggestionBoardHeader />
      <SuggestionBoardSearch />
      <SuggestionBoardBody />
    </SuggestionBoardProvider>
  );
}

// =========================================================================
// 3. Resource Board Context & Provider
// =========================================================================

const ResourceBoardContext = createContext<any>(null);

export function useResourceBoard() {
  const context = useContext(ResourceBoardContext);
  if (!context) {
    throw new Error("useResourceBoard must be used within a ResourceBoardProvider");
  }
  return context;
}

export function ResourceBoardProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    downloadUrl: "",
    fileSize: "",
    fileType: "",
    storagePath: "",
  });

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [confirmDeleteResourceId, setConfirmDeleteResourceId] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.sub || !isAdmin) {
      alert("관리자 인증이 완료된 계정만 자료 파일을 업로드할 수 있습니다.");
      input.value = "";
      return;
    }

    const fileDraft = buildResourceFileDraft(file);

    setNewResource((prev) => ({
      ...prev,
      downloadUrl: "",
      fileSize: fileDraft.fileSize,
      fileType: fileDraft.fileType,
      storagePath: "",
      title: prev.title || fileDraft.title,
    }));

    setUploadingFile(true);
    setUploadProgress(0);
    setUploadedFileName(file.name);

    try {
      const safeFileName = getSafeStorageFileName(file.name);
      const storageRef = ref(storage, `resources/${user.sub}/${Date.now()}_${safeFileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress > 0 ? progress : 1);
        },
        (error) => {
          console.error("Upload error details:", error);
          alert("파일 업로드 실패!\nFirebase Storage 보안 규칙 위반 또는 네트워크 접속 오류가 발생했을 수 있습니다.\n에러 내용: " + error.message);
          setUploadingFile(false);
          setUploadProgress(0);
          setUploadedFileName("");
          input.value = "";
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setNewResource((prev) => ({
              ...prev,
              downloadUrl,
              fileSize: fileDraft.fileSize,
              fileType: fileDraft.fileType,
              storagePath: uploadTask.snapshot.ref.fullPath,
            }));
            setUploadProgress(100);
          } catch (err: any) {
            console.error("Error getting download URL:", err);
            alert("다운로드 주소를 획득하는 데 실패했습니다: " + err.message);
            setUploadedFileName("");
          } finally {
            setUploadingFile(false);
            input.value = "";
          }
        }
      );
    } catch (err: any) {
      console.error("Upload initialization error:", err);
      alert("업로드 모듈 초기화 실패: " + err.message);
      setUploadingFile(false);
      setUploadProgress(0);
      setUploadedFileName("");
      input.value = "";
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "resources"), (snap) => {
      const items: ResourceItem[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as ResourceItem);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setResources(items);
    });
    return () => unsub();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title || !newResource.description) {
      alert("제목과 설명 정보를 입력하세요.");
      return;
    }
    if (uploadingFile) {
      alert("파일 업로드가 완료된 뒤 등록해 주세요.");
      return;
    }
    if (!newResource.downloadUrl) {
      alert("로컬 파일 업로드를 완료하거나 다운로드 링크를 입력해 주세요.");
      return;
    }

    try {
      await addDoc(
        collection(db, "resources"),
        buildResourceRecord(newResource, {
          createdAt: new Date().toISOString(),
          authorName: profile?.nickname || "대표 관리자",
        })
      );
      setIsUploading(false);
      setNewResource({ title: "", description: "", downloadUrl: "", fileSize: "", fileType: "", storagePath: "" });
      setUploadedFileName("");
      setUploadProgress(0);
    } catch (err) {
      alert("자료 보관 실패");
    }
  };

  const handleDeleteResource = async (item: ResourceItem) => {
    try {
      await deleteDoc(doc(db, "resources", item.id));
      if (item.storagePath) {
        try {
          await deleteObject(ref(storage, item.storagePath));
        } catch (storageErr) {
          console.warn("Resource storage file deletion failed:", storageErr);
        }
      }
      setConfirmDeleteResourceId(null);
    } catch (err) {
      alert("삭제 실패");
    }
  };

  const filtered = resources.filter(res =>
    res.title.toLowerCase().includes(search.toLowerCase()) ||
    res.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ResourceBoardContext.Provider value={{
      profile,
      isAdmin,
      resources,
      search,
      setSearch,
      isUploading,
      setIsUploading,
      newResource,
      setNewResource,
      uploadingFile,
      setUploadingFile,
      uploadProgress,
      setUploadProgress,
      uploadedFileName,
      setUploadedFileName,
      confirmDeleteResourceId,
      setConfirmDeleteResourceId,
      handleFileChange,
      handleUpload,
      handleDeleteResource,
      filtered,
    }}>
      {children}
    </ResourceBoardContext.Provider>
  );
}

// =========================================================================
// 4. Resource Board Split Components
// =========================================================================

export function ResourceBoardHeader() {
  const { isAdmin, isUploading, setIsUploading } = useResourceBoard();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">자료실 & 소프트웨어 다운로드</h2>
          <p className="text-slate-500 mt-2">탑정보통신의 가맹 전용 최신 드라이버, 세무 정산 프로그램, 간편 기기 매뉴얼입니다.</p>
        </div>
        {isAdmin && !isUploading && (
          <button
            onClick={() => setIsUploading(true)}
            className="self-start md:self-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-md active:scale-95 transition flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" /> 엔지니어 파일 업로드
          </button>
        )}
      </div>
    </div>
  );
}

export function ResourceBoardSearch() {
  const { search, setSearch } = useResourceBoard();

  return (
    <div className="max-w-4xl mx-auto px-4 py-3 w-full">
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="검색할 유틸리티 드라이버, 매뉴얼 키워드 입력"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none w-full"
        />
      </div>
    </div>
  );
}

export function ResourceBoardBody() {
  const {
    isAdmin,
    isUploading,
    setIsUploading,
    newResource,
    setNewResource,
    uploadingFile,
    uploadProgress,
    uploadedFileName,
    confirmDeleteResourceId,
    setConfirmDeleteResourceId,
    handleFileChange,
    handleUpload,
    handleDeleteResource,
    filtered,
  } = useResourceBoard();

  const canSubmitResource = !uploadingFile && Boolean(newResource.title && newResource.description && newResource.downloadUrl);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 w-full">
      {isUploading ? (
        <form onSubmit={handleUpload} className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-3xl shadow-sm mb-10 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-lg font-bold text-slate-800">새로운 자료 등록</h3>
            <button
              type="button"
              onClick={() => setIsUploading(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium"
            >
              취소
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">자료 제목명 *</label>
              <input
                type="text"
                placeholder="포스 기기 USB 드라이버 패키지"
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">파일 다운로드 경로 링크 / 로컬 파일 업로드</label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="로컬 파일 업로드 완료 시 자동 입력"
                  value={newResource.downloadUrl}
                  onChange={(e) => setNewResource({ ...newResource, downloadUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="resource-file-upload-split"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="resource-file-upload-split"
                    className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200 active:scale-95 transition flex items-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5" /> 로컬 파일 선택하여 업로드
                  </label>
                  {uploadingFile && (
                    <span className="text-xs text-blue-600 font-bold animate-pulse">
                      업로드 중... ({uploadProgress}%)
                    </span>
                  )}
                  {uploadedFileName && !uploadingFile && newResource.downloadUrl && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {uploadedFileName} 완료
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">파일 타입</label>
              <input
                type="text"
                placeholder="파일 선택 시 자동 입력"
                value={newResource.fileType}
                onChange={(e) => setNewResource({ ...newResource, fileType: e.target.value })}
                readOnly={Boolean(uploadedFileName)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">자료 파일 용량</label>
              <input
                type="text"
                placeholder="파일 선택 시 자동 입력"
                value={newResource.fileSize}
                onChange={(e) => setNewResource({ ...newResource, fileSize: e.target.value })}
                readOnly={Boolean(uploadedFileName)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">상세 다운로드 안내구정 *</label>
            <textarea
              required
              rows={3}
              placeholder="USB 포트에 꽂은 이후 setup.exe 파일을 관리자 권한으로 실행해주십시오."
              value={newResource.description}
              onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmitResource}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl active:scale-[0.98] transition"
          >
            {uploadingFile ? "파일 업로드 완료 대기 중..." : "신규 파일 등록 완료"}
          </button>
        </form>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 py-10 text-center text-slate-400 text-sm bg-white border border-slate-100 rounded-3xl">
            해당하는 파일 자료가 보관되어 있지 않습니다.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-150 rounded-3xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-start gap-4 relative group text-left"
            >
              {confirmDeleteResourceId === item.id && (
                <div className="absolute inset-0 z-30 bg-slate-950/90 rounded-3xl p-6 flex flex-col items-center justify-center text-center text-white">
                  <Trash className="w-8 h-8 text-red-400 mb-2" />
                  <p className="text-sm font-bold mb-1">자료를 영구 삭제하시겠습니까?</p>
                  <p className="text-xs text-slate-300 mb-4 line-clamp-2">{item.title}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteResource(item);
                      }}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
                    >
                      삭제 확정
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteResourceId(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 pr-24">
                <h4 className="font-bold text-slate-800 text-base truncate">{item.title}</h4>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-3 mt-4 text-[11px] font-medium text-slate-400">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{item.fileType}</span>
                  <span className="font-mono">{item.fileSize}</span>
                  <span className="font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <a
                  href={item.downloadUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                  title="파일 내려받기"
                >
                  <Download className="w-4 h-4" />
                </a>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteResourceId(item.id);
                    }}
                    className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"
                    title="자료 폐기"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ResourceBoard() {
  return (
    <ResourceBoardProvider>
      <ResourceBoardHeader />
      <ResourceBoardSearch />
      <ResourceBoardBody />
    </ResourceBoardProvider>
  );
}
