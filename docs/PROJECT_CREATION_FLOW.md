# Project Creation Flow

Complete documentation of how a user's app idea becomes a working mobile application.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROJECT CREATION FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User Input          2. Template Clone       3. AI Generation            │
│  ┌──────────────┐      ┌──────────────┐       ┌──────────────┐             │
│  │  "I want an  │      │   Clone from │       │  AI agents   │             │
│  │  e-commerce  │ ───► │   bare repo  │ ───►  │  modify code │             │
│  │  app for..." │      │   to project │       │  iteratively │             │
│  └──────────────┘      └──────────────┘       └──────────────┘             │
│                                                       │                      │
│  4. Validation          5. Build                6. Delivery                 │
│  ┌──────────────┐      ┌──────────────┐       ┌──────────────┐             │
│  │  QA pipeline │      │  Expo EAS    │       │  Download    │             │
│  │  validates   │ ◄─── │  builds APK/ │ ◄───  │  or publish  │             │
│  │  the code    │      │  IPA files   │       │  to stores   │             │
│  └──────────────┘      └──────────────┘       └──────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
mobigen/
├── templates-bare/           # Source of truth (bare git repos)
│   ├── base.git             # Minimal starter template
│   ├── ecommerce.git        # E-commerce template
│   ├── loyalty.git          # Loyalty program template
│   ├── news.git             # News reader template
│   └── ai-assistant.git     # AI chat template
│
├── templates/                # Working copies (for development)
│   ├── base/                # Development version of base
│   ├── ecommerce/           # Development version of ecommerce
│   └── ...
│
└── projects/                 # User projects (runtime, not in git)
    ├── proj-abc123/         # User's project with own git history
    ├── proj-def456/
    └── ...
```

## Step-by-Step Flow

### Step 1: User Submits Request

User interacts with the web dashboard:

```typescript
// apps/web/src/app/api/generate/route.ts
POST /api/generate
{
  "prompt": "I want an e-commerce app for selling handmade jewelry",
  "appName": "Sparkle Shop",
  "bundleId": "com.sparkleshop.app"
}
```

### Step 2: Template Selection

The Generator service analyzes the prompt and selects the best template:

```typescript
// services/generator/src/orchestrator.ts
async function selectTemplate(prompt: string): Promise<string> {
  // AI analyzes the prompt to determine best template
  const analysis = await claude.analyze(prompt);

  // Returns: 'base' | 'ecommerce' | 'loyalty' | 'news' | 'ai-assistant'
  return analysis.recommendedTemplate;
}
```

### Step 3: Clone Template to Project

The storage package clones from the bare repo:

```typescript
// packages/storage/src/template-manager.ts
async cloneToProject(templateName: string, projectId: string, config) {
  // 1. Clone from bare repository
  const bareRepoPath = `templates-bare/${templateName}.git`;
  const projectPath = `projects/${projectId}`;

  await git.clone(bareRepoPath, projectPath, ['--depth', '1']);

  // 2. Remove origin (project is now independent)
  await projectGit.removeRemote('origin');

  // 3. Reset git history for fresh start
  await fs.rm(`${projectPath}/.git`, { recursive: true });
  await projectGit.init();

  // 4. Configure git for the project
  await projectGit.addConfig('user.email', 'mobigen@generated.local');
  await projectGit.addConfig('user.name', 'Mobigen Generator');

  // 5. Create project metadata
  const metadata = {
    projectId,
    template: templateName,
    templateVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    generationHistory: []
  };
  await fs.writeFile(`${projectPath}/.mobigen.json`, JSON.stringify(metadata));

  // 6. Customize app.json
  await updateAppConfig(projectPath, {
    appName: config.appName,
    bundleId: config.bundleId
  });

  // 7. Initial commit
  await projectGit.add('.');
  await projectGit.commit(`Initial project from ${templateName}`);

  return metadata;
}
```

### Step 4: AI Generation

Multi-agent system modifies the code:

```typescript
// packages/ai/src/agents/index.ts
async function generateApp(projectId: string, prompt: string) {
  const projectPath = `projects/${projectId}`;

  // Phase 1: Planning
  const plan = await plannerAgent.createPlan(prompt, templateContext);

  // Phase 2: Code Generation (iterative)
  for (const task of plan.tasks) {
    // Generate code changes
    const changes = await coderAgent.implement(task);

    // Apply changes to files
    for (const change of changes) {
      await fs.writeFile(
        `${projectPath}/${change.path}`,
        change.content
      );
    }

    // Commit this phase
    await templateManager.recordGeneration(projectId, {
      version: task.version,
      prompt: task.description,
      phase: task.phase,
      agent: 'coder'
    });
  }

  // Phase 3: Review & Fix
  const issues = await reviewerAgent.review(projectPath);
  if (issues.length > 0) {
    await fixerAgent.fix(projectPath, issues);
  }
}
```

### Step 5: Validation (QA Pipeline)

The testing package validates the generated code:

```typescript
// packages/testing/src/index.ts
async function validateProject(projectPath: string): Promise<ValidationResult> {
  const results = {
    tier1: await runTier1(projectPath),  // TypeScript, ESLint
    tier2: await runTier2(projectPath),  // Expo prebuild, Jest
    tier3: await runTier3(projectPath),  // Maestro E2E tests
  };

  return {
    passed: results.tier1.passed && results.tier2.passed,
    results
  };
}
```

### Step 6: Build

The builder service creates installable apps:

```typescript
// services/builder/src/build-service.ts
async function buildApp(projectId: string, platform: 'ios' | 'android') {
  const projectPath = `projects/${projectId}`;

  // 1. Upload to Expo EAS
  const build = await easClient.createBuild({
    projectDir: projectPath,
    platform,
    profile: 'production'
  });

  // 2. Poll for completion
  const result = await pollBuildStatus(build.id);

  // 3. Download artifact
  const artifactUrl = result.artifacts.buildUrl;
  await storage.downloadArtifact(artifactUrl, `builds/${projectId}`);

  return {
    buildId: build.id,
    downloadUrl: artifactUrl,
    platform
  };
}
```

### Step 7: Delivery

User receives their app:

```typescript
// Response to user
{
  "projectId": "proj-abc123",
  "status": "completed",
  "downloads": {
    "android": "https://builds.mobigen.io/proj-abc123/app.apk",
    "ios": "https://builds.mobigen.io/proj-abc123/app.ipa"
  },
  "repository": {
    "clone": "git clone https://git.mobigen.io/proj-abc123.git"
  }
}
```

## Git History Structure

Each project maintains its own git history:

```
projects/proj-abc123/
├── .git/                    # Independent git repository
└── .mobigen.json            # Generation metadata

