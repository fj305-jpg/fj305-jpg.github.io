import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Scene from './scene/PortraitStage'
import { chapters, useJourney } from './journey'
gsap.registerPlugin(ScrollTrigger,useGSAP)

const quantitative=[
  {title:'Optiver & Cambridge Trading Academy',role:'Selected participant',date:'Oct – Nov 2026',text:'Python market-making and cross-market arbitrage on a simulated exchange, with a focus on quoting, execution, hedging and inventory risk.'},
  {title:'The Thalesians',role:'Quantitative Research Intern',date:'Jul – Aug 2026',text:'Research across AI-infrastructure equities, combining residual momentum and earnings features with time-series and walk-forward validation.'},
  {title:'Cross-Asset CTA Strategy Research',role:'Independent research',date:'Jan – Apr 2026',text:'Multi-horizon trend signals across 37 instruments, with volatility-aware allocation, transaction costs and walk-forward evaluation.'},
]
const engineering=[
  {title:'Full Blue Racing',role:'Powertrain Engineer',date:'Jan 2026 – Present',text:'Powertrain component design in SolidWorks, using finite-element analysis and performance modelling to evaluate integration, reliability and efficiency.'},
  {title:'Airbus',role:'Quality Operations Engineer Intern',date:'Mar – Apr 2026',text:'A320 flight-line inspections and engine / APU de-preservation, with inspection records and defect traceability.'},
  {title:'Windshield Defrost Duct',role:'Design & validation',date:'Jul – Aug 2024',text:'Designed and optimised a vehicle defrost duct in Ansys CFX, then 3D-printed and tested it on-vehicle against CFD predictions.'},
  {title:'Mars Lander',role:'C++ simulation & control',date:'Jul – Aug 2026',text:'Descent simulation using Euler and Verlet integration, with feedback control tested against touchdown-speed and fuel constraints.'},
  {title:'Soil–Structure Damping',role:'Engineering analysis',date:'',text:'Modelling and interpreting the dynamic response of a soil–structure system.'},
  {title:'Flood Forecasting & Alerting',role:'Software & data engineering',date:'Sep – Dec 2025',text:'A Python river-monitoring and flood-risk pipeline, with model evaluation, API-based inference and data-quality monitoring.'},
]
class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<div className="model-unavailable">JF<span>The 3D view needs WebGL.<br/>All résumé content is available below.</span></div>:this.props.children}
}
function ExperienceList({items}:{items:typeof quantitative}){return <div className="experience-list">{items.map(item=><article className="experience-item" key={item.title}>
  <div className="entry-meta"><span>{item.role}</span><time>{item.date}</time></div><h3>{item.title}</h3><p>{item.text}</p>
</article>)}</div>}
export default function ResumeApp(){
  const root=useRef<HTMLDivElement>(null)
  const [menu,setMenu]=useState(false)
  const reduced=useReducedMotion()
  const [portraitStatus,setPortraitStatus]=useState<'loading'|'ready'|'static'>('loading')
  useEffect(()=>{
    const ready=()=>setPortraitStatus('ready'),failed=()=>setPortraitStatus('static'),loading=()=>setPortraitStatus('loading')
    window.addEventListener('portrait-loading',loading);window.addEventListener('portrait-ready',ready);window.addEventListener('portrait-error',failed)
    return()=>{window.removeEventListener('portrait-loading',loading);window.removeEventListener('portrait-ready',ready);window.removeEventListener('portrait-error',failed)}
  },[])
  const active=useJourney(s=>s.active),setActive=useJourney(s=>s.setActive)
  const interest=useJourney(s=>s.interest),setInterest=useJourney(s=>s.setInterest)
  useGSAP(()=>{
    const sections=gsap.utils.toArray<HTMLElement>('.chapter')
    sections.forEach((section,i)=>{
      ScrollTrigger.create({trigger:section,start:'top 45%',end:'bottom 45%',onEnter:()=>setActive(i),onEnterBack:()=>setActive(i)})
      if(!reduced)gsap.from(section.querySelector('.chapter-copy'),{y:20,ease:'none',scrollTrigger:{trigger:section,start:'top 85%',end:'top 30%',scrub:.6}})
    })
    gsap.to('.reading-progress',{scaleX:1,ease:'none',scrollTrigger:{trigger:root.current,start:'top top',end:'bottom bottom',scrub:true}})
  },{scope:root,dependencies:[reduced],revertOnUpdate:true})
  function go(i:number){document.getElementById(chapters[i].id)?.scrollIntoView({behavior:reduced?'instant':'smooth'});setMenu(false)}
  const nav=[{label:'About',i:0},{label:'Education',i:1},{label:'Experiences',i:3},{label:'Interests',i:5},{label:'Contact',i:6}]
  const current=active===2?1:active===4?3:active
  return <div ref={root} className={`resume-site chapter-${active}`}>
    <div className="scene-bg" aria-hidden="true"><SceneBoundary><Canvas shadows dpr={[1,1.5]} camera={{position:[0,.35,11],fov:35}} gl={{antialias:true,alpha:true}}><Suspense fallback={null}><Scene reducedMotion={!!reduced}/></Suspense></Canvas></SceneBoundary></div>
    <div className="reading-wash"/>
    <header className="site-header"><a className="wordmark" href="#about" onClick={e=>{e.preventDefault();go(0)}}>Jin Fengzhou<span>.</span></a>
      <button className="menu-toggle" aria-expanded={menu} aria-controls="main-nav" onClick={()=>setMenu(!menu)}>{menu?'Close':'Menu'}</button>
      <nav id="main-nav" className={menu?'is-open':''} aria-label="Main navigation">{nav.map(n=><a key={n.i} href={`#${chapters[n.i].id}`} aria-current={current===n.i?'location':undefined} className={current===n.i?'active':''} onClick={e=>{e.preventDefault();go(n.i)}}>{n.label}</a>)}</nav>
      <a className="header-contact" href="mailto:kevinjfz@outlook.com">Get in touch</a>
    </header>
    <main>
      <section className="chapter intro" id="about">
        <div className="chapter-copy"><p className="eyebrow">Personal introduction</p><h1>Jin<br/><em>Fengzhou.</em></h1><p className="hero-role">Engineering student<br/>at Cambridge University.</p>
          <p className="intro-detail">Engineering, quantitative research<br/>and learning through building.</p>
          <div className="actions"><button className="primary" onClick={()=>go(3)}>Explore my experiences</button><button className="text-button" onClick={()=>go(1)}>My education</button></div>
        </div>
        {!reduced&&<div className="character-controls"><span>{portraitStatus==='ready'?'Move your cursor':'Jin Fengzhou'}</span><div><button disabled={portraitStatus!=='ready'} onClick={()=>window.dispatchEvent(new Event('portrait-demo'))}>{portraitStatus==='loading'?'Loading portrait…':portraitStatus==='static'?'Portrait':'Preview turn'}</button></div></div>}
      </section>
      <section className="chapter education" id="education"><div className="chapter-copy"><p className="eyebrow">Education / High school</p><h2>Shanghai Guanghua<br/>Cambridge<br/><em>International School.</em></h2><p className="school-short">GHCIS</p><p className="location">Shanghai, China</p><div className="education-tabs"><button className="selected" onClick={()=>go(1)}>High school</button><button onClick={()=>go(2)}>University</button></div></div></section>
      <section className="chapter education university" id="cambridge"><div className="chapter-copy"><p className="eyebrow">Education / University</p><h2>University<br/>of <em>Cambridge.</em></h2><p className="subject">Engineering</p><p className="location">Cambridge, United Kingdom</p><p className="education-note">Mathematical methods · Mechanics & vibrations<br/>Digital circuits & information processing</p><div className="education-tabs"><button onClick={()=>go(1)}>High school</button><button className="selected" onClick={()=>go(2)}>University</button></div></div></section>
      <section className="chapter experiences" id="quantitative"><div className="chapter-copy"><p className="eyebrow">Experiences</p><h2><em>Quantitative.</em></h2><div className="category-tabs"><button className="selected" onClick={()=>go(3)}>Quantitative</button><button onClick={()=>go(4)}>Engineering</button></div><ExperienceList items={quantitative}/></div></section>
      <section className="chapter experiences engineering" id="engineering"><div className="chapter-copy"><p className="eyebrow">Experiences</p><h2><em>Engineering.</em></h2><div className="category-tabs"><button onClick={()=>go(3)}>Quantitative</button><button className="selected" onClick={()=>go(4)}>Engineering</button></div><ExperienceList items={engineering}/></div></section>
      <section className="chapter interests" id="interests"><div className="chapter-copy"><p className="eyebrow">Interests</p><h2>Outside<br/><em>engineering.</em></h2><p className="interest-intro">A few things I enjoy away from my studies.</p><div className="interest-options" aria-label="Personal interests">{[{id:'karting' as const,name:'Karting',sub:'On the track'},{id:'football' as const,name:'Football',sub:'On the pitch'},{id:'guandan' as const,name:'Guan Dan',sub:'Around the table'}].map(item=><button key={item.id} className={interest===item.id?'selected':''} aria-pressed={interest===item.id} onClick={()=>setInterest(item.id)}><span>{item.name}</span><small>{item.sub}</small></button>)}</div></div></section>
      <section className="chapter contact" id="contact"><div className="chapter-copy"><p className="eyebrow">Contact</p><h2>Get in <em>touch.</em></h2><p className="contact-intro">For opportunities, ideas<br/>and interesting conversations.</p><div className="contact-details"><a href="mailto:kevinjfz@outlook.com"><span>Email</span>kevinjfz@outlook.com</a><a href="tel:+447962972630"><span>Phone</span>+44 7962 972630</a></div><button className="text-button" onClick={()=>window.print()}>Print profile</button><a className="source-credit" href="https://github.com/dayinji/sen-3d-resume" target="_blank" rel="noreferrer">Built on Sen's open-source résumé framework</a></div></section>
    </main>
    <aside className="chapter-rail" aria-label="Chapter navigation">{chapters.map((c,i)=><button key={c.id} className={active===i?'active':''} aria-label={`Go to ${c.label}`} aria-current={active===i?'step':undefined} onClick={()=>go(i)}><span/>{c.label}</button>)}</aside>
    <footer className="bottom-bar"><span>Jin Fengzhou · Engineering</span><span>{chapters[active].scene}</span><span>{String(active+1).padStart(2,'0')} / {String(chapters.length).padStart(2,'0')}</span></footer><div className="reading-progress"/>
  </div>
}

