import {
  ChatBubbleLeftIcon,
  HandRaisedIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  PresentationChartBarIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import { Button, Cluster } from '@/components/common'

type MeetingControlsBarProps = {
  onLeave?: () => void
  isConnected?: boolean
}

function MeetingControlsBar({ onLeave, isConnected }: MeetingControlsBarProps) {
  return (
    <footer className="sticky bottom-3 z-20">
      <div className="mx-auto w-fit rounded-2xl border bg-background/95 p-2 shadow-lg backdrop-blur">
        <Cluster gap="var(--space-2)" wrap={false}>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Toggle microphone"
            disabled={!isConnected}
          >
            <MicrophoneIcon />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Toggle camera">
            <VideoCameraIcon />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Share screen">
            <PresentationChartBarIcon />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Open chat">
            <ChatBubbleLeftIcon />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Raise hand">
            <HandRaisedIcon />
          </Button>
          <Button variant="destructive" size="icon" aria-label="Leave meeting" onClick={onLeave}>
            <PhoneXMarkIcon />
          </Button>
        </Cluster>
      </div>
    </footer>
  )
}

export { MeetingControlsBar, type MeetingControlsBarProps }
