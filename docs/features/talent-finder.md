# AI Talent Finder Module

Proactive talent discovery search engine for recruiters. Search the entire student resume database, run AI matching against specific jobs, and send real-time invitations to apply.

## Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                        React Frontend                             │
│  TalentFinderPage → Smart Filters + Candidate Cards              │
│    ├── "Evaluate Match" → AI scoring per candidate               │
│    └── "Invite to Apply" → Real-time notification                │
│  talentFinderService.js (API client)                             │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼───────────────────────────────────────┐
│                      Node.js Backend                              │
│  recruiter/controller.js                                         │
│    searchTalent → MongoDB aggregation pipeline                   │
│    matchCandidate → runPipeline (real-time scoring)              │
│    inviteCandidate → Notification + Socket.IO                    │
│  Models: Resume, User, JobPosting, Notification                   │
└──────────────────────────────────────────────────────────────────┘
```

## Talent Finder Flow

1. **Recruiter opens Talent Finder** → Loads own open jobs for dropdown selector
2. **Selects target job** → All AI matches scored against this job's requirements
3. **Applies smart filters** → Specialization, min ATS score, skills, graduation year
4. **Searches** → MongoDB aggregation pipeline on Resume collection
5. **Evaluates candidates** → "Evaluate Match" runs AI pipeline per candidate
6. **Views breakdown** → ATS, skill, project scores with insights and weaknesses
7. **Invites candidates** → "Invite to Apply" sends real-time Socket.IO notification

## Search Pipeline

The `searchTalent` endpoint uses a MongoDB aggregation pipeline:

```text
Resume collection
  → $text search (if query provided) with $meta textScore
  → $match skills (regex, $all)
  → $match specialization (skill-to-domain mapping)
  → $match graduation year (regex in education)
  → $match minAtsScore (aggregatedScore >= value)
  → $lookup User collection (verify role: "student")
  → $facet (pagination metadata + data)
  → Sanitize user data (remove password, tokens)
  → Return { data, pagination }
```

### Specialization Mapping

| Specialization   | Skills Matched                                                          |
| ---------------- | ----------------------------------------------------------------------- |
| ---------------- | ---------------                                                         |
| Frontend         | react, vue, angular, javascript, typescript, html, css, next.js, svelte |
| Backend          | node.js, express, django, flask, spring, java, go, rust, fastapi        |
| FullStack        | Combination of frontend + backend                                       |
| DevOps           | docker, kubernetes, aws, azure, gcp, ci/cd, terraform                   |
| AI-ML            | python, tensorflow, pytorch, machine-learning, deep-learning, nlp       |
| Database         | mongodb, postgresql, mysql, redis, elasticsearch, cassandra             |

## AI Candidate Matching

When "Evaluate Match" is clicked:

1. **Fetch JobPosting** and candidate's active `Resume`
2. **Run AI Pipeline** (`runPipeline`) with resume data + job requirements
3. **Fetch LearningProgress** for career readiness and contribution activity
4. **Compute weighted score:**

   ```text
   finalScore = (ATS × 0.20) + (Skills × 0.35) + (Projects × 0.25) + (Career × 0.10) + (Contributions × 0.10)
   ```

5. **Generate insights** (up to 7), **weaknesses** (up to 7), **hiring signals** (up to 7)
6. **Return real-time** — NOT persisted (unlike `evaluateCandidateMatch` in recruiterIntelligence)

### Match Categories

| Score   | Category         |
| ------- | ---------------- |
| ------- | ----------       |
| ≥85     | Excellent Match  |
| ≥70     | Moderate Match   |
| ≥50     | Growth Potential |
| <50     | Weak Alignment   |

### Hiring Signals Generated

- "Fast-Track Candidate" (score ≥ 85)
- "Strong Hiring Signal" (score ≥ 70)
- "Technical Interview Recommended" (score ≥ 50)
- "HR Round Recommended" (score ≥ 50)
- "Skill Validation Required" (score < 50)
- "ATS Optimization Needed" (ATS < 50)
- "Growth Potential Candidate" (contributions High + score < 70)

## Invitation System

When "Invite to Apply" is clicked:

1. **Validates** both candidate and job exist
2. **Checks** candidate role is "student"
3. **Prevents** duplicate invitations
4. **Creates Notification** (type: "job-update") with recruiter name, company, job title
5. **Emits Socket.IO** `new-notification` to candidate's room

```text
POST /api/recruiter/invite-candidate
  → Notification.create({ user: candidateId, ... })
  → io.to(`user_${candidateId}`).emit("new-notification", notification)
  → Return success message
