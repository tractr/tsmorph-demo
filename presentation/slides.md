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
  .columns3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }
---

# Generate Code with ts-morph

Ajouter un petit logo Tractr / ts-morph et nos petits noms

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

> Setup, navigation, and manipulation of the TypeScript AST can be a challenge. This library wraps the TypeScript compiler API so it's simple.

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

## Abstract syntax tree ?

From [wikipedia](https://en.wikipedia.org/wiki/Abstract_syntax_tree)

> An abstract syntax tree (AST), is a tree representation of the abstract syntactic structure of text (often source code) written in a formal language. Each node of the tree denotes a construct occurring in the text.

Let's see the typescript AST: [AST viewer](https://ts-ast-viewer.com/#code/C4TwDgpgBAqgzhATlAvFA3gKCjqA7AQwFsIAuKOYRASzwHMBubXCIg6gG3MpvqdyhgCcOAHcA9ogAm3KrUaYAvk0wQAHmEnAoAMwCueAMbBq4vFEMALCIYDWAQT3BreE4YImzACj0JE5eCQAGihWdi4KOXoQoREJaVleOgBKDGYcah0oHz8AOjDOKABCFDQCjlTnRHFRfAhagFFEasQvAHIASTwANwIOailQtk425P5cTOzfJFzYsUlBkrQ5+KlKy2ravHqoJpb2rt7+wZWF0fGcRAhgPURzacQmRSA)

---

## AST in the Typescript compiler:

![width:600px](https://raw.githubusercontent.com/huytd/everyday/master/_meta/tsc-overview.png)

---

# Generate code with ts-morph

## Load the project with ts morph

```typescript
import { Project } from 'ts-morhp';

// Instantiate the ts project
const project = new Project({
  tsConfigFilePath: absoluteTsConfigFilePath,
  // skipAddingFilesFromTsConfig: true
});
```

---

_libs/generator/src/lib/generate.ts_

```typescript
import { DMMF } from '@prisma/generator-helper';
import { Project } from 'ts-morhp';

export function generate(dmmf: DMMF) {
  // Instantiate the ts project
  const project = new Project({
    tsConfigFilePath: absoluteTsConfigFilePath,
  });

  // Clear generation directory
  project.getDirectory(absoluteGeneratedDirectory)?.clear();

  // Generate controllers and dtos
  dmmf.datamodel.models.forEach((model) => {
    const entityPath = `${absoluteGeneratedDirectory}/${kebab(model.name)}`;
    generateControllerSourceFile(project, model, entityPath);
    generateCreateDtoSourceFile(project, model, entityPath);
  });

  // Remove unused imports
  project
    .getSourceFiles()
    .map((sourceFile) => sourceFile.fixUnusedIdentifiers());

  // Save project to file system
  project.saveSync();
}
```

---

## Generate code depending on the data models

<div class=columns3>
<div>
prisma schema

```typescript
model User {
  id      Int      @id
  email   String   @unique
  name    String?
  role    Role     @relation(...)
  roleId  Int
}
```

</div>

<div>
The prisma model object

```typescript
interface Model {
  name: string;
  dbName: string | null;
  fields: Field[];
  uniqueFields: string[][];
  uniqueIndexes: uniqueIndex[];
  documentation?: string;
  primaryKey: PrimaryKey | null;
  [key: string]: any;
}
```

</div>

<div>
Output controller

```typescript

@Controller(['user'])
export class UserController {
  state: UserDto[] = [];
  uniqueFields = ['email'] as const;

  @Post()
  create(@Body() data: UserDto) {
    ...
  }

  @Get()
  findMany() {
    ...
  }

  checkUniquenessConstraint(
    data: UserDto
  ) {
    ...
  }
}
```

</div>

---

## Manipulate AST structures

_generate the controller file_

```typescript
export function generateControllerSourceFile(
  project: Project,
  model: DMMF.Model,
  path: string
) {
  const fileName = `${kebab(model.name)}.controller.ts`;
  const filePath = `${path}/${fileName}`;

  const sourceFile = project.createSourceFile(filePath);

  const controllerClass = generateControllerClass(model);
  const controllerImports = generateImports(model);

  sourceFile.addImportDeclarations(controllerImports);
  sourceFile.addClass(controllerClass);
}
```

---

_generate the controller class_

```typescript
export function generateControllerClass(
  model: DMMF.Model
): ClassDeclarationStructure {
  const className = `${pascal(model.name)}Controller`;
  const properties = [
    generateStateProperty(model),
    ...(containsUniqueFields(model)
      ? [generateUniqueFieldsProperty(model)]
      : []),
  ];
  const methods = [
    generateCreateMethod(model),
    generateFindManyMethod(),
    ...(containsUniqueFields(model)
      ? [generateCheckUniquenessConstraintMethod(model)]
      : []),
  ];

  return {
    kind: StructureKind.Class,
    name: className,
    isExported: true,
    decorators: [
      { name: 'Controller', arguments: [`['${kebab(model.name)}']`] },
    ],
    properties,
    methods,
  };
}
```

---

_Generate a method with string manipulation_

```typescript
export function generateCheckUniquenessConstraintMethod(
  model: DMMF.Model
): MethodDeclarationStructure {
  const dataParameter: ParameterDeclarationStructure = {
    kind: StructureKind.Parameter,
    name: 'data',
    type: `${pascal(model.name)}Dto`,
  };

  // Statements with a template literal
  const statements = `
  this.uniqueFields.forEach(uniqueField => {
    const conflict = this.state.some(existingData => existingData[uniqueField] === data[uniqueField]);
    if (conflict) throw new ConflictException();
  })
  `;

  return {
    kind: StructureKind.Method,
    name: 'checkUniquenessConstraint',
    scope: Scope.Private,
    statements,
    parameters: [dataParameter],
  };
}
```

---

# Test the generators

_For pure functions that return structure depending on the model_

```typescript
describe('generateStateProperty', () => {
  it('should return valid state property structure', () => {
    const model = {
      name: 'Test',
      dbName: 'Test',
      primaryKey: null,
      uniqueFields: [],
      uniqueIndexes: [],
      fields: [],
    };

    const expectedMethodStructure = {
      kind: StructureKind.Property,
      name: 'state',
      scope: 'private',
      initializer: '[]',
      type: 'TestDto[]',
    };

    const result = generateStateProperty(model);

    expect(result).toEqual(expectedMethodStructure);
  });
});
```

---

_For functions that manipulate the project by reference_

```typescript
describe('generateSourceFile', () => {
  it('should add a sourceFile to the project', () => {
    const project = new Project();

    const model = {
      name: 'Test',
      dbName: 'Test',
      primaryKey: null,
      uniqueFields: [],
      uniqueIndexes: [],
      fields: [],
    };

    generateControllerSourceFile(project, model, 'test-path');

    const createdSourceFile = project.getSourceFile(
      'test-path/test.controller.ts'
    );

    const createdClass = createdSourceFile?.getClasses()[0];

    expect(createdSourceFile).toBeDefined();
    expect(createdClass).toBeDefined();
    expect(createdClass.getName()).toEqual('TestController');
  });
});
```

---

# Code refactoring

A quick example from [this article](https://blog.kaleidos.net/Refactoring-Typescript-code-with-ts-morph/): split files containing many classes

```typescript
project.getSourceFiles().forEach((sourceFile) => {
  // We search for all file classes
  const classes = sourceFile.getClasses();

  // If there is more than one we begin the changes
  if (classes.length > 1) {
    // We get the file directory because we are going to use it to create the new files
    const directory = sourceFile.getDirectory();
    const classesToMove = classes.slice(1);

    // We go class by class creating a file with the name and its content. When finished we delete the class from the original file
    classesToMove.forEach((c) => {
      directory.createSourceFile(`${c.getName()}.ts`, c.getText());
      itClass.remove();
    });

    // We apply the changes to the folder
    directory.save();
  }

  // We save the changes in the original file so that the removed classes disappear
  sourceFile.save();
});
```

---

# In conclusion (pros and cons)

**When comparing `ts-morph` VS manipulate the code as a string:**

- it's format independent
- it's safer
- it allows more complex manipulations
- it's more verbose (can be overkill for simple things)
- Some performance issues on Github. That could be a con

**When comparing `ts-morph` VS `typescript` compiler api:**

- it _seems_ easier
- it's less up to date
- it's less complete

---

# Other points to dig

- Performances when generating a lot of files.
- Performances when instantiating projects in unit-tests.
- Compare `ts-morph` VS using `typescript` directly.

---

# Resources

**ts-morhp**

- [The ts-morph documentation](https://ts-morph.com/).
- [An article about using ts-morph for code refactoring](https://blog.kaleidos.net/Refactoring-Typescript-code-with-ts-morph/).
- [Prisma generators documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/generators).

**typescript compiler**

- [typescript compiler article](https://www.huy.rocks/everyday/04-01-2022-typescript-how-the-compiler-compiles)
- [typescript compiler api doc](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)

**other tools in the repo**

- [Nx](https://nx.dev/).
- [Nestjs](https://nestjs.com/).
- [Nestjs swagger plugin](https://docs.nestjs.com/openapi/introduction).
- [Marp](https://marp.app/) to write slides decks with markdown.
