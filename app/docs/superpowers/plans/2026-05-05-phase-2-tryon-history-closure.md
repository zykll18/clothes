# Phase 2 Try-On History Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the real user flow from authenticated try-on generation to manual history save and immediate profile visibility without redesigning storage or profile UI.

**Architecture:** Keep the existing AI generation flow intact, add an explicit auth bootstrap before `/tryon` renders, and split "generation state" from "history save state" so save failures do not force the user to regenerate. Persist history through the existing `/api/tryon-history` route, but make the payload semantics explicit: `clothType` stays aligned with the try-on request, while `tryOnMode` reflects save behavior (`replace` for this phase because `keepClothImageUrl` stays `null`).

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Prisma 6, SQLite, DashScope, ESLint 9

---

## File Structure Map

- `app/src/app/tryon/page.tsx`
  Responsibility: authenticated page bootstrap, AI try-on state, manual history-save orchestration, and result-state resets.
- `app/src/components/tryon/ResultView.tsx`
  Responsibility: render generation progress, generation failure, result preview, save CTA, save feedback, and profile navigation CTA.
- `app/src/app/api/tryon-history/route.ts`
  Responsibility: authenticated history create/list route with explicit payload parsing and typed token handling.
- `app/src/app/profile/page.tsx`
  Responsibility: existing history consumer and manual verification target that should surface the newest saved record without page redesign.

### Task 1: Gate `/tryon` Behind Auth And Separate Save State

**Files:**
- Modify: `app/src/app/tryon/page.tsx`

- [ ] **Step 1: Confirm the current page has no auth guard and no history-save state**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
rg -n "useRouter|/api/auth/me|historySaved|isSavingHistory|historySaveError" src/app/tryon/page.tsx
```

Expected: no matches, which confirms `/tryon` currently renders without an auth bootstrap and has no dedicated save state.

- [ ] **Step 2: Add auth bootstrap state, login redirect, and independent history-save state**

Implement these focused additions:

```tsx
// app/src/app/tryon/page.tsx
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

type TryOnUiMode = 'upper_body' | 'full_body';
type PersistedClothType = 'upper' | 'lower';
type PersistedTryOnMode = 'replace';

interface AppState {
  currentStep: AppStep;
  personImage: string | null;
  clothingImage: string | null;
  generatedImage: string | null;
  isGenerating: boolean;
  error: string | null;
  mode: TryOnUiMode;
}

const router = useRouter();
const [authLoading, setAuthLoading] = useState(true);
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [isSavingHistory, setIsSavingHistory] = useState(false);
const [historySaved, setHistorySaved] = useState(false);
const [historySaveError, setHistorySaveError] = useState<string | null>(null);

useEffect(() => {
  const verifyAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.replace('/auth/login');
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('获取登录状态失败:', error);
      router.replace('/auth/login');
    } finally {
      setAuthLoading(false);
    }
  };

  verifyAuth();
}, [router]);
```

Add the auth-aware render guard before the main return:

```tsx
if (authLoading) {
  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-slate-600">正在检查登录状态...</p>
      </div>
    </div>
  );
}

if (!isAuthenticated) {
  return null;
}
```

Whenever a new generation starts or the flow is reset, clear only save-specific state instead of clearing the generated result:

```tsx
setHistorySaved(false);
setHistorySaveError(null);
setIsSavingHistory(false);
```

- [ ] **Step 3: Keep retry/reset behavior aligned with the new state model**

Update the existing flow helpers so save state never leaks across attempts:

```tsx
const nextStep = () => {
  const next = (state.currentStep + 1) as AppStep;

  setState(prev => ({
    ...prev,
    currentStep: next,
    error: next === 4 ? null : prev.error,
  }));

  if (next === 4) {
    setHistorySaved(false);
    setHistorySaveError(null);
    setIsSavingHistory(false);
    generateResult(state.personImage, state.clothingImage, state.mode);
  }
};

const resetAll = () => {
  setState({
    currentStep: 1,
    personImage: null,
    clothingImage: null,
    generatedImage: null,
    isGenerating: false,
    error: null,
    mode: 'upper_body',
  });
  setClothingSource('upload');
  setProgress(0);
  setHistorySaved(false);
  setHistorySaveError(null);
  setIsSavingHistory(false);
};
```

- [ ] **Step 4: Verify the page compiles cleanly before touching the result component**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
npm run lint -- src/app/tryon/page.tsx
```

