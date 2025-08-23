#!/usr/bin/env node

import webpush from 'web-push';

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys Generated Successfully!');
console.log('');
console.log('Add these to your .env.local file:');
console.log('');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('');
console.log('Or set them as environment variables:');
console.log('');
console.log(`export NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`export VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log('');
console.log('Note: Keep your private key secret and never expose it to the client!'); 