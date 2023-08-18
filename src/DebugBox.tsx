import React from 'react'
import { useAppState } from './state'

interface DebugBoxProps {}

export const DebugBox: React.FC<
  React.PropsWithChildren<DebugBoxProps>
> = () => {
  const debugWireframes = useAppState((s) => s.debugWireframes)
  const debugOverrideHandstandState = useAppState(
    (s) => s.debugOverrideHandstandState,
  )

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '100%',
        backgroundColor: 'white',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        padding: 8,
        boxShadow: '0 0 10px #0004',
        fontSize: 8,
        fontWeight: 600,
        display: 'flex',
        flexDirection: 'column',
        rowGap: 4,
      }}
    >
      <label style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type='checkbox'
          style={{ width: 8, height: 8, marginRight: 4 }}
          checked={debugOverrideHandstandState}
          onChange={() => {
            useAppState.setState((s) => ({
              debugOverrideHandstandState: !s.debugOverrideHandstandState,
            }))
          }}
        />{' '}
        Handstanding
      </label>
      <label style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type='checkbox'
          style={{ width: 8, height: 8, marginRight: 4 }}
          checked={debugWireframes}
          onChange={() => {
            useAppState.setState((s) => ({
              debugWireframes: !s.debugWireframes,
            }))
          }}
        />{' '}
        Wireframes
      </label>
    </div>
  )
}
