"use client";

import Link from "next/link";
import { StoryCover } from "@/components/StoryCover";
import {
  User,
  Mic,
  Heart,
  Bell,
  Lock,
  FileText,
  Sliders,
  Sparkles,
  ChevronRight,
  Trash,
  Pencil,
} from "@/components/Icon";
import { useMyVoices } from "@/lib/useMyVoices";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useBookmarks, toggleBookmark } from "@/lib/bookmarks";
import { useMyStories, removeMyStory, renameMyStory } from "@/lib/myStories";
import { type Story } from "@/data/stories";
import { useCatalog } from "@/lib/useCatalog";

export default function MyPage() {
  const { user, loading: authLoading } = useCurrentUser();
  const { voices, refresh: refreshVoices } = useMyVoices();
  const myStories = useMyStories();
  const catalog = useCatalog();
  const saved = useBookmarks()
    .map((id) => catalog.find((s) => s.id === id))
    .filter((s): s is Story => Boolean(s));

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/");
  };

  const handleDeleteVoice = async (id: string) => {
    await fetch(`/api/voices/${id}`, { method: "DELETE" });
    refreshVoices();
  };

  const handleRenameVoice = async (id: string, current: string) => {
    const name = window.prompt("목소리 이름을 바꿔주세요", current);
    if (!name || !name.trim()) return;
    await fetch(`/api/voices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    refreshVoices();
  };

  const handleRenameStory = (id: string, current: string) => {
    const title = window.prompt("동화 제목을 바꿔주세요", current);
    if (!title || !title.trim()) return;
    renameMyStory(id, title.trim());
  };

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-lg lg:max-w-4xl mx-auto px-5 h-14 flex items-center">
          <h1 className="font-bold tracking-tight">내 서재</h1>
        </div>
      </header>

      <div className="max-w-lg lg:max-w-4xl mx-auto px-5 py-6">
        {user ? (
          <div className="card p-5 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-light text-primary rounded-2xl flex items-center justify-center">
                <User size={26} filled />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate">{user.email}</p>
                <p className="text-xs text-muted mt-0.5">
                  {user.childName
                    ? `${user.childName} · ${user.childAge ?? "?"}세`
                    : "아이 정보가 아직 없어요"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-4 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-surface transition"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="card p-5 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-light text-primary rounded-2xl flex items-center justify-center">
                <User size={26} filled />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base">
                  {authLoading ? "불러오는 중..." : "로그인해 주세요"}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  로그인하면 목소리를 등록할 수 있어요
                </p>
              </div>
            </div>
            {!authLoading && (
              <Link
                href="/login"
                className="block text-center w-full mt-4 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition shadow-sm shadow-primary/20"
              >
                로그인 / 회원가입
              </Link>
            )}
          </div>
        )}

        <div className="card p-5 mb-5">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Mic size={16} className="text-primary" />
            내 목소리
            {voices.length > 0 && (
              <span className="text-xs text-muted font-semibold">
                {voices.length}
              </span>
            )}
          </h2>

          {voices.length > 0 ? (
            <div className="space-y-2">
              {voices.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 p-3 bg-surface-soft border border-border rounded-xl"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-lg">
                    {v.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{v.name}</p>
                    <p className="text-xs text-muted truncate">
                      내가 녹음한 목소리
                    </p>
                  </div>
                  <button
                    onClick={() => handleRenameVoice(v.id, v.name)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-primary-light transition"
                    aria-label="이름 변경"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteVoice(v.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition"
                    aria-label="목소리 삭제"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-surface-soft border border-border rounded-xl">
              <div className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center text-muted">
                <Mic size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground/80">
                  아직 목소리가 없어요
                </p>
                <p className="text-xs text-muted mt-0.5">
                  목소리를 녹음해 보세요
                </p>
              </div>
            </div>
          )}

          <Link
            href="/record"
            className="block text-center w-full mt-3 py-2.5 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary-light transition"
          >
            목소리 녹음하러 가기
          </Link>
        </div>

        <div className="card p-5 mb-5">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Heart size={16} className="text-primary" />
            저장한 동화
            {saved.length > 0 && (
              <span className="text-xs text-muted font-semibold">
                {saved.length}
              </span>
            )}
          </h2>

          {saved.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {saved.map((story) => (
                <div key={story.id} className="relative">
                  <Link
                    href={`/stories/${story.id}`}
                    className="block card card-interactive overflow-hidden group"
                  >
                    <div className="aspect-square bg-surface-soft overflow-hidden">
                      <StoryCover
                        story={story}
                        className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                        {story.title}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
                        {story.ageMin}~{story.ageMax}세
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => toggleBookmark(story.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground/65 backdrop-blur-sm text-white flex items-center justify-center hover:bg-danger transition"
                    aria-label="저장 해제"
                  >
                    <Heart size={15} filled />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-soft border border-border flex items-center justify-center text-muted">
                <Heart size={20} />
              </div>
              <p className="text-sm text-foreground/75 font-medium">
                아직 저장한 동화가 없어요
              </p>
              <p className="text-xs text-muted mt-1">
                마음에 드는 동화에 하트를 눌러보세요
              </p>
            </div>
          )}
        </div>

        <div className="card p-5 mb-5">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-secondary" />
            내가 만든 동화
            {myStories.length > 0 && (
              <span className="text-xs text-muted font-semibold">
                {myStories.length}
              </span>
            )}
          </h2>

          {myStories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {myStories.map((story) => (
                <div key={story.id} className="relative">
                  <Link
                    href={`/voices?storyId=${story.id}`}
                    className="block card card-interactive overflow-hidden group"
                  >
                    <div className="aspect-square bg-surface-soft overflow-hidden">
                      <StoryCover
                        story={story}
                        className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                        {story.title}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
                        {story.ageMin}~{story.ageMax}세
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRenameStory(story.id, story.title)}
                    className="absolute top-2 left-2 w-8 h-8 rounded-full bg-foreground/65 backdrop-blur-sm text-white flex items-center justify-center hover:bg-primary transition"
                    aria-label="제목 변경"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => removeMyStory(story.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground/65 backdrop-blur-sm text-white flex items-center justify-center hover:bg-danger transition"
                    aria-label="동화 삭제"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-soft border border-border flex items-center justify-center text-muted">
                <Sparkles size={20} />
              </div>
              <p className="text-sm text-foreground/75 font-medium">
                아직 만든 동화가 없어요
              </p>
              <p className="text-xs text-muted mt-1">
                AI로 우리 아이만의 동화를 만들어보세요
              </p>
            </div>
          )}

          <Link
            href="/create"
            className="block text-center w-full mt-3 py-2.5 rounded-xl border border-secondary text-secondary text-sm font-semibold hover:bg-secondary-light transition"
          >
            새 동화 만들기
          </Link>
        </div>

        <div className="card overflow-hidden">
          <h2 className="font-bold text-sm px-5 pt-4 pb-3 flex items-center gap-2">
            <Sliders size={16} className="text-muted" />
            설정
          </h2>
          {[
            { Icon: User, label: "우리 아이 정보" },
            { Icon: Bell, label: "알림 설정" },
            { Icon: Lock, label: "개인정보 처리방침" },
            { Icon: FileText, label: "서비스 이용약관" },
          ].map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-soft transition text-left border-t border-border"
            >
              <item.Icon size={18} className="text-muted" />
              <span className="text-sm">{item.label}</span>
              <ChevronRight size={16} className="ml-auto text-muted/60" />
            </button>
          ))}
        </div>
      </div>

    </>
  );
}
