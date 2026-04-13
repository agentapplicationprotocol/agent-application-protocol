import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "Agent Application Protocol",
    description: "A protocol for connecting any application to any agent.",
    cleanUrls: true,
    head: [["link", { rel: "icon", href: "/favicon.png" }]],
    themeConfig: {
      outline: [2, 3],
      nav: [
        {
          text: "Playground",
          link: "https://agentapplicationprotocol.github.io/playground/",
        },
      ],
      sidebar: [
        {
          text: "Get Started",
          items: [
            { text: "Overview", link: "/overview" },
            { text: "Agents", link: "/agents" },
            { text: "Applications", link: "/applications" },
          ],
        },
        {
          text: "Protocol",
          items: [
            { text: "Endpoints", link: "/endpoints" },
            { text: "Response", link: "/response" },
            { text: "Tool Call", link: "/tool-call" },
            { text: "History", link: "/history" },
            { text: "Privacy", link: "/privacy" },
            { text: "Schema", link: "/schema" },
          ],
        },
        {
          text: "Resources",
          items: [
            {
              text: "TypeScript SDK",
              link: "https://github.com/agentapplicationprotocol/typescript-sdk",
            },
            {
              text: "GitHub",
              link: "https://github.com/agentapplicationprotocol/agent-application-protocol",
            },
          ],
        },
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