$ git log --oneline
a1b2c3d Review fixes: linting and type errors
f4e5d6c [styling] Apply custom theme colors
7890abc [screens] Add product detail screen
4567def [components] Create ProductCard component
1234567 Initial project from ecommerce@1.0.0 (abc1234)
```

## Project Metadata

Each project has a `.mobigen.json` file:

```json
{
  "projectId": "proj-abc123",
  "template": "ecommerce",
  "templateVersion": "1.0.0",
  "templateCommit": "abc1234",
  "createdAt": "2024-01-15T10:30:00Z",
  "generationHistory": [
    {
      "version": 1,
      "timestamp": "2024-01-15T10:31:00Z",
      "prompt": "Add product listing with categories",
      "commit": "4567def",
      "phase": "components",
      "agent": "coder"
    },
    {
      "version": 2,
      "timestamp": "2024-01-15T10:32:00Z",
      "prompt": "Create product detail screen",
      "commit": "7890abc",
      "phase": "screens",
      "agent": "coder"
    }
  ]
}
```

## Template Development

### Updating Templates

```bash
# 1. Make changes in working copy
cd templates/ecommerce
# ... edit files ...

# 2. Commit and push to bare repo
git add .
git commit -m "Add new payment component"
git push origin master

# 3. Tag new version (optional)
git tag v1.1.0
git push origin v1.1.0
```

### Creating New Templates

```bash
# 1. Create the template
cd templates
npx create-expo-app my-template --template tabs

# 2. Set up the template (add NativeWind, etc.)
cd my-template
npm install nativewind
# ... configure ...

# 3. Create bare repository
cd ../../templates-bare
git init --bare my-template.git

# 4. Initialize and push
cd ../templates/my-template
git init
git add -A
git commit -m "Initial template"
git remote add origin ../../templates-bare/my-template.git
git push -u origin master
```

## Reverting Projects

Users can revert to any previous generation:

```typescript
// Revert to a specific commit
await templateManager.revertProject('proj-abc123', '4567def');

// View project history
const history = await templateManager.getProjectHistory('proj-abc123');
// [
//   { hash: 'a1b2c3d', message: 'Review fixes', date: ... },
//   { hash: 'f4e5d6c', message: '[styling] Apply theme', date: ... },
//   ...
// ]
```

## API Endpoints

### Create Project

```
POST /api/generate
Content-Type: application/json

{
  "prompt": "Build me an e-commerce app for...",
  "appName": "My App",
  "bundleId": "com.myapp.app",
  "template": "ecommerce"  // optional, auto-detected if not provided
}
```

### Get Project Status

```
GET /api/projects/:projectId
```

### Get Project History

```
GET /api/projects/:projectId/history
```

### Revert Project

```
POST /api/projects/:projectId/revert
{
  "commitHash": "4567def"
}
```

### Build Project

```
POST /api/projects/:projectId/build
{
  "platform": "android",
  "profile": "production"
}
```

## Error Handling

### Generation Failures

If generation fails, the project is reverted to the last good state:

```typescript
try {
  await generateApp(projectId, prompt);
} catch (error) {
  // Revert to last good commit
  const history = await getProjectHistory(projectId);
  if (history.length > 1) {
    await revertProject(projectId, history[1].hash);
  }
  throw error;
}
```

### Build Failures

Build failures are logged and reported:

```typescript
{
  "status": "failed",
  "error": {
    "code": "BUILD_FAILED",
    "message": "iOS build failed: Missing provisioning profile",
    "logs": "https://logs.mobigen.io/build-123"
  }
}
```

## Security Considerations

1. **Project Isolation**: Each project is in its own directory with independent git history
2. **No Secrets in Git**: API keys and secrets are stored in environment variables
3. **Sandboxed Execution**: AI agents cannot execute arbitrary code
4. **Audit Trail**: All changes are tracked in git history and `.mobigen.json`

## Related Documentation

- [Main README](../README.md)
- [Templates README](../templates/README.md)
- [Storage Package](../packages/storage/README.md)
- [Generator Service](../services/generator/README.md)
- [Architecture Overview](./ARCHITECTURE.md)
