# Recruiter Jobs Module

Recruiter-facing job management with full CRUD, applicant tracking with AI-powered scoring, and comprehensive hiring analytics.

## Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                        React Frontend                             │
│  RecruiterJobsPage → JobPostingCard (list)                       │
│  CreateJobPostingPage / EditJobPostingPage → JobPostingForm      │
│  RecruiterApplicantsPage → AI-scored applicant cards             │
│  RecruiterAnalyticsPage → Recharts dashboard (3 tabs)            │
│  jobPostingService.js (API client)                               │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼───────────────────────────────────────┐
│                      Node.js Backend                              │
│  routes.js → controller.js → service.js                           │
│  recruiterIntelligence/service.js → AI candidate evaluation      │
│  Models: JobPosting, JobApplication, Resume                       │
│  Redis: Analytics cache (5min), Skill trends cache (15min)       │
│  Socket.IO: Real-time notifications on apply/status change       │
└──────────────────────────────────────────────────────────────────┘
```

## Recruiter Job Flow

1. **Recruiter creates job** → `POST /api/jobs` with title, description, skills, salary, location
2. **Students apply** → Applications scored asynchronously by AI pipeline
3. **Recruiter views applicants** → Sorted by AI match score with filters
4. **Updates status** → Reviewed → Shortlisted/Rejected with feedback
5. **Exports data** → CSV export with sanitized fields (CSV injection prevention)

## Applicant AI Scoring

When a student applies, `evaluateCandidateMatch()` runs asynchronously:

```text
Application Created
    ↓
