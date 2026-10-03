import React,{type ReactNode} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {MemoryRouter} from 'react-router-dom';import {describe,it,expect,vi} from 'vitest';
vi.mock('react-router-dom',async original=>({...await original<typeof import('react-router-dom')>(),BrowserRouter:({children}:{children:ReactNode})=>children}));
vi.mock('../src/features/tonight/queries',()=>({useTonightQuery:()=>({isPending:true,isError:false})}));
vi.mock('../src/features/observe/queries',()=>({useObserveSkyQuery:()=>({isPending:true,isError:false})}));
import AppRouter from '../src/routes/AppRouter';
const render=(path:string)=>renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><AppRouter/></MemoryRouter>);
describe('locked workspace route composition',()=>{
 for(const [path,mode] of [['/','sky'],['/sky-engine','sky'],['/earth','earth']])it(`${path} opens ${mode} viewport and a single product header`,()=>{
  const html=render(path);expect(html).toContain(`data-workspace-mode="${mode}"`);expect(html).toContain('aria-label="Renderer mode"');expect(html.match(/<header/g)).toHaveLength(1);expect(html.match(/<main/g)).toHaveLength(1);expect(html).not.toContain('The sky over the');expect(html).not.toContain('>Home</a>');
 });
 it('Sky opens a truthful compact Tonight summary and omits unqualified layer toggles',()=>{const html=render('/');expect(html).toContain('Tonight at ORAS');expect(html).not.toContain('Stars layer');expect(html).toContain('Checking Sky');});
 it('Earth declares live provider semantics while it starts',()=>{expect(render('/earth')).toContain('Earth layers use live source time');});
});
