---
trigger: always_on
---

## Project Context

You are working on a full-stack project with a frontend and backend.
Every feature on the frontend must have corresponding API integrations in the backend, and vice versa.

Before starting any request or implementation, you must:

- Carefully read and analyze the **“Unified Schemas & Architecture”** folder.
- Understand the current state of the backend before making any changes.
- Ensure that all work aligns with the existing architecture and data flow.

---

## New Rule (Added as requested)

- The AI **must not generate markdown analysis, summaries, or similar outputs unless the user explicitly asks for them**.

---

## Do Not

1. Do not change the current ports:

   - Frontend → `3000`
   - Backend → `8000`
     If a port is occupied, ask the user to collaborate. Do not automatically switch ports.

2. Do not duplicate existing features. Always check the codebase to verify whether the feature already exists partially or fully.

3. Do not fix errors by ignoring types or deleting type definitions unless absolutely necessary. If forced to do so, pause and notify the user first.

4. Do not use demo or mock data.
   Always use real data from the backend:

   - Check `api.ts` for endpoints.
   - If the endpoint doesn’t exist there, search the backend.
   - If it doesn’t exist at all, notify the user and ask whether to implement it.

5. Do not make any .md files for summarize or analysis exept when the user asks to

---

## Do

1. **Clarify requests** before implementing anything. Ask detailed questions when needed.

2. **Plan before coding**.
   Once the request is clear, break it into a To-Do list.
   Do not mark anything “done” until it is implemented and verified.

3. Maintain **a unified aesthetic** across the entire app.
   Follow the design language in **"IOS-Style-example.tsx"**.

4. Follow this structured workflow:

   1. Read and understand relevant files before writing code.
   2. Plan using the To-Do tool.
   3. Ask questions when uncertain.
   4. Confirm the plan with the user.
   5. Implement changes gradually and minimally.
   6. After each step, provide a high-level explanation of what changed and why.
   7. Prioritize security.
   8. Check syntax and validity continuously.
   9. Ensure the feature works end-to-end.
   10. Review all changes when done.

---

## Security Guidelines

- Code as if deploying to production.
- Never expose credentials or `.env` values.
- Validate and sanitize all inputs.
- Follow the principle of least privilege.
- Assume the frontend is public and untrusted.

---

## Mindset

- Think like a senior engineer guiding a beginner.
- Keep everything simple, clean, scalable, and maintainable.
- Focus on clarity, security, and a consistent user experience.

---

## Final Review Checklist

Before a task is complete:

- All To-Dos are done and verified.
- Feature works and is fully integrated with backend APIs.
- No mock data remains.
- No type ignores or insecure fixes remain.
- Design matches the unified aesthetic.
- Code passes syntax and security checks.
- A brief explanation of what changed has been provided.
