// Re-export from sports-api (uses real API or mock based on config)
export * from './sports-api';
// Keep individual service exports for direct access
export { MOCK_PLAYERS } from './players';
export { MOCK_NEWS } from './news';
export { MOCK_STANDINGS } from './standings';
export * from './shop';
