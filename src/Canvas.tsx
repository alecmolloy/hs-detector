import React from 'react'
import { isMutableRefObject } from './utils'
import { useAppState } from './state'

type CanvasProps = React.HTMLProps<HTMLCanvasElement> & {}

export const Canvas = React.forwardRef<HTMLCanvasElement, CanvasProps>(
  (props, ref) => {
    if (!isMutableRefObject(ref)) {
      throw new Error('Improper ref passed to <Canvas /> component')
    }

    const canvasDimensions = useAppState((s) => s.canvasDimensions)
    const doesVideoNeedToBeMirrored = useAppState((s) =>
      s.doesVideoNeedToBeMirrored(),
    )

    return (
      <canvas
        {...props}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        ref={ref}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: [
            'translate(-50%, -50%)',
            doesVideoNeedToBeMirrored ? 'scaleX(-1)' : undefined,
          ].join(' '),
        }}
      />
    )
  },
)

Canvas.displayName = 'Canvas'
