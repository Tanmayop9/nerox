/**
 * @nerox v1.0.0
 * @author Tanmay
 * @copyright 2024 Nerox - Services
 */

import { loadAntiCrash } from './utils/anticrash.js';
import { ExtendedClient } from './classes/client.js';

console.clear();

// Load anti-crash handler
loadAntiCrash();

// Initialize and connect the client
const client = new ExtendedClient();
export default client.connectToGateway();