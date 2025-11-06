/** @format * Neptune by Tanmay * Version: 2.0.1 (Beta) * © 2024 Neptune Headquarters */

import { Command } from "../../classes/abstract/command.js";
import Canvas from "canvas";
import { AttachmentBuilder } from "discord.js";

export default class Ping extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["latency", "pong"];
    this.description = "Displays real-time latency stats";
  }

  execute = async (client, ctx) => {
    const msg = await ctx.reply({ content: `${client.emoji.timer} Checking latency...` });

    const start = performance.now();
    await client.db.blacklist.set("test", true);
    await client.db.blacklist.get("test");
    await client.db.blacklist.delete("test");
    const dbLatency = (performance.now() - start).toFixed(2);

    const wsLatency = client.ws.ping.toFixed(2);
    const msgLatency = msg.createdTimestamp - ctx.createdTimestamp;

    // 🎨 Canvas Styling
    const canvas = Canvas.createCanvas(600, 300);
    const ctxCanvas = canvas.getContext("2d");

    // Background Gradient
    const gradient = ctxCanvas.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#1c1c1c");
    gradient.addColorStop(1, "#0a0a0a");
    ctxCanvas.fillStyle = gradient;
    ctxCanvas.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctxCanvas.fillStyle = "#ffffff";
    ctxCanvas.font = "bold 30px Arial";
    ctxCanvas.fillText("Latency Stats", 20, 50);

    // Stats Text
    ctxCanvas.font = "24px Arial";
    ctxCanvas.fillStyle = "#ffffff";
    ctxCanvas.fillText(`Socket: ${wsLatency} ms`, 20, 110);
    ctxCanvas.fillText(`Database: ${dbLatency} ms`, 20, 160);
    ctxCanvas.fillText(`Message: ${msgLatency} ms`, 20, 210);

    // Attachment
    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "latency.png" });

    await msg.edit({ content: "", files: [attachment] });
  };
}