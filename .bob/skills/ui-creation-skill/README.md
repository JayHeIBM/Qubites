# UI Creation Skill: Setup React UI for AI Applications

## Introduction

The **UI Creation Skill** automates the setup and configuration of React-based user interfaces for AI CoE applications. This skill handles cloning ai-chat-react-ui, configuring for local development, disabling authentication, and validating the setup with comprehensive testing.

**Note:** This skill works with Bob's **Advanced mode** (🛠️ Advanced).

## Target Audience

This skill is designed for:
- **Frontend Developers** building AI chat interfaces
- **Full-stack Engineers** creating complete AI applications
- **UI/UX Designers** implementing chat experiences
- **DevOps Engineers** deploying UI services
- **Teams** building production-ready AI chat applications

## Why UI Creation Skill?

Setting up a React UI manually is complex:
- Cloning and configuring ai-chat-react-ui repository
- Disabling authentication for local development
- Configuring API routes for BFF integration
- Setting up environment variables correctly
- Handling port conflicts and auto-increment
- Testing UI connectivity to BFF

The UI Creation Skill eliminates this complexity with **automated setup and validation**.

## What Problem It Solves

### Problem 1: Complex UI Configuration
**Before:** Manually configure .env, disable auth, set up routes  
**After:** "Create UI" - Complete setup with auth disabled

### Problem 2: BFF Integration
**Before:** Figure out API domain, configure routes manually  
**After:** Automatic configuration from BFF URL

### Problem 3: Authentication Setup
**Before:** Deal with IBM App ID configuration for local dev  
**After:** Authentication automatically disabled for local development

### Problem 4: Port Management
**Before:** Manually handle port conflicts, update configs  
**After:** Automatic port detection and configuration

## What It Can Do

### UI Service Creation
- Clone ai-chat-react-ui repository
- Configure for local development
- Disable authentication (IBM App ID)
- Set up API routes for BFF
- Install dependencies

### Configuration Management
- Generate .env with runtime values
- Configure API domain for BFF
- Enable agentic interaction mode
- Set up multi-session support
- Handle port auto-increment

### Testing and Validation
- Automated HTTP 200 checks
- Port extraction from logs
- Auth error detection
- Auto-fix common issues
- Keep UI running for integration

## Steps to Use It

### Step 1: Install the Skill

#### Method 1: Recommended - Using npx Command

```bash
npx skills add git@github.ibm.com:AI-CoE/infra-ai-coe-skills.git --skill ui-creation-skill -a bob
```

#### Method 2: Manual Installation

**Global:**
```bash
cp -r ui-creation-skill ~/.bob/skills/
```

**Project-specific:**
```bash
mkdir -p .bob/skills
cp -r ui-creation-skill .bob/skills/
```

### Step 2: Prerequisites

**Required:**
- Node.js 16+ installed
- npm or yarn package manager
- Access to IBM GitHub Enterprise
- Running BFF service (for testing)

### Step 3: Start Using the Skill

Bob will automatically use this skill when you need to:
- Create React UIs for AI chat applications
- Set up frontend for agent communication
- Build user interfaces for AI assistants

## Quick Examples

**Create UI with default settings:**
```
"Create a React UI connecting to BFF at http://localhost:8030"
```

**Create UI with custom port:**
```
"Set up UI on port 3001 connecting to BFF at http://localhost:8000"
```

## Project Structure

```
ui/
├── src/
│   ├── components/
│   ├── constants/
│   │   └── constants.tsx
│   └── ...
├── package.json
├── .env
├── vite.config.ts
└── README.md
```

## Configuration

### Environment Variables

```bash
VITE_HOMEPAGE="/"
VITE_HOSTNAME="localhost:3000"
VITE_PROJECT_TITLE="AI Chat"
VITE_API_DOMAIN=http://localhost:8030
VITE_AUTH_ENABLE=FALSE
VITE_AUTH_TYPE=SSO
VITE_TOKEN_STORAGE=localStorage
VITE_TOKEN_KEY=token
VITE_ENABLE_AGENTIC_INTERACTION=TRUE
VITE_RESPONSE_STREAMING_ENABLE=FALSE
VITE_ENABLE_MULTISESSION=TRUE
VITE_MULTI_SESSION_COUNT=15
VITE_DISABLE_CONSENT_FORM=TRUE
VITE_ENABLE_RESTART_CONVERSATION=TRUE
VITE_ENABLE_FEEDBACK=FALSE
```

### Running the UI

```bash
npm run start
```

The UI will be available at `http://localhost:3000` (or auto-incremented port).

## Features

- **Multi-session Support** - Manage multiple chat sessions
- **Agentic Interaction** - Direct communication with AI agents
- **No Authentication** - Simplified local development
- **Responsive Design** - Works on desktop and mobile
- **Session Management** - Create, list, and delete sessions

## Troubleshooting

**Git clone fails:**
- Use HTTPS clone or configure SSH
- Verify GitHub Enterprise access

**npm install fails:**
- Check Node.js version (requires 16+)
- Clear npm cache: `npm cache clean --force`

**UI won't start:**
- Check port availability
- Verify `.env` file exists
- Review `ui-test.log`

**HTTP != 200:**
- Check build errors in logs
- Verify all dependencies installed

**Auth errors:**
- Ensure `VITE_AUTH_ENABLE=FALSE`
- Check for "undefined client_id" in logs

**Port mismatch:**
- Use actual port from logs, not config
- Port may auto-increment if 3000 is busy

## Integration with Agent Stack Builder

This skill works seamlessly with agent-stack-builder:
- Called in Session 5 (UI Creation)
- Reads BFF URL from state
- Updates state after successful creation
- Leaves UI running for integration validation

## Security Notes

- Never commit `.env` to version control
- Authentication disabled for local development only
- Enable authentication for production deployments
- Review CORS settings before production

## License

This skill is provided as-is for use with Bob AI assistant.

---

**Quick Start:** Install skill → Provide BFF URL → Get production-ready React UI!