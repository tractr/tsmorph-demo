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

# **Generate typescript code with ts-morph**

---

# Our use case:

Generate repetitive code that depends on the application data models.

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

```sh
api/src/generated
├── role
│   ├── role.controller.ts
│   └── role.dto.ts
└── user
    ├── user.controller.ts
    └── user.dto.ts
```

</div>
</div>

---

**Currently, we use string templates to generate code**

<div class="columns">
<div>

generator function

```typescript
function generateController(model) {
  return `export class ${model.name}Controller {}`;
}
```

</div>
<div>

result

```typescript
export class UserController {}
```

</div>
</div>

**But we're looking for a better way that's type safe**

<div class="columns">
<div>

generator function

```typescript
function generateController(model) {
  return {
    kind: StructureKind.Class,
    name: `${model.name}Controller`
    isExported: true
  }
}
```

</div>

<div>

result

```typescript
export class UserController {}
```

</div>

</div>

---

# What is ts-morph ?

From the `ts-morph` documentation:

> Setup, navigation, and manipulation of the TypeScript AST can be a challenge. This library wraps the TypeScript compiler API so it's simple.

## AST: Abstract syntax tree ?

From [wikipedia](https://en.wikipedia.org/wiki/Abstract_syntax_tree)

> An abstract syntax tree (AST), is a tree representation of the abstract syntactic structure of text (often source code) written in a formal language. Each node of the tree denotes a construct occurring in the text.

Let's see the typescript AST: [AST viewer](https://ts-ast-viewer.com/#code/C4TwDgpgBAqgzhATlAvFA3gKCjqA7AQwFsIAuKOYRASzwHMBubXCIg6gG3MpvqdyhgCcOAHcA9ogAm3KrUaYAvk0wQAHmEnAoAMwCueAMbBq4vFEMALCIYDWAQT3BreE4YImzACj0JE5eCQAGihWdi4KOXoQoREJaVleOgBKDGYcah0oHz8AOjDOKABCFDQCjlTnRHFRfAhagFFEasQvAHIASTwANwIOailQtk425P5cTOzfJFzYsUlBkrQ5+KlKy2ravHqoJpb2rt7+wZWF0fGcRAhgPURzacQmRSA)

---

## What is the AST used for ?

Convert code as string into AST is called **parsing**. Parsers are involved in many tools that transform some source code:

- compilers
- bundlers
- linters
- formatters
- **The browser parses html string into a DOM tree.**

---

# Write the generator

<div class=columns>

<div>
The model object (generator input)

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
Generated code (generator output)

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

## The `generate` function

```typescript
export function generate(dmmf: DMMF) {
  // Instantiate the ts project
  const project = new Project({
    tsConfigFilePath: tsConfigPath,
  });

  // Clear generation directory
  project.getDirectory(generatedDirectoryPath)?.clear();

  // Generate controllers and dtos
  dmmf.datamodel.models.forEach((model) => {
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

## The `generateControllerSourceFile` function

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

## The `generateControllerClass` function

```typescript
export function generateControllerClass(
  model: DMMF.Model
): ClassDeclarationStructure {
  const className = `${pascal(model.name)}Controller`;

  const properties = [
    generateStateProperty(model),
    generateUniqueFieldsProperty(model),
  ];

  const methods = [
    generateCreateMethod(model),
    generateFindManyMethod(),
    generateCheckUniquenessConstraintMethod(model),
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

# Test the generator

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

# Another use case: code refactoring

A quick example from [this article](https://blog.kaleidos.net/Refactoring-Typescript-code-with-ts-morph/): split files containing many classes

```typescript
project.getSourceFiles().forEach((sourceFile) => {
  // We search for all file classes
  const classes = sourceFile.getClasses();

  // If there is more than one we begin the changes
  if (classes.length > 1) {
    // Split your classes in separated files
  }

  // We save the changes in the original file so that the removed classes disappear
  sourceFile.save();
});
```

---

# In conclusion

**When comparing `ts-morph` VS manipulate the code as a string:**

- it's format independent
- it's safer
- it allows more complex manipulations
- it's more verbose (can be overkill for simple things)
- it can only generate typescript

**When comparing `ts-morph` VS `typescript` compiler api:**

- it _seems_ easier
- it's less up to date
- it's less complete

---

# Resources

[Repository containing the POC/demo and presentation](https://github.com/tractr/tsmorph-demo)

**ts-morhp**

- [The ts-morph documentation](https://ts-morph.com/).
- [An article about using ts-morph for code refactoring](https://blog.kaleidos.net/Refactoring-Typescript-code-with-ts-morph/).
- [Prisma generators documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/generators).

**typescript compiler**

- [typescript compiler article](https://www.huy.rocks/everyday/04-01-2022-typescript-how-the-compiler-compiles)
- [typescript compiler api doc](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)

**other tools in the repo**

- [Nx](https://nx.dev/).
- [Marp](https://marp.app/) to write slides decks with markdown.
