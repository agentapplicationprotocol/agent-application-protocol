import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "Agent Application Protocol",
    description: "A protocol for connecting any application to any agent.",
    head: [["link", { rel: "icon", href: "/favicon.png" }]],
    themeConfig: {
      nav: [
        { text: "Overview", link: "/overview" },
        {
          text: "TypeScript",
          link: "https://github.com/agentapplicationprotocol/typescript-sdk",
        },
        {
          text: "Playground",
          link: "https://agentapplicationprotocol.github.io/playground/",
        },
        {
          text: "Example",
          link: "https://github.com/agentapplicationprotocol/agents",
        },
      ],
      sidebar: [
        { text: "Overview", link: "/overview" },
        { text: "Endpoints", link: "/endpoints" },
        { text: "Response", link: "/response" },
        { text: "Tool Call", link: "/tool-call" },
        { text: "History", link: "/history" },
        { text: "Schema", link: "/schema" },
        { text: "Privacy", link: "/privacy" },
      ],
      socialLinks: [
        {
          icon: "github",
          link: "https://github.com/agentapplicationprotocol/agent-application-protocol",
        },
      ],
    },
  }),
);
