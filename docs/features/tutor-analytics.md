# Tutor Analytics Module

Visual dashboards for tutors showing class-wide skill distribution, gap analysis, and platform-wide performance metrics across students.

## Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                        React Frontend                             │
│  TutorAnalyticsDashboard → Recharts (Treemap + BarChart)         │
│  apiRequest (shared API client)                                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼───────────────────────────────────────┐
│                      Node.js Backend                              │
│  routes.js → controller.js                                       │
│  Models: Resume, LearningProgress, InterviewSession               │
└──────────────────────────────────────────────────────────────────┘
```

## Analytics Flow

1. **Tutor opens analytics** → `GET /api/analytics/skill-gaps` fetches skill distribution
2. **Aggregation pipeline** → MongoDB groups all student resume skills by frequency
3. **Gap score computed** → `gapScore = max(1, 100 - count*10)` (lower frequency = higher gap)
4. **Visualized** → Treemap heatmap + horizontal bar chart of top 10 gaps

## Dashboard Analytics

The `GET /api/analytics/dashboard` endpoint returns role-based analytics:

| Role          | Metrics Returned                                                               |
| ------------- | ------------------------------------------------------------------------------ |
| -----------   | -------------------------------------------------------------------------      |
| **Student**   | Roadmap progress, average interview score, total interviews, completed topics  |
| **Tutor**     | Average platform score, total mock interviews completed, active students count |
| **Recruiter** | Talent density by topic (score >= 80), total elite candidates                  |

## Skill Gap Analysis

### Aggregation Pipeline

```text
Resume collection
  → $project (skills array)
  → $unwind (one doc per skill)
  → $group (by lowercase skill name, count occurrences)
  → $sort (by count descending)
  → $limit (top 30)
  → Map to { name, count, gapScore }
```

### Gap Score Formula

```text
gapScore = max(1, 100 - (count * 10))
```

- Skill with 10 students → gapScore = 0 (low gap, well-covered)
- Skill with 1 student → gapScore = 90 (high gap, needs attention)

## Visualizations

### Treemap Heatmap

- Custom renderer with colored blocks per skill
- Color calculated from index
- Shows skill name and student count
- Minimum cell size for readability (width > 40, height > 30/50)

### Horizontal Bar Chart

- Top 10 skills by `gapScore`
- Red bars (higher = bigger gap)
- Identifies which skills need the most attention

## API Endpoints

| Method   | Endpoint                    | Auth  | Description                     |
| -------- | --------------------------- | ----- | ------------------------------- |
| -------- | --------------------------- | ----  | ------------------------------- |
| `GET`    | `/api/analytics/skill-gaps` | tutor | Skill distribution heatmap data |
| `GET`    | `/api/analytics/dashboard`  | any   | Role-based dashboard metrics    |

## Frontend Routes

| Route                | Page                    | Description                            |
| -------------------- | ----------------------- | -------------------------------------- |
| -------------------- | ----------------------- | ------------------------------------   |
| `/tutor/analytics`   | TutorAnalyticsDashboard | Skill gap heatmap and platform metrics |

## Key Files

```text
client/src/modules/analytics/
└── TutorAnalyticsDashboard.jsx            # Dashboard with Recharts visualizations

server/src/modules/analytics/
├── routes.js                              # 2 endpoints
└── controller.js                          # Aggregation pipelines
```

## Integration Points

- **Resume Analyzer**: Skill data aggregated from all student resumes
- **Interview Module**: Interview scores used in tutor/recruiter dashboards
- **Roadmap Module**: Completion rates feed into active student counts
- **Student Jobs**: Specialization counts from resume data
