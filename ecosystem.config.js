module.exports = {
  apps: [
    {
      name: "satyasang-api-local",
      script: "src/server.js",
      env: {
        NODE_ENV: "local",
        DOTENV_CONFIG_PATH: ".env.local",
      },
    },
    {
      name: "satyasang-api-prod",
      script: "src/server.js",
      env: {
        NODE_ENV: "production",
        DOTENV_CONFIG_PATH: ".env.production",
      },
    },
  ],
};
