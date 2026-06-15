import { generateRecommendations } from "./ai-ml/pipeline/recommendationEngine.js";

// --- Test data ---
const MOCK_RESUME = {
  skills: ["React", "Node.js", "MongoDB", "Express", "JavaScript", "Tailwind CSS"],
  experience: ["2 years as Full Stack Developer", "Developed 5+ web applications"],
  resumeText:
    "Experienced Full Stack Developer with expertise in React and Node.js. Skilled in MongoDB and building scalable web apps.",
};

const MOCK_JOBS = [
  {
    _id: "job1",
    title: "Senior React Developer",
    skills: ["React", "Redux", "TypeScript"],
    description: "Looking for an expert React developer with at least 5 years of experience.",
  },
  {
    _id: "job2",
    title: "Junior Node.js Backend",
    skills: ["Node.js", "Express", "MongoDB"],
    description: "Great entry-level role for someone who knows the MERN stack basics.",
  },
  {
    _id: "job3",
    title: "Python Data Scientist",
    skills: ["Python", "Pandas", "Machine Learning"],
    description: "Data-heavy role requiring deep math knowledge.",
  },
];

// --- Assertions ---
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (!condition) {
    console.error(`[FAIL] ${label}`);
    failed++;
  } else {
    console.log(`[PASS] ${label}`);
    passed++;
  }
}

function assertRange(value, min, max, label) {
  assert(value >= min && value <= max, `${label} (got ${value}, expected ${min}–${max})`);
}

// --- Result printer ---
function printResults(results) {
  console.log("\n--- RANKED RECOMMENDATIONS ---");
  results.forEach((rec, index) => {
    const job = MOCK_JOBS.find((j) => j._id === rec.jobId);
    console.log(`${index + 1}. [${rec.score}%] ${job?.title ?? rec.jobId}`);
    console.log(`   Insights: ${rec.relevanceInsights}`);
    console.log(`   Skills: ${rec.skillMatch}% | Experience: ${rec.experienceMatch}%`);
    console.log("------------------------------");
  });
}

async function runTest() {
  console.log("[test] starting recommendation engine...");

  const results = await generateRecommendations(MOCK_RESUME, MOCK_JOBS);

  printResults(results);

  // 1. Returns array
  assert(Array.isArray(results), "returns array");

  // 2. Same count as input jobs
  assert(results.length === MOCK_JOBS.length, `result count matches job count (${MOCK_JOBS.length})`);

  // 3. Required fields on each result
  results.forEach((rec, i) => {
    assert(typeof rec.jobId === "string", `result[${i}] has jobId`);
    assert(typeof rec.score === "number", `result[${i}] has numeric score`);
    assert(typeof rec.skillMatch === "number", `result[${i}] has skillMatch`);
    assert(typeof rec.experienceMatch === "number", `result[${i}] has experienceMatch`);
    assert(typeof rec.relevanceInsights === "string", `result[${i}] has relevanceInsights`);
    assertRange(rec.score, 0, 100, `result[${i}] score in range`);
    assertRange(rec.skillMatch, 0, 100, `result[${i}] skillMatch in range`);
    assertRange(rec.experienceMatch, 0, 100, `result[${i}] experienceMatch in range`);
  });

  // 4. Sorted descending by score
  for (let i = 0; i < results.length - 1; i++) {
    assert(
      results[i].score >= results[i + 1].score,
      `result[${i}].score (${results[i].score}) >= result[${i + 1}].score (${results[i + 1].score})`
    );
  }

  // 5. MERN match beats Python (domain mismatch)
  const job2 = results.find((r) => r.jobId === "job2");
  const job3 = results.find((r) => r.jobId === "job3");
  assert(job2.score > job3.score, `MERN job (${job2.score}) scores higher than Python job (${job3.score})`);

  // 6. Python job is worst match
  const lastResult = results[results.length - 1];
  assert(lastResult.jobId === "job3", `Python job ranked last (got ${lastResult.jobId})`);

  // 7. All jobIds from input present in output
  const outputIds = results.map((r) => r.jobId);
  MOCK_JOBS.forEach((j) => {
    assert(outputIds.includes(j._id), `job ${j._id} present in output`);
  });

  // 8. Empty jobs array
  const emptyResult = await generateRecommendations(MOCK_RESUME, []);
  assert(Array.isArray(emptyResult) && emptyResult.length === 0, "empty jobs returns empty array");

  // 9. Empty skills resume doesn't crash
  try {
    const noSkillsResult = await generateRecommendations(
      { skills: [], experience: [], resumeText: "" },
      MOCK_JOBS
    );
    assert(Array.isArray(noSkillsResult), "empty resume returns array without crash");
  } catch {
    assert(false, "empty resume should not throw");
  }

  // --- Summary ---
  console.log(`\n[done] ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTest().catch((err) => {
  console.error("[error]", err.message);
  process.exit(1);
});