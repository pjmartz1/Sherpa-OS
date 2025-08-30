# 🤝 Contributing to Sherpa OS

Thank you for your interest in contributing to Sherpa OS! We welcome contributions from developers who want to improve AI-assisted development workflows.

## 📋 Quick Start for Contributors

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/sherpa-os.git
cd sherpa-os

# Install dependencies
npm install

# Run tests to verify setup
npm test

# Start development
npm run dev
```

### Testing Your Changes

```bash
# Run the full test suite
npm test

# Run with coverage
npm run test:coverage

# Test the CLI locally
npm run build
npm link
sherpa --help
```

## 🎯 How to Contribute

### Types of Contributions We Welcome

1. **🐛 Bug Fixes** - Fix issues, improve error handling
2. **✨ Features** - New commands, workflow improvements
3. **📚 Documentation** - Improve guides, examples, tutorials
4. **🧪 Tests** - Add test coverage, improve test reliability
5. **🎨 Templates** - New tech stack presets, prompt templates
6. **🔧 Tooling** - CI/CD improvements, development tools

### Before You Start

1. **Check existing issues** - See if someone's already working on it
2. **Open an issue** - Discuss your idea before starting large changes
3. **Follow our standards** - Use the project's coding style and patterns

## 📝 Development Guidelines

### Code Standards

- **Language**: TypeScript with strict mode enabled
- **Style**: Follow existing patterns, use Prettier formatting
- **Testing**: Maintain 95%+ test coverage
- **Documentation**: Update docs for user-facing changes

### Commit Convention

```bash
# Format: type(scope): description
feat(cli): add new context:build command
fix(prompts): handle missing template files gracefully  
docs(readme): improve installation instructions
test(utils): add comprehensive fs utility tests
```

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test thoroughly**
   ```bash
   npm test
   npm run build
   # Test CLI functionality manually
   ```

4. **Submit PR**
   - Use clear title and description
   - Reference related issues
   - Include testing notes

## 🧪 Testing Guidelines

### Test Categories

- **Unit Tests** - Individual function testing in `tests/unit/`
- **Command Tests** - CLI command integration tests
- **End-to-End** - Full workflow testing (when needed)

### Writing Good Tests

```typescript
describe('feature name', () => {
  beforeEach(async () => {
    // Setup temp directories for isolated testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sherpa-test-'));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    // Cleanup
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should do something specific', async () => {
    // Arrange
    const input = createTestInput();
    
    // Act  
    const result = await functionUnderTest(input);
    
    // Assert
    expect(result).toMatchObject(expectedOutput);
  });
});
```

## 🏗️ Architecture Overview

### Project Structure
```
src/
├── commands/          # CLI command implementations
├── utils/            # Shared utility functions
├── types/            # TypeScript type definitions
└── cli.ts           # Main CLI entry point

tests/
├── unit/            # Unit tests mirroring src structure
└── fixtures/        # Test data and helpers
```

### Key Concepts

- **Commands** - Each CLI command is a separate module in `src/commands/`
- **Utilities** - Shared logic in `src/utils/` (fs, ids, context, etc.)
- **Local-First** - All data stored locally, no cloud dependencies
- **Standards-Driven** - Global and per-project coding standards

## 🎨 Adding New Features

### Adding a New Command

1. **Create command file**
   ```typescript
   // src/commands/new-command.ts
   import { Command } from 'commander';
   
   export const newCommand = new Command('new-command')
     .description('Description of what it does')
     .option('-f, --flag', 'Optional flag')
     .action(async (options) => {
       // Implementation
     });
   ```

2. **Export from CLI**
   ```typescript
   // src/cli.ts
   import { newCommand } from './commands/new-command.js';
   program.addCommand(newCommand);
   ```

3. **Add tests**
   ```typescript
   // tests/unit/commands/new-command.test.ts
   describe('new-command functionality', () => {
     // Comprehensive test suite
   });
   ```

4. **Update documentation**
   - Add to README command reference
   - Update GETTING-STARTED if needed

### Adding New Tech Stack Presets

1. **Add preset definition** in `src/commands/setup.ts`
2. **Add tests** for the preset
3. **Document** in README and getting started guide

## 🐛 Bug Reports

When reporting bugs, please include:

- **Steps to reproduce**
- **Expected vs actual behavior** 
- **Environment** (OS, Node version, etc.)
- **Error messages** (full stack trace if available)
- **CLI version** (`sherpa --version`)

## 💡 Feature Requests

For new features, please include:

- **Problem description** - What pain point does this solve?
- **Proposed solution** - How should it work?
- **User stories** - Who benefits and how?
- **Implementation ideas** - Any technical thoughts?

## 📚 Documentation Contributions

### Types of Docs We Need

- **Tutorials** - Step-by-step guides for common workflows
- **Examples** - Real-world usage scenarios  
- **API Reference** - Command and option documentation
- **Troubleshooting** - Common issues and solutions

### Documentation Standards

- **Clear headings** - Use semantic hierarchy
- **Code examples** - Include working examples
- **Cross-references** - Link between related docs
- **Keep current** - Update when features change

## 🏆 Recognition

Contributors will be:
- Added to the contributors list in README
- Mentioned in release notes for significant contributions
- Invited to join the maintainer team for consistent contributors

## ❓ Questions?

- **GitHub Discussions** - General questions and ideas
- **GitHub Issues** - Specific bugs or feature requests
- **Email** - maintainers@sherpa-os.dev for sensitive topics

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make AI-assisted development more structured and effective!** 🚀