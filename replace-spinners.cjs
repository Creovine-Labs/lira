const fs = require('fs')

const files = [
  'src/components/bot-deploy/AuthStatusCard.tsx',
  'src/components/bot-deploy/BotDeployPanel.tsx',
  'src/components/common/ConfirmDialog.tsx',
  'src/pages/MeetingsPage.tsx',
  'src/pages/OrgEmailPage.tsx',
  'src/pages/WebhooksPage.tsx',
  'src/pages/MemberProfilePage.tsx',
  'src/pages/OrgSettingsPage.tsx',
  'src/pages/DocumentsPage.tsx',
  'src/pages/KnowledgeBasePage.tsx',
  'src/pages/InterviewsPage.tsx',
  'src/pages/InterviewRolePage.tsx',
  'src/pages/InterviewDetailPage.tsx',
  'src/pages/OnboardingPage.tsx',
  'src/pages/OrgMembersPage.tsx',
  'src/pages/TasksPage.tsx',
  'src/pages/MeetingDetailPage.tsx',
  'src/pages/DashboardPage.tsx',
  'src/pages/InterviewCreatePage.tsx',
  'src/pages/OrgTaskDetailPage.tsx',
]

let totalReplacements = 0

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content

  // Pattern 1: Simple static classes with animate-spin
  // e.g. <ArrowPathIcon className="h-4 w-4 animate-spin" />
  // e.g. <ArrowPathIcon className="h-3 w-3 animate-spin text-white" />
  // e.g. <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
  content = content.replace(
    /<ArrowPathIcon className="([^"]*?)animate-spin([^"]*?)" \/>/g,
    (match, before, after) => {
      // Remove text-color classes since img doesn't use them
      let classes = (before + after).replace(/\btext-\S+/g, '').trim()
      if (classes) classes = classes + ' '
      return `<img src="/lira_black.png" alt="Loading" className="${classes}animate-spin opacity-50" style={{ animationDuration: '1.2s' }} />`
    }
  )

  // Pattern 2: cn() with animate-spin already in string
  // e.g. <ArrowPathIcon className={cn('h-5 w-5 animate-spin', STATE_COLORS[botState])} />
  content = content.replace(
    /<ArrowPathIcon className=\{cn\('([^']*animate-spin[^']*)'(?:,\s*[^)]+)?\)\} \/>/g,
    (match, classes) => {
      let cleanClasses = classes.replace(/\btext-\S+/g, '').trim()
      return `<img src="/lira_black.png" alt="Loading" className="${cleanClasses} opacity-50" style={{ animationDuration: '1.2s' }} />`
    }
  )

  // Pattern 3: cn() with conditional animate-spin
  // e.g. <ArrowPathIcon className={cn('h-4 w-4', regenerating && 'animate-spin')} />
  content = content.replace(
    /<ArrowPathIcon className=\{cn\('([^']+)',\s*(\w+)\s*&&\s*'animate-spin'\)\} \/>/g,
    (match, size, condition) => {
      return `<img src="/lira_black.png" alt="Loading" className={cn('${size} opacity-50', ${condition} && 'animate-spin')} style={${condition} ? { animationDuration: '1.2s' } : undefined} />`
    }
  )

  if (content !== original) {
    const beforeCount = (original.match(/<ArrowPathIcon/g) || []).length
    const afterCount = (content.match(/<ArrowPathIcon/g) || []).length
    const count = beforeCount - afterCount
    totalReplacements += count
    fs.writeFileSync(file, content)
    console.log(
      `${file}: ${count} spinner replacements (${afterCount} ArrowPathIcon remaining for non-spinner use)`
    )
  }
}

console.log(`\nTotal: ${totalReplacements} ArrowPathIcon spinners replaced with Lira logo`)
