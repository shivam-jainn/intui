import React from 'react'
import MixerHome from '../Mixer/MixerHome'

export default function Home() {

  return (
    <div>
      {
        process.env.NEXT_PUBLIC_MIXER_STORY_FLAG === "true"
        ?
        "It's coooking . Until then checkout the questions"
        :
      <MixerHome />
      }
    </div>
  )
}
