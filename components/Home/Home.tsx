import React from 'react'
import MixerHome from '../Mixer/MixerHome'
import P0SimulationHome from '../P0Simulation/P0SimulationHome'

export default function Home() {

  return (
    <div>
      {
        process.env.NEXT_PUBLIC_P0_MODE === "true"
        ?
        <P0SimulationHome />
        :
        process.env.NEXT_PUBLIC_MIXER_STORY_FLAG === "true"
        ?
        "It's coooking . Until then checkout the questions"
        :
      <MixerHome />
      }
    </div>
  )
}
