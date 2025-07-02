🟩 Claude Code Agent - Step 1: KkachiNote 프로젝트 초기화

목표
PR 리뷰 자동화를 위한 TypeScript 기반 백엔드 서버 템플릿 생성

요구사항
	1.	언어 및 실행 환경

	•	Node.js + TypeScript
	•	패키지 매니저: pnpm
	•	번들러: esbuild

	2.	주요 라이브러리 및 프레임워크

	•	Fastify (서버)
	•	dotenv (환경변수)
	•	pino (로깅)
	•	zod (입력 유효성 검증)
	•	octokit/rest (GitHub API 호출용)

	3.	품질 도구

	•	biome (포맷터 + 린터)
	•	husky + lint-staged (pre-commit hook)
	•	커밋 시 biome check . --apply 및 pnpm build 실행

	4.	디렉토리 구조

kkachinote/
├── src/
│   ├── index.ts              // Fastify 진입점
│   ├── config.ts             // .env 로딩
│   ├── handlers/             // GitHub Webhook 처리
│   ├── plugins/              // 리뷰/요약/본문 제안 등 기능별 모듈
│   ├── llm/                  // LLM 연동 모듈 (Gemma, OpenAI)
│   └── utils/                // 로깅, 공통 함수
├── .env.template             // PORT, SLACK_WEBHOOK_URL 등 포함
├── .biome.json
├── .husky/
├── lint-staged.config.js
├── tsconfig.json
├── package.json
└── README.md

	5.	실행 명령어

	•	개발: pnpm dev → tsx watch src/index.ts
	•	빌드: pnpm build → esbuild로 dist/ 생성
	•	실행: pnpm start → node dist/index.js

	6.	Fastify에 /webhook 엔드포인트 더미 하나 포함 (200 OK 응답만)
	7.	.env.template 항목

	•	PORT
	•	GITHUB_TOKEN
	•	SLACK_WEBHOOK_URL
	•	LLM_BACKEND (예: gemma, openai 등)

⸻

