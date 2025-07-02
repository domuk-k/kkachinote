# KKachiNote

A TypeScript-based backend server template for PR review automation.

## Features

- **Fastify Server**: High-performance web framework
- **TypeScript**: Full type safety and modern JavaScript features
- **GitHub Integration**: Webhook handling for PR events
- **LLM Support**: Pluggable LLM providers (Gemma, OpenAI)
- **Code Quality**: Biome for linting and formatting
- **Pre-commit Hooks**: Automated code quality checks

## Directory Structure

```
kkachinote/
├── src/
│   ├── index.ts              # Fastify entry point
│   ├── config.ts             # Environment configuration
│   ├── handlers/             # GitHub webhook handlers
│   │   └── webhook.ts
│   ├── plugins/              # Feature modules
│   │   ├── review.ts         # PR review functionality
│   │   ├── summary.ts        # PR summary generation
│   │   └── index.ts
│   ├── llm/                  # LLM integration modules
│   │   ├── base.ts           # Base LLM interface
│   │   ├── gemma.ts          # Gemma provider
│   │   ├── openai.ts         # OpenAI provider
│   │   ├── factory.ts        # Provider factory
│   │   └── index.ts
│   └── utils/                # Utilities
│       └── logger.ts         # Pino logger setup
├── .env.template             # Environment variables template
├── .biome.json               # Biome configuration
├── .husky/                   # Git hooks
├── lint-staged.config.js     # Lint-staged configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Package configuration
└── README.md
```

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Setup environment variables**:
   ```bash
   cp .env.template .env
   ```
   Edit `.env` with your configuration values.

3. **Initialize git hooks**:
   ```bash
   pnpm prepare
   ```

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `GITHUB_TOKEN`: GitHub API token
- `SLACK_WEBHOOK_URL`: Slack webhook URL for notifications
- `LLM_BACKEND`: LLM provider (gemma, openai)
- `LOG_LEVEL`: Logging level (default: info)

## API Endpoints

- `POST /webhook`: GitHub webhook endpoint
- `GET /health`: Health check endpoint

## License

ISC