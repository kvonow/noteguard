# Figma prototype audit (read-only, 2026-11-17)

Reference: [NoteGuard prototype](https://www.figma.com/proto/q3KQN40rAgCS9JtFLHAiNO/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=2-490&viewport=-303%2C-11%2C0.24&t=BkUZKu1ciQvRlJPw-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1). The Figma file was not edited.

## Clicks followed

- The shared link opens the PDF upload screen.
- `파일 선택` goes to a prepared-file state: `math.pdf`, 30 questions, named `2026년 9월 평가원 모의고사`.
- `업로드` returns to the bookshelf with that exam at the top, marked `풀이 중` and a `풀이 시작` button. Before upload, the 2026 September exam is absent. `2025년 6월 평가원 모의고사` is also shown as in progress with `이어서 풀기`.
- `풀이 시작` opens the fixed exam page. The first page contains question 1 from the provided mock exam; clicking the paper reveals the prepared handwritten answer.

## Screens inspected in the prototype

The prototype contains 20 screens. In addition to the upload and bookshelf screens, the screens include question 1 and 2 with prepared handwriting, grading/result views, the wrong-answer notebook, question 5 retry and mistake explanation, similar question 17 (blank, written, and checked states), a second similar problem, and the AI weakness summary. The mock screens use fixed prepared content; uploading a file is represented as a presentation flow.

## Web demo mapping

- Keep the 834 × 1194 portrait tablet frame and the existing NoteGuard green styling.
- Start with the 2026 September exam hidden. Show it in the bookshelf and wrong-answer notebook only after the scripted upload is completed.
- PDF selection stays a scripted sample and always previews the prepared mock exam.
- Handwriting, grading, wrong-answer analysis, and similar problems use the supplied static sample images. The web canvas is only for the presentation mockup; there is no backend.
- Figma remains unchanged.
