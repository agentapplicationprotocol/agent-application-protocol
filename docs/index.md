---
layout: home

hero:
  name: Agent Application Protocol
  text: |
    Connect any
    application
    to any agent.
  tagline: Remote-first, agent as a service.
  image:
    src: /application-aap-agent.svg
    alt: Agent Application Protocol
  actions:
    - theme: brand
      text: Read the Spec
      link: /protocol
    - theme: alt
      text: GitHub
      link: https://github.com/agentapplicationprotocol/agent-application-protocol

features:
  - title: Remote-first
    details: HTTP + SSE transport. Agents run as remote services, not local processes.
  - title: Any app, any agent
    details: Like MCP or USB — a standard connector between M applications and N agents.
  - title: Clean separation
    details: Applications own the UI and domain tools. Agents own the loop, LLM, and intelligence.
---

<style>
.VPHero .VPImage { width: 600px; max-width: 600px; }
</style>
