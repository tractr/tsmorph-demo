---
---

# Generate typescript with ts-morph

- Dev @tractr
- Strongly rely on code generation

---

## SLIDE 1: Tractr's use case

- Generate repetitive code like REST/graphql api
- From now, rely on string manipulation
- POC to start using ts-morph
- explain PRISMA: generated ORM
- Run the repo demo

---

## SLIDE 2: What is ts-morph ?

- library to manipulate ts AST
- wraps ts compiler

---

## SLIDE 3: What is typescript AST ?

- Abstract syntax tree
- Data structure representing the program code
- ts-morph uses typescript parser to get the AST and add helpers

---

## SLIDE 4:

### Manipulate / generate code using AST VS string

Manipulate code by using its AST form brings the next benefits:

- Format independent
- Safer, less error prone
- Makes complex manipulations possible

but can be overkill for simple things.

Example where of the format independent argument

```typescript
export class Dog extends Animal {}
```

### Use prisma schema as an input to generate code

Prisma is a database ORM that uses a schema representing the data model to generate
a type safe database client, migrations and more.

It uses 'generators' that are functions that take the schema as an input, and generate some code.

ADD A LINK TO THE DEMO PRISMA SCHEMA

### Generate some code

- Présenter le generate.ts
  -> On récupère la modélisation
  -> On instancie le project avec ts-morph
  -> On vire le dossier generate si il existe
  -> On itère sur les models et on génère les dtos et controllers
  -> on remove les unused imports
  -> on save sur le disk
- Note: les fonctions de générations sont des fonctions pures qui prennent un model en entrée et renvoie des structures (AST)
- Présenter l'ajout de fichier
- présenter l'ajout de classes et le structures

### Test the code generator

Possibilités pour les tests:

- soit unit test classiques: les generators sont des fonctions pures, donc on mock l'entrée on check la sortie
- autre possibilité à tester: On écrit le fichier `ts` attendu en sortie, et dans le test, on le parse et compare sont AST avec celui qui sort de la fonction

## Resources

articles:

- typescript compiler resources: https://www.huy.rocks/everyday/04-01-2022-typescript-how-the-compiler-compiles
- code refactoring with ts-morph: https://blog.kaleidos.net/Refactoring-Typescript-code-with-ts-morph/

docs:

- Demo repository: https://github.com/tractr/tsmorph-demo
- ts-morph
- prisma generators
- typescript compiler api: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

QUESTION @Edouard: est ce que je roule la démo en live ? Avant ou après avoir éplucher le code ?
