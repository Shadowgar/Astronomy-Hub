export class AttributionManager {
  constructor(container){this.container=container;this.entries=new Map();}
  set(id,text,url){this.entries.set(id,{text,url});this.render();}
  remove(id){this.entries.delete(id);this.render();}
  render(){this.container.replaceChildren();for(const {text,url} of this.entries.values()){const element=document.createElement(url?'a':'span');element.textContent=text;if(url){element.href=url;element.target='_blank';element.rel='noreferrer'}this.container.append(element,document.createTextNode(' · '));}}
  destroy(){this.entries.clear();this.container.replaceChildren();}
}
