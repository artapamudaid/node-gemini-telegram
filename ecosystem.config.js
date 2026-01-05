module.exports = {
  apps: [
    {
      name: "api",
      script: "dist/server.js",
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "ai-worker",
      script: "dist/worker/ai.worker.js",
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "send-worker",
      script: "dist/worker/send.worker.js",
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
