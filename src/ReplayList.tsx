import React from 'react'
import { useAppState } from './state'
import { formatDuration } from './utils'

export const ReplayList = () => {
  const replayVideos = useAppState((state) => state.replayVideos)
  const currentReplayIndex = useAppState((state) => state.currentReplayIndex)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        display: 'flex',
        overflowX: 'scroll',
        backgroundColor: 'white',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
        width: 'calc(100% - 32px)',
        borderRadius: 10,
      }}
    >
      {replayVideos.map(({ length, screenshots }, index) => (
        <div
          key={index}
          onClick={() => useAppState.setState({ currentReplayIndex: index })}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: 12,
            marginRight: 3,
            width: 60,
            height: 60,
            borderRadius: 8,
            backgroundImage: `url(${
              screenshots[Math.floor(screenshots.length / 2)]
            })`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            backgroundColor: '#0001',
            boxShadow:
              currentReplayIndex === index
                ? '0 0 0 5px rgb(94, 151, 247)'
                : undefined,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 4,
              left: 4,
              padding: 2,
              borderRadius: 4,
              backgroundColor: '#fff8',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {formatDuration(length)}
          </div>
        </div>
      ))}
    </div>
  )
}
