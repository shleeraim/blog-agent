import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

// ── 타입 ──────────────────────────────────────────

export interface NoteContent {
  date: string;  // YYYY-MM-DD
  drafts: {
    title: string;
    metaDesc: string;
    tags: string[];
    content: string;
    seoScore: number;
    searchVolume: number;
    createdAt: string;  // HH:MM
  }[];
}

export interface SaveResult {
  success: boolean;
  method: 'applescript' | 'clipboard' | 'failed';
  message: string;
  noteTitle: string;
}

// ── 포맷 헬퍼 ─────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatNoteBodyHtml(draft: NoteContent['drafts'][0]): string {
  const sep = '─────────────────────────';
  const lines = [
    sep,
    `📝 ${draft.title}`,
    `🕐 작성시각: ${draft.createdAt}`,
    `📊 SEO ${draft.seoScore}점 | 검색량 ${draft.searchVolume}`,
    '',
    '📌 메타 설명',
    draft.metaDesc,
    '',
    `🏷️ 태그: ${draft.tags.join(', ')}`,
    '',
    '📄 본문',
    draft.content,
    sep,
  ];

  return lines.map(escapeHtml).join('<br>');
}

// ── AppleScript 실행 래퍼 ─────────────────────────

function runScript(scriptPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`/usr/bin/osascript "${scriptPath}"`, { timeout: 15000 }, (err, _stdout, stderr) => {
      if (err) {
        reject(new Error(stderr?.trim() || err.message));
      } else {
        resolve(_stdout?.trim() ?? '');
      }
    });
  });
}

// ── 메인 함수 ─────────────────────────────────────

export async function saveToAppleNotes(noteContent: NoteContent): Promise<SaveResult> {
  const noteTitle = `블로그 초안 ${noteContent.date}`;

  if (process.platform !== 'darwin') {
    return {
      success: false,
      method: 'clipboard',
      message: 'macOS가 아닌 환경입니다.',
      noteTitle,
    };
  }

  const noteBodyHtml = noteContent.drafts.map(formatNoteBodyHtml).join('<br><br>');

  const ts = Date.now();
  const contentPath = join(tmpdir(), `blog-note-body-${ts}.html`);
  const scriptPath  = join(tmpdir(), `blog-note-script-${ts}.applescript`);

  // AppleScript: 제목만 인라인, 본문은 파일에서 읽음 — 이스케이프 문제 완전 회피
  const escapedTitle = noteTitle.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const escapedContentPath = contentPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const script = `
set noteTitle to "${escapedTitle}"
set contentFile to POSIX file "${escapedContentPath}"
set noteBody to (read contentFile as «class utf8»)

tell application "Notes"
  tell default account
    try
      set existingNote to first note whose name is noteTitle
      set body of existingNote to (body of existingNote) & "<br><br>" & noteBody
    on error
      make new note with properties {name:noteTitle, body:noteBody}
    end try
  end tell
end tell
`;

  try {
    await writeFile(contentPath, noteBodyHtml, 'utf8');
    await writeFile(scriptPath, script, 'utf8');
    await runScript(scriptPath);

    return {
      success: true,
      method: 'applescript',
      message: 'Apple Notes에 저장되었습니다.',
      noteTitle,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      method: 'clipboard',
      message: `AppleScript 실행 실패: ${message}`,
      noteTitle,
    };
  } finally {
    // 임시 파일 정리 (오류 무시)
    await unlink(contentPath).catch(() => {});
    await unlink(scriptPath).catch(() => {});
  }
}
