import{it,expect}from'vitest'
import{displayScale}from'../src/features/solar/solarPresentation'
it('keeps true-scale geometry and already resolved close-ups at native size',()=>{
 expect(displayScale('physical',.01,60,500)).toBe(1)
 expect(displayScale('cinematic',80,60,500)).toBe(1)
})
it('enlarges unresolved bodies to a bounded readable display radius',()=>{
 expect(displayScale('cinematic',.01,40,500)).toBe(4000)
 expect(displayScale('cinematic',.01,40,30)).toBe(1320)
})
it('never shrinks a physical disk or creates nonfinite enlargement at a projection singularity',()=>{
 expect(displayScale('cinematic',20,40,2)).toBe(1)
 expect(displayScale('cinematic',0,40,500)).toBe(1)
 expect(displayScale('cinematic',Infinity,40,500)).toBe(1)
})
it('allocates larger Sun and smaller Mercury without moving their source anchors or overlapping',async()=>{
 const{diskBudget}=await import('../src/features/solar/solarPresentation')
 const sun=diskBudget(100,[{distance:90,desired:30}],500),mercury=diskBudget(30,[{distance:90,desired:100}],500)
 expect(sun).toBeGreaterThan(mercury*3);expect(sun+mercury).toBeLessThan(90)
 expect(diskBudget(50,[],24)).toBe(24)
})
it('retains the whole clear rectangle for a system composition instead of discarding its width',async()=>{
 const{clearViewport}=await import('../src/features/solar/solarPresentation');const f=clearViewport(600,300,[])
 expect(f.clearWidth).toBeGreaterThan(f.maxGlobeRadius*3)
 expect(f.rectangleOffsetX).toBe(0);expect(f.rectangleOffsetY).toBe(0)
})
