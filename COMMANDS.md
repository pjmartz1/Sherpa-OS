# 📖 Sherpa OS Commands Reference

Complete reference for all Sherpa OS CLI commands.

## 🚀 Getting Started Commands

### `sherpa setup`
**Global setup (run once)**
```bash
sherpa setup
```
- Sets up your development standards and preferences globally
- Choose from preset tech stacks or create custom standards
- Only needs to be run once per machine

### `sherpa init`
**Initialize project**
```bash
sherpa init [options]

Options:
  --force    Overwrite existing Sherpa configuration
```
- Creates `.sherpa/` directory structure in current project
- Sets up project-specific configuration
- Requires global setup to be completed first

### `sherpa tutorial`
**Interactive tutorial**
```bash
sherpa tutorial
```
- Step-by-step guided tour of Sherpa OS
- Best for first-time users
- Walks through complete workflow

## 📝 Content Creation Commands

### `sherpa add:spec`
**Create feature specification**
```bash
sherpa add:spec
```
- Interactive spec creation with guided prompts
- Creates structured markdown files in `.sherpa/specs/`
- Foundation for generating tickets and prompts

### `sherpa add:standard`
**Add coding standards**
```bash
sherpa add:standard [options]

Options:
  --type <type>    Type of standard (coding|testing|techstack)
```
- Add or update project-specific standards
- Override global standards for this project
- Standards are automatically included in AI prompts

### `sherpa review:spec`
**Review specifications**
```bash
sherpa review:spec [spec-id]
```
- Interactive spec review with clarifying questions
- Improves spec quality before generating tickets
- Adds Q&A directly to spec files

## 🎯 Workflow Generation Commands

### `sherpa gen:backlog`
**Generate tickets from specs**
```bash
sherpa gen:backlog [options]

Options:
  --spec <spec-id>    Generate from specific spec only
```
- Creates epics, stories, and tickets from specifications
- Structured YAML files with acceptance criteria
- Includes test plans and time estimates

### `sherpa gen:prompt`
**Generate AI-ready prompts**
```bash
sherpa gen:prompt [options]

Options:
  -t, --ticket <ticket>     Specific ticket ID
  -o, --output <file>       Output file for prompt
  --context                 Include full context injection
  --template <template>     Prompt template to use
```
- Creates comprehensive prompts for AI assistants
- Includes context, standards, and requirements
- Generates file maps for relevant code

## 🧪 Testing & Quality Commands

### `sherpa test`
**Run tests with coverage**
```bash
sherpa test [options]
```
- Runs project test suite
- Enforces coverage requirements
- Quality gate for ticket completion

### `sherpa lint:ai`
**Detect AI coding anti-patterns**
```bash
sherpa lint:ai [files...]
```
- Scans for common AI coding mistakes
- Detects over-abstraction and missing error handling
- Suggests improvements for AI-generated code

## 📊 Progress Tracking Commands

### `sherpa brief`
**Generate daily brief**
```bash
sherpa brief [options]

Options:
  --date <date>    Generate brief for specific date
```
- Creates daily progress summary
- Tracks tickets completed, blockers, and next actions
- Maintains development momentum

### `sherpa retro`
**Conduct retrospective**
```bash
sherpa retro [options]

Options:
  --week <week>    Retrospective for specific week
```
- Weekly reflection on what worked/didn't work
- Identifies process improvements
- Tracks learning and efficiency gains

### `sherpa velocity`
**Track development velocity**
```bash
sherpa velocity [options]

Options:
  --period <days>    Time period to analyze (default: 30)
```
- Measures throughput and cycle time
- Tracks quality metrics and redo rate
- Identifies trends and bottlenecks

## 🧠 AI Enhancement Commands

### `sherpa context:build`
**Extract codebase patterns**
```bash
sherpa context:build [options]

Options:
  --force    Rebuild context from scratch
```
- Analyzes codebase for patterns and conventions
- Extracts architectural decisions
- Creates compressed context for AI prompts

### `sherpa context:inject`
**Smart context for AI tools**
```bash
sherpa context:inject [options]

Options:
  --similarity <threshold>    Context relevance threshold
```
- Provides relevant context based on current task
- Filters most applicable patterns and decisions
- Optimizes AI assistant performance

### `sherpa prompt:optimize`
**A/B test prompt approaches**
```bash
sherpa prompt:optimize [options]

Options:
  --template <template>    Template to optimize
  --iterations <count>     Number of test iterations
```
- Tests different prompt variations
- Measures AI response quality
- Learns from successful prompt patterns

### `sherpa prompt:debug`
**Analyze prompt performance**
```bash
sherpa prompt:debug [prompt-id]
```
- Reviews why prompts succeeded or failed
- Provides feedback for prompt improvement
- Tracks success patterns

## 🔄 Session Management Commands

### `sherpa session:log`
**Track session progress**
```bash
sherpa session:log [options]

Options:
  --success <description>    Log successful approach
  --failure <description>    Log what didn't work
  --blocker <description>    Log current blocker
```
- Records what worked and what didn't
- Maintains context between sessions
- Helps with session handoffs

### `sherpa handoff:prep`
**Prepare context for next session**
```bash
sherpa handoff:prep
```
- Summarizes current state and progress
- Documents next steps and blockers
- Preserves context for future work

### `sherpa session:resume`
**Resume previous work with full context**
```bash
sherpa session:resume [session-id]
```
- Restores previous session context
- Shows what was working on and next steps
- Minimizes context rebuilding time

## 🔧 Global Options

All commands support these global options:

```bash
Options:
  -V, --version    Output the version number
  -h, --help       Display help for command
```

## 💡 Command Combinations

### Typical Development Flow
```bash
# 1. Create and review spec
sherpa add:spec
sherpa review:spec SPEC-001

# 2. Generate tickets and prompt
sherpa gen:backlog
sherpa gen:prompt --ticket FEAT-001

# 3. Implement with AI assistant (use generated prompt)

# 4. Track progress
sherpa session:log --success "Login form implemented"
sherpa test
sherpa brief
```

### Weekly Planning Flow
```bash
# Monday: Plan the week
sherpa velocity
sherpa brief

# During week: Track progress
sherpa session:log
sherpa brief

# Friday: Reflect and improve
sherpa retro
sherpa context:build
```

### AI Optimization Flow
```bash
# Build and optimize AI context
sherpa context:build
sherpa prompt:optimize --template feature-implementation

# Generate optimized prompts
sherpa gen:prompt --context --ticket FEAT-002

# Debug and improve
sherpa prompt:debug PROMPT-123
sherpa lint:ai src/
```

## 🆘 Getting Help

- **Command help**: `sherpa <command> --help`
- **General help**: `sherpa --help`
- **Version**: `sherpa --version`
- **Interactive tutorial**: `sherpa tutorial`

## 📚 Related Documentation

- **Getting Started**: [GETTING-STARTED.md](GETTING-STARTED.md)
- **Main Documentation**: [README.md](README.md)  
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)

---

*For the most up-to-date command information, use `sherpa --help` or `sherpa <command> --help`*