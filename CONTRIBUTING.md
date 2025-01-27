# Contributing to Lyvo

Thank you for your interest in contributing to Lyvo! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)

## Development Setup

### Prerequisites
- Node.js (>= 18.0.0)
- npm (latest stable version)
- Git

### Setting Up the Development Environment
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/lyvo.git
   cd lyvo
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the TypeScript compiler in watch mode:
   ```bash
   npm run dev
   ```

5. Run tests:
   ```bash
   npm test
   ```

### Development Commands
- `npm run dev`: Start TypeScript compiler in watch mode
- `npm test`: Run tests
- `npm run test:watch`: Run tests in watch mode
- `npm run build`: Build the project
- `npm run lint`: Run linting
- `npm run format`: Format code using Prettier

## Branching Strategy

### Branch Types
- `main`: Production-ready code
- `feature/*`: New features or enhancements (e.g., `feature/workflow-parser`)
- `fix/*`: Bug fixes (e.g., `fix/parsing-error`)
- `refactor/*`: Code refactoring without functionality changes
- `docs/*`: Documentation changes
- `test/*`: Adding or modifying tests
- `chore/*`: Maintenance tasks
- `build/*`: Changes affecting the build system

### Branch Naming Convention
- Use lowercase letters and hyphens
- Start with the type followed by a descriptive name
- Examples:
  - `feature/json-parser`
  - `fix/validation-error`
  - `refactor/typescript-migration`

## Commit Message Guidelines

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
Must be one of:
- `build`: Changes affecting build system or external dependencies
- `ci`: CI configuration changes
- `docs`: Documentation only changes
- `feat`: A new feature
- `fix`: A bug fix
- `perf`: Performance improvement
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `style`: Changes not affecting code meaning (formatting, missing semicolons, etc.)
- `test`: Adding or correcting tests

### Subject
- Use imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No period (.) at the end
- Maximum 50 characters

### Body
- Optional
- Use imperative, present tense
- Include motivation for change and contrast with previous behavior
- Wrap at 72 characters

### Examples
```
feat(parser): add JSON workflow parser implementation

Add parser class with validation and schema support.
Includes bidirectional conversion between JSON and runtime objects.

Closes #123
```

```
fix(validation): handle circular dependencies in workflow

Previously, the validator would hang on circular dependencies.
Now it detects and reports them as validation errors.
```

## Pull Request Process

1. Rebase your branch onto the latest main:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. Fix up commits to maintain clean history:
   ```bash
   git rebase -i main
   ```

3. Ensure:
   - All tests pass
   - Code is properly formatted
   - Documentation is updated
   - Commit messages follow guidelines

4. Submit PR:
   - Use a clear title following commit message format
   - Include comprehensive description
   - Reference any related issues

5. Address review feedback:
   - Fix issues in the original commits where they appear
   - Force push updates after rebasing
   - Don't add "fix review comments" commits

## Questions?

If you have questions or need help, please:
1. Check existing issues and documentation
2. Create a new issue for discussion
3. Ask in the project's communication channels

Thank you for contributing to Lyvo!
