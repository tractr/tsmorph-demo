---
---

# Generate typescript code with ts-morph

## SLIDE 1: Generate typescript with ts-morph

- Dev @tractr
- we work with startups, so a lot of early stage projects
- involves many data models changes

---

## SLIDE 2: Tractr's use case

- Generate repetitive code like REST/graphql api
- Input: an object that describe the data models
- Output: repetitive code
- For this exemple we use prisma as a data model object
- Prisma: ORM that relies on generation from a schema

Workflow: when there is a new feature, we update the model, and run the generation to update the REST api

---

## SLIDE 3: Explain he POC

- From now, rely on string templates
- Looking for a safer/better way

Explain analogy with HTML:

- Using string is like using php template to manipulate html string
- we would like to manipulate html via the dom for safety/types
- and if there could be a jquery equivalent, it'd be nice

THATS WHY WE STARTED A POC TO USE TSMORPH

---

## SLIDE 4: What is ts-morph ?

Two important points:

- wraps ts compiler
- to manipulate typescript AST

What the AST: Tree data structure representing our program
See how it looks

## SLIDE 5: What is the AST used for ?

- Transform code into something else (compile, lint, format)
- turn code to ast is called 'parsing'
- the dom analogy returns: browsers parses html to dom
- (ts string <=> html string)
- (tsc <=> raw dom)
- (tsmorhp <=> jquery)

THAT's exactly what we want to do, and what ts-morph is made for

---

## slide 6: write the code generator with ts-morph

THE GENERATOR SIGNATURE:

- input: data models
- output: generated code (a controller for a rest api)

---

## slide 7: the `generate` function

it's the root of the generation.

STEPS:

- load the project
- clean the `generated` directory
- generate the new files
- remove unused identifiers
- save the project to the disk

REMARKS:

- project ast loaded in memory when instantiating `project`.
- must specify path to the ts-config as it's the entry point.
- while manipulating the ast, everything happen in memory.
- nothing is written to the disk until you call the related methods.
- dispatch work to the sourcefile generators.

---

## SLIDE 8: the `generateControllerSourceFile` function

SIGNATURE:

- project: edit the project by ref to add a file
- models: file path and content depends on the model
- path to add the file

THIS FUNCTION:

- Create a sourcefile in the project
- Fill it with a class and imports

REMARKS:

- Function is not pure as it edits the project ref

Now let's see how the class is generated

---

## SLIDE 9: the `generateControllerClass` function

SIGNATURE:

- models: file path and content depends on the model

THIS FUNCTION:

- Create a `ClassDeclarationStructure` describing the class and return it
- delegate the generation of smaller structures to other functions

REMARKS:

- Function pure as it edits the project ref
- All smaller functions work in a similar way

---

## SLIDE 10: Test the generator: pure functions

Tests for pure function are simple:

- Create a mocked model
- Call the generator function
- Assert that the result is correct

---

## SLIDE 11: Test the generator: impure functions

Tests for pure function are simple:

- Create an empty project
- Create a mocked model
- Call the generator function
- Assert that the project ref as a new file with the generated class

---

## SLIDE 12: Another use case: code refactoring

ts-morph can be used for refactoring:

- complex request can be made to navigate / manipulate the AST
- Search for all files with several classes
- split it in several files

---

## SLIDE 13: Conclusion

---

## SLIDE 14: Resources

---
