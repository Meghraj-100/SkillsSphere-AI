import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSkill, normalizeSkillArray } from "../../utils/skillNormalizer.js";

test("should normalize synonyms correctly", () => {
  assert.equal(normalizeSkill("JS"), "javascript");
  assert.equal(normalizeSkill("JavaScript"), "javascript");
  assert.equal(normalizeSkill("Node JS"), "nodejs");
  assert.equal(normalizeSkill("Node.js"), "nodejs");
});

test("should normalize case and spacing variations", () => {
  assert.equal(normalizeSkill(" ReactJS "), "react");
  assert.equal(normalizeSkill("node-js"), "nodejs");
});

test("should handle unknown skills (fallback)", () => {
  assert.equal(normalizeSkill("Super-Skill"), "superskill");
  assert.equal(normalizeSkill("Super Skill"), "superskill");
});

test("should remove duplicates after normalization", () => {
  const result = normalizeSkillArray(["JS", "JavaScript"]);
  assert.deepEqual(result, ["javascript"]);
});

test("should match arrays correctly", () => {
  const resume = normalizeSkillArray(["JS", "Node", "Mongo"]);
  const jd = normalizeSkillArray(["JavaScript", "Node.js", "MongoDB"]);

  const matched = resume.filter(skill => jd.includes(skill));

  assert.equal(matched.length, 3);
});

test("should handle special characters", () => {
  assert.equal(normalizeSkill("C#"), "csharp");
  assert.equal(normalizeSkill(".NET"), "dotnet");
});

test("should handle complex variations", () => {
  assert.equal(normalizeSkill("node   js"), "nodejs");
  assert.equal(normalizeSkill("React---JS"), "react");
});
