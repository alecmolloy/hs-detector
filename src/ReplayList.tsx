import { useAppState } from './state'
import { formatDuration } from './utils'

const BaseBoxShadow = '0px 0px 10px rgba(0, 0, 0, 0.2)'
const SelectedBoxShadow = '0 0 0 5px rgb(94, 151, 247)'

const DefaultStateBoxShadow = BaseBoxShadow
const SelectedStateBoxShadow = [BaseBoxShadow, SelectedBoxShadow].join(', ')

export const ReplayList = () => {
  const replayVideos = useAppState((state) => state.replayVideos)
  const currentReplayIndex = useAppState((state) => state.currentReplayIndex)

  return (
    <div
      style={{
        overflowX: 'scroll',
        width: '100%',
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        display: 'flex',
        flexDirection: 'row-reverse',
        height: '100%',
        gap: 16,
        padding: 8,
      }}
    >
      {replayVideos.map(({ length, screenshots }, index) => (
        <div
          key={index}
          onClick={() => useAppState.setState({ currentReplayIndex: index })}
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: 54,
            height: 54,
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
                ? SelectedStateBoxShadow
                : DefaultStateBoxShadow,
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
