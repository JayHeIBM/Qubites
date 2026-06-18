---
name: ui-creation-skill
description: Setup and configure React UI for AI CoE applications with self-testing validation. Clones ai-chat-react-ui, configures for local development, disables authentication, and validates the setup before reporting completion.
triggers:
  - "setup UI"
  - "create UI"
  - "configure UI"
  - "setup React UI"
  - "create React UI"
---

# UI Creation Skill

## Mode Requirement

**This skill must remain in Advanced mode for the entire workflow. Do not switch modes.**

## Framework Constraint

**MUST use ai-chat-react-ui repository. Custom UI implementations are not supported.**

Validation: Before proceeding, confirm you are cloning `ai-chat-react-ui` and using its components.

## Input Contract

| Parameter | Source | Default | Notes |
|-----------|--------|---------|-------|
| UI_PORT | State or user | 3000 | May auto-increment if in use |
| BFF_URL | State or user | http://localhost:8000 | From BFF service |
| PROJECT_NAME | State or user | "AI Chat" | Application title |
| TARGET_DIR | State or user | ./ui | Relative to workspace |

## Output Contract

**Success:**
```
✓ UI setup complete and tested
- Location: <path>
- Port: <actual-port>
- BFF: <bff-url>
- Self-test: PASSED
```

**Failure:**
```
✗ UI setup failed: <error>
- Log: <path>
- Fix: <guidance>
```

## Mode Detection

```bash
if [ -f "../.bob-state/manifest.json" ]; then
  MULTI_SESSION=true
  source ../.bob/skills/agent-stack-builder/_shared/state-utils.sh
  UI_PORT=$(get_ui_port)
  BFF_URL=$(get_bff_url)
  PROJECT_NAME=$(get_project_name)
else
  MULTI_SESSION=false
  # Prompt user for parameters
fi
```

## Workflow

0. Stay in Advanced mode and follow this skill exactly unless the user explicitly overrides a requirement.
1. Clone ai-chat-react-ui → `ui/`
2. Remove `.git`
3. Discover configuration from repo (package.json, .env.example, vite.config)
4. Create `.env` with runtime values
5. Patch `src/constants/constants.tsx` for BFF routes
6. Install dependencies
7. Self-test: start → verify HTTP 200 → extract actual port → stop
8. Update state (if multi-session)
9. Report completion

## Implementation

### 1. Clone Repository

```bash
cd <TARGET_DIR>
git clone https://github.ibm.com/coe-ai-chatbot/ai-chat-react-ui.git ui || \
  git clone https://github.ibm.com/coe-ai-chatbot/ai-chat-react-ui.git ui --config core.sshCommand="ssh"
cd ui
rm -rf .git
```

### 2. Discover Configuration

```bash
# Read start script from package.json
START_CMD=$(jq -r '.scripts.start // "vite"' package.json)

# Read default port from vite.config (if exists)
DEFAULT_PORT=$(grep -oE "port:\s*[0-9]+" vite.config.* 2>/dev/null | grep -oE "[0-9]+" || echo "3000")

# Use .env.example as baseline
cp .env.example .env 2>/dev/null || touch .env
```

### 3. Configure Environment

| Flag | Value | Reason |
|------|-------|--------|
| VITE_AUTH_ENABLE | FALSE | Disable IBM App ID for local dev |
| VITE_HOMEPAGE | "/" | Remove production path prefix |
| VITE_API_DOMAIN | http://localhost:<BFF_PORT> | Point to BFF service |
| VITE_ENABLE_AGENTIC_INTERACTION | TRUE | Routes to `/api/v1/supervisor/send_message` (agent-utils BFF) |
| VITE_RESPONSE_STREAMING_ENABLE | FALSE | Simpler initial setup |
| VITE_ENABLE_MULTISESSION | TRUE | Multi-session support |
| VITE_HOSTNAME | localhost:<UI_PORT> | May auto-increment |

