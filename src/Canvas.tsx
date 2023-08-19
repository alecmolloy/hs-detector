import React from 'react'
import { isMutableRefObject } from './utils'

type CanvasProps = React.HTMLProps<HTMLCanvasElement> & {
  doesVideoNeedToBeMirrored: boolean
}

export const Canvas = React.forwardRef<HTMLCanvasElement, CanvasProps>(
  ({ doesVideoNeedToBeMirrored, ...props }, ref) => {
    if (!isMutableRefObject(ref)) {
      throw new Error('Improper ref passed to <Canvas /> component')
    }

    return (
      <canvas
        {...props}
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
