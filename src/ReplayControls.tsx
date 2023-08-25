import { useAppState } from './state'
interface ReplayControlsProps {
  currentReplayIndex: number
}

export const ReplayControls: React.FunctionComponent<ReplayControlsProps> = ({
  currentReplayIndex,
}) => {
  const previewCorner = useAppState((s) => s.previewCorner)
  const replayVideos = useAppState((s) => s.replayVideos)

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        padding: 16,
        flexDirection: 'column',
        position: 'absolute',
        bottom: 0,
        width: 'calc(100% - 32px)',
      }}
    >
      <div
        style={{
          height: 8,
          backgroundColor: 'white',
          borderRadius: 4,
        }}
      ></div>
      <div
        style={{
          display: 'flex',
          justifyContent:
            previewCorner === 'tl' || previewCorner === 'bl' ? 'end' : 'start',
          flexDirection: 'row',
          gap: 16,
        }}
      >
        <img
          src='./instant-replay.svg'
          alt='Instant Replay®'
          style={{
            display: 'block',
            height: 32,
          }}
        />
        <img
          alt='download'
          onClick={() => {
            const a = document.createElement('a')
            a.href = replayVideos[currentReplayIndex].url
            a.download = `handstand-${replayVideos[currentReplayIndex].startTime}`
            a.click()
          }}
          src='./download.svg'
          style={{
            display: 'block',
            height: 32,
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  )
}

ReplayControls.displayName = 'ReplayControls'