```bash
cat > .env << EOF
VITE_HOMEPAGE="/"
VITE_HOSTNAME="localhost:${UI_PORT}"
VITE_PROJECT_TITLE="${PROJECT_NAME}"
VITE_API_DOMAIN=${BFF_URL}
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
EOF
```

### 4. Patch API Routes


```bash
# In-place patch for agent-utils BFF routes
sed -i.bak "s|FEEDBACK_TOKEN: '/feedback-hub/token'|FEEDBACK_TOKEN: '/api/v1/feedback-hub/token'|" src/constants/constants.tsx
sed -i.bak "s|GET_SESSIONS: '/sessions'|GET_SESSIONS: '/api/v1/sessions'|" src/constants/constants.tsx
sed -i.bak "s|AGENT_UTILS_GET_SESSIONS: '/sessions'|AGENT_UTILS_GET_SESSIONS: '/api/v1/sessions'|" src/constants/constants.tsx
rm src/constants/constants.tsx.bak
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Self-Test

```bash
npm run start > ui-test.log 2>&1 &
UI_PID=$!
sleep 10

# Verify process alive
kill -0 $UI_PID 2>/dev/null || { echo "✗ UI died"; cat ui-test.log; exit 1; }

# Extract actual port from logs (runtime value)
ACTUAL_PORT=$(grep -oE "Local:.*localhost:([0-9]+)" ui-test.log | grep -oE "[0-9]+" | head -1)
[ -z "$ACTUAL_PORT" ] && { echo "✗ Port not found"; kill $UI_PID; exit 1; }

# Test HTTP response
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$ACTUAL_PORT)
[ "$HTTP_CODE" != "200" ] && { echo "✗ HTTP $HTTP_CODE"; kill $UI_PID; exit 1; }

# Check for auth errors
grep -q "undefined client_id" ui-test.log && { echo "✗ Auth error"; kill $UI_PID; exit 1; }

# Keep UI running — session 6 integration-validation needs live UI connectivity
mkdir -p ../logs
echo $UI_PID > ../logs/ui.pid
echo "✓ UI self-test passed on port $ACTUAL_PORT — service left running for session 6"
```

### 7. Update State (Multi-Session)

State registration is handled by the **orchestrator session file** (session-5-ui.md), not this skill. This skill only needs to emit the success string below — the session file calls `add_ui_component` after receiving it.

**Do NOT call `add_ui_component` here when running in multi-session mode.**
```

### 8. Create README

```bash
cat > README.md << EOF
# UI Service

Port: $ACTUAL_PORT | BFF: $BFF_URL | Auth: Disabled

## Run
\`\`\`bash
npm run start
\`\`\`

## Test
1. Open http://localhost:$ACTUAL_PORT
2. Verify no auth errors
3. Test chat (requires BFF + agents)
EOF
```

## Failure Table

| Symptom | Cause | Fix |
|---------|-------|-----|
| Git clone fails | SSH/credentials | Use HTTPS clone or configure SSH |
| npm install fails | Node version | Requires Node 16+ |
| UI won't start | Port/config | Check port availability, verify .env |
| HTTP != 200 | Build error | Check ui-test.log |
| Auth errors | Config wrong | Ensure VITE_AUTH_ENABLE=FALSE |
| Port mismatch | Auto-increment | Use ACTUAL_PORT from logs, not config |

## Success Checklist

- [ ] Repository cloned
- [ ] Configuration discovered from repo
- [ ] .env created with runtime values
- [ ] Routes patched for BFF
- [ ] Dependencies installed
- [ ] UI starts successfully
- [ ] HTTP 200 response
- [ ] Actual port extracted from logs
- [ ] No auth errors
- [ ] UI stops cleanly
- [ ] State updated (if multi-session)
- [ ] README created

## Shared Resources

- [State Management](../agent-stack-builder/_shared/state-management.md)
- [State Utilities](../agent-stack-builder/_shared/state-utils.sh)