import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "Agent Application Protocol",
    description: "A protocol for connecting any application to any agent.",
    cleanUrls: true,
    sitemap: { hostname: "https://agentapplicationprotocol.com" },
    head: [
      ["link", { rel: "icon", href: "/favicon.png" }],
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:site_name", content: "Agent Application Protocol" }],
      ["meta", { property: "og:image", content: "https://agentapplicationprotocol.com/logo.png" }],
      ["meta", { name: "twitter:card", content: "summary_large_image" }],
      ["meta", { name: "twitter:image", content: "https://agentapplicationprotocol.com/logo.png" }],
    ],
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
          text: "Tutorial",
          items: [
            { text: "Open Agent App", link: "/build-an-open-app" },
            { text: "Managed Agent App", link: "/build-a-managed-app" },
            {
              text: "Agent as a Microservice",
              link: "/agent-as-a-microservice",
            },
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
