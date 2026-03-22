import { CpuChipIcon, SparklesIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline'
import { Avatar, AvatarFallback, Badge, Button, Stack } from '@/components/common'
import { cn } from '@/lib'

type AiParticipantCardProps = {
  name?: string
  status?: 'idle' | 'listening' | 'thinking' | 'speaking'
  className?: string
}

const statusMap: Record<NonNullable<AiParticipantCardProps['status']>, string> = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
}

function AiParticipantCard({
  name = 'Lira AI',
  status = 'speaking',
  className,
}: AiParticipantCardProps) {
  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl border border-sky-400/40 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-cyan-500/10 p-4 shadow-md',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.22),transparent_55%)]" />

      <Stack className="relative h-full justify-between" gap="var(--space-4)">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className="gap-1 bg-sky-600 text-white hover:bg-sky-600">
              <CpuChipIcon className="h-3 w-3" />
              AI Participant
            </Badge>
            <Badge variant="outline" className="gap-1 border-sky-400/40 bg-sky-500/10 text-sky-700">
              <SparklesIcon className="h-3 w-3" />
              {statusMap[status]}
            </Badge>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="ring-2 ring-sky-400/40">
              <AvatarFallback className="bg-sky-600 text-white">
                <CpuChipIcon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">Realtime assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-500/15 p-1.5 text-sky-700">
              <SpeakerWaveIcon className="cn('h-3.5 w-3.5', status === 'speaking' && 'animate-pulse')" />
            </span>
            <Button variant="outline" size="sm" className="border-sky-300/50 bg-background/70">
              Prompt
            </Button>
          </div>
        </div>
      </Stack>
    </article>
  )
}

export { AiParticipantCard, type AiParticipantCardProps }
