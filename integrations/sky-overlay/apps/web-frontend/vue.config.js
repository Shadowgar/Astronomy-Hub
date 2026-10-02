const path = require('path')

const skydataSourceDir = path.resolve(__dirname, '../test-skydata')
const orasRuntimePublicPath = process.env.ORAS_RUNTIME_PUBLIC_PATH || process.env.CDN_ENV || '/'
const orasRuntimeRemoteDataBase = process.env.ORAS_RUNTIME_REMOTE_DATA_BASE
const shouldCopySkydata = process.env.ORAS_RUNTIME_COPY_SKYDATA === '1'

module.exports = {
  runtimeCompiler: true,
  publicPath: orasRuntimePublicPath,
  productionSourceMap: false,
  devServer: {
    before: app => {
      app.use('/skydata', require('express').static(skydataSourceDir))
    },
    proxy: orasRuntimeRemoteDataBase ? {
      '^/remote-data': {
        target: orasRuntimeRemoteDataBase,
        changeOrigin: true,
        pathRewrite: { '^/remote-data': '' }
      }
    } : undefined
  },

  chainWebpack: config => {
    // workaround taken from webpack/webpack#6642
    config.output
      .globalObject('this')
    // Keep local ORAS builds reproducible on WSL/Docker without webpack OOMs.
    config.optimization.minimize(false)
    // Tell that our main wasm file needs to be loaded by file loader
    config.module
      .rule('mainwasm')
      .test(/stellarium-web-engine\.wasm$/)
      .type('javascript/auto')
      .use('file-loader')
        .loader('file-loader')
        .options({name: '[name].[hash:8].[ext]', outputPath: 'js'})
        .end()
    config.plugin('copy')
      .tap(([pathConfigs]) => {
         const to = pathConfigs[0].to
         pathConfigs[0].force = true // so the original `/public` folder keeps priority
         if (shouldCopySkydata) {
           pathConfigs.unshift({
             from: skydataSourceDir,
             to: to + '/skydata',
           })
         }
         return [pathConfigs]
       })
  },

  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: true
    }
  }
}
