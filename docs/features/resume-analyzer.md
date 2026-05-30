# Resume Analyzer Module

The AI Resume Analyzer provides comprehensive resume evaluation using a 9-evaluator pipeline that scores resumes on skill match, ATS readiness, impact, readability, and more. Supports dual modes: JD-matching and industry benchmarking.

## Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                        React Frontend                             │
│  ResumeAnalyzerPage → DragDropUpload + JobDescriptionInput        │
│                     → AnalysisResult + SkillGapVenn               │
│                     → AnalysisReportPDF (export)                  │
│  resumeService.js (API client)                                   │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼───────────────────────────────────────┐
│                      Node.js Backend                              │
│  routes.js → controller.js → service.js                           │
│  evaluatorAdapters.js → runPipeline.js (9 evaluators)            │
│  coverLetter.controller.js → Gemini AI                           │
│  Models: Resume, AnalysisHistory, SemanticCache, CoverLetter      │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                    AI/ML Pipeline                                  │
│  skillEvaluator | keywordEvaluator | experienceEvaluator         │
│  semanticEvaluator (HF API) | impactEvaluator                    │
│  readabilityEvaluator | consistencyEvaluator                     │
│  atsOptimizationEvaluator | techStandardEvaluator                │
│  aggregator.js → weighted scoring → gapAnalyzer → classifier     │
└──────────────────────────────────────────────────────────────────┘
```

## Resume Flow

1. **Student uploads PDF** → `DragDropUpload` validates file (max 5MB, PDF/DOC/DOCX)
2. **Optionally provides JD** → `JobDescriptionInput` with clipboard paste, .txt upload, auto-clean
3. **Clicks Analyze** → `POST /api/resume/analyze` with FormData (file + optional JD)
4. **Server parses** → Extracts text, skills, experience, education via `parseResume()`
5. **Cache check** → SHA-256 hash of resume+JD; returns cached result if hit
6. **Pipeline runs** → 9 evaluators execute in parallel via `Promise.all`
7. **Aggregation** → Weighted score computed (different weights for JD vs no-JD mode)
8. **Results saved** → Upserted to `Resume` model, history tracked in `AnalysisHistory`
9. **Response returned** → Score, breakdown, skill gap, suggestions, classification
10. **Roadmap sync** → If classification exists, triggers `syncRoadmap()` for learning path

## Dual Scoring Modes

| Mode          | Trigger                  | Weight Focus                                                                                                               |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| ------        | ---------                | --------------                                                                                                             |
| **Match**     | Job description provided | Semantic (20%), Skill (15%), Keyword (15%), Impact (15%), Experience (10%), ATS (10%), Readability (10%), Consistency (5%) |
| **Benchmark** | No JD provided           | Impact (40%), ATS (30%), Readability (15%), Consistency (10%), Tech Standard (5%)                                          |

## Evaluator Pipeline

| Evaluator          | Weight (JD)   | Weight (No-JD)   | What It Measures                                   |
| ------------------ | ------------- | ---------------- | -------------------------------------------------- |
| -----------        | ------------- | ---------------- | ------------------                                 |
| `skillMatch`       | 0.15          | 0.00             | Exact skill overlap between resume and job         |
| `keywordMatch`     | 0.15          | 0.00             | JD keyword presence in resume                      |
| `experienceMatch`  | 0.10          | 0.00             | Years of experience comparison                     |
| `semanticMatch`    | 0.20          | 0.00             | Embedding-based semantic similarity (HF API)       |
| `impactMatch`      | 0.15          | 0.40             | Quantifiable achievements (%, $, multipliers)      |
| `atsOptimization`  | 0.10          | 0.30             | ATS compatibility (sections, contacts, formatting) |
| `readabilityMatch` | 0.10          | 0.15             | Sentence quality, power verb usage                 |
| `consistencyMatch` | 0.05          | 0.10             | Repetitive content, generic phrases                |
| `techStandard`     | 0.00          | 0.05             | Technical breadth across domains                   |

**Semantic caching:** Results cached in MongoDB with 7-day TTL using SHA-256 hash pairs.

## Database Models

### Resume

Stores parsed resume data and all evaluation results.

| Field                                                             | Type     | Notes                                          |
| ----------------------------------------------------------------- | -------- | ---------------------------------------------- |
| -------                                                           | ------   | -------                                        |
| `user`                                                            | ObjectId | Ref: User, indexed                             |
| `title`                                                           | String   | Default "My Resume"                            |
| `isActive`                                                        | Boolean  | Active baseline flag                           |
| `skills`, `education`, `experience`, `projects`, `certifications` | [String] | Parsed sections                                |
| `linkedin`, `github`, `portfolio`                                 | String   | Profile URLs                                   |
| `resumeText`                                                      | String   | `select: false` for privacy                    |
| `file`                                                            | Object   | originalName, storedName, path, size, mimeType |
| `skillMatch`, `keywordMatch`, `experienceMatch`, `semanticMatch`  | Object   | Evaluator results                              |
| `aggregatedScore`                                                 | Number   | Final weighted score                           |
| `classification`                                                  | String   | Beginner/Intermediate/Advanced/Strong Match    |
| `gapAnalysis`                                                     | Mixed    | Categorized improvement suggestions            |
| `mode`                                                            | String   | "match" or "benchmark"                         |

### AnalysisHistory

Tracks analysis history for version comparison. Max 10 records per user.

### SemanticCache

Caches semantic similarity results. TTL index expires after 7 days.

### CoverLetter

Generated cover letters linked to resume and job description.

## API Endpoints

| Method   | Endpoint                       | Auth    | Description                 |
| -------- | ------------------------------ | ------- | --------------------------- |
| -------- | ----------                     | ------  | -------------               |
| `POST`   | `/api/resume/upload`           | student | Upload resume file          |
| `POST`   | `/api/resume/analyze`          | student | Upload + full AI analysis   |
| `GET`    | `/api/resume/me/latest`        | any     | Get active/latest resume    |
| `GET`    | `/api/resume/list`             | student | List all resume versions    |
| `PATCH`  | `/api/resume/:id/active`       | student | Set active resume           |
| `PATCH`  | `/api/resume/:id/rename`       | student | Rename resume               |
| `DELETE` | `/api/resume/:id`              | student | Delete resume               |
| `GET`    | `/api/resume/result/:id`       | any     | Get specific result         |
| `POST`   | `/api/resume/compare`          | any     | AI compare two versions     |
| `POST`   | `/api/resume/:id/cover-letter` | student | Generate AI cover letter    |
| `GET`    | `/api/cover-letters`           | student | List cover letters          |
| `POST`   | `/api/cover-letters/generate`  | student | Template-based cover letter |

## Frontend Routes

| Route              | Page               | Description                                                 |
| ------------------ | ------------------ | ----------------------------------------------------------- |
| -------            | ------             | -------------                                               |
| `/resume-analyzer` | ResumeAnalyzerPage | Main analysis page with upload, JD input, results dashboard |

## Key Components

| Component             | Purpose                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| -----------           | ---------                                                                   |
| `ResumeAnalyzerPage`  | Orchestrates upload, analysis, results, version management (max 3 versions) |
| `DragDropUpload`      | Drag-and-drop + clipboard paste + file browser for PDF upload               |
| `JobDescriptionInput` | JD text input with paste from clipboard, .txt upload, auto-clean            |
| `AnalysisResult`      | Full results dashboard: score, metrics, skill gap, ATS checklist, actions   |
| `SkillGapVenn`        | SVG Venn diagram showing matched vs missing skills                          |
| `AnalysisReportPDF`   | Print-friendly layout for PDF export (html2canvas + jsPDF)                  |
| `ResumeSkeleton`      | Loading placeholder during analysis                                         |

## Version Management

- Students can upload up to **3 resume versions**
- One version is marked `isActive` (the baseline for matching)
- Switching active version reloads latest analysis for that version
- Deleting the active version auto-activates the most recent remaining one
- Inline rename support for version titles

## Cover Letter Generation

Two generation paths:

1. **AI-powered** (`coverLetter.controller.js`): Uses Google Gemini with dynamic prompt engineering
   - Tone options: Professional, Formal, Confident, Concise, Startup-Friendly, Creative
   - Language support: English, Hindi, German, French, Spanish
   - Saves to `CoverLetter` model

2. **Template-based** (`coverLetters/service.js`): Injects user data into a professional template
   - Faster, no AI dependency
   - Available via `/api/cover-letters/generate`

## Key Files

```text
client/src/modules/resume-analyzer/
├── pages/ResumeAnalyzerPage.jsx          # Main page (509 lines)
├── components/
│   ├── DragDropUpload.jsx                # File upload (284 lines)
│   ├── AnalysisResult.jsx                # Results dashboard (559 lines)
│   ├── JobDescriptionInput.jsx           # JD input (249 lines)
│   ├── AnalysisReportPDF.jsx             # PDF export template (364 lines)
│   ├── SkillGapVenn.jsx                  # Venn diagram (106 lines)
│   └── ResumeSkeleton.jsx               # Loading skeleton (117 lines)
└── services/resumeService.js             # API client (176 lines)

