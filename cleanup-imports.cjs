const fs = require('fs')

// Files where ArrowPathIcon import should be removed (no remaining uses)
const files = [
  'src/components/bot-deploy/BotDeployPanel.tsx',
  'src/components/common/ConfirmDialog.tsx',
  'src/pages/MeetingsPage.tsx',
  'src/pages/OrgEmailPage.tsx',
  'src/pages/WebhooksPage.tsx',
  'src/pages/MemberProfilePage.tsx',
  'src/pages/OrgSettingsPage.tsx',
  'src/pages/InterviewsPage.tsx',
  'src/pages/InterviewRolePage.tsx',
  'src/pages/OnboardingPage.tsx',
  'src/pages/OrgMembersPage.tsx',
  'src/pages/TasksPage.tsx',
  'src/pages/DashboardPage.tsx',
  'src/pages/InterviewCreatePage.tsx',
  'src/pages/OrgTaskDetailPage.tsx',
]

let cleaned = 0

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content

  // Pattern: "  ArrowPathIcon,\n" as a line in a multi-line import
  content = content.replace(/  ArrowPathIcon,\n/g, '')

  // Pattern: "ArrowPathIcon, " at start of import list
  content = content.replace(/ArrowPathIcon, /g, '')

  // Pattern: ", ArrowPathIcon" at end before } or other items
  content = content.replace(/, ArrowPathIcon/g, '')

  // Pattern: standalone "import { ArrowPathIcon } from ..."
  content = content.replace(/import \{ ArrowPathIcon \} from '[^']+'\n/g, '')

  // Pattern: "import { ArrowPathIcon, ..." -> "import { ..."
  content = content.replace(/import \{ ArrowPathIcon, /g, 'import { ')

  if (content !== original) {
    fs.writeFileSync(file, content)
    cleaned++
    console.log(`Cleaned: ${file}`)
  } else {
    console.log(`No change: ${file}`)
  }
}

console.log(`\nCleaned ${cleaned} files`)
