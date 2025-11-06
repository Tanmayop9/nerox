import { createCanvas, loadImage, registerFont } from 'canvas';
import { AttachmentBuilder } from 'discord.js';

/**
 * Polyfill for roundRect if not available
 */
function addRoundRectSupport(ctx) {
    if (!ctx.roundRect) {
        ctx.roundRect = function(x, y, width, height, radius) {
            if (width < 2 * radius) radius = width / 2;
            if (height < 2 * radius) radius = height / 2;
            this.beginPath();
            this.moveTo(x + radius, y);
            this.arcTo(x + width, y, x + width, y + height, radius);
            this.arcTo(x + width, y + height, x, y + height, radius);
            this.arcTo(x, y + height, x, y, radius);
            this.arcTo(x, y, x + width, y, radius);
            this.closePath();
            return this;
        };
    }
}

/**
 * Generates a beautiful Spotify-style card for now playing tracks
 * @param {Object} track - The track object from the player
 * @param {Object} requester - The user who requested the track
 * @param {Object} client - Discord client with emoji configuration
 * @returns {Promise<AttachmentBuilder>} - Discord attachment with the card image
 */
export async function generateSpotifyCard(track, requester, client = null) {
    const canvas = createCanvas(800, 350);
    const ctx = canvas.getContext('2d');

    // Add roundRect support if needed
    addRoundRectSupport(ctx);

    // Background gradient (Spotify green to dark)
    const gradient = ctx.createLinearGradient(0, 0, 800, 350);
    gradient.addColorStop(0, '#1DB954');
    gradient.addColorStop(0.5, '#1ed760');
    gradient.addColorStop(1, '#191414');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 350);

    // Dark overlay for better text readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 800, 350);

    // Load and draw thumbnail
    try {
        const thumbnailUrl = track.thumbnail || track.artworkUrl || 'https://via.placeholder.com/250';
        const thumbnail = await loadImage(thumbnailUrl);
        
        // Draw rounded thumbnail
        const thumbSize = 250;
        const thumbX = 30;
        const thumbY = 50;
        
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 15);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(thumbnail, thumbX, thumbY, thumbSize, thumbSize);
        ctx.restore();

        // Add shadow to thumbnail
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(thumbX, thumbY, thumbSize, thumbSize, 15);
        ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    } catch (error) {
        console.error('Error loading thumbnail:', error);
        // Draw placeholder with modern design
        ctx.fillStyle = '#282828';
        ctx.fillRect(30, 50, 250, 250);
        
        // Draw music icon placeholder
        ctx.fillStyle = '#1DB954';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MUSIC', 155, 185);
    }

    // Reset text alignment
    ctx.textAlign = 'left';
    ctx.shadowColor = 'transparent';

    // Now Playing text
    ctx.fillStyle = '#1DB954';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('NOW PLAYING', 310, 80);

    // Track title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial';
    const titleText = track.title?.length > 30 
        ? track.title.substring(0, 30) + '...' 
        : track.title || 'Unknown Track';
    ctx.fillText(titleText, 310, 130);

    // Author/Artist
    ctx.fillStyle = '#b3b3b3';
    ctx.font = '24px Arial';
    const authorText = track.author?.length > 35 
        ? track.author.substring(0, 35) + '...' 
        : track.author || 'Unknown Artist';
    ctx.fillText(authorText, 310, 170);

    // Duration bar background
    const barX = 310;
    const barY = 200;
    const barWidth = 450;
    const barHeight = 6;
    
    ctx.fillStyle = '#404040';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 3);
    ctx.fill();

    // Duration bar foreground (showing as starting)
    ctx.fillStyle = '#1DB954';
    ctx.beginPath();
    ctx.roundRect(barX, barY, 30, barHeight, 3);
    ctx.fill();

    // Duration text
    ctx.fillStyle = '#b3b3b3';
    ctx.font = '18px Arial';
    const duration = track.isStream 
        ? 'LIVE STREAM' 
        : formatDuration(track.length || 0);
    ctx.fillText('0:00', barX, barY + 30);
    ctx.textAlign = 'right';
    ctx.fillText(duration, barX + barWidth, barY + 30);

    // Requested by section
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText('Requested by:', 310, 260);
    
    ctx.fillStyle = '#1DB954';
    ctx.font = 'bold 22px Arial';
    const requesterName = requester?.displayName?.length > 25 
        ? requester.displayName.substring(0, 25) + '...' 
        : requester?.displayName || 'Unknown User';
    ctx.fillText(requesterName, 310, 290);

    // Spotify-style play icon
    const iconX = 710;
    const iconY = 260;
    ctx.fillStyle = '#1DB954';
    ctx.beginPath();
    ctx.arc(iconX, iconY, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Play triangle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(iconX - 8, iconY - 12);
    ctx.lineTo(iconX - 8, iconY + 12);
    ctx.lineTo(iconX + 10, iconY);
    ctx.closePath();
    ctx.fill();

    // Create attachment
    const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), {
        name: 'now-playing.png'
    });

    return attachment;
}

/**
 * Format duration from milliseconds to MM:SS or HH:MM:SS
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
