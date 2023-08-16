import React from 'react'

type CanvasProps = React.HTMLProps<HTMLCanvasElement> & {
  doesVideoNeedToBeMirrored: boolean
}

function isMutableRefObject<T extends HTMLElement>(
  ref: React.ForwardedRef<T>,
): ref is React.MutableRefObject<T> {
  if (ref != null && Object.hasOwn(ref, 'current')) {
    return true
  } else {
    return false
  }
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
