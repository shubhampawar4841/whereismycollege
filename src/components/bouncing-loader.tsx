"use client"

import './bouncing-loader.css'

export function BouncingLoader() {
  return (
    <div className="bouncing-loader-wrapper">
      <div className="bouncing-loader-circle" />
      <div className="bouncing-loader-circle" />
      <div className="bouncing-loader-circle" />
      <div className="bouncing-loader-shadow" />
      <div className="bouncing-loader-shadow" />
      <div className="bouncing-loader-shadow" />
    </div>
  )
}

