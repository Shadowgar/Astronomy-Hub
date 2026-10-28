// Existing Three.js package ships JavaScript. Keep its untyped implementation
// behind the typed SolarScene API; no new type-package dependency is required.
declare module 'three'
declare module 'three/addons/controls/OrbitControls.js'
declare module 'three/addons/loaders/GLTFLoader.js'
declare module 'three/addons/postprocessing/EffectComposer.js'
declare module 'three/addons/postprocessing/RenderPass.js'
declare module 'three/addons/postprocessing/UnrealBloomPass.js'
declare module 'three/addons/postprocessing/OutputPass.js'
declare module 'three/addons/postprocessing/ShaderPass.js'
declare module 'three/addons/shaders/FXAAShader.js'
