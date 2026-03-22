// Shared blog post data used by BlogPage and BlogPostPage

export interface BlogPost {
  slug: string
  title: string
  category: string
  categoryColor: string
  date: string
  readingTime: string
  excerpt: string
  author: { name: string; initials: string; role: string }
  paragraphs: string[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'ai-interview-process',
    title: 'How AI is transforming the way teams conduct first-round interviews',
    category: 'Interviews',
    categoryColor: 'bg-violet-100 text-violet-700',
    date: 'March 18, 2026',
    readingTime: '6 min read',
    excerpt:
      "First-round interviews are the most time-consuming part of hiring — and the part where most bias creeps in. Here's how AI changes both.",
    author: { name: 'Amara L.', initials: 'AL', role: 'Head of Product · Lira AI' },
    paragraphs: [
      "Every hiring manager knows the feeling: you've got fifteen candidates to screen, a two-week window, and a full calendar. The first-round interview — meant to filter for the basics — ends up consuming three full days of your team's time.",
      'The problem isn\'t just time. It\'s consistency. When five different interviewers run the same "first round", candidates get five different experiences. Some get grilled on technical depth. Others are asked about culture fit. Evaluation becomes apples-to-oranges before the process has even really started.',
      'AI interviewing solves both problems simultaneously. When Lira conducts a first-round interview, every candidate gets the exact same structured experience — the same questions, the same follow-up logic, the same scoring rubric. The only variable is the candidate.',
      "But the real value isn't just consistency. It's the insight quality. Because Lira isn't managing three more calls after this one, it can give its full attention to listening. It notices when an answer is vague and probes deeper. It picks up on confidence markers in language. It synthesises a full competency score backed by specific quotes from the conversation.",
      'The output a hiring manager receives isn\'t just "passed" or "failed". It\'s a rich evaluation: what the candidate excelled at, where they struggled, how they compare to others interviewed for the same role, and a clear hire/no-hire recommendation with supporting evidence.',
      'Teams using Lira for first-round interviews typically see a 40% reduction in time-to-hire and report significantly higher confidence in their shortlists — because for the first time, every candidate on the shortlist was evaluated by the same standard.',
      'The interview process was never meant to be a marathon for HR teams. AI lets it be what it was designed to be: a fair, efficient filter that surfaces the right people faster.',
    ],
  },
  {
    slug: 'ai-sales-coaching',
    title: '5 ways Lira helps sales teams close more deals in real time',
    category: 'Sales',
    categoryColor: 'bg-emerald-100 text-emerald-700',
    date: 'March 12, 2026',
    readingTime: '5 min read',
    excerpt:
      "Real-time AI coaching isn't about replacing salespeople — it's about giving every rep the instincts of your best closer.",
    author: { name: 'David K.', initials: 'DK', role: 'Sales Lead · Axiom Labs' },
    paragraphs: [
      "The best sales reps don't just know your product. They know exactly what to say when a prospect hesitates, how to reframe a price objection, and which story to tell when a competitor is brought up. That knowledge takes years to develop — and it lives in a handful of people's heads.",
      'Lira changes that equation. Instead of waiting for reps to accumulate experience through trial and error, Lira gives every rep access to that knowledge in the moment they need it.',
      'Here are five ways it works in practice.',
      'First: real-time objection handling. The moment a prospect raises a concern — "we already have a tool for this" or "we need to check with legal" — Lira matches it against your playbook and surfaces the response that has historically worked best for that specific objection.',
      'Second: competitive intelligence on demand. If a competitor is mentioned, Lira pulls the relevant battle card instantly. No fumbling, no "let me look that up" — just smooth, informed responses that build confidence.',
      "Third: deal-stage awareness. Lira knows what stage of the deal you're in and coaches accordingly. It pushes for discovery in early calls and for commitment signals in closing ones.",
      "Fourth: post-call analysis. After every call, Lira flags what worked, what was missed, and what to do before the next touchpoint. It's like having a coach debrief you after every rep.",
      'Fifth: team-wide learning. The calls where deals are closed become training material — not manually curated, but automatically surfaced by Lira to the reps who most need to hear them.',
      "The best sales teams don't win because their reps are naturally gifted. They win because they build systems that replicate what their best people know. Lira is that system.",
    ],
  },
  {
    slug: 'knowledge-base-best-practices',
    title: 'Building a knowledge base your AI can actually use',
    category: 'Knowledge Base',
    categoryColor: 'bg-blue-100 text-blue-700',
    date: 'March 5, 2026',
    readingTime: '7 min read',
    excerpt:
      "Most company knowledge bases are a graveyard of outdated docs. Here's how to build one that powers your AI — and stays useful over time.",
    author: { name: 'Sofia R.', initials: 'SR', role: 'Head of Talent · NovaTech' },
    paragraphs: [
      "There's a common misconception that an AI knowledge base is just your existing documentation — uploaded, indexed, done. In practice, the quality of AI answers is almost entirely determined by the quality of the documents behind them.",
      'If your knowledge base is a graveyard of outdated PDFs, conflicting policy versions, and documents nobody maintains, your AI assistant will confidently give wrong answers. The garbage-in-garbage-out principle applies, and it applies harshly.',
      "Here's what we've learned about building a knowledge base that actually performs.",
      "Start with canonical documents, not comprehensive ones. You don't need every version of every document — you need the authoritative one. Create a clear ownership model: every document has one owner responsible for keeping it current.",
      'Structure matters more than length. Lira retrieves information by semantic similarity, not by reading documents top to bottom. Short, well-titled sections retrieve better than sprawling documents with no clear hierarchy. Think of each heading as a retrieval unit.',
      'Include your Q&A content explicitly. Support tickets, Slack FAQ channels, and internal wiki Q&As are goldmines. Converting these into clean question-answer format dramatically improves retrieval accuracy for common customer queries.',
      "Build freshness into your process. A knowledge base that's accurate today but not maintained becomes a liability within six months. Build a quarterly review cycle, and connect your KB updates to your product release process.",
      'Test your AI before you deploy it. Upload your documents and then interrogate Lira with real questions your customers or team would ask. The gaps and confusions you find in testing are the gaps that will embarrass you in production.',
      "The teams getting the most value from Lira's knowledge base feature aren't the ones with the most documents — they're the ones with the best-maintained, best-structured ones. Quality over volume, every time.",
    ],
  },
  {
    slug: 'meeting-intelligence-future',
    title: 'The meeting is only the beginning: what AI does after you hang up',
    category: 'Meeting Intelligence',
    categoryColor: 'bg-amber-100 text-amber-700',
    date: 'February 26, 2026',
    readingTime: '4 min read',
    excerpt:
      'Recording a meeting is easy. Turning what was said into action is the hard part — and the part AI is just beginning to crack.',
    author: { name: 'Amara L.', initials: 'AL', role: 'Head of Product · Lira AI' },
    paragraphs: [
      'We\'ve been recording meetings for years. The recordings sit in Google Drive, unwatched, taking up storage and creating an illusion that the information is somehow "captured".',
      'Recording is not capture. Recording is storage. Capture is what happens when the content of a conversation becomes something your team can actually act on.',
      'The gap between those two things is where most organisations leak enormous amounts of strategic value. Decisions get made in meetings that never show up in any system of record. Tasks are assigned verbally and then forgotten by Tuesday. Insights shared in a 40-person all-hands remain in the heads of the thirty people who actually listened.',
      "Meeting intelligence — real meeting intelligence, not just transcription — changes this. When Lira participates in a meeting, it's not just capturing what was said. It's understanding the structure of the conversation: what was proposed, what was agreed, what was assigned to whom, and what questions remained open.",
      'After the call, that understanding gets transformed into outputs your team can immediately act on. Tasks with owners and deadlines go to Slack. Key decisions get logged to a searchable record. Open questions become agenda items for the next meeting.',
      'The value compounds over time. When you can ask "what did we decide about the pricing model in Q4?" and get an accurate answer backed by source quotes from three meetings, your organisational memory stops being tied to the people who were in the room.',
      'The meeting was always just the beginning. AI is finally making it possible to capture everything that follows.',
    ],
  },
]
