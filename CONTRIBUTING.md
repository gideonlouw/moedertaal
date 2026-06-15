# Contributing to Moedertaal

Thank you for helping make programming more welcoming across languages.

## Getting Started

1. Fork and clone the repository.
2. Use Node.js 20 or newer.
3. Run `npm test`.
4. Create a focused branch for your change.
5. Add or update tests with behavior changes.
6. Open a pull request explaining the reason for the change.

## Adding a Spoken Language

1. Add a UTF-8 JSON language pack in `languages`.
2. Include a short, unique language code and its native name.
3. Translate every keyword, value, logical operator, and error message.
4. Add a program in `examples`.
5. Add a test showing that the program works.

Translations should be reviewed by a fluent speaker. Prefer words that feel
natural in code rather than literal translations that may be confusing.

## Design Principles

- A beginner should be able to read a small program aloud.
- Every writing system should work equally well.
- The core language meaning stays consistent across translations.
- Language packs should not require changes to the interpreter.
- Error messages should be clear and point to the relevant line.

## Pull Requests

Keep changes small enough to review comfortably. Explain new syntax with an
example, and update the README when users need to know about it.
