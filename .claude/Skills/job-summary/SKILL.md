---
name: jobsummary
description: "creates a summary for future claudes"
---
 
---
name: task-summary
description: Generate concise summary markdown files (.md) after completing development tasks or projects. Use this skill whenever a developer finishes a task, project, or feature and wants to create a quick-reference summary document. This ensures future conversations only need to read the summary file instead of scanning all project files. Include this skill for requests like "create a summary", "write a summary document", "summarize this work", or when the user explicitly states they've finished a job or project.
---
 
# Task Summary Skill
 
Creates concise, developer-friendly markdown summaries of completed work that can be quickly referenced in future conversations.
 
## When to Use This Skill
 
- **Task completion**: User finishes a coding task, project, or feature
- **Documentation needs**: Need a quick-reference summary instead of scanning multiple files
- **Future context**: Setting up context for future conversations to read only one file
- **Knowledge preservation**: Capturing what was done, decisions made, and key files involved
## What Makes a Good Summary
 
A task summary should be scannable and information-dense. Structure it like this:
 
### Purpose / Objective
What was the goal? Keep to 1-2 sentences.
 
### What Was Done
Bullet list of key accomplishments or changes. Focus on what works, not the process.
 
### Key Files / Structure
If relevant, list the main files touched or created with brief descriptions.
 
### Key Decisions / Notes
Important design choices, libraries used, configurations, edge cases handled.
 
### Next Steps (Optional)
What should be done next time this is opened? Any cleanup, optimization, or follow-up work?
 
## Example Structure
 
```markdown
# Project: [Name]
 
## Overview
[1-2 sentence purpose]
 
## What Was Done
- Created X component/feature
- Integrated Y library
- Fixed bug in Z module
 
## Key Files
- `src/components/MyComponent.jsx` - Main component
- `src/utils/helper.js` - Utility functions
- `config/settings.json` - Configuration
 
## Key Decisions
- Used [Library X] because [reason]
- Chose approach Y over Z due to [constraint]
 
## Next Steps
- Add unit tests for NewComponent
- Optimize database queries in module Z
```
 
## How to Use
 
1. When you finish a task, tell Claude: "Create a summary of what we just built"
2. Claude will review the work and generate a concise `.md` file
3. Save this file in your project root or docs folder
4. Next time you open this project in a new conversation, share just the summary file
5. Claude reads only the summary instead of scanning all your code files
## Tips for Best Results
 
- **Be specific about file paths**: Include relative paths so summaries are context-aware
- **Note dependencies**: If you integrated external libraries, mention them
- **Capture decisions**: Why was something built a certain way? Document it
- **Keep it brief**: Aim for one page (200-400 words) not a novel
- **Use code blocks** for config examples or important snippets
- **Link to files**: If referencing specific files, use readable paths
## File Naming Convention
 
Name summary files descriptively:
- `SUMMARY.md` - General project overview
- `FEATURE_auth.md` - Feature-specific summary
- `SESSION_2024-07-13.md` - Session-based summary
Prefer simple, clear names that explain what's inside at a glance.
