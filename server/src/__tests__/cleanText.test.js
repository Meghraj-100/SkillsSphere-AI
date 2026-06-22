import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { cleanJDText } from "../utils/cleanText.js";

describe("cleanJDText", () => {
  test("removes bullet points and normalizes whitespace", () => {
    const input = "Experience with React\n  and Node.js";
    const result = cleanJDText(input);
    assert.equal(result, "Experience with React and Node.js");
  });

  test("removes dash bullet points", () => {
    const input = "- Led a team of 5 engineers\n- Shipped 3 features";
    const result = cleanJDText(input);
    assert.equal(result, "Led a team of 5 engineers Shipped 3 features");
  });

  test("removes asterisk bullet points", () => {
    const input = "* Strong communication skills\n* Team player";
    const result = cleanJDText(input);
    assert.equal(result, "Strong communication skills Team player");
  });

  test("removes bullet unicode characters", () => {
    const input = "• Experience with Python\n• Familiar with CI/CD pipelines";
    const result = cleanJDText(input);
    assert.equal(result, "Experience with Python Familiar with CI/CD pipelines");
  });

  test("collapses multiple spaces into a single space", () => {
    const input = "Software    Engineer     with   experience";
    const result = cleanJDText(input);
    assert.equal(result, "Software Engineer with experience");
  });

  test("trims leading and trailing whitespace", () => {
    const input = "   Senior Developer   ";
    const result = cleanJDText(input);
    assert.equal(result, "Senior Developer");
  });

  test("handles empty string", () => {
    const result = cleanJDText("");
    assert.equal(result, "");
  });

  test("handles null input by using default parameter", () => {
    const result = cleanJDText(null);
    assert.equal(result, "");
  });

  test("handles undefined input by using default parameter", () => {
    const result = cleanJDText(undefined);
    assert.equal(result, "");
  });

  test("handles non-string input (number) by returning empty string", () => {
    const result = cleanJDText(12345);
    assert.equal(result, "");
  });

  test("handles non-string input (object) by returning empty string", () => {
    const result = cleanJDText({ text: "hello" });
    assert.equal(result, "");
  });

  test("handles input with only bullets and whitespace", () => {
    const input = "  •  \n  -  \n  *  ";
    const result = cleanJDText(input);
    assert.equal(result, "");
  });

  test("handles input with mixed bullet types", () => {
    const input = "Job Requirements:\n• 5+ years experience\n- Strong JavaScript skills\n* Agile methodology";
    const result = cleanJDText(input);
    assert.equal(result, "Job Requirements: 5+ years experience Strong JavaScript skills Agile methodology");
  });
});
