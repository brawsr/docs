# MCP server

The v0.1 MCP integration is an authenticated local stdio process. It exposes
sessions, checkpoints, rewind, fork, operation recovery, and explicit cleanup as
tools backed by the same packaged TypeScript SDK.

Configure the spawned process, not tool arguments:

```text
BRAWSR_API_KEY=...
BRAWSR_MCP_TIMEOUT_MS=30000  # optional
```

The API key is the only required setting. The MCP server connects to brawsr
automatically and never reads connection settings from tool arguments.

Checkpoint, rewind, and fork are each one tool call and return a completed
result. If the configured wait expires, the structured error includes operation
recovery fields and the operation may still continue. Use
`brawsr_get_operation` or `brawsr_wait_operation` rather than submitting a
different mutation.

Fork returns ordered peer children. An agent decides whether its workflow keeps
all results or selects one, then calls `brawsr_close_sessions` explicitly. The
server does not select a winner, merge browser state, close siblings, replay CDP
commands, or proxy CDP traffic.

The API key and CDP authorization header are never tool output. CDP URLs are
sensitive and should not be logged. The v0.1 package uses local stdio transport.
It does not expose a hosted remote MCP endpoint or proxy CDP traffic.
