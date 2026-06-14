import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";
import mongoose from "mongoose";
import InterviewSession from "../../../database/models/InterviewSession.js";
import { getUserInterviewHistory } from "../service.js";

afterEach(() => {
  mock.restoreAll();
});

const userId = new mongoose.Types.ObjectId("64f1f77bcf86cd7994390a01");

const createQuery = (result) => ({
  select() {
    return this;
  },
  sort() {
    return this;
  },
  skip() {
    return this;
  },
  limit() {
    return this;
  },
  lean: async () => result,
});

test("getUserInterviewHistory - returns paginated sessions with analytics summary", async () => {
  const paginatedSessions = [
    {
      _id: new mongoose.Types.ObjectId("64f1f77bcf86cd7994390a11"),
      topic: "react",
      status: "completed",
      overallScore: 70,
      weakConcepts: ["hooks"],
    },
  ];
  const analyticsSessions = [
    {
      _id: new mongoose.Types.ObjectId("64f1f77bcf86cd7994390a11"),
      topic: "react",
      overallScore: 60,
      weakConcepts: ["hooks", "state"],
      completedAt: new Date("2026-05-01T10:00:00.000Z"),
    },
    {
      _id: new mongoose.Types.ObjectId("64f1f77bcf86cd7994390a12"),
      topic: "node",
      overallScore: 80,
      weakConcepts: ["streams"],
      completedAt: new Date("2026-05-02T10:00:00.000Z"),
    },
  ];

  mock.method(InterviewSession, "find", (query) => {
    if (query.status === "completed") {
      return createQuery(analyticsSessions);
    }

    assert.equal(query.userId, userId);
    return createQuery(paginatedSessions);
  });
  mock.method(InterviewSession, "countDocuments", async (query) => {
    assert.equal(query.userId, userId);
    return 2;
  });

  const history = await getUserInterviewHistory(userId, 1, 10);

  assert.equal(history.sessions.length, 1);
  assert.equal(history.pagination.total, 2);
  assert.equal(history.analytics.averageScore, 70);
  assert.equal(history.analytics.completedCount, 2);
  assert.deepEqual(
    history.analytics.improvementTrend.map((point) => point.score),
    [60, 80],
  );
  assert.deepEqual(history.analytics.weakConcepts[0], { concept: "hooks", count: 1 });
  assert.deepEqual(history.analytics.weakTopics[0], { topic: "react", count: 1 });
});
