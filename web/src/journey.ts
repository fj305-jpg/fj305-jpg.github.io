import { create } from 'zustand'
export const chapters = [
  {id:'about',label:'About',scene:'A little about me'},
  {id:'education',label:'GHCIS',scene:'Education · High school'},
  {id:'cambridge',label:'Cambridge',scene:'Education · University'},
  {id:'quantitative',label:'Quantitative',scene:'Experiences · Quantitative'},
  {id:'engineering',label:'Engineering',scene:'Experiences · Engineering'},
  {id:'interests',label:'Interests',scene:'Karting · Football · Guan Dan'},
  {id:'contact',label:'Contact',scene:'Get in touch'},
] as const
interface JourneyState {active:number;focus:'quant'|'engineering';interest:'karting'|'football'|'guandan';setActive:(n:number)=>void;selectFocus:(focus:'quant'|'engineering')=>void;setInterest:(interest:'karting'|'football'|'guandan')=>void}
export const useJourney = create<JourneyState>(set=>({active:0,focus:'quant',interest:'karting',setActive:active=>set({active}),selectFocus:focus=>set({focus}),setInterest:interest=>set({interest})}))
