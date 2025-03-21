> [!NOTE]  
> This repository was archived on 2025/03/17 and will not receive any updates.

# Sofie Prompter Editor

This is the _Sofie Prompter Editor_ application of the [_**Sofie** TV Automation System_](https://github.com/nrkno/Sofie-TV-automation/), allowing WYSIWYG editing nad realtime control of the _Sofie_ prompter.

## General Sofie System Information

- [_Sofie_ Documentation](https://nrkno.github.io/sofie-core/)
- [_Sofie_ Releases](https://nrkno.github.io/sofie-core/releases)
- [Contribution Guidelines](CONTRIBUTING.md)
- [License](LICENSE)

---

## Developer Information

Note: This monorepo uses [_Yarn_](https://yarnpkg.com) and [_Lerna_](https://github.com/lerna/lerna), so most commands can be run on the root folder (no need to `cd` into each package).

### File Structure

This is a monorepo, all packages resides in [shared/packages](shared/packages) and [apps/](apps/).

### Initializing

```bash
# Set up monorepo and install all dependencies
yarn

# Initial build
yarn build

# Spin up dev server & watch for changes
yarn dev

```

Now you should be good to go.

### Storage

Some application settings will be persisted by the Backend application. These will be stored in the path indicated by environment variable `STORAGE_DIR`, or inside user's home directory, inside a directory called `.sofie-prompter-editor`, if the environment variable isn't set.

### Before Committing Code

Before any code is committed, run these:

```bash
# Build all packages
yarn build

# Lint all packages
yarn lint

# Run all unit tests
yarn test
```

_The NRK logo is a registered trademark of Norsk rikskringkasting AS. The license does not grant any right to use, in any way, any trademarks, service marks or logos of Norsk rikskringkasting AS._
