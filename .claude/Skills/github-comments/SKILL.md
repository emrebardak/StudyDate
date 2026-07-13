---
name: githubcomments
description: "write short comments and save progression into md files"
---
 
---
name: github-concise-commits
description: "Use this skill when the user is preparing to push code to GitHub and wants to keep commit messages brief without long descriptions. Also use when they want to document what Claude did in short markdown summaries before pushing. Triggers when they mention 'push to GitHub', 'commit message', 'git commit', or any workflow involving Git commits. Apply this skill to write focused, title-only commits and auto-generate concise work summaries for the codebase."
---
 
# GitHub Concise Commits + Work Documentation
 
Creates focused, title-only commit messages and auto-documents Claude's contributions in brief markdown files before pushing to GitHub.
 
## When to Use This Skill
 
- **Before pushing to GitHub**: User is committing code and wants brief commit messages
- **Document Claude's work**: Need to record what Claude did in short markdown summaries
- **Rapid workflows**: Developer wants minimal, intent-driven commits
- **Team standards**: Enforcing concise commit policy across the codebase
- **Work audit trail**: Creating a clear record of AI-assisted changes
## What Makes a Good Commit + Work Doc
 
### Part 1: Pre-Push Work Documentation (Create First)
 
Keep it to **3-5 lines max** per entry:
 
```markdown
## 2024-07-13 - Add User Authentication Endpoints
 
**What was done:**
- Created POST /auth/login endpoint with JWT token generation
- Added rate limiting (5 requests/min) to prevent brute force
- Wrote 12 unit tests covering success and failure cases
 
**Files changed:** `src/auth/`, `tests/auth/`
**Commit:** `Add user authentication endpoint`
```
 
**Storage options:**
- `CLAUDE-WORK.md` - Single file with dated sections
- `claude-work/2024-07-13-feature-name.md` - Separate dated files
- `CHANGELOG.md` - Add [Claude] tag to existing changelog
### Part 2: Git Commit Message (Write After Documentation)
 
Keep to **single-line title (50 chars max)**:
 
```bash
git commit -m "Add user authentication endpoint"
```
 
NOT a long description:
```bash
git commit -m "Add user authentication endpoint
 
This commit adds a new POST /auth endpoint that handles user login 
requests. The endpoint validates credentials against the database and 
returns a JWT token. It includes rate limiting..."
```
 
**Use imperative mood (commands):**
- ✅ `Add`, `Fix`, `Update`, `Refactor`, `Remove`, `Test`, `Docs`, `Style`, `Chore`
- ❌ `Added`, `Fixed`, `Updated`, `Refactoring`
## Example Entries
 
### Feature Work
```markdown
## 2024-07-13 - Payment Processing Module
 
**What was done:**
- Integrated Stripe API for payment handling
- Added webhook validation and retry logic
- Created 8 integration tests with mock Stripe responses
 
**Files changed:** `src/payments/`, `tests/payments/`
**Commit:** `Add Stripe payment processing`
```
 
### Bug Fix
```markdown
## 2024-07-12 - Fix Login Form Validation
 
**What was done:**
- Fixed email regex validation allowing invalid domains
- Improved password strength checker logic
- Updated form error messages for clarity
 
**Files changed:** `src/components/login.tsx`
**Commit:** `Fix login form validation`
```
 
### Refactor
```markdown
## 2024-07-11 - Refactor API Response Middleware
 
**What was done:**
- Consolidated 3 response handlers into unified middleware
- Reduced bundle size by 2.1 KB
- Improved error handling consistency across routes
 
**Files changed:** `src/middleware/`
**Commit:** `Refactor API response middleware`
```
 
## The Workflow: Step by Step
 
1. **Document your work** (2 min)
```markdown
   ## 2024-07-13 - Add Auth Endpoints
   
   **What was done:**
   - Created POST /auth/login endpoint
   - Added rate limiting and JWT generation
   - Wrote 12 unit tests
   
   **Files changed:** `src/auth/`, `tests/`
   **Commit:** `Add user authentication endpoint`
```
 
2. **Stage your changes**
```bash
   git add .
```
 
3. **Write concise commit message**
```bash
   git commit -m "Add user authentication endpoint"
```
 
4. **Push to GitHub**
```bash
   git push origin main
```
 
## Best Practices
 
✅ **Do:**
- Write markdown docs BEFORE committing (capture fresh context)
- Use bullet points (short, scannable)
- Include file paths so teammates can find the code
- Reference the exact commit message
- One entry per session/feature
❌ **Don't:**
- Write paragraphs in work docs (keep to 3-5 lines)
- Include implementation details in documentation
- Add long descriptions to git commit bodies
- Create entries for trivial changes (typos, formatting)
## Pro Tips
 
- **Jot as you go**: Don't wait until push time; document work as you complete features
- **Use git aliases**: `git config alias.work '!vim CLAUDE-WORK.md'`
- **Auto-date entries**: `echo "## $(date +%Y-%m-%d) - [Feature Name]" >> CLAUDE-WORK.md`
- **Review before push**: `git log --oneline -5` and `cat CLAUDE-WORK.md`
## Result
 
✨ Teammates can read `CLAUDE-WORK.md` to understand what changed
✨ Git log shows clean, scannable titles
✨ No long descriptions to parse
✨ Clear audit trail of AI-assisted work