Expected: exit `0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/zyk/Desktop/clothes
git add app/src/app/tryon/page.tsx
git commit -m "feat: gate tryon flow behind auth"
```

### Task 2: Extend `ResultView` For Save Action Feedback

**Files:**
- Modify: `app/src/components/tryon/ResultView.tsx`

- [ ] **Step 1: Confirm the result component only supports retry and download**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
rg -n "onSaveHistory|historySaved|historySaveError|/profile" src/components/tryon/ResultView.tsx
```

Expected: no matches.

- [ ] **Step 2: Expand the component props to support save state and profile navigation**

Replace the props contract with explicit save controls:

```tsx
// app/src/components/tryon/ResultView.tsx
import Link from 'next/link';
import React from 'react';
import { AlertCircle, CheckCircle2, Download, RefreshCw, Save } from 'lucide-react';

interface ResultViewProps {
  isGenerating: boolean;
  resultImage: string | null;
  error: string | null;
  onRetry: () => void;
  onSaveHistory: () => void;
  isSavingHistory: boolean;
  historySaved: boolean;
  historySaveError: string | null;
  progress?: number;
}
```

- [ ] **Step 3: Add save, saved, and retry-save UI states without changing the generation UI**

Implement the result action area like this:

```tsx
{historySaveError && (
  <div className="mt-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
    <AlertCircle size={16} />
    <span>{historySaveError}</span>
  </div>
)}

<div className="mt-8 flex flex-wrap justify-center gap-4">
  <button
    onClick={onRetry}
    className="px-6 py-3 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
  >
    <RefreshCw size={20} />
    重新试穿
  </button>

  <button
    onClick={onSaveHistory}
    disabled={!resultImage || isSavingHistory || historySaved}
    className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
      historySaved
        ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
    }`}
  >
    {historySaved ? <CheckCircle2 size={20} /> : <Save size={20} />}
    {isSavingHistory ? '保存中...' : historySaved ? '已保存到历史' : '保存到历史'}
  </button>

  <a
    href={resultImage || '#'}
    download="try-on-result.png"
    className="px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium flex items-center gap-2"
  >
    <Download size={20} />
    下载图片
  </a>

  {historySaved && (
    <Link
      href="/profile"
      className="px-8 py-3 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
    >
      去个人中心查看
    </Link>
  )}
</div>
```

Preserve the existing progress and generation-error layouts unchanged.

- [ ] **Step 4: Verify the component file still lints**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
npm run lint -- src/components/tryon/ResultView.tsx
```

Expected: exit `0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/zyk/Desktop/clothes
git add app/src/components/tryon/ResultView.tsx
git commit -m "feat: add history save actions to result view"
```

### Task 3: Wire Manual Save Into The Page And Tighten The History Route

**Files:**
- Modify: `app/src/app/tryon/page.tsx`
- Modify: `app/src/app/api/tryon-history/route.ts`

- [ ] **Step 1: Capture the two current gaps**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
rg -n "fetch\\('/api/tryon-history'|verifyToken\\(token\\) as" src/app/tryon/page.tsx src/app/api/tryon-history/route.ts
```

Expected:
- no match in `src/app/tryon/page.tsx` for a history-save request
- one or more matches in `src/app/api/tryon-history/route.ts` for the `as JWTPayload | null` cast

- [ ] **Step 2: Add an explicit history payload parser to the API route**

Replace the ad hoc request handling with a typed parser that matches the real persisted shape:

```ts
// app/src/app/api/tryon-history/route.ts
import { verifyToken, type JWTPayload } from '@/lib/jwt';

type TryOnHistoryPayload = {
  personImageUrl: string;
  clothImageUrl: string;
  keepClothImageUrl?: string | null;
  resultImageUrl: string;
  clothType: 'upper' | 'lower' | 'full';
  tryOnMode: 'replace' | 'overlay';
};

function isTryOnHistoryPayload(value: unknown): value is TryOnHistoryPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const keepClothImageUrl = candidate.keepClothImageUrl;

  return (
    typeof candidate.personImageUrl === 'string' &&
    typeof candidate.clothImageUrl === 'string' &&
    (keepClothImageUrl === undefined || keepClothImageUrl === null || typeof keepClothImageUrl === 'string') &&
    typeof candidate.resultImageUrl === 'string' &&
    (candidate.clothType === 'upper' || candidate.clothType === 'lower' || candidate.clothType === 'full') &&
    (candidate.tryOnMode === 'replace' || candidate.tryOnMode === 'overlay')
  );
}
```