server/src/modules/resumes/
├── routes.js                             # 10 endpoints (197 lines)
├── controller.js                         # Core logic (519 lines)
├── service.js                            # DB operations (126 lines)
├── evaluatorAdapters.js                  # Pipeline adapters (134 lines)
└── coverLetter.controller.js             # AI cover letter (88 lines)

ai-ml/
├── evaluators/                           # 9 evaluators
│   ├── skillEvaluator.js
│   ├── keywordEvaluator.js
│   ├── experienceEvaluator.js
│   ├── semanticEvaluator.js
│   ├── impactEvaluator.js
│   ├── readabilityEvaluator.js
│   ├── consistencyEvaluator.js
│   ├── atsOptimizationEvaluator.js
│   └── techStandardEvaluator.js
├── pipeline/
│   ├── runPipeline.js                    # Orchestrator (257 lines)
│   ├── aggregator.js                     # Weighted scoring (37 lines)
│   ├── evaluatorContract.js              # Zod validation (19 lines)
│   └── recommendationEngine.js           # Multi-job matching (45 lines)
└── config/weights.config.js              # Weight maps
```

## Integration Points

- **Roadmap module**: Analysis triggers `syncRoadmap()` to update learning path based on skill gaps
- **Dashboard module**: Resume score feeds into skill tracking metrics
- **Job Matcher module**: Parsed resume data used for job recommendations
- **Recruiter Talent Finder**: Resume data searchable by recruiters
- **Notifications**: Cover letter generation and analysis events can trigger notifications
