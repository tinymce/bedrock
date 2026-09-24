# Contributing to Bedrock

Bedrock is a mini-monorepo managed by bun workspaces and lerna. 

To build:
  
    bun install
    bun run build

To test:

    bun run test
    
There are specific bun scripts to test each module.

# Modules

- bedrock-client - the UnitTest and Assert libraries used to write tests
- bedrock-server - the bedrock command-line app and grunt task
- bedrock-runner - a web page loaded by bedrock-server to run tests, display progress and report results to the server
- bedrock-common - types and data structures shared by the modules
- bedrock-sample - a sample app for demonstration and testing purposes

Projects would usually include bedrock-client and bedrock-server as devDependencies.

# Branching and Versioning

Trunk-based development with semver.

All modules share the same version (managed by `lerna`).

DO NOT manually edit the `package.json` files. DO NOT manually publish.

Create feature branches named `feature/XXXX` where XXXX is a Jira issue key or Github issue number.

Feature branches are merged to `master`.
After merging, run `bunx lerna version` to choose a new version, then push directly to `master`. This will be published by Jenkins.

To add a dependency to the root package: `bun add package`
To add a dependency to a module, use `bun add --cwd modules/XXX package`.
Add a `-D` to the above for `devDependencies`

