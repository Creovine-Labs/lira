// Shared blog post data used by BlogPage and BlogPostPage

export interface BlogPost {
  slug: string
  legacySlugs?: string[]
  title: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  category: string
  categoryColor: string
  date: string
  publishedTime: string
  readingTime: string
  excerpt: string
  author: { name: string; initials: string; role: string; image: string }
  paragraphs: string[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'ai-customer-support-context',
    legacySlugs: ['ai-interview-process'],
    title: 'Why AI customer support needs context, not just fast replies',
    seoTitle: 'AI Customer Support With Context, Memory, and Better Resolution',
    seoDescription:
      'Learn why AI customer support works better when it uses customer context, conversation memory, and connected systems instead of isolated answers.',
    seoKeywords:
      'AI customer support, customer support automation, AI support agent, customer context, support automation software, AI help desk, support workflows, customer memory',
    category: 'Customer Support',
    categoryColor: 'bg-violet-100 text-violet-700',
    date: 'May 9, 2026',
    publishedTime: '2026-05-09T09:00:00+02:00',
    readingTime: '6 min read',
    excerpt:
      'Fast replies are not enough. AI customer support becomes far more useful when every answer starts with customer context, history, and connected systems.',
    author: {
      name: 'Sarah Oba',
      initials: 'SO',
      role: 'Co-founder, Lira',
      image: '/sarah-oba-placeholder.svg',
    },
    paragraphs: [
      'A lot of AI customer support still behaves like a very fast FAQ box. It replies quickly, but it does not really know the customer, the relationship, or the work that needs to happen after the answer.',
      'That gap is where support teams start losing trust. A customer does not care that a reply arrived in three seconds if they still have to repeat their issue, explain their plan, or wait for a human to piece together what already happened in another channel.',
      'The strongest support experiences start with context. That means knowing what product the customer uses, what conversations already happened, what documents are relevant, and what systems hold the next action. Without that layer, AI can sound helpful while still creating more work for the team behind it.',
      'This is why connected customer support matters so much. When your support AI can use conversation history, organization knowledge, and approved business systems together, the answer becomes more than a sentence. It becomes a useful step forward.',
      'Context also improves escalation. When a case needs a human, the handoff is cleaner because the thread already carries the customer history, the attempted resolution, and the signals that explain why the issue needs judgment. Your team spends less time reconstructing the story and more time solving the problem.',
      'It also improves consistency across channels. Customers now move between chat, email, voice, and portals all the time. If your support operation treats each touchpoint like a separate event, the experience feels fragmented. If your AI support layer carries the relationship across those touchpoints, the experience feels intentional.',
      'That is the real promise of AI customer support. Not just faster answers. Better continuity, better routing, and better resolution because every reply starts with the full picture.',
    ],
  },
  {
    slug: 'ai-support-automation-workflows',
    legacySlugs: ['ai-sales-coaching'],
    title: 'How AI support automation should move work forward',
    seoTitle: 'AI Support Automation That Routes, Updates, and Resolves',
    seoDescription:
      'See how AI support automation becomes more valuable when it can route issues, trigger follow-up, update systems, and help teams resolve customer requests end to end.',
    seoKeywords:
      'AI support automation, customer support automation, support workflow automation, AI support software, support escalation, automated customer service, AI service desk',
    category: 'Automation',
    categoryColor: 'bg-emerald-100 text-emerald-700',
    date: 'May 7, 2026',
    publishedTime: '2026-05-07T09:00:00+02:00',
    readingTime: '5 min read',
    excerpt:
      'Good AI support automation does not stop at the reply. It routes work, updates systems, and helps the team close the loop faster.',
    author: {
      name: 'Sarah Oba',
      initials: 'SO',
      role: 'Co-founder, Lira',
      image: '/sarah-oba-placeholder.svg',
    },
    paragraphs: [
      'A support conversation almost never ends with a single message. There is usually something behind it that needs to happen next. A teammate needs to be notified. A ticket needs to be created. A customer record needs to be updated. A follow-up needs to go out before the issue becomes churn.',
      'That is why AI support automation should be measured by movement, not just messaging. If the AI can answer but cannot help the team act, the operation still slows down at the exact point where support becomes operational work.',
      'The most useful automation patterns are the ones that remove repeated manual steps. Routing an urgent case to the right queue. Logging the issue in the engineering workflow. Sending an escalation alert to the team channel. Pulling the right customer context into the thread so the next person does not start from zero.',
      'This kind of automation is also what makes support feel organized from the customer side. They do not see every internal workflow, but they feel the difference when the next reply arrives with continuity and when the right person joins with the right information already in place.',
      'It matters for speed, but it matters even more for trust. Customers lose confidence when they hear promises with no follow-through. Support automation that updates systems and creates clear next steps closes that gap.',
      'There is also a practical upside for managers. Once routing, escalation, and follow-up are part of the same support layer, it becomes much easier to see where time is going, where handoffs break, and which issues should be automated more confidently.',
      'The goal is not to automate everything for the sake of it. The goal is to let AI handle the repeatable coordination work so your team can spend more time on judgment, relationships, and the moments that actually need a person.',
    ],
  },
  {
    slug: 'knowledge-base-for-ai-support',
    legacySlugs: ['knowledge-base-best-practices'],
    title: 'How to build a knowledge base for AI customer support',
    seoTitle: 'Knowledge Base for AI Customer Support: What Actually Helps',
    seoDescription:
      'Build a knowledge base that improves AI customer support with cleaner source material, stronger structure, and documentation your team can actually trust.',
    seoKeywords:
      'knowledge base for AI customer support, AI knowledge base, support documentation, AI help center, support knowledge management, semantic search support',
    category: 'Knowledge Base',
    categoryColor: 'bg-blue-100 text-blue-700',
    date: 'May 4, 2026',
    publishedTime: '2026-05-04T09:00:00+02:00',
    readingTime: '7 min read',
    excerpt:
      'If you want better AI customer support, start with better source material. A strong knowledge base makes the difference between helpful answers and confident confusion.',
    author: {
      name: 'Sarah Oba',
      initials: 'SO',
      role: 'Co-founder, Lira',
      image: '/sarah-oba-placeholder.svg',
    },
    paragraphs: [
      'AI customer support is only as strong as the information it can rely on. When the source material is messy, outdated, duplicated, or incomplete, the support experience becomes shaky no matter how polished the interface looks.',
      'A good knowledge base for AI support is not just a storage folder full of documents. It is a maintained operating layer for answers your team actually stands behind. That means product explanations, support policies, troubleshooting flows, onboarding steps, billing guidance, and exception handling rules that stay current as the product changes.',
      'The first priority is clarity around what is canonical. If the same answer exists in three different places with three different versions, your team will hesitate and your AI will too. Pick the trusted version, name the owner, and retire the rest.',
      'The second priority is structure. Long documents are not automatically bad, but support knowledge works best when information is broken into clean sections with clear headings. That helps both people and retrieval systems find the right answer quickly.',
      'The third priority is relevance. Teams often upload broad company material and forget the real support questions that customers ask every day. The most useful additions are often the simple ones: cancellation rules, plan differences, setup steps, refund logic, permission models, and issue-specific troubleshooting.',
      'A strong workflow also includes testing. Ask your AI the real questions customers ask in chat, email, and calls. Check where it hesitates, overreaches, or misses a detail. Those moments are usually not model problems. They are documentation problems.',
      'The best knowledge bases keep getting better after launch. Every escalation, every confusing reply, and every repeated question gives you a signal about what the support system still needs. That is how your documentation becomes a living asset instead of an archive.',
    ],
  },
  {
    slug: 'human-handoff-in-ai-support',
    legacySlugs: ['meeting-intelligence-future'],
    title: 'Why human handoff is still essential in AI customer support',
    seoTitle: 'Human Handoff in AI Customer Support: How to Get It Right',
    seoDescription:
      'Human handoff remains essential in AI customer support. Learn how escalation, summaries, and clean routing help teams keep support fast without losing empathy.',
    seoKeywords:
      'human handoff in AI customer support, support escalation, AI customer service, human in the loop support, customer support workflows, support operations',
    category: 'Operations',
    categoryColor: 'bg-amber-100 text-amber-700',
    date: 'May 1, 2026',
    publishedTime: '2026-05-01T09:00:00+02:00',
    readingTime: '4 min read',
    excerpt:
      'AI can resolve a lot, but not every support moment should stay automated. Strong human handoff is what keeps speed, empathy, and accountability working together.',
    author: {
      name: 'Sarah Oba',
      initials: 'SO',
      role: 'Co-founder, Lira',
      image: '/sarah-oba-placeholder.svg',
    },
    paragraphs: [
      'There is a strange idea in some AI support conversations that success means never involving a human. In practice, the opposite is true. The best support systems know exactly when a person should step in and make that transition feel smooth.',
      'Customers do not mind automation when it is useful. What they mind is getting trapped in it. The moment they are dealing with an exception, a sensitive account issue, or a case that needs judgment, they want to feel that a real team is available and informed.',
      'That is why human handoff is not a fallback feature. It is part of the product experience. Good escalation should carry the reason for the handoff, the conversation history, the attempted resolution, and the context a teammate needs to continue without making the customer repeat everything again.',
      'It also helps internally. Support leaders need to know which issues are being escalated most often, which ones point to knowledge gaps, and which ones should always go to a human from the start. Those patterns make the support system smarter over time.',
      'The strongest teams treat AI and human support as one operation, not two separate worlds. AI handles the repeatable front line. Humans handle exceptions, nuance, and relationship-critical moments. The customer should feel continuity across both.',
      'When that handoff is done well, support gets faster without becoming colder. That balance is what makes AI customer support feel mature instead of brittle.',
    ],
  },
]

export function findBlogPostBySlug(slug?: string) {
  if (!slug) return undefined
  return BLOG_POSTS.find((post) => post.slug === slug || post.legacySlugs?.includes(slug))
}
