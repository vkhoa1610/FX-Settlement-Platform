import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  wikiSidebar: [
    {
      type: 'category',
      label: 'Overview',
      collapsed: false,
      items: ['overview'],
    },
    {
      type: 'category',
      label: 'Input Layer',
      collapsed: false,
      items: ['hulft-file-parsing'],
    },
    {
      type: 'category',
      label: 'Front & Branch',
      collapsed: false,
      items: ['webshokin-screen', 'tenpo-approval'],
    },
    {
      type: 'category',
      label: 'Exchange & Accounting',
      collapsed: false,
      items: ['bizforex-exchange', 'cbs-accounting'],
    },
    {
      type: 'category',
      label: 'Messaging & Sync',
      collapsed: false,
      items: ['swift-hulft-messaging', 'settlement-sync'],
    },
    {
      type: 'category',
      label: 'Foundations',
      collapsed: false,
      items: ['design-principles'],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      items: ['interview-prep'],
    },
  ],
};

export default sidebars;
