import {
  HandRaisedIcon,
  MapPinIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
} from '@heroicons/react/24/outline'
import { Avatar, AvatarFallback, AvatarImage, Badge } from '@/components/common'
import { cn } from '@/lib'

type ParticipantTileProps = {
  name: string
  role?: string
  avatarUrl?: string
  muted?: boolean
  cameraOff?: boolean
  activeSpeaker?: boolean
  speaking?: boolean
  handRaised?: boolean
  pinned?: boolean
  className?: string
}

function ParticipantTile({
  name,
  role,
  avatarUrl,
  muted = false,
  cameraOff = false,
  activeSpeaker = false,
  speaking = false,
  handRaised = false,
  pinned = false,
  className,
}: ParticipantTileProps) {
  const showActiveSpeaker = activeSpeaker || speaking

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-3 shadow-sm transition-all',
        showActiveSpeaker && 'ring-2 ring-emerald-400/80 shadow-emerald-300/30',
        pinned && 'border-amber-400/70 shadow-amber-300/40',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
      {pinned ? (
        <div className="absolute right-2 top-2 z-10 rounded-full bg-amber-400/20 px-2 py-1 text-[10px] font-semibold text-amber-800">
          Pinned Speaker
        </div>
      ) : null}

      <div className="relative flex h-full min-h-40 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant={showActiveSpeaker ? 'default' : 'secondary'}
              className="max-w-[80%] truncate"
            >
              {role ?? 'Participant'}
            </Badge>
            {showActiveSpeaker ? (
              <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-700">
                <SpeakerWaveIcon className="h-3 w-3" />
                Speaking
              </Badge>
            ) : null}
            {muted ? (
              <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive">
                <SpeakerXMarkIcon className="h-3 w-3" />
                Muted
              </Badge>
            ) : null}
            {handRaised ? (
              <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-700">
                <HandRaisedIcon className="h-3 w-3" />
                HandRaisedIcon Raised
              </Badge>
            ) : null}
          </div>

          {pinned ? (
            <span
              className="rounded-full bg-background/80 p-1 text-foreground"
              aria-label="Pinned participant"
            >
              <MapPinIcon className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar>
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className={cn(
                'rounded-full p-1.5',
                muted ? 'bg-destructive/20' : 'bg-emerald-500/20'
              )}
            >
              {muted ? (
                <SpeakerXMarkIcon className="h-3.5 w-3.5 text-destructive" />
              ) : (
                <MicrophoneIcon className="h-3.5 w-3.5 text-emerald-600" />
              )}
            </span>
            <span className={cn('rounded-full p-1.5', cameraOff ? 'bg-muted' : 'bg-sky-500/20')}>
              {cameraOff ? (
                <VideoCameraSlashIcon className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <VideoCameraIcon className="h-3.5 w-3.5 text-sky-600" />
              )}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

export { ParticipantTile, type ParticipantTileProps }
