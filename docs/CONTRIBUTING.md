Contributing Guide
==================

Thanks for your interest in contributing to this project! This document aims to
serve as a friendly guide for making your first contribution.

### Cloning the project

```sh
git clone https://github.com/balena-io-modules/autoui.git
cd autoui
```

### Installing npm dependencies

```sh
npm install
```

### Running autoui

TBD

Adding new components
---------------------

Please open an issue to discuss any new components before starting work on
them.

Testing
-------

To run the test suite, run the following command:

```sh
npm test
```

We encourage our contributors to test the library before sending a pull request.

*The test suite is run automatically by CI servers when you send a pull
request.*

We make use of [EditorConfig] to communicate indentation, line endings and
other text editing default. We encourage you to install the relevant plugin in
your text editor of choice to avoid having to fix any issues during the review
process.

Commit Guidelines
-----------------

See [COMMIT-GUIDELINES.md][COMMIT-GUIDELINES] for a thorough guide on how to
write commit messages.

Sending a pull request
----------------------

When sending a pull request, consider the following guidelines:

- Write a concise commit message explaining your changes.

- If applies, write more descriptive information in the commit body.

- If your change affects the visuals of the library, consider attaching a
screenshot.

- Refer to the issue/s your pull request fixes, so they're closed automatically
when your pull request is merged.

- Write a descriptive pull request title.

- Squash commits when possible, for example, when committing review changes.

Before your pull request can be merged, the following conditions must hold:

- The linter doesn't throw any warning.

- All the tests pass.

- The coding style aligns with the project's convention.

Don't hesitate to get in touch if you have any questions or need any help!

[COMMIT-GUIDELINES]: COMMIT-GUIDELINES.md
[EditorConfig]: http://editorconfig.org
