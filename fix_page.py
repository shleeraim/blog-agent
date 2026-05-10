import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Remove INITIAL_PIPELINE_STEPS image steps
content = re.sub(
    r"\{ id: 'imagePrompts', label: '🎨 이미지 프롬프트 생성', status: 'waiting' \},\n\s*\{ id: 'images',       label: '🖼️ 이미지 생성',        status: 'waiting' \},",
    "",
    content
)

# 2. WELCOME_AUTO text update
content = content.replace(
    "'안녕하세요! 재테크 블로그 에이전트입니다.\\n🚀 자동 완성 모드가 켜져 있습니다. 주제를 입력하면 탐색 → SEO 평가 → 초안 → 이미지까지 자동으로 완성합니다.'",
    "'안녕하세요! 재테크 블로그 에이전트입니다.\\n🚀 자동 완성 모드가 켜져 있습니다. 주제를 입력하면 탐색 → SEO 평가 → 초안까지 자동으로 완성합니다.'"
)

# 3. Remove imageError state
content = re.sub(r"const \[imageError, setImageError\] = useState<string \| null>\(null\);\n", "", content)

# 4. Remove image state from useAgentStore
content = re.sub(r"\s*generatedImages,\n\s*imagePrompts,\n\s*isGeneratingImages,\n", "\n", content)

# 5. Remove store.setImagePrompts and setGeneratedImages from runAutoPipeline
content = re.sub(r"\s*store\.setImagePrompts\(\[\]\);\n\s*store\.setGeneratedImages\(\[\]\);\n", "\n", content)

# 6. Remove Step 5 and Step 6 from runAutoPipeline
step56_pattern = re.compile(
    r"// ── Step 5: 이미지 프롬프트 생성 ──────────────(.*?)toast\.success\('초안과 이미지가 완성되었습니다! 🎉', \{ duration: 4000 \}\);",
    re.DOTALL
)
content = step56_pattern.sub(
    "// 완료\\n      useAgentStore.getState().setStep(4);\\n      toast.success('초안이 완성되었습니다! 🎉', { duration: 4000 });",
    content
)

# 7. Remove image handlers: handleRegenerateImage and handleGenerateImages
handlers_pattern = re.compile(
    r"// ── 이미지 재생성 / 수동 이미지 생성\n\s*// ──────────────────────────────────────────────\n\s*const handleRegenerateImage = .*?\}\s*\}, \[\]\);\n",
    re.DOTALL
)
content = handlers_pattern.sub("", content)

# 8. DualDraftBox handlers remove onSaveToNotes
content = re.sub(r"const handleSaveToNotes = useCallback\(\(_i: number\) => \{\}, \[\]\);\n", "", content)

# 9. handleReset remove setImageError
content = re.sub(r"\s*setImageError\(null\);\n", "\n", content)

# 10. Update the return JSX
jsx_pattern = re.compile(
    r"\{drafts\.length >= 1 \? \(\n\s*imagePrompts\.length > 0 \|\| isGeneratingImages \? \(\n\s*// 자동 파이프라인 결과: 이미지 포함 DraftBox\n\s*<div style=\{\{ flex: 1, overflowY: 'auto', padding: '16px 20px' \}\}>\n\s*<DraftBox.*?\/>\n\s*<\/div>\n\s*\) : \(\n\s*// 수동 모드 또는 이미지 없는 결과: 기존 DualDraftBox\n\s*<DualDraftBox.*?\/>\n\s*\)\n\s*\) : \(",
    re.DOTALL
)

new_jsx = """{drafts.length >= 1 ? (
          autoMode ? (
            // 자동 파이프라인 결과: 단일 초안 DraftBox
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <DraftBox
                draft={drafts[0]}
                onCopy={() => {}}
                onRevise={() => handleRewrite(0)}
                onReset={handleReset}
              />
            </div>
          ) : (
            // 수동 모드 결과: 2개 초안 DualDraftBox
            <DualDraftBox
              drafts={drafts}
              selectedTopics={selectedTopics}
              streamingText={drafts.length < 2 ? streamingText : undefined}
              onCopyAll={handleCopyAll}
              onCopyOne={handleCopyOne}
              onRewrite={handleRewrite}
              onReset={handleReset}
            />
          )
        ) : ("""

content = jsx_pattern.sub(new_jsx, content)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Done rewriting page.tsx")
