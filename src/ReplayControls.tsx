import React from 'react'
import { SpringValue, animated } from 'react-spring'
import { ReplaysTimeline } from './ReplaysTimeline'
import { useAppState } from './state'
interface ReplayControlsProps {
  currentReplayIndex: number
  isPlaying: boolean
  togglePlayPause: () => void
  style: {
    opacity: SpringValue<number>
  }
  replayVideoRef: React.MutableRefObject<HTMLVideoElement | null>
}

export const ControlsPadding = 16

export const ReplayControls: React.FunctionComponent<ReplayControlsProps> = ({
  currentReplayIndex,
  isPlaying,
  togglePlayPause,
  style,
  replayVideoRef,
}) => {
  const replayVideos = useAppState((s) => s.replayVideos)

  return (
    <animated.div
      onMouseEnter={() => useAppState.setState({ cursorIsOverControls: true })}
      onMouseLeave={() => useAppState.setState({ cursorIsOverControls: false })}
      style={{
        ...style,
        display: 'flex',
        padding: ControlsPadding,
        flexDirection: 'column',
        position: 'absolute',
        bottom: 0,
        width: `calc(100% - ${ControlsPadding * 2}px)`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          height: 64,
          gap: 16,
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <img
          width={32}
          height={32}
          src={isPlaying ? './play.svg' : 'pause.svg'}
          style={{
            display: 'block',
            cursor: 'pointer',
            flexShrink: 0,
            width: 32,
          }}
          alt='play'
          onClick={togglePlayPause}
        />
        <img
          width={32}
          height={32}
          alt='Download current instant replay'
          title='Download current instant replay'
          onClick={() => {
            const a = document.createElement('a')
            a.href = replayVideos[currentReplayIndex].url
            a.download = `handstand-${replayVideos[currentReplayIndex].startTime}`
            a.click()
          }}
          src='./download.svg'
          style={{
            display: 'block',
            cursor: 'pointer',
            flexShrink: 0,
            width: 32,
          }}
        />
        <ReplaysTimeline replayVideoRef={replayVideoRef} />
        <img
          width={96}
          height={32}
          src='./instant-replay-small.svg'
          alt='Instant Replay®'
          style={{
            display: 'block',
            flexShrink: 0,
            width: 96,
          }}
        />
      </div>
    </animated.div>
  )
}

ReplayControls.displayName = 'ReplayControls'
