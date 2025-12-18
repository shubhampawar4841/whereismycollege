"use client"

import './wave-loader.css'

export function WaveLoader() {
  return (
    <div className="wave-loader-container">
      <div className="loading-wave">
        <div className="loading-bar" />
        <div className="loading-bar" />
        <div className="loading-bar" />
        <div className="loading-bar" />
      </div>
    </div>
  )
}

