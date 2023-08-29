import React from 'react'
import { SpringValue, animated } from 'react-spring'
import { ReplayList } from './ReplayList'
import { useAppState } from './state'
interface ReplayControlsProps {
  currentReplayIndex: number
  isPlaying: boolean
  togglePlayPause: () => void
  style: {
    opacity: SpringValue<number>
  }
}

export const ReplayControls: React.FunctionComponent<ReplayControlsProps> = ({
  currentReplayIndex,
  isPlaying,
  togglePlayPause,
  style,
}) => {
  const replayVideos = useAppState((s) => s.replayVideos)

  return (
    <animated.div
      onMouseEnter={() => useAppState.setState({ cursorIsOverControls: true })}
      onMouseLeave={() => useAppState.setState({ cursorIsOverControls: false })}
      style={{
        ...style,
        display: 'flex',
        gap: 12,
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
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          height: 64,
        }}
      >
        <img
          width={32}
          height={32}
          src={isPlaying ? './play.svg' : 'pause.svg'}
          alt='play'
          onClick={togglePlayPause}
        />
        <ReplayList />
        <img
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
            height: 32,
            cursor: 'pointer',
          }}
        />
        <img
          height={32}
          src='./instant-replay.svg'
          alt='Instant Replay®'
          style={{
            display: 'block',
            opacity: 0,
          }}
        />
      </div>
    </animated.div>
  )
}

ReplayControls.displayName = 'ReplayControls'
