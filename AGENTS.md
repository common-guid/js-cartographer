1. the file IMPLEMENTATION_PLAN.md contains the development plan. This file will guide your operations and decisions on development
2. See the .specs directory for the 6 implementation phases, as well as an outline describing each of the 6 phases.
3. Be sure to ask the user any clarifying questions you have about the next step or phase in the IMPLEMENTATION plan. If you have no questions then proceed with the next section of the plan.
4. review the LOG_BOOK.md file this file will be used to log each of the tasks, outside of the scope of the IMPLEMENTATION plan, that the agent (you) have completed. For each feature or fix you complete append a new section to the LOG_BOOK.md file in the following format:
```markdown
## name of feature or fix | date of completion
1 or 2 sentence description of the feature or fix.
```
5. **Completion Criteria:**
    Upon completing each feature or fix assigned to you you must: 
    - append an entry to the LOG_BOOK.md file with a summary of the actions taken and a description of the task.
    - generate test cases for each feature to validate the implementation.
6. whenever possible Dockerize the application and use docker compose. 
7. IF using python: ALWAYS use a python virtual env for python if not in a container.
8. **Test Fixtures:** The `fixtures/` directory contains known source code that has been pre-bundled to serve as validation targets.
   - `fixtures/webpack-hello-world/` is a small webpack 5 + Babel (IE11) application whose `dist/bundle.js` is the primary test input for JS Cartographer. The `src/` directory contains the original, human-readable source and acts as the **ground truth** for evaluating deobfuscation quality.
   - When validating any phase of the implementation plan, run JS Cartographer against `fixtures/webpack-hello-world/dist/bundle.js` and compare the recovered output against the known source in `fixtures/webpack-hello-world/src/`.
   - The bundle intentionally exercises async/await (generator transpilation), ES6 classes (prototype transpilation), cross-file imports, and named functions — making it a comprehensive end-to-end test target.
