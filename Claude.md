# 🏔️ Sherpa OS - Product Overview

## Mission
Sherpa OS is a local-first CLI that transforms how solo developers work with AI coding assistants. By enforcing structured workflows and intelligent context management, it ensures AI-generated code remains consistent, testable, and maintainable.

## Target Users
- **Solo developers** using Claude, Cursor, Cline, or other AI coding assistants
- **Small indie teams** (1-2 people) building products with AI assistance
- **Technical founders** who need structured development processes

## Core Value Proposition
Transform chaotic AI coding sessions into structured, traceable development workflows with built-in quality gates and context preservation.

## Key Problems Solved
- **Context Loss**: AI loses memory between sessions → Smart context preservation
- **Code Drift**: AI generates inconsistent patterns → Standards enforcement  
- **Missing Tests**: Coverage skipped in AI workflows → Built-in test requirements
- **Poor Specs**: Vague requirements lead to rework → Structured specification process
- **No Visibility**: Unknown progress or velocity → Daily briefs and velocity tracking

# Core Workflow

## Development Process
1. **Specification**: Create detailed feature specs with `sherpa add:spec`
2. **Planning**: Generate tickets and acceptance criteria with `sherpa gen:backlog`
3. **Implementation**: Create AI-ready prompts with `sherpa gen:prompt`
4. **Quality Assurance**: Run tests and validate coverage with `sherpa test`
5. **Progress Tracking**: Generate daily briefs with `sherpa brief`
6. **Retrospectives**: Weekly reviews with `sherpa retro` and `sherpa velocity`

## Quality Standards
- **Test Coverage**: Minimum 80% coverage required for all features
- **Acceptance Criteria**: Every ticket must have clear, testable outcomes
- **Documentation**: All decisions and progress tracked in local files
- **Standards Compliance**: Coding standards enforced in all AI prompts

# Architecture & Design Principles

## Local-First Approach
- **No Cloud Dependencies**: All data stored in your project repository
- **Git-Friendly**: Everything stored as readable text files (Markdown, YAML, JSON)
- **Offline Work**: Complete functionality without internet connection
- **Privacy**: Your code and decisions never leave your machine

## File Structure
```
your-project/
├── .sherpa/                 # Sherpa OS project data
│   ├── standards/           # Coding standards & tech stack
│   ├── specs/              # Feature specifications
│   ├── backlog/            # Generated tickets & epics  
│   ├── prompts/            # AI prompt templates
│   ├── context/            # Codebase patterns & decisions
│   └── config.json         # Project configuration
├── docs/                   # Generated reports
│   ├── briefs/            # Daily progress briefs
│   ├── retros/            # Weekly retrospectives
│   └── reports/           # Velocity & quality reports
└── ... your source code
```

## Integration Philosophy
Sherpa OS is designed to enhance, not replace, your existing AI coding workflow. It works seamlessly with:
- **Claude Code** - Use generated prompts directly
- **Cursor** - Copy prompts into chat or use as project context  
- **Cline** - Feed prompts as task descriptions
- **Any AI Assistant** - Context and standards are tool-agnostic

---

*For detailed installation and usage instructions, see [README.md](README.md)*  
*For step-by-step tutorials, see [GETTING-STARTED.md](GETTING-STARTED.md)*