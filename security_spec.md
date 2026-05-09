# Security Specification for Interactive

## Data Invariants
1. A Scene must belong to a valid Project and the user must own that Project.
2. An Interaction must belong to a valid Project and the user must own that Project.
3. Users can only read/write their own Projects.
4. Timestamps (`createdAt`, `updatedAt`) must be server-generated.
5. All IDs must be strictly validated.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a project with another user's `ownerId`.
2. **Project Injection**: Attempt to write a scene to a project the user doesn't own.
3. **Ghost Fields**: Add an `isAdmin: true` field to a project.
4. **Large Payload**: Send a 1MB string in the `videoPrompt` field.
5. **Timestamp Manipulation**: Set a manual `createdAt` in the future.
6. **Interaction Orphan**: Create an interaction without a corresponding project.
7. **Cross-Project Read**: Attempt to 'list' projects without the `ownerId` filter.
8. **Invalid ID**: Use a 2KB string as a project ID.
9. **State Shortcut**: Manually set status to 'completed' without processing.
10. **Type Poisoning**: Send a boolean as a 'duration'.
11. **Shadow Update**: Update a project's `ownerId` after creation.
12. **PII Leak**: Attempt to read user email from a unauthorized path.

## Test Runner (Draft)
The `firestore.rules` will be validated to block all the above.