┌─────────────────────────────────────────┐
│  AI Pipeline (runPipeline)              │
│  → ATS score, Skill score, Experience   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Learning Progress Lookup               │
│  → Career readiness (High/Medium/Low)   │
│  → Contribution activity level          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Weighted Score Calculation             │
│  ATS: 20% + Skills: 35% + Projects: 25%│
│  + Career: 10% + Contributions: 10%     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Category Assignment                    │
│  ≥85: Excellent Match                   │
│  ≥70: Moderate Match                    │
│  ≥50: Growth Potential                  │
│  <50: Weak Alignment                    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Insights + Weaknesses + Signals        │
│  Saved to JobApplication document       │
└─────────────────────────────────────────┘
```

## Applicant Filtering

The applicants page supports advanced filtering:

| Filter           | Type     | Description                                      |
| ---------------- | -------- | ------------------------------------------------ |
| --------         | ------   | -------------                                    |
| Status           | Select   | pending/reviewed/shortlisted/rejected            |
| AI Match Score   | Range    | Min/max score                                    |
| ATS Score        | Range    | Min/max ATS compatibility                        |
| Match Category   | Checkbox | Excellent/Moderate/Growth/Weak                   |
| Specialization   | Select   | Frontend/Backend/FullStack/DevOps/AI-ML/Database |
| OSS Contributors | Toggle   | Only contributors with activity                  |
| Career Readiness | Select   | High/Medium/Low                                  |
| Skills           | Text     | Keyword search in resume skills                  |

### AI Intelligence Presets

Quick-filter buttons for common queries:

| Preset                     | Filters Applied            |
| -------------------------- | -------------------------- |
| --------                   | ----------------           |
| Top Matches                | minScore=85                |
| Excellent                  | category="Excellent Match" |
| OSS                        | contributorOnly=true       |
| High ATS                   | minAtsScore=80             |
| Frontend/Backend/FullStack | Respective specialization  |
| Readiness                  | careerReadiness="High"     |

## Analytics Dashboard

Three-tab analytics view using Recharts:

### Tab 1: Hiring Overview
- Total Jobs, Total Applicants, Average Match %, OSS Contributors %
- Applicant workflow counts (Pending/Reviewed/Shortlisted/Rejected)
- Status distribution pie chart
- Posting history bar chart (last 6 months)
- Top demanded skills
- Applicants per job
- Recent posting activities

### Tab 2: AI & ATS Intelligence
- Average AI Score, Average ATS Score (circular gauges)
- ATS-Ready percentage (score >= 80)
- Low ATS count with warning
- Match category distribution pie chart
- Talent Quality Index

### Tab 3: Technical & OSS Insights
- Specialization demographics bar chart
- OSS Activity Rate
- Roadmap Active Rate

## Database Models

### JobPosting

| Field                | Type     | Notes                               |
| -------------------- | -------- | ----------------------------------- |
| -------              | ------   | -------                             |
| `title`              | String   | Required, 2-120 chars               |
| `description`        | String   | Required, min 20 chars              |
| `skills`             | [String] | Auto-lowercased                     |
| `experienceRequired` | Number   | Default 0                           |
| `jobLevel`           | String   | 6 options (Internship to Executive) |
| `status`             | String   | draft/open/closed                   |
| `recruiter`          | ObjectId | Owner ref                           |
| `location`           | Object   | city, state, country, remote        |
| `salary`             | Object   | min, max, currency, isNegotiable    |

### JobApplication

| Field                 | Type     | Notes                                        |
| --------------------- | -------- | -------------------------------------------- |
| -------               | ------   | -------                                      |
| `job`                 | ObjectId | Ref: JobPosting                              |
| `applicant`           | ObjectId | Ref: User                                    |
| `resumeLink`          | String   | Required URL                                 |
| `coverNote`           | String   | Max 1000 chars                               |
| `aiMatchScore`        | Number   | 0-100                                        |
| `matchCategory`       | String   | AI-assigned category                         |
| `matchBreakdown`      | Object   | ATS, skills, projects, career, contributions |
| `aiRecruiterInsights` | [String] | AI-generated insights                        |
| `aiWeaknesses`        | [String] | AI-detected weaknesses                       |
| `aiHiringSignals`     | [String] | Recommended next steps                       |
| `statusHistory`       | Array    | Full audit trail                             |

## API Endpoints

| Method   | Endpoint                            | Auth      | Description               |
| -------- | ----------------------------------- | --------- | ------------------------- |
| -------- | ----------                          | ------    | -------------             |
| `POST`   | `/api/jobs`                         | recruiter | Create job (rate-limited) |
| `GET`    | `/api/jobs/recruiter`               | recruiter | List recruiter's jobs     |
| `GET`    | `/api/jobs/:id`                     | recruiter | Get job details           |
| `PUT`    | `/api/jobs/:id`                     | recruiter | Update job                |
| `DELETE` | `/api/jobs/:id`                     | recruiter | Delete job + applications |
| `GET`    | `/api/jobs/recruiter/analytics`     | recruiter | Aggregated analytics      |
| `GET`    | `/api/jobs/:id/applications`        | recruiter | Filtered applicant list   |
| `GET`    | `/api/jobs/:id/applications/export` | recruiter | CSV export                |
| `PATCH`  | `/api/jobs/applications/:id/status` | recruiter | Update status + notify    |

## Frontend Routes

| Route                            | Page                    | Description                    |
| -------------------------------- | ----------------------- | ------------------------------ |
| -------                          | ------                  | -------------                  |
| `/recruiter/jobs`                | RecruiterJobsPage       | Job listings dashboard         |
| `/recruiter/jobs/create`         | CreateJobPostingPage    | Create new job                 |
| `/recruiter/jobs/edit/:id`       | EditJobPostingPage      | Edit existing job              |
| `/recruiter/jobs/:id/applicants` | RecruiterApplicantsPage | AI-scored applicant management |
| `/recruiter/analytics`           | RecruiterAnalyticsPage  | 3-tab analytics dashboard      |

## Key Components

| Component                 | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| -----------               | ---------                                                |
| `RecruiterJobsPage`       | Job listings with search, status filter, pagination      |
| `CreateJobPostingPage`    | Job creation form                                        |
| `EditJobPostingPage`      | Job edit form (pre-populated)                            |
| `JobPostingForm`          | Full form: title, skills, salary, location, requirements |
| `RecruiterApplicantsPage` | AI-scored applicant cards with filters and presets       |
| `RecruiterAnalyticsPage`  | 3-tab Recharts dashboard                                 |
| `JobPostingCard`          | Wrapper around shared `JobViewerCard`                    |

## CSV Export Security

The `sanitizeCSVField()` function prevents CSV formula injection:
- Escapes double quotes
- Cleans newlines
- Prepends `'` if string starts with `=`, `+`, `-`, `@`, `\t`, or `\r`

## Key Files

```text
client/src/modules/recruiter-jobs/
├── pages/
│   ├── RecruiterJobsPage.jsx              # Job listings
│   ├── CreateJobPostingPage.jsx           # Create job
│   ├── EditJobPostingPage.jsx             # Edit job
│   ├── RecruiterApplicantsPage.jsx        # Applicant management (910 lines)
│   ├── RecruiterAnalyticsPage.jsx         # Analytics dashboard (925 lines)
│   └── TalentFinderPage.jsx               # Proactive talent search
├── components/
│   ├── JobPostingCard.jsx                 # Job card wrapper
│   └── JobPostingForm.jsx                 # Full job form (531 lines)
└── services/
    ├── jobPostingService.js               # Job + applicant API client
    └── talentFinderService.js             # Talent finder API client

server/src/modules/jobs/
├── routes.js                              # 16 endpoints
├── controller.js                          # Request handlers
└── service.js                             # Business logic + Redis caching

server/src/modules/recruiterIntelligence/
└── service.js                             # AI candidate evaluation engine
```

## Integration Points

- **Resume Analyzer**: AI pipeline used for applicant scoring
- **Student Jobs**: Shared `JobPosting` and `JobApplication` models
- **Job Matcher**: Same pipeline for student-side recommendations
- **Talent Finder**: Proactive candidate search (separate page in this module)
- **Notifications**: Real-time Socket.IO on application submit and status change
- **Redis**: Analytics and job listing caching with invalidation
