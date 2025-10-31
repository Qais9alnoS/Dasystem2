---
trigger: always_on
alwaysApply: true
---
## 🎯 Project Context
You are working on a **full-stack project** with a **frontend** and **backend**.  
Every feature on the frontend must have corresponding **API integrations** in the backend, and vice versa.

Before starting **any request or implementation**, you must:
- Carefully **read and analyze** the **“Unified Schemas & Architecture”** folder.
- Understand the **current state of the backend** before making any changes.
- Ensure that all work aligns with the **existing architecture and data flow**.

---

## 🚫 DO NOT

1. **Change the current ports:**
   - Frontend → `3000`
   - Backend → `8000`
   - If a port is occupied, **ask the user to collaborate** (e.g., close the process or confirm which one should run).  
     Do **not** automatically switch ports.

2. **Duplicate existing features.**  
   Before creating a new one, verify it **doesn’t already exist** in the codebase (even partially or in a similar form).

3. **Fix errors by ignoring types or deleting definitions** (`type ignore`, `def removal`, etc.) unless absolutely necessary.  
   When forced to do so, **pause and notify the user** before proceeding.

4. **Use demo or mock data.**  
   - Always pull real data from the **backend**.
   - Check the frontend’s `api.ts` for existing endpoints.
   - If the required endpoint doesn’t exist there, **search the backend**.
   - If it doesn’t exist in the backend either, **inform the user** and ask if they want to implement it.

---

## ✅ DO

1. **Clarify requests.**  
   - Always ask **detailed questions** until you fully understand the request that the user wants to implement.  
   - You are encouraged to **pause any process** to confirm the details.

2. **Plan before coding.**  
   - Once the request is 100% verified, **break it down into a To-Do list** (using the built-in To-Do feature).  
   - Do **not** mark the task as “done” until all To-Dos are completed and validated.

3. **Maintain a unified aesthetic** across the entire app.  
   - UI consistency, component reusability, and visual harmony are priorities.

4. **Follow this structured workflow:**
   1. **Think first** — read the relevant codebase files and understand the logic.  
   2. **Plan** — write your step-by-step tasks in the To-Do feature.  
   3. **Ask questions** if anything is uncertain — never assume.  
   4. **Verify the plan** with the user before proceeding.  
   5. **Implement changes** gradually, keeping things **simple and minimal-impact**.  
   6. **After each step**, provide a **high-level summary** of what was changed and why.  
   7. **Prioritize security** — no sensitive data in frontend, no exposed `.env` or private keys, no vulnerabilities.  
   8. **Check syntax and code validity** after every implementation.  
   9. **At the end**, re-check that all requested features are functional and integrated end-to-end.  
   10. **Review:** summarize all implemented changes at the end of the process in your To-Do review section.
5. **Maintain a unified aesthetic** across the entire app.  
   - UI consistency, component reusability, and visual harmony are priorities.
   - **Adhere to the design language and aesthetic found in the "IOS-Style-example.tsx" file as the primary design reference.**
---

## 🔐 Security Guidelines

- Always code as if you’re deploying to **production**.
- Never expose credentials, tokens, or `.env` values.
- Sanitize all user inputs and validate API data.
- Follow the principle of least privilege.
- Assume attackers can see your frontend — never put secrets there.

---

## 💡 Mindset Tips

- Think like a **senior engineer** mentoring a beginner — clarity and simplicity are key.
- Always ask: *“What would Mark Zuckerberg do?”* (i.e., scalable, clean, and efficient design choices).
- Keep all implementations **minimal, maintainable, and modular**.
- Focus on **clarity**, **security**, and **user experience consistency**.

---

## 🧾 Final Review Checklist

Before confirming a task is complete:
- [ ] All To-Do items are done and verified.  
- [ ] The feature works correctly and is fully integrated with backend APIs.  
- [ ] No mock data or placeholders remain.  
- [ ] No type ignores or insecure patches exist.  
- [ ] The design matches the unified aesthetic.  
- [ ] All code has been checked for syntax and security.  
- [ ] A short explanation of what was changed and how it works has been provided.  
