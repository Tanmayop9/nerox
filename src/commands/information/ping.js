/** 
 * @nerox v1.0.0
 * @author Tanmay
 * @copyright 2024 NeroX - Services
 */

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
    const msg = await ctx.reply({ 
      embeds: [
        client.embed('#FF69B4')
          .desc(`✨ Hold on! Checking my heartbeat... 💓`)
      ]
    });

    const start = performance.now();
    await client.db.blacklist.set("test", true);
    await client.db.blacklist.get("test");
    await client.db.blacklist.delete("test");
    const dbLatency = (performance.now() - start).toFixed(2);

    const wsLatency = client.ws.ping.toFixed(2);
    const msgLatency = msg.createdTimestamp - ctx.createdTimestamp;

    // Determine health status based on latency
    const getStatus = (latency) => {
      if (latency < 100) return { emoji: '💚', text: 'Excellent!' };
      if (latency < 200) return { emoji: '💛', text: 'Good!' };
      if (latency < 400) return { emoji: '🧡', text: 'Moderate' };
      return { emoji: '❤️', text: 'Working hard!' };
    };

    const wsStatus = getStatus(parseFloat(wsLatency));
    const dbStatus = getStatus(parseFloat(dbLatency));
    const msgStatus = getStatus(msgLatency);

    // 🎨 Canvas Styling - Cute Edition
    const canvas = Canvas.createCanvas(600, 320);
    const ctxCanvas = canvas.getContext("2d");

    // Background Gradient - Pink theme
    const gradient = ctxCanvas.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#FF69B4");
    gradient.addColorStop(0.5, "#FFB6C1");
    gradient.addColorStop(1, "#FF69B4");
    ctxCanvas.fillStyle = gradient;
    ctxCanvas.fillRect(0, 0, canvas.width, canvas.height);

    // Add decorative circles
    ctxCanvas.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctxCanvas.beginPath();
    ctxCanvas.arc(50, 50, 80, 0, Math.PI * 2);
    ctxCanvas.fill();
    ctxCanvas.beginPath();
    ctxCanvas.arc(550, 280, 100, 0, Math.PI * 2);
    ctxCanvas.fill();

    // Title
    ctxCanvas.fillStyle = "#ffffff";
    ctxCanvas.font = "bold 32px Arial";
    ctxCanvas.fillText("💓 Heartbeat Status", 150, 50);

    // Stats with cute styling
    ctxCanvas.font = "bold 24px Arial";
    ctxCanvas.fillStyle = "#ffffff";
    
    ctxCanvas.fillText(`${wsStatus.emoji} Socket Latency`, 30, 110);
    ctxCanvas.font = "20px Arial";
    ctxCanvas.fillText(`${wsLatency}ms - ${wsStatus.text}`, 60, 140);
    
    ctxCanvas.font = "bold 24px Arial";
    ctxCanvas.fillText(`${dbStatus.emoji} Database Ping`, 30, 185);
    ctxCanvas.font = "20px Arial";
    ctxCanvas.fillText(`${dbLatency}ms - ${dbStatus.text}`, 60, 215);
    
    ctxCanvas.font = "bold 24px Arial";
    ctxCanvas.fillText(`${msgStatus.emoji} Message Delay`, 30, 260);
    ctxCanvas.font = "20px Arial";
    ctxCanvas.fillText(`${msgLatency}ms - ${msgStatus.text}`, 60, 290);

    // Footer
    ctxCanvas.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctxCanvas.font = "16px Arial";
    ctxCanvas.fillText("✨ NeroX is feeling great today!", 180, 310);

    // Attachment
    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "heartbeat.png" });

    // Create cute paragraph embed
    const embed = client.embed('#FF69B4')
      .setAuthor({
        name: `💓 ${client.user.username}'s Heartbeat`,
        iconURL: client.user.displayAvatarURL()
      })
      .desc(
        `I checked my pulse and here's how I'm doing! 💕\n\n` +
        `My **WebSocket** is beating at **${wsLatency}ms** ${wsStatus.emoji} - ` +
        `that's how fast I can talk to Discord! ` +
        `My **database** responded in **${dbLatency}ms** ${dbStatus.emoji} - ` +
        `keeping all your data safe and quick! And this **message** took **${msgLatency}ms** ${msgStatus.emoji} ` +
        `to reach you! 💌\n\n` +
        `${parseFloat(wsLatency) < 100 ? 'I\'m feeling super speedy today! 🚀' : 
          parseFloat(wsLatency) < 200 ? 'Running smooth and steady! ✨' : 
          'Working a bit hard, but still here for you! 💪'}`
      )
      .setImage('attachment://heartbeat.png')
      .footer({ 
        text: '💖 Stay healthy, stay happy!',
        iconURL: ctx.author.displayAvatarURL()
      })
      .setTimestamp();

    await msg.edit({ content: null, embeds: [embed], files: [attachment] });
  };
}
