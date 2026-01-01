# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **auth-service** repository for the LunFit platform. It's a new project currently in the initial setup phase with no source code yet implemented.

The repository uses **SpecKit**, a specification-driven development workflow system that emphasizes:
- Writing specifications before implementation
- Test-driven development
- Separating WHAT (requirements) from HOW (implementation)
- Feature branch workflow with numbered branches

## SpecKit Workflow

This project follows the SpecKit workflow for all feature development. The workflow consists of several phases:

### Feature Development Lifecycle

1. **Specification Phase** (`/speckit.specify`)
   - Creates a feature branch named `{number}-{short-name}` (e.g., `1-user-auth`)
   - Generates `specs/{number}-{short-name}/spec.md` with business requirements
   - Focuses on WHAT users need and WHY (no implementation details)
   - Creates quality validation checklists

2. **Clarification Phase** (`/speckit.clarify`) - Optional
   - Identifies underspecified areas in the spec
   - Asks up to 5 targeted clarification questions
   - Encodes answers back into the spec

3. **Planning Phase** (`/speckit.plan`)
   - Phase 0: Research unknowns, resolve technical decisions
   - Phase 1: Design data models, API contracts, quickstart guide
   - Generates `plan.md`, `research.md`, `data-model.md`, and `/contracts/*`
   - Updates `.claude/agent-context.md` with project-specific technology context

4. **Task Generation** (`/speckit.tasks`)
   - Converts plan into dependency-ordered tasks in `tasks.md`
   - Each task is independently executable and testable

5. **Implementation Phase** (`/speckit.implement`)
   - Executes all tasks defined in `tasks.md`
   - Follows test-driven development (TDD)

6. **GitHub Integration** (`/speckit.taskstoissues`) - Optional
   - Converts tasks to GitHub issues with proper dependencies

### Key SpecKit Principles

- **Specification Quality**: Specs must be technology-agnostic, testable, and focused on user value
- **No Implementation in Specs**: Specs describe WHAT and WHY, not HOW (no languages, frameworks, APIs)
- **Constitution-Driven**: Project constitution (`.specify/memory/constitution.md`) defines core principles and constraints
- **Dependency Ordering**: Tasks are ordered to respect dependencies and enable incremental delivery

## Directory Structure

```
.claude/
  commands/           # SpecKit command definitions
  agent-context.md    # Claude-specific project context (generated during planning)

.specify/
  memory/
    constitution.md   # Project principles and constraints (template - not yet configured)
  templates/          # Templates for specs, plans, tasks, checklists
  scripts/bash/       # Automation scripts for feature workflow

specs/                # Feature specifications (created per feature)
  {number}-{name}/
    spec.md           # Feature specification
    plan.md           # Implementation plan
    tasks.md          # Ordered task breakdown
    research.md       # Research findings
    data-model.md     # Data model design
    contracts/        # API contracts (OpenAPI, GraphQL schemas)
    checklists/       # Quality validation checklists
```

## Important Workflow Notes

### When Starting a New Feature

1. **Always use `/speckit.specify`** with a clear feature description
   - Example: `/speckit.specify Add JWT-based user authentication with email/password login`
   - The system will automatically create a numbered branch and spec file
   - DO NOT manually create feature branches or spec files

2. **The workflow scripts are critical**:
   - `.specify/scripts/bash/create-new-feature.sh` - Creates feature branch and initializes spec
   - `.specify/scripts/bash/setup-plan.sh` - Sets up planning phase
   - `.specify/scripts/bash/update-agent-context.sh` - Updates agent context with tech choices
   - Always run scripts from the repository root

3. **Branch Naming Convention**:
   - Pattern: `{number}-{short-name}`
   - Numbers are auto-incremented across remote branches, local branches, and specs directories
   - Short names are 2-4 words in kebab-case (e.g., `user-auth`, `oauth2-integration`)

### Constitution File

The `.specify/memory/constitution.md` file is currently a template. Before major development begins, this should be populated with:
- Core architectural principles
- Technology stack decisions
- Testing requirements (e.g., TDD mandatory, integration test requirements)
- Security and compliance standards
- Development workflow rules

### Agent Context

The `.claude/agent-context.md` file is generated during the `/speckit.plan` phase. It contains:
- Technology stack and framework choices made during planning
- Project-specific patterns and conventions
- Key architectural decisions
- This file helps maintain consistency across features

## Git Workflow

- **Main branch**: `master`
- **Feature branches**: Created automatically by SpecKit (pattern: `{number}-{short-name}`)
- When creating pull requests, target the `master` branch
- Feature branches are checked out automatically by the create-new-feature script

## Current State

This repository is newly initialized with only the SpecKit configuration present. No source code, build configuration, or dependency management has been set up yet.

When implementing the first feature:
1. Use `/speckit.specify` to define what the auth service should do
2. The planning phase will determine the tech stack (Node.js/Python/Go, framework, database, etc.)
3. Initial project structure (package.json, tsconfig, etc.) will be created during implementation

## Common Patterns

### Specification Quality Checks

All specs are validated against these criteria:
- No implementation details (languages, frameworks, APIs)
- Focused on user value and business needs
- All requirements are testable and unambiguous
- Success criteria are measurable and technology-agnostic
- Maximum 3 `[NEEDS CLARIFICATION]` markers allowed

### Research Phase Outputs

The `research.md` file documents:
- Decisions made (what was chosen)
- Rationale (why it was chosen)
- Alternatives considered (what else was evaluated)

### Data Modeling

The `data-model.md` includes:
- Entity names, fields, and relationships
- Validation rules from requirements
- State transitions where applicable

### API Contracts

Contracts are stored in `/contracts/` directory:
- Use standard REST or GraphQL patterns
- OpenAPI specs for REST APIs
- GraphQL schemas for GraphQL APIs
- Generated from functional requirements in the spec
