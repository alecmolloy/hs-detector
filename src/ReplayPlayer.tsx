import React from 'react'
import { animated, useSpring, useTransition } from 'react-spring'
import { ReplayControls } from './ReplayControls'
import { useAppState } from './state'
import { isMutableRefObject } from './utils'

interface ReplayPlayerProps {
  currentReplayIndex: number
}

export const ReplayPlayer = React.forwardRef<
  HTMLVideoElement,
  ReplayPlayerProps
>(({ currentReplayIndex }, replayVideoRef) => {
  if (!isMutableRefObject(replayVideoRef)) {
    throw new Error('Improper ref passed to ReplayPlayer component')
  }

  const canvasDimensions = useAppState((s) => s.canvasDimensions)
  const replayVideos = useAppState((s) => s.replayVideos)
  const previewCorner = useAppState((s) => s.previewCorner)
  const doesVideoNeedToBeMirrored = useAppState((s) =>
    s.doesVideoNeedToBeMirrored(),
  )

  const hasMouseMovedWithinLast3Seconds = useAppState(
    (s) => s.controlsActiveFor3Seconds,
  )
  const isCursorIsOverControls = useAppState((s) => s.cursorIsOverControls)

  const springs = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 150 },
  })

  const isPlaying = replayVideoRef.current?.paused === true

  const togglePlayPause = React.useCallback(() => {
    if (replayVideoRef.current != null) {
      if (replayVideoRef.current.paused) {
        replayVideoRef.current.play()
      } else {
        replayVideoRef.current.pause()
      }
    }
  }, [replayVideoRef])

  // On mount, make sure controls show for 3 seconds
  React.useEffect(() => {
    useAppState.setState({ controlsActiveFor3Seconds: true })
    window.setTimeout(() => {
      useAppState.setState({ controlsActiveFor3Seconds: false })
    })
  }, [])

  const controlsTransition = useTransition(
    hasMouseMovedWithinLast3Seconds || isCursorIsOverControls,
    {
      from: { opacity: 0 },
      enter: { opacity: 1, config: { duration: 150 } },
      leave: { opacity: 0, config: { duration: 0 } },
    },
  )

  React.useEffect(() => {
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useAppState.setState({ currentReplayIndex: null })
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  return (
    <animated.div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        ...springs,
      }}
    >
      <video
        ref={replayVideoRef}
        id='replay'
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        src={replayVideos[currentReplayIndex].url}
        controls={false}
        style={{
          display: 'block',
          transform: doesVideoNeedToBeMirrored ? 'scaleX(-1)' : undefined,
        }}
        loop
        autoPlay
      />
      <div
        style={{
          color: 'white',
          fontWeight: 600,
          fontSize: 32,
          position: 'absolute',
          top: 4,
          ...(previewCorner === 'tl' || previewCorner === 'bl'
            ? { right: 4 }
            : { left: 4 }),
          width: 40,
          height: 40,
          textAlign: 'center',
          userSelect: 'none',
          cursor: 'pointer',
          textShadow: '0 0 4px #0004',
        }}
        onClick={useAppState().closeReplay}
      >
        ×
      </div>
      {controlsTransition(
        (style, isShowing) =>
          isShowing && (
            <ReplayControls
              style={style}
              currentReplayIndex={currentReplayIndex}
              isPlaying={isPlaying}
              togglePlayPause={togglePlayPause}
            />
          ),
      )}
      <img
        height={32}
        src='./instant-replay.svg'
        alt='Instant Replay®'
        style={{
          display: 'block',
          position: 'absolute',
          bottom: 32,
          right: 16,
        }}
      />
    </animated.div>
  )
})

ReplayPlayer.displayName = 'ReplayPlayer'
