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
  const replayVideos = useAppState((s) => s.replayVideos)
  const previewCorner = useAppState((s) => s.previewCorner)
  const doesVideoNeedToBeMirrored = useAppState((s) =>
    s.doesVideoNeedToBeMirrored(),
  )

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
      <ReplayControls currentReplayIndex={currentReplayIndex} />
    </div>
  )
})

ReplayPlayer.displayName = 'ReplayPlayer'
