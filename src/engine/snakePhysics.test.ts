import { describe, it, expect, beforeEach } from 'vitest';
import { SnakePhysics, normalizeAngle, angleDiff, isOppositeAngle, snapToNearestCardinal } from './snakePhysics';

describe('Angle Utility Functions', () => {
  it('normalizes angles within [-PI, PI]', () => {
    expect(normalizeAngle(0)).toBeCloseTo(0);
    expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI);
    expect(normalizeAngle(-Math.PI)).toBeCloseTo(-Math.PI);
    expect(normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(normalizeAngle(-Math.PI * 3)).toBeCloseTo(-Math.PI);
  });

  it('calculates correct angle difference', () => {
    expect(angleDiff(Math.PI / 2, 0)).toBeCloseTo(Math.PI / 2);
    expect(angleDiff(0, Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
    expect(angleDiff(Math.PI, -Math.PI)).toBeCloseTo(0);
  });

  it('detects opposite angles (180-degree reversals)', () => {
    expect(isOppositeAngle(0, Math.PI)).toBe(true);
    expect(isOppositeAngle(Math.PI, 0)).toBe(true);
    expect(isOppositeAngle(Math.PI / 2, -Math.PI / 2)).toBe(true);
    expect(isOppositeAngle(-Math.PI / 2, Math.PI / 2)).toBe(true);

    // 90-degree turns are NOT opposite
    expect(isOppositeAngle(0, Math.PI / 2)).toBe(false);
    expect(isOppositeAngle(0, -Math.PI / 2)).toBe(false);
    expect(isOppositeAngle(Math.PI / 2, Math.PI)).toBe(false);
  });
});

describe('SnakePhysics - Direction Controls', () => {
  let snake: SnakePhysics;

  beforeEach(() => {
    snake = new SnakePhysics(400, 300, 18);
  });

  it('initializes heading East with 18 segments', () => {
    expect(snake.angle).toBe(0);
    expect(snake.targetAngle).toBe(0);
    expect(snake.segments.length).toBe(18);
  });

  describe('180-Degree Reversal Guard in Cardinal Mode', () => {
    it('blocks instant 180-degree reversal from East to West', () => {
      const accepted = snake.inputCardinalDirection(Math.PI);
      expect(accepted).toBe(false);
      expect(snake.targetAngle).toBe(0);
    });

    it('allows 90-degree turns (East to South or North)', () => {
      const southAccepted = snake.inputCardinalDirection(Math.PI / 2);
      expect(southAccepted).toBe(true);
      expect(snake.targetAngle).toBeCloseTo(Math.PI / 2);
    });

    it('blocks reversal after turning South (South to North)', () => {
      snake.inputCardinalDirection(Math.PI / 2);
      // Simulate completing the turn South
      snake.angle = Math.PI / 2;
      const northAccepted = snake.inputCardinalDirection(-Math.PI / 2);
      expect(northAccepted).toBe(false);
      expect(snake.targetAngle).toBeCloseTo(Math.PI / 2);
    });

    it('blocks reversal from West to East', () => {
      snake.angle = Math.PI;
      snake.targetAngle = Math.PI;
      const eastAccepted = snake.inputCardinalDirection(0);
      expect(eastAccepted).toBe(false);
      expect(snake.targetAngle).toBeCloseTo(Math.PI);
    });

    it('blocks reversal from North to South', () => {
      snake.angle = -Math.PI / 2;
      snake.targetAngle = -Math.PI / 2;
      const southAccepted = snake.inputCardinalDirection(Math.PI / 2);
      expect(southAccepted).toBe(false);
      expect(snake.targetAngle).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('Turn Queueing (Input Buffering)', () => {
    it('buffers rapid successive 90-degree turns (e.g. East -> South -> West)', () => {
      // 1. Heading East, tap South
      const turn1 = snake.inputCardinalDirection(Math.PI / 2);
      expect(turn1).toBe(true);
      expect(snake.targetAngle).toBeCloseTo(Math.PI / 2);

      // 2. Immediately tap West while snake is still rotating (angle is still ~0)
      const turn2 = snake.inputCardinalDirection(Math.PI);
      expect(turn2).toBe(true);
      expect(snake.turnQueue.length).toBe(1);
      expect(snake.turnQueue[0]).toBeCloseTo(Math.PI);

      // 3. Update physics until snake completes South turn
      for (let i = 0; i < 15; i++) {
        snake.update(1 / 60, 800, 600, 'zen');
      }

      // Snake should have consumed the queued West turn
      expect(snake.turnQueue.length).toBe(0);
      expect(snake.targetAngle).toBeCloseTo(Math.PI);
    });

    it('guards against reversal inside the turn queue', () => {
      // Heading East, tap South, then attempt to tap North
      snake.inputCardinalDirection(Math.PI / 2);
      const invalidReversal = snake.inputCardinalDirection(-Math.PI / 2);
      expect(invalidReversal).toBe(false);
      expect(snake.turnQueue.length).toBe(0);
    });

    it('ignores duplicate direction inputs in queue', () => {
      snake.inputCardinalDirection(Math.PI / 2);
      const dup1 = snake.inputCardinalDirection(Math.PI / 2);
      expect(dup1).toBe(false);
    });
  });

  describe('Snap to Nearest Cardinal', () => {
    it('snaps arbitrary angles to the closest cardinal angle', () => {
      expect(snapToNearestCardinal(0.1)).toBe(0);
      expect(snapToNearestCardinal(-0.5)).toBe(0);
      expect(snapToNearestCardinal(Math.PI / 2 + 0.2)).toBe(Math.PI / 2);
      expect(snapToNearestCardinal(Math.PI / 2 - 0.2)).toBe(Math.PI / 2);
      expect(snapToNearestCardinal(-Math.PI / 2 + 0.1)).toBe(-Math.PI / 2);
      expect(snapToNearestCardinal(-Math.PI / 2 - 0.1)).toBe(-Math.PI / 2);
      expect(snapToNearestCardinal(2.9)).toBe(Math.PI);
      expect(snapToNearestCardinal(-2.9)).toBe(Math.PI);
    });

    it('snaps arbitrary inputs in setDirection when in cardinal mode', () => {
      // 0.2 rad -> snaps to 0 (East). Since snake is already East, duplicate is rejected
      expect(snake.targetAngle).toBe(0);
      // 1.3 rad -> snaps to Math.PI / 2 (South)
      snake.setDirection(1.3);
      expect(snake.targetAngle).toBeCloseTo(Math.PI / 2);
    });

    it('blocks steerByDelta when in cardinal mode to avoid unwanted spinning', () => {
      expect(snake.controlMode).toBe('cardinal');
      const initialTarget = snake.targetAngle;
      snake.steerByDelta(0.5);
      expect(snake.targetAngle).toBe(initialTarget);
      snake.steerByDelta(-0.5);
      expect(snake.targetAngle).toBe(initialTarget);
    });
  });

  describe('Analog Mode and Delta Steering', () => {
    beforeEach(() => {
      snake.setControlMode('analog');
    });

    it('allows delta steering without cardinal snapping', () => {
      snake.steerByDelta(0.1);
      expect(snake.targetAngle).toBeCloseTo(0.1);
      snake.steerByDelta(-0.2);
      expect(snake.targetAngle).toBeCloseTo(-0.1);
    });

    it('allows smooth 360-degree analog direction steering', () => {
      snake.setAnalogDirection(1.23);
      expect(snake.targetAngle).toBeCloseTo(1.23);
    });
  });
});
