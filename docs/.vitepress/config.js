import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Agent Application Protocol',
  description: 'A protocol for connecting any application to any agent.',
  head: [['link', { rel: 'icon', href: '/favicon.png' }]],
  themeConfig: {
    nav: [
      { text: 'Spec', link: '/protocol' },
    ],
    sidebar: [
      { text: 'Protocol Specification', link: '/protocol' },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/agentapplicationprotocol/agent-application-protocol' },
    ],
  },
})
