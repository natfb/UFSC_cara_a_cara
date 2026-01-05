const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig(
{
  transpileDependencies: true,

  // para rodar no ngrok
  devServer: {
    host: '0.0.0.0',
    port: 8080,      
    allowedHosts: 'all',
  },

}
)
