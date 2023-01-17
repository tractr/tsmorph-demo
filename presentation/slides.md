---
marp: true
theme: default
_class: lead
paginate: true
style: |
  .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
---

# Generate Code with ts-morph

---

# Our use case:

Generate repetitive code that depends on data models.

<div class="columns">
<div>

## Input : prisma schema

```typescript
model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  name    String?
  role   Role   @relation(fields: [roleId], references: [id])
  roleId Int
}

model Role {
  id     Int    @id @default(autoincrement())
  name    String
  users User[]
  rights Right[]
}
```

</div>
<div>

## Output: typescript code

```typescript
export class UserDto {
  id!: number;
  email!: string;
  name!: string | null;
  roleId!: number;
}
```

```typescript
export class RoleDto {
  id!: number;
  name!: string;
}
```

</div>
</div>

---

# What is ts-morph ?

From the `ts-morph` documentation:

> Setup, navigation, and manipulation of the TypeScript AST can be a challenge. This library wraps the TypeScript compiler API so it's simple.«

_example:_

```typescript
import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'path/to/tsconfig.json',
});

const sourceFile = project.addSourceFileAtPath('path/to/file.ts');

sourceFile.addClass({
  // Object describing a class AST node
});
```

---

# Abstract syntax tree ?

From [wikipedia](https://en.wikipedia.org/wiki/Abstract_syntax_tree)

> An abstract syntax tree (AST), is a tree representation of the abstract syntactic structure of text (often source code) written in a formal language. Each node of the tree denotes a construct occurring in the text.

Let's see the typescript AST: [AST viewer](https://ts-ast-viewer.com/#code/C4TwDgpgBAqgzhATlAvFA3gKCjqA7AQwFsIAuKOYRASzwHMBubXCIg6gG3MpvqdyhgCcOAHcA9ogAm3KrUaYAvk0wQAHmEnAoAMwCueAMbBq4vFEMALCIYDWAQT3BreE4YImzACj0JE5eCQAGihWdi4KOXoQoREJaVleOgBKDGYcah0oHz8AOjDOKABCFDQCjlTnRHFRfAhagFFEasQvAHIASTwANwIOailQtk425P5cTOzfJFzYsUlBkrQ5+KlKy2ravHqoJpb2rt7+wZWF0fGcRAhgPURzacQmRSA)

---

# Typescript compiler overview:

![width:600px](https://raw.githubusercontent.com/huytd/everyday/master/_meta/tsc-overview.png)

---

# Generating code

---

# Load the project with ts morph

---

# Generate code dependeng on the data models

---

# Test the generators

---

# Code refactoring

---

# Wrap it up (pros and cons)
