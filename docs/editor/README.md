# Editor-Chronicler Documentation

This directory contains the daily reports, metrics tracking, and running chronicle of the Auto Company's journey. All materials are maintained by the Editor-Chronicler agent (specialized in narrative non-fiction and company storytelling).

---

## Files

### chronicle.md
The definitive running narrative of the company's journey. Written as a publishable chronicle that could become a book chapter. Includes:
- Timeline of events (Day 0, Day 1, Day 2, Day 3, etc.)
- Key decisions with reasoning
- Strategic insights and lessons learned
- Memorable quotes and moments
- Narrative flow (not just bullet points)

**When to Update:** After major milestones (product shipped, revenue milestone, pivot, key decision)

**Audience:** Founder, future investors, anyone interested in the story of how this AI company was built

---

### daily-YYYY-MM-DD.md
Daily summary reports covering all cycles that occurred in a single calendar day. Includes:
- Cycle summaries (all agents involved, outcomes, timeline, cost)
- Key decisions table
- Blockers and status
- Metrics dashboard for the day
- Notable moments and insights
- Next day priorities

**When to Update:** End of each day (after all cycles complete)

**Format:** One file per calendar day; can contain multiple cycles

**Audience:** Founder, operations team, anyone needing a daily executive summary

---

### metrics.md
Cumulative metrics dashboard tracking:
- Launch readiness progression
- Timeline vs. deadline
- Feature completeness
- Business metrics (users, revenue, pricing)
- Cost tracking (all cycles)
- Quality metrics (build status, test coverage)
- Team metrics (deliverables per agent)
- Blockers and risks
- Running narrative

**When to Update:** After each daily report; reflects cumulative state

**Audience:** CEO, CFO, anyone analyzing company health and progress

---

### email-draft-YYYY-MM-DD-[time].md
Draft email reports sent to the founder summarizing daily progress. These are:
- **Not sent automatically** — the editor creates the draft, which gets sent via email integration
- Formatted for email reading (short, scannable, actionable)
- Include key action items
- Executive-level summary of day's work

**When to Create:** After major cycles or daily summaries complete

**Audience:** Founder (jianou.works@gmail.com)

---

## Workflow

### End of Each Cycle
1. **Cycle completes** (agents finish work, record outcomes)
2. **Editor observes** (reads all agent deliverables, consensus, decisions)
3. **Quick entry** (add 1-2 paragraph summary to chronicle if major milestone)

### End of Each Day
1. **Compile daily report** (`docs/editor/daily-YYYY-MM-DD.md`)
   - All cycles from that day
   - Key decisions table
   - Metrics dashboard
   - Notable moments
2. **Update metrics** (`docs/editor/metrics.md`)
   - Cumulative progress
   - Timeline status
   - Blocker updates
3. **Create email draft** (`docs/editor/email-draft-YYYY-MM-DD-[time].md`)
   - Executive summary
   - Key action items for founder
   - Launch readiness / next steps
4. **Update chronicle** (`docs/editor/chronicle.md`)
   - Major events get full narrative entry
   - Links to daily reports for detail

### After Major Milestone (Revenue, Launch, Pivot)
1. **Detailed chronicle entry** — narrative-driven, not bullet points
2. **Metrics snapshot** — capture state at that moment
3. **Lessons learned** — what this teaches about AI startup building

---

## Style Guide

### Chronicle Writing
- **Narrative non-fiction:** Tell the story, not just what happened
- **Why it matters:** Connect events to strategy and company trajectory
- **Human moments:** Include quotes, insights, disagreements
- **Third-person perspective:** Refer to agents by name/role, not "I" or "we"
- **Structured storytelling:** Setup → conflict/decision → outcome → lesson

### Daily Report Structure
```
## Today's Highlights
- 1-3 bullet points of most important things

## Cycle Summary
### Cycle #N — [Title]
- Team: [agents]
- Task: [what they worked on]
- Outcomes: [specific deliverables]
- Timeline: X minutes
- Cost: $Y.YY

## Key Decisions
| Decision | Reasoning | Owner |

## Blockers & Status
| Item | Impact | Status | Next Action |

## Metrics Dashboard
[Table of key metrics]

## Notable Moments
[Interesting insights, quotes, disagreements]

## Tomorrow's Priorities
[Next steps based on consensus]
```

### Email Report Template
```
Subject: [Auto Company] Daily Report — YYYY-MM-DD | [Key Highlight]

## Today's Highlights
- [Most important outcomes]

## The Day's Work
### Cycle #N — [Title]
[Concise summary of work]

## Your Action Items
[Specific, unambiguous next steps for founder]

## Launch Readiness
[Current status vs. deadline]

## What's Ready to Ship
[Complete feature list]

## Tomorrow's Plan
[Expected next steps]
```

---

## Key Principles

1. **Record Everything:** Every cycle, every decision, every blocker gets documented
2. **Make It Readable:** Transform raw outputs into engaging narratives, not just data dumps
3. **Daily Digest:** One email per day to founder covering all cycles
4. **Build the Book:** This chronicle should be publishable as a startup narrative
5. **Metrics Matter:** Track numerical progress (timeline, cost, features) alongside narrative
6. **Lessons Learned:** Each milestone yields insights about AI company building

---

## Metrics to Track

### Timeline
- Current day vs. deadline
- Cycles completed
- Time to GO/NO-GO decisions
- Deploy time

### Business
- Revenue (once launches)
- Users (once launches)
- Pricing tiers
- CAC, LTV (once data available)

### Quality
- Build status (errors/warnings)
- Test coverage
- Deployment success rate
- Bug escape rate

### Cost
- Per-cycle API costs
- Total spend vs. budget
- Cost per feature shipped
- Cost per day

### Team
- Deliverables per agent
- Collaboration (who worked together)
- Decision velocity
- Blocker resolution time

---

## Archival & Preservation

All files are committed to Git. The chronicle can be extracted into a publishable document:
- **Chapters:** Phase 0 (Foundation), Phase 1 (Monetization), Phase 2 (Growth), etc.
- **Supporting Materials:** Daily reports provide backup detail; metrics show data
- **Publishing:** Export to Markdown → convert to PDF/HTML for distribution

---

## Contact & Questions

- **Editor Role:** Editor-Chronicler (autonomous)
- **Reports Go To:** Founder (jianou.works@gmail.com)
- **Escalations:** CEO (Bezos) if schedule/blocker requires decision
