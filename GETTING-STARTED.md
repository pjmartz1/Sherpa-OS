# 🚀 Getting Started with Sherpa OS

This guide will walk you through setting up and using Sherpa OS for the first time.

## 📋 Prerequisites

- **Node.js** 20+ installed
- **npm** or **pnpm** package manager
- A coding project you want to organize
- An AI coding assistant (Claude, Cursor, Cline, etc.)

## ⚡ 5-Minute Setup

### Step 1: Install Sherpa OS

```bash
npm install -g sherpa-os
```

### Step 2: Global Setup (One-time only)

```bash
sherpa setup
```

You'll be prompted to:
- Choose your experience level (beginner/experienced/expert)
- Select a tech stack preset or create custom standards
- Configure your preferred AI workflow

**Popular Presets:**
- **Full-Stack TypeScript**: Next.js + Supabase + Vercel
- **React Frontend**: TypeScript + Tailwind + Vite
- **Node.js Backend**: Express + TypeScript + PostgreSQL
- **Python API**: FastAPI + PostgreSQL

### Step 3: Initialize Your Project

```bash
cd your-project
sherpa init
```

This creates the `.sherpa/` directory and project structure.

## 🎯 Your First Feature

Let's walk through implementing a feature using Sherpa OS:

### 1. Create a Specification

```bash
sherpa add:spec
```

**Example spec:**
```
Feature: User Authentication

## Overview
Users need to be able to securely log in and out of the application.

## Requirements
- Email/password login form
- Session management  
- Logout functionality
- Password validation

## Success Criteria
- User can log in with valid credentials
- Invalid credentials show clear error
- User session persists across page refreshes
- Logout clears session completely
```

### 2. Generate Implementation Tickets

```bash
sherpa gen:backlog
```

This creates structured tickets in `.sherpa/backlog/tickets/` like:

```yaml
ticket_id: AUTH-001
title: Implement login form UI
outcome: Login form accepts email/password and validates input
acceptance_criteria:
  - Form has email and password fields
  - Email validation works correctly  
  - Password shows/hide toggle
  - Submit button is disabled until valid
ui_components:
  - LoginForm
  - EmailInput  
  - PasswordInput
timebox_hours: 4
test_plan:
  unit:
    - Test form validation
    - Test component rendering
  e2e:
    - Test login flow
```

### 3. Generate AI-Ready Prompt

```bash
sherpa gen:prompt --ticket AUTH-001
```

This creates a comprehensive prompt in `.sherpa/prompts/AUTH-001-prompt.md`:

```markdown
# Feature Implementation Task

## Context
React TypeScript application with Next.js framework
Using Tailwind CSS for styling, Zustand for state management

## Development Standards
- Language: TypeScript with strict mode
- Naming: camelCase for functions, PascalCase for components
- Error handling: Custom error classes with user-friendly messages
- Testing: Vitest + React Testing Library, 80% coverage required

## Tech Stack  
- Frontend: Next.js 14 (App Router)
- Styling: Tailwind CSS + HeadlessUI
- Forms: React Hook Form + Zod validation
- State: Zustand + TanStack Query

## Task Requirements
**Feature**: Implement login form UI
**Outcome**: Login form accepts email/password and validates input

**Acceptance Criteria**:
- [ ] Form has email and password fields
- [ ] Email validation works correctly
- [ ] Password shows/hide toggle  
- [ ] Submit button is disabled until valid

**UI Components to Create**:
- `LoginForm` - Main form component
- `EmailInput` - Email input with validation
- `PasswordInput` - Password input with toggle

## Test Requirements
- **Unit Tests**: Test form validation, component rendering
- **E2E Tests**: Test login flow

## Files to Reference
- src/components/forms/**/*.tsx
- src/types/auth.ts
- src/utils/validation.ts

## Important Reminders
- Follow existing component patterns in the codebase
- Use Zod schemas for validation  
- Include comprehensive error handling
- Write tests alongside implementation
- Use TypeScript discriminated unions for form state
```

### 4. Implement with Your AI Assistant

1. **Copy the generated prompt** to your AI assistant (Claude, Cursor, etc.)
2. **Include the suggested files** from the files map
3. **Follow the structured guidance** in the prompt
4. **Implement the feature** with AI assistance

### 5. Track Your Progress

```bash
# Log what worked and what didn't
sherpa session:log

# Generate daily brief
sherpa brief  

# Run tests to ensure quality
sherpa test
```

## 📈 Daily Workflow

Once you're set up, here's your typical daily routine:

### Morning Standup
```bash
# Check yesterday's progress and today's priorities
sherpa brief
```

### During Development  
```bash
# Generate prompts for tickets you're working on
sherpa gen:prompt --ticket TICKET-123

# Log progress and learnings throughout the day
sherpa session:log
```

### End of Day
```bash
# Update progress brief
sherpa brief

# Check test coverage and quality
sherpa test
```

### Weekly Review
```bash
# Conduct retrospective
sherpa retro

# Check velocity and improvement trends  
sherpa velocity

# Update codebase context for better AI prompts
sherpa context:sync
```

## 🎨 Customization

### Override Global Standards

```bash
# Set project-specific standards
sherpa add:standard --type coding
sherpa add:standard --type testing  
sherpa add:standard --type techstack
```

### Custom Prompt Templates

Edit templates in `.sherpa/prompts/templates/` to customize how prompts are generated.

### Workflow Configuration

Modify `.sherpa/state.json` to adjust:
- Coverage requirements
- Sprint durations
- Quality gates
- Reporting frequency

## 🔧 Troubleshooting

### Command Not Found
```bash
# Check installation
npm list -g sherpa-os

# Reinstall if needed
npm uninstall -g sherpa-os
npm install -g sherpa-os
```

### No Global Setup
```bash
# Run global setup if you see this error
sherpa setup
```

### Missing Dependencies
```bash
# Ensure all dependencies are installed
cd sherpa-os-project
npm install
```

### Test Coverage Issues
```bash
# Check current coverage
sherpa test

# Review coverage report in coverage/ directory
```

## 💡 Tips for Success

### 1. Start Small
- Begin with simple features to get familiar with the workflow
- Use preset configurations initially, customize later
- Focus on consistency over perfection

### 2. Leverage AI Effectively  
- Always use generated prompts - they include crucial context
- Include the suggested files in your AI assistant's context
- Review and iterate on prompts based on AI performance

### 3. Maintain Quality
- Run `sherpa test` before considering tickets complete
- Use `sherpa lint:ai` to catch common AI coding mistakes  
- Regular retrospectives help improve your process

### 4. Build Good Habits
- Daily briefs keep you focused and accountable
- Session logging captures valuable insights
- Weekly retros compound improvements over time

## 🚀 Next Steps

1. **Try the tutorial**: `sherpa tutorial` (interactive walkthrough)
2. **Join the community**: [GitHub Discussions](https://github.com/sherpa-os/sherpa-os/discussions)
3. **Read advanced guides**: Check out the [full documentation](https://docs.sherpa-os.dev)
4. **Share feedback**: Help us improve by reporting issues and suggestions

---

**You're ready to build structured, traceable, AI-assisted code!** 🎉

Need help? Check our [troubleshooting guide](TROUBLESHOOTING.md) or [open an issue](https://github.com/sherpa-os/sherpa-os/issues).