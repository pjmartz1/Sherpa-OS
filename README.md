<div align="center">
  <img src="Sherpa.svg" alt="Sherpa OS" width="200"/>
</div>

# 🏔️ Sherpa OS

> **Local-first CLI for solo AI coders**  
> Turn precise specs into tickets, prompts, tests, briefs, and retros — all stored in your repo for structured, testable, and traceable AI-generated code.

[![CI](https://github.com/sherpa-os/sherpa-os/actions/workflows/ci.yml/badge.svg)](https://github.com/sherpa-os/sherpa-os/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/sherpa-os.svg)](https://badge.fury.io/js/sherpa-os)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ What is Sherpa OS?

Sherpa OS is a workflow CLI designed for **solo developers and small teams** who use AI coding assistants (Claude, Cursor, Cline, Gemini). It enforces structure and traceability to prevent AI code from drifting into chaos.

### 🎯 Core Problems It Solves

- **AI code drifts without guardrails** → Enforced spec → ticket → test flow
- **AI loses context between sessions** → Intelligent context memory and session continuity  
- **AI generates predictable anti-patterns** → Built-in quality gates and pattern detection
- **Specs are vague, decisions not captured** → Structured documentation with decision tracking
- **Tests skipped, regressions common** → Coverage requirements and automated test generation
- **No daily cadence or continuity** → Built-in briefs, retros, and velocity tracking

## 🚀 Quick Start

### Installation

```bash
npm install -g sherpa-os
```

### Global Setup (One-time)

```bash
# Set up your development standards and preferences globally
sherpa setup
```

Choose from preset configurations or customize your own:
- **Full-Stack TypeScript** (Next.js + Supabase + Vercel)
- **React Frontend** (TypeScript + Tailwind)
- **Node.js Backend** (Express + TypeScript)  
- **Python API** (FastAPI + PostgreSQL)
- **Custom** (Define your own)

### Initialize a Project

```bash
# Initialize Sherpa OS in your project
sherpa init

# Optional: Set up coding standards for this project
sherpa add:standard
```

### Core Workflow

```bash
# 1. Create a feature specification
sherpa add:spec

# 2. Generate tickets from specs
sherpa gen:backlog  

# 3. Generate AI-ready prompts with context
sherpa gen:prompt

# 4. Implement with your AI assistant using the generated prompt

# 5. Track progress and run retrospectives
sherpa brief       # Daily progress brief
sherpa retro       # Weekly retrospective  
sherpa velocity    # Track throughput and quality
```

## 📁 Project Structure

After initialization, Sherpa OS creates this structure:

```
your-project/
├── .sherpa/
│   ├── standards/           # Coding & testing standards
│   ├── product/            # Mission, roadmap, architecture
│   ├── specs/              # Feature specifications  
│   ├── backlog/            # Generated epics, stories, tickets
│   ├── context/            # AI context & codebase patterns
│   ├── prompts/            # AI prompt templates & versions
│   ├── sessions/           # Session continuity tracking
│   └── state.json         # Project state
├── docs/
│   ├── briefs/            # Daily progress briefs
│   ├── retros/            # Weekly retrospectives
│   └── reports/           # Velocity and quality reports  
└── ... your code
```

## 🛠️ Commands Reference

### Project Management
- `sherpa init` - Initialize Sherpa OS in current project
- `sherpa setup` - Global setup (one-time configuration)
- `sherpa add:spec` - Create a new feature specification
- `sherpa add:standard` - Add coding/testing standards

### Workflow Generation  
- `sherpa gen:backlog` - Generate epics, stories, and tickets from specs
- `sherpa gen:prompt` - Create AI-ready prompts with intelligent context
- `sherpa review:spec` - Interactive spec review with clarifying questions

### Progress Tracking
- `sherpa brief` - Generate daily progress brief
- `sherpa retro` - Conduct weekly retrospective
- `sherpa velocity` - Track throughput and quality metrics
- `sherpa test` - Run tests with coverage requirements

### AI Enhancement Features
- `sherpa context:build` - Extract and compress codebase patterns
- `sherpa context:sync` - Update context with recent learnings
- `sherpa lint:ai` - Detect AI coding anti-patterns
- `sherpa session:log` - Track what worked/failed in current session
- `sherpa handoff:prep` - Prepare context for next AI session

## 🎨 Example Workflows

### Creating a New Feature

```bash
# 1. Add a specification
sherpa add:spec
# Follow prompts to define your feature

# 2. Generate implementation tickets  
sherpa gen:backlog

# 3. Create AI prompt for specific ticket
sherpa gen:prompt --ticket FEAT-001

# 4. Copy prompt to your AI assistant and implement
# The prompt includes:
# - Full context and constraints
# - Coding standards and tech stack  
# - Acceptance criteria and test plan
# - Relevant code patterns
```

### Daily Development Routine

```bash
# Morning: Check what needs to be done
sherpa brief

# Work with AI assistant using generated prompts
sherpa gen:prompt --ticket TICKET-123

# Evening: Log progress and plan tomorrow
sherpa session:log
sherpa brief
```

### Weekly Review

```bash  
# Generate retrospective
sherpa retro

# Check velocity and quality trends
sherpa velocity

# Update context with new learnings
sherpa context:sync
```

## 🧠 AI Integration

Sherpa OS is designed to work seamlessly with popular AI coding assistants:

- **Claude Code** - Use generated prompts directly
- **Cursor** - Copy prompts into chat or use as project context
- **Cline** - Feed prompts as task descriptions  
- **GitHub Copilot** - Use context files for better completions

### Generated Prompt Structure

```markdown
# Feature Implementation Task

## Context  
[Project summary and tech stack]

## Development Standards
[Your coding standards and patterns]

## Task Requirements
**Feature**: Add user authentication
**Outcome**: Users can securely log in and out

**Acceptance Criteria**:
- [ ] Login form validates credentials
- [ ] Session management works correctly  
- [ ] Logout clears session

## Test Requirements
- **Unit**: Test login validation, session management
- **E2E**: Test complete authentication flow

## Files to Reference
[Automatically generated relevant file paths]

## Important Reminders
- Follow established patterns
- Include comprehensive error handling
- Add proper TypeScript types
- Write tests alongside implementation
```

## 📊 Quality Gates

Sherpa OS enforces quality standards:

- **Test Coverage**: ≥80% required by default
- **Acceptance Criteria**: Must be defined for all tickets  
- **Standards Compliance**: Coding standards automatically included in prompts
- **AI Anti-patterns**: Built-in detection for common AI mistakes
- **Session Continuity**: Context preservation between AI sessions

## 🏗️ Architecture  

### Local-First Design
- **Everything stored locally**: No cloud dependencies, your data stays in your repo
- **Git-friendly**: All files are readable text (Markdown, YAML, JSON)
- **Portable**: Works offline, can be committed and shared with team

### Standards-Driven
- **Global standards**: Set once, use across all projects
- **Preset configurations**: Quick setup for popular tech stacks
- **Context-aware**: Standards automatically included in AI prompts
- **Customizable**: Override global standards per project

### AI-Optimized  
- **Intelligent prompts**: Dynamic templates based on task type
- **Context compression**: Relevant codebase knowledge included automatically
- **Pattern detection**: Learn from your codebase and suggest improvements
- **Performance tracking**: Monitor which prompts work best

## 🔧 Configuration

### Global Standards Structure
```yaml
# ~/.sherpa/standards/development-best-practices.md
coding:
  language: TypeScript
  naming_convention: camelCase
  error_handling: "Custom error classes"
  
testing:  
  framework: Vitest
  coverage_target: 80
  naming_pattern: "Descriptive test names"

techstack:
  frontend: "Next.js 14"
  backend: "Node.js"
  database: "PostgreSQL"
```

### Project State Tracking
```json
{
  "initialized": true,
  "projectName": "My App",
  "version": "0.1.0", 
  "lastBrief": "2025-01-30",
  "ticketsCompleted": 15,
  "currentSprint": "sprint-2025-w05"
}
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone and install
git clone https://github.com/sherpa-os/sherpa-os.git
cd sherpa-os
npm install

# Run tests
npm test

# Build and test locally  
npm run build
npm link
sherpa --help
```

## 📋 Roadmap

- [x] **v0.1**: Core workflow (specs → tickets → prompts → tracking)
- [ ] **v0.2**: Advanced AI features (context building, session continuity)  
- [ ] **v0.3**: Team collaboration features
- [ ] **v0.4**: IDE integrations and plugins
- [ ] **v0.5**: Advanced analytics and optimization

## 🆘 Support

- 📖 **Documentation**: [Full docs](https://docs.sherpa-os.dev)
- 🐛 **Issues**: [GitHub Issues](https://github.com/sherpa-os/sherpa-os/issues)  
- 💬 **Discussions**: [GitHub Discussions](https://github.com/sherpa-os/sherpa-os/discussions)
- 📧 **Email**: support@sherpa-os.dev

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made for AI-assisted developers who want structure without sacrifice.**  
*Keep your AI focused, your code traceable, and your progress measurable.*