Use it in `POST`:

```ts
const payload = verifyToken(token);
if (!payload) {
  return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 });
}

const rawBody: unknown = await request.json();
if (!isTryOnHistoryPayload(rawBody)) {
  return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
}

const {
  personImageUrl,
  clothImageUrl,
  keepClothImageUrl,
  resultImageUrl,
  clothType,
  tryOnMode,
} = rawBody;
```

Mirror the same `verifyToken` call shape in `GET` so the file no longer depends on local JWT interface duplication.

- [ ] **Step 3: Implement `handleSaveHistory` in the try-on page and pass it into `ResultView`**

Add an explicit save helper that preserves the generated result on failure:

```tsx
// app/src/app/tryon/page.tsx
const getHistoryClothType = (mode: TryOnUiMode): PersistedClothType => {
  return mode === 'upper_body' ? 'upper' : 'lower';
};

const handleSaveHistory = async () => {
  if (!state.personImage || !state.clothingImage || !state.generatedImage || isSavingHistory || historySaved) {
    return;
  }

  setIsSavingHistory(true);
  setHistorySaveError(null);

  try {
    const response = await fetch('/api/tryon-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personImageUrl: state.personImage,
        clothImageUrl: state.clothingImage,
        keepClothImageUrl: null,
        resultImageUrl: state.generatedImage,
        clothType: getHistoryClothType(state.mode),
        tryOnMode: 'replace' as PersistedTryOnMode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '保存试衣历史失败');
    }

    setHistorySaved(true);
  } catch (error: unknown) {
    setHistorySaveError(error instanceof Error ? error.message : '保存试衣历史失败');
  } finally {
    setIsSavingHistory(false);
  }
};
```

Pass the save state through to the component:

```tsx
<ResultView
  isGenerating={state.isGenerating}
  resultImage={state.generatedImage}
  error={state.error}
  onRetry={resetAll}
  onSaveHistory={handleSaveHistory}
  isSavingHistory={isSavingHistory}
  historySaved={historySaved}
  historySaveError={historySaveError}
  progress={progress}
/>
```

- [ ] **Step 4: Verify the changed files lint together**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
npm run lint -- src/app/tryon/page.tsx src/components/tryon/ResultView.tsx src/app/api/tryon-history/route.ts
```

Expected: exit `0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/zyk/Desktop/clothes
git add app/src/app/tryon/page.tsx app/src/app/api/tryon-history/route.ts
git commit -m "feat: add manual tryon history save flow"
```

### Task 4: Verify End-To-End Closure And Profile Visibility

**Files:**
- Test: `app/src/app/tryon/page.tsx`
- Test: `app/src/components/tryon/ResultView.tsx`
- Test: `app/src/app/api/tryon-history/route.ts`
- Verify target: `app/src/app/profile/page.tsx`

- [ ] **Step 1: Run repository lint to confirm the phase keeps the zero-error baseline**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
npm run lint
```

Expected: exit `0`. Existing `@next/next/no-img-element` warnings are acceptable as long as there are no errors.

- [ ] **Step 2: Start the app locally for manual closure verification**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
npm run dev
```

Expected: local server starts on `http://localhost:3000`.

- [ ] **Step 3: Verify the unauthenticated redirect and authenticated save flow manually**

Manual checklist:

```text
1. Open http://localhost:3000/tryon in a logged-out browser session.
2. Confirm the page shows the auth-loading state briefly and then redirects to /auth/login.
3. Log in with a valid local account.
4. Complete the try-on flow until a result image appears.
5. Click “保存到历史”.
6. Confirm the button enters a saving state, then flips to “已保存到历史”.
7. Confirm “去个人中心查看” appears.
8. Click through to /profile and confirm the newest history card is the result that was just saved.
```

Expected: the user never needs to rerun AI generation after a save failure, and a successful save appears at the top of the profile history list.

- [ ] **Step 4: Verify save-failure retry behavior without regenerating**

Manual checklist:

```text
1. Keep a generated result visible on /tryon.
2. Simulate a failing save request (for example, remove the auth cookie in devtools or temporarily block the request).
3. Click “保存到历史” and confirm an error message appears while the result image remains visible.
4. Restore a valid session.
5. Click “保存到历史” again and confirm the second attempt succeeds without re-running the AI generation step.
```

Expected: `resultImage` remains on screen across save failures, and retry succeeds from the same result state.
