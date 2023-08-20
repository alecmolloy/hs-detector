import React from 'react'
import { CornerSnapper } from './CornerSnapper'
import { useAppState } from './state'
import { isMutableRefObject } from './utils'
import { RecordingLabel } from './RecordingLabel'
import { DebugMode } from './App'
import { DebugBox } from './DebugBox'

interface Props {
  sourceAspectRatio: number
}

export const LivePreview = React.forwardRef<HTMLVideoElement, Props>(
  ({ sourceAspectRatio }, ref) => {
    if (!isMutableRefObject(ref)) {
      throw new Error('Improper ref passed to <Canvas /> component')
    }

    const handstandStart = useAppState((s) => s.handstandStart)

    const doesVideoNeedToBeMirrored = useAppState((s) =>
      s.doesVideoNeedToBeMirrored(),
    )

    const thumbnailHeight = 150
    const thumbnailWidth = thumbnailHeight * sourceAspectRatio

    React.useEffect(() => {
      if (ref.current != null) {
        ref.current.addEventListener(
          'loaded',
          () => {
            if (ref.current != null) {
              useAppState.setState({
                sourceDimensions: {
                  width: ref.current.width,
                  height: ref.current.height,
                },
              })
            }
          },
          false,
        )
      }
    }, [ref])

    return (
      <CornerSnapper
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
          borderRadius: 10,
          boxShadow: '0 0 10px #0004',
        }}
      >
        <div
          style={{
            display: 'flex',
            pointerEvents: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <video
            style={{
              transform: doesVideoNeedToBeMirrored ? 'scaleX(-1)' : undefined,
            }}
            width={thumbnailWidth}
            height={thumbnailHeight}
            muted
            controls={false}
            autoPlay
            loop
            ref={ref}
          />
          {handstandStart != null && <RecordingLabel />}
        </div>
        {DebugMode && <DebugBox />}
      </CornerSnapper>
    )
  },
)
