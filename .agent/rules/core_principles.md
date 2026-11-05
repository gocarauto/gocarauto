# Core Principles & Agent Conduct Rules

These rules govern how all Antigravity agents and subagents must operate within the GoCar Auto codebase.

## 1. Tool Usage Standards
- **Absolute Paths**: Always use absolute paths when interacting with the filesystem.
- **Verification First**: Before modifying a file, use `view_file` or `view_file_outline` to understand its current state.
- **Atomic Operations**: Perform one logical change at a time. Do not bundle unrelated modifications.

## 2. Communication Policy
- **Proactive Updates**: Keep the user informed of progress through the task boundary and task.md updates.
- **Clarity**: Use technical, precise language with the user, behaving as a senior consultant.

## 3. Structural Integrity
- **Skill Usage**: Always check `/home/akhalil/AntiGravity/GoCar Auto/.agent/skills` for relevant instructions before starting work on a specific domain (UI, API, Database, etc.).
- **Workflow Usage**: Use existing workflows in `/home/akhalil/AntiGravity/GoCar Auto/.agent/workflows` for common sequences like deployments or tests.
