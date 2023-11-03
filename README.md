# Sofie: The Modern TV News Studio Automation System (Prompter Editor)

_Note: This is a mono-repo._

## Introduction and Quick Start

## File structure

This is a mono-repo, all packages resides in [shared/packages](shared/packages) and [apps/](apps/).

## For Developers

Be sure to read the [FOR DEVELOPERS](/FOR_DEVELOPERS.md) documentation.

Note: This mono-repo uses [Yarn](https://yarnpkg.com) and [Lerna](https://github.com/lerna/lerna), so most commands can be run on the root folder (no need to cd into each package).

Initialize repo:

```bash
# install lerna globally
yarn global add lerna@

# Set up monorepo and install all dependencies
yarn

# Initial build
yarn build

# Spin up dev server & watch for changes
yarn dev

```

Now you should be good to go.

Before any code is committed, run these:

```bash
# Lint all packages
yarn lint

# Run all tests
yarn test
```

```

```
