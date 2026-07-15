import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  ArrowLeft,
  Check,
  Download,
  ExternalLink,
  FileArchive,
  FileText,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Comment, ResourceItem, Suggestion } from "../../types";
import { PRIVACY_POLICY_VERSION } from "../../utils/publicRequests";
import {
  buildResourceRecord,
  buildStaticDownloadDraft,
  ResourceFormDraft,
  StaticDownloadManifestItem,
} from "../../utils/resourceFiles";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function sortByCreatedAt<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function mapSuggestionSnapshot(snapshot: any): Suggestion[] {
  return snapshot.docs.map((item: any) => ({ id: item.id, ...item.data() } as Suggestion));
}

function SuggestionComposer({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    title: "",
    content: "",
    authorName: profile?.nickname || user?.name || "",
    isSecret: false,
    privacyConsent: false,
    overseasTransferConsent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.authorName.trim()) {
      setError("작성자, 제목, 내용을 모두 입력해주세요.");
      return;
    }
    if (!form.privacyConsent || !form.overseasTransferConsent) {
      setError("개인정보 수집·이용 및 국외 처리 동의가 필요합니다.");
      return;
    }
    if (form.isSecret && !user) {
      setError("비공개 글은 로그인 후 작성할 수 있습니다.");
      return;
    }

    setSubmitting(true);
    setError("");
    const createdAt = new Date().toISOString();
    try {
      const post: Record<string, unknown> = {
        title: form.title.trim(),
        content: form.content.trim(),
        authorName: form.authorName.trim(),
        isSecret: form.isSecret,
        createdAt,
        privacyConsentAt: createdAt,
        overseasTransferConsentAt: createdAt,
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      };
      if (user) post.authorId = user.sub;
      await addDoc(collection(db, "suggestions"), post);
      onClose();
    } catch (submitError) {
      console.error("Suggestion create failed:", submitError);
      setError("글을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-dialog-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="public-dialog" role="dialog" aria-modal="true" aria-labelledby="suggestion-compose-title">
        <header>
          <div>
            <p className="public-kicker">건의제안</p>
            <h2 id="suggestion-compose-title">건의사항 작성</h2>
          </div>
          <button type="button" className="public-icon-button" onClick={onClose} aria-label="닫기"><X /></button>
        </header>
        <form className="public-form public-form--dialog" onSubmit={submit}>
          <label><span>작성자 <b>*</b></span><input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} placeholder="이름 또는 상호" /></label>
          <label><span>제목 <b>*</b></span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="제목을 입력해주세요" maxLength={200} /></label>
          <label><span>내용 <b>*</b></span><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="불편했던 점이나 개선 의견을 구체적으로 알려주세요." rows={7} maxLength={5000} /></label>
          <label className={`public-choice-row ${!user ? "is-disabled" : ""}`}>
            <input type="checkbox" checked={form.isSecret} disabled={!user} onChange={(e) => setForm({ ...form, isSecret: e.target.checked })} />
            <LockKeyhole aria-hidden="true" /><span>작성자와 임직원만 보는 비공개 글</span>
          </label>
          <label className="public-choice-row"><input type="checkbox" checked={form.privacyConsent} onChange={(e) => setForm({ ...form, privacyConsent: e.target.checked })} /><Check aria-hidden="true" /><span>[필수] 개인정보 수집·이용 동의</span></label>
          <label className="public-choice-row"><input type="checkbox" checked={form.overseasTransferConsent} onChange={(e) => setForm({ ...form, overseasTransferConsent: e.target.checked })} /><Check aria-hidden="true" /><span>[필수] Firebase 국외 처리 안내 동의</span></label>
          {error && <p className="public-form__error" role="alert">{error}</p>}
          <div className="public-dialog__actions">
            <button type="button" className="public-button public-button--secondary" onClick={onClose}>취소</button>
            <button type="submit" className="public-button public-button--primary" disabled={submitting}>
              {submitting ? <LoaderCircle className="animate-spin" /> : <Send />} {submitting ? "저장 중" : "등록"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function PublicSuggestionBoard() {
  const { user, profile, isEmployee } = useAuth();
  const [publicPosts, setPublicPosts] = useState<Suggestion[]>([]);
  const [privatePosts, setPrivatePosts] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [reply, setReply] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setPublicPosts([]);
    setPrivatePosts([]);

    if (isEmployee) {
      return onSnapshot(collection(db, "suggestions"), (snapshot) => {
        setPublicPosts(mapSuggestionSnapshot(snapshot));
        setLoading(false);
      }, (snapshotError) => {
        console.error("Suggestion listener failed:", snapshotError);
        setError("게시글을 불러오지 못했습니다.");
        setLoading(false);
      });
    }

    const unsubscribers = [
      onSnapshot(query(collection(db, "suggestions"), where("isSecret", "==", false)), (snapshot) => {
        setPublicPosts(mapSuggestionSnapshot(snapshot));
        setLoading(false);
      }, (snapshotError) => {
        console.error("Public suggestion listener failed:", snapshotError);
        setError("게시글을 불러오지 못했습니다.");
        setLoading(false);
      }),
    ];

    if (user) {
      unsubscribers.push(onSnapshot(query(collection(db, "suggestions"), where("authorId", "==", user.sub)), (snapshot) => {
        setPrivatePosts(mapSuggestionSnapshot(snapshot).filter((post) => post.isSecret));
      }, (snapshotError) => console.warn("Private suggestion listener failed:", snapshotError)));
    }

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [isEmployee, user]);

  const posts = useMemo(() => {
    const merged = new Map<string, Suggestion>();
    [...publicPosts, ...privatePosts].forEach((post) => merged.set(post.id, post));
    const keyword = search.trim().toLowerCase();
    return sortByCreatedAt([...merged.values()]).filter((post) => !keyword || `${post.title} ${post.content} ${post.authorName}`.toLowerCase().includes(keyword));
  }, [publicPosts, privatePosts, search]);

  const selected = posts.find((post) => post.id === selectedId) || [...publicPosts, ...privatePosts].find((post) => post.id === selectedId);
  const canDeleteSelected = Boolean(selected && user && (isEmployee || selected.authorId === user.sub));

  const deleteSelected = async () => {
    if (!selected || !canDeleteSelected || !window.confirm("이 글을 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "suggestions", selected.id));
      setSelectedId(null);
    } catch (deleteError) {
      console.error("Suggestion delete failed:", deleteError);
      setError("글을 삭제하지 못했습니다.");
    }
  };

  const addReply = async () => {
    if (!selected || !isEmployee || !reply.trim()) return;
    const nextReply: Comment = {
      id: `reply-${Date.now()}`,
      authorName: profile?.nickname || user?.name || "탑정보통신",
      content: reply.trim(),
      createdAt: new Date().toISOString(),
    };
    try {
      await updateDoc(doc(db, "suggestions", selected.id), { replies: [...(selected.replies || []), nextReply] });
      setReply("");
    } catch (replyError) {
      console.error("Suggestion reply failed:", replyError);
      setError("답변을 저장하지 못했습니다.");
    }
  };

  return (
    <section className="public-board" aria-label="건의제안 게시판">
      <header className="public-board__toolbar">
        <div className="public-search">
          <Search aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="제목, 내용, 작성자 검색" aria-label="건의사항 검색" />
        </div>
        <button type="button" className="public-button public-button--primary" onClick={() => setIsComposing(true)}><Plus /> 글쓰기</button>
      </header>

      {error && <p className="public-board__notice is-error" role="alert">{error}</p>}
      {loading ? (
        <div className="public-board__empty"><LoaderCircle className="animate-spin" /><p>게시글을 불러오는 중입니다.</p></div>
      ) : selected ? (
        <article className="public-board-detail">
          <button type="button" className="public-board-detail__back" onClick={() => setSelectedId(null)}><ArrowLeft /> 목록으로</button>
          <header>
            <div className="public-board-detail__labels">{selected.isSecret && <span><LockKeyhole /> 비공개</span>}</div>
            <h2>{selected.title}</h2>
            <p>{selected.authorName} <span /> {formatDate(selected.createdAt)}</p>
          </header>
          <div className="public-board-detail__content">{selected.content}</div>
          {(selected.replies || []).length > 0 && (
            <section className="public-board-replies" aria-label="답변">
              <h3>탑정보통신 답변</h3>
              {selected.replies?.map((item) => <article key={item.id}><strong>{item.authorName}</strong><time>{formatDate(item.createdAt)}</time><p>{item.content}</p></article>)}
            </section>
          )}
          {isEmployee && (
            <div className="public-board-reply-form">
              <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="답변을 입력해주세요." rows={3} />
              <button type="button" className="public-button public-button--primary" onClick={addReply} disabled={!reply.trim()}><Send /> 답변 등록</button>
            </div>
          )}
          {canDeleteSelected && <button type="button" className="public-danger-action" onClick={deleteSelected}><Trash2 /> 글 삭제</button>}
        </article>
      ) : posts.length === 0 ? (
        <div className="public-board__empty"><MessageSquareText /><h2>등록된 글이 없습니다</h2><p>첫 번째 의견을 남겨주세요.</p></div>
      ) : (
        <div className="public-board-list">
          <div className="public-board-list__head"><span>제목</span><span>작성자</span><span>등록일</span></div>
          {posts.map((post) => (
            <button type="button" key={post.id} className="public-board-row" onClick={() => setSelectedId(post.id)}>
              <span className="public-board-row__title">{post.isSecret && <LockKeyhole aria-label="비공개 글" />}{post.title}{(post.replies || []).length > 0 && <b>답변완료</b>}</span>
              <span>{post.authorName}</span>
              <time>{formatDate(post.createdAt)}</time>
            </button>
          ))}
        </div>
      )}
      {isComposing && <SuggestionComposer onClose={() => setIsComposing(false)} />}
    </section>
  );
}

const emptyResourceDraft: ResourceFormDraft = {
  title: "",
  description: "",
  downloadUrl: "",
  fileSize: "",
  fileType: "",
};

function ResourceComposer({ manifest, onClose }: { manifest: StaticDownloadManifestItem[]; onClose: () => void }) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState<ResourceFormDraft>(emptyResourceDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectManifestFile = (path: string) => {
    if (!path) {
      setForm(emptyResourceDraft);
      return;
    }
    setForm((current) => ({ ...buildStaticDownloadDraft(path, "", manifest), description: current.description || "설치 및 사용 안내 자료입니다." }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description?.trim() || !form.downloadUrl) {
      setError("파일, 제목, 설명을 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await addDoc(collection(db, "resources"), buildResourceRecord(form, {
        authorName: profile?.nickname || user?.name || "탑정보통신",
        authorId: user?.sub,
        createdAt: new Date().toISOString(),
      }));
      onClose();
    } catch (submitError) {
      console.error("Resource create failed:", submitError);
      setError("자료를 등록하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-dialog-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="public-dialog" role="dialog" aria-modal="true" aria-labelledby="resource-compose-title">
        <header><div><p className="public-kicker">자료실</p><h2 id="resource-compose-title">자료 등록</h2></div><button type="button" className="public-icon-button" onClick={onClose} aria-label="닫기"><X /></button></header>
        <form className="public-form public-form--dialog" onSubmit={submit}>
          <label><span>GitHub 배포 파일 <b>*</b></span><select value={form.downloadUrl} disabled={manifest.length === 0} onChange={(e) => selectManifestFile(e.target.value)}><option value="">{manifest.length === 0 ? "등록 가능한 배포 파일 없음" : "파일 선택"}</option>{manifest.map((item) => <option key={item.path} value={item.path}>{item.title || item.path}</option>)}</select></label>
          <label><span>제목 <b>*</b></span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label><span>설명 <b>*</b></span><textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></label>
          <div className="public-file-facts"><span>파일 유형 <strong>{form.fileType || "자동 확인"}</strong></span><span>파일 크기 <strong>{form.fileSize || "자동 확인"}</strong></span></div>
          {error && <p className="public-form__error" role="alert">{error}</p>}
          <div className="public-dialog__actions"><button type="button" className="public-button public-button--secondary" onClick={onClose}>취소</button><button type="submit" className="public-button public-button--primary" disabled={submitting || manifest.length === 0}>{submitting ? <LoaderCircle className="animate-spin" /> : <Plus />} {submitting ? "등록 중" : "등록"}</button></div>
        </form>
      </section>
    </div>
  );
}

export function PublicResourceBoard() {
  const { isEmployee } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [manifest, setManifest] = useState<StaticDownloadManifestItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => onSnapshot(collection(db, "resources"), (snapshot) => {
    setResources(sortByCreatedAt(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ResourceItem))));
    setLoading(false);
  }, (snapshotError) => {
    console.error("Resource listener failed:", snapshotError);
    setError("자료 목록을 불러오지 못했습니다.");
    setLoading(false);
  }), []);

  useEffect(() => {
    fetch("/downloads/manifest.json", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((items) => setManifest(Array.isArray(items) ? items : []))
      .catch(() => setManifest([]));
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return resources.filter((item) => !keyword || `${item.title} ${item.description} ${item.fileType || ""}`.toLowerCase().includes(keyword));
  }, [resources, search]);

  const remove = async (item: ResourceItem) => {
    if (!isEmployee || !window.confirm(`'${item.title}' 자료를 목록에서 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, "resources", item.id));
    } catch (deleteError) {
      console.error("Resource delete failed:", deleteError);
      setError("자료를 삭제하지 못했습니다.");
    }
  };

  return (
    <section className="public-board public-resource-board" aria-label="자료실">
      <header className="public-board__toolbar">
        <div className="public-search"><Search aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="매뉴얼, 드라이버, 설치 파일 검색" aria-label="자료 검색" /></div>
        {isEmployee && <button type="button" className="public-button public-button--primary" onClick={() => setIsComposing(true)}><Plus /> 자료 등록</button>}
      </header>
      {error && <p className="public-board__notice is-error" role="alert">{error}</p>}
      {loading ? (
        <div className="public-board__empty"><LoaderCircle className="animate-spin" /><p>자료를 불러오는 중입니다.</p></div>
      ) : filtered.length === 0 ? (
        <div className="public-board__empty"><FileArchive /><h2>등록된 자료가 없습니다</h2><p>필요한 자료는 031-487-4401로 문의해주세요.</p></div>
      ) : (
        <div className="public-resource-list">
          {filtered.map((item) => (
            <article key={item.id} className="public-resource-row">
              <span className="public-resource-row__icon"><FileText aria-hidden="true" /></span>
              <div className="public-resource-row__content"><div><span>{item.fileType || "자료"}</span>{item.fileSize && <span>{item.fileSize}</span>}</div><h2>{item.title}</h2><p>{item.description}</p><time>{formatDate(item.createdAt)}</time></div>
              <div className="public-resource-row__actions">
                {item.downloadUrl && <a className="public-icon-button public-icon-button--accent" href={item.downloadUrl} target="_blank" rel="noreferrer" aria-label={`${item.title} 다운로드`} title="다운로드"><Download /></a>}
                {item.downloadUrl?.startsWith("http") && <a className="public-icon-button" href={item.downloadUrl} target="_blank" rel="noreferrer" aria-label="새 창에서 열기" title="새 창에서 열기"><ExternalLink /></a>}
                {isEmployee && <button type="button" className="public-icon-button public-icon-button--danger" onClick={() => remove(item)} aria-label="자료 삭제" title="자료 삭제"><Trash2 /></button>}
              </div>
            </article>
          ))}
        </div>
      )}
      {isComposing && <ResourceComposer manifest={manifest} onClose={() => setIsComposing(false)} />}
    </section>
  );
}
