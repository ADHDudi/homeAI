---
name: backlog
description: This skill should be used when the user asks to "add to backlog", "show backlog", "view backlog", "list backlog", "mark as done", "prioritize backlog", "update backlog item", "what's in the backlog", "backlog status", "remove from backlog", "next backlog item", "what should we work on next", or says anything about managing project ideas, tasks, or future work for this project. This skill manages the homeAI project backlog file as persistent memory.
version: 0.1.0
---

# Backlog Manager

Manages the homeAI project backlog stored in `backlog.md` — the persistent memory for all project ideas, tasks, and planned improvements.

## Backlog File Location

The backlog lives at:
```
.claude/skills/backlog/backlog.md
```

Always read this file first before any backlog operation. Always write back to this exact path after any change.

## Backlog File Format

```markdown
# HomeAI Project Backlog

## 🔴 High Priority
- [ ] #001 · Short title — brief description

## 🟡 Medium Priority
- [ ] #002 · Short title — brief description

## 🟢 Low Priority / Ideas
- [ ] #003 · Short title — brief description

## ✅ Done
- [x] #004 · Short title — completed note
```

Each item follows this pattern:
```
- [ ] #NNN · Title — Description
```
Where:
- `[ ]` = pending, `[x]` = done
- `#NNN` = auto-incremented ID (find highest existing ID + 1)
- Title = 3–6 words
- Description = one sentence max

## Operations

### View Backlog (`show`, `list`, `what's in backlog`)
1. Read `.claude/skills/backlog/backlog.md`
2. Display all sections with counts per section
3. Highlight any High Priority items prominently

### Add Item (`add to backlog`, `add idea`)
1. Read current backlog file
2. Determine next ID (max existing ID + 1, starting at 001)
3. Ask user for priority if not stated (High / Medium / Low)
4. Append item under correct priority section
5. Write file back
6. Confirm: "Added #NNN to [Priority] backlog"

### Mark Done (`mark done`, `complete`, `finished`)
1. Read backlog file
2. Find item by ID or title match
3. Change `[ ]` → `[x]`
4. Move item to `## ✅ Done` section
5. Write file back
6. Confirm: "Marked #NNN as done ✅"

### Prioritize (`prioritize`, `move to high`, `reprioritize`)
1. Read backlog file
2. Find item by ID or title
3. Move to the requested priority section
4. Write file back
5. Confirm the change

### Remove (`remove`, `delete from backlog`)
1. Read backlog file
2. Find and delete item line
3. Write file back
4. Confirm removal

### Next Item (`what should we work on`, `next task`)
1. Read backlog file
2. Return the first unchecked item from High Priority, then Medium, then Low
3. Briefly explain why it's next

### Update (`update item`, `edit backlog item`)
1. Read backlog file
2. Find item by ID
3. Replace title/description as requested
4. Write file back
5. Confirm the update

## Rules

- Never reorder IDs — IDs are permanent identifiers
- Never delete Done items — they are the project history
- Keep descriptions concise — one sentence maximum
- If the backlog file doesn't exist yet, create it with the template structure and an empty backlog
- After every write operation, confirm the action taken
- When adding multiple items at once, add all in one write operation

## Example Session

User: "Add to backlog: fix the timer leak in ckan client, high priority"
→ Read file → next ID = #005 → add under High Priority → write → confirm

User: "Show backlog"
→ Read file → display all sections with item counts

User: "Mark #003 done"
→ Read file → find #003 → check it → move to Done → write → confirm
