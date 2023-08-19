import React from 'react'
import { useAppState } from './state'
import { isMutableRefObject } from './utils'
import { ReplayControls } from './ReplayControls'

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

  const replayVideoURLs = useAppState((s) => s.replayVideoURLs)

  const replayVideoStarts = useAppState((s) => s.replayVideoStartOffets)

  const previewCorner = useAppState((s) => s.previewCorner)

  const startFromOffset = React.useCallback(() => {
    if (currentReplayIndex == null || replayVideoStarts.length === 0) {
      throw new Error(
        `currentReplayIndex must not be null, and replayVideoStarts must have content`,
      )
    }

    const replayVideo = replayVideoRef.current
    if (replayVideo != null) {
      const replayVideoStart = replayVideoStarts[currentReplayIndex]
      console.log(replayVideo.currentTime, replayVideoStart / 1000)
      replayVideo.currentTime = Math.max(0, replayVideoStart / 1000)
      replayVideo.play()
    }
  }, [currentReplayIndex, replayVideoRef, replayVideoStarts])

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <video
        ref={replayVideoRef}
        id='replay'
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        src={replayVideoURLs[currentReplayIndex]}
        onLoadedMetadata={startFromOffset}
        onEnded={startFromOffset}
        controls={false}
        style={{
          transform: useAppState().doesVideoNeedToBeMirrored()
            ? 'scaleX(-1)'
            : undefined,
        }}
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
      <img
        src='./instant-replay.svg'
        alt='Instant Replay®'
        style={{
          width: '35%',
          color: '#fffa',
          fontSize: 30,
          fontStyle: 'italic',
          position: 'absolute',
          fontWeight: 800,
          bottom: 8,
          ...(previewCorner === 'tl' || previewCorner === 'bl'
            ? { right: 8 }
            : { left: 8 }),
        }}
      />
      <ReplayControls />
    </div>
  )
})
