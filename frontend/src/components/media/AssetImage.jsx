import React from 'react'

export default function AssetImage({ src, alt, className = '', ...props }) {
  if (!src) return null
  return <img src={src} alt={alt} className={className} {...props} />
}
