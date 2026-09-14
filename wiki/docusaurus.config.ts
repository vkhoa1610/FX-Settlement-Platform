import type { Config } from '@docusaurus/types';
import { GlobExcludeDefault } from '@docusaurus/utils';

const config: Config = {
  title: 'FX Banking Wiki',
  tagline: 'Nghiệp vụ FX: WebShokin – Tenpo – BizForex – BESTA – SWIFT',
  favicon: 'img/favicon.ico',

  url: 'https://vkhoa1610.github.io',
  baseUrl: '/FX-Settlement-Platform/',

  organizationName: 'vkhoa1610',
  projectName: 'FX-Settlement-Platform',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Bắt buộc: 2 trang (tenpo-approval, besta-accounting) dùng sơ đồ mermaid
  markdown: {
    mermaid: true,
  },
  themes: [
    '@docusaurus/theme-mermaid',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexDocs: true,
        searchBarPosition: 'right',
      },
    ],
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'vi'],
    localeConfigs: {
      en: { label: 'English' },
      de: { label: 'Deutsch' },
      vi: { label: 'Tiếng Việt' },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/vkhoa1610/FX-Settlement-Platform/edit/main/',
          // docs/de và docs/vi là thư mục nguồn riêng cho 2 locale đó (xem npm run i18n:sync),
          // không phải doc con của locale mặc định (en) — phải loại trừ khỏi glob của locale en.
          exclude: [...GlobExcludeDefault, 'de/**', 'vi/**'],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'FX Banking Wiki',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'wikiSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/vkhoa1610/FX-Settlement-Platform',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `FX Banking Wiki — Portfolio project. Built with Docusaurus.`,
    },
    prism: {
      additionalLanguages: ['java', 'sql', 'bash', 'markup'],
    },
  },
};

export default config;
