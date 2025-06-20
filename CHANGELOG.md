- Updated the Data Connect emulator to use pglite 0.3.x and Postgres 17, which fixes some crashes related to wire protocol inconsistencies. (#8679, #8658)
- Remove container cleanup logic in functions:delete command (#8771)
- Fixed an issue where the IAM enablement for GenKit monitoring would try to change an invalid service account. (#8756)
- Added a max instance default to function templates and comments educating users on cost controls. (#8772)
- Added caching to API enablement checks to reduce burn of `serviceusage.googleapis.com` quota.
- Updated the Firebase Data Connect local toolkit to v2.7.1, which includes the following changes
  - Kotlin codegen: Add a default value for the block\_ parameter to execute() so that it is not necessary to specify empty {} for operations with optional variables and none are specified.
  - Web SDK READMEs will link to other web framework READMEs for better discoverability.
