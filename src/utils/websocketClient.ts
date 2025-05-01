import * as ed25519 from "@noble/ed25519";
import { nanoid } from "nanoid";
// Import webcrypto for noble-ed25519
import { sha512 } from '@noble/hashes/sha512';

// Set a proper crypto implementation for noble-ed25519
// Enable synchronous SHA-512 hashing for noble-ed25519
ed25519.etc.sha512Sync = (...messages) => sha512(ed25519.etc.concatBytes(...messages));

/**
 * Creates an authenticated WebSocket client
 * @param {string} url WebSocket server URL
 * @param {string} privateKeyHex Ed25519 private key as hex string
 * @returns {Promise<object>} Client object with methods for sending/receiving messages
 */
export async function createAuthenticatedClient(
	url: string,
	privateKeyHex: string
) {
	// Parse private key
	const privateKeyBytes = hexToBytes(privateKeyHex);

	// Log for debugging
	console.log({ privateKeyBytes });

	// Derive public key from private key
	const publicKeyBytes = await ed25519.getPublicKey(privateKeyBytes);

	// Log for debugging
	console.log({ publicKeyBytes });

	const publicKeyHex = bytesToHex(publicKeyBytes);

	// Log for debugging
	console.log({ publicKeyHex });

	console.log(`Using public key: ${publicKeyHex}`);

	// Create WebSocket connection
	const socket = new WebSocket(url);

	// Create a promise for the authenticated connection
	const connectionPromise = new Promise<
		ReturnType<
			(socket: WebSocket) => {
				send: (message: object) => void;
				onMessage: (callback: (message: any) => void) => void;
				close: () => void;
			}
		>
	>((resolve, reject) => {
		// Message callback
		let messageCallback: ((message: any) => void) | null = null;

		// Set up handlers
		socket.onopen = async () => {
			console.log("WebSocket connection established, authenticating...");

			try {
				// Send authentication message
				await authenticate(socket, privateKeyBytes, publicKeyHex);
			} catch (error) {
				reject(error);
			}
		};

		socket.onclose = (event) => {
			console.log(
				`WebSocket connection closed: ${event.code} ${event.reason}`
			);
			reject(
				new Error(`Connection closed: ${event.code} ${event.reason}`)
			);
		};

		socket.onerror = (error) => {
			console.error("WebSocket error:", error);
			reject(error);
		};

		// Handle messages
		socket.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);
				console.log("Received:", message);

				// Check for authentication success
				if (message.type === "auth_success") {
					console.log("Authentication successful!");
					resolve(createClientInterface(socket));
				}

				// Check for errors
				if (message.type === "error") {
					console.error(
						`Error: ${message.code} - ${message.message}`
					);

					if (message.code === "auth_failed") {
						reject(
							new Error(
								`Authentication failed: ${message.message}`
							)
						);
					}
				}

				// If we received a message that requires authentication first
				if (
					message.type === "connection_established" &&
					message.auth_required
				) {
					console.log("Server requires authentication...");
					// Authentication will be done after the connection is established
				}

				// Pass the message to the callback if registered
				if (messageCallback) {
					messageCallback(message);
				}
			} catch (error) {
				console.error("Error parsing message:", error);
			}
		};

		/**
		 * Creates a client interface for the authenticated connection
		 * @param {WebSocket} socket
		 * @returns {object} Client interface
		 */
		function createClientInterface(socket: WebSocket) {
			return {
				/**
				 * Send a message to the server
				 * @param {object} message Message to send
				 */
				send: (message: object) => {
					if (socket.readyState === WebSocket.OPEN) {
						socket.send(JSON.stringify(message));
					} else {
						throw new Error("WebSocket is not connected");
					}
				},

				/**
				 * Register a callback for received messages
				 * @param {function} callback Function to call with received messages
				 */
				onMessage: (callback: (message: any) => void) => {
					messageCallback = callback;
				},

				/**
				 * Close the WebSocket connection
				 */
				close: () => {
					socket.close();
				},
			};
		}
	});

	// Wait for authentication to complete
	return connectionPromise;
}

/**
 * Authenticate the WebSocket connection
 * @param {WebSocket} socket WebSocket connection
 * @param {Uint8Array} privateKeyBytes Ed25519 private key
 * @param {string} publicKeyHex Public key as hex string
 */
async function authenticate(
	socket: WebSocket,
	privateKeyBytes: Uint8Array,
	publicKeyHex: string
) {
	// Create authentication message
	const timestamp = Math.floor(Date.now() / 1000);
	const nonce = nanoid();

	// Message to sign: timestamp:nonce
	const messageToSign = `${timestamp}:${nonce}`;

	try {
		// Sign the message
		const signature = await ed25519.sign(
			new TextEncoder().encode(messageToSign),
			privateKeyBytes
		);

		// Convert signature to hex
		const signatureHex = bytesToHex(signature);

		// Create authentication message
		const authMessage = {
			type: "Auth",
			data: {
				public_key: publicKeyHex,
				timestamp,
				nonce,
				signature: signatureHex,
			},
		};

		// Send authentication message
		socket.send(JSON.stringify(authMessage));
		console.log("Authentication message sent");
	} catch (error) {
		console.error("Error signing message:", error);
		throw new Error(`Authentication failed: ${(error as Error).message}`);
	}
}

/**
 * Utility function to convert hex string to Uint8Array
 * @param {string} hex Hex string
 * @returns {Uint8Array} Byte array
 */
function hexToBytes(hex: string) {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
	}
	return bytes;
}

/**
 * Utility function to convert Uint8Array to hex string
 * @param {Uint8Array} bytes Byte array
 * @returns {string} Hex string
 */
function bytesToHex(bytes: Uint8Array) {
	return Array.from(bytes)
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Generate a new random ed25519 key pair
 * @returns {Promise<{privateKey: string, publicKey: string}>} Generated key pair as hex strings
 */
export async function generateKeyPair() {
	try {
		const privateKeyBytes = ed25519.utils.randomPrivateKey();
		const publicKeyBytes = await ed25519.getPublicKey(privateKeyBytes);

		return {
			privateKey: bytesToHex(privateKeyBytes),
			publicKey: bytesToHex(publicKeyBytes),
		};
	} catch (error) {
		console.error("Error generating key pair:", error);
		throw new Error(
			`Failed to generate key pair: ${(error as Error).message}`
		);
	}
}
