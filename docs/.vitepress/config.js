import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

const enNav = [
  {
    text: "Agent Skills",
    link: "https://github.com/agentapplicationprotocol/skills",
  },
  {
    text: "Playground",
    link: "https://agentapplicationprotocol.github.io/playground/",
  },
];

const enSidebar = [
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
      { text: "Agent as a Microservice", link: "/agent-as-a-microservice" },
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
        text: "Agent Skills",
        link: "https://github.com/agentapplicationprotocol/skills",
      },
      {
        text: "Playground",
        link: "https://agentapplicationprotocol.github.io/playground/",
      },
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
];

const zhNav = [
  {
    text: "Agent Skills",
    link: "https://github.com/agentapplicationprotocol/skills",
  },
  {
    text: "Playground",
    link: "https://agentapplicationprotocol.github.io/playground/",
  },
];

const zhSidebar = [
  {
    text: "快速开始",
    items: [
      { text: "概览", link: "/zh/overview" },
      { text: "Agent", link: "/zh/agents" },
      { text: "应用", link: "/zh/applications" },
    ],
  },
  {
    text: "教程",
    items: [
      { text: "开放 Agent 应用", link: "/zh/build-an-open-app" },
      { text: "托管 Agent 应用", link: "/zh/build-a-managed-app" },
      { text: "Agent 作为微服务", link: "/zh/agent-as-a-microservice" },
    ],
  },
  {
    text: "协议",
    items: [
      { text: "端点", link: "/zh/endpoints" },
      { text: "响应", link: "/zh/response" },
      { text: "工具调用", link: "/zh/tool-call" },
      { text: "历史记录", link: "/zh/history" },
      { text: "隐私", link: "/zh/privacy" },
      { text: "Schema", link: "/zh/schema" },
    ],
  },
  {
    text: "资源",
    items: [
      {
        text: "Agent Skills",
        link: "https://github.com/agentapplicationprotocol/skills",
      },
      {
        text: "Playground",
        link: "https://agentapplicationprotocol.github.io/playground/",
      },
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
];

export default withMermaid(
  defineConfig({
    title: "Agent Application Protocol",
    description: "A protocol for connecting any application to any agent.",
    cleanUrls: true,
    sitemap: { hostname: "https://agentapplicationprotocol.com" },
    head: [
      [
        "script",
        {
          async: "",
          src: "https://www.googletagmanager.com/gtag/js?id=G-7TB9FDW0E0",
        },
      ],
      [
        "script",
        {},
        "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-7TB9FDW0E0');",
      ],
      ["link", { rel: "icon", href: "/favicon.png" }],
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:site_name", content: "Agent Application Protocol" }],
      [
        "meta",
        {
          property: "og:image",
          content: "https://agentapplicationprotocol.com/logo.png",
        },
      ],
      ["meta", { name: "twitter:card", content: "summary_large_image" }],
      [
        "meta",
        {
          name: "twitter:image",
          content: "https://agentapplicationprotocol.com/logo.png",
        },
      ],
    ],
    locales: {
      root: {
        label: "English",
        lang: "en",
        themeConfig: {
          outline: [2, 3],
          nav: enNav,
          sidebar: enSidebar,
          socialLinks: [
            {
              icon: "github",
              link: "https://github.com/agentapplicationprotocol/agent-application-protocol",
            },
          ],
        },
      },
      zh: {
        label: "简体中文",
        lang: "zh-Hans",
        themeConfig: {
          outline: [2, 3],
          nav: zhNav,
          sidebar: zhSidebar,
          socialLinks: [
            {
              icon: "github",
              link: "https://github.com/agentapplicationprotocol/agent-application-protocol",
            },
          ],
        },
      },
    },
  }),
);