```

## Database Models Used

### Resume (searched)

| Fields Used                       | Purpose                      |
| --------------------------------- | ---------------------------- |
| -------------                     | ---------                    |
| `skills`                          | Skill matching and filtering |
| `aggregatedScore`                 | ATS score filtering          |
| `education`                       | Graduation year extraction   |
| `name`, `email`                   | Candidate display            |
| `linkedin`, `github`, `portfolio` | Social links                 |
| `projects`, `experience`          | Detail view                  |

### User (joined)

| Fields Used     | Purpose                  |
| --------------- | ------------------------ |
| -------------   | ---------                |
| `role`          | Filter to "student" only |
| `name`, `email` | Candidate display        |
| `profilePic`    | Avatar                   |

### JobPosting (selected)

| Fields Used   | Purpose             |
| ------------- | ------------------- |
| ------------- | ---------           |
| `skills`      | AI matching input   |
| `description` | AI matching input   |
| `title`       | Display in dropdown |

## API Endpoints

| Method   | Endpoint                          | Auth      | Description                  |
| -------- | --------------------------------- | --------- | ---------------------------- |
| -------- | ----------                        | ------    | -------------                |
| `GET`    | `/api/recruiter/talent-finder`    | recruiter | Search students with filters |
| `POST`   | `/api/recruiter/match-candidate`  | recruiter | Run AI match (real-time)     |
| `POST`   | `/api/recruiter/invite-candidate` | recruiter | Send invitation notification |

## Frontend Routes

| Route                      | Page             | Description                         |
| -------------------------- | ---------------- | ----------------------------------- |
| -------                    | ------           | -------------                       |
| `/recruiter/talent-finder` | TalentFinderPage | Proactive talent search (750 lines) |

## Key Components

| Component             | Purpose                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| -----------           | ---------                                                                   |
| `TalentFinderPage`    | Main page: job selector, filters, candidate cards with match/invite actions |
| Smart Filters Sidebar | Specialization, min ATS, skills, graduation year                            |
| Candidate Card        | Name, email, ATS score, "Evaluate Match" + "Invite to Apply" buttons        |
| Expanded Card Details | Education, experience, projects, social links, AI breakdown, insights       |

## Socket.IO Events

| Event              | Emitter   | Receiver             | Trigger                     |
| ------------------ | --------- | -------------------- | --------------------------- |
| -------            | --------- | ----------           | ---------                   |
| `new-notification` | Server    | `user_{candidateId}` | Recruiter invites candidate |

## Key Files

```text
client/src/modules/recruiter-jobs/
├── pages/TalentFinderPage.jsx             # Main page (750 lines)
└── services/talentFinderService.js        # API client (3 functions)

server/src/modules/recruiter/
├── routes.js                              # 3 endpoints
└── controller.js                          # searchTalent, matchCandidate, inviteCandidate
```

## Integration Points

- **Resume Analyzer**: AI pipeline (`runPipeline`) used for real-time scoring
- **Recruiter Jobs**: Shared job selector, notification system
- **Student Jobs**: Invited students see notifications on their job board
- **Notifications**: Real-time Socket.IO delivery
- **Roadmap**: Career readiness data from `LearningProgress`
