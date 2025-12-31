/**
 * Visual Regression Testing Module
 *
 * Provides screenshot comparison and visual diff detection
 * for generated React Native apps.
 */

export { VisualTester, type VisualTestConfig, type VisualTestResult } from './visual-tester';
export { compareImages, type ImageComparisonResult } from './image-comparator';
export { SnapshotManager, type Snapshot, type SnapshotDiff } from './snapshot-manager';
