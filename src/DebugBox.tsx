import React from 'react'

interface DebugBoxProps {
  debugOverrideHandstandState: boolean
  setDebugOverrideHandstandState: React.Dispatch<React.SetStateAction<boolean>>
  debugWireframes: boolean
  setDebugWireframes: React.Dispatch<React.SetStateAction<boolean>>
}

export const DebugBox: React.FC<React.PropsWithChildren<DebugBoxProps>> = ({
  debugOverrideHandstandState,
  setDebugOverrideHandstandState,
  debugWireframes,
  setDebugWireframes,
}) => {
  return (
    <div
      style={{
        width: '80%',
        height: 40,
        backgroundColor: 'white',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        paddingLeft: 4,
        paddingRight: 4,
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
            setDebugOverrideHandstandState((v) => !v)
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
            setDebugWireframes((v) => !v)
          }}
        />{' '}
        Wireframes
      </label>
    </div>
  )
}
