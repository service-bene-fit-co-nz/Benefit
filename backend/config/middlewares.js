// config/middlewares.js

module.exports = [
  'strapi::logger',
  'strapi::errors',
  { // <--- Replace 'strapi::security' with the object format to configure
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            // IMPORTANT: Add the hostname for your Strapi Cloud media here
            // This is the same domain in your NEXT_PUBLIC_STRAPI_API_URL
            'fearless-actor-e2190a04f9.strapiapp.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            // IMPORTANT: Add the hostname for your Strapi Cloud media here
            'fearless-actor-e2190a04f9.strapiapp.com',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  { // <--- This is the key change for CORS
    name: 'strapi::cors',
    config: {
      origin: [
        'http://localhost:3000', // For local Next.js development
        'https://benefit-jade.vercel.app', // Replace with your ACTUAL Vercel domain
        // The * in development allows all ports, but use specific origins in production
      ],
      // Standard CORS methods
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Accept'],
      keepHeader: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];