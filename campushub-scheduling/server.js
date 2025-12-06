const express = require("express");
const loadConfig = require("./config");
const { Eureka } = require("eureka-js-client");
const os = require("os");

loadConfig().then(config => {

  const app = express();
  app.use(express.json());

  const PORT = parseInt(config["server.port"]) || 808;
  const SERVICE_NAME = config["spring.application.name"] || "campushub-scheduling";

  // Health endpoint
  app.get("/health", (req, res) => {
    res.json({
      service: SERVICE_NAME,
      status: "UP",
      configLoaded: true
    });
  });

  // Lancer le service
  app.listen(PORT, () => {
    console.log(`✔ ${SERVICE_NAME} est lancé sur le port ${PORT}`);
  });

  // ==============================
  // Enregistrement dans Eureka
  // ==============================
  const hostName = os.hostname();

  const eurekaClient = new Eureka({
    instance: {
      app: SERVICE_NAME,
      instanceId: `${SERVICE_NAME}-${hostName}-${PORT}`,
      hostName: hostName,
      ipAddr: SERVICE_NAME, // Nom du service dans Docker Compose
      vipAddress: SERVICE_NAME,
      statusPageUrl: `http://${SERVICE_NAME}:${PORT}/health`, // Docker inter-container
      port: {
        "$": PORT,
        "@enabled": true
      },
      dataCenterInfo: {
        "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
        name: "MyOwn"
      }
    },
    eureka: {
      host: "campushub-registry", // nom du service Eureka dans Docker Compose
      port: 8761,
      servicePath: "/eureka/apps/"
    }
  });

  eurekaClient.start((err) => {
    if (err) {
      console.error("❌ Erreur enregistrement Eureka :", err);
    } else {
      console.log(`✔ ${SERVICE_NAME} enregistré dans Eureka 👌`);
    }
  });

});
